import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function checkModel(modelName) {
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        await model.generateContent("Test");
        console.log(`✅ SUCCESS: ${modelName} is working.`);
        return true;
    } catch (error) {
        console.log(`❌ FAILED: ${modelName} - ${error.message.split(':')[0]}`);
        return false;
    }
}

async function findWorkingModel() {
    const models = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-flash-001",
        "gemini-1.5-pro",
        "gemini-1.5-pro-latest",
        "gemini-1.5-pro-001",
        "gemini-pro",
        "gemini-1.0-pro",
        "gemini-2.0-flash-exp"
    ];

    console.log("Testing models...");
    for (const m of models) {
        if (await checkModel(m)) break;
    }
}

findWorkingModel();
