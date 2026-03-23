import React, { useState, useMemo } from "react";
import CallPage from "./CallPage";
import "./index.css";

function App() {
  const [file, setFile] = useState(null);
  const [theme, setTheme] = useState("Sell the latest iPhone 16 Pro and direct them to our website.");
  const [calls, setCalls] = useState([]);
  const [activeCallIndex, setActiveCallIndex] = useState(null);

  const uploadCampaign = async () => {
    if (!file) {
      alert("Please select an Excel file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("theme", theme);

    try {
      const res = await fetch(`http://${window.location.hostname}:8000/upload-campaign`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      setCalls(data.calls);
    } catch (err) {
      alert("Failed to upload campaign. Backend might be down.");
    }
  };

  const startCampaign = () => {
    if (calls.length === 0) {
      alert("Please upload a campaign first");
      return;
    }
    setActiveCallIndex(0);
  };

  const handleCallEnd = (finalStatus = "completed") => {
    // We receive actual Twilio status from CallPage
    setCalls(prev => prev.map((c, i) => i === activeCallIndex ? { ...c, status: finalStatus } : c));
    
    if (activeCallIndex < calls.length - 1) {
      setActiveCallIndex(activeCallIndex + 1);
    } else {
      setTimeout(() => {
        alert("Campaign Finished!");
        setActiveCallIndex(null);
      }, 500);
    }
  };

  const stopCampaign = () => {
    setActiveCallIndex(null);
  };

  // Derived Stats
  const stats = useMemo(() => {
    const total = calls.length;
    let received = 0;
    let failedMissed = 0;
    let pending = 0;

    calls.forEach(c => {
      // Treat "completed" as Received
      if (c.status === "completed") {
        received++;
      } 
      // Treat all these as Failed/Missed
      else if (["failed", "busy", "no-answer", "canceled", "skipped"].includes(c.status)) {
        failedMissed++;
      }
      // Pending
      else {
        pending++;
      }
    });

    return { total, received, failedMissed, pending };
  }, [calls]);

  // Helper to get beautiful badge styles and labels
  const getStatusBadge = (status, isCallingNow) => {
    if (isCallingNow) return <span className="badge badge-calling">Calling Now...</span>;
    if (status === "completed") return <span className="badge badge-received">Received</span>;
    if (["failed", "busy", "no-answer", "canceled"].includes(status)) return <span className="badge badge-failed">{status === "no-answer" ? "Missed" : "Failed"}</span>;
    if (status === "skipped") return <span className="badge badge-skipped">Skipped</span>;
    return <span className="badge badge-pending">Pending</span>;
  };

  return (
    <div className="dashboard-container">
      <h1 className="header-title">AI Agent Dashboard</h1>

      {/* Stats Section */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Contacts</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "#34d399" }}>{stats.received}</div>
          <div className="stat-label">Calls Received</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "#f87171" }}>{stats.failedMissed}</div>
          <div className="stat-label">Missed / Failed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "#cbd5e1" }}>{stats.pending}</div>
          <div className="stat-label">Pending Left</div>
        </div>
      </div>

      {/* Campaign Controls */}
      <div className="glass-panel">
        <div className="input-group">
          <label className="input-label">Campaign Theme / AI Instructions:</label>
          <textarea 
            className="theme-textarea"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="e.g. You are selling the latest Apple Phone..."
          />
        </div>
        <div className="controls-row">
          <input
            type="file"
            className="file-input"
            onChange={(e) => setFile(e.target.files[0])}
          />
          <button className="btn btn-primary" onClick={uploadCampaign}>
            Upload Target List
          </button>
          <button className="btn btn-success" onClick={startCampaign}>
            Start Auto-Campaign
          </button>
        </div>
      </div>

      {/* Active Call State */}
      {activeCallIndex !== null && (
        <div className="glass-panel active-call-banner">
            <div className="active-call-header">
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#60a5fa' }}>
                LIVE DIALER: Calling {calls[activeCallIndex].name}
              </h3>
              <button className="btn btn-danger" onClick={stopCampaign} style={{ padding: '6px 16px', fontSize: '0.9rem' }}>
                  Stop Campaign
              </button>
            </div>
            
            <CallPage 
              key={calls[activeCallIndex].id}
              inlineCallId={calls[activeCallIndex].id} 
              onEndCall={handleCallEnd} 
              autoStart={true} 
            />
        </div>
      )}

      {/* Queue Table */}
      <div className="glass-panel">
        <h2 style={{ marginBottom: '20px', fontSize: '1.5rem', fontWeight: 600 }}>Calls Log</h2>
        {calls.length > 0 ? (
          <div className="table-container">
            <table className="call-table">
              <thead>
                <tr>
                  <th>Contact Name</th>
                  <th>Phone Number</th>
                  <th>Call Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {calls.map((call, index) => (
                  <tr key={call.id}>
                    <td style={{ fontWeight: 500 }}>{call.name}</td>
                    <td>{call.phone}</td>
                    <td>
                      {getStatusBadge(call.status, index === activeCallIndex)}
                    </td>
                    <td>
                      <a href={call.call_link || "#"} target="_blank" rel="noreferrer" className="link-btn">
                        View Details
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: "#94a3b8", textAlign: "center", padding: "20px 0" }}>No contacts uploaded. Please upload a target list to begin.</p>
        )}
      </div>
    </div>
  );
}

export default App;