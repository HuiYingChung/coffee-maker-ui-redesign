/* =========================================================
   Espresso Machine UI (Mode-driven) — script.js (FULL)
   - Shared Start/Stop button (fixed label)
   - Modes: Single / Double / Steam / Clean
   - Power: OFF -> PREHEATING -> READY (3 long beeps on READY)
   - Low Water: Shift + Click Power toggles; when active:
       * Yellow LED blinks
       * All controls locked except Power
       * Clicking locked controls => 2 short beeps
       * Low Water LED is OFF when Power OFF, resumes when Power ON
   - Start/Stop behavior:
       * READY + mode selected => starts RUNNING
       * RUNNING => cancels + RESET (mode cleared) but power stays ON (READY)
   - Feedback:
       * READY reached: 3 long beeps
       * Brew/Clean complete: 3 long beeps + READY
       * Cancel via Start/Stop: 2 short beeps + RESET to READY
========================================================= */

/* -----------------------
   DOM refs
------------------------ */
const btnPower = document.getElementById("btnPower");
const btnTemp = document.getElementById("btnTemp");

const btnSingle = document.getElementById("btnSingle");
const btnDouble = document.getElementById("btnDouble");
const btnSteam = document.getElementById("btnSteam");
const btnClean = document.getElementById("btnClean");

const btnStartStop = document.getElementById("btnStartStop");

const ledTempLow = document.getElementById("ledTempLow");
const ledTempMed = document.getElementById("ledTempMed");
const ledTempHigh = document.getElementById("ledTempHigh");

const ledPreheat = document.getElementById("ledPreheat");
const ledReady = document.getElementById("ledReady");
const ledBrewing = document.getElementById("ledBrewing");
const ledSteam = document.getElementById("ledSteam");
const ledCleaning = document.getElementById("ledCleaning");
const ledLowWater = document.getElementById("ledLowWater");

/* -----------------------
   State
------------------------ */
const State = Object.freeze({
  OFF: "OFF",
  PREHEATING: "PREHEATING",
  READY: "READY",
  RUNNING: "RUNNING" // running any mode (brew/steam/clean)
});

const Temp = Object.freeze({
  LOW: "LOW",
  MED: "MED",
  HIGH: "HIGH"
});

const Mode = Object.freeze({
  NONE: "NONE",
  SINGLE: "SINGLE",
  DOUBLE: "DOUBLE",
  STEAM: "STEAM",
  CLEAN: "CLEAN"
});

const app = {
  state: State.OFF,
  temp: Temp.MED,
  mode: Mode.NONE,
  lowWater: false
};

/* Timers */
let preheatTimer = null;
let runTimer = null;

/* -----------------------
   Audio (beeps)
------------------------ */
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function beep(durationMs = 150, freq = 880, gainValue = 0.06) {
  const ctx = getAudioCtx();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, now);

  gain.gain.setValueAtTime(gainValue, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + durationMs / 1000);
}

function twoShortBeeps() {
  beep(120, 880);
  setTimeout(() => beep(120, 880), 170);
}

function threeLongBeeps() {
  const longMs = 360;
  const gap = 170;
  beep(longMs, 760);
  setTimeout(() => beep(longMs, 760), longMs + gap);
  setTimeout(() => beep(longMs, 760), (longMs + gap) * 2);
}

/* -----------------------
   Helpers
------------------------ */
function clearTimer(t) {
  if (t) clearTimeout(t);
  return null;
}

function resetSelections() {
  app.mode = Mode.NONE;
}

function resetRunTimers() {
  runTimer = clearTimer(runTimer);
}

function resetPreheatTimer() {
  preheatTimer = clearTimer(preheatTimer);
}

function clearLeds() {
  [
    ledTempLow, ledTempMed, ledTempHigh,
    ledPreheat, ledReady, ledBrewing, ledSteam, ledCleaning, ledLowWater
  ].forEach(el => {
    el.classList.remove("active");
    el.classList.remove("blink");
  });
}

function unlockAll() {
  [
    btnTemp, btnSingle, btnDouble, btnSteam, btnClean, btnStartStop
  ].forEach(btn => btn.dataset.locked = "false");
}

function lockAllExceptPower() {
  [
    btnTemp, btnSingle, btnDouble, btnSteam, btnClean, btnStartStop
  ].forEach(btn => btn.dataset.locked = "true");
}

function isLocked(btn) {
  return btn.dataset.locked === "true";
}

function currentModeIsBrew() {
  return app.mode === Mode.SINGLE || app.mode === Mode.DOUBLE;
}

/* Reset everything EXCEPT power + lowWater flag */
function resetWhilePoweredOn() {
  resetRunTimers();
  resetPreheatTimer();
  resetSelections();
  app.state = State.READY;
}

/* -----------------------
   Locks
------------------------ */
function updateLocks() {
  unlockAll();

  // OFF: everything locked except Power
  if (app.state === State.OFF) {
    lockAllExceptPower();
    return;
  }

  // Low Water: everything locked except Power
  if (app.lowWater) {
    lockAllExceptPower();
    return;
  }

  // PREHEATING: lock everything except Power
  if (app.state === State.PREHEATING) {
    [btnTemp, btnSingle, btnDouble, btnSteam, btnClean, btnStartStop]
      .forEach(btn => btn.dataset.locked = "true");
    return;
  }

  // RUNNING: lock mode/temp changes, but allow Start/Stop for cancel
  if (app.state === State.RUNNING) {
    [btnTemp, btnSingle, btnDouble, btnSteam, btnClean]
      .forEach(btn => btn.dataset.locked = "true");
    btnStartStop.dataset.locked = "false";
    return;
  }

  // READY:
  // Start/Stop requires a mode
  if (app.mode === Mode.NONE) {
    btnStartStop.dataset.locked = "true";
  }
}

/* -----------------------
   Render
------------------------ */
function render() {
  clearLeds();

  // Temperature LEDs
  if (app.temp === Temp.LOW) ledTempLow.classList.add("active");
  if (app.temp === Temp.MED) ledTempMed.classList.add("active");
  if (app.temp === Temp.HIGH) ledTempHigh.classList.add("active");

  // State LEDs
  if (app.state === State.PREHEATING) ledPreheat.classList.add("active");
  if (app.state === State.READY) ledReady.classList.add("active");

  // Running LEDs depend on selected mode while RUNNING
  if (app.state === State.RUNNING) {
    if (currentModeIsBrew()) ledBrewing.classList.add("active");
    if (app.mode === Mode.STEAM) ledSteam.classList.add("active");
    if (app.mode === Mode.CLEAN) ledCleaning.classList.add("active");
  }

  // Low Water: show ONLY when power is ON (not OFF)
  if (app.lowWater && app.state !== State.OFF) {
    ledLowWater.classList.add("active");
    ledLowWater.classList.add("blink");
  }

  // Selection highlight (use is-selected class on mode buttons)
  [btnSingle, btnDouble, btnSteam, btnClean].forEach(b => b.classList.remove("is-selected"));
  if (app.mode === Mode.SINGLE) btnSingle.classList.add("is-selected");
  if (app.mode === Mode.DOUBLE) btnDouble.classList.add("is-selected");
  if (app.mode === Mode.STEAM) btnSteam.classList.add("is-selected");
  if (app.mode === Mode.CLEAN) btnClean.classList.add("is-selected");

  // Power glow class (for your CSS)
  if (app.state === State.OFF) document.body.classList.remove("power-on");
  else document.body.classList.add("power-on");

  updateLocks();
}

/* -----------------------
   State transitions
------------------------ */
function powerOn() {
  resetRunTimers();
  resetPreheatTimer();

  app.state = State.PREHEATING;
  render();

  preheatTimer = setTimeout(() => {
    if (app.state !== State.PREHEATING) return;
    app.state = State.READY;
    render();
    threeLongBeeps();
  }, 1400);
}

function powerOff() {
  // Power off cancels everything and resets selections
  resetRunTimers();
  resetPreheatTimer();
  resetSelections();

  // Keep lowWater flag (per your requirement),
  // but LED will turn off in OFF state (render handles)
  app.state = State.OFF;
  render();
}

/* -----------------------
   Running logic
------------------------ */
function startSelectedMode() {
  if (app.state !== State.READY) return;
  if (app.mode === Mode.NONE) return;
  if (app.lowWater) return;

  app.state = State.RUNNING;
  render();

  // Simulated run durations in ms (adjust as needed)
  const durations = {
    [Mode.SINGLE]: 2200,
    [Mode.DOUBLE]: 2200,
    [Mode.STEAM]:  2500,
    [Mode.CLEAN]:  3000,
  };
  const duration = durations[app.mode];

  runTimer = setTimeout(() => {
    runTimer = null;

    // Completion => READY + 3 long beeps + keep mode selected?
    // Your earlier behavior implied returning to READY; mode can remain or reset.
    // We'll RESET mode on completion to match "clean completes then ready".
    resetSelections();
    app.state = State.READY;
    render();
    threeLongBeeps();
  }, duration);
}

function cancelAndResetToReady() {
  if (app.state !== State.RUNNING) return;

  // Cancel timers + reset selection, but keep power ON
  resetRunTimers();
  resetSelections();
  app.state = State.READY;
  render();

  twoShortBeeps();
}

/* -----------------------
   Click guards (locked controls)
------------------------ */
function guardLocked(btn) {
  if (!isLocked(btn)) return false;
  twoShortBeeps();
  return true;
}

/* -----------------------
   Event handlers
------------------------ */
btnPower.addEventListener("click", (e) => {
  // Shift + Power toggles Low Water (demo)
  if (e.shiftKey) {
    app.lowWater = !app.lowWater;
    render();
    return;
  }

  // Normal power toggle
  if (app.state === State.OFF) {
    powerOn();
  } else {
    powerOff();
  }
});

btnTemp.addEventListener("click", () => {
  if (guardLocked(btnTemp)) return;

  // Cycle temperature (locks already prevent this when not READY)
  if (app.temp === Temp.LOW) app.temp = Temp.MED;
  else if (app.temp === Temp.MED) app.temp = Temp.HIGH;
  else app.temp = Temp.LOW;

  render();
});

const modeBtnMap = new Map([
  [btnSingle, Mode.SINGLE],
  [btnDouble, Mode.DOUBLE],
  [btnSteam,  Mode.STEAM],
  [btnClean,  Mode.CLEAN],
]);

modeBtnMap.forEach((mode, btn) => {
  btn.addEventListener("click", () => {
    if (guardLocked(btn)) return;
    app.mode = mode;
    render();
  });
});

btnStartStop.addEventListener("click", () => {
  if (guardLocked(btnStartStop)) return;

  // If running => cancel + RESET (power stays ON)
  if (app.state === State.RUNNING) {
    cancelAndResetToReady();
    return;
  }

  // If ready => start selected mode
  if (app.state === State.READY) {
    startSelectedMode();
  }
});

/* -----------------------
   Init
------------------------ */
render();
