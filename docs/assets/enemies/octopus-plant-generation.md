# タコツル草の素材・生成記録

2026-10-31、組み込み `image_gen` で生成し、同じツールで部位間の余白を調整。

- 使用画像: `src/assets/images/enemies/octopus_plant/parts.webp`
- 生成元: `C:/Users/youia/.codex/generated_images/01a16dfa-dd4d-7f80-87a7-b455309503c6/exec-0aa46fe1-a627-427b-8076-c9d25560a79b.png`
- 1536×1024、透過PNGからロスレスWebPへ形式変換。画素の追加・切り抜き・拡大縮小は行わない。
- CSSでアトラスの左0〜480px、中央480〜1056px、右1056〜1536pxをそれぞれ表示。3つの独立した選択枠・HP・入力を持たせる。

## 初回プロンプト

Use case: stylized-concept. Asset type: ONE transparent sprite atlas for a friendly Japanese fantasy typing RPG. Draw an original octopus-like mountain plant monster, split into exactly THREE separately usable pieces in a single horizontal row of THREE EQUAL-WIDTH cells. Landscape canvas 1536 x 1024. Left third: one tall curling green plant tentacle growing upward from a small leafy root base, curling inward toward the center, with pale yellow-green suction-cup-like leaf pads. Center third: the creature's round bulbous green plant BODY with expressive amber eyes, a small octopus-like pout mouth, purple flower crown and leafy collar, short roots underneath, NO long tentacles on this piece. Right third: one matching tall curling green tentacle, curling inward toward the center, with the same leaf pads and root base. EXACTLY TWO long tentacles total, one in left cell and one in right cell. All three pieces share the same baseline near 88 percent canvas height and comparable visual height, each fully contained in its own third with 6 percent cell padding and transparent gaps between them; absolutely no cross-cell overlaps. Center body slightly wider and fuller than either tentacle. Clean readable silhouettes and crisp dark brown contour lines, vivid soft cel shading and softly dimensional polished anime game art, cute but mischievous enemy, three-quarter front view. These are modular body parts of ONE cohesive plant creature, no additional faces or tentacles. Real transparent alpha background, no backdrop, scenery, ground, glow, shadows, text, labels, grid, borders, UI, watermark or extra objects.

## 部位間隔の調整プロンプト

Edit this exact modular plant monster sprite atlas. Preserve its three designs, colors, rendering style, alpha transparency, canvas 1536x1024, baseline and relative heights. Correct ONLY the spacing and per-cell fit: left tentacle must be ENTIRELY within x=50..460; center body INCLUDING EVERY LEAF AND ROOT must be ENTIRELY within x=562..974 (make its silhouette narrower to fit); right tentacle must be ENTIRELY within x=1076..1486. Center each piece in its respective 512-pixel wide cell. No pixel from any piece must cross a cell boundary at x=512 or x=1024. At least 100 pixels of genuinely clear transparent air between the full silhouettes, no background glow or shadows in those gaps. Keep all three complete individual pieces, no cropping. This atlas will be split into EXACTLY THREE EQUAL VERTICAL COLUMNS by the game. Real transparent background, no text or guides.
