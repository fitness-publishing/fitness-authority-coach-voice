# The Fitness Authority Coach — Instant Start Voice + Text

This version removes the separate "Start Coaching Session" gateway.

## New experience
- The coaching conversation interface is visible immediately.
- The Coach's opening question is visible as soon as the page loads.
- Users can type or paste a message immediately.
- Clicking Send starts the same voice-capable ElevenLabs session and sends the typed message.
- Users who prefer to speak can click Start Voice.
- Once connected, voice and typed messages remain in the same conversation.
- PDF transcript, mute, end-session, logo, and responsive layout remain.

## Important browser behavior
A voice-capable ElevenLabs session requires microphone permission. On first use, a user who clicks Send or Start Voice may see the browser's microphone permission prompt. This keeps voice and text available inside one continuous session.

## Deployment
Replace the matching files in the existing GitHub repository. Vercel should redeploy automatically. The GHL iframe URL does not need to change.

## Agent
This build uses the current V3 agent ID:
agent_8601kzvvv4v7e2b99kb0mtqxsmfr
