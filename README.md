# CareCompass: AI Symptom Checker & Doctor Recommendation

Full-stack SPA for the JavaScript Framework (PBL) project.

| Layer | Tech | Folder |
|---|---|---|
| Frontend | React (Vite), Redux Toolkit, React Router, Axios | `client/` |
| Backend API | Node.js, Express (MVC), JWT, Mongoose | `server/` |
| AI microservice | Python FastAPI (rule-based weighted scoring) | `ai-service/` |
| Database | MongoDB (Atlas) | n/a |

```
React client ──JWT──▶ Express API ──▶ MongoDB
                          └──API key──▶ FastAPI /predict
```

The browser never calls FastAPI directly. Express checks the JWT, forwards symptoms to FastAPI with an internal API key, saves the result and returns recommended doctors.

## Implemented features (Must-have scope)

- Register / login with JWT, bcrypt password hashing, roles (`patient`, `admin`)
- Protected routes (React + Express), global 401 handling via Axios interceptor
- Symptom checker: multi-select + free text + age/gender, top-3 conditions with confidence, recommended specialty, urgent-care warning, disclaimer
- Doctor list filtered by specialty, sortable by rating / fees / experience
- Appointment booking with slot availability and **double-booking prevention** (unique partial index)
- Patient dashboard: upcoming/past appointments, cancel, symptom history

**Not built (future scope):** doctor dashboard, admin UI (admin endpoints exist and work via Postman), email notifications, reviews.

## Run locally

Prerequisites: Node.js LTS, Python 3.11+, a MongoDB Atlas free cluster (or local MongoDB).

### 1. AI service
```bash
cd ai-service
python -m venv venv
venv\Scripts\activate            # Windows  (Mac/Linux: source venv/bin/activate)
pip install -r requirements.txt
cp .env.example .env             # set AI_SERVICE_KEY
uvicorn main:app --reload --port 8000
```
Docs at http://localhost:8000/docs

### 2. Server
```bash
cd server
npm install
cp .env.example .env             # fill MONGO_URI, JWT_SECRET, AI_SERVICE_KEY (same as above)
npm run seed                     # demo doctors + admin user (uses ADMIN_EMAIL / ADMIN_PASSWORD from .env)
npm run dev                      # http://localhost:5000
```

### 3. Client
```bash
cd client
npm install
cp .env.example .env
npm run dev                      # http://localhost:5173
```

## Tests
```bash
cd server && npm test            # smoke tests + integration tests (integration downloads a MongoDB binary on first run)
cd client && npm test            # vitest unit tests
```

## API summary

**Express** (`/api`)

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | /auth/register | none | Create patient account |
| POST | /auth/login | none | Login, returns JWT |
| GET | /auth/me | JWT | Current user |
| GET | /symptoms/list | JWT | Symptom options (from FastAPI) |
| POST | /symptoms/analyze | JWT | Analyse symptoms, save log, recommend doctors |
| GET | /symptoms/history | JWT | My symptom checks |
| GET | /doctors?specialty=&sort= | JWT | List doctors |
| GET | /doctors/specialties | JWT | Distinct specialties |
| GET | /doctors/:id | JWT | Doctor profile |
| GET | /doctors/:id/slots?date= | JWT | Slots with availability flag |
| POST / PUT / DELETE | /doctors, /doctors/:id | Admin | Manage doctors |
| POST | /appointments | JWT | Book a slot |
| GET | /appointments/my | JWT | My appointments |
| PATCH | /appointments/:id/cancel | JWT (owner) | Cancel |
| GET | /appointments | Admin | All appointments |

**FastAPI:** `GET /health`, `GET /symptoms`, `POST /predict` (header `X-API-Key`)

## Environment variables (names only)

- **server:** `PORT`, `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `AI_SERVICE_URL`, `AI_SERVICE_KEY`, `CLIENT_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (seed only)
- **client:** `VITE_API_BASE_URL`
- **ai-service:** `AI_SERVICE_KEY`

Never commit `.env` files. `.gitignore` already excludes them.

## Deployment

1. **MongoDB Atlas:** create M0 cluster, DB user, allow network access (0.0.0.0/0 for a demo), copy the connection string.
2. **FastAPI on Render** (Web Service, root `ai-service`): build `pip install -r requirements.txt`, start `uvicorn main:app --host 0.0.0.0 --port $PORT`. Set `AI_SERVICE_KEY`.
3. **Express on Render** (Web Service, root `server`): build `npm install`, start `npm start`. Set `MONGO_URI`, `JWT_SECRET`, `AI_SERVICE_URL` (the FastAPI URL), `AI_SERVICE_KEY`, `CLIENT_URL` (your Vercel URL). Run `npm run seed` once (from your machine with the production `MONGO_URI`, or in the Render shell).
4. **React on Vercel** (root `client`): build `npm run build`, output `dist`. Set `VITE_API_BASE_URL=https://<express-service>/api`. `vercel.json` handles SPA routing (`public/_redirects` for Netlify).

Render free services sleep when idle, so the first request can take ~30-60 seconds.
