/* ===================================================
   COUNTDOWN TIMER - script.js
   =================================================== */

// ── DOM References ────────────────────────────────────────────────────────────
const hoursInput      = document.getElementById('hours');
const minutesInput    = document.getElementById('minutes');
const secondsInput    = document.getElementById('seconds');
const startBtn        = document.getElementById('start-btn');
const resetBtn        = document.getElementById('reset-btn');
const stopBtn         = document.getElementById('stop-btn');
const timerText       = document.getElementById('timer-text');
const timerLabel      = document.getElementById('timer-label');
const ringProgress    = document.getElementById('ring-progress');
const linearProgress  = document.getElementById('linear-progress');
const alertBanner     = document.getElementById('alert-banner');
const alertDismiss    = document.getElementById('alert-dismiss');
const playIcon        = document.getElementById('play-icon');
const pauseIcon       = document.getElementById('pause-icon');
const presetBtns      = document.querySelectorAll('.preset-btn');

// ── State ─────────────────────────────────────────────────────────────────────
let totalSeconds   = 0;   // total seconds set by user
let remainingSeconds = 0; // current countdown value
let timerInterval  = null;
let isRunning      = false;
let isPaused       = false;

const RING_CIRCUMFERENCE = 753.98; // 2 * π * 120

// ── Audio Context (Web Audio API — no external file needed) ───────────────────
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

/**
 * Plays a pleasant multi-tone "alarm" using the Web Audio API.
 * No external audio file required.
 */
function playAlarm() {
  const ctx = getAudioContext();

  // Sequence of notes (frequencies) for the alarm jingle
  const notes = [
    { freq: 880,  duration: 0.2, startAt: 0.0  },
    { freq: 988,  duration: 0.2, startAt: 0.22 },
    { freq: 1047, duration: 0.35,startAt: 0.44 },
    { freq: 880,  duration: 0.2, startAt: 0.85 },
    { freq: 988,  duration: 0.2, startAt: 1.07 },
    { freq: 1047, duration: 0.5, startAt: 1.29 },
  ];

  notes.forEach(({ freq, duration, startAt }) => {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + startAt);

    // Smooth attack & release
    gain.gain.setValueAtTime(0, ctx.currentTime + startAt);
    gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + startAt + 0.03);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + startAt + duration);

    osc.start(ctx.currentTime + startAt);
    osc.stop(ctx.currentTime + startAt + duration + 0.05);
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function pad(n) {
  return String(n).padStart(2, '0');
}

function formatTime(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function updateRing(fraction) {
  // fraction: 1 = full (just started), 0 = empty (finished)
  const offset = RING_CIRCUMFERENCE * (1 - fraction);
  ringProgress.style.strokeDashoffset = offset;
  linearProgress.style.transform = `scaleX(${fraction})`;
}

function setUrgentState(urgent) {
  if (urgent) {
    timerText.classList.add('urgent');
    ringProgress.classList.add('urgent');
    timerText.classList.remove('finished');
    ringProgress.classList.remove('finished');
  } else {
    timerText.classList.remove('urgent');
    ringProgress.classList.remove('urgent');
  }
}

function showAlert() {
  alertBanner.classList.add('visible');
}

function hideAlert() {
  alertBanner.classList.remove('visible');
}

// ── Core Timer Logic ──────────────────────────────────────────────────────────
function startTimer() {
  if (remainingSeconds <= 0) return;

  isRunning = true;
  isPaused  = false;
  timerLabel.textContent = 'Running';

  // Switch button icons
  playIcon.style.display  = 'none';
  pauseIcon.style.display = 'block';

  timerInterval = setInterval(() => {
    remainingSeconds--;
    timerText.textContent = formatTime(remainingSeconds);

    const fraction = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
    updateRing(fraction);

    // Urgent pulse when ≤ 10 seconds left
    setUrgentState(remainingSeconds <= 10 && remainingSeconds > 0);

    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      isRunning     = false;

      timerText.textContent = '00:00:00';
      timerLabel.textContent = "Time's Up!";
      timerText.classList.remove('urgent');
      ringProgress.classList.remove('urgent');
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
  isRunning     = false;
  isPaused      = true;
  timerLabel.textContent = 'Paused';

  playIcon.style.display  = 'block';
  pauseIcon.style.display = 'none';
}

function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  isRunning     = false;
  isPaused      = false;

  remainingSeconds = totalSeconds;
  timerText.textContent = formatTime(remainingSeconds);
  timerLabel.textContent = remainingSeconds > 0 ? 'Ready' : '--:--:--';

  updateRing(1);
  setUrgentState(false);
  timerText.classList.remove('finished');
  ringProgress.classList.remove('finished');

  playIcon.style.display  = 'block';
  pauseIcon.style.display = 'none';

  hideAlert();
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  isRunning     = false;
  isPaused      = false;
  remainingSeconds = 0;

  timerText.textContent = '00:00:00';
  timerLabel.textContent = 'Stopped';
  updateRing(0);
  setUrgentState(false);
  timerText.classList.remove('finished', 'urgent');
  ringProgress.classList.remove('finished', 'urgent');

  playIcon.style.display  = 'block';
  pauseIcon.style.display = 'none';

  hideAlert();
}

// ── Input Parsing ─────────────────────────────────────────────────────────────
function readInputs() {
  const h = parseInt(hoursInput.value)   || 0;
  const m = parseInt(minutesInput.value) || 0;
  const s = parseInt(secondsInput.value) || 0;
  return h * 3600 + m * 60 + s;
}

function clampInput(input, max) {
  let val = parseInt(input.value);
  if (isNaN(val) || val < 0) val = 0;
  if (val > max) val = max;
  input.value = val;
}

// ── Event Listeners ───────────────────────────────────────────────────────────

// Start / Pause toggle
startBtn.addEventListener('click', () => {
  if (isRunning) {
    pauseTimer();
    return;
  }

  if (isPaused) {
    // Resume from pause
    startTimer();
    return;
  }

  // Fresh start — read inputs
  totalSeconds     = readInputs();
  remainingSeconds = totalSeconds;

  if (totalSeconds <= 0) {
    // Shake effect on inputs if nothing set
    const inputs = document.querySelectorAll('.time-field input');
    inputs.forEach(inp => {
      inp.style.borderColor = '#f87171';
      inp.style.boxShadow   = '0 0 0 4px rgba(248,113,113,0.2)';
      setTimeout(() => {
        inp.style.borderColor = '';
        inp.style.boxShadow   = '';
      }, 1000);
    });
    return;
  }

  timerText.textContent = formatTime(remainingSeconds);
  updateRing(1);
  hideAlert();
  timerText.classList.remove('finished');
  ringProgress.classList.remove('finished');

  startTimer();
});

// Reset
resetBtn.addEventListener('click', () => {
  totalSeconds     = readInputs();
  remainingSeconds = totalSeconds;
  resetTimer();
});

// Stop
stopBtn.addEventListener('click', stopTimer);

// Dismiss alert
alertDismiss.addEventListener('click', hideAlert);

// Clamp inputs on change
hoursInput.addEventListener('change',   () => clampInput(hoursInput, 23));
minutesInput.addEventListener('change', () => clampInput(minutesInput, 59));
secondsInput.addEventListener('change', () => clampInput(secondsInput, 59));

// Update display live when inputs change (only if not running)
[hoursInput, minutesInput, secondsInput].forEach(inp => {
  inp.addEventListener('input', () => {
    if (!isRunning && !isPaused) {
      const secs = readInputs();
      timerText.textContent = formatTime(secs);
      timerLabel.textContent = secs > 0 ? 'Ready' : '--:--:--';
      updateRing(1);
    }
  });
});

// Preset buttons
presetBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    if (isRunning) return;

    const secs = parseInt(btn.dataset.seconds);
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;

    hoursInput.value   = h;
    minutesInput.value = m;
    secondsInput.value = s;

    totalSeconds     = secs;
    remainingSeconds = secs;

    if (!isPaused) {
      timerText.textContent  = formatTime(secs);
      timerLabel.textContent = 'Ready';
      updateRing(1);
    }
  });
});

// ── Init ──────────────────────────────────────────────────────────────────────
(function init() {
  // Initialise ring to full
  ringProgress.style.strokeDasharray  = RING_CIRCUMFERENCE;
  ringProgress.style.strokeDashoffset = 0;

  const initSecs = readInputs();
  totalSeconds     = initSecs;
  remainingSeconds = initSecs;
  timerText.textContent  = formatTime(initSecs);
  timerLabel.textContent = initSecs > 0 ? 'Ready' : '--:--:--';
})();
