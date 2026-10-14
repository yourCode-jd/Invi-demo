const royalConfigs = window.INVITATION_CONFIGS || {};
const requestedRoyalConfig = new URLSearchParams(window.location.search).get("demo");
const royalInvitationConfig =
  royalConfigs[requestedRoyalConfig]?.template === "royal-punjabi"
    ? royalConfigs[requestedRoyalConfig]
    : royalConfigs["gursewak-simran"];

const royalOpenButton = document.getElementById("royalOpen");
const royalStage = document.querySelector(".darbar-stage");
const royalEntrance = document.getElementById("royalEntrance");
const royalInvitation = document.getElementById("royalInvitation");
const royalForm = document.getElementById("royalRsvpForm");
const royalStatus = document.getElementById("royalRsvpStatus");
const reduceRoyalMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const royalOpeningDuration = reduceRoyalMotion ? 70 : 1750;
const royalCountdown = ["royalDays", "royalHours", "royalMinutes", "royalSeconds"].map((id) => document.getElementById(id));
let royalWeddingDate = 0;
let isRoyalOpening = false;
let royalFormStartedAt = Date.now();
let royalAttempt = null;
let isRoyalSubmitting = false;

function royalSetText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

function royalNames(couple) {
  return `${couple.firstName} & ${couple.secondName}`;
}

function royalSetCoupleName(selector, couple) {
  const element = document.querySelector(selector);
  if (!element) return;
  element.replaceChildren(document.createTextNode(`${couple.firstName} `));
  const ampersand = document.createElement("i");
  ampersand.textContent = "&";
  element.append(ampersand, document.createTextNode(` ${couple.secondName}`));
}

function renderRoyalSchedule(schedule) {
  const scheduleElement = document.getElementById("royalSchedule");
  scheduleElement.replaceChildren();
  schedule.forEach((event) => {
    const item = document.createElement("li");
    const time = document.createElement("time");
    time.dateTime = event.isoTime;
    time.textContent = event.time;
    const content = document.createElement("div");
    const icon = document.createElement("span");
    icon.className = "royal-schedule-mark";
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

function renderRoyalGuestOptions(maxGuests) {
  const guestCount = document.getElementById("royalGuestCount");
  guestCount.replaceChildren();
  for (let count = 1; count <= maxGuests; count += 1) {
    const option = document.createElement("option");
    option.value = String(count);
    option.textContent = `${count} ${count === 1 ? "guest" : "guests"}`;
    guestCount.append(option);
  }
}

function setRoyalButtonLabel(button, label = royalInvitationConfig.rsvp.endpoint ? "Send RSVP" : "Send demo RSVP") {
  button.replaceChildren(document.createTextNode(`${label} `));
  const mark = document.createElement("b");
  mark.setAttribute("aria-hidden", "true");
  mark.textContent = "✦";
  button.append(mark);
}

function renderRoyalInvitation(config) {
  const { couple, wedding, messages, colors, rsvp } = config;
  royalWeddingDate = new Date(wedding.isoDate).getTime();
  document.title = `${royalNames(couple)} — Royal Punjabi Invitation`;
  document.querySelector('meta[name="description"]').setAttribute("content", `A fictional Royal Punjabi wedding invitation demo for ${royalNames(couple)}.`);
  document.querySelector('meta[name="theme-color"]').setAttribute("content", colors.emerald);
  document.documentElement.style.setProperty("--royal-wine", colors.emerald);
  document.documentElement.style.setProperty("--royal-wine-deep", colors.emeraldDeep);
  document.documentElement.style.setProperty("--royal-gold", colors.gold);
  document.documentElement.style.setProperty("--royal-gold-light", colors.goldPale);
  document.documentElement.style.setProperty("--royal-ivory", colors.ivory);

  royalSetText(".royal-entrance > .royal-kicker", messages.introEyebrow);
  royalSetText(".royal-names", royalNames(couple).toUpperCase());
  royalSetText("#royal-entrance-title", messages.introTitle);
  royalSetText(".royal-intro-copy", messages.introCopy);
  royalSetText(".card-overline", "TOGETHER WITH THEIR FAMILIES");
  royalSetCoupleName(".darbar-card strong", couple);
  royalSetText(".card-date", wedding.shortDate);

  royalSetText(".royal-hero > .royal-kicker", messages.heroOverline);
  royalSetText(".royal-pretitle", messages.heroPretitle);
  royalSetCoupleName(".royal-hero h2", couple);
  royalSetText(".royal-subtitle", messages.heroSubtitle);
  royalSetText(".royal-date", wedding.dateDisplay);
  const venue = document.querySelector(".royal-venue");
  venue.replaceChildren(document.createTextNode(`${wedding.venue} `));
  const separator = document.createElement("b");
  separator.textContent = "·";
  venue.append(separator, document.createTextNode(` ${wedding.location}`));

  document.querySelector(".royal-event-copy h3").innerHTML = messages.celebrationTitle;
  royalSetText(".royal-event-copy > p:not(.royal-demo-note)", messages.celebrationCopy);
  document.getElementById("royalVenueLink").href = wedding.mapUrl;
  royalSetText("#royalVenueNote", `Demo map opens a ${wedding.location} search, not a confirmed venue.`);
  renderRoyalSchedule(config.schedule);

  royalSetText("#royal-rsvp-title", messages.rsvpTitle);
  royalSetText(".royal-rsvp-copy > p:last-child", messages.rsvpCopy);
  royalSetText("#royalRsvpNote", rsvp.endpoint ? "RSVP submissions are sent to the configured service." : "Demo only: confirmation appears in this browser. No RSVP is sent or stored.");
  renderRoyalGuestOptions(rsvp.maxGuests);
  setRoyalButtonLabel(royalForm.querySelector('[type="submit"]'));
  royalFormStartedAt = Date.now();
  royalAttempt = null;

  const initials = document.querySelector(".royal-footer strong");
  initials.replaceChildren(document.createTextNode(`${couple.firstName.charAt(0)} `));
  const footerAmpersand = document.createElement("i");
  footerAmpersand.textContent = "&";
  initials.append(footerAmpersand, document.createTextNode(` ${couple.secondName.charAt(0)}`));
  updateRoyalCountdown();
}

function setupTemplateSelector() {
  const selector = document.getElementById("templatePreview");
  Object.values(royalConfigs).forEach((config) => {
    const option = document.createElement("option");
    option.value = config.id;
    option.textContent = `${config.template === "royal-punjabi" ? "Royal Punjabi" : "Botanical"} — ${config.label}`;
    option.selected = config.id === royalInvitationConfig.id;
    selector.append(option);
  });
  selector.addEventListener("change", () => {
    const config = royalConfigs[selector.value];
    const page = config.template === "royal-punjabi" ? "royal-punjabi.html" : "index.html";
    window.location.assign(`${page}?demo=${encodeURIComponent(config.id)}`);
  });
}

function revealRoyalInvitation() {
  royalInvitation.hidden = false;
  window.scrollTo({ top: 0, behavior: "auto" });
  royalEntrance.hidden = true;
  const title = document.querySelector(".royal-hero h2");
  title.setAttribute("tabindex", "-1");
  title.focus({ preventScroll: true });
}

royalOpenButton.addEventListener("click", () => {
  if (isRoyalOpening) return;
  isRoyalOpening = true;
  royalOpenButton.disabled = true;
  royalOpenButton.setAttribute("aria-busy", "true");
  royalOpenButton.querySelector("span").textContent = "Opening…";
  royalStage.classList.add("is-open");
  window.setTimeout(revealRoyalInvitation, royalOpeningDuration);
});

function updateRoyalCountdown() {
  const secondsUntilWedding = Math.max(0, Math.floor((royalWeddingDate - Date.now()) / 1000));
  const values = [
    Math.floor(secondsUntilWedding / 86400),
    Math.floor((secondsUntilWedding % 86400) / 3600),
    Math.floor((secondsUntilWedding % 3600) / 60),
    secondsUntilWedding % 60,
  ];
  values.forEach((value, index) => {
    royalCountdown[index].textContent = String(value).padStart(2, "0");
  });
}

function setRoyalRsvpStatus(message, state = "") {
  royalStatus.textContent = message;
  royalStatus.dataset.state = state;
}

function createRoyalSubmissionId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  const bytes = new Uint32Array(4);
  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, (value) => value.toString(36)).join("");
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-rsvp`;
}

function royalSubmissionFor(payload) {
  const signature = JSON.stringify(payload);
  if (!royalAttempt || royalAttempt.signature !== signature) {
    royalAttempt = { signature, submissionId: createRoyalSubmissionId() };
  }
  return royalAttempt.submissionId;
}

async function submitRoyalRsvp(payload) {
  if (!royalInvitationConfig.rsvp.endpoint) return { mode: "demo" };
  let endpoint;
  try {
    endpoint = new URL(royalInvitationConfig.rsvp.endpoint);
  } catch {
    throw new Error("This invitation's RSVP service is not configured correctly.");
  }
  if (endpoint.protocol !== "https:") throw new Error("This invitation's RSVP service must use a secure connection.");
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12000);
  let response;
  try {
    response = await fetch(endpoint.href, { method: "POST", body: JSON.stringify(payload), signal: controller.signal, redirect: "follow" });
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("The RSVP service took too long to respond. Please try again.");
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

royalForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (isRoyalSubmitting) return;
  if (!royalForm.reportValidity()) {
    setRoyalRsvpStatus("Please complete the required fields before continuing.", "error");
    return;
  }
  isRoyalSubmitting = true;
  const button = royalForm.querySelector('[type="submit"]');
  const data = new FormData(royalForm);
  const payload = {
    invitationId: royalInvitationConfig.id,
    guestName: String(data.get("guestName")).trim(),
    attendance: data.get("attendance"),
    guestCount: Number(data.get("guestCount")),
    message: String(data.get("message") || "").trim(),
    website: String(data.get("website") || ""),
    formAgeMs: Date.now() - royalFormStartedAt,
  };
  payload.submissionId = royalSubmissionFor({ invitationId: payload.invitationId, guestName: payload.guestName, attendance: payload.attendance, guestCount: payload.guestCount, message: payload.message });
  button.disabled = true;
  button.textContent = "Submitting…";
  setRoyalRsvpStatus("Preparing your RSVP response…", "pending");
  try {
    const result = await submitRoyalRsvp(payload);
    if (result.mode === "demo") {
      const response = payload.attendance === "yes" ? "Joyfully accepted" : "Regretfully declined";
      setRoyalRsvpStatus(`Thank you, ${payload.guestName}. Demo response: ${response}. No information was submitted or stored.`, "success");
    } else {
      setRoyalRsvpStatus(result.duplicate ? `Thank you, ${payload.guestName}. Your RSVP is already safely recorded.` : `Thank you, ${payload.guestName}. Your RSVP has been saved.`, "success");
    }
    royalForm.reset();
    royalAttempt = null;
    royalFormStartedAt = Date.now();
  } catch (error) {
    setRoyalRsvpStatus(error.message || "Unable to submit your RSVP. Please try again later.", "error");
  } finally {
    isRoyalSubmitting = false;
    button.disabled = false;
    setRoyalButtonLabel(button);
  }
});

renderRoyalInvitation(royalInvitationConfig);
setupTemplateSelector();
window.setInterval(updateRoyalCountdown, 1000);
