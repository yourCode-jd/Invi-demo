# Google Sheets RSVP receiver

This folder contains the server-side source for the invitation template. It is deliberately separate from the public site: the Spreadsheet ID, Google authorization, and script properties remain in Google Apps Script.

## Sheet structure

Create a Google Sheet owned by the customer. The `setupRsvpSheet` function creates the `RSVPs` tab and these columns:

| Timestamp | Invitation ID | Guest Name | Attendance | Guest Count | Message | Submission ID | Fingerprint |
| --- | --- | --- | --- | --- | --- | --- | --- |

One tab safely serves many invitations. Filter the **Invitation ID** column for a single couple. The last two columns support idempotent retries and short-window duplicate detection; leave them intact.

## Deploy

1. Open [script.new](https://script.new), name the project (for example, `Wedding RSVP Receiver`), and replace its default file with `Code.gs` from this folder.
2. In **Project Settings → Script properties**, add:
   - `RSVP_SPREADSHEET_ID`: the ID between `/d/` and `/edit` in the customer-owned Sheet URL.
   - `RSVP_ALLOWED_INVITATIONS`: a JSON list of permitted configuration IDs, for example `["aarav-meera","vivaan-anaya","arjun-isha"]`.
   - `RSVP_SHEET_NAME`: optional; defaults to `RSVPs`.
3. In the Apps Script editor, run `setupRsvpSheet` once and approve Google’s authorization prompt. Confirm that the `RSVPs` tab has the exact header row above.
4. Choose **Deploy → New deployment → Web app**. Execute as **Me**; set access to the smallest setting that allows invitees to use it (for a public invitation this is commonly **Anyone**). Deploy and copy the production URL ending in `/exec`.
5. In `config/invitations.js`, set the relevant customer’s `rsvp.endpoint` to that `/exec` URL. Do not put the Sheet ID, OAuth tokens, or any Google credential in the frontend.
6. Submit one real test RSVP, then confirm the row is present in the intended Sheet before using the endpoint for guests.

After backend code changes, create a new web-app deployment version and update the endpoint only if Google provides a new URL.

## Behaviour and safeguards

- The backend accepts only allow-listed invitation IDs, validates all fields, limits request/name/message size, uses a hidden honeypot, and rejects implausibly instant form submissions.
- A script lock serializes simultaneous requests. A submission ID makes an interrupted browser retry idempotent; it receives a positive response only when the original row can be found. A matching RSVP fingerprint is blocked for 15 minutes to reduce accidental duplicates.
- The Apps Script web-app response is JSON. A `saved: true` response is required before the browser presents a real success state. Network errors and malformed responses stay as errors and can be retried.
- Leave `rsvp.endpoint` blank for the safe local demo mode. It never sends or stores RSVP data.

This is basic public-form abuse protection, not a substitute for a CAPTCHA or authenticated gateway if a public endpoint attracts sustained spam.
