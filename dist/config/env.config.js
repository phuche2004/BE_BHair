"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const config = {
    port: process.env.PORT || 1000,
    mongoUri: process.env.MONGODB_URI
};
exports.default = config;
