# ステージ３「潮風の浜辺」の画像

- 作成日: 2026-09-16
- 生成方式: 組み込み ImageGen。画像参照なしでカニと背景をそれぞれ新規生成。
- カニ原本: C:/Users/youia/.codex/generated_images/01a09f73-1ec4-7702-bddf-65dac5fca912/exec-6f6a2f48-a89b-4393-88b5-96ab4adb08a5.png
- カニ保存先: src/assets/images/enemies/crab/level_1/idle/frame_01.png
- カニ: 1536 × 1024 px、RGBA、透過背景。滑らかな赤橙色の甲羅、大きなハサミ、少し鋭い目のデフォルメ。
- 背景原本: C:/Users/youia/.codex/generated_images/01a09f73-1ec4-7702-bddf-65dac5fca912/exec-7175f937-759e-4740-a9b2-0048e3d2f853.png
- 背景保存先: src/assets/images/backgrounds/stages/crab_shore.png
- 背景: 1536 × 1024 px。青い海と空、キャラクターを配置できる広い砂浜。縦画面では中央を切り抜いて表示。
- いずれも生成原本から加工せずコピー。カニの透明背景は白背景に重ねて目視確認。
- 表現: カニの待機・攻撃・被弾・撃破は元画像に既存のCSSアニメーションを適用。「動きを減らす」設定を尊重。
- 登場: ステージ３にカニ３体。各HP5、攻撃10～15、25EXP。成功時だけ合計75EXPとクリア記録を保存。
- ステージ２クリアで解放。旧セーブは装備チュートリアル完了と保存済み40EXP以上からステージ２クリアを移行する。新セーブは明示的なclearedStagesを使い、レベルだけで解放しない。
- 内部ID: 既存の未公開３番目ノード `sky_castle` を引き継ぐ。表示名は「潮風の浜辺」。

## カニの最終プロンプト

Use case: stylized-concept. Asset type: transparent PNG enemy sprite for a side-view Japanese typing RPG. Create exactly ONE small enemy crab, the new opponent on stage 3. The established game's enemies are cute, slightly mischievous anime illustrations with clean dark outlines, smooth surfaces and softly polished cel shading. Design a compact, clearly readable, slightly deformed crab with a smooth rounded red-orange shell, warm coral highlights and deep crimson shadow edges, two substantial raised pincers, four short walking legs on each side, and two expressive small eyes. The eyes should be a little sharp and determined but still cute, with no frightening realism. Show a three-quarter front view facing slightly LEFT toward a player positioned on the left side of the screen. Both claws and the whole set of legs should be visible and arranged in a clean readable silhouette; the front left pincer can be a little more forward. Low, broad body suitable for moving sideways across the ground, with uncluttered large shapes legible at about 120 pixels wide. Smooth untextured armor: no scales, shell bumps, barnacles, spikes, holes, realistic pores, gore, or exposed anatomy. No accessories, armor equipment, held objects, extra creatures, text, watermark or scenery. Exactly one complete crab with all claw tips and feet comfortably inside the canvas, modest transparent margin. Genuine transparent alpha outside the character: no water, beach, floor, cast shadow, background, or baked-in checkerboard. Landscape composition, centered full body, polished production game illustration, preserve transparent alpha in the final PNG.

## 背景の最終プロンプト

Use case: stylized-concept. Create a polished 2D hand-painted anime RPG battle background for a bright coastal stage named 潮風の浜辺 (do not put these words in the image). Landscape composition, approximately 3:2 aspect ratio. A peaceful sunlit sandy beach with a turquoise ocean, pale gentle surf across the distant middle ground, blue sky with soft white clouds, a low green rocky headland far to one side. The bottom 45 percent of the composition must be a broad EMPTY unobstructed warm sandy battle floor, gently textured, continuous from left to right. The middle 50 percent of the width must remain open and readable because the same image will crop to portrait on mobile. Horizon near the upper third; colorful softly shaded anime illustration, clean inviting forms, consistent with a cute fantasy typing RPG. A few small smooth stones or tufts of beach grass only at far outer edges. No characters, no creatures or crabs, no buildings, boats, weapons, large objects, footprints, text, interface, logos, borders, vignette, or watermark. Opaque full-bleed background, no transparent areas.
