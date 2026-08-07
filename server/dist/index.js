"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Express Server Bootstrap with Admin Routes
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const task_routes_1 = __importDefault(require("./routes/task.routes"));
const kpi_routes_1 = __importDefault(require("./routes/kpi.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const db_1 = __importDefault(require("./config/db"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// API Route Mounts
app.use('/api/auth', auth_routes_1.default);
app.use('/api/tasks', task_routes_1.default);
app.use('/api/kpi', kpi_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
// Root API Endpoint
app.get('/api', (req, res) => {
    res.json({
        name: 'TaskFlow API Server',
        status: 'running',
        endpoints: {
            health: 'GET /api/health',
            auth: 'POST /api/auth/login',
            tasks: 'GET /api/tasks',
            kpi: 'GET /api/kpi/leaderboard',
            admin: 'GET /api/admin/users',
        },
    });
});
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.listen(PORT, async () => {
    console.log(`🚀 TaskFlow Express Server running on http://localhost:${PORT}`);
    try {
        await (0, db_1.default)();
    }
    catch (err) {
        console.warn('⚠️ Server running, but SQL Server connection failed. Verify credentials in .env');
    }
});
exports.default = app;
