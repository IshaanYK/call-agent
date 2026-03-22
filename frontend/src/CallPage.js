import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

function CallPage({ inlineCallId, onEndCall, autoStart }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const callIdToUse = inlineCallId || id;
    const [status, setStatus] = useState("Idle");
    const intervalRef = useRef(null);

    const startCall = async () => {
        setStatus("Initiating Call via Twilio...");
        try {
            const res = await fetch(`http://${window.location.hostname}:8000/start-call`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ call_id: callIdToUse })
            });
            const data = await res.json();
            
            if (data.sid) {
                pollStatus(data.sid);
            } else {
                setStatus("Error: Call was not routed to Twilio (unverified number or credentials error).");
                setTimeout(() => { if (onEndCall) onEndCall(); }, 4000);
            }
        } catch (err) {
            setStatus("Error starting call.");
            setTimeout(() => { if (onEndCall) onEndCall(); }, 4000);
        }
    };

    const pollStatus = (sid) => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(async () => {
            try {
                const res = await fetch(`http://${window.location.hostname}:8000/call-status/${sid}`);
                const data = await res.json();
                
                if (data.status === "completed" || data.status === "failed" || data.status === "busy" || data.status === "no-answer" || data.status === "canceled") {
                    clearInterval(intervalRef.current);
                    setStatus(`Call ended (${data.status}). Moving to next...`);
                    setTimeout(() => {
                        if (onEndCall) onEndCall();
                    }, 2000);
                } else if (data.status === "in-progress") {
                    setStatus("Call is connected! (If you hear a Twilio Trial message, press ANY KEY on your dialpad to clear it and hear the AI!)");
                } else {
                    setStatus(`Twilio Status: ${data.status}...`);
                }
            } catch (e) {
                 clearInterval(intervalRef.current);
            }
        }, 3000);
    };

    useEffect(() => {
        if (autoStart) startCall();
        return () => {
             if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [autoStart]);

    return (
        <div style={{ padding: 40, border: inlineCallId ? '1px solid #ccc' : 'none', marginTop: 20 }}>
            {inlineCallId ? <h2>Active AI Session</h2> : <h1>AI Auto-Dialer Agent</h1>}
            <p><strong>Session ID:</strong> {callIdToUse}</p>
            <p><strong>Status:</strong> <span style={{color: status.includes("Error") ? "red" : (status.includes("connected") ? "green" : "black"), fontWeight: "bold"}}>{status}</span></p>

            {status === "Idle" && (
                <button onClick={startCall} style={{ padding: '10px 20px', fontSize: '16px' }}>
                    Start Call
                </button>
            )}

            {inlineCallId && (
                <button onClick={() => onEndCall && onEndCall()} style={{ padding: '10px 20px', fontSize: '16px', marginLeft: 10, background: '#ff4d4d', color: 'white', border: 'none', cursor: 'pointer' }}>
                    Force Skip / End
                </button>
            )}

            {!inlineCallId && (
                <button onClick={() => navigate("/")} style={{ padding: '10px 20px', fontSize: '16px', marginLeft: 10 }}>
                    Back to Dashboard
                </button>
            )}
        </div>
    );
}

export default CallPage;