// Small synthesized effects require no downloads and start only after a gesture.
window.GAME_SOUND = (() => {
  const storageKey = "into-the-typing.sound";
  let enabled = true;
  let context;
  let output;
  let noiseBuffer;
  const lastPlayedAt = new Map();
  const cooldowns = {
    typing: 0.035, miss: 0.075, hurt: 0.06, defeat: 0.06,
    attack: 0.05, heavy: 0.05, impact: 0.05, special: 0.06, guard: 0.06,
  };
  try { enabled = window.localStorage.getItem(storageKey) !== "off"; } catch {}

  function unlock() {
    if (!enabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!context) {
        context = new AudioContext();
        output = context.createGain();
        output.gain.value = 0.22;
        const limiter = context.createDynamicsCompressor();
        limiter.threshold.value = -12;
        limiter.knee.value = 12;
        limiter.ratio.value = 8;
        limiter.attack.value = 0.003;
        limiter.release.value = 0.12;
        output.connect(limiter);
        limiter.connect(context.destination);
      }
      if (context.state === "suspended") context.resume()?.catch(() => {});
    } catch { /* Audio must never interrupt gameplay. */ }
  }

  // Tone tuples: frequency, duration, delay, waveform, end frequency, volume.
  const effects = {
    attack_boost: { tones: [[220,.17,0,"triangle",440,.4],[440,.22,.09,"triangle",880,.3],[880,.2,.18,"sine",1100,.2]] },
    time_stop: { tones: [[950,.16,0,"sine",250,.35],[480,.28,.08,"triangle",120,.25]] },
    heal: { tones: [[523, .22, 0, "sine", 659, .3], [659, .25, .12, "sine", 784, .3], [1047, .3, .24, "sine", 1319, .22]] },
    guard: { tones: [[1100, 0.14, 0, "triangle", 550, 0.45], [1750, 0.1, 0, "sine", 1300, 0.2]],
      noise: [{ from: 4500, to: 1800, duration: 0.06, volume: 0.5, filter: "highpass" }] },
    typing: { tones: [[760, 0.035, 0, "sine", 520]] },
    miss: { tones: [[230, 0.05, 0, "square", 175, 0.16], [170, 0.07, 0.075, "square", 130, 0.14]] },
    impact: { tones: [[180, 0.12, 0, "triangle", 55, 0.65]],
      noise: [{ from: 1100, to: 200, duration: 0.08, volume: 0.8, filter: "lowpass" }] },
    attack: {
      tones: [[2400, 0.10, 0.075, "sine", 1300, 0.16], [150, 0.12, 0.075, "triangle", 50, 0.5]],
      noise: [
        { from: 5200, to: 900, duration: 0.18, rise: 0.025, volume: 1.8 },
        { from: 6800, to: 2400, duration: 0.055, delay: 0.075, volume: 0.75, filter: "highpass" },
      ],
    },
    heavy: {
      tones: [[95, 0.22, 0.16, "triangle", 32, 0.9], [1800, 0.13, 0.16, "sine", 750, 0.22]],
      noise: [
        { from: 3400, to: 400, duration: 0.28, rise: 0.045, volume: 2.2 },
        { from: 6000, to: 1400, duration: 0.10, delay: 0.16, volume: 1.05, filter: "highpass" },
      ],
    },
    hurt: {
      tones: [[125, 0.18, 0, "triangle", 42, 0.85], [185, 0.09, 0.035, "square", 75, 0.15]],
      noise: [{ from: 1500, to: 180, duration: 0.16, volume: 1.5, filter: "lowpass" }],
    },
    special: {
      tones: [[220, 0.2, 0, "triangle", 880], [660, 0.25, 0.12, "sine", 330], [110, 0.24, 0.14, "triangle", 36, 0.8]],
      noise: [{ from: 6200, to: 500, duration: 0.32, rise: 0.035, volume: 2.0 }],
    },
    defeat: {
      tones: [[520, 0.12, 0, "sine", 520, 0.34], [780, 0.18, 0.08, "sine", 780, 0.28], [1040, 0.20, 0.16, "sine", 1040, 0.22]],
      noise: [{ from: 1800, to: 200, duration: 0.22, volume: 0.55, filter: "lowpass" }],
    },
    clear: { tones: [[523, 0.16, 0], [659, 0.16, 0.12], [784, 0.16, 0.24], [1047, 0.35, 0.36]] },
    over: { tones: [[330, 0.2, 0], [247, 0.2, 0.18], [165, 0.4, 0.36]] },
  };

  function envelope(start, duration, volume, rise = 0.005) {
    const gain = context.createGain();
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + rise);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    gain.gain.linearRampToValueAtTime(0, start + duration + 0.008);
    gain.connect(output);
    return gain;
  }

  function playTone([frequency, duration, delay = 0, type = "sine", end = frequency, volume = 0.3], now) {
    const start = now + delay;
    const oscillator = context.createOscillator();
    const gain = envelope(start, duration, volume);
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(end, start + duration);
    oscillator.connect(gain);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(start);
    oscillator.stop(start + duration + 0.01);
  }

  function playNoise({ from, to, duration, delay = 0, volume, rise = 0.004, filter = "bandpass" }, now) {
    if (!noiseBuffer) {
      noiseBuffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
      const samples = noiseBuffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    }
    const start = now + delay;
    const source = context.createBufferSource();
    const toneFilter = context.createBiquadFilter();
    const gain = envelope(start, duration, volume, rise);
    source.buffer = noiseBuffer;
    toneFilter.type = filter;
    toneFilter.Q.value = 0.7;
    toneFilter.frequency.setValueAtTime(from, start);
    toneFilter.frequency.exponentialRampToValueAtTime(to, start + duration);
    source.connect(toneFilter);
    toneFilter.connect(gain);
    source.onended = () => { source.disconnect(); toneFilter.disconnect(); gain.disconnect(); };
    source.start(start);
    source.stop(start + duration + 0.01);
  }

  function play(name) {
    if (!enabled || !context || context.state !== "running" || document.hidden) return;
    const effect = effects[name];
    if (!effect) return;
    const now = context.currentTime;
    if (now - (lastPlayedAt.get(name) ?? -Infinity) < (cooldowns[name] || 0)) return;
    lastPlayedAt.set(name, now);
    try {
      effect.tones?.forEach(note => playTone(note, now));
      effect.noise?.forEach(layer => playNoise(layer, now));
    } catch {}
  }

  const button = document.querySelector("#soundToggle");
  function updateButton() {
    button.textContent = `効果音 ${enabled ? "ON" : "OFF"}`;
    button.setAttribute("aria-pressed", String(enabled));
  }
  button.addEventListener("click", () => {
    enabled = !enabled;
    if (output) output.gain.value = enabled ? 0.22 : 0;
    try { window.localStorage.setItem(storageKey, enabled ? "on" : "off"); } catch {}
    updateButton();
    if (enabled) { unlock(); play("typing"); }
  });
  document.addEventListener("pointerdown", unlock, true);
  document.addEventListener("keydown", unlock, true);
  updateButton();
  return { play };
})();
