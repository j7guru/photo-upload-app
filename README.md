# Photo Upload App

Next.js 14 web app that connects to a Baserow database so warehouse or operations teams can pick a record, upload a JPG/PNG, and have that photo added to the record’s `Photo` field without leaving the browser.

## Features
- Responsive dashboard built with the App Router + Tailwind CSS.
- Server-rendered record table pulled straight from Baserow via the REST API.
- Client-side record refresh with selection highlighting and invoiced status badges.
- Drag-and-drop-friendly file input with live upload progress, success/error alerts, and preview.
- Secure Next.js API route (`/api/upload`) that uses `formidable` to parse multipart uploads, forwards the file to Baserow’s attachment endpoint, and patches the record’s `Photo` field.

## Tech Stack
- Next.js 14 (App Router) + React 18
- Next.js API Routes (pages directory) for file handling
- Tailwind CSS 3
- Axios + FormData for proxying uploads to Baserow

## Prerequisites
- Node.js 18.17+ (matches Next.js 14 requirements)
- A Baserow account with an attachment field named `Photo`

## Local Setup
```bash
npm install

npm run dev
```

The dev server runs at http://localhost:3000. All credentials stay server-side; the browser never sees the API token.

## Environment Variables
| Name | Required | Description |
| --- | --- | --- |
| `BASEROW_API_TOKEN` | ✅ | Personal API token with access to the target table (paste the raw token; the app also trims a leading `Token ` prefix if you copy the entire header) |
| `BASEROW_BASE_URL` | ✅ | Base URL for your Baserow instance (no trailing slash), e.g. `https://api.baserow.io` |
| `BASEROW_TABLE_ID` | ✅ | Numeric table ID containing the fields described in the brief |

## How It Works
1. **Fetching records** – Server components call the Baserow REST API (`GET /api/database/rows/table/{table_id}/?user_field_names=true`) via `fetchShipmentRows`. Client-side refreshes hit `/api/records`, which wraps the same helper.
2. **Selecting & previewing** – The dashboard shows the key fields plus invoiced status. Selecting a row updates the preview with the current photo if one exists.
3. **Uploading** – Images are posted to `/api/upload` using multipart/form-data. The API route:
   - Parses the form with `formidable`.
   - Streams the file to Baserow’s `POST /api/user-files/upload-file/`.
   - Patches the row via `PATCH /api/database/rows/table/{table_id}/{row_id}/` with the returned attachment payload.
   - Returns the attachment metadata so the UI can refresh immediately.
4. **Progress & feedback** – Axios `onUploadProgress` drives the progress bar, while success/error states surface toasts and the latest preview.

## Deployment
The project is Next.js-only (no custom server), so it deploys cleanly to Vercel or Netlify:
1. Push the repo to GitHub/GitLab.
2. Create a new project in your hosting provider and point it at the repo.
3. Add the three environment variables in the provider’s dashboard.
4. Trigger a build; no additional configuration is needed.

## Useful Scripts
| Script | Description |
| --- | --- |
| `npm run dev` | Start Next.js in development with hot reload |
| `npm run build` | Create the production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run Next.js ESLint |

## Notes
- The Tailwind config already scans `src/app`, `src/components`, and `src/pages`.
- Remote images from Baserow domains are allowed via `next.config.mjs`; update the patterns if you host Baserow elsewhere.
- Increase the `maxFileSize` in `pages/api/upload.ts` if you expect images >15 MB.
