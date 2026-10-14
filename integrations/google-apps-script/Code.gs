/**
 * Reusable RSVP receiver for a Google Apps Script Web App.
 *
 * Keep spreadsheet IDs and the allow-list in Script Properties, never in the
 * public invitation files. See integrations/google-apps-script/README.md for setup.
 */
const RSVP_COLUMNS = [
  "Timestamp",
  "Invitation ID",
  "Guest Name",
  "Attendance",
  "Guest Count",
  "Message",
  "Submission ID",
  "Fingerprint",
];

const RSVP_LIMITS = Object.freeze({
  maxPayloadBytes: 2048,
  maxNameLength: 80,
  maxMessageLength: 500,
  maxGuests: 10,
  minimumFormAgeMs: 800,
  maximumFormAgeMs: 24 * 60 * 60 * 1000,
  duplicateWindowMs: 15 * 60 * 1000,
  duplicateLookbackRows: 500,
});

function doGet() {
  return json_({ ok: true, service: "rsvp-receiver" });
}

function doPost(event) {
  let lock;
  try {
    const payload = validatePayload_(parsePayload_(event));
    lock = LockService.getScriptLock();
    if (!lock.tryLock(5000)) {
      throw new RsvpError_("busy", "The RSVP service is busy. Please try again in a moment.");
    }
    return json_(saveRsvp_(payload));
  } catch (error) {
    console.error(error);
    const known = error instanceof RsvpError_;
    return json_({
      ok: false,
      saved: false,
      code: known ? error.code : "server_error",
      message: known ? error.message : "We could not save this RSVP. Please try again.",
    });
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }
}

function setupRsvpSheet() {
  const sheet = getRsvpSheet_();
  const firstRow = sheet.getRange(1, 1, 1, RSVP_COLUMNS.length).getValues()[0];
  if (firstRow.join("|") !== RSVP_COLUMNS.join("|")) {
    sheet.getRange(1, 1, 1, RSVP_COLUMNS.length).setValues([RSVP_COLUMNS]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, RSVP_COLUMNS.length).setFontWeight("bold");
  }
  return `RSVP sheet ready: ${sheet.getName()}`;
}

function parsePayload_(event) {
  const content = event && event.postData && event.postData.contents;
  if (typeof content !== "string" || !content) {
    throw new RsvpError_("invalid_request", "A valid RSVP payload is required.");
  }
  if (content.length > RSVP_LIMITS.maxPayloadBytes) {
    throw new RsvpError_("payload_too_large", "This RSVP is too long to submit.");
  }
  try {
    const payload = JSON.parse(content);
    if (!payload || Array.isArray(payload) || typeof payload !== "object") throw new Error("not an object");
    return payload;
  } catch (error) {
    throw new RsvpError_("invalid_request", "The RSVP format is invalid.");
  }
}

function validatePayload_(payload) {
  if (String(payload.website || "").trim()) {
    throw new RsvpError_("spam", "This RSVP could not be accepted.");
  }
  const invitationId = clean_(payload.invitationId, 64);
  if (!/^[a-z0-9][a-z0-9-]{1,63}$/.test(invitationId) || !allowedInvitationIds_().includes(invitationId)) {
    throw new RsvpError_("invalid_invitation", "This invitation is not authorised for RSVP collection.");
  }

  const guestName = clean_(payload.guestName, RSVP_LIMITS.maxNameLength);
  if (guestName.length < 2) throw new RsvpError_("invalid_name", "Please enter your full name.");

  const attendance = clean_(payload.attendance, 3);
  if (!["yes", "no"].includes(attendance)) {
    throw new RsvpError_("invalid_attendance", "Please select an attendance response.");
  }

  const guestCount = Number(payload.guestCount);
  if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > RSVP_LIMITS.maxGuests) {
    throw new RsvpError_("invalid_guest_count", "Please choose a valid number of guests.");
  }

  const message = clean_(payload.message || "", RSVP_LIMITS.maxMessageLength);
  const submissionId = clean_(payload.submissionId, 80);
  if (!/^[a-zA-Z0-9_-]{16,80}$/.test(submissionId)) {
    throw new RsvpError_("invalid_submission", "This RSVP could not be verified. Please try again.");
  }

  const formAgeMs = Number(payload.formAgeMs);
  if (!Number.isFinite(formAgeMs) || formAgeMs < RSVP_LIMITS.minimumFormAgeMs || formAgeMs > RSVP_LIMITS.maximumFormAgeMs) {
    throw new RsvpError_("invalid_request", "Please wait a moment and submit your RSVP again.");
  }

  return {
    invitationId,
    guestName,
    attendance,
    guestCount,
    message,
    submissionId,
    fingerprint: fingerprint_([invitationId, guestName.toLowerCase(), attendance, guestCount, message.toLowerCase()].join("|")),
  };
}

function saveRsvp_(payload) {
  const sheet = getRsvpSheet_();
  ensureHeader_(sheet);
  const existing = findDuplicate_(sheet, payload);
  if (existing.submissionId) {
    // Idempotent retry: the exact prior submission is confirmed in the sheet.
    return { ok: true, saved: true, duplicate: true, submissionId: payload.submissionId };
  }
  if (existing.fingerprint) {
    throw new RsvpError_("duplicate", "A matching RSVP was recently received. Please contact the hosts if you need to change it.");
  }

  sheet.appendRow([
    new Date(),
    payload.invitationId,
    payload.guestName,
    payload.attendance,
    payload.guestCount,
    payload.message,
    payload.submissionId,
    payload.fingerprint,
  ]);
  return { ok: true, saved: true, duplicate: false, submissionId: payload.submissionId };
}

function findDuplicate_(sheet, payload) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { submissionId: false, fingerprint: false };
  const startRow = Math.max(2, lastRow - RSVP_LIMITS.duplicateLookbackRows + 1);
  const rows = sheet.getRange(startRow, 1, lastRow - startRow + 1, RSVP_COLUMNS.length).getValues();
  const cutoff = Date.now() - RSVP_LIMITS.duplicateWindowMs;
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    const row = rows[index];
    if (String(row[6]) === payload.submissionId) return { submissionId: true, fingerprint: false };
    const timestamp = row[0] instanceof Date ? row[0].getTime() : new Date(row[0]).getTime();
    if (String(row[1]) === payload.invitationId && String(row[7]) === payload.fingerprint && timestamp >= cutoff) {
      return { submissionId: false, fingerprint: true };
    }
  }
  return { submissionId: false, fingerprint: false };
}

function getRsvpSheet_() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty("RSVP_SPREADSHEET_ID");
  if (!spreadsheetId) throw new RsvpError_("configuration", "The RSVP service is not configured yet.");
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const sheetName = PropertiesService.getScriptProperties().getProperty("RSVP_SHEET_NAME") || "RSVPs";
  return spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
}

function ensureHeader_(sheet) {
  const headers = sheet.getRange(1, 1, 1, RSVP_COLUMNS.length).getValues()[0];
  if (headers.join("|") !== RSVP_COLUMNS.join("|")) {
    throw new RsvpError_("configuration", "The RSVP sheet headers do not match the required structure.");
  }
}

function allowedInvitationIds_() {
  const raw = PropertiesService.getScriptProperties().getProperty("RSVP_ALLOWED_INVITATIONS");
  try {
    const ids = JSON.parse(raw || "[]");
    if (!Array.isArray(ids) || !ids.length || !ids.every((id) => typeof id === "string")) throw new Error("invalid allow-list");
    return ids;
  } catch (error) {
    throw new RsvpError_("configuration", "The RSVP invitation allow-list is not configured.");
  }
}

function clean_(value, maximumLength) {
  const cleaned = String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  if (cleaned.length > maximumLength) throw new RsvpError_("payload_too_large", "One of the RSVP fields is too long.");
  return cleaned;
}

function fingerprint_(value) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value);
  return digest.map((byte) => ((byte + 256) % 256).toString(16).padStart(2, "0")).join("");
}

function json_(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}

function RsvpError_(code, message) {
  this.name = "RsvpError";
  this.code = code;
  this.message = message;
}
RsvpError_.prototype = Object.create(Error.prototype);
