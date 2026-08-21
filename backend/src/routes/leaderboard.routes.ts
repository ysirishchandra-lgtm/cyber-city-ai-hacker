import { Router } from 'express';
import { prisma } from '../utils/prisma';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const scores = await prisma.score.findMany({
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
  } catch (error) {
    next(error);
  }
});

export default router;
