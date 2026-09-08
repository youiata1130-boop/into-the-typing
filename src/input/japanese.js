// Convert the game's canonical romaji to a reading and matching input boundaries.
window.JAPANESE_INPUT = (() => {
  const kana = {
    a: "あ", i: "い", u: "う", e: "え", o: "お",
    ka: "か", ki: "き", ku: "く", ke: "け", ko: "こ",
    sa: "さ", shi: "し", si: "し", su: "す", se: "せ", so: "そ",
    ta: "た", chi: "ち", ti: "ち", tsu: "つ", tu: "つ", te: "て", to: "と",
    na: "な", ni: "に", nu: "ぬ", ne: "ね", no: "の",
    ha: "は", hi: "ひ", fu: "ふ", hu: "ふ", he: "へ", ho: "ほ",
    ma: "ま", mi: "み", mu: "む", me: "め", mo: "も",
    ya: "や", yu: "ゆ", yo: "よ",
    ra: "ら", ri: "り", ru: "る", re: "れ", ro: "ろ",
    wa: "わ", wo: "を",
    ga: "が", gi: "ぎ", gu: "ぐ", ge: "げ", go: "ご",
    za: "ざ", ji: "じ", zi: "じ", zu: "ず", ze: "ぜ", zo: "ぞ",
    da: "だ", di: "ぢ", du: "づ", de: "で", do: "ど",
    ba: "ば", bi: "び", bu: "ぶ", be: "べ", bo: "ぼ",
    pa: "ぱ", pi: "ぴ", pu: "ぷ", pe: "ぺ", po: "ぽ",
    sha: "しゃ", shu: "しゅ", sho: "しょ",
    cha: "ちゃ", chu: "ちゅ", cho: "ちょ",
    ja: "じゃ", ju: "じゅ", jo: "じょ", "-": "ー",
  };
  for (const [roman, base] of Object.entries({
    ky: "き", sy: "し", ty: "ち", ny: "に", hy: "ひ", my: "み",
    ry: "り", gy: "ぎ", zy: "じ", by: "び", py: "ぴ",
  })) {
    for (const [vowel, small] of Object.entries({ a: "ゃ", u: "ゅ", o: "ょ" })) {
      kana[roman + vowel] = base + small;
    }
  }

  function normalize(value) {
    return value.normalize("NFKC").toLowerCase().trim()
      .replace(/[ァ-ヶ]/g, character => String.fromCharCode(character.charCodeAt(0) - 0x60));
  }

  function parse(roman, readingOverride = "") {
    const tokens = [];
    let reading = "";
    let offset = 0;
    while (offset < roman.length) {
      const rest = roman.slice(offset);
      let text = "";
      let length = 0;
      if (rest[0] === "n" && (readingOverride[reading.length] === "ん" || !/[aiueoy]/.test(rest[1] || " "))) {
        text = "ん";
        length = rest === "nn" ? 2 : 1;
      } else if (/^([bcdfghjklmpqrstvwxyz])\1/.test(rest)) {
        text = "っ";
        length = 1;
      } else {
        for (const size of [3, 2, 1]) {
          if (kana[rest.slice(0, size)]) {
            text = kana[rest.slice(0, size)];
            length = Math.min(size, rest.length);
            break;
          }
        }
      }
      if (!length) return null;
      offset += length;
      reading += text;
      tokens.push({ romanEnd: offset, kanaEnd: reading.length });
    }
    return { reading, tokens };
  }

  function match(value, roman, translation, parsed) {
    const normalized = normalize(value);
    if (!parsed) return null;
    if (normalized === normalize(translation) || normalized === parsed.reading) return roman;
    if (!parsed.reading.startsWith(normalized)) return null;
    const last = parsed.tokens.filter(token => token.kanaEnd <= normalized.length).at(-1);
    return roman.slice(0, last?.romanEnd || 0);
  }

  return { normalize, parse, match };
})();
