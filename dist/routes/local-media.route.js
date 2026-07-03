"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_local_1 = require("../utils/multer.local");
const local_media_controller_1 = require("../controllers/local-media.controller");
const router = (0, express_1.Router)();
// Upload files (allows multiple files with field name 'files', or adjust if frontend uses 'file')
// Using .array('files', 10) allows up to 10 files at once
router.post('/upload', multer_local_1.localUpload.array('files', 10), local_media_controller_1.uploadFiles);
// Get list of uploaded files
router.get('/', local_media_controller_1.listFiles);
// Download a specific file
router.get('/download/:filename', local_media_controller_1.downloadFile);
exports.default = router;
