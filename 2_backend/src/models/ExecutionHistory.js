import JsonModel from '../utils/JsonModel.js';

const executionHistorySchema = {
    userId: {
        type: String,
        required: true,
        index: true
    },
    language: {
        type: String,
        required: true,
        enum: ['python', 'javascript', 'rust']
    },
    originalCode: {
        type: String,
        required: true
    },
    optimizedCode: {
        type: String,
        required: true
    },
    metrics: {
        original: {
            duration: Number,
            cpu_peak: Number,
            ram_peak: Number,
            energy_joules: Number,
            co2_grams: Number,
            gpu_used: Boolean,
            stdout: String,
            stderr: String
        },
        optimized: {
            duration: Number,
            cpu_peak: Number,
            ram_peak: Number,
            energy_joules: Number,
            co2_grams: Number,
            gpu_used: Boolean,
            stdout: String,
            stderr: String
        }
    },
    provider: {
        type: String,
        enum: ['gemini', 'groq'],
        required: true
    },
    model: {
        type: String,
        default: ''
    },
    intensity: {
        type: Number,
        min: 0,
        max: 100,
        required: true
    },
    performanceGain: {
        type: Number,
        default: 0
    },
    timestamp: {
        type: Date,
        default: () => new Date(),
        index: true
    }
};

class ExecutionHistoryModel extends JsonModel {
    constructor() {
        super('ExecutionHistory', executionHistorySchema);
    }
}

export default new ExecutionHistoryModel();
