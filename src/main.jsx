import React, { useCallback, useMemo, useState } from "react";
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

    // Render line-by-line so a long user or Coach message can continue
    // across as many PDF pages as needed instead of being cut off.
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
  const [creatingPdf, setCreatingPdf] = useState(false);

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
              onClick={handleStart}
            >
              Start New Session
            </button>
          </div>
        )}

        {!sessionEnded && (
          <p className="permission-note">
  Voice sessions are spoken only. For written content review, use the ChatGPT
  version of The Fitness Authority Coach. After your session, you can download
  a PDF transcript to keep for your notes.
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
