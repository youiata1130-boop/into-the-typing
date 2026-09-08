import { readFileSync } from "node:fs";
import vm from "node:vm";

// A small DOM and clock let the real battle flow run without browser dependencies.
export function createGame(savedItems = {}) {
  let now = 0;
  let nextTimerId = 1;
  const timers = new Map();
  const frames = new Map();
  const storage = new Map(Object.entries(savedItems));
  const element = () => {
    const attributes = new Map();
    const children = new Map();
    const classes = new Set();
    return {
      dataset: {}, hidden: false, textContent: "", offsetWidth: 100,
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
      querySelector(selector) {
        if (!children.has(selector)) children.set(selector, element());
        return children.get(selector);
      },
      querySelectorAll: () => [],
      appendChild(child) { child.isConnected = true; },
      replaceChildren() { children.clear(); },
      remove() { this.isConnected = false; },
      focus() {},
      addEventListener() {},
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
    };
  };
  const document = element();
  document.documentElement = element();
  document.body = element();
  document.createElement = element;
  const window = {
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
    matchMedia: () => ({ matches: true }),
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
    Image: class {},
    requestAnimationFrame(callback) {
      const id = nextTimerId++;
      frames.set(id, callback);
      return id;
    },
    cancelAnimationFrame: id => frames.delete(id),
  });
  const entryUrl = new URL("../../index.html", import.meta.url);
  const html = readFileSync(entryUrl, "utf8");
  for (const [, src] of html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g)) {
    const scriptUrl = new URL(src, entryUrl);
    scriptUrl.search = "";
    vm.runInContext(readFileSync(scriptUrl, "utf8"), context, { filename: scriptUrl.pathname });
  }
  const run = source => vm.runInContext(source, context);
  const snapshot = source => JSON.parse(JSON.stringify(run(source)));
  function advance(ms) {
    const end = now + ms;
    while (true) {
      const next = [...timers].filter(([, timer]) => timer.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      const [id, timer] = next;
      timers.delete(id);
      now = timer.at;
      timer.callback();
    }
    now = end;
  }
  return { run, snapshot, advance, saved: () => Object.fromEntries(storage) };
}
