import JsonModel from '../utils/JsonModel.js';

const sessionSchema = {
    userId: {
        type: 'ObjectId',
        ref: 'User',
        required: true
    },
    token: {
        type: String,
        required: true
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    isValid: {
        type: Boolean,
        default: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: () => new Date()
    }
};

class SessionModel extends JsonModel {
    constructor() {
        super('Session', sessionSchema);
    }
}

export default new SessionModel();
