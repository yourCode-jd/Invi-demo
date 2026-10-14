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

function splitHeading(id) {
  const heading = document.getElementById(id);
  if (!heading || heading.dataset.split) return;
  const label = heading.textContent;
  heading.setAttribute("aria-label", label.replace(/\n/g, " "));
  heading.replaceChildren();
  label.split("\n").forEach((line) => {
    const lineElement = document.createElement("span");
    lineElement.className = "line";
    line.split(/(\s+)/).forEach((word) => {
      if (/\s/.test(word)) lineElement.append(document.createTextNode(word));
      else if (word) { const span = document.createElement("span"); span.className = "word"; span.setAttribute("aria-hidden", "true"); span.textContent = word; lineElement.append(span); }
    });
    heading.append(lineElement);
  });
  heading.dataset.split = "true";
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
  ["openingTitle", "heroTitle", "portraitTitle", "countdownTitle", "feastTitle", "venueTitle", "rsvpTitle"].forEach(splitHeading);
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
    const distance = mobile ? 22 : 54;
    const entranceStart = mobile ? "top 86%" : "top 72%";
    const scrub = mobile ? .25 : .55;
    const startScene = (trigger, timeline) => ScrollTrigger.create({ trigger, start: entranceStart, onEnter: () => timeline.play(), onEnterBack: () => timeline.play(), onLeaveBack: () => timeline.reverse(), invalidateOnRefresh: true });
    const words = (selector) => gsap.utils.toArray(`${selector} .word`);
    const drift = (target, vars) => gsap.to(target, { ...vars, repeat: -1, yoyo: true, ease: "sine.inOut" });

    /* Chapter 01: environment, contour and type move at three different depths. */
    gsap.set([".estate-bloom", ".estate-contour"], { autoAlpha: 0 });
    gsap.set(".estate-contour path", { strokeDasharray: 1300, strokeDashoffset: 1300 });
    const estate = gsap.timeline({ paused: true }).to(".estate-media", { scale: 1.035, duration: .9, ease: "power2.out" }).to(".estate-bloom", { autoAlpha: 1, scale: 1, duration: .55, ease: "power2.out" }, "<.1").to(".estate-contour", { autoAlpha: 1, duration: .2 }, "<").to(".estate-contour path", { strokeDashoffset: 0, duration: 1.05, ease: "power2.inOut" }, "<");
    startScene("#sceneEstate", estate);
    if (window.scrollY < 4) estate.play();

    /* Chapter 02: portrait mask, orbit, petals, particles and word choreography. */
    gsap.set([".portrait-petals i", ".portrait-particles b", ".portrait-frame"], { autoAlpha: 0, scale: .72 });
    const portrait = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } })
      .fromTo(".portrait-image", { clipPath: "inset(10% 0 0 0)", autoAlpha: .35 }, { clipPath: "inset(0 0 0 0)", autoAlpha: 1, duration: mobile ? .7 : 1.05 })
      .to(".portrait-frame", { autoAlpha: 1, scale: 1, duration: .45 }, "<.12")
      .to(".portrait-petals i", { autoAlpha: 1, scale: 1, stagger: .12, duration: .48 }, "<.06")
      .to(".portrait-particles b", { autoAlpha: 1, stagger: .07, duration: .3 }, "<.12")
      .fromTo(words("#portraitTitle"), { autoAlpha: 0, yPercent: 110, rotate: mobile ? 0 : 4 }, { autoAlpha: 1, yPercent: 0, rotate: 0, stagger: .055, duration: .5 }, "<.14")
      .to("#scenePortrait .scene-copy > p:not(.chapter)", { autoAlpha: 1, y: 0, duration: .38 }, "<.12");
    startScene("#scenePortrait", portrait);
    gsap.set("#scenePortrait .scene-copy > p:not(.chapter)", { autoAlpha: 0, y: 16 });

    /* Chapter 03: celestial geometry frames rolling countdown cells. */
    gsap.set([".countdown-arc", ".countdown-grid > div", ".date-line"], { autoAlpha: 0 });
    gsap.set(".countdown-arc path", { strokeDasharray: 1100, strokeDashoffset: 1100 });
    const countdown = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } })
      .fromTo(".countdown-content", { autoAlpha: 0, scale: .94 }, { autoAlpha: 1, scale: 1, duration: .6 })
      .to(".countdown-arc", { autoAlpha: 1, duration: .15 }, "<")
      .to(".countdown-arc path", { strokeDashoffset: 0, duration: .82, ease: "power2.inOut" }, "<")
      .fromTo(words("#countdownTitle"), { autoAlpha: 0, yPercent: 100 }, { autoAlpha: 1, yPercent: 0, stagger: .05, duration: .42 }, "<.1")
      .to(".countdown-grid > div", { autoAlpha: 1, y: 0, stagger: .08, duration: .36 }, "<.14")
      .to(".date-line", { autoAlpha: 1, duration: .25 }, "<.16");
    startScene("#sceneCountdown", countdown);

    /* Chapter 04: veil, glints and schedule create a two-sided scene. */
    gsap.set([".feast-glints i", "#cinemaSchedule li"], { autoAlpha: 0, y: 16 });
    const feast = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } })
      .fromTo(".feast-veil", { scaleX: 1 }, { scaleX: .28, duration: .8, ease: "power2.inOut" })
      .fromTo("#sceneFeast .scene-copy", { autoAlpha: 0, x: mobile ? 0 : -distance, y: mobile ? distance : 0 }, { autoAlpha: 1, x: 0, y: 0, duration: .6 }, "<.14")
      .fromTo(words("#feastTitle"), { autoAlpha: 0, yPercent: 100 }, { autoAlpha: 1, yPercent: 0, stagger: .05, duration: .4 }, "<.08")
      .to("#cinemaSchedule", { autoAlpha: 1, x: 0, y: 0, duration: .52 }, "<.12")
      .to("#cinemaSchedule li", { autoAlpha: 1, y: 0, stagger: .1, duration: .28 }, "<.12")
      .to(".feast-glints i", { autoAlpha: 1, stagger: .08, duration: .2 }, "<");
    gsap.set("#cinemaSchedule", { autoAlpha: 0, x: mobile ? 0 : distance, y: mobile ? 18 : 0 });
    startScene("#sceneFeast", feast);

    /* Chapter 05: the route leads the eye into a masked venue card. */
    gsap.set([".route", ".pin", ".pin-pulse"], { autoAlpha: 0 });
    const venue = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } })
      .fromTo(".coast", { scale: .82, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, stagger: .12, duration: .5 })
      .to(".route", { autoAlpha: 1, scaleX: 1, duration: .72, ease: "power2.inOut" }, "<.1")
      .to([".pin", ".pin-pulse"], { autoAlpha: 1, stagger: .1, duration: .25 }, "<.55")
      .fromTo(".venue-card", { autoAlpha: 0, clipPath: mobile ? "inset(9% 0 9% 0)" : "inset(0 48% 0 48%)" }, { autoAlpha: 1, clipPath: "inset(0 0 0 0)", duration: .72, ease: "power3.inOut" }, "<.12")
      .fromTo(words("#venueTitle"), { autoAlpha: 0, yPercent: 100 }, { autoAlpha: 1, yPercent: 0, stagger: .045, duration: .36 }, "<.12");
    gsap.set(".route", { scaleX: 0, transformOrigin: "left center" });
    startScene("#sceneVenue", venue);

    /* Chapter 06: constellation, flowers, copy, frame and fields land in sequence. */
    gsap.set([".rsvp-constellation", ".rsvp-flower", ".cinema-rsvp-form", ".cinema-rsvp-form .cinema-field", ".rsvp-button", ".rsvp-note"], { autoAlpha: 0 });
    gsap.set(".rsvp-constellation path", { strokeDasharray: 1600, strokeDashoffset: 1600 });
    const rsvp = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } })
      .to(".rsvp-constellation", { autoAlpha: 1, duration: .2 })
      .to(".rsvp-constellation path", { strokeDashoffset: 0, duration: .9, ease: "power2.inOut" }, "<")
      .to(".rsvp-flower", { autoAlpha: 1, scale: 1, stagger: .12, duration: .52 }, "<.12")
      .fromTo("#sceneRsvp .scene-copy", { autoAlpha: 0, y: distance }, { autoAlpha: 1, y: 0, duration: .5 }, "<.08")
      .fromTo(words("#rsvpTitle"), { autoAlpha: 0, yPercent: 100 }, { autoAlpha: 1, yPercent: 0, stagger: .045, duration: .38 }, "<.1")
      .to(".cinema-rsvp-form", { autoAlpha: 1, y: 0, duration: .45 }, "<.15")
      .to(".cinema-rsvp-form .cinema-field", { autoAlpha: 1, y: 0, stagger: .07, duration: .25 }, "<.1")
      .to([".rsvp-button", ".rsvp-note"], { autoAlpha: 1, y: 0, stagger: .08, duration: .26 }, "<.05");
    gsap.set([".rsvp-flower", ".cinema-rsvp-form", ".cinema-rsvp-form .cinema-field", ".rsvp-button", ".rsvp-note"], { scale: ".92", y: mobile ? 16 : 24 });
    startScene("#sceneRsvp", rsvp);

    /* Scroll-driven depth belongs to the environments; ambient movement belongs to each living scene. */
    gsap.utils.toArray(".parallax-bg").forEach((item) => gsap.to(item, { yPercent: Number(item.dataset.speed || .15) * -100 * (mobile ? .35 : 1), ease: "none", scrollTrigger: { trigger: item.parentElement, start: "top bottom", end: "bottom top", scrub, invalidateOnRefresh: true } }));
    gsap.to(".portrait-orbit", { rotate: mobile ? 38 : 118, ease: "none", scrollTrigger: { trigger: "#scenePortrait", start: "top bottom", end: "bottom top", scrub, invalidateOnRefresh: true } });
    gsap.to(".orbital-ring--one", { rotate: mobile ? 18 : 45, ease: "none", scrollTrigger: { trigger: "#sceneCountdown", start: "top bottom", end: "bottom top", scrub, invalidateOnRefresh: true } });
    gsap.to(".orbital-ring--two", { rotate: mobile ? -22 : -56, ease: "none", scrollTrigger: { trigger: "#sceneCountdown", start: "top bottom", end: "bottom top", scrub, invalidateOnRefresh: true } });
    gsap.to(".venue-map", { backgroundPosition: mobile ? "30px 16px" : "70px 38px", ease: "none", scrollTrigger: { trigger: "#sceneVenue", start: "top bottom", end: "bottom top", scrub, invalidateOnRefresh: true } });
    drift(".estate-bloom", { scale: 1.14, duration: 3.8 }); drift(".portrait-particles b", { y: -12, stagger: .18, duration: 2.6 }); drift(".feast-glints i", { scale: 1.7, stagger: .26, duration: 1.55 }); drift(".pin-pulse", { scale: 1.9, autoAlpha: .1, duration: 1.65 }); drift(".rsvp-stars", { backgroundPosition: "45px 70px", duration: 8 });
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
    .to("#heroTitle", { autoAlpha: 1, y: 0, duration: .1 }, "-=.12")
    .fromTo("#heroTitle .word", { autoAlpha: 0, yPercent: 110, rotate: 3 }, { autoAlpha: 1, yPercent: 0, rotate: 0, duration: .5, stagger: .055 }, "<")
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
