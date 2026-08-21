using UnityEngine;

namespace Scar.Backend
{
    [CreateAssetMenu(fileName = "AWSConfig", menuName = "SCAR/AWS Config")]
    public class AWSConfig : ScriptableObject
    {
        [Header("API Gateway")]
        public string apiBaseUrl = "https://api.example.com";
        
        [Header("Cognito")]
        public string userPoolId = "";
        public string clientId = "";
        
        [Header("Network")]
        public int timeoutSeconds = 10;
        public int maxRetries = 1;
    }
}
