"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationType = void 0;
const sqlite_runtime_1 = require("./sqlite.runtime");
var NotificationType;
(function (NotificationType) {
    NotificationType["BOOKING_CREATED"] = "BOOKING_CREATED";
    NotificationType["BOOKING_CONFIRMED"] = "BOOKING_CONFIRMED";
    NotificationType["BOOKING_CANCELLED"] = "BOOKING_CANCELLED";
    NotificationType["BOOKING_COMPLETED"] = "BOOKING_COMPLETED";
    NotificationType["SYSTEM"] = "SYSTEM";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
exports.default = (0, sqlite_runtime_1.createModel)("notifications");
