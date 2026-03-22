import React, { useState } from "react";
import CallPage from "./CallPage";

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

    const res = await fetch(`http://${window.location.hostname}:8000/upload-campaign`, {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    setCalls(data.calls);

  };

  const startCampaign = () => {
    if (calls.length === 0) {
      alert("Please upload a campaign first");
      return;
    }
    setActiveCallIndex(0);
  };

  const handleCallEnd = () => {
    setCalls(prev => prev.map((c, i) => i === activeCallIndex ? { ...c, status: "completed" } : c));
    
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

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <h1>AI Call Agent Dashboard</h1>

      <div style={{ marginBottom: 20 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Campaign Theme / AI Instructions:</label>
            <textarea 
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              style={{ width: '100%', maxWidth: '500px', height: '80px', marginBottom: '10px', padding: '10px' }}
              placeholder="e.g. You are selling the latest Apple Phone..."
            />
          </div>
          <div>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
            />
            <button onClick={uploadCampaign} style={{ marginLeft: 10, padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
              Upload Campaign
            </button>
            <button onClick={startCampaign} style={{ marginLeft: 10, padding: '8px 16px', background: '#28a745', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
              Start Auto-Campaign
            </button>
          </div>
      </div>

      {activeCallIndex !== null && (
        <div style={{ marginTop: 20, padding: 20, border: '2px dashed #007bff', background: '#f8f9fa' }}>
            <h3 style={{ marginTop: 0 }}>Running Auto-Dialer... Calling {calls[activeCallIndex].name}</h3>
            <button onClick={stopCampaign} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '8px 16px', cursor: 'pointer' }}>
                Stop Campaign
            </button>
            <CallPage 
              key={calls[activeCallIndex].id}
              inlineCallId={calls[activeCallIndex].id} 
              onEndCall={handleCallEnd} 
              autoStart={true} 
            />
        </div>
      )}

      <h2>Calls Queue</h2>
      <ul>
        {calls.map((call, index) => (
          <li key={call.id} style={{ marginBottom: 10 }}>
            <b>{call.name}</b> - {call.phone} - 
            <span style={{ 
                color: call.status === 'completed' ? 'green' : (index === activeCallIndex ? 'blue' : 'black'),
                fontWeight: index === activeCallIndex ? 'bold' : 'normal',
                marginLeft: 5
            }}>
                [{index === activeCallIndex ? 'calling now' : call.status}]
            </span>
            <br />
            <a href={call.call_link} target="_blank" rel="noreferrer" style={{ fontSize: '0.9em' }}>
              Manual Call Link
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;