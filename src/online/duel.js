// Shared, deterministic rules. Only the room owner applies damage and decides results.
window.ONLINE_DUEL = (() => {
  const rules = Object.freeze({ hp: 1000, damage: 40, attackMinMs: 2000, countdownMs: 3000, limitMs: 180000,
    defenseWindowMs: 200, counterCooldownMs: 600, counterDamage: 20,
    damagePerCharacter: 4, inputMsPerCharacter: 200, windupMsPerCharacter: 40, maxInputLength: 40, version: 4 });
  const handicapRatios = Object.freeze([1, 1.1, 1.2, 1.3, 1.4, 1.5, 2, 2.5, 3]);
  function validHandicap(ratio, seat) { return handicapRatios.includes(ratio) && (seat === 0 || seat === 1); }
  function maxHpFor(match, seat) { return Math.round(rules.hp * (seat === match.handicapSeat ? match.handicapRatio : 1)); }
  const weapons = Object.freeze({
    sword: Object.freeze({ name: "鉄の剣", defense: "counter", minLength: 2, maxLength: 8 }),
    greatsword: Object.freeze({ name: "大剣", defense: "guard", emptyGuard: true, minLength: 12, maxLength: 20 }),
    dualBlades: Object.freeze({ name: "双剣", defense: "none", minLength: 2, maxLength: 4 }),
    swordShield: Object.freeze({ name: "片手剣", defense: "guard", minLength: 2, maxLength: 8 }),
  });
  function isWeapon(id) { return typeof id === "string" && Object.hasOwn(weapons, id); }
  function makeWords(source, variants, japanese) {
    return source.map(word => ({ text: word.translation, roman: word.text, inputs: variants(word),
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
  function create(id, order, names, modes, options = {}) {
    const battleMode = options.battleMode ?? "simple";
    const loadouts = options.weapons ?? ["sword", "sword"];
    const handicapRatio = options.handicapRatio ?? 1, handicapSeat = options.handicapSeat ?? 1;
    if (!["simple", "weapons"].includes(battleMode) || !Array.isArray(loadouts) || loadouts.length !== 2 || !loadouts.every(isWeapon)) {
      throw new Error("Invalid online mode or weapon");
    }
    if (!validHandicap(handicapRatio, handicapSeat)) throw new Error("Invalid HP handicap");
    return { id, order, battleMode, handicapRatio, handicapSeat, settingsRevision: 0,
      phase: "lobby", revision: 0, countdown: 3, remainingMs: rules.limitMs, winner: null, clockNow: 0,
      players: names.map((name, index) => ({ name, mode: modes[index], ready: false,
        hp: maxHpFor({ handicapRatio, handicapSeat }, index), maxHp: maxHpFor({ handicapRatio, handicapSeat }, index),
        weaponId: battleMode === "weapons" ? loadouts[index] : "sword",
        index: 0, value: "", seq: 0, attacks: 0, openedAt: 0, pendingInput: false,
        defenseSeq: 0, guarding: false, guardStartedAt: null, counterStartedAt: null, counterReadyAt: 0,
        attackAt: null, defenseCost: 0, feedback: "", feedbackId: 0, counterHits: 0 })) };
  }
  function chooseWeapon(match, seat, id) {
    if (match.phase !== "lobby" || match.battleMode !== "weapons" || !match.players[seat] || !isWeapon(id)) return false;
    if (match.players[seat].weaponId === id) return false;
    match.players[seat].weaponId = id;
    match.players.forEach(player => { player.ready = false; });
    match.settingsRevision++;
    match.revision++;
    return true;
  }
  function setHandicap(match, ratio, seat) {
    if (match.phase !== "lobby" || !validHandicap(ratio, seat)
        || (match.handicapRatio === ratio && match.handicapSeat === seat)) return false;
    match.handicapRatio = ratio; match.handicapSeat = seat;
    match.players.forEach((player, index) => {
      player.hp = player.maxHp = maxHpFor(match, index); player.ready = false;
    });
    match.settingsRevision++;
    match.revision++;
    return true;
  }
  const wordPools = new WeakMap();
  function wordPool(match, words, seat = 0) {
    let cached = wordPools.get(match.order);
    if (!cached || cached.words !== words) {
      cached = { words, pools: new Map() }; wordPools.set(match.order, cached);
    }
    const key = match.battleMode === "weapons" ? match.players[seat].weaponId : "simple";
    if (!cached.pools.has(key)) {
      const weapon = weapons[key];
      cached.pools.set(key, match.order.filter(index => {
        const word = words[index];
        if (!word) return false;
        const length = weapon ? Math.min(...word.inputs.map(input => input.length)) : word.roman.length;
        return length >= (weapon?.minLength ?? 10) && length <= (weapon?.maxLength ?? 16);
      }));
    }
    return cached.pools.get(key);
  }
  function wordFor(match, words, index, seat = 0) {
    const pool = wordPool(match, words, seat);
    return words[pool[index % pool.length]];
  }
  function targetFor(word, mode, value = "") {
    return mode === "kana" ? word.reading : word.inputs.find(input => input.startsWith(value)) || word.inputs[0];
  }
  function attackProfile(word, mode, value = "") {
    // Scale both power and elapsed time, so short prompts are faster rather than stronger per character.
    const length = targetFor(word, mode, value).length;
    return { damage: length * rules.damagePerCharacter, inputMs: length * rules.inputMsPerCharacter,
      windupMs: length * rules.windupMsPerCharacter };
  }
  function acceptInput(match, words, seat, packet, now = match.clockNow) {
    const player = match.players[seat];
    if (match.phase !== "fighting" || !player || packet.match !== match.id
        || packet.index !== player.index || !Number.isSafeInteger(packet.seq) || packet.seq <= player.seq
        || typeof packet.value !== "string" || packet.value.length > 40
        || (packet.pending !== undefined && typeof packet.pending !== "boolean")) return false;
    if (match.battleMode === "weapons" && (player.guarding || counterActive(player, now) || player.attackAt !== null)) return false;
    const word = wordFor(match, words, player.index, seat);
    if (player.value === targetFor(word, player.mode, player.value)) return false;
    const target = targetFor(word, player.mode, packet.value);
    if (!target.startsWith(packet.value)) return false;
    player.value = packet.value;
    player.seq = packet.seq;
    player.pendingInput = Boolean(packet.pending);
    match.revision++;
    return true;
  }
  function ready(match, seat, now, settingsRevision = match.settingsRevision) {
    if (match.phase !== "lobby" || !match.players[seat] || match.players[seat].ready
        || settingsRevision !== match.settingsRevision) return false;
    match.players[seat].ready = true;
    if (match.players.every(player => player.ready)) {
      match.phase = "countdown";
      match.startsAt = now + rules.countdownMs;
    }
    match.revision++;
    return true;
  }
  function tick(match, words, now) {
    match.clockNow = now;
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
      if (match.battleMode === "weapons") tickWeapons(match, words, now);
      else {
        const attacks = match.players.map((player, seat) => {
          const word = wordFor(match, words, player.index, seat);
          return now - player.openedAt >= rules.attackMinMs && player.value === targetFor(word, player.mode, player.value);
        });
        attacks.forEach((attacksNow, seat) => {
          if (!attacksNow) return;
          const player = match.players[seat];
          match.players[1 - seat].hp = Math.max(0, match.players[1 - seat].hp - rules.damage);
          player.index++; player.attacks++; player.value = ""; player.pendingInput = false; player.openedAt = now;
          match.revision++;
        });
      }
    }
    if (!match.remainingMs || match.players.some(player => !player.hp)) {
      // Defense borrows from future attack power. Unpaid cost is settled at the
      // result so guarding just before time-out/KO cannot create a free advantage.
      if (match.battleMode === "weapons") match.players.forEach(player => {
        player.hp = Math.max(0, player.hp - player.defenseCost);
        player.defenseCost = 0; player.guarding = false; player.guardStartedAt = null;
        player.counterStartedAt = null; player.counterReadyAt = 0; player.attackAt = null;
      });
      const [a, b] = match.players;
      match.winner = a.hp === b.hp ? -1 : a.hp > b.hp ? 0 : 1;
      match.phase = "finished";
      match.revision++;
    }
    return true;
  }
  function counterActive(player, now) {
    return player.counterStartedAt !== null && now >= player.counterStartedAt && now - player.counterStartedAt <= rules.defenseWindowMs;
  }
  function defense(match, words, seat, packet, now) {
    const player = match.players[seat];
    if (match.battleMode !== "weapons" || match.phase !== "fighting" || !player || packet.match !== match.id
        || !Number.isSafeInteger(packet.seq) || packet.seq <= player.defenseSeq
        || !["guard-start", "guard-end", "counter"].includes(packet.action)
        || !Number.isFinite(now) || now >= match.endsAt) return false;
    const weapon = weapons[player.weaponId];
    if (packet.action === "guard-end") {
      if (weapon.defense !== "guard") return false;
      player.guarding = false; player.guardStartedAt = null;
    } else {
      if (player.defenseCost > 0) return false;
      if (packet.action === "counter") {
        if (weapon.defense !== "counter" || now < player.counterReadyAt) return false;
        player.counterStartedAt = now; player.counterReadyAt = now + rules.counterCooldownMs;
      } else {
        const word = wordFor(match, words, player.index, seat);
        const partial = player.value && player.value !== targetFor(word, player.mode, player.value);
        if (weapon.defense !== "guard" || player.guarding || (weapon.emptyGuard && (partial || player.pendingInput))) return false;
        player.guarding = true; player.guardStartedAt = now;
      }
    }
    player.defenseSeq = packet.seq; match.clockNow = now; match.revision++;
    return true;
  }
  function feedback(player, type) { player.feedback = type; player.feedbackId++; }
  function tickWeapons(match, words, now) {
    for (const [seat, player] of match.players.entries()) {
      if (player.counterStartedAt !== null && !counterActive(player, now)) { player.counterStartedAt = null; match.revision++; }
      if (player.counterReadyAt && now >= player.counterReadyAt) { player.counterReadyAt = 0; match.revision++; }
      const word = wordFor(match, words, player.index, seat);
      const profile = attackProfile(word, player.mode, player.value);
      if (player.attackAt === null && now - player.openedAt >= profile.inputMs
          && player.value === targetFor(word, player.mode, player.value)) {
        player.attackAt = now + profile.windupMs;
        match.revision++;
      }
    }
    // Calculate both attacks first. Seat order cannot prevent a simultaneous hit.
    const hits = match.players.map((player, seat) => {
      if (player.attackAt === null || now < player.attackAt) return null;
      const power = attackProfile(wordFor(match, words, player.index, seat), player.mode, player.value).damage;
      const spent = Math.min(power, player.defenseCost);
      player.defenseCost -= spent;
      player.index++; player.attacks++; player.value = ""; player.pendingInput = false;
      player.openedAt = now; player.attackAt = null;
      match.revision++;
      return power - spent;
    });
    const effects = ["", ""];
    const effect = (seat, type) => { if (!effects[seat] || type !== "hit") effects[seat] = type; };
    hits.forEach((damage, seat) => {
      if (damage === null) return;
      const attacker = match.players[seat], defender = match.players[1 - seat];
      // A fully spent attack still ends the defense against that swing. Otherwise
      // an empty swing could leave a held guard blocking the next typing prompt.
      if (!damage) {
        defender.guarding = false; defender.guardStartedAt = null; defender.counterStartedAt = null;
        return;
      }
      if (counterActive(defender, now)) {
        const reflected = Math.min(rules.counterDamage, damage);
        attacker.hp = Math.max(0, attacker.hp - reflected);
        defender.defenseCost += damage + reflected;
        defender.counterStartedAt = null; defender.counterHits++;
        effect(1 - seat, "counter"); effect(seat, "hit");
      } else if (defender.guarding) {
        const just = now - defender.guardStartedAt <= rules.defenseWindowMs;
        const taken = Math.ceil(damage * (just ? .25 : .5));
        defender.hp = Math.max(0, defender.hp - taken);
        defender.defenseCost += damage - taken;
        defender.guarding = false; defender.guardStartedAt = null;
        effect(1 - seat, just ? "justGuard" : "guard");
      } else {
        defender.hp = Math.max(0, defender.hp - damage);
        effect(1 - seat, "hit");
      }
    });
    effects.forEach((type, seat) => { if (type) feedback(match.players[seat], type); });
  }
  function snapshot(match) {
    return { id: match.id, order: [...match.order], battleMode: match.battleMode, phase: match.phase, revision: match.revision,
      handicapRatio: match.handicapRatio, handicapSeat: match.handicapSeat, settingsRevision: match.settingsRevision,
      countdown: match.countdown, remainingMs: match.remainingMs, winner: match.winner,
      players: match.players.map(({ openedAt, guardStartedAt, counterStartedAt, counterReadyAt, attackAt, ...player }) => ({ ...player,
        countering: counterActive({ counterStartedAt }, match.clockNow),
        counterWaitMs: Math.max(0, counterReadyAt - match.clockNow),
        attackWaitMs: attackAt === null ? null : Math.max(0, attackAt - match.clockNow) })) };
  }
  function validSnapshot(data, words) {
    if (!data || typeof data.id !== "string" || !/^[a-f0-9]{24}$/.test(data.id)
        || !["lobby", "countdown", "fighting", "finished"].includes(data.phase)
        || !["simple", "weapons"].includes(data.battleMode)
        || !validHandicap(data.handicapRatio, data.handicapSeat)
        || !Number.isSafeInteger(data.settingsRevision) || data.settingsRevision < 0
        || !Number.isSafeInteger(data.revision) || data.revision < 0
        || !Array.isArray(data.order) || data.order.length !== words.length || new Set(data.order).size !== words.length
        || !data.order.every(index => Number.isInteger(index) && index >= 0 && index < words.length)
        || !Number.isInteger(data.countdown) || data.countdown < 0 || data.countdown > 3
        || !Number.isFinite(data.remainingMs) || data.remainingMs < 0 || data.remainingMs > rules.limitMs
        || ![null, -1, 0, 1].includes(data.winner) || !Array.isArray(data.players) || data.players.length !== 2) return false;
    return data.players.every((player, seat) => player && typeof player.name === "string" && player.name.length <= 20
      && isWeapon(player.weaponId) && (data.battleMode !== "simple" || player.weaponId === "sword")
      && ["roman", "kana"].includes(player.mode) && typeof player.ready === "boolean"
      && player.maxHp === maxHpFor(data, seat)
      && Number.isInteger(player.hp) && player.hp >= 0 && player.hp <= player.maxHp
      && Number.isSafeInteger(player.index) && player.index >= 0 && player.index <= 1000
      && Number.isSafeInteger(player.seq) && player.seq >= 0
      && Number.isInteger(player.attacks) && player.attacks >= 0 && player.attacks <= 1000
      && typeof player.pendingInput === "boolean" && typeof player.guarding === "boolean" && typeof player.countering === "boolean"
      && Number.isSafeInteger(player.defenseSeq) && player.defenseSeq >= 0
      && Number.isInteger(player.defenseCost) && player.defenseCost >= 0 && player.defenseCost <= rules.maxInputLength * rules.damagePerCharacter + rules.counterDamage
      && Number.isFinite(player.counterWaitMs) && player.counterWaitMs >= 0 && player.counterWaitMs <= rules.counterCooldownMs
      && ["", "hit", "guard", "justGuard", "counter"].includes(player.feedback)
      && Number.isInteger(player.feedbackId) && player.feedbackId >= 0 && player.feedbackId <= 10000
      && Number.isInteger(player.counterHits) && player.counterHits >= 0 && player.counterHits <= 1000
      && (!player.guarding || (data.battleMode === "weapons" && weapons[player.weaponId].defense === "guard"))
      && (!player.countering || (data.battleMode === "weapons" && weapons[player.weaponId].defense === "counter"))
      && typeof player.value === "string" && player.value.length <= 40
      && wordPool(data, words, seat).length > 0
      && targetFor(wordFor(data, words, player.index, seat), player.mode, player.value).startsWith(player.value)
      && (player.attackWaitMs === null || (Number.isFinite(player.attackWaitMs) && player.attackWaitMs >= 0
        && player.value === targetFor(wordFor(data, words, player.index, seat), player.mode, player.value)
        && player.attackWaitMs <= attackProfile(wordFor(data, words, player.index, seat), player.mode, player.value).windupMs)));
  }
  return { rules, weapons, isWeapon, handicapRatios, validHandicap, setHandicap, makeWords, signature, shuffledOrder, create, chooseWeapon, wordPool, wordFor, targetFor, attackProfile,
    acceptInput, defense, ready, tick, snapshot, validSnapshot };
})();
