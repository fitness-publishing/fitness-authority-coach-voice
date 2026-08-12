# The Fitness Authority Coach — Combined Voice + Text

This version combines voice and typed messaging in the same ElevenLabs coaching session.

## What changed
- Visible live conversation history
- Text/paste input while the ElevenLabs session is connected
- Enter sends, Shift+Enter creates a new line
- Voice and typed messages share the same conversation context
- Existing mute, end session, PDF transcript, logo, and responsive layout remain
- PDF transcript includes both spoken and typed exchanges

## Deployment
Replace the existing project files with these files in the current GitHub repository. Vercel should redeploy automatically and the existing GHL iframe URL can remain unchanged.

## Important ElevenLabs prompt update
Remove the old rule that says the interface is voice-only and cannot accept pasted or typed content. The interface now supports both voice and text.
