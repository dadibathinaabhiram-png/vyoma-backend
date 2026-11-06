# VYOMA — background festival wishes (starter backend)

This project deliberately contains **no homepage design**. It is a starter backend for opt-in festival wishes via browser push notifications.

## Requirements
- Node.js 20+; Windows PowerShell or Terminal
- HTTPS deployment for actual web push (localhost is permitted for development)
- Verified DevDarsha account documentation and credentials

## Setup
1. Extract this ZIP, open a terminal in the `vyoma-backend` folder.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and set `ADMIN_TOKEN` to a long random value.
4. Generate VAPID keys with `npx web-push generate-vapid-keys` and place them in `.env`. Set `VAPID_SUBJECT` to a real contact email.
5. Run `npm start`. Check `http://localhost:3000/health`.
6. Run `npm test` for a date/time-zone scheduling test.

## DevDarsha integration — not yet connected
The exact DevDarsha API endpoint, authentication method, and JSON schema have **not been verified**. Do not guess them. Implement a server-side adapter using the official documentation and set `FESTIVAL_FEED_URL` to its private normalized feed endpoint. The current adapter expects:

```json
[{"id":"diwali-2027-IN-AP","name":"Diwali","date":"2027-10-29","message":"May this festival bring light and joy.","regions":["IN-AP"]}]
```

The example date above is illustrative only, **not a verified festival date**. Normalize regional dates and language-appropriate messages in the adapter. The existing fetch function passes `X-API-Key` only as a placeholder; replace it with the provider's documented authentication mechanism.

## Push flow
A minimal future permission screen must register `/sw.js`, request browser notification permission on a user click, call `pushManager.subscribe({userVisibleOnly:true,applicationServerKey:<VAPID public key>})`, and POST to `/api/subscriptions` with `{subscription,timeZone,region,sendHour,consent:true}`. Geolocation must be requested separately with consent; reverse-geocode coordinates to a region code **on the server**, or allow manual region selection. Never assume a region from browser coordinates without reverse geocoding. No consent means no subscription.

`DELETE /api/subscriptions` with `{endpoint}` unsubscribes a push endpoint (production must add authentication/proof-of-possession before permitting changes). `POST /admin/run` with header `x-admin-token` and body `{ "dryRun": true }` previews counts. For real delivery set `{ "dryRun": false }` and configure keys and festival feed.

Set `ENABLE_SCHEDULER=true` to enable hourly-eligibility checks once a minute. Local hour defaults to 9. The deduplication key is subscriber + festival ID + local date; successful sends are stored. `data/*.json` is a development-only local file store.

## Production work required before launch
- Replace JSON file storage with a transactional database, durable delivery queue, retry policy, monitoring, and scheduled worker; use a unique constraint on subscriber+festival+date to prevent concurrent duplicates.
- Implement authenticated subscription management, abuse/rate limits, CSRF/CORS restrictions, encryption at rest, retention and deletion controls.
- Verify DevDarsha terms, API response mapping, regional Panchang date rules and appropriate wish templates.
- Serve `/sw.js` at the site root over HTTPS; deploy a consent screen and clear opt-out controls.
- Verify browser-specific push behavior; delivery is not guaranteed if the browser or OS blocks notifications.
- Do not enable the scheduler with demo data or an unverified feed.
