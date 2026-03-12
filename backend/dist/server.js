"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const errorHandler_1 = require("./middleware/errorHandler");
// Import routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const thoughts_routes_1 = __importDefault(require("./routes/thoughts.routes"));
const questions_routes_1 = __importDefault(require("./routes/questions.routes"));
const answers_routes_1 = __importStar(require("./routes/answers.routes"));
const streak_routes_1 = __importDefault(require("./routes/streak.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 5000;
// ─── Middleware ─────────────────────────────────────────────────────
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));
app.use(express_1.default.json());
// ─── Health Check ───────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
});
// ─── Routes ─────────────────────────────────────────────────────────
app.use('/api/auth', auth_routes_1.default);
app.use('/api/thoughts', thoughts_routes_1.default);
app.use('/api/questions', questions_routes_1.default);
app.use('/api/answers', answers_routes_1.default);
app.use('/api/student/answers', answers_routes_1.studentAnswersRouter);
app.use('/api/student/streak', streak_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
// Convenience aliases (student-user frontend calls these)
app.use('/api/streak', streak_routes_1.default);
// ─── Error Handler ──────────────────────────────────────────────────
app.use(errorHandler_1.errorHandler);
// ─── Start ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚀 Backend listening on http://localhost:${PORT}`);
    console.log(`📋 Routes:`);
    console.log(`   /api/auth       — Authentication`);
    console.log(`   /api/thoughts   — Thoughts (public GET)`);
    console.log(`   /api/questions  — Questions (public GET)`);
    console.log(`   /api/answers    — Answers (admin)`);
    console.log(`   /api/student/*  — Student endpoints`);
    console.log(`   /api/admin/*    — Admin endpoints`);
    console.log(`   /health         — Health check`);
});
exports.default = app;
//# sourceMappingURL=server.js.map