import React, { useCallback, useMemo, useRef, useState } from "react";
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

function cleanMessage(message) {
  if (!message || typeof message.message !== "string") return null;

  const text = message.message.trim();
  if (!text) return null;

  const role =
    message.source === "user"
      ? "user"
      : message.source === "ai"
        ? "coach"
        : null;

  if (!role) return null;

  return { role, text };
}

function mergeTranscript(previous, incoming) {
  if (!incoming) return previous;

  const next = [...previous];
  const last = next[next.length - 1];

  // ElevenLabs can emit tentative and final user transcriptions.
  // If the newest event is a longer refinement of the same speaker's
  // immediately preceding text, replace that text instead of duplicating it.
  if (last && last.role === incoming.role) {
    if (incoming.text === last.text) return previous;

    if (
      incoming.text.startsWith(last.text) ||
      last.text.startsWith(incoming.text)
    ) {
      next[next.length - 1] =
        incoming.text.length >= last.text.length ? incoming : last;
      return next;
    }
  }

  next.push(incoming);
  return next;
}

function formatTranscript(entries, conversationId) {
  const now = new Date();
  const readableDate = now.toLocaleString();

  const lines = [
    "THE FITNESS AUTHORITY COACH",
    "Coaching Session Transcript",
    "",
    `Session date: ${readableDate}`,
    conversationId ? `Conversation ID: ${conversationId}` : "",
    "",
    "----------------------------------------",
    ""
  ].filter(Boolean);

  for (const entry of entries) {
    const speaker = entry.role === "user" ? "You" : "Fitness Authority Coach";
    lines.push(`${speaker}:`);
    lines.push(entry.text);
    lines.push("");
  }

  lines.push("----------------------------------------");
  lines.push("");
  lines.push(
    "Keep this transcript for your notes or bring it to your next coaching call with Rick."
  );

  return lines.join("\n");
}

function transcriptFilename() {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `Fitness-Authority-Coach-Session-${yyyy}-${mm}-${dd}.txt`;
}

function VoiceCoach({
  transcript,
  setTranscript,
  conversationId,
  setConversationId,
  sessionEnded,
  setSessionEnded,
  sessionStarted,
  setSessionStarted
}) {
  const { startSession, endSession } = useConversationControls();
  const { status } = useConversationStatus();
  const { isMuted, setMuted } = useConversationInput();
  const { isSpeaking, isListening } = useConversationMode();
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);

  const connected = status === "connected";
  const connecting = status === "connecting" || starting;
  const canDownload = sessionEnded && transcript.length > 0;

  async function handleStart() {
    setError("");
    setStarting(true);
    setTranscript([]);
    setConversationId("");
    setSessionEnded(false);
    setSessionStarted(true);

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const id = await startSession({
        agentId: AGENT_ID
      });

      if (id) setConversationId(id);
    } catch (err) {
      console.error(err);
      setSessionStarted(false);
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
    setSessionEnded(true);
  }

  function handleDownload() {
    const text = formatTranscript(transcript, conversationId);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = transcriptFilename();
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  let statusText = "Ready when you are";
  if (connecting) statusText = "Connecting...";
  if (connected && isSpeaking) statusText = "Coach is responding";
  else if (connected && isListening) statusText = "Listening";
  else if (connected) statusText = "Session connected";
  else if (sessionEnded) statusText = "Session complete";

  return (
    <main className="shell">
      <section className="coach-card" aria-label="The Fitness Authority Coach voice session">
        <img
          src="/fac-logo.png"
          alt="The Fitness Authority Coach"
          className="fac-logo"
        />

        <h1>Ready to work through something?</h1>
        <p className="intro">
          Start a focused voice coaching session. Work through one issue at a time
          and leave with a clear next step.
        </p>

        <div className={`status ${connected ? "live" : ""}`}>
          <span className="status-dot" aria-hidden="true"></span>
          <span>{statusText}</span>
        </div>

        {!connected && !sessionEnded ? (
          <button
            className="primary-button"
            type="button"
            onClick={handleStart}
            disabled={connecting}
          >
            {connecting ? "Connecting..." : "Start Coaching Session"}
          </button>
        ) : connected ? (
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
        ) : (
          <div className="session-complete">
            {canDownload ? (
              <>
                <button
                  className="download-button"
                  type="button"
                  onClick={handleDownload}
                >
                  Download Conversation Transcript
                </button>
                <p className="transcript-note">
                  Keep this transcript for your notes or bring it to your next
                  coaching call with Rick.
                </p>
              </>
            ) : (
              <p className="transcript-note">
                No transcript was captured for this session.
              </p>
            )}

            <button
              className="new-session-button"
              type="button"
              onClick={handleStart}
            >
              Start New Session
            </button>
          </div>
        )}

        {!sessionEnded && (
          <p className="permission-note">
            Your browser will ask for microphone permission when you start.
          </p>
        )}

        {error && <div className="error-message">{error}</div>}
      </section>
    </main>
  );
}

function App() {
  const [transcript, setTranscript] = useState([]);
  const [conversationId, setConversationId] = useState("");
  const [sessionEnded, setSessionEnded] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);

  const transcriptRef = useRef([]);
  transcriptRef.current = transcript;

  const handleMessage = useCallback((message) => {
    const cleaned = cleanMessage(message);
    if (!cleaned) return;

    setTranscript((previous) => mergeTranscript(previous, cleaned));
  }, []);

  const handleDisconnect = useCallback(() => {
    if (sessionStarted) {
      setSessionEnded(true);
    }
  }, [sessionStarted]);

  const providerProps = useMemo(
    () => ({
      onMessage: handleMessage,
      onDisconnect: handleDisconnect
    }),
    [handleMessage, handleDisconnect]
  );

  return (
    <ConversationProvider {...providerProps}>
      <VoiceCoach
        transcript={transcript}
        setTranscript={setTranscript}
        conversationId={conversationId}
        setConversationId={setConversationId}
        sessionEnded={sessionEnded}
        setSessionEnded={setSessionEnded}
        sessionStarted={sessionStarted}
        setSessionStarted={setSessionStarted}
      />
    </ConversationProvider>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
