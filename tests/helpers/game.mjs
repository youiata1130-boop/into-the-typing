import { readFileSync } from "node:fs";
import vm from "node:vm";

// A small DOM and clock let the real battle flow run without browser dependencies.
export function createGame(savedItems = {}, { touch = false, loadImages = true, chooseSave = true } = {}) {
  let now = 0;
  let nextTimerId = 1;
  const timers = new Map();
  const frames = new Map();
  const storage = new Map(Object.entries(savedItems));
  const element = () => {
    const attributes = new Map();
    const children = new Map();
    const classes = new Set();
    const listeners = new Map();
    return {
      dataset: {}, hidden: false, textContent: "", offsetWidth: 100,
      value: "", defaultValue: "", readOnly: false,
      style: { setProperty() {} },
      classList: {
        add: (...names) => names.forEach(name => classes.add(name)),
        remove: (...names) => names.forEach(name => classes.delete(name)),
        contains: name => classes.has(name),
        toggle(name, value = !classes.has(name)) {
          if (value) classes.add(name); else classes.delete(name);
        },
      },
      setAttribute: (name, value) => attributes.set(name, value),
      getAttribute: name => attributes.get(name),
      removeAttribute: name => attributes.delete(name),
      setSelectionRange(start, end) { this.selectionStart = start; this.selectionEnd = end; },
      querySelector(selector) {
        if (!children.has(selector)) children.set(selector, element());
        return children.get(selector);
      },
      querySelectorAll: () => [],
      appendChild(child) { child.isConnected = true; },
      replaceChildren() { children.clear(); },
      remove() { this.isConnected = false; },
      cloneNode() {
        const clone = element();
        for (const [name, value] of attributes) clone.setAttribute(name, value);
        for (const key of ["value", "defaultValue", "readOnly", "id"]) clone[key] = this[key];
        classes.forEach(name => clone.classList.add(name));
        return clone;
      },
      insertAdjacentElement(position, child) {
        if (position !== "afterend") throw new Error("Unsupported test insertion");
        child.isConnected = true;
      },
      focus() {
        const previous = document.activeElement;
        document.activeElement = this;
        if (previous !== this) {
          previous?.dispatchEvent({ type: "blur" });
          this.dispatchEvent({ type: "focus" });
        }
      },
      addEventListener(type, listener) {
        if (!listeners.has(type)) listeners.set(type, []);
        listeners.get(type).push(listener);
      },
      dispatchEvent(event) {
        event.target = this;
        event.currentTarget = this;
        for (const listener of listeners.get(event.type) || []) listener(event);
      },
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
    };
  };
  const document = element();
  document.documentElement = element();
  document.body = element();
  document.baseURI = "https://typing.test/";
  document.createElement = element;
  const window = {
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
    matchMedia: query => ({ matches: query === "(pointer: coarse)" ? touch : true }),
    addEventListener() {},
    setTimeout(callback, delay) {
      const id = nextTimerId++;
      timers.set(id, { callback, at: now + delay });
      return id;
    },
    clearTimeout: id => timers.delete(id),
    setInterval: () => nextTimerId++,
    clearInterval() {},
  };
  const context = vm.createContext({
    document, window, performance: { now: () => now },
    URL,
    requestAnimationFrame(callback) {
      const id = nextTimerId++;
      frames.set(id, callback);
      return id;
    },
    cancelAnimationFrame: id => frames.delete(id),
  }, { microtaskMode: "afterEvaluate" });
  vm.runInContext(`
    window.testImages = [];
    class Image {
      constructor() { this.complete = false; this.naturalWidth = 0; this.naturalHeight = 0; }
      set src(value) {
        this.url = value;
        window.testImages.push(this);
        if (${loadImages}) this.succeed();
      }
      get src() { return this.url; }
      succeed() {
        this.complete = true;
        this.naturalWidth = this.naturalHeight = 64;
        this.onload?.();
      }
      fail() { this.onerror?.(); }
      deferDecode() {
        this.decodePromise = new Promise((resolve, reject) => {
          this.resolveDecode = resolve;
          this.rejectDecode = reject;
        });
      }
      decode() { return this.decodePromise || Promise.resolve(); }
    }
  `, context);
  const entryUrl = new URL("../../index.html", import.meta.url);
  const html = readFileSync(entryUrl, "utf8");
  for (const [, src] of html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g)) {
    const scriptUrl = new URL(src, entryUrl);
    scriptUrl.search = "";
    vm.runInContext(readFileSync(scriptUrl, "utf8"), context, { filename: scriptUrl.pathname });
  }
  const run = source => vm.runInContext(source, context);
  const snapshot = source => JSON.parse(JSON.stringify(run(source)));
  if (chooseSave) {
    run('const initialSave = getSaveEntry(0); activatePlayerSave(0, initialSave.data ? initialSave : saveSlots.write(0, "テスト", playerProgressSnapshot(loadPlayerProgress()), initialSave.raw))');
  }
  function advance(ms) {
    const end = now + ms;
    while (true) {
      const next = [...timers].filter(([, timer]) => timer.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      const [id, timer] = next;
      timers.delete(id);
      now = timer.at;
      timer.callback();
      vm.runInContext("", context);
    }
    now = end;
  }
  return { run, snapshot, advance, saved: () => Object.fromEntries(storage), savedProgress: () => snapshot("saveSlots.read(activeSaveSlot).data.progress") };
}
