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
exports.sendPushNotification = void 0;
const firebase_config_1 = __importDefault(require("../config/firebase.config"));
const sendPushNotification = (_a) => __awaiter(void 0, [_a], void 0, function* ({ token, title, body, data }) {
    if (!token)
        return;
    try {
        yield firebase_config_1.default.messaging().send({
            token,
            notification: {
                title,
                body,
            },
            data: data || {}, // Data payload for app navigation
        });
        console.log(`📲 Push sent to ${token.slice(0, 10)}...`);
    }
    catch (error) {
        console.error('❌ Push Notification Failed:', error.message);
    }
});
exports.sendPushNotification = sendPushNotification;
