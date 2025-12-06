import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

// VERIFIED STABLE MODELS (from API check)
// We prioritize specific versions over 'latest' aliases to avoid instability.
const VALID_MODELS = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite-preview-02-05",
    "gemini-flash-latest", // Kept as fallback if specific versions fail, but prioritized lower
    "gemini-pro-latest"
];

const DEFAULT_MODEL = "gemini-2.0-flash";

// Helper to validate model availability
const validateModel = async (apiKey, modelName) => {
    if (!modelName) return DEFAULT_MODEL;

    // If it's in our verified list, trust it (but still good to check if we want to be paranoid)
    // For now, we trust our hardcoded list to avoid extra API calls on every request,
    // BUT the user requested "Real-Time Validation".

    // However, checking metadata for every request adds latency. 
    // A better approach is to check if it's in the known supported list.

    // If it's a model we haven't seen, we should verify it.
    if (VALID_MODELS.includes(modelName)) return modelName;

    // If not in our list, try to fetch it to see if it exists
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: modelName });
        // There isn't a cheap "exists" check in SDK other than trying to use it or listing.
        // Listing is expensive.
        // Let's rely on the listModels cache or strict allowlist.

        // User said: "ONLY include models where all conditions are true"
        // So we should reject unknown models.
        console.warn(`[GEMINI] Model "${modelName}" not in verified list. Fallback to default.`);
        return DEFAULT_MODEL;
    } catch (e) {
        return DEFAULT_MODEL;
    }
};

import { OPTIMIZATION_PROMPT } from './prompts.js';

// Initialize Gemini with API key from environment variables or parameter
const optimizeCode = async (code, language, intensity, apiKey, modelName, options = {}) => {
    const key = apiKey?.trim();
    if (!key) {
        throw new Error("Gemini API Key is required. Please provide your own API key.");
    }

    let selectedModel = modelName;

    // Strict Model Validation
    if (!VALID_MODELS.includes(selectedModel)) {
        console.warn(`[GEMINI] Invalid or unsupported model: ${selectedModel}. Switching to ${DEFAULT_MODEL}.`);
        selectedModel = DEFAULT_MODEL;
    }

    console.log(`[GEMINI] Using API key: ${key.substring(0, 8)}...`);
    console.log(`[GEMINI] Selected Model: ${selectedModel}`);

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: selectedModel });

    console.log(`[AI] Optimizing ${language} code with intensity: ${intensity}`);

    // Build detailed optimization prompt
    let prompt = OPTIMIZATION_PROMPT;

    // Append Advanced Mode Context
    if (options.paradigm) prompt += `\n\nTARGET PARADIGM: ${options.paradigm}`;
    if (options.optimizationType) prompt += `\nOPTIMIZATION GOAL: ${options.optimizationType}`;
    if (options.useLLVM) prompt += `\nINCLUDE LLVM IR/ASSEMBLY: YES`;
    if (options.projectContext) prompt += `\nCONTEXT: ${options.projectContext}`;

    if (options.originalMetrics) {
        prompt += `\n\nCURRENT METRICS (BASELINE TO BEAT):
- Execution Time: ${options.originalMetrics.duration} ms
- Energy: ${options.originalMetrics.energy_joules} Joules
- RAM: ${options.originalMetrics.ram_peak} MB
- CPU Peak: ${options.originalMetrics.cpu_peak} %

YOU MUST PROVIDE CODE THAT IS FASTER AND MORE EFFICIENT THAN THIS.`;
    }

    if (options.systemInfo) {
        prompt += `\n\nTARGET SYSTEM INFO:\nOS: ${options.systemInfo.os}\nCPU: ${options.systemInfo.cpu_count} cores\nRAM: ${options.systemInfo.ram_total_gb} GB\nGPU: ${options.systemInfo.gpu_name || 'None'}`;
    }

    // Append the specific code context
    prompt += `\n\nCURRENT REQUEST:\nLanguage: ${language}\nIntensity: ${intensity}\n\nCODE TO OPTIMIZE:\n\`\`\`${language}\n${code}\n\`\`\``;

    const maxRetries = 3;
    let retryCount = 0;
    let baseDelay = 2000; // Start with 2 seconds

    while (retryCount <= maxRetries) {
        try {
            console.log(`[AI] Sending optimization request to Gemini... (Attempt ${retryCount + 1}/${maxRetries + 1})`);
            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text();

            console.log(`[AI] Received ${text.length} characters`);

            // Clean up any markdown formatting (Gemini sometimes wraps JSON in ```json ... ```)
            text = text.replace(/```json\n/g, "").replace(/```\n/g, "").replace(/```/g, "").trim();

            // Parse JSON response
            let resultObj;
            try {
                resultObj = JSON.parse(text);
            } catch (e) {
                console.error("[AI] Failed to parse JSON response:", text);
                // Fallback: try to extract JSON if mixed with text
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    try {
                        resultObj = JSON.parse(jsonMatch[0]);
                    } catch (e2) {
                        throw new Error("Invalid JSON response from AI");
                    }
                } else {
                    throw new Error("Invalid JSON response from AI");
                }
            }

            console.log("[AI] ✅ Optimization complete");
            return resultObj;
        } catch (error) {
            console.error(`[AI] ❌ Error (Attempt ${retryCount + 1}):`, error.message);
            console.error("[AI] Full Error Object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

            // Detect rate limit errors
            if (error.message?.includes('quota') ||
                error.message?.includes('rate limit') ||
                error.message?.includes('429') ||
                error.status === 429) {

                if (retryCount < maxRetries) {
                    const delay = baseDelay * Math.pow(2, retryCount);
                    console.log(`[AI] Rate limit hit. Retrying in ${delay / 1000}s...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    retryCount++;
                    continue;
                } else {
                    throw new Error('RATE_LIMIT_EXCEEDED');
                }
            }

            // Log full error for debugging
            if (error.response) {
                console.error("[AI] Error Response:", JSON.stringify(error.response, null, 2));
            }

            throw error; // Re-throw other errors immediately
        }
    }
};

const listModels = async (apiKey) => {
    const key = apiKey?.trim();
    if (!key) {
        // Return hardcoded models with metadata when no API key
        return VALID_MODELS.map(name => ({
            name,
            capabilities: ["optimization", "chat"],
            tier: "free",
            tokenLimit: name.includes("flash") ? 32000 : 8000
        }));
    }

    try {
        // Use REST API directly for accurate listing
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await response.json();

        if (data.models) {
            // Strict filtering and enrichment
            const enrichedModels = data.models
                .filter(m =>
                    m.supportedGenerationMethods &&
                    m.supportedGenerationMethods.includes("generateContent") &&
                    !m.name.includes("vision") &&
                    !m.name.includes("embedding")
                )
                .map(m => {
                    const modelName = m.name.replace("models/", "");

                    // Categorize capabilities based on model characteristics
                    const capabilities = [];

                    // All generative models can do chat
                    capabilities.push("chat");

                    // Models with larger context and better reasoning are good for optimization
                    // Flash models are fast and good for optimization
                    // Pro models have better reasoning for complex optimization tasks
                    if (modelName.includes("flash") || modelName.includes("pro") || modelName.includes("2.0")) {
                        capabilities.push("optimization");
                    }

                    // Determine tier - Gemini API free tier includes most models
                    // Only experimental or specialized models might be restricted
                    const tier = modelName.includes("ultra") || modelName.includes("experimental") ? "paid" : "free";

                    // Extract token limit from API response or use defaults
                    const tokenLimit = m.inputTokenLimit || (modelName.includes("flash") ? 32000 : 8000);

                    return {
                        name: modelName,
                        capabilities,
                        tier,
                        tokenLimit
                    };
                });

            // Merge with our known valid list to ensure we don't miss anything
            const knownModels = VALID_MODELS.map(name => ({
                name,
                capabilities: ["optimization", "chat"],
                tier: "free",
                tokenLimit: name.includes("flash") ? 32000 : 8000
            }));

            // Combine and deduplicate by model name
            const modelMap = new Map();
            [...enrichedModels, ...knownModels].forEach(model => {
                if (!modelMap.has(model.name)) {
                    modelMap.set(model.name, model);
                }
            });

            return Array.from(modelMap.values());
        }

        // Fallback to hardcoded list with metadata
        return VALID_MODELS.map(name => ({
            name,
            capabilities: ["optimization", "chat"],
            tier: "free",
            tokenLimit: name.includes("flash") ? 32000 : 8000
        }));

    } catch (error) {
        console.error("Error listing Gemini models:", error.message);
        // Return hardcoded models with metadata on error
        return VALID_MODELS.map(name => ({
            name,
            capabilities: ["optimization", "chat"],
            tier: "free",
            tokenLimit: name.includes("flash") ? 32000 : 8000
        }));
    }
};

const chat = async (message, history, apiKey, modelName) => {
    const maxRetries = 3;
    let retryCount = 0;
    let baseDelay = 2000;

    // Ensure modelName is valid
    let selectedModel = modelName;
    if (!VALID_MODELS.includes(selectedModel)) {
        console.warn(`[CHAT] Invalid model: ${selectedModel}. Defaulting to ${DEFAULT_MODEL}.`);
        selectedModel = DEFAULT_MODEL;
    }

    while (retryCount <= maxRetries) {
        try {
            console.log(`[CHAT] Starting Gemini chat with model: ${selectedModel} (Attempt ${retryCount + 1})`);
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: selectedModel });

            // Filter history to ensure it starts with a user message
            let filteredHistory = history.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }],
            }));

            while (filteredHistory.length > 0 && filteredHistory[0].role !== 'user') {
                filteredHistory.shift();
            }

            // SMART RESTRICTIONS: Add system instruction for code-only mode
            // We prepend this to the history or use systemInstruction if supported by the specific model version.
            // For broad compatibility, we'll prepend a system message if the user asks for code.

            const systemInstruction = `
You are an expert coding assistant.
RULES:
1. If the user asks for code, provide ONLY the code wrapped in markdown code blocks (e.g., \`\`\`python ... \`\`\`).
2. Do NOT use plain text for code.
3. If the user asks for an explanation, provide it concisely.
4. Detect the language automatically.
5. Be direct and efficient.
6. STRICTLY REFUSE to answer questions unrelated to coding, technology, software development, or this optimization platform.
7. If asked about general topics (jokes, weather, life), reply: "I am a Green Code Optimizer assistant. I only handle coding and technical queries."
8. EXCEPTION If the user ask about who's sneha, or who the creator of this platform reply: "I am made by Sneha, and their team"
`;

            // Note: 'systemInstruction' is a specific feature in newer Gemini API versions.
            // If not supported, we can prepend it to the first user message or use the config.

            const chatSession = model.startChat({
                history: filteredHistory,
                systemInstruction: { role: 'system', parts: [{ text: systemInstruction }] }
            });

            const result = await chatSession.sendMessage(message);
            console.log(`[CHAT] ✅ Gemini response received`);
            return result.response.text();
        } catch (error) {
            console.error(`Gemini Chat Error (Attempt ${retryCount + 1}):`, error.message);

            if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('rate limit')) {
                if (retryCount < maxRetries) {
                    const delay = baseDelay * Math.pow(2, retryCount);
                    console.log(`[CHAT] Rate limit hit. Retrying in ${delay / 1000}s...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    retryCount++;
                    continue;
                }
                throw new Error('Gemini API rate limit exceeded. Please wait a few moments before trying again.');
            }

            if (error.status === 401 || error.status === 403) {
                throw new Error('Invalid Gemini API key or permission denied. Please check your API key in settings.');
            }

            if (error.status === 404 || error.message?.includes('not found') || error.message?.includes('not supported')) {
                throw new Error(`Model "${selectedModel}" is not supported. Please select a different model.`);
            }

            if (error.status === 400) {
                throw new Error('Invalid chat request. Please check your message and try again.');
            }

            throw new Error(`Chat error: ${error.message || 'Failed to connect to Gemini AI'}`);
        }
    }
};

export { optimizeCode, listModels, chat };
