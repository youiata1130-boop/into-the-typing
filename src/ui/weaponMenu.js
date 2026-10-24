const weaponMenuState = { selectedId: "", loadingSrc: "", requestId: 0 };
const weaponFeatures = {
  branch: ["基本2〜3文字の短い単語", "威力：攻撃力×0.2", "スキル使用不可"],
  sword: ["扱いやすい基本の剣", "威力：攻撃力×1", "スキル：体力30％回復・ゲージはゆっくり溜まる"],
  greatsword: ["基本12〜20文字の長い単語", "入力で溜めて最大威力4倍", "未入力時のみガード可能・被ダメージ1/4"],
  dualBlades: ["基本2〜4文字・短い間隔で攻撃", "威力：攻撃力×0.6", "次の単語を予告"],
  swordShield: ["威力：攻撃力×1", "入力中もガード可能", "ガード時の被ダメージ1/4"],
};

function previewWeapon(weaponId) {
  if (state.running || els.weaponScreen.hidden || !isWeaponAvailable(weaponId)) return;
  weaponMenuState.selectedId = weaponId;
  updateWeaponDetails();
}

function updateWeaponDetails() {
  if (els.weaponScreen.hidden || document.documentElement.dataset.screen !== "weapons") return;
  if (!isWeaponAvailable(weaponMenuState.selectedId)) weaponMenuState.selectedId = state.weaponId;
  const id = weaponMenuState.selectedId;
  const weapon = getWeaponDefinition(id);
  els.weaponPanel.querySelectorAll("input[name='weapon']").forEach(input => {
    input.checked = input.value === id;
  });
  els.weaponPreviewName.textContent = weapon.name;
  els.weaponPreviewImage.alt = `${weapon.name}を装備した主人公`;
  els.weaponPreviewFeatures.replaceChildren(...weaponFeatures[id].map(text => {
    const item = document.createElement("li");
    item.textContent = text;
    return item;
  }));
  const equipped = state.weaponId === id;
  els.weaponEquipButton.disabled = state.running || equipped;
  els.weaponEquipButton.textContent = equipped ? "装備中" : "装備する";
  loadWeaponPreviewImage();
}

function loadWeaponPreviewImage() {
  const id = weaponMenuState.selectedId;
  const src = new URL(getPlayerWeaponAssets(id).idle, document.baseURI).href;
  if (els.weaponPreviewImage.getAttribute("src") === src || weaponMenuState.loadingSrc === src) return;
  const requestId = ++weaponMenuState.requestId;
  weaponMenuState.loadingSrc = src;
  els.weaponPreviewImage.hidden = true;
  els.weaponPreviewImage.removeAttribute("src");
  els.weaponPreviewStatus.hidden = false;
  els.weaponPreviewStatus.textContent = "読み込み中…";
  els.weaponPreviewRetry.hidden = true;
  loadGameImage(src).then(() => {
    if (requestId !== weaponMenuState.requestId) return;
    weaponMenuState.loadingSrc = "";
    if (els.weaponScreen.hidden || weaponMenuState.selectedId !== id) return;
    els.weaponPreviewImage.setAttribute("src", src);
    els.weaponPreviewImage.hidden = false;
    els.weaponPreviewStatus.hidden = true;
  }).catch(() => {
    if (requestId !== weaponMenuState.requestId) return;
    weaponMenuState.loadingSrc = "";
    if (els.weaponScreen.hidden || weaponMenuState.selectedId !== id) return;
    els.weaponPreviewStatus.textContent = "画像を読み込めませんでした";
    els.weaponPreviewRetry.hidden = false;
  });
}

function equipPreviewedWeapon() {
  if (state.running || els.weaponScreen.hidden || !isWeaponAvailable(weaponMenuState.selectedId)) return;
  selectWeapon(weaponMenuState.selectedId);
}
