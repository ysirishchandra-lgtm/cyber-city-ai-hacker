# SCAR — PRIYANSHU AWS BACKEND INTEGRATION AUDIT & SPECIFICATION

**Auditor:** Sirish (Lead / Master Integration Engineer)  
**Target Branch:** `origin/feature/priyanshu-unity-aws`  
**Current Status:** **BRANCH PENDING (Awaiting Unity AWS Service Layer Push)**  
**Target Core Branch:** `feature/sirish-unity-core` (`85bb6ca`)

---

## 1. Architectural Principles for Priyanshu's AWS Cloud Integration

```text
               ┌─────────────────────────────────┐
               │       SCAR CORE (SIRISH)        │
               │   GameManager & GameState       │
               └────────────────┬────────────────┘
                                │
               ┌────────────────┴────────────────┐
               │    IAWSBackendService Contract   │
               └────────────────┬────────────────┘
                                │
       ┌────────────────────────┼────────────────────────┐
       ↓                        ↓                        ↓
   AUTH SERVICE            SCORE TELEMETRY          LEADERBOARD
  (Amazon Cognito)        (API Gateway + Lambda)   (DynamoDB Global)
```

---

## 2. Mandatory Architectural Constraints

### A. Offline-First & Fail-Safe Rule
- **Correct Flow (Asynchronous Background Sync)**:
  $$\text{Gameplay} \longrightarrow \text{Local GameState} \longrightarrow \text{Async AWS Cloud Dispatch}$$
- **Strictly Prohibited Flow (Synchronous Blocking)**:
  $$\text{Gameplay} \longrightarrow \text{AWS Cloud Request} \longrightarrow \text{BLOCKING WAIT} \longrightarrow \text{Gameplay}$$
- **Failure Resilience**: If AWS is unreachable (e.g. no internet, timeout, 5xx error), the callback must return `(false, "Offline / Failed")` and the game must continue **100% uninterrupted**.

### B. Security & Credentials
- **ZERO AWS Secrets in Unity**: Never compile AWS IAM secret keys, root credentials, or database connection strings into C# scripts.
- Use Amazon Cognito Identity Pools (temporary scoped STS credentials) or API Gateway endpoints secured by Cognito JWT User Pool tokens.

### C. Zero Fake Data Policy
- **No Mock Production Records**: Never hardcode fake leaderboard users or demo scores.
- When DynamoDB contains 0 scores, the leaderboard UI cleanly renders `0` records / `"No players yet."`.

---

## 3. Interface Implementation Contract

Priyanshu must implement the `IAWSBackendService` interface defined in [`Assets/_Project/Scripts/Core/Interfaces/IAWSBackendService.cs`](file:///c:/Users/user/Desktop/college/Assets/_Project/Scripts/Core/Interfaces/IAWSBackendService.cs):

```csharp
namespace Scar.Backend
{
    using Scar.Core;
    using System;
    using System.Collections.Generic;
    using UnityEngine;

    public class AWSCloudService : MonoBehaviour, IAWSBackendService
    {
        public bool IsAuthenticated { get; private set; }
        public string ActivePlayerId { get; private set; }
        public string ActiveSessionId { get; private set; }

        public void RegisterUser(string username, string email, string password, Action<bool, string> onComplete)
        {
            // Amazon Cognito UserPool SignUp
        }

        public void AuthenticateUser(string email, string password, Action<bool, string> onComplete)
        {
            // Amazon Cognito InitiateAuth
        }

        public void StartGameSession(string playerId, Action<bool, string> onComplete)
        {
            // API Gateway POST /session -> Lambda -> DynamoDB
        }

        public void SubmitFinalScore(GameState state, Action<bool, string> onComplete)
        {
            // API Gateway POST /score -> Lambda -> DynamoDB
        }

        public void FetchGlobalLeaderboard(Action<bool, List<LeaderboardEntryDTO>> onComplete)
        {
            // API Gateway GET /leaderboard -> Lambda -> DynamoDB Query
        }
    }
}
```

---

## 4. Integration Registration Flow

In `AWSCloudService.Awake()` or `Start()`:
```csharp
void Start()
{
    if (GameManager.Instance != null)
    {
        GameManager.Instance.RegisterAWSBackend(this);
    }
}
```

---

## 5. Audit Verdict
**Status:** `READY FOR IMPLEMENTATION` (Core contract `IAWSBackendService` and data structures are frozen and verified).
