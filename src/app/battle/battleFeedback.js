const playerDamageFeedback = { timerId: 0 };
const playerHealingFeedback = { timerId: 0 };

function clearHealingEffect() {
  window.clearTimeout(playerHealingFeedback.timerId);
  playerHealingFeedback.timerId = 0;
  els.player.classList.remove("is-healing");
  els.playerHealText.textContent = "";
}

function playHealingEffect(amount) {
  clearHealingEffect();
  els.playerHealText.textContent = `＋${amount}`;
  void els.player.offsetWidth;
  els.player.classList.add("is-healing");
  playerHealingFeedback.timerId = scheduleBattleTimeout(clearHealingEffect, 900);
}

function clearPlayerDamageEffect() {
  window.clearTimeout(playerDamageFeedback.timerId);
  playerDamageFeedback.timerId = 0;
  els.player.classList.remove("is-damaged", "is-chip-hit");
  els.playerDamageEffect.classList.remove("is-active");
  els.playerDamageText.textContent = "";
}

function playPlayerDamageEffect(damage, guarded = false) {
  if (damage <= 0) return;
  clearPlayerDamageEffect();
  els.playerDamageText.textContent = `−${damage}`;
  void els.player.offsetWidth;
  els.player.classList.add(guarded ? "is-chip-hit" : "is-damaged");
  if (!guarded) els.playerDamageEffect.classList.add("is-active");
  playerDamageFeedback.timerId = scheduleBattleTimeout(clearPlayerDamageEffect, 650);
}
