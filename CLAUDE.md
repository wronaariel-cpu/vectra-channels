# vectra-channels

Aplikacja webowa z listami kanałów TV/radio dla różnych sieci telewizji kablowej (Zabrze/Play, Elsat) — przegląd, filtrowanie i eksport do PDF.

## Stack
- Frontend: Vite + React 19 + TypeScript (`src/App.tsx`, `src/main.tsx`)
- Backend: Express + PostgreSQL (`server.js`), sesje przez `express-session` + `connect-pg-simple`, hasła przez `bcryptjs`
- Eksport PDF: `jspdf` + `jspdf-autotable`, polskie znaki obsługiwane przez wbudowany font Roboto (`src/utils/fonts/`)

## Komendy
- `npm run dev` — dev server (Vite)
- `npm run build` — `tsc -b && vite build`
- `npm run preview` — podgląd builda
- `npm run start` — uruchomienie `server.js` (backend produkcyjny)

## Struktura danych
- `src/data/channels-*.ts` — listy kanałów per sieć/wariant: `channels-analog`, `channels-digital`, `channels-digital-elsat`, `channels-elsat`, `channels-new`, `channels-old`
- `src/utils/exportPdf.ts` — generowanie PDF z listy kanałów (używa fontu z `src/utils/fonts/`)
- `src/types.ts` — typy współdzielone

## Deploy — WAŻNE
Push na branch `master` **automatycznie uruchamia deploy produkcyjny** przez GitHub Actions → Railway (`.github/workflows/deploy.yml`, trigger: `push: branches: [master]`). Nie pushować niedokończonych/niepewnych zmian na `master`.

## Workflow zapisu (autosave)
Globalny hook (`~/.claude/settings.json`, `PostToolUse` na `Edit|Write|NotebookEdit`) automatycznie robi **lokalny** `git commit` po każdej zmianie pliku w dowolnym repo — użytkownik chce mieć pewność, że żadna praca nie zginie przy przypadkowym zamknięciu okna/czatu. Hook nigdy nie robi `git push` — push na `master` zawsze wymaga świadomej decyzji (ze względu na auto-deploy powyżej).
