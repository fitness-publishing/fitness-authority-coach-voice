# The Fitness Authority Coach — Text-First Fix v3

This version fixes the text-first startup path.

## Two issues corrected

1. The previous app tried to suppress the ElevenLabs First Message by overriding it with an empty string. ElevenLabs' current documentation says fields you do not want to override should be omitted rather than set to an empty string.
2. The startup React effect was watching the temporary connecting state. That caused the effect to clean itself up before the connection completed, so the queued typed message was not reliably sent.

## Required ElevenLabs setup

Open the live V3 Fitness Authority Coach agent:

1. Go to the agent's conversation settings.
2. Remove the existing default **First message** so the agent has no default greeting.
3. Keep **Security → Overrides → First message** enabled.
4. Save/publish.

The app will now supply the greeting only for a voice-first session.

## Expected behavior

### Voice first
- Click **Start Voice**
- App starts the voice session with the normal greeting override
- Coach says: “Hey, it’s the Fitness Authority Coach. What are you working through in your business today?”

### Text first
- Type a message and click **Send**
- App starts the same voice-capable session without a First Message override
- App waits for ElevenLabs to report `connected`
- App sends the typed message with `sendUserMessage()`
- Coach answers that message directly
- User can switch to voice afterward in the same session

## Deployment

Replace only these three files in GitHub:
- `src/main.jsx`
- `package.json`
- `README.md`

Vercel should redeploy automatically. No GHL changes are required.
