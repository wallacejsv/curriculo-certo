# Currículo Certo

> [🇧🇷 Português](README.md) · 🇺🇸 English

An AI-powered generator for résumés and cover letters tailored to one specific job. You paste the job posting and your LinkedIn profile; the app returns a résumé and a cover letter fitted to that role, ready to download as PDFs — in the same language as the posting.

**Stack:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS 4 · Claude (Anthropic) · React PDF

---

## Table of contents

- [How it works](#how-it-works)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuring the API key](#configuring-the-api-key)
- [Running the project](#running-the-project)
- [Using the app](#using-the-app)
- [How the AI is used](#how-the-ai-is-used)
- [Environment variables](#environment-variables)
- [Project structure](#project-structure)
- [Scripts](#scripts)
- [Known limitations](#known-limitations)

---

## How it works

```
Job (title + description) ──┐
                            ├─→  /api/generate  ─→  Claude  ─→  validated JSON  ─→  Preview + PDF
LinkedIn profile ───────────┘     (Node runtime)    (2 calls)       (Zod)
   pasted text or PDF
```

1. You fill in the job title and description, and provide your LinkedIn profile — either by pasting the text or uploading the PDF LinkedIn exports.
2. For PDFs, text is extracted server-side with [`unpdf`](https://github.com/unjs/unpdf) (bundled pdf.js, no native dependencies).
3. A lightweight heuristic detects the posting's likely language and passes it to the model as a hint.
4. Claude generates **two documents in parallel**: the résumé and the cover letter.
5. The response is validated against Zod schemas. Malformed output triggers an automatic retry.
6. The front end renders a preview and builds the PDFs in the browser, on demand.

---

## Requirements

- **Node.js 18+**
- An **Anthropic API key** ([console.anthropic.com](https://console.anthropic.com/settings/keys))

---

## Installation

```bash
git clone https://github.com/wallacejsv/curriculo-certo.git
```

```bash
cd curriculo-certo && npm install
```

---

## Configuring the API key

The app needs an Anthropic key to work. Without one, generation fails with an explicit message.

**1.** Create your key at [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys).

**2.** Copy the example file:

```bash
cp .env.example .env
```

**3.** Open `.env` and fill in the variable:

```env
ANTHROPIC_API_KEY=sk-ant-api03-...
```

That's it. `.env` is already in `.gitignore` — your key won't reach the repository.

> [!WARNING]
> Never commit the `.env` file, and never paste your key into issues, screenshots, or pull requests. If a key leaks, revoke it immediately in the Anthropic console and generate a new one.

### Cost

Each generation makes **two calls** to the Anthropic API (one for the résumé, one for the cover letter), each capped at 8,192 output tokens. Cost per generation lands in the range of cents and varies with the length of the posting and profile. Check [Anthropic's pricing](https://www.anthropic.com/pricing) for whichever model you're using.

---

## Running the project

**Development** — at [localhost:3000](http://localhost:3000):

```bash
npm run dev
```

**Production:**

```bash
npm run build && npm start
```

**Type checking:**

```bash
npm run lint
```

---

## Using the app

1. **Job title** — e.g. `Senior Product Manager`.
2. **Job description** — paste the full posting. The more complete, the better the fit: this is where the keywords and the language come from.
3. **Your LinkedIn** — two options:

   | Mode | How |
   |---|---|
   | **Paste text** | Open your LinkedIn profile, select all (`Ctrl+A`), and paste it into the field. |
   | **Upload PDF** | On LinkedIn: your profile → **More** → **Save to PDF**. Upload the file. |

4. Click **Gerar currículo + carta** and wait a few seconds.
5. Review the preview and download the PDFs. Files are named after you and the target role.

The green **"Requisitos da vaga cobertos"** panel lists which of the posting's requirements the model could evidence from your actual background — useful for seeing, before you apply, where your profile covers the role and where it doesn't.

> **Note:** the interface is currently in Portuguese only. The *generated documents*, however, follow the language of the job posting — a posting in English produces a résumé and cover letter in English.

---

## How the AI is used

### Two independent calls, in parallel

The résumé and cover letter are produced by **separate calls**, each with its own tool:

| Document | Tool | Zod schema |
|---|---|---|
| Résumé | `emit_resume` | `ResumeSchema` |
| Cover letter | `emit_cover_letter` | `CoverLetterSchema` |

The split is deliberate. With a combined schema, the model would occasionally serialize one field as a JSON string and take the other down with it — an unrecoverable failure. With a single-object tool per document, a serialized response arrives as a top-level string that `JSON.parse` recovers, and there is no "other field" left to lose.

Because the two calls are independent, they run through `Promise.all` — total latency is that of a single call.

### Structured output and validation

The model is forced to answer through the tool (`tool_choice`), never in free text. Each response goes through:

1. **Coercion** — if the input arrived as a JSON string, `JSON.parse` it.
2. **Zod validation** — the object must match the schema.
3. **Retry** — up to **3 attempts** on malformed output.

Truncation via `max_tokens` is not retried: a retry wouldn't fix it, so the error surfaces directly to the user with guidance to shorten the input.

### Language

A heuristic in `src/lib/language.ts` counts Portuguese and English markers in the job description (diacritics, function words, posting-specific terms) and produces a **hint**. The final call belongs to the model, which verifies against the actual text and records the result in the `language` field. Résumé and cover letter always come out in the posting's language, never mixed.

### Writing rules

The system prompts (`src/lib/prompt.ts`) enforce two central constraints:

**No invention.** The model may only use facts present in the profile: real jobs, companies, dates, education, and skills. It can rewrite, reorder, and emphasize toward the job — never invent employers, titles, degrees, certifications, or numbers. If a job requirement has no support in the profile, it is omitted rather than faked.

**It must not read as AI-generated.** The prompt explicitly bans the vocabulary that gives away machine writing — self-praise clichés (*results-driven*, *detail-oriented*, *proven track record*), corporate jargon (*leverage*, *synergy*, *cutting-edge*, *seamless*), the repetitive rule of three, uniform sentence rhythm, and the well-worn cover-letter openers and closers.

### ATS optimization

The résumé is built to pass *Applicant Tracking Systems* while still reading well to a human recruiter: reverse-chronological experience, bullets pairing an action verb with a measurable result whenever the profile supplies one, job keywords woven in naturally, and standard section names in the chosen language.

---

## Environment variables

| Variable | Required | Default | Description |
|---|:---:|---|---|
| `ANTHROPIC_API_KEY` | ✅ | — | Your Anthropic API key. |
| `RESUME_MODEL` | ❌ | `claude-sonnet-5` | Model used for generation. Accepts any valid Anthropic model ID. |

---

## Project structure

```
src/
├── app/
│   ├── api/generate/route.ts   POST endpoint: receives the form, orchestrates generation
│   ├── page.tsx                Main page (React Query + UI states)
│   ├── layout.tsx              Root layout
│   └── globals.css             Global styles (Tailwind)
├── components/
│   ├── JobForm.tsx             Form: job + LinkedIn (paste or upload)
│   ├── ResultView.tsx          Document preview and PDF downloads
│   └── Providers.tsx           React Query provider
├── lib/
│   ├── anthropic.ts            Claude calls, tools, retry, and validation
│   ├── prompt.ts               System prompts (voice, no-invention, ATS rules)
│   ├── schema.ts               Zod schemas and derived types
│   ├── language.ts             Language-detection heuristic
│   └── linkedin.ts             Text extraction from the LinkedIn PDF
└── pdf/
    ├── ResumeDocument.tsx      Résumé PDF document
    └── CoverLetterDocument.tsx Cover letter PDF document
```

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | Type checking (`tsc --noEmit`) |

---

## Known limitations

- **No test suite.** The project has no automated tests yet.
- **120s timeout** on the generation route (`maxDuration`). Very long postings and profiles can hit this ceiling.
- **8,192-token cap** per document. Very long profiles may be truncated; the app reports this and suggests shortening the input.
- **PDF extraction depends on layout.** LinkedIn's exported PDF works well; résumé PDFs with column layouts or heavy graphics may extract scrambled text. Paste the text instead in those cases.
- **PDF generation runs in the browser.** `@react-pdf/renderer` is loaded without SSR and assembles the file client-side.
