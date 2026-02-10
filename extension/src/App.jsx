import { useState, useEffect } from 'react'
import { Shield, AlertTriangle, CheckCircle, FileText, Search, RefreshCw, ChevronRight } from 'lucide-react';
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
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab?.id) {
        throw new Error("Could not identify current tab.");
      }

      const response = await chrome.tabs.sendMessage(tab.id, { action: "EXTRACT_TEXT" });

      if (!response || !response.text) {
        throw new Error("Could not extract text. Refresh the page and try again.");
      }

      const text = response.text;
      if (text.length < 50) {
        throw new Error("Page content is too short to analyze.");
      }

      // Using the production Render URL
      const apiResponse = await fetch('https://contract-scan.onrender.com/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!apiResponse.ok) {
        throw new Error(`Analysis failed: ${apiResponse.statusText}`);
      }

      const data = await apiResponse.json();
      setResult(data);

      if (data.risks && data.risks.length > 0) {
        chrome.tabs.sendMessage(tab.id, { action: "HIGHLIGHT_RISKS", risks: data.risks });
      }

    } catch (err) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981'; // Green
    if (score >= 60) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">
          <Shield size={20} className="logo-icon" />
          <h1>RiskScanner</h1>
        </div>
      </header>

      <main className="app-content">
        {!result && !loading && (
          <div className="empty-state">
            <div className="icon-badge">
              <FileText size={32} />
            </div>
            <h2>Scan this Contract</h2>
            <p>Analyze legal text for hidden risks and dangerous clauses in seconds.</p>
            <button className="btn-primary" onClick={scanContract}>
              <Search size={18} />
              Start Analysis
            </button>
          </div>
        )}

        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Analyzing document...</p>
          </div>
        )}

        {error && (
          <div className="error-card">
            <AlertTriangle size={20} />
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className="results-view">

            {/* Score Card */}
            <div className="score-card">
              <div className="score-ring" style={{ '--score-color': getScoreColor(result.score) }}>
                <span className="score-value">{result.score}</span>
                <span className="score-label">Safety</span>
              </div>
              <div className="score-status">
                <h3>{result.score >= 80 ? 'Safe Contract' : result.score >= 60 ? 'Moderate Risk' : 'High Risk'}</h3>
                <p>{result.risks.length} issues detected</p>
              </div>
            </div>

            {/* Summary */}
            <div className="section">
              <div className="section-header">
                <FileText size={16} />
                <h3>Summary</h3>
              </div>
              <p className="summary-text">{result.summary}</p>
            </div>

            {/* Risks */}
            <div className="section">
              <div className="section-header">
                <AlertTriangle size={16} />
                <h3>Risk Analysis</h3>
              </div>
              <div className="risk-list">
                {result.risks.map((risk, index) => (
                  <div key={index} className={`risk-card ${risk.severity}`}>
                    <div className="risk-header">
                      <span className="risk-tag">{risk.category}</span>
                    </div>
                    <p>{risk.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <button className="btn-secondary" onClick={scanContract}>
              <RefreshCw size={16} />
              Scan New Document
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
