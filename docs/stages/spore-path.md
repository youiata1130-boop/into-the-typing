# ステージ3-2「胞子の小道」

- 森エリア2番目のステージ。内部IDは `spore_path`。3-1クリアで解放し、以前のクリア済みセーブからも挑戦できる。
- 3-1の初回報酬である片手剣を装備した後、そのまま3-2へ進める。ステージ選択からは他の所持武器でも挑戦できる。
- 前半は小道のキノコ2体。各HP14、攻撃18〜22、溜め5.5秒、50EXP。
- 後半は奥地のキノコ2体。各HP16、攻撃20〜24、溜め5秒、60EXP。
- 全4体が1体ずつ登場し、定位置から胞子で攻撃する。溜めゲージと秒数を表示し、残り25％で警告表示に変わる。片手剣のガードで攻撃を防げる。
- 合計220EXPをクリア時に保存する。途中の失敗・中断・再開始では経験値とクリア記録を保存しない。武器報酬はない。
- 森の背景とキノコの既存画像を使用する。クリア後は森のステージ選択へ戻る。

## 実装と検証

- 設定: `src/config/stages.js`。地図の地点: `index.html` と `src/styles/main.css`。
- テスト: `tests/integration/stages/sporePath.test.mjs`、`tests/integration/ui/stageMaps.test.mjs`、`tests/integration/progression/swordShieldReward.test.mjs`。
