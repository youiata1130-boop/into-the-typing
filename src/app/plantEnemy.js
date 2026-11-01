function isPlantBody(enemy) {
  return enemy?.formation === "plant" && enemy.type === "octopus_plant_body";
}

function isPlantTentacle(enemy) {
  return enemy?.formation === "plant" && !isPlantBody(enemy);
}

function isPlantRegrowing(enemy) {
  return isPlantBody(enemy) && isEnemyAlive(enemy) && enemy.wiltedTentacles.length > 0;
}

function updatePlantRegrowth(body) {
  const active = isPlantRegrowing(body);
  body.regrowthEl.hidden = !active;
  body.element.classList.toggle("is-regrowing", active);
  const percent = Math.min(100, body.tentacleReviveElapsedMs / body.tentacleReviveMs * 100);
  body.regrowthFill.style.width = `${percent}%`;
  body.regrowthTrack.setAttribute("aria-valuenow", String(Math.floor(percent)));
}

function stopPlantRegrowth(body) {
  if (!isPlantBody(body)) return;
  body.wiltedTentacles = [];
  body.tentacleReviveElapsedMs = 0;
  updatePlantRegrowth(body);
}

function wiltPlantTentacle(enemy) {
  const body = state.activeEnemies.find(part => isPlantBody(part) && isEnemyAlive(part));
  if (!isPlantTentacle(enemy) || !body) return false;
  if (enemy.wilted) return true;
  enemy.wilted = true;
  enemy.resolving = true;
  enemy.element.classList.remove("hit", "special", "typing-shake");
  enemy.element.classList.add("is-wilted");
  enemy.selectButton.setAttribute("aria-label", `${enemy.name}（ぐったり）`);
  playEnemyAnimation(enemy, "idle");
  if (!body.wiltedTentacles.length) {
    body.tentacleReviveElapsedMs = 0;
    body.lastTick = performance.now();
    if (!body.resolving) playEnemyAnimation(body, "idle");
  }
  body.wiltedTentacles.push(enemy);
  updatePlantRegrowth(body);
  if (state.selectedEnemyId === enemy.id) setTargetEnemy(nextBattleEnemy(enemy));
  updateEnemyHud(enemy);
  updateHud();
  flushBufferedInput();
  return true;
}

function advancePlantRegrowth(body, now) {
  if (!isPlantRegrowing(body)) return false;
  body.tentacleReviveElapsedMs += Math.max(0, now - body.lastTick);
  body.lastTick = now;
  if (body.tentacleReviveElapsedMs >= body.tentacleReviveMs) {
    // Each tentacle needs its own full charge, even after a delayed frame.
    const enemy = body.wiltedTentacles.shift();
    body.tentacleReviveElapsedMs = 0;
    enemy.wilted = false;
    enemy.hp = enemy.maxHp;
    enemy.resolving = false;
    enemy.element.classList.remove("is-wilted");
    enemy.selectButton.setAttribute("aria-label", `${enemy.name}を選択`);
    enemy.lastTick = now;
    enemy.nextAttackAt = now + randomizeEnemyAttackMs(enemy.repeatAttackMs);
    // Give a revived tentacle time to wind up instead of hitting immediately.
    if (!enemy.atBase) setEnemyProgress(enemy, Math.min(enemy.progress, 1 - enemy.repeatAttackMs / enemy.approachMs));
    setNextWord(enemy);
    playEnemyAnimation(enemy, "idle");
    updateEnemyHud(enemy);
    if (!body.wiltedTentacles.length) body.nextAttackAt = now + randomizeEnemyAttackMs(body.repeatAttackMs);
    updateHud();
  }
  updatePlantRegrowth(body);
  return true;
}

function defeatPlantTentacles(body) {
  stopPlantRegrowth(body);
  const tentacles = state.activeEnemies.filter(isPlantTentacle);
  // Mark the whole plant dead before awarding parts or flushing queued input.
  tentacles.forEach(enemy => {
    enemy.hp = 0;
    enemy.resolving = true;
    updateEnemyHud(enemy);
  });
  tentacles.forEach(defeatEnemy);
}
