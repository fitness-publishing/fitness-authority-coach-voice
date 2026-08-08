# Fitness Authority Coach Voice App

Inline voice interface for The Fitness Authority Coach, powered by ElevenLabs Agents.

## What's new in v1.1

After a coaching session ends, the user can download a plain-text transcript of the conversation. The transcript includes both the user's transcribed speech and the Fitness Authority Coach's responses.

The transcript is captured in the browser from ElevenLabs conversation message events and is downloaded locally as a `.txt` file. No API key is exposed in the browser.

## Agent ID
`agent_0101kzh93spaer0acy9nef2agqm4`

## Vercel
This repository is connected to Vercel. Committing updated files should trigger an automatic redeployment of the existing app URL.

## GoHighLevel
The existing iframe URL does not need to change.

```html
<iframe
  src="https://fitness-authority-coach-voice.vercel.app/"
  width="100%"
  height="520"
  style="border:0; width:100%;"
  allow="microphone"
  loading="lazy"
></iframe>
```

If the post-session controls feel cramped inside the iframe, increase the iframe height slightly.
