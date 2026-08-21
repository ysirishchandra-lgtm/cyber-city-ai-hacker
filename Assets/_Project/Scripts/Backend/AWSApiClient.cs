using System;
using System.Text;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Networking;

namespace Scar.Backend
{
    public class AWSApiClient
    {
        private readonly AWSConfig _config;
        private string _authToken = string.Empty;

        public AWSApiClient(AWSConfig config)
        {
            _config = config;
        }

        public void SetAuthToken(string token)
        {
            _authToken = token;
        }

        public async Task<T> GetAsync<T>(string endpoint)
        {
            string url = (_config != null ? _config.apiBaseUrl : "https://api.cybercity.local") + endpoint;
            int maxRetries = _config != null ? _config.maxRetries : 2;
            int timeout = _config != null ? _config.timeoutSeconds : 5;
            int attempts = 0;

            while (attempts <= maxRetries)
            {
                using (var req = UnityWebRequest.Get(url))
                {
                    req.timeout = timeout;
                    if (!string.IsNullOrEmpty(_authToken))
                    {
                        req.SetRequestHeader("Authorization", "Bearer " + _authToken);
                    }

                    var operation = req.SendWebRequest();
                    while (!operation.isDone)
                    {
                        await Task.Yield();
                    }

                    if (req.result == UnityWebRequest.Result.Success)
                    {
                        return JsonUtility.FromJson<T>(req.downloadHandler.text);
                    }

                    attempts++;
                    if (attempts > maxRetries)
                    {
                        Debug.LogError("[AWSApiClient] GET " + url + " failed: " + req.error);
                        return default(T);
                    }
                }
            }
            return default(T);
        }

        public async Task<T> PostAsync<T>(string endpoint, object payload)
        {
            string url = (_config != null ? _config.apiBaseUrl : "https://api.cybercity.local") + endpoint;
            int maxRetries = _config != null ? _config.maxRetries : 2;
            int timeout = _config != null ? _config.timeoutSeconds : 5;
            int attempts = 0;
            string json = JsonUtility.ToJson(payload);

            while (attempts <= maxRetries)
            {
                using (var req = new UnityWebRequest(url, "POST"))
                {
                    req.timeout = timeout;
                    byte[] bodyRaw = Encoding.UTF8.GetBytes(json);
                    req.uploadHandler = new UploadHandlerRaw(bodyRaw);
                    req.downloadHandler = new DownloadHandlerBuffer();
                    req.SetRequestHeader("Content-Type", "application/json");

                    if (!string.IsNullOrEmpty(_authToken))
                    {
                        req.SetRequestHeader("Authorization", "Bearer " + _authToken);
                    }

                    var operation = req.SendWebRequest();
                    while (!operation.isDone)
                    {
                        await Task.Yield();
                    }

                    if (req.result == UnityWebRequest.Result.Success)
                    {
                        if (typeof(T) == typeof(bool)) return (T)(object)true;
                        return JsonUtility.FromJson<T>(req.downloadHandler.text);
                    }

                    attempts++;
                    if (attempts > maxRetries)
                    {
                        Debug.LogError("[AWSApiClient] POST " + url + " failed: " + req.error);
                        if (typeof(T) == typeof(bool)) return (T)(object)false;
                        return default(T);
                    }
                }
            }
            if (typeof(T) == typeof(bool)) return (T)(object)false;
            return default(T);
        }
    }
}
