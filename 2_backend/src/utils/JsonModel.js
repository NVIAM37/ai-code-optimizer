import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
const DATA_DIR = path.resolve(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Simple Mutex for concurrency control
class Mutex {
    constructor() {
        this._queue = [];
        this._locked = false;
    }

    lock() {
        return new Promise((resolve) => {
            if (this._locked) {
                this._queue.push(resolve);
            } else {
                this._locked = true;
                resolve();
            }
        });
    }

    unlock() {
        if (this._queue.length > 0) {
            const next = this._queue.shift();
            next();
        } else {
            this._locked = false;
        }
    }

    async runExclusive(callback) {
        await this.lock();
        try {
            return await callback();
        } finally {
            this.unlock();
        }
    }
}

// Global mutexes per collection to ensure file-level locking
const mutexes = {};

class JsonModel {
    constructor(name, schema) {
        this.name = name;
        this.schema = schema;
        this.filePath = path.join(DATA_DIR, `${name.toLowerCase()}s.json`);
        this.data = [];

        // Initialize mutex for this collection if not exists
        if (!mutexes[name]) {
            mutexes[name] = new Mutex();
        }
        this.mutex = mutexes[name];

        // Initial load (sync is okay for startup, but we'll use async for operations)
        // We don't load here to avoid blocking startup, we load on demand.
    }

    async load() {
        try {
            // Check if file exists
            try {
                await fs.promises.access(this.filePath);
            } catch {
                this.data = [];
                await this.saveFile();
                return;
            }

            const content = await fs.promises.readFile(this.filePath, 'utf-8');
            if (!content.trim()) {
                this.data = [];
                return;
            }
            try {
                this.data = JSON.parse(content);
            } catch (parseError) {
                console.error(`❌ CORRUPT DATA in ${this.name}:`, parseError.message);
                throw new Error(`Database file ${this.name} is corrupt. Please fix or delete it manually.`);
            }
        } catch (error) {
            console.error(`Error loading ${this.name} data:`, error);
            if (error.message.includes('is corrupt')) throw error;
            throw error;
        }
    }

    async saveFile() {
        const maxRetries = 3;
        let attempt = 0;
        
        while (attempt < maxRetries) {
            try {
                // Atomic write: write to temp file then rename
                const tempPath = `${this.filePath}.tmp`;
                await fs.promises.writeFile(tempPath, JSON.stringify(this.data, null, 2));
                await fs.promises.rename(tempPath, this.filePath);
                return; // Success
            } catch (error) {
                attempt++;
                const isLockError = error.code === 'EPERM' || error.code === 'EBUSY';
                
                if (isLockError && attempt < maxRetries) {
                    console.warn(`⚠️  Write failed (${error.code}), retrying ${attempt}/${maxRetries}...`);
                    await new Promise(resolve => setTimeout(resolve, 100 * attempt)); // Linear backoff
                } else {
                    console.error(`Error saving ${this.name} data:`, error);
                    throw new Error('Database write failed');
                }
            }
        }
    }

    // Helper to generate ObjectId-like string
    generateId() {
        return crypto.randomBytes(12).toString('hex');
    }

    // Helper to validate against schema (basic validation)
    validate(doc) {
        for (const [key, config] of Object.entries(this.schema)) {
            if (typeof config.type === 'undefined' && typeof config !== 'function' && !Array.isArray(config)) {
                continue;
            }

            const value = doc[key];

            if (config.required && (value === undefined || value === null || value === '')) {
                if (typeof config.required === 'function') {
                    if (config.required.call(doc)) {
                        throw new Error(`${key} is required`);
                    }
                } else if (Array.isArray(config.required)) {
                    if (config.required[0]) throw new Error(config.required[1]);
                } else {
                    throw new Error(`${key} is required`);
                }
            }

            if (value === undefined && config.default !== undefined) {
                if (typeof config.default === 'function') {
                    doc[key] = config.default.call(doc);
                } else {
                    doc[key] = config.default;
                }
            }
        }
        return doc;
    }

    // --- Mongoose-like API with Mutex ---

    async find(query = {}) {
        return this.mutex.runExclusive(async () => {
            await this.load();
            return this.data.filter(item => this._matches(item, query));
        });
    }

    async findOne(query = {}) {
        return this.mutex.runExclusive(async () => {
            await this.load();
            return this.data.find(item => this._matches(item, query)) || null;
        });
    }

    async findById(id) {
        return this.mutex.runExclusive(async () => {
            await this.load();
            return this.data.find(item => item._id === id) || null;
        });
    }

    async create(doc) {
        return this.mutex.runExclusive(async () => {
            await this.load();
            const newDoc = { ...doc, _id: this.generateId(), createdAt: new Date(), updatedAt: new Date() };

            this._applyDefaults(newDoc);

            this.data.push(newDoc);
            await this.saveFile();
            return newDoc;
        });
    }

    async updateOne(query, update) {
        return this.mutex.runExclusive(async () => {
            await this.load();
            const index = this.data.findIndex(item => this._matches(item, query));
            if (index !== -1) {
                const updatedItem = { ...this.data[index], ...update, updatedAt: new Date() };

                if (update.$set) {
                    Object.assign(updatedItem, update.$set);
                    delete updatedItem.$set;
                }

                if (update.$inc) {
                    for (const [key, value] of Object.entries(update.$inc)) {
                        if (typeof updatedItem[key] === 'number') {
                            updatedItem[key] += value;
                        } else {
                            updatedItem[key] = value;
                        }
                    }
                    delete updatedItem.$inc;
                }

                this.data[index] = updatedItem;
                await this.saveFile();
                return { modifiedCount: 1, matchedCount: 1 };
            }
            return { modifiedCount: 0, matchedCount: 0 };
        });
    }

    async deleteOne(query) {
        return this.mutex.runExclusive(async () => {
            await this.load();
            const index = this.data.findIndex(item => this._matches(item, query));
            if (index !== -1) {
                this.data.splice(index, 1);
                await this.saveFile();
                return { deletedCount: 1 };
            }
            return { deletedCount: 0 };
        });
    }

    async deleteMany(query) {
        return this.mutex.runExclusive(async () => {
            await this.load();
            const initialLength = this.data.length;
            this.data = this.data.filter(item => !this._matches(item, query));
            if (this.data.length !== initialLength) {
                await this.saveFile();
                return { deletedCount: initialLength - this.data.length };
            }
            return { deletedCount: 0 };
        });
    }

    async findByIdAndDelete(id) {
        return this.mutex.runExclusive(async () => {
            await this.load();
            const index = this.data.findIndex(item => item._id === id);
            if (index !== -1) {
                const deleted = this.data[index];
                this.data.splice(index, 1);
                await this.saveFile();
                return this._hydrate(deleted);
            }
            return null;
        });
    }

    async countDocuments(query = {}) {
        return this.mutex.runExclusive(async () => {
            await this.load();
            return this.data.filter(item => this._matches(item, query)).length;
        });
    }

    // Helper for query matching
    _matches(item, query) {
        for (const [key, value] of Object.entries(query)) {
            if (item[key] !== value) return false;
        }
        return true;
    }

    _hydrate(doc) {
        return doc;
    }

    _applyDefaults(doc) {
        const apply = (schemaObj, docObj) => {
            for (const key in schemaObj) {
                const config = schemaObj[key];
                if (docObj[key] === undefined && config && config.default !== undefined) {
                    if (typeof config.default === 'function') {
                        docObj[key] = config.default.call(docObj);
                    } else {
                        docObj[key] = config.default;
                    }
                }

                if (key === 'apiKeys' && schemaObj[key].gemini) {
                    if (!docObj[key]) docObj[key] = {};
                    apply(schemaObj[key], docObj[key]);
                }
                if (key === 'preferences' && schemaObj[key].theme) {
                    if (!docObj[key]) docObj[key] = {};
                    apply(schemaObj[key], docObj[key]);
                }
            }
        };

        apply(this.schema, doc);
    }
}

export default JsonModel;
