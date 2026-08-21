"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../utils/prisma");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/session', auth_1.authenticate, async (req, res, next) => {
    try {
        const playerId = req.user.id;
        const session = await prisma_1.prisma.gameSession.create({
            data: {
                playerId,
                status: 'ACTIVE',
            },
        });
        res.status(201).json(session);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=game.routes.js.map