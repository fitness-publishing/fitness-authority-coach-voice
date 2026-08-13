# The Fitness Authority Coach — Dual Mode Test v1

This is an isolated development build for the `dual-mode-test` GitHub branch.

## Goal of v1

Prove that both ElevenLabs session types work independently before attempting any mid-conversation mode switching.

### Start With Text
- Uses the ElevenLabs React SDK with `textOnly: true`
- Uses a WebSocket text-only conversation
- Does not request microphone permission
- User types messages with `sendUserMessage()`
- Agent responses are captured by `onMessage`
- Transcript can be downloaded as a PDF

### Start Voice
- Uses the existing working voice-capable session
- Requests microphone permission
- Uses the current V3 agent
- Typed messages are available once the voice session is connected
- Transcript can be downloaded as a PDF

## Important

This v1 intentionally does NOT switch a live text-only conversation into voice or vice versa. First we are proving that each entry mode is reliable.

## Agent ID

`agent_8601kzvvv4v7e2b99kb0mtqxsmfr`

## Deployment

Upload these changed files ONLY to the `dual-mode-test` branch:
- `src/main.jsx`
- `src/styles.css`
- `package.json`
- `README.md`

Do not upload them to `main`.

After committing to `dual-mode-test`, Vercel should create a Preview deployment for that branch.
