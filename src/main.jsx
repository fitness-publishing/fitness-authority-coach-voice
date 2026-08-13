import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { jsPDF } from "jspdf";
import {
  ConversationProvider,
  useConversationControls,
  useConversationInput,
  useConversationMode,
  useConversationStatus
} from "@elevenlabs/react";
import "./styles.css";

const AGENT_ID = "agent_8601kzvvv4v7e2b99kb0mtqxsmfr";

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

function pdfFilename(mode) {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const suffix = mode === "text" ? "Text" : "Voice";
  return `Fitness-Authority-Coach-${suffix}-Session-${yyyy}-${mm}-${dd}.pdf`;
}

function imageUrlToDataUrl(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    image.onerror = reject;
    image.src = url;
  });
}

async function createTranscriptPdf(entries, conversationId, mode) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "letter"
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 54;
  const bottomMargin = 56;
  const contentWidth = pageWidth - marginX * 2;

  const navy = [11, 27, 43];
  const gold = [213, 166, 74];
  const gray = [92, 101, 112];
  const lightGray = [231, 233, 236];
  let y = 48;

  const addPageHeader = () => {
    doc.setDrawColor(...lightGray);
    doc.setLineWidth(0.7);
    doc.line(marginX, 42, pageWidth - marginX, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...gray);
    doc.text("THE FITNESS AUTHORITY COACH", marginX, 30);
    y = 62;
  };

  const ensureRoom = (neededHeight) => {
    if (y + neededHeight <= pageHeight - bottomMargin) return;
    doc.addPage();
    addPageHeader();
  };

  const addWrappedText = (
    text,
    {
      fontSize = 10.5,
      fontStyle = "normal",
      color = navy,
      lineHeight = 15,
      gapAfter = 8
    } = {}
  ) => {
    doc.setFont("helvetica", fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);

    const lines = doc.splitTextToSize(text, contentWidth);

    for (const line of lines) {
      if (y + lineHeight > pageHeight - bottomMargin) {
        doc.addPage();
        addPageHeader();
        doc.setFont("helvetica", fontStyle);
        doc.setFontSize(fontSize);
        doc.setTextColor(...color);
      }

      doc.text(line, marginX, y);
      y += lineHeight;
    }

    y += gapAfter;
  };

  try {
    const logoData = await imageUrlToDataUrl("/fac-logo.png");
    doc.addImage(logoData, "PNG", marginX, y, 68, 68);
  } catch (error) {
    console.warn("Logo could not be added to PDF.", error);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...navy);
  doc.text("Coaching Session Transcript", marginX + 86, y + 25);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...gray);
  doc.text(
    `The Fitness Authority Coach · ${mode === "text" ? "Text" : "Voice"} Session`,
    marginX + 86,
    y + 45
  );

  y += 92;
  doc.setDrawColor(...gold);
  doc.setLineWidth(2.2);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 22;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...navy);
  doc.text("SESSION DATE", marginX, y);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...gray);
  doc.text(new Date().toLocaleString(), marginX + 88, y);
  y += 17;

  if (conversationId) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...navy);
    doc.text("CONVERSATION ID", marginX, y);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...gray);
    doc.text(conversationId, marginX + 88, y);
    y += 17;
  }

  y += 14;

  entries.forEach((entry) => {
    const isUser = entry.role === "user";
    const label = isUser ? "YOU" : "FITNESS AUTHORITY COACH";

    ensureRoom(46);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...(isUser ? gray : gold));
    doc.text(label, marginX, y);
    y += 15;

    addWrappedText(entry.text, {
      fontSize: 10.5,
      color: navy,
      lineHeight: 15,
      gapAfter: 14
    });
  });

  ensureRoom(78);
  doc.setDrawColor(...lightGray);
  doc.setLineWidth(0.7);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 22;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...navy);
  doc.text("Keep this transcript.", marginX, y);
  y += 17;

  addWrappedText(
    "Use it for your notes, revisit the decisions you made, or bring it to your next coaching call with Rick.",
    {
      fontSize: 9.5,
      color: gray,
      lineHeight: 14,
      gapAfter: 0
    }
  );

  const totalPages = doc.getNumberOfPages();

  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
    doc.setPage(pageNumber);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...gray);
    doc.text(
      `The Fitness Authority Coach | Page ${pageNumber} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 28,
      { align: "center" }
    );
  }

  doc.save(pdfFilename(mode));
}

function ModeChooser({ onChoose }) {
  return (
    <main className="shell">
      <section className="coach-card">
        <img
          src="/fac-logo.png"
          alt="The Fitness Authority Coach"
          className="fac-logo"
        />

        <h1>How would you like to start?</h1>
        <p className="intro">
          Choose text for a quiet written conversation, or choose voice when you want to talk it through.
        </p>

        <div className="mode-grid">
          <button
            className="mode-card mode-card-text"
            type="button"
            onClick={() => onChoose("text")}
          >
            <span className="mode-title">Start With Text</span>
            <span className="mode-description">
              Type your question and get a written response. No microphone permission required.
            </span>
          </button>

          <button
            className="mode-card mode-card-voice"
            type="button"
            onClick={() => onChoose("voice")}
          >
            <span className="mode-title">Start Voice</span>
            <span className="mode-description">
              Talk naturally with the Coach using the V3 conversational voice.
            </span>
          </button>
        </div>

        <p className="test-note">
          Dual-mode test build. For this first test, each session stays in the mode you choose.
        </p>
      </section>
    </main>
  );
}

function SessionApp({
  mode,
  transcript,
  setTranscript,
  conversationId,
  setConversationId,
  sessionEnded,
  setSessionEnded,
  handoffContext,
  onSwitchMode,
  onExitMode
}) {
  const {
    startSession,
    endSession,
    sendUserMessage,
    sendUserActivity,
    sendContextualUpdate
  } = useConversationControls();

  const { status } = useConversationStatus();
  const { isMuted, setMuted } = useConversationInput();
  const { isSpeaking, isListening } = useConversationMode();

  const [error, setError] = useState("");
  const [starting, setStarting] = useState(true);
  const [typedMessage, setTypedMessage] = useState("");
  const [creatingPdf, setCreatingPdf] = useState(false);
  const startedRef = useRef(false);
  const transcriptEndRef = useRef(null);

  const connected = status === "connected";
  const canDownload = sessionEnded && transcript.length > 0;

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  }, [transcript]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;

    async function begin() {
      setError("");
      setStarting(true);

      try {
        if (mode === "voice") {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        }

        const id = await startSession({ agentId: AGENT_ID });

        if (!cancelled && id) {
          setConversationId(id);

          if (handoffContext) {
            try {
              sendContextualUpdate(handoffContext);
            } catch (contextError) {
              console.warn("Could not send handoff context.", contextError);
            }
          }
        }
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError(
            mode === "voice"
              ? "Microphone access is required for a voice session. Please allow microphone access and try again."
              : "The text session could not connect. Please try again."
          );
        }
      } finally {
        if (!cancelled) setStarting(false);
      }
    }

    begin();

    return () => {
      cancelled = true;
    };
  }, [
    mode,
    startSession,
    setConversationId,
    handoffContext,
    sendContextualUpdate
  ]);

  async function handleEnd() {
    setError("");
    await endSession();
    setSessionEnded(true);
  }

  async function handleSwitch(targetMode) {
    setError("");

    try {
      await endSession();
    } catch (err) {
      console.warn("Current session was already disconnected.", err);
    }

    onSwitchMode(targetMode);
  }

  function handleTyping(event) {
    setTypedMessage(event.target.value);

    if (connected) {
      try {
        sendUserActivity();
      } catch (err) {
        console.warn("Could not send user activity.", err);
      }
    }
  }

  function handleSend(event) {
    event.preventDefault();
    const text = typedMessage.trim();

    if (!text || !connected) return;

    try {
      setTranscript((previous) =>
        mergeTranscript(previous, { role: "user", text })
      );

      sendUserMessage(text);
      setTypedMessage("");
    } catch (err) {
      console.error(err);
      setError("Your message could not be sent. Please try again.");
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend(event);
    }
  }

  async function handleDownload() {
    setCreatingPdf(true);
    setError("");

    try {
      await createTranscriptPdf(transcript, conversationId, mode);
    } catch (err) {
      console.error(err);
      setError("The PDF could not be created. Please try again.");
    } finally {
      setCreatingPdf(false);
    }
  }

  let statusText =
    mode === "text" ? "Connecting text session..." : "Connecting voice session...";

  if (connected && mode === "text") statusText = "Text session connected";

  if (connected && mode === "voice" && isSpeaking) {
    statusText = "Coach is responding";
  } else if (connected && mode === "voice" && isListening) {
    statusText = "Listening";
  } else if (connected && mode === "voice") {
    statusText = "Voice session connected";
  }

  if (sessionEnded) statusText = "Session complete";

  return (
    <main className="shell">
      <section className="coach-card">
        <img
          src="/fac-logo.png"
          alt="The Fitness Authority Coach"
          className="fac-logo"
        />

        <div className="mode-pill">
          {mode === "text" ? "Text Session" : "Voice Session"}
        </div>

        <h1>
          {mode === "text"
            ? "What are you working through?"
            : "Ready to talk it through?"}
        </h1>

        <p className="intro">
          {mode === "text"
            ? "Type your question below. You can switch to voice anytime and keep the visible conversation."
            : "Talk naturally with the Coach. You can switch to text anytime and keep the visible conversation."}
        </p>

        <div className={`status ${connected ? "live" : ""}`}>
          <span className="status-dot" aria-hidden="true"></span>
          <span>{statusText}</span>
        </div>

        <div className="conversation-panel" aria-live="polite">
          <div className="conversation-list">
            {transcript.length === 0 && !connected && (
              <div className="empty-conversation">
                Connecting to The Fitness Authority Coach...
              </div>
            )}

            {transcript.length === 0 && connected && mode === "text" && (
              <div className="empty-conversation">
                Your text session is ready. Type your first message below.
              </div>
            )}

            {transcript.map((entry, index) => (
              <div
                className={`message-row ${
                  entry.role === "user" ? "user-row" : "coach-row"
                }`}
                key={`${entry.role}-${index}-${entry.text.slice(0, 24)}`}
              >
                <div
                  className={`message-bubble ${
                    entry.role === "user" ? "user-bubble" : "coach-bubble"
                  }`}
                >
                  <span className="message-label">
                    {entry.role === "user"
                      ? "You"
                      : "Fitness Authority Coach"}
                  </span>
                  <span className="message-text">{entry.text}</span>
                </div>
              </div>
            ))}

            <div ref={transcriptEndRef} />
          </div>
        </div>

        {!sessionEnded && (
          <>
            <form className="text-composer" onSubmit={handleSend}>
              <label className="composer-label" htmlFor="coach-message">
                Type a message
              </label>

              <div className="composer-row">
                <textarea
                  id="coach-message"
                  value={typedMessage}
                  onChange={handleTyping}
                  onKeyDown={handleKeyDown}
                  placeholder="Type or paste your message here..."
                  rows="3"
                  disabled={!connected}
                />

                <button
                  className="send-button"
                  type="submit"
                  disabled={!connected || !typedMessage.trim()}
                >
                  Send
                </button>
              </div>

              <p className="composer-help">
                Press Enter to send. Use Shift + Enter for a new line.
              </p>
            </form>

            <div className="controls">
              {mode === "voice" && connected && (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setMuted(!isMuted)}
                >
                  {isMuted ? "Unmute Microphone" : "Mute Microphone"}
                </button>
              )}

              <button
                className="switch-button"
                type="button"
                onClick={() =>
                  handleSwitch(mode === "text" ? "voice" : "text")
                }
                disabled={!connected}
              >
                {mode === "text" ? "Switch to Voice" : "Switch to Text"}
              </button>

              <button
                className="end-button"
                type="button"
                onClick={handleEnd}
                disabled={!connected}
              >
                End Session
              </button>
            </div>
          </>
        )}

        {sessionEnded && (
          <div className="session-complete">
            {canDownload && (
              <button
                className="download-button"
                type="button"
                onClick={handleDownload}
                disabled={creatingPdf}
              >
                {creatingPdf
                  ? "Creating PDF..."
                  : "Download Conversation Transcript (PDF)"}
              </button>
            )}

            <button
              className="new-session-button"
              type="button"
              onClick={onExitMode}
            >
              Choose Another Session
            </button>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}
      </section>
    </main>
  );
}

function buildHandoffContext(transcript, fromMode, toMode) {
  if (!transcript.length) return "";

  const recent = transcript.slice(-12);
  const history = recent
    .map((entry) => {
      const speaker =
        entry.role === "user" ? "User" : "Fitness Authority Coach";
      return `${speaker}: ${entry.text}`;
    })
    .join("\n");

  return [
    "The user has just switched interaction modes inside the same Fitness Authority Coach experience.",
    `Previous mode: ${fromMode}. New mode: ${toMode}.`,
    "Continue the coaching conversation naturally from the context below.",
    "Do not restart the coaching process, reintroduce yourself, or ask the user to repeat information already provided.",
    "Treat this history as context only and wait for the user's next message before continuing.",
    "",
    "Recent conversation:",
    history
  ].join("\n");
}

function App() {
  const [mode, setMode] = useState(null);
  const [sessionKey, setSessionKey] = useState(0);
  const [transcript, setTranscript] = useState([]);
  const [conversationId, setConversationId] = useState("");
  const [sessionEnded, setSessionEnded] = useState(false);
  const [handoffContext, setHandoffContext] = useState("");

  const handleMessage = useCallback((message) => {
    const cleaned = cleanMessage(message);
    if (!cleaned) return;
    setTranscript((previous) => mergeTranscript(previous, cleaned));
  }, []);

  const handleChoose = useCallback((nextMode) => {
    setTranscript([]);
    setConversationId("");
    setSessionEnded(false);
    setHandoffContext("");
    setMode(nextMode);
    setSessionKey((value) => value + 1);
  }, []);

  const handleSwitchMode = useCallback(
    (nextMode) => {
      const context = buildHandoffContext(transcript, mode, nextMode);

      setConversationId("");
      setSessionEnded(false);
      setHandoffContext(context);
      setMode(nextMode);
      setSessionKey((value) => value + 1);
    },
    [transcript, mode]
  );

  const handleExitMode = useCallback(() => {
    setTranscript([]);
    setConversationId("");
    setSessionEnded(false);
    setHandoffContext("");
    setMode(null);
    setSessionKey((value) => value + 1);
  }, []);

  const providerProps = useMemo(() => {
    const props = {
      onMessage: handleMessage,
      textOnly: mode === "text"
    };

    if (handoffContext) {
      props.overrides = {
        agent: {
          firstMessage:
            mode === "voice"
              ? "Got it. We can keep going by voice."
              : "Got it. We can keep going here in text."
        }
      };
    }

    return props;
  }, [handleMessage, mode, handoffContext]);

  if (!mode) {
    return <ModeChooser onChoose={handleChoose} />;
  }

  return (
    <ConversationProvider
      key={`${sessionKey}-${mode}`}
      {...providerProps}
    >
      <SessionApp
        mode={mode}
        transcript={transcript}
        setTranscript={setTranscript}
        conversationId={conversationId}
        setConversationId={setConversationId}
        sessionEnded={sessionEnded}
        setSessionEnded={setSessionEnded}
        handoffContext={handoffContext}
        onSwitchMode={handleSwitchMode}
        onExitMode={handleExitMode}
      />
    </ConversationProvider>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
