const configs = window.INVITATION_CONFIGS || {};
const requestedConfig = new URLSearchParams(window.location.search).get("demo");
const activeInvitation = configs[requestedConfig] || configs["aarav-meera"];

const openButton = document.getElementById("openBtn");
const envelope = document.getElementById("envelope");
const intro = document.getElementById("intro");
const invitation = document.getElementById("invitation");
const form = document.getElementById("rsvpForm");
const status = document.getElementById("rsvpStatus");
const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
const openingDuration = reduceMotion ? 80 : 1900;
const countdownEls = ["days", "hours", "minutes", "seconds"].map((id) =>
  document.getElementById(id),
);
let isOpening = false;
let weddingDate = 0;
let formStartedAt = Date.now();
let rsvpAttempt = null;
let isSubmittingRsvp = false;

function rsvpButtonLabel() {
  return activeInvitation.rsvp.endpoint ? "Send RSVP ↗" : "Send demo RSVP ↗";
}

function setRsvpButtonLabel(button, label = rsvpButtonLabel()) {
  button.replaceChildren(document.createTextNode(`${label.replace(" ↗", "")} `));
  const icon = document.createElement("span");
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = "↗";
  button.append(icon);
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

function coupleName(couple) {
  return `${couple.firstName} & ${couple.secondName}`;
}

function setCoupleName(selector, couple, ampersandClass = "") {
  const element = document.querySelector(selector);
  if (!element) return;
  element.replaceChildren(document.createTextNode(`${couple.firstName} `));
  const ampersand = document.createElement(ampersandClass ? "em" : "i");
  ampersand.textContent = "&";
  element.append(ampersand, document.createTextNode(` ${couple.secondName}`));
}

function renderSchedule(schedule) {
  const scheduleElement = document.getElementById("eventSchedule");
  scheduleElement.replaceChildren();
  schedule.forEach((event) => {
    const item = document.createElement("li");
    const time = document.createElement("time");
    time.dateTime = event.isoTime;
    time.textContent = event.time;
    const content = document.createElement("div");
    const icon = document.createElement("span");
    icon.className = "schedule-mark";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = event.icon;
    const title = document.createElement("h4");
    title.textContent = event.title;
    const location = document.createElement("p");
    location.textContent = event.location;
    content.append(icon, title, location);
    item.append(time, content);
    scheduleElement.append(item);
  });
}

function renderGuestOptions(maxGuests) {
  const guestCount = document.getElementById("guestCount");
  guestCount.replaceChildren();
  for (let count = 1; count <= maxGuests; count += 1) {
    const option = document.createElement("option");
    option.value = String(count);
    option.textContent = `${count} ${count === 1 ? "guest" : "guests"}`;
    guestCount.append(option);
  }
}

function applyColors(colors) {
  const root = document.documentElement.style;
  root.setProperty("--emerald-950", colors.emeraldDeep);
  root.setProperty("--emerald-900", colors.emerald);
  root.setProperty("--emerald-800", colors.emerald);
  root.setProperty("--ivory", colors.ivory);
  root.setProperty("--gold", colors.gold);
  root.setProperty("--gold-pale", colors.goldPale);
}

function renderInvitation(config) {
  const { couple, wedding, messages, colors, music, photos, rsvp } = config;
  const fullName = coupleName(couple);
  weddingDate = new Date(wedding.isoDate).getTime();

  document.title = `${fullName} — Invitation Demo`;
  document
    .querySelector('meta[name="description"]')
    .setAttribute(
      "content",
      `A fictional wedding invitation demo for ${fullName}.`,
    );
  document
    .querySelector('meta[name="theme-color"]')
    .setAttribute("content", colors.emerald);
  applyColors(colors);
  document.body.dataset.musicEnabled = String(
    Boolean(music.enabled && music.src),
  );
  document.body.dataset.photoCount = String(photos.length);

  setText(".intro > .eyebrow", messages.introEyebrow);
  setText(".intro-kicker", fullName.toUpperCase());
  setText("#intro-title", messages.introTitle);
  setText(".intro-copy", messages.introCopy);
  setText(".letter-inner span", "THE WEDDING OF");
  setCoupleName(".letter-inner strong", couple);
  setText(".letter-inner small", wedding.shortDate);
  setText(".wax-seal span:first-child", couple.firstName.charAt(0));
  setText(".wax-seal span:last-child", couple.secondName.charAt(0));

  setText(".hero .eyebrow", messages.heroOverline);
  setText(".hero-pretitle", messages.heroPretitle);
  setCoupleName(".hero h2", couple, "em");
  setText(".hero-subtitle", messages.heroSubtitle);
  setText(".hero-date", wedding.dateDisplay);
  const venue = document.querySelector(".hero-venue");
  venue.replaceChildren(document.createTextNode(`${wedding.venue} `));
  const separator = document.createElement("b");
  separator.textContent = "·";
  venue.append(separator, document.createTextNode(` ${wedding.location}`));

  document.querySelector(".event-intro h3").innerHTML =
    messages.celebrationTitle;
  setText(".event-intro > p:not(.demo-note)", messages.celebrationCopy);
  document.getElementById("venueLink").href = wedding.mapUrl;
  setText(
    "#venueNote",
    `Demo map opens a ${wedding.location} search, not a confirmed venue.`,
  );
  renderSchedule(config.schedule);

  setText("#rsvp-title", messages.rsvpTitle);
  setText(".rsvp-copy > p:last-child", messages.rsvpCopy);
  setText(
    "#rsvpNote",
    rsvp.endpoint
      ? "RSVP submissions are sent to the configured service."
      : "Demo only: confirmation appears in this browser. No RSVP is sent or stored.",
  );
  renderGuestOptions(rsvp.maxGuests);
  formStartedAt = Date.now();
  rsvpAttempt = null;
  setRsvpButtonLabel(form.querySelector('[type="submit"]'));

  const footerInitials = document.querySelector("footer strong");
  footerInitials.replaceChildren(
    document.createTextNode(`${couple.firstName.charAt(0)} `),
  );
  const footerAmpersand = document.createElement("i");
  footerAmpersand.textContent = "&";
  footerInitials.append(
    footerAmpersand,
    document.createTextNode(` ${couple.secondName.charAt(0)}`),
  );
  updateCountdown();
}

function setupDemoSwitcher() {
  const switcher = document.getElementById("demoInvitation");
  Object.values(configs).forEach((config) => {
    const option = document.createElement("option");
    option.value = config.id;
    option.textContent = config.label;
    option.selected = config.id === activeInvitation.id;
    switcher.append(option);
  });
  switcher.addEventListener("change", () => {
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("demo", switcher.value);
    window.location.assign(nextUrl);
  });
}

function revealInvitation() {
  invitation.hidden = false;
  window.scrollTo({ top: 0, behavior: "auto" });
  intro.hidden = true;
  const invitationTitle = document.querySelector(".hero h2");
  invitationTitle.setAttribute("tabindex", "-1");
  invitationTitle.focus({ preventScroll: true });
}

openButton.addEventListener("click", () => {
  if (isOpening) return;
  isOpening = true;
  openButton.disabled = true;
  openButton.setAttribute("aria-busy", "true");
  openButton.querySelector("span").textContent = "Opening…";
  envelope.classList.add("open");
  window.setTimeout(revealInvitation, openingDuration);
});

function updateCountdown() {
  const secondsUntilWedding = Math.max(
    0,
    Math.floor((weddingDate - Date.now()) / 1000),
  );
  const values = [
    Math.floor(secondsUntilWedding / 86400),
    Math.floor((secondsUntilWedding % 86400) / 3600),
    Math.floor((secondsUntilWedding % 3600) / 60),
    secondsUntilWedding % 60,
  ];
  values.forEach((value, index) => {
    countdownEls[index].textContent = String(value).padStart(2, "0");
  });
}

function setRsvpStatus(message, state = "") {
  status.textContent = message;
  status.dataset.state = state;
}

async function submitRsvp(payload) {
  if (!activeInvitation.rsvp.endpoint) return { mode: "demo" };
  let endpoint;
  try {
    endpoint = new URL(activeInvitation.rsvp.endpoint);
  } catch {
    throw new Error("This invitation's RSVP service is not configured correctly.");
  }
  if (endpoint.protocol !== "https:") {
    throw new Error("This invitation's RSVP service must use a secure connection.");
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12000);
  let response;
  try {
    // No custom header: Apps Script accepts this as a simple cross-origin request.
    response = await fetch(endpoint.href, {
      method: "POST",
      body: JSON.stringify(payload),
      signal: controller.signal,
      redirect: "follow",
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("The RSVP service took too long to respond. Please try again.");
    }
    throw new Error("We could not reach the RSVP service. Check your connection and try again.");
  } finally {
    window.clearTimeout(timeout);
  }

  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("The RSVP service returned an unexpected response. Please try again.");
  }
  if (!response.ok || !result || result.ok !== true || result.saved !== true) {
    throw new Error(result?.message || "The RSVP service could not save your response.");
  }
  return { mode: "live", duplicate: Boolean(result.duplicate) };
}

function createSubmissionId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  const bytes = new Uint32Array(4);
  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, (value) => value.toString(36)).join("");
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-rsvp`;
}

function submissionFor(payload) {
  const signature = JSON.stringify(payload);
  if (!rsvpAttempt || rsvpAttempt.signature !== signature) {
    rsvpAttempt = { signature, submissionId: createSubmissionId() };
  }
  return rsvpAttempt.submissionId;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (isSubmittingRsvp) return;
  if (!form.reportValidity()) {
    setRsvpStatus(
      "Please complete the required fields before continuing.",
      "error",
    );
    return;
  }
  isSubmittingRsvp = true;

  const submitButton = form.querySelector('[type="submit"]');
  const data = new FormData(form);
  const payload = {
    invitationId: activeInvitation.id,
    guestName: String(data.get("guestName")).trim(),
    attendance: data.get("attendance"),
    guestCount: Number(data.get("guestCount")),
    message: String(data.get("message") || "").trim(),
    website: String(data.get("website") || ""),
    formAgeMs: Date.now() - formStartedAt,
  };
  payload.submissionId = submissionFor({
    invitationId: payload.invitationId,
    guestName: payload.guestName,
    attendance: payload.attendance,
    guestCount: payload.guestCount,
    message: payload.message,
  });
  submitButton.disabled = true;
  submitButton.textContent = "Submitting…";
  setRsvpStatus("Preparing your RSVP response…", "pending");

  try {
    const result = await submitRsvp(payload);
    const response =
      payload.attendance === "yes"
        ? "Joyfully accepted"
        : "Regretfully declined";
    if (result.mode === "demo") {
      setRsvpStatus(
        `Thank you, ${payload.guestName}. Demo response: ${response}. No information was submitted or stored.`,
        "success",
      );
    } else {
      setRsvpStatus(
        result.duplicate
          ? `Thank you, ${payload.guestName}. Your RSVP is already safely recorded.`
          : `Thank you, ${payload.guestName}. Your RSVP has been saved.`,
        "success",
      );
    }
    form.reset();
    rsvpAttempt = null;
    formStartedAt = Date.now();
  } catch (error) {
    setRsvpStatus(
      error.message || "Unable to submit your RSVP. Please try again later.",
      "error",
    );
  } finally {
    isSubmittingRsvp = false;
    submitButton.disabled = false;
    setRsvpButtonLabel(submitButton);
  }
});

renderInvitation(activeInvitation);
setupDemoSwitcher();
window.setInterval(updateCountdown, 1000);
