# ステージ２のボス魚

- 作成日: 2026-09-16
- 生成方式: 組み込み ImageGen。既存の魚を目視して特徴を文章化し、新しいボスを生成。画像参照パスを渡す呼び出しは環境の読み取りエラーで失敗したため、成功した呼び出しは画像参照なし。
- 原本: C:/Users/youia/.codex/generated_images/01a09f73-1ec4-7702-bddf-65dac5fca912/exec-c0a62d56-2b5b-42d5-8cdd-084caf065103.png
- 採用先: src/assets/images/enemies/medaka/boss/idle/frame_01.png
- 形式: 1774 × 887 px、RGBA、透明背景。生成原本を加工せずコピー。
- 原本SHA-256: 10e73d45ba8d9e4d9cb05f380b7c4af26434a9b7ae7e96da96f896ed458ef5fd
- 外見: 銀青色の滑らかな体、紺色の背、鋭い赤い目。前寄りの三つ山の背びれと大きな二股の尾びれで通常魚と区別。
- 登場: ステージ２の３体目。最初の２体は通常のメダカ。通常魚は各10EXP、ボスは20EXPで、クリア時の合計40EXPと初回Lv2・SP1の案内を維持。

## 泳ぎの画像

- 作成方式: ユーザーが許可済みのPython画像処理（Pillow / NumPy）。顔を固定し、体の後方と尾びれを周期的に変形。
- 保存先: src/assets/images/enemies/medaka/boss/swim/frame_01.png ～ frame_16.png
- 形式: 768 × 479 pxの透過PNGを16枚。70ms/コマ、1周1.12秒。停止中も泳ぎ、動きを減らす設定では静止。攻撃・被弾・撃破は原本と既存CSSの演出。
- 検査: 16コマの重複なし、顔の画素が全コマ一致、透明な余白を保ちひれが見切れない、原本は不変。
- 再生成: `python scripts/generate_medaka_swim.py --source src/assets/images/enemies/medaka/boss/idle/frame_01.png --output src/assets/images/enemies/medaka/boss/swim`
- `--preview-dir <directory>` を付けるとWebP動画・コマ一覧・SHA-256のマニフェストも保存。

## 最終生成プロンプト

Use case: stylized-concept. Asset type: transparent PNG enemy sprite for a side-view Japanese typing RPG. Create ONE new boss medaka fish for an established game. The normal medaka in this game is a very slender pointed-nosed silver-blue fish, with a straight navy upper outline, a silver cheek, a half-lidded sharp red eye, a single triangular front dorsal fin and a forked pale blue tail. Match that family identity in a stronger boss design. Keep the elegant narrow horizontal medaka body, a fairly small face, smooth scale-free silver-blue skin, deep navy-blue back, luminous silver belly, clean dark outlines, and a sharp red eye with a confident slightly cute villain expression. Make it recognizably the boss: a somewhat stronger, broader body while still streamlined; a large elegant swept dorsal fin starting toward the front with three crown-like fin tips; more impressive broad flowing forked tail and swept pectoral fins. Fins are translucent ice blue with deep blue-violet edging, coherent with the existing normal fish. Polished softly cel-shaded anime game illustration with simple readable shapes, slightly deformed and cute rather than realistic or grotesque. No protruding teeth, no exposed gills, no visible scales or bumpy skin, no horns, no legs, no external crown or jewelry. Composition: exactly one entire fish, strictly side-on facing LEFT, nose left and tail right, swimming horizontally; full nose, fins and tail must fit with small transparent margin. Wide landscape composition suitable for an enemy sprite. Genuine alpha transparency everywhere outside the fish; no background, no scenery, no water, no shadow, no text, no UI, no watermark, no checkerboard baked into pixels. Preserve transparent alpha in the final PNG.
