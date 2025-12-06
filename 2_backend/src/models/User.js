import JsonModel from '../utils/JsonModel.js';
import bcrypt from 'bcryptjs';
import validator from 'validator';

const userSchema = {
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: function () {
            return !this.googleId;
        },
        minlength: [8, 'Password must be at least 8 characters'],
        select: false
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    name: {
        type: String,
        trim: true,
        default: function () {
            return this.email ? this.email.split('@')[0] : '';
        }
    },
    apiKeys: {
        gemini: {
            type: String,
            default: ''
        },
        groq: {
            type: String,
            default: ''
        }
    },
    preferences: {
        defaultLanguage: {
            type: String,
            enum: ['python', 'javascript', 'rust'],
            default: 'python'
        },
        model: {
            type: String,
            default: 'gemini-1.5-pro'
        },
        chatModel: {
            type: String,
            default: 'gemini-flash-latest'
        },
        defaultProvider: {
            type: String,
            enum: ['gemini', 'groq'],
            default: 'gemini'
        },
        defaultIntensity: {
            type: Number,
            min: 0,
            max: 100,
            default: 50
        },
        theme: {
            type: String,
            enum: ['dark', 'light'],
            default: 'dark'
        }
    },
    createdAt: {
        type: Date,
        default: () => new Date()
    },
    lastLogin: {
        type: Date,
        default: () => new Date()
    }
};

class UserModel extends JsonModel {
    constructor() {
        super('User', userSchema);
    }

    async create(doc) {
        // Hash password before saving
        if (doc.password) {
            const salt = await bcrypt.genSalt(10);
            doc.password = await bcrypt.hash(doc.password, salt);
        }
        const newDoc = await super.create(doc);
        return this._hydrate(newDoc);
    }

    async findOne(query) {
        const doc = await super.findOne(query);
        return doc ? this._hydrate(doc) : null;
    }

    async findById(id) {
        const doc = await super.findById(id);
        return doc ? this._hydrate(doc) : null;
    }

    async find(query) {
        const docs = await super.find(query);
        return docs.map(doc => this._hydrate(doc));
    }

    // Helper to attach methods to the plain JSON object
    _hydrate(userDoc) {
        if (!userDoc) return null;

        // Attach comparePassword
        userDoc.comparePassword = async (candidatePassword) => {
            if (!userDoc.password) return false;
            return await bcrypt.compare(candidatePassword, userDoc.password);
        };

        // Attach getPublicProfile
        userDoc.getPublicProfile = () => {
            return {
                id: userDoc._id,
                email: userDoc.email,
                name: userDoc.name,
                preferences: userDoc.preferences,
                createdAt: userDoc.createdAt,
                lastLogin: userDoc.lastLogin,
                apiKeys: userDoc.apiKeys
            };
        };

        // Attach updateLastLogin
        userDoc.updateLastLogin = async () => {
            userDoc.lastLogin = new Date();
            await this.updateOne({ _id: userDoc._id }, { $set: { lastLogin: userDoc.lastLogin } });
        };

        // Attach save (Active Record pattern)
        userDoc.save = async () => {
            // We need to handle password hashing if it was modified, but for now assuming direct updates
            // In a real Mongoose replacement, we'd track modified paths.
            // Here we just save the whole object back.
            await this.updateOne({ _id: userDoc._id }, userDoc);
            return userDoc;
        };

        return userDoc;
    }

    // Keep these for static usage if needed, but they are now attached to instances
    async comparePassword(user, candidatePassword) {
        if (!user.password) return false;
        return await bcrypt.compare(candidatePassword, user.password);
    }

    getPublicProfile(user) {
        return {
            id: user._id,
            email: user.email,
            name: user.name,
            preferences: user.preferences,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
            apiKeys: user.apiKeys
        };
    }

    async updateLastLogin(userId) {
        return this.updateOne({ _id: userId }, { $set: { lastLogin: new Date() } });
    }
}

export default new UserModel();
