"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const game_routes_1 = __importDefault(require("./routes/game.routes"));
const score_routes_1 = __importDefault(require("./routes/score.routes"));
const leaderboard_routes_1 = __importDefault(require("./routes/leaderboard.routes"));
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});
app.use('/api/auth', auth_routes_1.default);
app.use('/api/game', game_routes_1.default);
app.use('/api/scores', score_routes_1.default);
app.use('/api/leaderboard', leaderboard_routes_1.default);
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map