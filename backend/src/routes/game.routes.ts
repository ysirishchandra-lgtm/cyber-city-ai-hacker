import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/session', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const playerId = req.user!.id;
    const session = await prisma.gameSession.create({
      data: {
        playerId,
        status: 'ACTIVE',
      },
    });
    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
});

export default router;
