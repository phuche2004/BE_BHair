"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Gender = void 0;
const sqlite_runtime_1 = require("./sqlite.runtime");
var Gender;
(function (Gender) {
    Gender["MALE"] = "MALE";
    Gender["FEMALE"] = "FEMALE";
    Gender["UNKOWN"] = "BOTH";
})(Gender || (exports.Gender = Gender = {}));
exports.default = (0, sqlite_runtime_1.createModel)("shops");
