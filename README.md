# Fitness Authority Coach Voice App

A lightweight inline voice interface for The Fitness Authority Coach, powered by ElevenLabs Agents.

## Agent ID
`agent_0101kzh93spaer0acy9nef2agqm4`

## Brand asset
The production interface uses `/public/fac-logo.png`.

## Vercel
Import this GitHub repository into Vercel. Vercel should detect Vite automatically.

- Build command: `npm run build`
- Output directory: `dist`

## GoHighLevel iframe
After deployment, add this in a GHL Custom HTML element:

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
