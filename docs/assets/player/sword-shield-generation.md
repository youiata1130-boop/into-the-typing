# 片手剣と盾の画像素材

組み込みの image_gen ツールを使用。主人公の3ポーズは既存の剣士画像を参照した編集、宝箱用は新規生成。透過PNGを加工せず保存した。

| 用途 | 保存先 |
| --- | --- |
| 構え | `src/assets/images/player/sword_shield/idle/frame_01.webp` |
| ガード | `src/assets/images/player/sword_shield/guard/frame_01.webp` |
| 攻撃 | `src/assets/images/player/sword_shield/attack/frame_01.webp` |
| 宝箱 | `src/assets/images/items/weapons/sword_shield.webp` |

構え画像を攻撃の予備動作にも使用する。主人公は1024×1536、宝箱用は1254×1254。透明部分のアルファ値0を確認。

## idle

参照: `src/assets/images/player/sword/idle/frame_01.webp`

`transparent_background: true`

Use case: identity-preserve. Edit this reference into a new transparent PNG sprite variant for the same side-view Japanese RPG hero. Preserve his exact face, brown spiky hair, blue gold-trimmed tunic, silver gold-rimmed shoulder armor, cream trousers, boots, polished anime rendering, full-body framing, transparent alpha, and three-quarter view facing RIGHT. Change his equipment: he holds one modest steel one-handed sword with gold crossguard and blue gem in his RIGHT hand, and a medium blue kite shield with silver face edging, gold rim and a simple gold diamond emblem strapped to his LEFT forearm. Exactly one sword, one shield, two arms and hands. Keep all of his body, shield, sword tip and feet inside frame with similar scale to reference. No scene, floor, cast shadow, glow, words or UI. Portrait 2:3 image. Pose: ready stance, feet apart, sword held diagonally upward in one hand, shield held naturally at his side but clearly visible, relaxed alert expression.

元画像: `C:/Users/youia/.codex/generated_images/01a15984-234c-7a83-b057-7157135af534/exec-0b3b3b92-a25a-4ae6-bedb-a6ed290bee92.png`

## guard

参照: `src/assets/images/player/sword/idle/frame_01.webp`

`transparent_background: true`

Use case: identity-preserve. Edit this reference into a new transparent PNG sprite variant for the same side-view Japanese RPG hero. Preserve his exact face, brown spiky hair, blue gold-trimmed tunic, silver gold-rimmed shoulder armor, cream trousers, boots, polished anime rendering, full-body framing, transparent alpha, and three-quarter view facing RIGHT. Change his equipment: he holds one modest steel one-handed sword with gold crossguard and blue gem in his RIGHT hand, and a medium blue kite shield with silver face edging, gold rim and a simple gold diamond emblem strapped to his LEFT forearm. Exactly one sword, one shield, two arms and hands. Keep all of his body, shield, sword tip and feet inside frame with similar scale to reference. No scene, floor, cast shadow, glow, words or UI. Portrait 2:3 image. Pose: defensive guard, knees slightly bent, shield raised forward toward the RIGHT in front of his chest and face, one-handed sword held safely behind and to the side. Shield protects his torso and is very prominent. Hero remains planted with feet in same place. Determined focused expression.

元画像: `C:/Users/youia/.codex/generated_images/01a15984-234c-7a83-b057-7157135af534/exec-bdb57c64-e4fa-46ad-94e7-04b0e32d7ce9.png`

## attack

参照: `src/assets/images/player/sword/idle/frame_01.webp`

`transparent_background: true`

Use case: identity-preserve. Edit this reference into a new transparent PNG sprite variant for the same side-view Japanese RPG hero. Preserve his exact face, brown spiky hair, blue gold-trimmed tunic, silver gold-rimmed shoulder armor, cream trousers, boots, polished anime rendering, full-body framing, transparent alpha, and three-quarter view facing RIGHT. Change his equipment: he holds one modest steel one-handed sword with gold crossguard and blue gem in his RIGHT hand, and a medium blue kite shield with silver face edging, gold rim and a simple gold diamond emblem strapped to his LEFT forearm. Exactly one sword, one shield, two arms and hands. Keep all of his body, shield, sword tip and feet inside frame with similar scale to reference. No scene, floor, cast shadow, glow, words or UI. Portrait 2:3 image. Pose: one-handed slashing attack toward the RIGHT, sword arm extended forward at shoulder height, shield remains visible protecting the opposite side of torso. Slight forward lean with feet planted. Clean still animation keyframe, no motion streaks.

元画像: `C:/Users/youia/.codex/generated_images/01a15984-234c-7a83-b057-7157135af534/exec-a7861e5a-5447-41eb-9b5c-d6fc620f7864.png`

## item

`transparent_background: true`

Use case: stylized-concept. Asset type: transparent PNG equipment treasure reward illustration for a Japanese fantasy RPG. A coordinated set of ONE steel one-handed sword and ONE medium blue kite shield, centered together like an inventory icon. Sword has a gold crossguard, small blue gem and brown leather grip, bright simple steel blade. Shield has a rich blue face, silver edging with gold rim, and one simple gold diamond emblem. Sword sits diagonally behind shield, hilt and blade tip clearly visible. Polished clean anime game art, crisp dark brown outlines, soft highlights, readable at 150px. Square composition, whole items within frame with modest margins. Transparent alpha background. No person, hands, ground, scenery, letters, text, glow, shadow or watermark.

元画像: `C:/Users/youia/.codex/generated_images/01a15984-234c-7a83-b057-7157135af534/exec-8b40398d-9c04-4130-bd97-6c1401ee6c93.png`
