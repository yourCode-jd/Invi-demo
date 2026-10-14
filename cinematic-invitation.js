const cinemaConfig = window.CINEMATIC_INVITATION_CONFIG;
const cinemaOpening = document.getElementById("opening");
const cinemaStory = document.getElementById("story");
const cinemaBegin = document.getElementById("beginFilm");
const cinemaScrollCue = document.getElementById("scrollCue");
const cinemaForm = document.getElementById("cinemaRsvpForm");
const cinemaStatus = document.getElementById("cinemaRsvpStatus");
const cinemaAudio = document.getElementById("cinemaAudio");
const soundToggle = document.getElementById("soundToggle");
const reduceCinemaMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const cinemaCountdown = ["cinemaDays", "cinemaHours", "cinemaMinutes", "cinemaSeconds"].map((id) => document.getElementById(id));

let cinemaOpened = false;
let cinemaSubmitting = false;
let cinemaAttempt = null;
let cinemaFormStartedAt = Date.now();
let cinemaDate = 0;
let cinemaRefreshTimer;
let cinemaMotion;
let cinemaViewportHeight = window.innerHeight;

function text(id, value) {
  const item = document.getElementById(id);
  if (item) item.textContent = value;
}

function nameOf() {
  return `${cinemaConfig.couple.firstName} & ${cinemaConfig.couple.secondName}`;
}

function renderSchedule() {
  const list = document.getElementById("cinemaSchedule");
  list.replaceChildren();
  cinemaConfig.schedule.forEach((event) => {
    const item = document.createElement("li");
    const time = document.createElement("time");
    const copy = document.createElement("div");
    const title = document.createElement("h3");
    const location = document.createElement("p");
    time.dateTime = event.isoTime;
    time.textContent = event.time;
    title.textContent = event.title;
    location.textContent = event.location;
    copy.append(title, location);
    item.append(time, copy);
    list.append(item);
  });
}

function renderGuests() {
  const select = document.getElementById("cinemaGuests");
  select.replaceChildren();
  for (let number = 1; number <= cinemaConfig.rsvp.maxGuests; number += 1) {
    const option = document.createElement("option");
    option.value = number;
    option.textContent = `${number} ${number === 1 ? "guest" : "guests"}`;
    select.append(option);
  }
}

function renderCinema() {
  const { messages, wedding, music } = cinemaConfig;
  cinemaDate = new Date(wedding.isoDate).getTime();
  document.title = `${nameOf()} — A Moonlit Coast`;
  document.querySelector('meta[name="description"]').setAttribute("content", `A fictional cinematic wedding invitation demo for ${nameOf()}.`);
  [
    ["openingOverline", messages.opening], ["openingTitle", messages.openingTitle], ["openingCopy", messages.openingCopy],
    ["heroOverline", messages.heroOverline], ["heroTitle", messages.heroTitle], ["heroCopy", messages.heroCopy],
    ["portraitOverline", messages.portraitOverline], ["portraitTitle", messages.portraitTitle],
    ["countdownOverline", messages.countdownOverline], ["countdownTitle", messages.countdownTitle], ["cinemaDate", wedding.dateDisplay],
    ["feastOverline", messages.feastOverline], ["feastTitle", messages.feastTitle],
    ["venueOverline", messages.venueOverline], ["venueTitle", messages.venueTitle], ["venueName", wedding.venue], ["venueLocation", wedding.location],
    ["rsvpOverline", messages.rsvpOverline], ["rsvpTitle", messages.rsvpTitle],
  ].forEach(([id, value]) => text(id, value));
  const map = document.getElementById("cinemaVenueLink");
  map.href = wedding.mapUrl;
  text("cinemaVenueNote", `Demo map opens a ${wedding.location} search, not a confirmed venue.`);
  renderSchedule();
  renderGuests();
  updateCountdown();
  if (music.enabled && music.src) {
    cinemaAudio.src = music.src;
    soundToggle.querySelector("span").textContent = music.title || "Sound";
  } else {
    soundToggle.disabled = true;
    soundToggle.title = "Optional music is not configured for this fictional demo.";
  }
}

function updateCountdown() {
  const seconds = Math.max(0, Math.floor((cinemaDate - Date.now()) / 1000));
  const values = [Math.floor(seconds / 86400), Math.floor((seconds % 86400) / 3600), Math.floor((seconds % 3600) / 60), seconds % 60];
  values.forEach((value, index) => { cinemaCountdown[index].textContent = String(value).padStart(2, "0"); });
}

function setStatus(message, state = "") {
  cinemaStatus.textContent = message;
  cinemaStatus.dataset.state = state;
}

function submissionId(payload) {
  const signature = JSON.stringify(payload);
  if (!cinemaAttempt || cinemaAttempt.signature !== signature) cinemaAttempt = { signature, id: window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}` };
  return cinemaAttempt.id;
}

async function submit(payload) {
  if (!cinemaConfig.rsvp.endpoint) return { mode: "demo" };
  const endpoint = new URL(cinemaConfig.rsvp.endpoint);
  if (endpoint.protocol !== "https:") throw new Error("The RSVP service must use a secure connection.");
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12000);
  let response;
  try {
    response = await fetch(endpoint.href, { method: "POST", body: JSON.stringify(payload), signal: controller.signal, redirect: "follow" });
  } catch (error) {
    throw new Error(error?.name === "AbortError" ? "The RSVP service took too long to respond. Please try again." : "We could not reach the RSVP service. Check your connection and try again.");
  } finally {
    window.clearTimeout(timeout);
  }
  let result;
  try { result = await response.json(); } catch { throw new Error("The RSVP service returned an unexpected response. Please try again."); }
  if (!response.ok || result?.ok !== true || result?.saved !== true) throw new Error(result?.message || "The RSVP service could not save your response.");
  return { mode: "live", duplicate: Boolean(result.duplicate) };
}

function revealWithoutMotion() {
  document.querySelectorAll(".reveal").forEach((item) => {
    item.style.opacity = "1";
    item.style.transform = "none";
  });
  const image = document.querySelector(".reveal-image");
  if (image) {
    image.style.clipPath = "none";
    image.style.opacity = "1";
  }
}

function refreshMotion() {
  if (!reduceCinemaMotion && window.ScrollTrigger) window.ScrollTrigger.refresh();
}

function initializeScrollMotion() {
  if (reduceCinemaMotion || !window.gsap || !window.ScrollTrigger) {
    revealWithoutMotion();
    return;
  }
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  cinemaMotion?.revert();
  cinemaMotion = gsap.matchMedia();
  cinemaMotion.add({ mobile: "(max-width: 760px)", desktop: "(min-width: 761px)" }, (context) => {
    const mobile = context.conditions.mobile;
    const distance = mobile ? 24 : 46;
    const start = mobile ? "top 88%" : "top 76%";
    const scrub = mobile ? .28 : .6;
    const parallaxFactor = mobile ? .38 : 1;
    const reveal = (target, trigger, from, to, options = {}) => gsap.fromTo(target, from, {
      ...to,
      scrollTrigger: {
        trigger,
        start: options.start || start,
        toggleActions: "play none none reverse",
        invalidateOnRefresh: true,
      },
    });

    reveal("#scenePortrait .scene-copy", "#scenePortrait", { autoAlpha: 0, x: mobile ? 0 : distance, y: mobile ? distance : 0 }, { autoAlpha: 1, x: 0, y: 0, duration: mobile ? .62 : .9, ease: "power3.out" });
    reveal("#sceneCountdown .countdown-content", "#sceneCountdown", { autoAlpha: 0, scale: mobile ? .97 : .94 }, { autoAlpha: 1, scale: 1, duration: mobile ? .62 : .85, ease: "power3.out" });
    reveal("#sceneFeast .scene-copy", "#sceneFeast", { autoAlpha: 0, x: mobile ? 0 : -distance, y: mobile ? 20 : 0 }, { autoAlpha: 1, x: 0, y: 0, duration: mobile ? .6 : .85, ease: "power3.out" });
    reveal("#cinemaSchedule", "#sceneFeast", { autoAlpha: 0, x: mobile ? 0 : distance, y: mobile ? 20 : 0 }, { autoAlpha: 1, x: 0, y: 0, duration: mobile ? .68 : .95, ease: "power3.out", delay: mobile ? .04 : .12 }, { start: mobile ? "top 68%" : start });
    reveal("#sceneVenue .venue-card", "#sceneVenue", { autoAlpha: 0, clipPath: mobile ? "inset(8% 0 8% 0)" : "inset(0 48% 0 48%)" }, { autoAlpha: 1, clipPath: "inset(0 0% 0 0%)", duration: mobile ? .7 : .9, ease: "power3.inOut" });
    reveal("#sceneRsvp .scene-copy", "#sceneRsvp", { autoAlpha: 0, y: mobile ? 22 : 42 }, { autoAlpha: 1, y: 0, duration: mobile ? .58 : .8, ease: "power3.out" });
    reveal("#cinemaRsvpForm", "#sceneRsvp", { autoAlpha: 0, y: mobile ? 20 : 34, scale: mobile ? .99 : .97 }, { autoAlpha: 1, y: 0, scale: 1, duration: mobile ? .65 : .9, delay: mobile ? .06 : .12, ease: "power3.out" }, { start: mobile ? "top 64%" : start });
    reveal(".portrait-image", "#scenePortrait", { clipPath: mobile ? "inset(5% 0 0 0)" : "inset(10% 0 0 0)", autoAlpha: .7 }, { clipPath: "inset(0% 0 0 0)", autoAlpha: 1, duration: mobile ? .78 : 1.12, ease: "power3.out" }, { start: mobile ? "top 80%" : "top 64%" });

    gsap.to(".portrait-orbit", { rotate: mobile ? 34 : 115, scale: mobile ? 1.015 : 1.06, ease: "none", scrollTrigger: { trigger: "#scenePortrait", start: "top bottom", end: "bottom top", scrub, invalidateOnRefresh: true } });
    gsap.to(".orbital-ring--one", { rotate: mobile ? 17 : 42, ease: "none", scrollTrigger: { trigger: "#sceneCountdown", start: "top bottom", end: "bottom top", scrub, invalidateOnRefresh: true } });
    gsap.to(".orbital-ring--two", { rotate: mobile ? -22 : -56, ease: "none", scrollTrigger: { trigger: "#sceneCountdown", start: "top bottom", end: "bottom top", scrub, invalidateOnRefresh: true } });
    gsap.utils.toArray(".parallax-bg").forEach((item) => {
      const travel = Number(item.dataset.speed || .15) * -100 * parallaxFactor;
      gsap.to(item, { yPercent: travel, ease: "none", scrollTrigger: { trigger: item.parentElement, start: "top bottom", end: "bottom top", scrub, invalidateOnRefresh: true } });
    });
    gsap.to(".rsvp-flower--one", { rotate: mobile ? 48 : 68, ease: "none", scrollTrigger: { trigger: "#sceneRsvp", start: "top bottom", end: "bottom top", scrub, invalidateOnRefresh: true } });
    gsap.to(".rsvp-flower--two", { rotate: mobile ? -39 : -53, ease: "none", scrollTrigger: { trigger: "#sceneRsvp", start: "top bottom", end: "bottom top", scrub, invalidateOnRefresh: true } });
    ["#sceneEstate", "#scenePortrait", "#sceneCountdown", "#sceneFeast", "#sceneVenue", "#sceneRsvp"].forEach((scene, index) => {
      gsap.to(`.story-nav div b:nth-child(${index + 1})`, { backgroundColor: "#e0bd80", scrollTrigger: { trigger: scene, start: "top 52%", end: "bottom 52%", toggleActions: "play reverse play reverse", invalidateOnRefresh: true } });
    });
  });
  requestAnimationFrame(refreshMotion);
}

function enterStory() {
  cinemaStory.hidden = false;
  cinemaOpening.hidden = true;
  const heroParts = ["#heroOverline", "#heroTitle", "#heroCopy", "#scrollCue"];
  const heroHeading = document.getElementById("heroTitle");
  if (reduceCinemaMotion || !window.gsap) {
    revealWithoutMotion();
    heroHeading.focus({ preventScroll: true });
    initializeScrollMotion();
    return;
  }
  const { gsap } = window;
  gsap.set(heroParts, { autoAlpha: 0, y: 20 });
  initializeScrollMotion();
  gsap.timeline({ defaults: { ease: "power3.out" } })
    .to("#heroOverline", { autoAlpha: 1, y: 0, duration: .38 })
    .to("#heroTitle", { autoAlpha: 1, y: 0, duration: .7 }, "-=.12")
    .to("#heroCopy", { autoAlpha: 1, y: 0, duration: .42 }, "-=.28")
    .to("#scrollCue", { autoAlpha: 1, y: 0, duration: .38 }, "-=.18")
    .to("#scrollCue i", { y: 5, duration: .65, repeat: -1, yoyo: true, ease: "sine.inOut" }, "+=.1");
  heroHeading.focus({ preventScroll: true });
}

function beginStory() {
  if (cinemaOpened) return;
  cinemaOpened = true;
  cinemaBegin.disabled = true;
  cinemaBegin.querySelector("span").textContent = "Opening…";
  if (reduceCinemaMotion || !window.gsap) {
    enterStory();
    return;
  }
  const { gsap } = window;
  gsap.timeline({ defaults: { overwrite: "auto" } })
    .to(".opening__content", { autoAlpha: 0, y: -18, duration: .38, ease: "power2.in" })
    .to(".opening__moon", { scale: 1.65, autoAlpha: 0, duration: .56, ease: "power2.in" }, "<.06")
    .to(".opening__image", { scale: 1.08, duration: .9, ease: "power2.in" }, "<")
    .to(".opening__wash", { autoAlpha: 0, duration: .48, ease: "power1.inOut" }, "-=.28")
    .to(cinemaOpening, { autoAlpha: 0, duration: .28, ease: "power1.out", onComplete: enterStory }, "-=.12");
}

cinemaBegin.addEventListener("click", beginStory);
cinemaScrollCue.addEventListener("click", () => document.getElementById("scenePortrait").scrollIntoView({ behavior: reduceCinemaMotion ? "auto" : "smooth", block: "start" }));
soundToggle.addEventListener("click", async () => {
  if (!cinemaAudio.src) return;
  if (cinemaAudio.paused) {
    await cinemaAudio.play();
    soundToggle.setAttribute("aria-pressed", "true");
    soundToggle.querySelector("b").textContent = "On";
  } else {
    cinemaAudio.pause();
    soundToggle.setAttribute("aria-pressed", "false");
    soundToggle.querySelector("b").textContent = "Off";
  }
});
cinemaForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (cinemaSubmitting) return;
  if (!cinemaForm.reportValidity()) { setStatus("Please complete the required fields before continuing.", "error"); return; }
  cinemaSubmitting = true;
  const button = cinemaForm.querySelector("button");
  const formData = new FormData(cinemaForm);
  const payload = { invitationId: cinemaConfig.id, guestName: String(formData.get("guestName")).trim(), attendance: formData.get("attendance"), guestCount: Number(formData.get("guestCount")), message: String(formData.get("message") || "").trim(), website: String(formData.get("website") || ""), formAgeMs: Date.now() - cinemaFormStartedAt };
  payload.submissionId = submissionId(payload);
  button.disabled = true;
  button.querySelector("span").textContent = "Sending…";
  setStatus("Preparing your RSVP response…", "pending");
  try {
    const result = await submit(payload);
    if (result.mode === "demo") setStatus(`Thank you, ${payload.guestName}. Demo response: ${payload.attendance === "yes" ? "Joyfully accepted" : "Regretfully declined"}. No information was submitted or stored.`, "success");
    else setStatus(result.duplicate ? `Thank you, ${payload.guestName}. Your RSVP is already safely recorded.` : `Thank you, ${payload.guestName}. Your RSVP has been saved.`, "success");
    cinemaForm.reset();
    cinemaAttempt = null;
    cinemaFormStartedAt = Date.now();
  } catch (error) {
    setStatus(error.message || "Unable to submit your RSVP. Please try again later.", "error");
  } finally {
    cinemaSubmitting = false;
    button.disabled = false;
    button.querySelector("span").textContent = cinemaConfig.rsvp.endpoint ? "Send RSVP" : "Send demo RSVP";
  }
});

window.addEventListener("load", () => {
  if (cinemaOpened) refreshMotion();
}, { once: true });
document.fonts?.ready.then(() => { if (cinemaOpened) refreshMotion(); });
window.addEventListener("resize", () => {
  const viewportChange = Math.abs(window.innerHeight - cinemaViewportHeight);
  cinemaViewportHeight = window.innerHeight;
  if (viewportChange < 96 && window.innerWidth <= 760) return;
  window.clearTimeout(cinemaRefreshTimer);
  cinemaRefreshTimer = window.setTimeout(refreshMotion, 220);
}, { passive: true });

renderCinema();
window.setInterval(updateCountdown, 1000);
