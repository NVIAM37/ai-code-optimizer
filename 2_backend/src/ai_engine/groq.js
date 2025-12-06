import Groq from "groq-sdk";

import { OPTIMIZATION_PROMPT } from './prompts.js';

export const optimizeCodeGroq = async (code, language, intensity, apiKey, modelName, options = {}) => {
    if (!apiKey) {
        throw new Error("Groq API Key is required");
    }

    const groq = new Groq({ apiKey });

    console.log(`[AI] Optimizing ${language} code with Groq, intensity: ${intensity}`);

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

YOU MUST PROVIDE CODE THAT IS FASTER AND MORE EFFICIENT THAN THIS.`;
    }

    if (options.systemInfo) {
        prompt += `\n\nTARGET SYSTEM INFO:\nOS: ${options.systemInfo.os}\nCPU: ${options.systemInfo.cpu_count} cores\nRAM: ${options.systemInfo.ram_total_gb} GB\nGPU: ${options.systemInfo.gpu_name || 'None'}`;
    }

    // Append the specific code context
    prompt += `\n\nCURRENT REQUEST:\nLanguage: ${language}\nIntensity: ${intensity}\n\nCODE TO OPTIMIZE:\n\`\`\`${language}\n${code}\n\`\`\``;

    try {
        console.log("[AI] Sending optimization request to Groq...");
        const selectedModel = modelName || "llama3-70b-8192";
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: selectedModel,
            temperature: 0.1,
            // Ensure we get enough tokens for the full JSON response
            max_tokens: 4096
        });

        let text = chatCompletion.choices[0]?.message?.content || "";
        console.log(`[AI] Received ${text.length} characters from Groq`);

        // Clean up formatting
        text = text.replace(/```json\n/g, "").replace(/```\n/g, "").replace(/```/g, "").trim();

        // Parse JSON response
        let resultObj;
        try {
            resultObj = JSON.parse(text);
        } catch (e) {
            console.error("[AI] Failed to parse JSON response from Groq:", text);
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

        console.log("[AI] ✅ Groq optimization complete");
        return resultObj;
    } catch (error) {
        console.error("[AI] ❌ Groq Error:", error.message);

        // Detect rate limit
        if (error.message?.includes('rate limit') || error.status === 429) {
            throw new Error('RATE_LIMIT_EXCEEDED');
        }

        throw error;
    }
};

export const listModelsGroq = async (apiKey) => {
    if (!apiKey) return [];

    try {
        const groq = new Groq({ apiKey });
        const response = await groq.models.list();

        // Enrich models with capability metadata
        const enrichedModels = response.data.map(model => {
            const modelId = model.id;
            const capabilities = [];

            // All Groq models can do chat
            capabilities.push("chat");

            // Larger models (70b, mixtral) are better for optimization
            // Smaller models (8b) are good for quick chats
            if (modelId.includes("70b") || modelId.includes("mixtral")) {
                capabilities.push("optimization");
            }

            // All Groq models on their platform are currently free tier
            const tier = "free";

            // Extract context length from model metadata or use defaults
            const tokenLimit = model.context_window || 8192;

            return {
                name: modelId,
                capabilities,
                tier,
                tokenLimit
            };
        });

        return enrichedModels;
    } catch (error) {
        console.error("Error listing Groq models:", error);
        return [];
    }
};

export const chatGroq = async (message, history, apiKey, modelName = "llama3-70b-8192") => {
    if (!apiKey) {
        throw new Error("Groq API Key is required");
    }

    try {
        console.log(`[CHAT] Starting Groq chat with model: ${modelName}`);
        const groq = new Groq({ apiKey });

        // Convert history to Groq format
        const messages = history.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
        }));

        // Add current message
        messages.push({ role: 'user', content: message });

        // Prepend system instruction
        const systemInstruction = `You are an expert coding assistant.
RULES:
1. Provide code in markdown blocks.
2. Be concise.
3. STRICTLY REFUSE non-technical questions (jokes, weather, etc.). Reply: "I only handle coding queries."`;

        messages.unshift({ role: 'system', content: systemInstruction });

        const chatCompletion = await groq.chat.completions.create({
            messages,
            model: modelName,
            temperature: 0.7,
            max_tokens: 1024
        });

        const reply = chatCompletion.choices[0]?.message?.content || "I couldn't generate a response.";
        console.log(`[CHAT] ✅ Groq response received`);
        return reply;
    } catch (error) {
        console.error("Groq Chat Error:", error);

        // Handle rate limits
        if (error.status === 429 || error.message?.includes('rate limit')) {
            throw new Error('API rate limit exceeded. Please wait a moment and try again.');
        }

        // Handle authentication errors
        if (error.status === 401 || error.status === 403) {
            throw new Error('Invalid Groq API key. Please check your settings.');
        }

        // Handle invalid model
        if (error.status === 404 || error.message?.includes('model')) {
            throw new Error(`Model "${modelName}" not found. Please select a different model.`);
        }

        throw new Error('Failed to connect to Groq AI. Please try again.');
    }
};
