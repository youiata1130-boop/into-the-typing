# 山道と鳥の画像・生成記録

2026-10-24、組み込み `image_gen` で生成。外部の画像生成サービス・API・SDKは不使用。
全画像1536×1024。背景2枚は不透明、鳥3枚は透過PNG。PNGからロスレスWebPへ変換し、画素の一致を確認。トリミング・描き足し・拡大縮小は行っていない。

元画像フォルダ: `C:/Users/youia/.codex/generated_images/01a16dfa-dd4d-7f80-87a7-b455309503c6/`

青い鳥は2コマを220ms間隔で切り替える。大鳥と装備中の主人公はCSSで合成する。

## 戦闘背景

- 使用画像: `src/assets/images/backgrounds/stages/mountain.webp`
- 生成元: `exec-f157c656-b669-4c14-99a2-6600a8cc4a81.png`

### 生成プロンプト

Use case: stylized-concept. Asset type: background art for a friendly Japanese fantasy side-view typing RPG. Paint a beautiful sunny mountain trail, clean polished anime game illustration, softly dimensional painterly shapes, vivid but natural colors. Wide landscape 3:2 composition 1536x1024. The bottom 40 percent is a broad relatively level tan rocky mountain trail usable as a side-view combat floor, running left-to-right completely across frame, with sparse pebbles and grass tufts, no large obstacles. Beyond it rise layered blue-green mountains, pale granite cliffs and a forested valley, distant peaks, open blue sky and soft white clouds. A winding trail is visible climbing a mountainside in the middle distance. Leave the lower left and lower right combat areas clear and well lit. Warm adventure mood. No people, animals, birds, enemies, text, signs, labels, interface, frames or watermarks. Full opaque scenic background.

## 山道の地図

- 使用画像: `src/assets/images/backgrounds/stage_map/mountain.webp`
- 生成元: `exec-c4d22d2f-c1fe-4fc2-a8ae-d8a353663ac4.png`

### 生成プロンプト

Use case: stylized-concept. Asset type: illustrated regional world map for a Japanese fantasy RPG, matching a hand-painted parchment adventure map. Landscape 3:2 1536x1024. Bird's-eye top-down isometric map of a mountain region: several rounded granite mountain peaks and green slopes, winding tan mountain trail starting in lower left around 26 percent from left and 70 percent from top, climbing through small pine groves and a stone bridge over a narrow ravine toward the upper right. Trail should form a readable continuous route with 4 natural clearings, but NO drawn circles, map nodes or symbols. Warm cream parchment atmosphere, softly shaded green gray and ochre colors, restrained decorative topographic texture, detailed polished storybook game art. Full-bleed map, no desk or props, no text, numerals, letters, title, compass labels, UI or border. No characters or animals.

## 青い鳥・羽ばたき上

- 使用画像: `src/assets/images/enemies/mountain_bird/level_1/idle/frame_01.webp`
- 生成元: `exec-0dcae9bc-c22e-4f5b-95dc-d0798d432c65.png`

### 生成プロンプト

Use case: stylized-concept. Asset type: transparent enemy sprite for a friendly Japanese fantasy typing RPG. One small mountain bird monster in flight facing LEFT, three-quarter side view. Round compact body, sapphire and teal blue feathered wings, cream fluffy breast, short yellow beak, two small orange feet tucked underneath, expressive determined dark eyes, small blue feather crest and fan tail. Wings raised high in a readable upstroke, one visible wing larger in foreground, both wing tips fully visible. Cute but ready to attack, polished anime-inspired 3D sculpted game illustration with soft detailed feather forms, crisp clean silhouette and bright studio character lighting. Landscape 3:2 1536x1024 composition, whole bird centered with generous transparent padding; character occupies roughly 80 percent of canvas width and 75 percent height. True transparent alpha background. No floor, shadow plate, scenery, halo, glow, effects, lines, text, UI, watermark, accessories, extra wings, extra birds or humans.

## 青い鳥・羽ばたき下

- 使用画像: `src/assets/images/enemies/mountain_bird/level_1/idle/frame_02.webp`
- 生成元: `exec-961e2673-c43e-4132-af91-14cb2b76f1ad.png`
- 参照画像: 青い鳥・羽ばたき上の生成元PNG。姿・大きさを維持して羽の姿勢のみ変更。

### 生成プロンプト

Use case: identity-preserve. Edit the reference into the second flight frame of the exact same blue mountain bird game sprite. Preserve the exact round blue/teal bird, cream breast, yellow short beak, expressive eye, feather crest, tiny orange feet, tail, polished anime 3D rendering, three-quarter LEFT facing angle, centered body position and body size. Change only the wing pose to a DOWNSTROKE: both wings extended outward and downward below shoulder level. Match the same 1536x1024 landscape 3:2 transparent canvas, body/head/feet in the same location for smooth animation swapping. Full wing tips and tail inside canvas with margins. No background, floor, shadow plate, halo, effects, text or extra animals. True transparent alpha.

## 捕獲用の大鳥

- 使用画像: `src/assets/images/enemies/mountain_eagle/capture/frame_01.webp`
- 生成元: `exec-b0e9d3a0-1c1f-498e-a1d6-171895e6bae2.png`

### 生成プロンプト

Use case: stylized-concept. Asset type: transparent giant bird enemy sprite for a friendly Japanese fantasy typing RPG capture event. One enormous mountain eagle hovering, three-quarter view facing LEFT, broad wings spread wide and slightly raised in a powerful upstroke. Rich warm brown feathers with gold-brown edges, creamy ivory head and breast, alert amber eyes and large golden hooked beak, long sturdy golden legs extended DOWN, two large talons curved inward ready to clutch something BELOW its body. The talons must be clearly separated and visible below the chest, with open empty space underneath for a separately composited small player character. No prey, person or object already in talons. Powerful majestic eagle, mildly intimidating, family-friendly polished anime-inspired 3D game illustration matching a colorful RPG. Landscape 3:2 1536x1024, full body, both wings, every feather tip, legs and claws entirely in frame, safe transparent margins. Real transparent alpha background, crisp clean cutout. No background, ground, cast shadow, glow, effects, text, UI, watermark, clothing or weapon. Exactly one bird, two wings, two legs.
