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
const WELCOME_MESSAGE =
  "Hey, it’s the Fitness Authority Coach. What are you working through in your business today?";

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

function pdfFilename() {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `Fitness-Authority-Coach-Session-${yyyy}-${mm}-${dd}.pdf`;
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

async function createTranscriptPdf(entries, conversationId) {
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

  const addPageHeader = (showLogo = false) => {
    doc.setDrawColor(...lightGray);
    doc.setLineWidth(0.7);
    doc.line(marginX, 42, pageWidth - marginX, 42);

    if (!showLogo) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...gray);
      doc.text("THE FITNESS AUTHORITY COACH", marginX, 30);
    }

    y = 62;
  };

  const ensureRoom = (neededHeight) => {
    if (y + neededHeight <= pageHeight - bottomMargin) return;

    doc.addPage();
    addPageHeader(false);
  };

  const addWrappedText = (
    text,
    {
      fontSize = 10.5,
      fontStyle = "normal",
      color = navy,
      indent = 0,
      lineHeight = 15,
      gapAfter = 8
    } = {}
  ) => {
    doc.setFont("helvetica", fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);

    const lines = doc.splitTextToSize(text, contentWidth - indent);

    for (const line of lines) {
      if (y + lineHeight > pageHeight - bottomMargin) {
        doc.addPage();
        addPageHeader(false);
        doc.setFont("helvetica", fontStyle);
        doc.setFontSize(fontSize);
        doc.setTextColor(...color);
      }

      doc.text(line, marginX + indent, y);
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
  doc.text("The Fitness Authority Coach", marginX + 86, y + 45);

  y += 92;

  doc.setDrawColor(...gold);
  doc.setLineWidth(2.2);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 22;

  const sessionDate = new Date().toLocaleString();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...navy);
  doc.text("SESSION DATE", marginX, y);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...gray);
  doc.text(sessionDate, marginX + 88, y);

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
      fontStyle: "normal",
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

  doc.save(pdfFilename());
}

function CoachApp({
  transcript,
  setTranscript,
  conversationId,
  setConversationId,
  sessionEnded,
  setSessionEnded,
  sessionStarted,
  setSessionStarted
}) {
  const {
    startSession,
    endSession,
    sendUserMessage,
    sendUserActivity
  } = useConversationControls();
  const { status } = useConversationStatus();
  const { isMuted, setMuted } = useConversationInput();
  const { isSpeaking, isListening } = useConversationMode();

  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);
  const [creatingPdf, setCreatingPdf] = useState(false);
  const [typedMessage, setTypedMessage] = useState("");
  const transcriptEndRef = useRef(null);

  const connected = status === "connected";
  const connecting = status === "connecting" || starting;
  const canDownload = sessionEnded && transcript.length > 0;

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  }, [transcript]);

  async function connectSession({ pendingText = "", reset = false } = {}) {
    setError("");
    setStarting(true);

    if (reset) {
      setTranscript([]);
      setConversationId("");
      setSessionEnded(false);
    }

    setSessionStarted(true);

    try {
      // A full voice-capable ElevenLabs session requires microphone permission.
      // Starting from the text box still uses the same voice + text conversation,
      // so the user can switch to speaking at any time without starting over.
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const id = await startSession({
        agentId: AGENT_ID
      });

      if (id) setConversationId(id);

      if (pendingText.trim()) {
        const text = pendingText.trim();

        setTranscript((previous) =>
          mergeTranscript(previous, { role: "user", text })
        );

        sendUserMessage(text);
        setTypedMessage("");
      }
    } catch (err) {
      console.error(err);
      setSessionStarted(false);
      setError(
        "To keep voice and text available in the same session, please allow microphone access. You can mute the microphone after connecting if you prefer to type."
      );
    } finally {
      setStarting(false);
    }
  }

  async function handleStartVoice() {
    await connectSession({ reset: transcript.length === 0 });
  }

  async function handleEnd() {
    setError("");
    await endSession();
    setSessionEnded(true);
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

  async function handleSend(event) {
    event.preventDefault();

    const text = typedMessage.trim();
    if (!text || connecting || sessionEnded) return;

    setError("");

    if (!connected) {
      await connectSession({
        pendingText: text,
        reset: transcript.length === 0
      });
      return;
    }

    try {
      // Add the typed message immediately so the interface feels responsive.
      // If ElevenLabs echoes the same user message through onMessage,
      // mergeTranscript will prevent a duplicate.
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
    setError("");
    setCreatingPdf(true);

    try {
      await createTranscriptPdf(transcript, conversationId);
    } catch (err) {
      console.error(err);
      setError("The PDF could not be created. Please try again.");
    } finally {
      setCreatingPdf(false);
    }
  }

  async function handleNewSession() {
    setTypedMessage("");
    setTranscript([]);
    setConversationId("");
    setSessionEnded(false);
    setSessionStarted(false);
    setError("");
  }

  let statusText = "Ready when you are";
  if (connecting) statusText = "Connecting...";
  if (connected && isSpeaking) statusText = "Coach is responding";
  else if (connected && isListening) statusText = "Listening";
  else if (connected) statusText = "Session connected";
  else if (sessionEnded) statusText = "Session complete";

  const displayedTranscript =
    transcript.length > 0
      ? transcript
      : [{ role: "coach", text: WELCOME_MESSAGE, preview: true }];

  return (
    <main className="shell">
      <section
        className="coach-card"
        aria-label="The Fitness Authority Coach session"
      >
        <img
          src="/fac-logo.png"
          alt="The Fitness Authority Coach"
          className="fac-logo"
        />

        <h1>Ready to work through something?</h1>
        <p className="intro">
          Talk or type. Switch between the two anytime during the same coaching
          session and leave with a clear next step.
        </p>

        <div className={`status ${connected ? "live" : ""}`}>
          <span className="status-dot" aria-hidden="true"></span>
          <span>{statusText}</span>
        </div>

        {!sessionEnded && (
          <>
            <div className="conversation-panel" aria-live="polite">
              <div className="conversation-list">
                {displayedTranscript.map((entry, index) => (
                  <div
                    className={`message-row ${
                      entry.role === "user" ? "user-row" : "coach-row"
                    }`}
                    key={`${entry.role}-${index}-${entry.text.slice(0, 24)}`}
                  >
                    <div
                      className={`message-bubble ${
                        entry.role === "user" ? "user-bubble" : "coach-bubble"
                      } ${entry.preview ? "preview-bubble" : ""}`}
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
                  disabled={connecting}
                />
                <button
                  className="send-button"
                  type="submit"
                  disabled={!typedMessage.trim() || connecting}
                >
                  {connecting ? "Connecting..." : "Send"}
                </button>
              </div>
              <p className="composer-help">
                Type and press Send, or use voice below. On your first use, your
                browser may ask for microphone permission so you can switch
                between voice and text anytime.
              </p>
            </form>

            <div className="voice-divider">
              <span>Or talk it through</span>
            </div>

            {!connected ? (
              <button
                className="voice-start-button"
                type="button"
                onClick={handleStartVoice}
                disabled={connecting}
              >
                {connecting ? "Connecting..." : "Start Voice"}
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
          </>
        )}

        {sessionEnded && (
          <div className="session-complete">
            {canDownload ? (
              <>
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
              onClick={handleNewSession}
            >
              Start New Session
            </button>
          </div>
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
      <CoachApp
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
