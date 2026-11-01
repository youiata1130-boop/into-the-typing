# 協力モード・岩の巨人の生成記録

2026-11-01、組み込み `image_gen` で生成。協力モードの簡易SVGを、既存の敵と同程度に描き込んだ透過イラストへ置き換えた。NPC協力・オンライン協力で共通利用する。

- 使用画像: `src/assets/images/enemies/giant/idle.webp`
- 生成元: `C:/Users/youia/.codex/generated_images/01a195b9-bcef-7870-8082-7247f2dfd4ea/exec-69a279b0-63f7-41b9-88f6-0b345242f3a2.png`
- 1536×1024、アルファ透過。PNGからロスレスWebPへ変換し、可視画素のRGBと全画素のアルファが一致することを確認。トリミング・拡大縮小・描き足しは行っていない。
- 参照1: `src/assets/images/enemies/mountain_guard/level_1/idle/frame_01.webp`。岩の質感・陰影・苔の描写。
- 参照2: `src/assets/images/enemies/mountain_raider/level_1/idle/frame_01.webp`。線画・立体感・左向きの戦闘構図。

## 生成プロンプト

Use case: stylized-concept. Asset type: final transparent boss enemy sprite for the existing Japanese fantasy typing RPG Into the Typing.

Input images: Image 1 is a STYLE AND STONE MATERIAL reference, an existing stone guardian from this game. Image 2 is an additional STYLE reference for the game's polished linework, detailed painterly shading, dimensional anatomy, and left-facing combat presentation. Do not reproduce either existing character, shield, axe, or their dark background/glow.

Primary request: Create one imposing unarmed ROCK GIANT boss at the same finished illustration quality as these game enemies. Full body of a massive broad-shouldered ancient stone giant, craggy layered granite anatomy, heavy torso, thick sturdy legs, exceptionally large clenched stone fists, small angular head with stern glowing amber eyes. Face, chest and feet clearly angled toward the LEFT, three-quarter left-facing battle stance, looking at an unseen opponent off the left edge. Slightly leaning forward, knees flexed, both fists low and separated from the torso with a readable silhouette. Two arms, two hands, two legs only. No shield or held object.

Style/medium: richly detailed hand-painted anime fantasy RPG monster illustration, crisp expressive linework, convincing sculpted volume, natural fractured rock textures, bright edge highlights and nuanced cool shadows, matching the existing enemy references. Cool slate-gray granite, warm pale stone highlights, small restrained patches of green moss in shoulder and joint crevices, amber eyes. Strong finished game art, not a simplistic flat polygon drawing, not a low-poly 3D model, not photorealism.

Composition: one centered full-body character on a landscape 3:2 canvas. Very broad powerful silhouette, about as wide as tall; fill nearly the whole canvas height with approximately 4 percent transparent margin above the head and below the soles, and enough transparent space at both sides so all fists and feet remain fully inside. Both soles at the same baseline. Bright natural daylight from upper left; all surface shadows remain on the character.

Background: genuinely transparent alpha, clean isolated sprite cutout. No scenery, no floor, no ground patch, no black or colored backdrop, no vignette, no ambient halo or detached cast shadow, no checkerboard drawn into the picture. No other characters, no UI, no text, no numbers, no health bar, no border, no watermark.
