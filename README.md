# Fitness Authority Coach Voice App

A lightweight inline voice interface for The Fitness Authority Coach, powered by ElevenLabs Agents.

## Agent ID
`agent_0101kzh93spaer0acy9nef2agqm4`

## Vercel
Import this GitHub repository into Vercel. Vercel should detect Vite automatically.

- Build command: `npm run build`
- Output directory: `dist`

## GoHighLevel iframe
After deployment, add this in a GHL Custom HTML element:

```html
<iframe
  src="https://YOUR-VERCEL-URL.vercel.app"
  width="100%"
  height="520"
  style="border:0; width:100%;"
  allow="microphone"
  loading="lazy"
></iframe>
```

## ElevenLabs
Direct Agent ID connections require the ElevenLabs agent to be public / have authentication disabled. If you later enable authentication, use a server-generated conversation token.
