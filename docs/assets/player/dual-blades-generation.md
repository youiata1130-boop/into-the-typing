# 双剣の画像素材

組み込みの image_gen ツールで生成。透過PNGをそのままゲーム内に保存した。

| 用途 | 保存先 |
| --- | --- |
| 宝箱 | `src/assets/images/items/weapons/dual_blades.png` |
| 主人公・構え | `src/assets/images/player/dual_blades/idle/frame_01.png` |
| 主人公・攻撃 | `src/assets/images/player/dual_blades/attack/frame_01.png` |

構えを予備動作にも使用する。元画像は `C:/Users/youia/.codex/generated_images/01a1211b-9aee-7a10-b048-aef697e5cc45/` 内の `exec-6c8d5ba8-9d44-4e06-9226-73191739220c.png`（武器）、`exec-7bd1ab07-4076-4812-845d-e3ed58ac5c70.png`（構え）、`exec-bc402394-ac5f-448d-9587-58e0bd282135.png`（攻撃）。

## 武器単体のプロンプト

Use case: stylized-concept. Asset type: transparent inventory and treasure illustration for a Japanese fantasy typing RPG. Exactly two matching lightweight short swords, crossed in an X, silver double edged blades, small gold curved crossguards, royal blue wrapped grips and small blue gems, brown pommel detail. Polished anime fantasy game art with crisp clean edges and subtle metal highlights. The pair is the whole subject, centered square canvas with modest padding around all tips. Real transparent alpha background. No character, hands, scene, floor, cast shadow, aura, glow outside the blades, text, border or watermark. Both swords are complete and equally sized, readable at 80 pixels.

## 構えのプロンプト

参照: `src/assets/images/player/sword/idle/frame_01.png`

Use case: identity-preserve. Asset type: transparent player idle sprite for a side-view Japanese fantasy typing RPG. Edit the reference hero to equip DUAL SWORDS: exactly two matching lightweight silver short swords with small gold guards, blue grips and blue gems, one held separately in each hand. Preserve the same young male identity, brown hair, face, blue gold-trimmed tunic, silver shoulder armor, cream trousers, brown boots, polished anime rendering and three-quarter facing RIGHT. Agile guarded stance, knees slightly bent, right-hand blade points diagonally up-right and left-hand blade angled forward near waist, both blades clearly visible and separate from his body. Match reference full-body scale and foot baseline on portrait 2:3 canvas, both feet and sword tips entirely inside image with small margins. Replace original single long sword and two-handed grip. Genuinely transparent background; no scene, ground, shadow, outer glow, gradients outside the silhouette, text, UI, trails or extra limbs.

## 攻撃のプロンプト

参照1: 双剣の構え。参照2: `src/assets/images/player/sword/attack/frame_02.png`

Use case: identity-preserve. Asset type: transparent player dual-sword attack sprite for a side-view Japanese fantasy typing RPG. Image 1 is the edit target and exact dual-sword hero identity/costume/weapon reference. Image 2 is supporting stance and game framing reference. Change the pose of image 1 to a fast forward double slash facing RIGHT: one short sword sweeps forward down-right at waist height and the other raised across his chest about to follow through. Exactly one silver short sword with gold guard and blue gem in each hand, both visible, same blade lengths and design as image 1. Keep exact hero face, brown hair, blue-and-gold tunic, silver armor, cream trousers and boots, polished anime rendering, full-body portrait 2:3 framing. Preserve same image scale and both boots' baseline so idle and attack align in game. Both feet and sword tips fully in canvas. Real transparent alpha background. No scene, ground, shadow, outer glow, background gradients, text, UI, motion arcs, extra weapons or extra limbs.
