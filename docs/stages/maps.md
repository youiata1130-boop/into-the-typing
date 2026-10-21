# エリア別の地図

- 海辺にはステージ1-1〜1-4、草原にはステージ2-1・2-2・2-3、森には[3-1「キノコの森」](mushroom-forest.md)・[3-2「胞子の小道」](spore-path.md)を表示する。
- 地図下部の「1 海辺」「2 草原」「3 森」で表示エリアを切り替える。切り替えると開始確認を閉じる。
- 未解放の草原も地図を閲覧できるが、ステージ2-1はステージ1-4クリアまで開始できない。
- 森の地図も解放前から閲覧できる。3-1は2-3クリア、3-2は3-1クリアで解放する。
- 戦闘開始時にそのステージの地図を選択するため、戦闘から戻ると同じエリアが開く。
- セーブ選択時は、そのプレイヤーが解放済みの最新エリアを開く。
- スマートフォンの縦画面では中央を切り出し、地点の座標も合わせて調整する。

## 背景素材

組み込みの画像生成ツールで生成し、JPEG（品質88、1536×1024）に変換して保存した。両方を起動時に読み込む。

- `src/assets/images/backgrounds/stage_map/coast.jpg`
- `src/assets/images/backgrounds/stage_map/grassland.jpg`

スタイル参照：`src/assets/images/backgrounds/stage_map/desk_landscape.jpg`

### 海辺の生成プロンプト

Create one game background illustration. Use the reference ONLY for antique parchment, sepia ink engraving, warm wooden desk, and softly aged hand-painted fantasy map style. This new map is a CLOSE-UP REGIONAL MAP OF A SEASIDE, not a world map. Landscape 1536x1024. Flat overhead parchment with mostly straight edges, a narrow 3% border of dark wood visible. Enlarge the coast so it is the main subject: blue-green sea fills the left, a broad pale sandy shoreline snakes from bottom center up the center to top center, warm grassy coastal land fills the right. Four distinct coastal locations along the winding shore: quiet starting beach near 44% x 77% y, little fish shallows near 54% x 59% y, sandy crab beach near 43% x 42% y, rocky surf cove near 56% x 25% y. These should be natural map locations without icons or circles. Sparse rocks, tiny ink waves, sandy paths and subtle dune grass, low hills only at far right. Fine sepia pen linework, muted sea color, beautiful visible paper grain. Keep the central half of the image readable and usable under game markers and safe when side-cropped on mobile. No cities, castles, mountains dominating, characters, lettering, text, numbers, labels, UI, buttons, markers, symbols, compass, or watermark. Return a single complete coastal map, no split image.

### 草原の生成プロンプト

Create one game background illustration. Use reference only for antique parchment, fine sepia engraved linework, warm wooden desk, and aged fantasy map material. This new map is a CLOSE-UP REGIONAL MAP OF OPEN GRASSLAND, not a world map. Landscape 1536x1024. Flat overhead parchment with mostly straight edges and a narrow 3% border of dark wood visible. Broad rolling grassy meadow fills almost the whole map, gently green olive watercolor washes over warm parchment. A pale winding footpath begins at bottom center, reaches a spacious grassy clearing around x48% y65% for the first playable area, then meanders through the central half towards distant rolling hills at top. Sparse clusters of small ink grass tufts, tiny wildflowers and scattered rocks, a few trees near far edges, a thin creek along the right quarter, no sea. The center should feel expansive and peaceful with subtle texture and be readable beneath a single game marker. Upper center and lower center leave quiet areas for external UI, do not draw UI. Keep central half usable when side-cropped for portrait phone. Fine hand-drawn linework, topographic map perspective, beautiful aged paper grain, fold marks. No mountains dominating, castles, cities, people, snakes, lettering, text, numbers, labels, markers, circles, symbols, compass, buttons or watermark. Return a single complete grassland map, no split image.
