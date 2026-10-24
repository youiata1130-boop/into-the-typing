function getDualBladePreviewWord() {
  if (!state.running || getBattleWeaponId() !== "dualBlades" || isStoryDialogueOpen()
      || els.battleScreen.hidden || state.cleared >= state.roundLimit) return null;
  const enemy = getCurrentEnemy();
  if (!enemy) return state.dualNextSpawnWord;
  if (isEnemyAlive(enemy)) {
    // Recovery may already have assigned the upcoming word while it is hidden.
    if (performance.now() < state.playerAttackReadyAt && !enemy.resolving && !enemy.typed) {
      return { text: enemy.word, translation: enemy.translation, reading: enemy.readingOverride };
    }
    if (enemy.resolving || enemy.hp > getPlayerAttackDamage(enemy)) {
      return enemy.nextWordPreview ||= chooseEnemyWord(enemy);
    }
  }
  const following = state.activeEnemies.find(other => other !== enemy && isEnemyAlive(other));
  if (following) return { text: following.word, translation: following.translation, reading: following.readingOverride };
  if (state.cleared + (isEnemyAlive(enemy) ? 1 : 0) >= state.roundLimit) return null;
  return state.dualNextSpawnWord ||= chooseEnemyWord(enemy);
}

function updateDualBladePreview() {
  const next = getDualBladePreviewWord();
  els.nextWordPreview.hidden = !next;
  const input = next ? getWordInputs(next)[0] || next.text : "";
  const reading = next && flickState.enabled
    ? window.JAPANESE_INPUT.parse(next.text, next.reading || "")?.reading || input : input;
  const text = next ? `次：${next.translation}　${reading}` : "";
  if (els.nextWordPreview.textContent !== text) els.nextWordPreview.textContent = text;
}
