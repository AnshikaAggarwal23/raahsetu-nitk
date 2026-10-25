# RaahSetu frontend — Hackathon demonstration

This frontend is built specifically for the companion `RaahSetu_Backend_Ready_To_Run.zip`. It is **not a real emergency service**. SOS notifications, contact consent, and escalation on the backend are simulated. Never use this demo for actual emergencies or real private information.

## Run tonight

1. Extract this ZIP. Open the `raahsetu-frontend` folder in VS Code.
2. Install Node.js LTS if needed.
3. Open **Terminal → New Terminal** and run `npm install`.
4. Run `npm run dev`.
5. Open the URL shown in the terminal (usually `http://localhost:5173`).
6. On the **same computer**, start Anshika's backend in a **second VS Code terminal** with `npm install` then `npm start`. It listens on `http://localhost:5000`.

**If using two laptops:** `localhost` refers to each laptop separately. Easiest hackathon option: copy both project folders to one laptop and run both. Otherwise you must configure `VITE_API_URL` with a reachable backend address and configure backend CORS, firewall and network appropriately. Do not publicly expose the unsecured demo backend.

## Test order

1. Open frontend; select Hindi or another language.
2. Choose **Set up profile**, enter fictional name and 10-digit fictional demo phone number.
3. Add a fictional trusted contact, click **Simulate consent** (not real consent).
4. Open SOS; press and hold 2 seconds, then wait 5 seconds. Allow browser location access if prompted. You need HTTPS or localhost for browser geolocation. The server stores a demo alert, but does not send any real messages.
5. Check journey timer; try Safe and Extend.
6. Try cyber guidance and official reporting links. Upload **only a non-sensitive sample image**.
7. Test offline page: location SMS opens the phone messaging app and **requires user to select recipient and press Send**. SMS requires cellular network and may fail. On desktop the SMS link may not work.

## API URL

Default `http://localhost:5000/api`. If needed, create `.env` based on `.env.example`, then restart Vite. `VITE_` variables are exposed in the browser: never put secrets there.

## Limitations

- No user authentication, verified consent, real SMS, police integration, or secure evidence storage.
- Backend demo uses local JSON data; do not put real phone numbers, coordinates or evidence in it.
- Browser geolocation needs explicit permission and can be unavailable.
- Offline SMS uses a user-controlled composer. It is not an automatic SMS fallback.
- Language strings are included in `src/locales/`. Non-English translations require native-speaker review before actual deployment.
- This is a hackathon proof of concept, not production-ready safety software.
