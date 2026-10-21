# ステージ2-1「草原の入口」

- 内部ID: `grassland_path`。ステージ1-4「荒波の入り江」のクリアで解放し、結果画面から続けて開始できる。
- 既存のステージ1-4クリア済みセーブでも解放。経験値や武器だけでは解放しない。
- 通常の蛇3体（HP14、攻撃14〜20、各30EXP）→ 蛇の王様1体（HP32、攻撃18〜24、70EXP）。
- クリア時に合計160EXP。失敗・中断時は経験値とクリア記録を保存しない。
- 武器報酬はない。クリア後にステージ2-2「花咲く草原」を解放する。既存の鉄の剣を使う少数戦で、詳細は `flower-meadow.md`。
- 青空と草原の専用背景。王様には王冠と紫のマントを付け、通常の蛇より大きく表示。
- 待機・攻撃・被弾・撃破は既存のCSS演出を使用。スマホのボス用サイズ調整に対応。
- 海辺のステージ1-1〜1-4に続き、草原のマップは「2-1」から始まる。

## 確認

- 全188テスト成功。背景URL調整後も、ステージと読み込みの11テスト成功。
- 独立したEdgeで1280×900、390×844、320×500の表示を確認。マップ選択から開始でき、蛇・王様・草原背景の読み込みエラーなし。
- 蛇と王様は1536×1024の透過PNG、草原背景は同サイズの不透明PNG。
- スマートフォン実機の確認は未実施。

## 画像

2026-10-09、組み込み ImageGen で新規生成。原本を加工せずコピー。

- 蛇: `src/assets/images/enemies/snake/level_1/idle/frame_01.png`
- 蛇の王様: `src/assets/images/enemies/snake/boss/idle/frame_01.png`
- 草原: `src/assets/images/backgrounds/stages/grassland.png`

## 最終プロンプト

### 蛇

Use case: stylized-concept. Asset type: transparent PNG enemy sprite for a side-view Japanese typing RPG. Create exactly ONE cute but determined green grassland snake. Coiled compact rounded body with a raised head and short S-shaped neck, smooth leaf-green back, pale cream belly, large expressive amber eyes, tiny red forked tongue. Entire snake including tail in frame. Three-quarter front view facing LEFT toward the player, who stands on the left. Clean dark brown outlines, glossy softly cel-shaded anime game illustration, rounded large shapes, readable at 140 pixels. Lively and slightly mischievous, child-friendly. Landscape 3:2 composition, centered full body with modest transparent margin. Snake anatomy, no arms or legs. No crown, clothes, weapons, extra characters, ground, scenery, cast shadow, text, watermark, checkerboard, gore or photorealistic scales. Genuinely transparent alpha background. Polished production sprite.

### 蛇の王様

Use case: stylized-concept. Asset type: transparent PNG boss enemy sprite for a side-view Japanese typing RPG. Create exactly ONE Snake King, a proud cute royal serpent boss. Substantial wide coiled emerald-green snake body with a raised head and broad elegantly flared cobra hood, smooth green surface, pale golden cream belly, expressive confident amber eyes. Prominent gold five-point crown with one ruby jewel firmly on the head. Short rich purple royal mantle with simple cream trim behind the hood, leaving coils and tail visible. Snake anatomy, no human torso, arms or legs. Three-quarter front view facing LEFT toward the hero. Clean dark brown outlines, glossy softly cel-shaded anime game art, large simple shapes, charming yet formidable, readable at 180 pixels. Full character including crown and tail comfortably within frame, centered landscape 3:2 composition. No throne, scepter, ground, scenery, other characters, cast shadow, lettering, logos, watermark, gore, realistic scales or checkerboard. Genuinely transparent alpha background.

### 草原

Use case: stylized-concept. Asset type: landscape 3:2 background illustration for a side-view Japanese fantasy typing RPG battle. A bright peaceful open grassland under a vivid blue sky with soft white summer clouds. Gentle distant green hills, a few small leafy trees far away at the horizon, sunlit green meadow and a broad unobstructed short-grass clearing across the foreground. Horizon at 40 percent from the top; foreground occupies lower 60 percent and is relatively flat, quiet and low contrast so game characters and text overlay remain readable. Hand-painted polished anime environment, clear cheerful colors, soft warm daylight from upper left, subtle blades of grass and tiny flowers mainly at side edges. Eye-level slightly elevated view suitable for side-on character sprites. No people, animals, snakes, buildings, ocean, UI, paths converging at the center, writing, symbols, logos or watermark. Full bleed opaque background.
