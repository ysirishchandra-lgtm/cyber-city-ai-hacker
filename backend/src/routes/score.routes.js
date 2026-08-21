"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../utils/prisma");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/', auth_1.authenticate, async (req, res, next) => {
    try {
        const playerId = req.user.id;
        const { sessionId, score, powerPath, ending, enemiesDefeated, missionsCompleted, choicesCount, damageReceived, powerUsage, completionTime, } = req.body;
        if (!sessionId)
            return res.status(400).json({ error: 'sessionId is required' });
        // Validate values to avoid trusting client blindly
        if (score < 0)
            return res.status(400).json({ error: 'Score cannot be negative' });
        if (enemiesDefeated < 0)
            return res.status(400).json({ error: 'Enemies defeated cannot be negative' });
        if (missionsCompleted < 0)
            return res.status(400).json({ error: 'Missions completed cannot be negative' });
        if (completionTime < 0)
            return res.status(400).json({ error: 'Completion time cannot be negative' });
        if (!powerPath || !ending)
            return res.status(400).json({ error: 'Power path and ending are required' });
        // Verify session belongs to user and is ACTIVE
        const session = await prisma_1.prisma.gameSession.findUnique({ where: { id: sessionId } });
        if (!session)
            return res.status(404).json({ error: 'Session not found' });
        if (session.playerId !== playerId)
            return res.status(403).json({ error: 'Session does not belong to user' });
        if (session.status !== 'ACTIVE')
            return res.status(400).json({ error: 'Session is not active' });
        // Save score
        const result = await prisma_1.prisma.score.create({
            data: {
                playerId,
                sessionId,
                score,
                powerPath,
                ending,
                enemiesDefeated,
                missionsCompleted,
                choicesCount: choicesCount || 0,
                damageReceived: damageReceived || 0,
                powerUsage: powerUsage || 0,
                completionTime,
            },
        });
        // Mark session as COMPLETED
        await prisma_1.prisma.gameSession.update({
            where: { id: sessionId },
            data: { status: 'COMPLETED', completedAt: new Date() },
        });
        res.status(201).json(result);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=score.routes.js.map