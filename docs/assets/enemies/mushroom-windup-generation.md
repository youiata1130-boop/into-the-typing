# キノコの振りかぶり画像

組み込みの `image_gen` ツールで既存画像を参照して生成。1536×1024の透過PNGを加工せず保存し、透明部分のアルファ値0を確認した。

| 敵 | 保存先 |
| --- | --- |
| 通常キノコ | `src/assets/images/enemies/mushroom/level_1/windup/frame_01.webp` |
| キノコの王様 | `src/assets/images/enemies/mushroom/boss/windup/frame_01.webp` |

溜めが75％以上の待機時に表示する。被弾中・攻撃中・撃破中の画像を優先し、通常被弾からの復帰時は振りかぶり、強撃の溜めリセット後や攻撃後は待機に戻す。動きを減らす設定でも画像は切り替える。

## normal

参照: `src/assets/images/enemies/mushroom/level_1/idle/frame_01.webp`。`transparent_background: true`。

Use case: identity-preserve. Edit this exact reference sprite into ONE anticipation / wind-up animation keyframe for a Japanese side-view fantasy RPG. Preserve exactly the ordinary mushroom's red-orange ivory-spotted cap, cream furry stem body, face and tiny feet. No crown, clothing or new limbs. The enemy faces LEFT toward the hero. Strong readable pre-attack pose: lean the whole short stem body BACK toward the RIGHT, lift and tilt the broad mushroom cap up and back as if winding up its head before a forward spore blast, expose more underside gills, narrow eyes in focused determination and draw the small mouth shut gathering breath. A clear different silhouette from the upright idle pose. Two tiny feet firmly planted at the same bottom baseline, no hopping, no weapons, no humanoid arms. Preserve the same character identity, anatomy, colors, crisp brown outlines and polished cel shaded anime rendering. Preserve overall full body scale, landscape 3:2 canvas, centered framing and ground contact position; entire cap, feet and accessories inside margins. This is a clean still keyframe only. Genuinely transparent alpha background. No background, floor, cast shadow, gradient, outer glow, particles, trails, scenery, words, UI, watermark or extra creatures.

元画像: `C:/Users/youia/.codex/generated_images/01a15984-234c-7a83-b057-7157135af534/exec-ad05106d-4e1d-4727-8c15-6e0bf1b0d99e.png`

## king

参照: `src/assets/images/enemies/mushroom/boss/idle/frame_01.webp`。`transparent_background: true`。

Use case: identity-preserve. Edit this exact reference sprite into ONE anticipation / wind-up animation keyframe for a Japanese side-view fantasy RPG. Preserve exactly the Mushroom King's deep crimson ivory-spotted cap, ornate gold crown with red gem, cream furry stem face and feet, purple mantle with cream trim and gold clasp. Keep crown fully inside frame. The enemy faces LEFT toward the hero. Strong readable pre-attack pose: lean the whole short stem body BACK toward the RIGHT, lift and tilt the broad mushroom cap up and back as if winding up its head before a forward spore blast, expose more underside gills, narrow eyes in focused determination and draw the small mouth shut gathering breath. A clear different silhouette from the upright idle pose. Two tiny feet firmly planted at the same bottom baseline, no hopping, no weapons, no humanoid arms. Preserve the same character identity, anatomy, colors, crisp brown outlines and polished cel shaded anime rendering. Preserve overall full body scale, landscape 3:2 canvas, centered framing and ground contact position; entire cap, feet and accessories inside margins. This is a clean still keyframe only. Genuinely transparent alpha background. No background, floor, cast shadow, gradient, outer glow, particles, trails, scenery, words, UI, watermark or extra creatures.

元画像: `C:/Users/youia/.codex/generated_images/01a15984-234c-7a83-b057-7157135af534/exec-a791d880-b9e9-41df-8a0a-d7dedee11455.png`
