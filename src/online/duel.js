// Shared, deterministic rules. Only the room owner applies damage and decides results.
window.ONLINE_DUEL = (() => {
  const rules = Object.freeze({ hp: 1000, damage: 40, attackMinMs: 2000, countdownMs: 3000, limitMs: 180000, version: 1 });
  function makeWords(source, variants, japanese) {
    return source.filter(word => word.text.length >= 10 && word.text.length <= 16)
      .map(word => ({ text: word.translation, roman: word.text, inputs: variants(word),
        reading: japanese.parse(word.text, word.reading)?.reading }))
      .filter(word => word.reading && word.inputs.length && word.inputs.every(input => /^[a-z-]{1,40}$/.test(input)));
  }
  function signature(words) {
    let hash = 2166136261;
    for (const char of JSON.stringify(words)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
    return `${rules.version}-${hash.toString(16)}`;
  }
  function shuffledOrder(length, random = Math.random) {
    const order = Array.from({ length }, (_, index) => index);
    for (let i = length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
  }
  function create(id, order, names, modes) {
    return { id, order, phase: "lobby", revision: 0, countdown: 3, remainingMs: rules.limitMs, winner: null,
      players: names.map((name, index) => ({ name, mode: modes[index], ready: false, hp: rules.hp,
        index: 0, value: "", seq: 0, attacks: 0, openedAt: 0 })) };
  }
  function wordFor(match, words, index) { return words[match.order[index % match.order.length]]; }
  function targetFor(word, mode, value = "") {
    return mode === "kana" ? word.reading : word.inputs.find(input => input.startsWith(value)) || word.inputs[0];
  }
  function acceptInput(match, words, seat, packet) {
    const player = match.players[seat];
    if (match.phase !== "fighting" || !player || packet.match !== match.id
        || packet.index !== player.index || !Number.isSafeInteger(packet.seq) || packet.seq <= player.seq
        || typeof packet.value !== "string" || packet.value.length > 40) return false;
    const word = wordFor(match, words, player.index);
    if (player.value === targetFor(word, player.mode, player.value)) return false;
    const target = targetFor(word, player.mode, packet.value);
    if (!target.startsWith(packet.value)) return false;
    player.value = packet.value;
    player.seq = packet.seq;
    match.revision++;
    return true;
  }
  function ready(match, seat, now) {
    if (match.phase !== "lobby" || !match.players[seat]) return false;
    match.players[seat].ready = true;
    if (match.players.every(player => player.ready)) {
      match.phase = "countdown";
      match.startsAt = now + rules.countdownMs;
    }
    match.revision++;
    return true;
  }
  function tick(match, words, now) {
    if (match.phase === "countdown") {
      const countdown = Math.max(0, Math.ceil((match.startsAt - now) / 1000));
      if (countdown !== match.countdown) { match.countdown = countdown; match.revision++; }
      if (now >= match.startsAt) {
        match.phase = "fighting";
        match.endsAt = now + rules.limitMs;
        match.players.forEach(player => { player.openedAt = now; });
        match.revision++;
      }
    }
    if (match.phase !== "fighting") return false;
    // The deadline is checked before damage, including after a suspended tab resumes.
    match.remainingMs = Math.max(0, match.endsAt - now);
    if (match.remainingMs > 0) {
      const attacks = match.players.map(player => {
        const word = wordFor(match, words, player.index);
        return now - player.openedAt >= rules.attackMinMs && player.value === targetFor(word, player.mode, player.value);
      });
      attacks.forEach((attacksNow, seat) => {
        if (!attacksNow) return;
        const player = match.players[seat];
        match.players[1 - seat].hp = Math.max(0, match.players[1 - seat].hp - rules.damage);
        player.index++; player.attacks++; player.value = ""; player.openedAt = now;
        match.revision++;
      });
    }
    if (!match.remainingMs || match.players.some(player => !player.hp)) {
      const [a, b] = match.players;
      match.winner = a.hp === b.hp ? -1 : a.hp > b.hp ? 0 : 1;
      match.phase = "finished";
      match.revision++;
    }
    return true;
  }
  function snapshot(match) {
    return { id: match.id, order: [...match.order], phase: match.phase, revision: match.revision,
      countdown: match.countdown, remainingMs: match.remainingMs, winner: match.winner,
      players: match.players.map(({ openedAt, ...player }) => ({ ...player })) };
  }
  function validSnapshot(data, words) {
    if (!data || typeof data.id !== "string" || !/^[a-f0-9]{24}$/.test(data.id)
        || !["lobby", "countdown", "fighting", "finished"].includes(data.phase)
        || !Number.isSafeInteger(data.revision) || data.revision < 0
        || !Array.isArray(data.order) || data.order.length !== words.length || new Set(data.order).size !== words.length
        || !data.order.every(index => Number.isInteger(index) && index >= 0 && index < words.length)
        || !Number.isInteger(data.countdown) || data.countdown < 0 || data.countdown > 3
        || !Number.isFinite(data.remainingMs) || data.remainingMs < 0 || data.remainingMs > rules.limitMs
        || ![null, -1, 0, 1].includes(data.winner) || !Array.isArray(data.players) || data.players.length !== 2) return false;
    return data.players.every(player => player && typeof player.name === "string" && player.name.length <= 20
      && ["roman", "kana"].includes(player.mode) && typeof player.ready === "boolean"
      && Number.isInteger(player.hp) && player.hp >= 0 && player.hp <= rules.hp
      && Number.isSafeInteger(player.index) && player.index >= 0 && player.index <= 1000
      && Number.isSafeInteger(player.seq) && player.seq >= 0
      && Number.isInteger(player.attacks) && player.attacks >= 0 && player.attacks <= 1000
      && typeof player.value === "string" && player.value.length <= 40
      && targetFor(wordFor(data, words, player.index), player.mode, player.value).startsWith(player.value));
  }
  return { rules, makeWords, signature, shuffledOrder, create, wordFor, targetFor, acceptInput, ready, tick, snapshot, validSnapshot };
})();
