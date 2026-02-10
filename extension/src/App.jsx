import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const scanContract = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // 1. Get current tab ID
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab?.id) {
        throw new Error("Could not identify current tab.");
      }

      // 2. Execute script or send message to content script to get text
      // We rely on content script already being injected via manifest
      const response = await chrome.tabs.sendMessage(tab.id, { action: "EXTRACT_TEXT" });

      if (!response || !response.text) {
        throw new Error("Could not extract text from page. Try reloading the page.");
      }

      const text = response.text;

      if (text.length < 50) {
        throw new Error("Not enough text found to analyze.");
      }

      // 3. Send text to Backend
      const apiResponse = await fetch('http://localhost:8000/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!apiResponse.ok) {
        throw new Error(`API Error: ${apiResponse.statusText}`);
      }

      const data = await apiResponse.json();
      setResult(data);

      // 4. Highlight risks
      if (data.risks && data.risks.length > 0) {
        chrome.tabs.sendMessage(tab.id, { action: "HIGHLIGHT_RISKS", risks: data.risks });
      }

    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>AI Contract Scanner</h1>
      </header>

      <main>
        {!result && !loading && (
          <div className="start-screen">
            <p>Open a contract or terms page and click scan.</p>
            <button className="scan-btn" onClick={scanContract}>
              Scan Now
            </button>
          </div>
        )}

        {loading && <div className="loader">Analyzing Contract...</div>}

        {error && <div className="error">{error}</div>}

        {result && (
          <div className="results">
            <div className="score-card">
              <div className="score-circle" style={{ borderColor: getScoreColor(result.score) }}>
                {result.score}
              </div>
              <span>Safety Score</span>
            </div>

            <div className="summary">
              <h3>Summary</h3>
              <p>{result.summary}</p>
            </div>

            <div className="risks">
              <h3>Risks Found ({result.risks.length})</h3>
              {result.risks.map((risk, index) => (
                <div key={index} className={`risk-item ${risk.severity}`}>
                  <div className="risk-header">
                    <span className="risk-cat">{risk.category}</span>
                    <span className="risk-sev">{risk.severity}</span>
                  </div>
                  <p>{risk.description}</p>
                </div>
              ))}
            </div>

            <button className="scan-btn secondary" onClick={scanContract}>
              Scan Again
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

function getScoreColor(score) {
  if (score >= 80) return '#4caf50';
  if (score >= 60) return '#ff9800';
  return '#f44336';
}

export default App
