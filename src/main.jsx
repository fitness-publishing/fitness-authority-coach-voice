import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ConversationProvider,
  useConversationControls,
  useConversationInput,
  useConversationMode,
  useConversationStatus
} from "@elevenlabs/react";
import "./styles.css";

const AGENT_ID = "agent_0101kzh93spaer0acy9nef2agqm4";

function VoiceCoach() {
  const { startSession, endSession } = useConversationControls();
  const { status } = useConversationStatus();
  const { isMuted, setMuted } = useConversationInput();
  const { isSpeaking, isListening } = useConversationMode();
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);

  const connected = status === "connected";
  const connecting = status === "connecting" || starting;

  async function handleStart() {
    setError("");
    setStarting(true);

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      await startSession({
        agentId: AGENT_ID,
        onError: (message) => {
          setError(typeof message === "string" ? message : "Something went wrong. Please try again.");
        }
      });
    } catch (err) {
      console.error(err);
      setError(
        "Microphone access is required for a voice coaching session. Please allow microphone access and try again."
      );
    } finally {
      setStarting(false);
    }
  }

  async function handleEnd() {
    setError("");
    await endSession();
  }

  let statusText = "Ready when you are";
  if (connecting) statusText = "Connecting...";
  if (connected && isSpeaking) statusText = "Coach is responding";
  else if (connected && isListening) statusText = "Listening";
  else if (connected) statusText = "Session connected";

  return (
    <main className="shell">
      <section className="coach-card" aria-label="The Fitness Authority Coach voice session">
        <div className="mark" aria-hidden="true">FAC</div>
        <div className="eyebrow">THE FITNESS AUTHORITY COACH</div>
        <h1>Ready to work through something?</h1>
        <p className="intro">
          Start a focused voice coaching session. Work through one issue at a time
          and leave with a clear next step.
        </p>

        <div className={`status ${connected ? "live" : ""}`}>
          <span className="status-dot" aria-hidden="true"></span>
          <span>{statusText}</span>
        </div>

        {!connected ? (
          <button
            className="primary-button"
            type="button"
            onClick={handleStart}
            disabled={connecting}
          >
            {connecting ? "Connecting..." : "Start Coaching Session"}
          </button>
        ) : (
          <div className="controls">
            <button
              className="secondary-button"
              type="button"
              onClick={() => setMuted(!isMuted)}
            >
              {isMuted ? "Unmute Microphone" : "Mute Microphone"}
            </button>

            <button className="end-button" type="button" onClick={handleEnd}>
              End Session
            </button>
          </div>
        )}

        <p className="permission-note">
          Your browser will ask for microphone permission when you start.
        </p>

        {error && <div className="error-message">{error}</div>}
      </section>
    </main>
  );
}

function App() {
  return (
    <ConversationProvider>
      <VoiceCoach />
    </ConversationProvider>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
