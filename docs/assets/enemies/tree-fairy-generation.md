# 木の妖精の画像素材

組み込みの `image_gen` ツールで生成。既存のキノコの王様を画風の参照にし、木の幹・枝・葉・妖精の羽を持つ別の敵を作成した。振りかぶり画像は生成済みの待機画像を参照して編集した。

| 用途 | 保存先 |
| --- | --- |
| 待機・攻撃・被弾・撃破 | `src/assets/images/enemies/tree_fairy/boss/idle/frame_01.webp` |
| 攻撃直前の振りかぶり | `src/assets/images/enemies/tree_fairy/boss/windup/frame_01.webp` |

両方1536×1024の透過PNGを加工せず保存し、透明部分のアルファ値0を確認。溜め75％から振りかぶりへ切り替える。攻撃時は既存画像とCSSの振り下ろし・木の葉演出を組み合わせる。

## 待機画像

参照（画風のみ）: `src/assets/images/enemies/mushroom/boss/idle/frame_01.webp`。`transparent_background: true`。

Use case: stylized-concept. Create ONE transparent PNG boss enemy sprite for a Japanese fantasy typing RPG. Reference image is STYLE ONLY: same polished cute anime game creature rendering, clean dark brown outlines, soft cel shading and readable bold forms. New subject is a TREE FAIRY / forest spirit, absolutely not a mushroom: a small stout living tree creature made of warm golden-brown wood, expressive large emerald eyes in a trunk face, a small determined friendly mouth, a lush crown of green oak leaves with a few tiny golden buds, two branching wooden arms ending in twig fingers, two root-shaped feet, a small emerald crystal embedded in its chest, and two delicate translucent leaf-shaped fairy wings behind its shoulders. No human skin or human clothing, no gold crown, no mushroom cap. Magical woodland guardian, cute and formidable rather than frightening. Three-quarter front view facing LEFT toward the hero. Idle combat stance, branch arms held naturally at its sides, root feet planted. Entire character including leaves, wings, hands and feet inside frame with modest clear margins, centered landscape 3:2 canvas, compact silhouette readable at 150 pixels. Transparent alpha outside silhouette, no scene, background gradients, ground, cast shadow, outer glow, particles, words, text, interface, watermark, weapons, staff or other creatures.

元画像: `C:/Users/youia/.codex/generated_images/01a15984-234c-7a83-b057-7157135af534/exec-1f6cc6e2-d287-4b13-af54-42ed600e8c1c.png`。

## 振りかぶり画像

参照: 上記の木の妖精の待機画像。`transparent_background: true`。

Use case: identity-preserve. Edit this exact Tree Fairy boss sprite into its pre-attack wind-up keyframe. Preserve the exact tree spirit identity, golden brown bark face and trunk, large emerald eyes, green oak leaf canopy with tiny golden buds, emerald chest crystal, branch hands, root feet and translucent leaf wings. It faces LEFT. Change pose clearly: raise BOTH wooden branching arms high above and slightly behind its head toward the RIGHT, bend the elbows, lean trunk slightly BACK to the right, preparing a sweeping leaf magic attack toward the left. Determined narrowed eyes, chest crystal visible, both root feet firmly planted at same baseline. Exactly two arms and two hands, unchanged number of wings. Full body, leaf canopy, raised hands and wings wholly inside landscape 3:2 canvas with modest margins. Match idle sprite scale, foot baseline, framing, clean dark brown outlines and polished cel shaded anime game rendering. Transparent alpha outside character silhouette. No scene, floor, cast shadow, background gradient, aura, outer glow, magic particles, motion trails, weapons, staff, text, UI, watermark or other characters.

元画像: `C:/Users/youia/.codex/generated_images/01a15984-234c-7a83-b057-7157135af534/exec-f4b8e938-560b-47dc-87ac-335a0653b6d7.png`。
