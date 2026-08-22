using System.Collections;
using UnityEngine;
using UnityEngine.Networking;

namespace Scar.Core
{
    public enum PlayerProfile { Mercy, Revenge, Unknown }

    /// <summary>
    /// Acts as the central memory of the game, communicating with the AWS backend.
    /// Fetches the Round 1 decisions to shape the Round 2 psychological experience.
    /// </summary>
    public class GameStateManager : MonoBehaviour
    {
        public static GameStateManager Instance { get; private set; }

        [Header("AWS Config")]
        [SerializeField] private string _awsLambdaEndpoint = "https://api.example.com/scar/profile";
        [SerializeField] private string _playerId = "PLAYER_001";

        public PlayerProfile CurrentProfile { get; private set; } = PlayerProfile.Unknown;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        private void Start()
        {
            // On Level 2 load, retrieve the memory profile from the cloud
            StartCoroutine(FetchPlayerProfileRoutine());
        }

        /// <summary>
        /// Simulates an API GET request to AWS Lambda/DynamoDB.
        /// </summary>
        private IEnumerator FetchPlayerProfileRoutine()
        {
            Debug.Log($"[GameStateManager] Fetching AWS profile for {_playerId}...");

            string requestUrl = $"{_awsLambdaEndpoint}?playerId={_playerId}";
            
            using (UnityWebRequest request = UnityWebRequest.Get(requestUrl))
            {
                // Note: For a live hackathon, you can drop this wait if AWS isn't ready
                // and fallback to a mocked state.
                yield return request.SendWebRequest();

                if (request.result == UnityWebRequest.Result.ConnectionError || request.result == UnityWebRequest.Result.ProtocolError)
                {
                    Debug.LogError($"[GameStateManager] AWS Fetch failed: {request.error}. Defaulting to Revenge.");
                    CurrentProfile = PlayerProfile.Revenge; // Fallback for presentation
                }
                else
                {
                    // Parse the JSON response. Mocking parse logic here.
                    string jsonResponse = request.downloadHandler.text;
                    Debug.Log($"[GameStateManager] AWS Response: {jsonResponse}");

                    // Mock deserialization: {"profile": "Mercy"}
                    if (jsonResponse.Contains("Mercy"))
                    {
                        CurrentProfile = PlayerProfile.Mercy;
                    }
                    else
                    {
                        CurrentProfile = PlayerProfile.Revenge;
                    }
                }
            }

            Debug.Log($"[GameStateManager] Round 2 State Initialized. Profile locked as: {CurrentProfile}");
        }
    }
}
