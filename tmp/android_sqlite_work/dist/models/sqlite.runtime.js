"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createModel = exports.toDocument = exports.db = void 0;
const crypto_1 = require("crypto");
const Database = require("better-sqlite3");
const path = require("path");
const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), "bhair.db");
exports.db = new Database(dbPath, { fileMustExist: true });
exports.db.pragma("journal_mode = WAL");
exports.db.pragma("foreign_keys = ON");
const jsonFields = new Set(["images1", "images2", "images3", "videos", "serviceIds", "serviceChanges", "data", "barberProfile"]);
const dateFields = new Set(["bookingDate", "endTime", "createdAt", "updatedAt", "subscriptionExpiry", "date"]);
const tableMaps = {
    users: {
        phoneNumber: "phone_number", googleId: "google_id", fullName: "full_name", isActive: "is_active",
        shopId: "shop_id", fcmToken: "fcm_token", barberProfile: "barber_profile", createdAt: "created_at", updatedAt: "updated_at"
    },
    shops: {
        managerId: "manager_id", averageRating: "average_rating", totalReviews: "total_reviews", isActive: "is_active",
        subscriptionPlan: "subscription_plan", subscriptionExpiry: "subscription_expiry", isPaid: "is_paid",
        openTime: "open_time", closeTime: "close_time", breakStart: "break_start", breakEnd: "break_end", slotDuration: "slot_duration",
        createdAt: "created_at", updatedAt: "updated_at"
    },
    services: {
        shopId: "shop_id", managerExtraFee: "manager_extra_fee", isActive: "is_active", createdAt: "created_at", updatedAt: "updated_at"
    },
    appointments: {
        shopId: "shop_id", customerId: "customer_id", customerName: "customer_name", customerPhone: "customer_phone",
        barberId: "barber_id", serviceIds: "service_ids", bookingDate: "booking_date", endTime: "end_time",
        totalPrice: "total_price", bookingCode: "booking_code", serviceChanges: "service_changes", createdAt: "created_at", updatedAt: "updated_at"
    },
    reviews: {
        appointmentId: "appointment_id", shopId: "shop_id", customerId: "customer_id", barberId: "barber_id", createdAt: "created_at"
    },
    notifications: {
        recipientId: "recipient_id", senderId: "sender_id", isRead: "is_read", createdAt: "created_at"
    },
    history_logs: {
        shopId: "shop_id", actorId: "actor_id", actorName: "actor_name", createdAt: "created_at"
    }
};
function toDbField(table, field) {
    if (field === "_id")
        return "id";
    const map = tableMaps[table] || {};
    return map[field] || field;
}
function toDbValue(value) {
    if (value === undefined)
        return null;
    if (value instanceof Date)
        return value.toISOString();
    if (typeof value === "boolean")
        return value ? 1 : 0;
    if (Array.isArray(value) || (value && typeof value === "object" && !value.toString?.match?.(/^([a-f0-9]{24}|[0-9a-f-]{36})$/i)))
        return JSON.stringify(value);
    return value;
}
function parseJson(value, fallback) {
    if (value === null || value === undefined || value === "")
        return fallback;
    if (Array.isArray(value) || typeof value === "object")
        return value;
    try {
        return JSON.parse(value);
    }
    catch (_a) {
        return fallback;
    }
}
function normalizeDoc(table, row) {
    if (!row)
        return null;
    const doc = { _id: row.id, id: row.id };
    const map = tableMaps[table] || {};
    for (const [key, value] of Object.entries(row)) {
        if (key === "id")
            continue;
        const camel = Object.keys(map).find(k => map[k] === key) || key;
        let out = value;
        if (jsonFields.has(camel))
            out = parseJson(value, camel === "barberProfile" || camel === "data" ? null : []);
        else if (camel === "location_type" || camel === "location_longitude" || camel === "location_latitude")
            continue;
        else if (["isActive", "isPaid", "isRead"].includes(camel))
            out = !!value;
        else if (dateFields.has(camel) && value)
            out = new Date(value);
        doc[camel] = out;
    }
    if (table === "shops") {
        doc.location = { type: row.location_type || "Point", coordinates: [row.location_longitude || 0, row.location_latitude || 0] };
        doc.images1 = parseJson(row.images1, []);
        doc.images2 = parseJson(row.images2, []);
        doc.images3 = parseJson(row.images3, []);
        doc.videos = parseJson(row.videos, []);
    }
    doc.toObject = () => {
        const plain = {};
        for (const [k, v] of Object.entries(doc)) {
            if (k !== "toObject" && k !== "save")
                plain[k] = v;
        }
        return plain;
    };
    return doc;
}
exports.toDocument = normalizeDoc;
function buildPredicate(table, query = {}) {
    const clauses = [];
    const params = [];
    const post = [];
    for (const [field, value] of Object.entries(query || {})) {
        if (field === "$or") {
            const parts = [];
            for (const cond of value) {
                const built = buildPredicate(table, cond);
                if (built.sql)
                    parts.push(`(${built.sql})`);
                params.push(...built.params);
                post.push(...built.post);
            }
            if (parts.length)
                clauses.push(`(${parts.join(" OR ")})`);
            continue;
        }
        if (field === "location") {
            continue;
        }
        const col = toDbField(table, field);
        if (value && typeof value === "object" && !(value instanceof Date) && !Array.isArray(value)) {
            if (value.$in) {
                clauses.push(`${col} IN (${value.$in.map(() => "?").join(",")})`);
                params.push(...value.$in.map(toDbValue));
            }
            else if (value.$regex !== undefined) {
                clauses.push(`${col} LIKE ?`);
                params.push(`%${String(value.$regex)}%`);
            }
            else {
                for (const [op, v] of Object.entries(value)) {
                    const sqlOp = { $lt: "<", $gt: ">", $lte: "<=", $gte: ">=" }[op];
                    if (sqlOp) {
                        clauses.push(`${col} ${sqlOp} ?`);
                        params.push(toDbValue(v));
                    }
                }
            }
        }
        else {
            clauses.push(`${col} = ?`);
            params.push(toDbValue(value));
        }
    }
    return { sql: clauses.join(" AND "), params, post };
}
function saveDoc(table, doc) {
    const id = doc._id || doc.id || (0, crypto_1.randomUUID)();
    doc._id = id;
    doc.id = id;
    const row = toRow(table, doc);
    const exists = exports.db.prepare(`SELECT 1 FROM ${table} WHERE id = ?`).get(id);
    if (exists) {
        const fields = Object.keys(row).filter(k => k !== "id");
        const sql = `UPDATE ${table} SET ${fields.map(k => `${k} = ?`).join(", ")} WHERE id = ?`;
        exports.db.prepare(sql).run(...fields.map(k => row[k]), id);
    }
    else {
        const fields = Object.keys(row);
        const sql = `INSERT INTO ${table} (${fields.join(", ")}) VALUES (${fields.map(() => "?").join(", ")})`;
        exports.db.prepare(sql).run(...fields.map(k => row[k]));
    }
    return Promise.resolve(doc);
}
function toRow(table, doc) {
    const row = { id: doc._id || doc.id || (0, crypto_1.randomUUID)() };
    for (const [key, value] of Object.entries(doc)) {
        if (["_id", "id", "toObject", "save"].includes(key))
            continue;
        if (table === "shops" && key === "location") {
            row.location_type = value?.type || "Point";
            row.location_longitude = value?.coordinates?.[0] || 0;
            row.location_latitude = value?.coordinates?.[1] || 0;
            continue;
        }
        const col = toDbField(table, key);
        row[col] = toDbValue(value);
    }
    return row;
}
function selectFields(doc, fields) {
    if (!doc || !fields)
        return doc;
    const tokens = String(fields).split(/\s+/).filter(Boolean);
    if (tokens.some(t => t.startsWith("-"))) {
        for (const t of tokens)
            delete doc[t.replace(/^-/, "")];
    }
    else {
        const keep = new Set(["_id", "id", "toObject", "save", ...tokens]);
        for (const key of Object.keys(doc))
            if (!keep.has(key))
                delete doc[key];
    }
    return doc;
}
function populateOne(doc, spec) {
    if (!doc)
        return doc;
    const modelByField = {
        managerId: ["users"], customerId: ["users"], barberId: ["users"], serviceIds: ["services"], shopId: ["shops"], recipientId: ["users"], senderId: ["users"]
    };
    const table = modelByField[spec.field]?.[0];
    if (!table)
        return doc;
    if (Array.isArray(doc[spec.field])) {
        doc[spec.field] = doc[spec.field].map(id => selectFields(normalizeDoc(table, exports.db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id)), spec.fields)).filter(Boolean);
    }
    else if (doc[spec.field]) {
        doc[spec.field] = selectFields(normalizeDoc(table, exports.db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(doc[spec.field])), spec.fields);
    }
    return doc;
}
class Query {
    constructor(model, kind, query, id) {
        this.model = model;
        this.kind = kind;
        this.query = query;
        this.id = id;
        this._populates = [];
    }
    populate(field, fields) { this._populates.push({ field, fields }); return this; }
    sort(sort) { this._sort = sort; return this; }
    limit(n) { this._limit = n; return this; }
    skip(n) { this._skip = n; return this; }
    lean() { this._lean = true; return this; }
    select(fields) { this._select = fields; return this; }
    exec() { return Promise.resolve(this.run()); }
    then(resolve, reject) { return this.exec().then(resolve, reject); }
    catch(reject) { return this.exec().catch(reject); }
    run() {
        let rows = [];
        if (this.kind === "id") {
            const row = exports.db.prepare(`SELECT * FROM ${this.model.table} WHERE id = ?`).get(this.id);
            rows = row ? [row] : [];
        }
        else {
            const built = buildPredicate(this.model.table, this.query);
            let sql = `SELECT * FROM ${this.model.table}`;
            if (built.sql)
                sql += ` WHERE ${built.sql}`;
            rows = exports.db.prepare(sql).all(...built.params);
        }
        let docs = rows.map(r => attachSave(this.model.table, normalizeDoc(this.model.table, r)));
        if (this._sort) {
            const [[field, dir]] = Object.entries(this._sort);
            docs.sort((a, b) => (a[field] > b[field] ? 1 : a[field] < b[field] ? -1 : 0) * (dir < 0 ? -1 : 1));
        }
        if (this._skip)
            docs = docs.slice(this._skip);
        if (this._limit !== undefined)
            docs = docs.slice(0, this._limit);
        for (const p of this._populates)
            docs = docs.map(d => populateOne(d, p));
        docs = docs.map(d => selectFields(d, this._select));
        return this.kind === "id" || this.kind === "one" ? (docs[0] || null) : docs;
    }
}
function attachSave(table, doc) {
    if (doc)
        doc.save = () => saveDoc(table, doc);
    return doc;
}
function createModel(table) {
    return class Model {
        constructor(data = {}) {
            Object.assign(this, data);
            this._id = this._id || this.id || (0, crypto_1.randomUUID)();
            this.id = this._id;
        }
        save() { return saveDoc(table, this); }
        toObject() {
            const plain = {};
            for (const [k, v] of Object.entries(this))
                if (k !== "save")
                    plain[k] = v;
            return plain;
        }
        static get table() { return table; }
        static find(query = {}) { return new Query(this, "many", query); }
        static findOne(query = {}) { return new Query(this, "one", query); }
        static findById(id) { return new Query(this, "id", {}, id); }
        static create(data) {
            const doc = new this(data);
            return doc.save().then(() => doc);
        }
        static findByIdAndUpdate(id, updates = {}, options = {}) {
            const doc = new Query(this, "id", {}, id).run();
            if (!doc)
                return Promise.resolve(null);
            Object.assign(doc, updates);
            return saveDoc(table, doc).then(() => options.new ? doc : doc);
        }
        static updateMany(query = {}, updates = {}) {
            const docs = new Query(this, "many", query).run();
            for (const doc of docs) {
                Object.assign(doc, updates);
                saveDoc(table, doc);
            }
            return Promise.resolve({ modifiedCount: docs.length });
        }
        static countDocuments(query = {}) {
            return Promise.resolve(new Query(this, "many", query).run().length);
        }
        static aggregate(pipeline = []) {
            if (table === "reviews") {
                const match = pipeline.find(x => x.$match)?.$match || {};
                const docs = new Query(this, "many", match).run();
                const avg = docs.reduce((s, d) => s + Number(d.rating || 0), 0) / (docs.length || 1);
                return Promise.resolve(docs.length ? [{ _id: match.shopId, averageRating: avg, totalReviews: docs.length }] : []);
            }
            return Promise.resolve([]);
        }
    };
}
exports.createModel = createModel;
console.log("Connected to SQLite:", dbPath);
