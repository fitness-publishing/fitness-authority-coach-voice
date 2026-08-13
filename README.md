# The Fitness Authority Coach — Dual Mode Test v3

This build has one objective: improve coaching continuity when switching between text and voice.

## What changed from v2

v2 sent `sendContextualUpdate()` immediately after `startSession()` returned a conversation ID.

ElevenLabs documents `sendContextualUpdate()` as a way to give an agent context without triggering a response. The React SDK also exposes connection status separately as `disconnected`, `connecting`, and `connected`.

v3 therefore waits until the NEW session explicitly reports `connected`, waits another 500 ms for the transport to settle, and only then sends the continuity context.

## Stronger continuity context

The handoff now sends up to the last 24 visible conversation turns and explicitly tells the Coach:

- this is the SAME coaching conversation
- use prior facts, decisions, drafts, and answers as active context
- do not restart diagnosis
- do not ask for information already provided
- do not ask the user to paste copy the Coach already created
- resolve references such as “make it more premium” from the prior transcript
- continue from the exact point where the previous mode ended

## What did NOT change

- visual design
- V3 voice configuration
- agent ID
- production app
- PDF export
- text-first entry
- voice-first entry

## GitHub upload

Upload these four files ONLY to the `dual-mode-test` branch:

- `src/main.jsx`
- `src/styles.css`
- `package.json`
- `README.md`

Do not merge into `main`.

## Test sequence

### Test A — Text → Voice

1. Start With Text.
2. Give the Coach a specific business problem.
3. Let it create or recommend something concrete.
4. Click Switch to Voice.
5. Make a dependent reference such as:
   - “Make that more premium.”
   - “I like the second idea better. Expand on that.”
   - “What would you change about the draft you just gave me?”
6. The Coach should understand what “that,” “second idea,” or “draft” refers to without asking you to repeat it.

### Test B — Voice → Text

1. Continue the same conversation in voice.
2. Establish one or two additional facts.
3. Switch to Text.
4. Type a question that depends on those facts.
5. The Coach should use them without starting over.

Production remains untouched until this branch passes continuity testing.
