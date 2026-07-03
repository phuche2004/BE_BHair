"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ quiet: true });
const express_1 = __importDefault(require("express"));
const database_1 = __importDefault(require("./config/database"));
const cloudinary_config_1 = require("./config/cloudinary.config");
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
// Connect to database
(0, database_1.default)();
// Verify Cloudinary
(0, cloudinary_config_1.verifyCloudinaryConnection)();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 1000;
// Routes
const auth_route_1 = __importDefault(require("./routes/auth.route"));
const shop_route_1 = __importDefault(require("./routes/shop.route"));
const service_route_1 = __importDefault(require("./routes/service.route"));
const appointment_route_1 = __importDefault(require("./routes/appointment.route"));
const search_route_1 = __importDefault(require("./routes/search.route"));
const review_route_1 = __importDefault(require("./routes/review.route"));
const notification_route_1 = __importDefault(require("./routes/notification.route"));
const slot_route_1 = __importDefault(require("./routes/slot.route"));
const ai_route_1 = __importDefault(require("./routes/ai.route"));
const explorer_route_1 = __importDefault(require("./routes/explorer.route"));
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use((0, cookie_parser_1.default)());
// Cấu hình EJS
app.set('view engine', 'ejs');
app.set('views', path_1.default.join(process.cwd(), 'src/views'));
if (process.env.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev')); // Log HTTP requests
}
// Route registrations
app.use('/api/v1/user', auth_route_1.default);
app.use('/api/v1/shop', shop_route_1.default);
app.use('/api/v1/service', service_route_1.default);
app.use('/api/v1/appointment', appointment_route_1.default);
app.use('/api/v1/search', search_route_1.default);
app.use('/api/v1/review', review_route_1.default);
app.use('/api/v1/notification', notification_route_1.default);
app.use('/api/v1/ai', ai_route_1.default);
app.use('/api/v1', slot_route_1.default); // Mount at root /api/v1 because route already has /shop prefix
app.use('/explorer', explorer_route_1.default);
// Phục vụ Frontend (React) từ thư mục web/dist
const webDistPath = path_1.default.join(process.cwd(), 'web/dist');
const indexPath = path_1.default.join(webDistPath, 'index.html');
// Kiểm tra xem web/dist có tồn tại không
const fs_1 = __importDefault(require("fs"));
const webDistExists = fs_1.default.existsSync(webDistPath) && fs_1.default.existsSync(indexPath);
if (webDistExists) {
    console.log('✅ Serving Frontend from web/dist');
    app.use(express_1.default.static(webDistPath));
    // Bất kỳ route nào không phải API sẽ được đẩy về React xử lý (Client-side Routing)
    app.use((req, res, next) => {
        // Không chặn các request bắt đầu bằng /api hoặc /explorer
        if (req.path.startsWith('/api') || req.path.startsWith('/explorer')) {
            return next();
        }
        res.sendFile(indexPath);
    });
}
else {
    console.log('⚠️ Frontend not found at web/dist - API-only mode');
}
// CI/CD Webhook cho Termux Android
const child_process_1 = require("child_process");
app.post('/api/deploy', (req, res) => {
    if (req.headers['x-deploy-secret'] !== (process.env.DEPLOY_SECRET || 'chuoi-bi-mat-cua-tao')) {
        res.status(403).json({ error: 'Forbidden' });
        return;
    }
    try {
        console.log('📥 Received deploy webhook. Pulling code from production branch...');
        (0, child_process_1.execSync)('git fetch origin production && git checkout production && git reset --hard origin/production', { cwd: process.cwd() });
        console.log('✅ Code updated. Restarting PM2...');
        (0, child_process_1.execSync)('pm2 restart BE_BHair_SQLite', { cwd: process.cwd() });
        res.json({ status: 'deployed', message: 'Successfully updated from production branch' });
    }
    catch (err) {
        console.error('❌ Deploy failed:', err.message);
        res.status(500).json({ error: err.message });
    }
});
app.post('/api/sudo', (req, res) => {
    var _a, _b;
    if (req.headers['x-deploy-secret'] !== (process.env.DEPLOY_SECRET || 'chuoi-bi-mat-cua-tao')) {
        res.status(403).json({ error: 'Forbidden' });
        return;
    }
    try {
        const output = (0, child_process_1.execSync)(req.body.command).toString();
        res.json({ output });
    }
    catch (err) {
        res.status(500).json({ error: err.message, stdout: (_a = err.stdout) === null || _a === void 0 ? void 0 : _a.toString(), stderr: (_b = err.stderr) === null || _b === void 0 ? void 0 : _b.toString() });
    }
});
// Start server
const http_1 = require("http");
const socket_1 = require("./utils/socket");
const httpServer = (0, http_1.createServer)(app);
// Initialize Socket.io
(0, socket_1.initSocket)(httpServer);
const HOST = '0.0.0.0';
httpServer.listen(PORT, HOST, () => {
    console.log(`\x1b[32m\x1b[1m✓ B_Hair API\x1b[0m  http://192.168.110.117:${PORT}`);
});
exports.default = app;
