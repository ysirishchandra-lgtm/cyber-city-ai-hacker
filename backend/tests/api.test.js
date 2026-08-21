"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app"));
const prisma_1 = require("../src/utils/prisma");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforlocaldevelopmentonly';
beforeAll(async () => {
    // Clear the DB before tests
    await prisma_1.prisma.score.deleteMany();
    await prisma_1.prisma.gameSession.deleteMany();
    await prisma_1.prisma.player.deleteMany();
});
afterAll(async () => {
    await prisma_1.prisma.$disconnect();
});
describe('API Tests', () => {
    let userToken;
    let userId;
    let sessionId;
    describe('Health Check', () => {
        it('should return ok', async () => {
            const res = await (0, supertest_1.default)(app_1.default).get('/api/health');
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('ok');
        });
    });
    describe('Leaderboard', () => {
        it('should return empty leaderboard initially', async () => {
            const res = await (0, supertest_1.default)(app_1.default).get('/api/leaderboard');
            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });
    });
    describe('Authentication', () => {
        it('should fail registration with missing fields', async () => {
            const res = await (0, supertest_1.default)(app_1.default).post('/api/auth/register').send({
                email: 'test@example.com'
            });
            expect(res.status).toBe(400);
        });
        it('should register a real player', async () => {
            const res = await (0, supertest_1.default)(app_1.default).post('/api/auth/register').send({
                name: 'RealPlayerOne',
                email: 'real@example.com',
                password: 'securepassword123'
            });
            expect(res.status).toBe(201);
            expect(res.body.name).toBe('RealPlayerOne');
            userId = res.body.id;
        });
        it('should login and get token', async () => {
            const res = await (0, supertest_1.default)(app_1.default).post('/api/auth/login').send({
                email: 'real@example.com',
                password: 'securepassword123'
            });
            expect(res.status).toBe(200);
            expect(res.body.token).toBeDefined();
            userToken = res.body.token;
        });
        it('should block unauthorized requests', async () => {
            const res = await (0, supertest_1.default)(app_1.default).get('/api/auth/me');
            expect(res.status).toBe(401);
        });
        it('should get profile with valid token', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.status).toBe(200);
            expect(res.body.name).toBe('RealPlayerOne');
        });
    });
    describe('Game Sessions & Scores', () => {
        it('should create a game session', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/api/game/session')
                .set('Authorization', `Bearer ${userToken}`);
            expect(res.status).toBe(201);
            expect(res.body.status).toBe('ACTIVE');
            sessionId = res.body.id;
        });
        it('should block invalid score payloads', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/api/scores')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                sessionId,
                score: -50, // invalid
                powerPath: 'CYBER',
                ending: 'GOOD',
                enemiesDefeated: 10,
                missionsCompleted: 5,
                completionTime: 120
            });
            expect(res.status).toBe(400);
            expect(res.body.error).toContain('negative');
        });
        it('should accept valid score submission', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/api/scores')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                sessionId,
                score: 15000,
                powerPath: 'CYBER',
                ending: 'GOOD',
                enemiesDefeated: 10,
                missionsCompleted: 5,
                choicesCount: 3,
                damageReceived: 100,
                powerUsage: 50,
                completionTime: 120
            });
            expect(res.status).toBe(201);
            expect(res.body.score).toBe(15000);
        });
        it('should populate leaderboard', async () => {
            const res = await (0, supertest_1.default)(app_1.default).get('/api/leaderboard');
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(1);
            expect(res.body[0].playerName).toBe('RealPlayerOne');
            expect(res.body[0].score).toBe(15000);
        });
    });
});
//# sourceMappingURL=api.test.js.map