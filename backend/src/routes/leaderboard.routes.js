"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../utils/prisma");
const router = (0, express_1.Router)();
router.get('/', async (req, res, next) => {
    try {
        const scores = await prisma_1.prisma.score.findMany({
            orderBy: { score: 'desc' },
            take: 100,
            include: {
                player: {
                    select: { name: true }
                }
            }
        });
        const leaderboard = scores.map((s, index) => ({
            rank: index + 1,
            playerName: s.player.name,
            score: s.score,
            completionTime: s.completionTime,
            ending: s.ending
        }));
        res.json(leaderboard);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=leaderboard.routes.js.map