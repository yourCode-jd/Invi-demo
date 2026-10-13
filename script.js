const openButton = document.getElementById('openBtn');
const envelope = document.getElementById('envelope');
const intro = document.getElementById('intro');
const invitation = document.getElementById('invitation');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function revealInvitation() {
  invitation.hidden = false;
  intro.hidden = true;
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  document.querySelector('.hero h2').focus({ preventScroll: true });
}
openButton.addEventListener('click', () => {
  if (openButton.disabled) return;
  openButton.disabled = true;
  openButton.querySelector('span').textContent = 'Opening…';
  envelope.classList.add('open');
  window.setTimeout(revealInvitation, reduceMotion ? 80 : 1450);
});

// Fictional demo wedding date in Jaipur time (UTC+05:30).
const weddingDate = new Date('2026-12-12T16:00:00+05:30').getTime();
const countdownEls = ['days', 'hours', 'minutes', 'seconds'].map((id) => document.getElementById(id));
function updateCountdown() {
  const secondsUntilWedding = Math.max(0, Math.floor((weddingDate - Date.now()) / 1000));
  const values = [Math.floor(secondsUntilWedding / 86400), Math.floor((secondsUntilWedding % 86400) / 3600), Math.floor((secondsUntilWedding % 3600) / 60), secondsUntilWedding % 60];
  values.forEach((value, index) => { countdownEls[index].textContent = String(value).padStart(2, '0'); });
}
updateCountdown();
window.setInterval(updateCountdown, 1000);

const form = document.getElementById('rsvpForm');
const status = document.getElementById('rsvpStatus');
form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const name = String(data.get('guestName')).trim();
  const accepts = data.get('attendance') === 'yes';
  status.textContent = `Thank you, ${name}. Demo response: ${accepts ? 'Joyfully accepted' : 'Regretfully declined'}. No information was submitted.`;
  form.reset();
});
