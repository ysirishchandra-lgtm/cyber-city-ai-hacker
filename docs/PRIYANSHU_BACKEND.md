# PRIYANSHU_BACKEND API Integration

## Authentication

### `POST /api/auth/register`
**Payload:**
```json
{
  "name": "PlayerOne",
  "email": "player@example.com",
  "password": "securepassword123"
}
```
**Response:** `201 Created`
```json
{
  "id": "uuid",
  "name": "PlayerOne",
  "email": "player@example.com"
}
```

### `POST /api/auth/login`
**Payload:**
```json
{
  "email": "player@example.com",
  "password": "securepassword123"
}
```
**Response:** `200 OK`
```json
{
  "token": "jwt-token-string",
  "user": {
    "id": "uuid",
    "name": "PlayerOne",
    "email": "player@example.com"
  }
}
```

### `GET /api/auth/me`
Requires `Authorization: Bearer <token>`
**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "PlayerOne",
  "email": "player@example.com",
  "createdAt": "2026-08-20T14:48:00.000Z"
}
```

## Game Session

### `POST /api/game/session`
Requires `Authorization: Bearer <token>`
**Response:** `201 Created`
```json
{
  "id": "uuid-session-id",
  "playerId": "uuid-player-id",
  "startedAt": "2026-08-20T14:48:00.000Z",
  "status": "ACTIVE"
}
```

## Score Submission

### `POST /api/scores`
Requires `Authorization: Bearer <token>`
**Payload:**
```json
{
  "sessionId": "uuid-session-id",
  "score": 15000,
  "powerPath": "CYBER",
  "ending": "GOOD",
  "enemiesDefeated": 10,
  "missionsCompleted": 5,
  "choicesCount": 3,
  "damageReceived": 100,
  "powerUsage": 50,
  "completionTime": 120
}
```
**Response:** `201 Created`
Returns the saved Score object. The corresponding GameSession is marked as `COMPLETED`.

## Leaderboard

### `GET /api/leaderboard`
**Response:** `200 OK`
Returns top 100 scores globally. Empty array `[]` if no scores exist.
```json
[
  {
    "rank": 1,
    "playerName": "PlayerOne",
    "score": 15000,
    "completionTime": 120,
    "ending": "GOOD"
  }
]
```

## Health

### `GET /api/health`
**Response:** `200 OK`
```json
{
  "status": "ok"
}
```
