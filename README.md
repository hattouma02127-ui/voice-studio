# Free Text → Speech → MP3

A tiny web app that turns typed text into an MP3 using Microsoft Edge's neural
voices, with a Google Translate TTS fallback. Runs as a Netlify Function — no
API keys, no signup.

## Features

- Neural voices for **English**, **French**, and **Arabic**
- Language → gender → voice dropdowns, filtered automatically
- Multi-region voices (US / UK / AU / CA / FR / CA-FR / EG / SA / AE)
- Preferences and text persist across refreshes (`localStorage`)
- One-click **Play** and **Download MP3**
- Automatic fallback to Google TTS if Edge is unavailable
- Long-text support (POST body, no URL length limit)
- Chunked Google fallback — no 200-character truncation
- RTL handling for Arabic

## Project layout

```
.
├── index.html                    # Documents Manager (hub)
├── dm_voiceStudio.html           # Voice Studio (hub)
├── dm_voiceStudio_TTS.html       # Text → Speech → MP3
├── dm_voiceStudio_VS.html        # Voice Separator (placeholder)
├── tts.js              # Netlify Function: Edge TTS + Google fallback
├── netlify.toml        # build / function / redirect config
├── package.json
├── LICENSE
├── README.md
├── todo.txt
└── .gitignore
```

`netlify.toml` rewrites `/api/tts` → `/.netlify/functions/tts` with
`status = 200`, so the frontend always talks to `/api/tts` and the request
method (POST) is preserved.

## Requirements

- Node.js 18+ (the function pins `NODE_VERSION = "18"`)
- A Netlify account for deployment (or `netlify dev` locally)

## Install

```bash
npm install
```

## Run locally

Using the Netlify CLI (recommended — it emulates Functions and the redirect):

```bash
npm install -g netlify-cli
netlify dev
```

Then open the URL it prints (usually <http://localhost:8888>).

## Deploy

```bash
netlify deploy --prod
```

Or connect the repo to Netlify — `netlify.toml` supplies the build, publish,
and functions directories, so no dashboard configuration is needed beyond
importing the project.

## API

The frontend calls a single endpoint:

```
POST /api/tts
Content-Type: application/json

{
  "voice": "fr-FR-HenriNeural",
  "text": "Le cartable de mon grand-père…"
}
```

Response: `audio/mpeg` on success, JSON with an `errors` array on failure.

The response carries an `X-TTS-Source` header (`edge` or `google`) so you can
tell which engine served the audio.

A GET form is still accepted for short text:

```
GET /api/tts?voice=en-US-BrianNeural&text=Hello
```

## Voices

Voices are defined in the `VOICES` object at the top of `index.html`. To add
a language or a voice, add an entry there — the dropdowns build themselves.

Current set:

| Language | Voices |
|----------|--------|
| English  | Brian, Guy, Roger, Aria, Jenny, Michelle (US) · Ryan, Sonia, Libby (UK) · William, Natasha (AU) · Liam, Clara (CA) |
| French   | Henri, Denise, Éloïse (FR) · Antoine, Jean, Sylvie (CA) |
| Arabic   | Shakir, Salma (EG) · Hamed, Zariyah (SA) · Hamdan, Fatima (AE) |

The Google fallback derives its language code from the voice prefix:
`fr-FR-HenriNeural` → `fr`, `ar-EG-ShakirNeural` → `ar`.

## Notes and limitations

- **Both TTS engines are unofficial.** `msedge-tts` and Google Translate TTS
  are not public APIs. They can rate-limit or break without notice.
- **Netlify function timeout.** Free tier defaults to 10 s. If long texts
  fail in production but work locally, raise the timeout in the Netlify
  dashboard or via `[functions] timeout` in `netlify.toml`.
- **No server-side text cap.** Add one if the endpoint is public — see
  `todo.txt`.
- **Google fallback MP3s are concatenated.** Frame-level stitching may make
  the duration or seek bar slightly off in some players. Audio is fine.
- **localStorage stores your text in plaintext.** Fine for a personal tool.

## License

MIT — see [LICENSE](LICENSE).