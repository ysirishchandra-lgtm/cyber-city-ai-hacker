import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforlocaldevelopmentonly';

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existingPlayer = await prisma.player.findFirst({
      where: { OR: [{ email }, { name }] },
    });

    if (existingPlayer) {
      return res.status(409).json({ error: 'User with this email or name already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const player = await prisma.player.create({
      data: { name, email, passwordHash },
    });

    res.status(201).json({ id: player.id, name: player.name, email: player.email });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const player = await prisma.player.findUnique({ where: { email } });
    if (!player) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, player.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: player.id }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: player.id, name: player.name, email: player.email } });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const player = await prisma.player.findUnique({
      where: { id: req.user!.id },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    if (!player) return res.status(404).json({ error: 'Player not found' });
    res.json(player);
  } catch (error) {
    next(error);
  }
});

export default router;
