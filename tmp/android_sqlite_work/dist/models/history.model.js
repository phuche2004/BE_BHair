"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoryAction = void 0;
const sqlite_runtime_1 = require("./sqlite.runtime");
var HistoryAction;
(function (HistoryAction) {
    HistoryAction["CREATED_APPOINTMENT"] = "CREATED_APPOINTMENT";
    HistoryAction["UPDATED_STATUS"] = "UPDATED_STATUS";
    HistoryAction["EDITED_SERVICES"] = "EDITED_SERVICES";
})(HistoryAction || (exports.HistoryAction = HistoryAction = {}));
exports.default = (0, sqlite_runtime_1.createModel)("history_logs");
