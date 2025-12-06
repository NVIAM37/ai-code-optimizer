import session from 'express-session';
import JsonModel from '../utils/JsonModel.js';

// Create a specific model for Express Sessions
const sessionSchema = {
    _id: { type: String, required: true }, // sessionID
    session: { type: Object, required: true }, // The actual session data
    expires: { type: Date, required: true }
};

class ExpressSessionModel extends JsonModel {
    constructor() {
        super('ExpressSession', sessionSchema);
    }
}

const expressSessionModel = new ExpressSessionModel();

class JsonStore extends session.Store {
    constructor(options = {}) {
        super(options);
    }

    get(sid, cb) {
        expressSessionModel.findById(sid).then(doc => {
            if (!doc) return cb(null, null);
            // Check expiry
            if (doc.expires && new Date(doc.expires) < new Date()) {
                this.destroy(sid, () => cb(null, null));
            } else {
                cb(null, doc.session);
            }
        }).catch(err => cb(err));
    }

    set(sid, sessionData, cb) {
        let expires;
        if (sessionData && sessionData.cookie && sessionData.cookie.expires) {
            expires = new Date(sessionData.cookie.expires);
        } else {
            expires = new Date(Date.now() + 86400000); // Default 1 day
        }

        const doc = {
            _id: sid,
            session: sessionData,
            expires: expires
        };

        // We need to handle upsert manually since create() generates a new ID
        // But JsonModel.create generates ID if not present.
        // Here we want to use 'sid' as ID.
        // Let's modify JsonModel or just handle it here.
        // JsonModel.create overrides _id. 
        // I should add a method to JsonModel to save with specific ID or update if exists.

        // Workaround: Check if exists, then update or push directly.
        expressSessionModel.findById(sid).then(existing => {
            if (existing) {
                expressSessionModel.updateOne({ _id: sid }, { $set: { session: sessionData, expires: expires } })
                    .then(() => cb(null))
                    .catch(err => cb(err));
            } else {
                // We need to bypass create() because it generates a random ID.
                // Let's manually push to data and save.
                expressSessionModel.load();
                expressSessionModel.data.push(doc);
                expressSessionModel.saveFile();
                cb(null);
            }
        }).catch(err => cb(err));
    }

    destroy(sid, cb) {
        expressSessionModel.deleteOne({ _id: sid })
            .then(() => cb(null))
            .catch(err => cb(err));
    }

    touch(sid, sessionData, cb) {
        let expires;
        if (sessionData && sessionData.cookie && sessionData.cookie.expires) {
            expires = new Date(sessionData.cookie.expires);
        } else {
            expires = new Date(Date.now() + 86400000);
        }

        expressSessionModel.updateOne({ _id: sid }, { $set: { expires: expires } })
            .then(() => cb(null))
            .catch(err => cb(err));
    }
}

export default JsonStore;
