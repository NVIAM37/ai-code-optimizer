import JsonModel from '../utils/JsonModel.js';

const chatSchema = {
    userId: {
        type: String,
        required: true,
        index: true
    },
    title: {
        type: String,
        default: 'New Chat'
    },
    messages: {
        type: Array,
        default: []
    },
    metrics: {
        type: Object,
        default: {}
    },
    model: {
        type: String,
        required: true
    },
    provider: {
        type: String,
        default: 'gemini'
    },
    createdAt: {
        type: Date,
        default: () => new Date()
    },
    updatedAt: {
        type: Date,
        default: () => new Date()
    }
};

class ChatModel extends JsonModel {
    constructor() {
        super('Chat', chatSchema);
    }
}

export default new ChatModel();
