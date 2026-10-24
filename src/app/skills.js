function getActiveSkill() {
  return skillDefinitions[getActiveWeapon().skillId || state.skillId] || skillDefinitions[defaultSkillId];
}

function useHealingSkill(skill) {
  if (state.hp >= getMaxHp()) return false;
  clearInputBuffer();
  state.specialInProgress = true;
  state.specialGauge = 0;
  skill.effects.forEach(effect => skillEffectHandlers[effect.type](effect, [state]));
  window.GAME_SOUND.play("heal");
  updateHud();
  scheduleBattleTimeout(() => {
    state.specialInProgress = false;
    updateHud();
    renderWord();
  }, skill.durationMs);
  return true;
}

function canChargeSkill() {
  return state.running && state.hp > 0 && !state.specialInProgress
    && !["branch", "unarmed"].includes(getBattleWeaponId())
    && !getStageDefinition(state.stageId).tutorial && !isStoryDialogueOpen();
}

function getSkillTargets(skill) {
  return skill.target === "allEnemies"
    ? state.activeEnemies.filter(enemy => isEnemyAlive(enemy)) : [];
}

function getSkillDamage(effect) {
  const weapon = getActiveWeapon();
  const multiplier = weapon.maxDamageMultiplier ?? weapon.damageMultiplier ?? 1;
  const rawDamage = getStatValue("attack") * multiplier;
  const attackDamage = weapon.id === "branch" || weapon.id === "greatsword"
    ? Math.round(rawDamage * 10) / 10 : Math.max(1, Math.round(rawDamage));
  return Math.round(attackDamage * effect.multiplier * 10) / 10;
}

// New effect types belong here; gauge consumption and battle timing stay shared.
const skillEffectHandlers = {
  stopActions(effect) { startEnemyActionStop(effect.durationMs); },
  heal(effect) {
    const before = state.hp;
    state.hp = Math.min(getMaxHp(), state.hp + Math.ceil(getMaxHp() * effect.fraction));
    playHealingEffect(state.hp - before);
  },
  damage(effect, targets) {
    const damage = getSkillDamage(effect);
    targets.forEach(enemy => {
      enemy.hp = Math.max(0, Math.round((enemy.hp - damage) * 10) / 10);
    });
  },
};

function updateSkillHud() {
  const hasResolvingEnemy = state.activeEnemies.some(enemy => isEnemyAlive(enemy) && enemy.resolving);
  els.specialButton.disabled = !state.running || state.guarding || state.specialInProgress || hasResolvingEnemy
    || !isSpecialReady() || !state.activeEnemies.some(enemy => isEnemyAlive(enemy));
  const skill = getActiveSkill();
  const value = Math.max(0, Math.min(specialGaugeMax, state.specialGauge));
  const percent = Math.floor(value / specialGaugeMax * 100);
  els.skillPanel.hidden = ["branch", "unarmed"].includes(getBattleWeaponId()) || !state.running || getStageDefinition(state.stageId).tutorial || isStoryDialogueOpen();
  els.skillPanel.dataset.ready = String(!els.specialButton.disabled);
  els.skillGauge.setAttribute("aria-valuemax", String(specialGaugeMax));
  els.skillGauge.setAttribute("aria-valuenow", String(value));
  els.skillGauge.setAttribute("aria-valuetext", `${percent}％${els.specialButton.disabled ? "" : "、発動可能"}`);
  els.skillGaugeFill.style.width = `${percent}%`;
  els.skillGaugeValue.textContent = `${percent}％`;
  els.skillName.textContent = skill.name;
  els.specialButton.setAttribute("aria-label", `${skill.name}を発動`);
  const shortcut = "Enter";
  els.specialShortcut.textContent = shortcut;
  els.specialButton.setAttribute("aria-keyshortcuts", shortcut);
}
