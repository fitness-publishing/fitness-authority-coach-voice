# The Fitness Authority Coach — Dual Mode Test v2

This build adds mode switching while keeping the visible conversation intact.

## What v2 tests

### Text → Voice
1. End the current text-only ElevenLabs conversation.
2. Keep the local transcript visible.
3. Start a new voice conversation.
4. Send the recent transcript to the new conversation with `sendContextualUpdate()`.
5. Use a brief handoff first message instead of restarting the Coach.
6. Continue by voice.

### Voice → Text
1. End the current voice conversation.
2. Keep the local transcript visible.
3. Start a new text-only conversation.
4. Send the recent transcript with `sendContextualUpdate()`.
5. Continue by typing.

## Why this is a new ElevenLabs conversation

ElevenLabs text-only conversations use WebSocket and voice conversations use WebRTC. v2 treats a mode change as a controlled handoff between conversation types while preserving the user's visible experience and passing recent context into the new conversation.

## Context handoff

The app sends up to the last 12 visible turns using `sendContextualUpdate()`. This method gives the agent context without forcing an immediate response.

## ElevenLabs requirement

Keep:

**Security → Overrides → First message = Enabled**

The preview build uses a short first-message override during mode switches:

- “Got it. We can keep going by voice.”
- “Got it. We can keep going here in text.”

The production app remains untouched.

## Upload to GitHub

Upload these files ONLY to the `dual-mode-test` branch:

- `src/main.jsx`
- `src/styles.css`
- `package.json`
- `README.md`

Do not merge into `main`.
