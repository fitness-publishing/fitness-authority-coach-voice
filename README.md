# The Fitness Authority Coach — Text-First Greeting Fix

This version fixes the text-first startup experience.

## What changed
- Voice-first sessions keep the normal spoken ElevenLabs First Message.
- Text-first sessions suppress the spoken First Message for that session.
- The user's typed message becomes the first real user turn, so the Coach responds directly to it.
- Voice and text remain available inside the same voice-capable session.
- The existing instant-start interface, V3 agent, PDF transcript, mute controls, and session controls remain.

## REQUIRED ElevenLabs setting
Before this build can suppress the greeting on text-first sessions:

1. Open the live V3 Fitness Authority Coach agent in ElevenLabs.
2. Go to **Security**.
3. Find **Overrides**.
4. Enable **First message**.
5. Save/publish the agent.

ElevenLabs disables overrides by default. If First message override is not enabled, the text-first suppression may fail.

## Deployment
Replace the matching files in the existing GitHub repository:
- `src/main.jsx`
- `package.json`
- `README.md`

Vercel should redeploy automatically. The GHL iframe URL and height do not need to change.
