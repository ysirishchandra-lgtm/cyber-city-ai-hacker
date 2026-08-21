using System.Collections;
using System.Collections.Generic;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.TestTools;
using Scar.Backend;
using Scar.Core;

namespace Scar.Backend.Tests
{
    public class AWSBackendServiceTests
    {
        private AWSBackendService _backendService;
        private AWSConfig _config;

        [SetUp]
        public void Setup()
        {
            var go = new GameObject("BackendTest");
            _backendService = go.AddComponent<AWSBackendService>();
            
            _config = ScriptableObject.CreateInstance<AWSConfig>();
            _config.apiBaseUrl = "https://mock.example.com";
            
            // Assuming we inject or it handles default creation, but here we let Awake handle it.
            // Since we can't inject easily without modifying access, Awake will create a default one.
        }

        [TearDown]
        public void Teardown()
        {
            var localSave = new LocalSaveService();
            localSave.DeleteSave();
            
            if (_backendService != null)
            {
                Object.DestroyImmediate(_backendService.gameObject);
            }
        }

        [Test]
        public void LocalSave_SuccessfullyWritesAndReads()
        {
            var localSave = new LocalSaveService();
            var data = new GameSaveData
            {
                playerId = "test_player",
                playerName = "Test",
                score = 1000,
                ending = "HERO",
                revenge = 10f
            };

            localSave.Save(data);
            var loaded = localSave.Load();

            Assert.IsNotNull(loaded);
            Assert.AreEqual("test_player", loaded.playerId);
            Assert.AreEqual(1000, loaded.score);
            Assert.AreEqual("HERO", loaded.ending);
        }

        [Test]
        public void SubmitScore_SavesLocallyAsFallback()
        {
            var gameState = new GameState();
            gameState.SetPlayerIdentity("offline_user", "Offline Player");
            gameState.AddScore(500);
            gameState.SetEnding("HUMAN", 0);

            bool calledCallback = false;
            _backendService.SubmitFinalScore(gameState, (success, msg) => 
            {
                calledCallback = true;
            });

            Assert.IsTrue(calledCallback);

            // Verify local save exists
            var localSave = new LocalSaveService();
            var loaded = localSave.Load();

            Assert.IsNotNull(loaded);
            Assert.AreEqual("offline_user", loaded.playerId);
            Assert.AreEqual(500, loaded.score);
        }

        [UnityTest]
        public IEnumerator FetchLeaderboard_ReturnsEmptyOnFailure()
        {
            bool finished = false;
            List<LeaderboardEntryDTO> result = null;

            _backendService.FetchGlobalLeaderboard((success, data) => 
            {
                finished = true;
                result = data;
            });

            yield return new WaitUntil(() => finished);

            Assert.IsNotNull(result);
            Assert.AreEqual(0, result.Count);
        }
    }
}
