// Store each slot separately so saving one player cannot overwrite another player.
window.createPlayerSaveSlots = (getStorage) => {
  const keys = [1, 2, 3].map(number => "into-the-typing.slot." + number + ".v1");
  function key(index) {
    if (!Number.isInteger(index) || index < 0 || index >= keys.length) throw new Error("セーブ枠を選んでください");
    return keys[index];
  }
  function normalizeName(name) {
    return String(name || "").trim().replace(/[\u0000-\u001f\u007f]/g, "");
  }
  function read(index) {
    const raw = getStorage().getItem(key(index));
    if (raw === null) return { raw: null, data: null };
    try {
      const data = JSON.parse(raw);
      if (data?.version !== 1 || !normalizeName(data.name) || data.progress?.version !== 2) throw new Error();
      return { raw, data };
    } catch {
      return { raw, data: null, error: "読み込めません" };
    }
  }
  function write(index, name, progress, expectedRaw) {
    const normalized = normalizeName(name);
    if (!normalized || [...normalized].length > 20) throw new Error("名前を1〜20文字で入力してください");
    const storage = getStorage();
    const storageKey = key(index);
    if (expectedRaw !== undefined && storage.getItem(storageKey) !== expectedRaw) {
      throw new Error("別の画面で更新されています。セーブ枠を選び直してください");
    }
    const data = { version: 1, name: normalized, progress, updatedAt: Date.now() };
    const raw = JSON.stringify(data);
    storage.setItem(storageKey, raw);
    return { raw, data };
  }
  function migrateLegacy() {
    const storage = getStorage();
    if (storage.getItem(keys[0]) !== null) return;
    const raw = storage.getItem("into-the-typing.player.v2");
    if (!raw) return;
    let progress;
    try { progress = JSON.parse(raw); } catch { return; }
    if (progress?.version === 2) write(0, "プレイヤー1", progress, null);
  }
  return { keys, read, write, normalizeName, migrateLegacy };
};
