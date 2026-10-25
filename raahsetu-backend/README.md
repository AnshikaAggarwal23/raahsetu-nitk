# RaahSetu Backend — Hackathon Demo

**This is a demonstration, NOT a real emergency response service.** It does **not** send SMS, verify contact consent, authenticate users, or dispatch police. Never rely on it for personal safety. For emergencies in India call **112**.

## Run in VS Code

1. Extract this ZIP and open the `raahsetu-backend` folder in VS Code.
2. Install Node.js LTS from https://nodejs.org if needed.
3. Open **Terminal → New Terminal**.
4. Run `npm install`.
5. Run `npm start`.
6. Visit http://localhost:5000/api/health — you should see `success: true`.

No MongoDB account is required: this demo saves data locally in `data/demo.json`. Do not put real phone numbers, locations, or evidence into this demo. For real deployment, add authenticated users, verified consent, secure persistent storage, a compliant messaging provider, retry queues, monitoring, privacy controls and security review.

## Test the demo with Postman or Thunder Client

Set base URL to `http://localhost:5000`. All JSON requests need `Content-Type: application/json`.

### 1. Create a user
`POST /api/users`
```json
{"name":"Demo User","phone":"9999999999","language":"hi"}
```
Copy the `user.id` from the response as USER_ID.

### 2. Add a contact
`POST /api/contacts`
```json
{"userId":"USER_ID","name":"Demo Contact","phone":"9888888888"}
```
Copy the `contact.id` as CONTACT_ID.

### 3. Simulate contact acceptance
`POST /api/contacts/CONTACT_ID/accept` with `{}`. **This is simulated and not verified consent.**

### 4. Create SOS
`POST /api/alerts`
```json
{"userId":"USER_ID","latitude":28.7041,"longitude":77.1025}
```
This stores an alert and logs a *simulated* contact notification. Copy `alert.id` as ALERT_ID.

### 5. Simulate acknowledgment
`POST /api/alerts/ALERT_ID/acknowledge`
```json
{"contactId":"CONTACT_ID"}
```

### 6. Start a journey
`POST /api/journeys`
```json
{"userId":"USER_ID","durationMinutes":1}
```
Copy the `journey.id`, then `PATCH /api/journeys/JOURNEY_ID` with `{"action":"safe"}` or `{"action":"extend"}` or `{"action":"help"}`.

### 7. Cyber guidance
`GET /api/cyber/guides`

### 8. Evidence upload (optional demo only)
`POST /api/evidence` as **multipart/form-data** with `userId` (text) and `screenshot` (PNG/JPG/WebP file, max 2 MB). Do **not** use real private evidence. Files are stored locally, unencrypted, and are not safe for production.

## API summary

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/users` | Create demo user |
| GET | `/api/users/:id` | Get demo user |
| POST | `/api/contacts` | Add contact (pending) |
| GET | `/api/contacts?userId=...` | List contacts |
| POST | `/api/contacts/:id/accept` | Simulate acceptance |
| POST | `/api/alerts` | Store SOS and simulate notification |
| GET | `/api/alerts?userId=...` | List alerts |
| POST | `/api/alerts/:id/acknowledge` | Simulate acknowledgment |
| POST | `/api/journeys` | Start journey |
| PATCH | `/api/journeys/:id` | safe / extend / help |
| GET | `/api/journeys?userId=...` | List journeys |
| GET | `/api/cyber/guides` | Safety guides |
| POST | `/api/evidence` | Local demo screenshot upload |

## Frontend connection

From Vite React on port 5173:
```js
const API = 'http://localhost:5000/api';
const response = await fetch(`${API}/health`);
const data = await response.json();
console.log(data);
```

For SOS, the frontend should do the 2-second hold and 5-second cancel countdown, request geolocation permission, then `POST /api/alerts` with a real numeric latitude/longitude and the demo userId. The backend **never** claims real delivery. Offline SMS composer is a separate frontend feature and requires the user to press Send.

## Known limits

- No login, identity checks, permission checks, verified invitations, real SMS, police integration, or secure evidence storage.
- `data/demo.json` is a simple local JSON file, not MongoDB. It is for a single-process demo and not multi-user production traffic.
- Escalation is a timer-based *simulation* that advances through accepted demo contacts every 60 seconds. No message is delivered.
- Missed journey check-ins are recorded as missed, but do not send a notification automatically.
- Server must remain running for timer checks. When it restarts, persisted deadlines are checked on the next timer tick.
- The demo accepts arbitrary user IDs; do not expose it publicly or enter real sensitive information.
