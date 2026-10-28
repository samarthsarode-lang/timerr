/* ============================================================
   COUNTDOWN TIMER  ·  static/script.js
   ============================================================ */

// ── DOM ────────────────────────────────────────────────────────
const hoursInput     = document.getElementById('hours');
const minutesInput   = document.getElementById('minutes');
const secondsInput   = document.getElementById('seconds');
const startBtn       = document.getElementById('start-btn');
const resetBtn       = document.getElementById('reset-btn');
const stopBtn        = document.getElementById('stop-btn');
const timerText      = document.getElementById('timer-text');
const timerLabel     = document.getElementById('timer-label');
const ringProgress   = document.getElementById('ring-progress');
const linearProgress = document.getElementById('linear-progress');
const alertBanner    = document.getElementById('alert-banner');
const alertDismiss   = document.getElementById('alert-dismiss');
const playIcon       = document.getElementById('play-icon');
const pauseIcon      = document.getElementById('pause-icon');
const presetBtns     = document.querySelectorAll('.preset-btn');

// ── State ──────────────────────────────────────────────────────
let totalSeconds     = 0;
let remainingSeconds = 0;
let timerInterval    = null;
let isRunning        = false;
let isPaused         = false;

const RING_CIRCUM = 753.98; // 2 * π * 120

// ── Web Audio API alarm ────────────────────────────────────────
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

/**
 * Plays a pleasant multi-note alarm jingle — no external file needed.
 */
function playAlarm() {
  const ctx = getAudioCtx();

  const notes = [
    { freq: 880,  dur: 0.20, at: 0.00 },
    { freq: 988,  dur: 0.20, at: 0.22 },
    { freq: 1047, dur: 0.35, at: 0.44 },
    { freq: 880,  dur: 0.20, at: 0.85 },
    { freq: 988,  dur: 0.20, at: 1.07 },
    { freq: 1175, dur: 0.55, at: 1.29 },
  ];

  notes.forEach(({ freq, dur, at }) => {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + at);

    gain.gain.setValueAtTime(0, ctx.currentTime + at);
    gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + at + 0.03);
    gain.gain.linearRampToValueAtTime(0,   ctx.currentTime + at + dur);

    osc.start(ctx.currentTime + at);
    osc.stop(ctx.currentTime  + at + dur + 0.05);
  });
}

// ── Helpers ────────────────────────────────────────────────────
const pad = n => String(n).padStart(2, '0');

function formatTime(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function updateRing(fraction) {
  const offset = RING_CIRCUM * (1 - Math.max(0, Math.min(1, fraction)));
  ringProgress.style.strokeDashoffset = offset;
  linearProgress.style.transform = `scaleX(${Math.max(0, fraction)})`;
}

function setUrgent(urgent) {
  timerText.classList.toggle('urgent', urgent);
  ringProgress.classList.toggle('urgent', urgent);
  if (urgent) {
    timerText.classList.remove('finished');
    ringProgress.classList.remove('finished');
  }
}

function showAlert()  { alertBanner.classList.add('visible'); }
function hideAlert()  { alertBanner.classList.remove('visible'); }

// ── Core Timer ─────────────────────────────────────────────────
function startTimer() {
  if (remainingSeconds <= 0) return;
  isRunning = true;
  isPaused  = false;
  timerLabel.textContent  = 'Running';
  playIcon.style.display  = 'none';
  pauseIcon.style.display = 'block';

  timerInterval = setInterval(() => {
    remainingSeconds--;
    timerText.textContent = formatTime(remainingSeconds);
    updateRing(totalSeconds > 0 ? remainingSeconds / totalSeconds : 0);
    setUrgent(remainingSeconds <= 10 && remainingSeconds > 0);

    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      isRunning = false;

      timerText.textContent  = '00:00:00';
      timerLabel.textContent = "Time's Up!";
      setUrgent(false);
      timerText.classList.add('finished');
      ringProgress.classList.add('finished');
      updateRing(0);

      playIcon.style.display  = 'block';
      pauseIcon.style.display = 'none';

      playAlarm();
      showAlert();
    }
  }, 1000);
}

function pauseTimer() {
  if (!isRunning) return;
  clearInterval(timerInterval);
  timerInterval = null;
  isRunning = false;
  isPaused  = true;
  timerLabel.textContent  = 'Paused';
  playIcon.style.display  = 'block';
  pauseIcon.style.display = 'none';
}

function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  isRunning = false;
  isPaused  = false;

  remainingSeconds       = totalSeconds;
  timerText.textContent  = formatTime(remainingSeconds);
  timerLabel.textContent = remainingSeconds > 0 ? 'Ready' : '--:--:--';
  updateRing(1);
  setUrgent(false);
  timerText.classList.remove('finished');
  ringProgress.classList.remove('finished');
  playIcon.style.display  = 'block';
  pauseIcon.style.display = 'none';
  hideAlert();
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  isRunning = false;
  isPaused  = false;
  remainingSeconds = 0;

  timerText.textContent  = '00:00:00';
  timerLabel.textContent = 'Stopped';
  updateRing(0);
  setUrgent(false);
  timerText.classList.remove('finished', 'urgent');
  ringProgress.classList.remove('finished', 'urgent');
  playIcon.style.display  = 'block';
  pauseIcon.style.display = 'none';
  hideAlert();
}

// ── Input helpers ──────────────────────────────────────────────
function readInputs() {
  const h = parseInt(hoursInput.value)   || 0;
  const m = parseInt(minutesInput.value) || 0;
  const s = parseInt(secondsInput.value) || 0;
  return h * 3600 + m * 60 + s;
}

function clamp(input, max) {
  let v = parseInt(input.value);
  if (isNaN(v) || v < 0) v = 0;
  if (v > max) v = max;
  input.value = v;
}

function flashError() {
  document.querySelectorAll('.time-field input').forEach(inp => {
    inp.style.borderColor = '#f87171';
    inp.style.boxShadow   = '0 0 0 4px rgba(248,113,113,0.2)';
    setTimeout(() => {
      inp.style.borderColor = '';
      inp.style.boxShadow   = '';
    }, 900);
  });
}

// ── Events ─────────────────────────────────────────────────────
startBtn.addEventListener('click', () => {
  // Unlock audio context on first user gesture
  getAudioCtx();

  if (isRunning) { pauseTimer(); return; }
  if (isPaused)  { startTimer(); return; }

  // Fresh start
  totalSeconds     = readInputs();
  remainingSeconds = totalSeconds;

  if (totalSeconds <= 0) { flashError(); return; }

  timerText.textContent = formatTime(remainingSeconds);
  updateRing(1);
  hideAlert();
  timerText.classList.remove('finished');
  ringProgress.classList.remove('finished');
  startTimer();
});

resetBtn.addEventListener('click', () => {
  totalSeconds     = readInputs();
  remainingSeconds = totalSeconds;
  resetTimer();
});

stopBtn.addEventListener('click', stopTimer);
alertDismiss.addEventListener('click', hideAlert);

hoursInput.addEventListener('change',   () => clamp(hoursInput, 23));
minutesInput.addEventListener('change', () => clamp(minutesInput, 59));
secondsInput.addEventListener('change', () => clamp(secondsInput, 59));

[hoursInput, minutesInput, secondsInput].forEach(inp =>
  inp.addEventListener('input', () => {
    if (!isRunning && !isPaused) {
      const s = readInputs();
      timerText.textContent  = formatTime(s);
      timerLabel.textContent = s > 0 ? 'Ready' : '--:--:--';
      updateRing(1);
    }
  })
);

presetBtns.forEach(btn =>
  btn.addEventListener('click', () => {
    if (isRunning) return;
    const secs = parseInt(btn.dataset.seconds);
    hoursInput.value   = Math.floor(secs / 3600);
    minutesInput.value = Math.floor((secs % 3600) / 60);
    secondsInput.value = secs % 60;

    totalSeconds = secs;
    if (!isPaused) {
      remainingSeconds       = secs;
      timerText.textContent  = formatTime(secs);
      timerLabel.textContent = 'Ready';
      updateRing(1);
    }
  })
);

// ── Init ───────────────────────────────────────────────────────
(function init() {
  ringProgress.style.strokeDasharray  = RING_CIRCUM;
  ringProgress.style.strokeDashoffset = 0;
  const s = readInputs();
  totalSeconds     = s;
  remainingSeconds = s;
  timerText.textContent  = formatTime(s);
  timerLabel.textContent = s > 0 ? 'Ready' : '--:--:--';
})();
