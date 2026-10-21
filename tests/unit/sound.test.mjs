import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

function setup(saved = null, available = true) {
  const events = {};
  const button = { addEventListener: (_, callback) => { button.click = callback; }, setAttribute() {} };
  let contexts = 0;
  let now = 1;
  let notes = 0;
  let buffers = 0;
  const voices = [];
  const param = { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} };
  const node = () => ({ gain: { ...param }, frequency: { ...param }, Q: { ...param }, connect() {},
    disconnect() { this.disconnected = true; }, start() { notes++; voices.push(this); }, stop() {} });
  const window = {
    localStorage: { getItem: () => saved, setItem: (_, value) => { saved = value; } },
    AudioContext: available ? class {
      constructor() { contexts++; this.state = "running"; this.sampleRate = 48000; }
      get currentTime() { return now; }
      createGain() { return node(); }
      createOscillator() { return node(); }
      createBiquadFilter() { return node(); }
      createBufferSource() { return node(); }
      createBuffer(_, length) { buffers++; const samples = new Float32Array(length); return { getChannelData: () => samples }; }
      createDynamicsCompressor() { return { ...node(), ...Object.fromEntries(["threshold", "knee", "ratio", "attack", "release"].map(name => [name, { ...param }])) }; }
    } : undefined,
  };
  const document = { querySelector: () => button, addEventListener: (name, callback) => { events[name] = callback; } };
  vm.runInNewContext(readFileSync(new URL("../../src/app/sound.js", import.meta.url), "utf8"), { window, document });
  return { window, document, button, events, voices, advance: seconds => { now += seconds; }, contexts: () => contexts, notes: () => notes, buffers: () => buffers, saved: () => saved };
}

test("audio waits for a gesture and mute persists and prevents notes", () => {
  const audio = setup();
  audio.window.GAME_SOUND.play("attack");
  assert.equal(audio.contexts(), 0);
  audio.events.pointerdown();
  audio.window.GAME_SOUND.play("attack");
  const attackNotes = audio.notes();
  assert.ok(attackNotes > 0);
  audio.button.click();
  audio.window.GAME_SOUND.play("clear");
  assert.equal(audio.notes(), attackNotes);
  assert.equal(audio.saved(), "off");
  audio.button.click();
  audio.window.GAME_SOUND.play("clear");
  assert.ok(audio.notes() > attackNotes);
  assert.equal(audio.contexts(), 1);
});

test("layered effects reuse noise and release each sound source", () => {
  const audio = setup();
  audio.events.pointerdown();
  for (const name of ["attack", "heavy", "hurt", "defeat", "special", "impact", "miss"]) audio.window.GAME_SOUND.play(name);
  assert.equal(audio.buffers(), 1);
  assert.ok(audio.voices.some(voice => voice.buffer));
  for (const voice of audio.voices) {
    assert.equal(typeof voice.onended, "function");
    voice.onended();
    assert.equal(voice.disconnected, true);
  }
});

test("simultaneous combat effects cannot stack and later actions remain audible", () => {
  for (const name of ["miss", "defeat", "hurt", "attack", "heavy", "impact", "special"]) {
    const audio = setup();
    audio.events.pointerdown();
    audio.window.GAME_SOUND.play(name);
    const first = audio.notes();
    assert.ok(first > 0);
    for (let index = 0; index < 10; index++) audio.window.GAME_SOUND.play(name);
    assert.equal(audio.notes(), first);
    audio.advance(0.2);
    audio.window.GAME_SOUND.play(name);
    assert.ok(audio.notes() > first);
  }
});

test("saved mute and unsupported browsers remain playable", () => {
  const muted = setup("off");
  muted.events.keydown();
  assert.equal(muted.contexts(), 0);
  assert.equal(muted.button.textContent, "効果音 OFF");
  const unsupported = setup(null, false);
  assert.doesNotThrow(() => { unsupported.events.pointerdown(); unsupported.window.GAME_SOUND.play("miss"); });
});

test("rapid typing is limited and hidden pages stay silent", () => {
  const audio = setup();
  audio.events.keydown();
  audio.window.GAME_SOUND.play("typing");
  audio.window.GAME_SOUND.play("typing");
  assert.equal(audio.notes(), 1);
  audio.document.hidden = true;
  audio.window.GAME_SOUND.play("special");
  assert.equal(audio.notes(), 1);
});
