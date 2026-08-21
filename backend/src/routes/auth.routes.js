"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../utils/prisma");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforlocaldevelopmentonly';
router.post('/register', async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }
        const existingPlayer = await prisma_1.prisma.player.findFirst({
            where: { OR: [{ email }, { name }] },
        });
        if (existingPlayer) {
            return res.status(409).json({ error: 'User with this email or name already exists' });
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const player = await prisma_1.prisma.player.create({
            data: { name, email, passwordHash },
        });
        res.status(201).json({ id: player.id, name: player.name, email: player.email });
    }
    catch (error) {
        next(error);
    }
});
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const player = await prisma_1.prisma.player.findUnique({ where: { email } });
        if (!player) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const valid = await bcryptjs_1.default.compare(password, player.passwordHash);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ id: player.id }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: player.id, name: player.name, email: player.email } });
    }
    catch (error) {
        next(error);
    }
});
router.get('/me', auth_1.authenticate, async (req, res, next) => {
    try {
        const player = await prisma_1.prisma.player.findUnique({
            where: { id: req.user.id },
            select: { id: true, name: true, email: true, createdAt: true },
        });
        if (!player)
            return res.status(404).json({ error: 'Player not found' });
        res.json(player);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=auth.routes.js.map