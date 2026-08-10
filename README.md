# Fitness Authority Coach Voice App

Inline voice interface for The Fitness Authority Coach, powered by ElevenLabs Agents.

## Version 1.2.1

Fixed PDF pagination so long individual user or Coach responses continue across multiple pages instead of being cut off.

## Version 1.2

The post-session transcript now downloads as a branded PDF instead of a TXT file.

The PDF includes:
- Fitness Authority Coach logo
- Session date
- ElevenLabs conversation ID
- User and Coach dialogue
- Automatic multi-page layout
- Page numbers
- Closing note for coaching follow-up

PDF creation happens in the browser with jsPDF. No API key is exposed.

## Agent ID
`agent_0101kzh93spaer0acy9nef2agqm4`

## Vercel
Commit these updated files to the existing GitHub repository. Vercel should automatically redeploy the same app URL.

## GoHighLevel
No iframe change is required:

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
