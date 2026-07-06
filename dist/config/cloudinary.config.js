"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyCloudinaryConnection = void 0;
const cloudinary_1 = require("cloudinary");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Manually parse and configure Cloudinary to avoid initialization hoisting bugs
if (process.env.CLOUDINARY_URL) {
    const match = process.env.CLOUDINARY_URL.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
    if (match) {
        cloudinary_1.v2.config({
            api_key: match[1],
            api_secret: match[2],
            cloud_name: match[3],
            secure: true
        });
    }
}
// Cloudinary will automatically configure itself if CLOUDINARY_URL is present in process.env
// We export the configured instance for use elsewhere.
const logger_1 = require("../utils/logger");
const verifyCloudinaryConnection = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield cloudinary_1.v2.api.ping();
        (0, logger_1.startupLog)('Cloudinary connected:', result.status);
        return true;
    }
    catch (error) {
        (0, logger_1.log)('❌ Cloudinary connection failed:', error.message);
        return false;
    }
});
exports.verifyCloudinaryConnection = verifyCloudinaryConnection;
exports.default = cloudinary_1.v2;
