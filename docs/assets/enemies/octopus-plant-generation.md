# タコツル草の素材・生成記録

## 左向きの部位（2026-11-01・現行）

組み込み `image_gen` の編集機能で、既存のデザインを保ちつつ主人公のいる左側へ向けた。アトラスから個別画像に変更し、左・中央に触手、右端に本体を配置する。

- 触手: `src/assets/images/enemies/octopus_plant/tentacle-left-v2.webp`（左と中央で共用）
- 本体: `src/assets/images/enemies/octopus_plant/body-left-v2.webp`
- 1024×1536、透過PNGからロスレスWebPへ形式変換。デコード後の全画素の一致を確認。切り抜き・反転・拡大縮小は行わない。
- CSSで各画像全体を表示し、本体の接地位置を調整。独立した選択枠・HP・入力は維持する。
- 編集対象: `C:/Users/youia/.codex/generated_images/01a195b9-bcef-7870-8082-7247f2dfd4ea/exec-b2aec9d2-c771-470f-9264-ec08eaee7bd9.png`
- 触手の生成元: 同ディレクトリの `exec-e2fc6f99-7ed3-44df-8544-6c6229b07a3f.png`
- 本体の生成元: 同ディレクトリの `exec-ecdac5a1-3497-4214-9ad0-81fc2f0de2f6.png`
- 両方とも `transparent_background: true`。CLIは使用していない。

### 最終プロンプト：触手

Use case: precise-object-edit. Edit target: provided octopus plant sprite atlas. Keep ONLY the LEFTMOST single tall green tentacle from the reference. Remove the second tentacle and the entire body. ONE isolated complete green plant tentacle, curling and leaning clearly to SCREEN LEFT with its tip aimed toward an opponent to the left. Preserve the exact yellow-green suction cups, green stem, purple leaf accents, leafy root base, dark outlines and soft anime shading. Draw the entire root and every leaf tip, no clipping. A single standalone game enemy sprite. Portrait 1024x1536 canvas, the tentacle silhouette centered with at least 80px transparent padding around all extremities, common ground baseline at 1400px. No other objects or pieces. Genuine transparent alpha background everywhere outside the silhouette. No backdrop, no colored fog or glow, no scenery, no shadows on the ground, no text, no frame, no grid, no watermark. Preserve original monster identity and left-facing confrontational pose. This will oppose a hero standing to its left; do not draw the hero.

### 最終プロンプト：本体

Use case: precise-object-edit. Edit target: provided octopus plant sprite atlas. Keep ONLY the RIGHTMOST plant monster BODY from the reference. Remove BOTH tall tentacles entirely. ONE isolated complete round green octopus plant body, in the same LEFT-FACING three-quarter side view, with its tubular mouth visibly protruding to SCREEN LEFT and its amber gaze directed left at an enemy. Preserve the exact purple flower crown, green leafy bulb, amber eyes, purple cheek leaves, leafy collar, short woody roots, dark outlines and soft anime shading. The whole flower crown, every leaf tip and all roots fully visible, no clipping. No long tentacles. A single standalone game enemy sprite. Portrait 1024x1536 canvas, silhouette centered with at least 80px transparent padding around all extremities, common ground baseline at 1400px. Genuine transparent alpha background everywhere outside the silhouette. No backdrop, no colored fog or glow, no scenery, no shadows on the ground, no text, no frame, no grid, no watermark. Preserve original monster identity and left-facing confrontational pose. This will oppose a hero standing to its left; do not draw the hero.

## 旧アトラス（2026-10-31）

2026-10-31、組み込み `image_gen` で生成し、同じツールで部位間の余白を調整。

- 保管画像: `archive/assets/images/enemies/octopus_plant/parts.webp`
- 生成元: `C:/Users/youia/.codex/generated_images/01a16dfa-dd4d-7f80-87a7-b455309503c6/exec-0aa46fe1-a627-427b-8076-c9d25560a79b.png`
- 1536×1024、透過PNGからロスレスWebPへ形式変換。画素の追加・切り抜き・拡大縮小は行わない。
- 旧実装ではCSSでアトラスの左0〜480px、中央480〜1056px、右1056〜1536pxをそれぞれ表示していた。

### 初回プロンプト

Use case: stylized-concept. Asset type: ONE transparent sprite atlas for a friendly Japanese fantasy typing RPG. Draw an original octopus-like mountain plant monster, split into exactly THREE separately usable pieces in a single horizontal row of THREE EQUAL-WIDTH cells. Landscape canvas 1536 x 1024. Left third: one tall curling green plant tentacle growing upward from a small leafy root base, curling inward toward the center, with pale yellow-green suction-cup-like leaf pads. Center third: the creature's round bulbous green plant BODY with expressive amber eyes, a small octopus-like pout mouth, purple flower crown and leafy collar, short roots underneath, NO long tentacles on this piece. Right third: one matching tall curling green tentacle, curling inward toward the center, with the same leaf pads and root base. EXACTLY TWO long tentacles total, one in left cell and one in right cell. All three pieces share the same baseline near 88 percent canvas height and comparable visual height, each fully contained in its own third with 6 percent cell padding and transparent gaps between them; absolutely no cross-cell overlaps. Center body slightly wider and fuller than either tentacle. Clean readable silhouettes and crisp dark brown contour lines, vivid soft cel shading and softly dimensional polished anime game art, cute but mischievous enemy, three-quarter front view. These are modular body parts of ONE cohesive plant creature, no additional faces or tentacles. Real transparent alpha background, no backdrop, scenery, ground, glow, shadows, text, labels, grid, borders, UI, watermark or extra objects.

### 部位間隔の調整プロンプト

Edit this exact modular plant monster sprite atlas. Preserve its three designs, colors, rendering style, alpha transparency, canvas 1536x1024, baseline and relative heights. Correct ONLY the spacing and per-cell fit: left tentacle must be ENTIRELY within x=50..460; center body INCLUDING EVERY LEAF AND ROOT must be ENTIRELY within x=562..974 (make its silhouette narrower to fit); right tentacle must be ENTIRELY within x=1076..1486. Center each piece in its respective 512-pixel wide cell. No pixel from any piece must cross a cell boundary at x=512 or x=1024. At least 100 pixels of genuinely clear transparent air between the full silhouettes, no background glow or shadows in those gaps. Keep all three complete individual pieces, no cropping. This atlas will be split into EXACTLY THREE EQUAL VERTICAL COLUMNS by the game. Real transparent background, no text or guides.
