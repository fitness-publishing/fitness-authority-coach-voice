# The Fitness Authority Coach — Text-First Greeting Fix v2

This version fixes the text-first startup race condition.

## What changed
- Voice-first sessions still use the normal spoken ElevenLabs First Message.
- Text-first sessions still suppress the spoken First Message.
- The app now waits until the ElevenLabs SDK reports the conversation as **connected** before calling `sendUserMessage()`.
- The typed message is then sent as the first real user turn, so the Coach should respond directly to it instead of waiting for microphone silence.
- Voice and text remain available inside the same voice-capable session.
- The existing instant-start interface, V3 agent, PDF transcript, mute controls, and session controls remain.

## REQUIRED ElevenLabs setting
The live V3 Fitness Authority Coach agent must have:

**Security → Overrides → First message = Enabled**

## Deployment
Replace only these files in the existing GitHub repository:
- `src/main.jsx`
- `package.json`
- `README.md`

Vercel should redeploy automatically. The GHL iframe URL and 800px height do not need to change.
