# 森エリアとキノコの素材

組み込みImageGenで新規生成し、原本を加工せずコピー。キノコは透過PNG、背景と地図は不透明PNG。いずれも1536×1024。

| 素材 | 使用先 | 原本ファイル |
| --- | --- | --- |
| 森のキノコ | `src/assets/images/enemies/mushroom/level_1/idle/frame_01.png` | `exec-73bc9dc4-9f1b-4266-ad56-7124efd84a55.png` |
| 森の戦闘背景 | `src/assets/images/backgrounds/stages/forest.png` | `exec-77b16985-3e45-47c0-a1cb-9c0541366472.png` |
| 森の地図 | `src/assets/images/backgrounds/stage_map/forest.png` | `exec-c4dc0e3b-f66a-4d36-9c9e-6356cd2ffb64.png` |

原本フォルダ: `C:/Users/youia/.codex/generated_images/01a15984-234c-7a83-b057-7157135af534/`。

キノコの待機・攻撃・被弾・撃破は同じ画像とCSS演出を使用する。溜めゲージ、秒数、発光、胞子はコードで表示し、画像には含めない。

## 生成プロンプト

### mushroom

Use case: stylized-concept. Asset type: transparent PNG enemy sprite for a side-view Japanese typing RPG. Create one cute, mischievous forest mushroom monster: a wide red-orange cap with a few large cream spots, stout ivory stem body, expressive determined dark eyes and a small puckered mouth, tiny rounded feet planted firmly on the ground. Facing slightly LEFT toward the player, three-quarter front view. This enemy stands still and builds up spores before attacking; show its calm resting pose, no attack effects. Match polished anime game enemies: crisp dark brown outlines, clean smooth shapes and soft glossy cel shading. Full character centered in landscape 3:2 composition, fills the image vertically with modest margins, whole cap and feet visible. Genuine transparent alpha outside the character. No scenery, floor, glow, shadow, extra mushrooms, text, UI, watermark, checkerboard or photorealism.

### forest_background

Use case: stylized-concept. Asset type: landscape 3:2 background illustration for a side-view Japanese fantasy typing RPG. A welcoming deep green forest clearing with tall trees and layered foliage in the background, soft sunbeams filtering through leaves, mossy roots and small ferns along far edges. Broad flat uncluttered earthy green clearing across the lower half where player and enemy sprites can stand on the same horizontal plane. Eye-level side-on view, distant trunks receding gently into cool teal woodland; warm dappled daylight and readable medium-light foreground. Polished hand-painted anime game illustration, soft cel-shaded forms matching a bright fantasy grassland game. Keep lower middle quiet with no large foreground obstructions. No creatures, people, UI, text, labels, numbers, buildings, watermark. Full bleed opaque background.

### forest_map

Use case: stylized-concept. Asset type: forest region world map background for a Japanese fantasy RPG, landscape 3:2. Top-down hand-painted illustration on aged warm parchment with softly worn edges: dense clusters of rounded ink-drawn trees, muted moss green watercolor canopy, winding pale forest trail starting near the bottom center (48 percent across, 75 percent down), leading upward through clearings in the central half toward a deeper northern forest. A few roots, ferns and gentle contour details at the edges. Quiet central path suitable for overlaying game quest markers; keep central half usable when cropped for portrait phones. Warm antique illustrated map style, delicate dark brown linework and paper texture. NO game interface, text, letters, numbers, labels, markers, circles, badges, compass, banners, creatures, buildings, borders or watermark. One complete forest map, opaque background.
