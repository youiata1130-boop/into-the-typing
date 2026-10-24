# 大剣の主人公デザイン統一

2026-10-24、組み込みの `image_gen` で5ポーズを編集。鉄の剣・片手剣と同じ茶色い目、顔立ち、頭身、短い青の衣装、鎧、ブーツにそろえた。大剣の形状と既存のポーズの役割は維持。

全画像は `transparent_background: true`、1024×1536のRGBA。生成PNGからWebPへロスレス形式変換し、復号後のRGBA全画素一致と四隅のアルファ値0を確認。切り抜き、拡縮、色調変更などの後加工は行っていない。

画像は `src/assets/images/player/greatsword/` に配置。元PNGは `C:/Users/youia/.codex/generated_images/01a16dfa-dd4d-7f80-87a7-b455309503c6/` に保存。

| 用途 | 配置先 | 元PNG |
| --- | --- | --- |
| 装備プレビュー・待機・溜め第1段階 | `charge/frame_01.webp` | `exec-fa60547b-d9a9-4f53-9c57-a609555ee758.png` |
| 溜め第2段階 | `idle/frame_01.webp` | `exec-367c46df-0886-48b2-a6ed-689d707b0ecd.png` |
| 溜め第3段階・攻撃予備動作 | `attack/frame_01.webp` | `exec-89cb7ba9-0190-4773-b900-ff84625defbc.png` |
| 振り下ろし | `attack/frame_02.webp` | `exec-71561396-2f16-4e67-abe3-2dcd99605abc.png` |
| ガード | `guard/frame_01.webp` | `exec-8b54da1d-2c8c-4150-bbe2-410c3214a6f0.png` |

大剣の全フレームに `greatsword-hero-v5` のキャッシュ識別子を付け、旧デザインが混在しないようにした。溜めの段階、ガード条件、ダメージ、表示寸法は変更していない。

## 構えの編集プロンプト

参照1: `src/assets/images/player/sword/idle/frame_01.webp`（主人公の基準）。
参照2: 更新前の `src/assets/images/player/greatsword/charge/frame_01.webp`（武器のみの基準）。

```text
Use case: identity-preserve.
Asset type: replacement full-body transparent game sprite, Japanese side-view fantasy typing RPG, greatsword equipped / low ready stance.
Input images: Image 1 is the authoritative hero identity, proportions, clothing, rendering style, framing and pose reference (iron sword hero). Image 2 is ONLY a reference for the huge greatsword weapon design; do NOT copy its adult face, blue eyes, body proportions, long coat or armor.
Primary request: Edit Image 1 so the exact same friendly stylized boy hero now wields the massive greatsword from Image 2 in both hands. Keep Image 1's exact large brown eyes, round youthful face, tousled brown hair, large head and compact body proportions, short royal-blue gold-trimmed tunic with gold chest emblem and pointed front panel, simple silver gold-edged shoulder plates, chainmail upper arms, silver forearm armor, single brown diagonal chest strap, brown belt and gloves, cream trousers and oversized rounded brown leather boots. No knee armor, no metal toe caps, no long coat tails. Match Image 1's polished soft sculpted anime 3D game rendering and friendly expression precisely.
Weapon: One oversized wide heavy silver-edged blade with dark steel center, restrained gold line and diamond motif, gold crossguard and blue diamond gem, blue two-hand grip, from Image 2.
Pose: Feet planted apart and knees gently bent, three-quarter facing RIGHT, both hands holding hilt near waist, enormous blade rising diagonally toward upper right. Preserve Image 1's character scale and feet baseline; sword tip, hair and boots fully inside canvas with a little margin. Exactly one hero, one sword, two hands and arms, two legs.
Composition: portrait 2:3, 1024x1536, centered full body, matching Image 1's framing. True transparent alpha background. No scene, background gradient, colored halo, floor, cast shadow, glow, effects, text, watermark, shield or extra weapon.
```

## 残り4ポーズの共通プロンプト

参照: 上で生成した構えのPNG。以下の共通文に各ポーズ文をそのまま連結して、1ポーズずつ生成した。

```text
Use case: identity-preserve.
Asset type: one full-body transparent animation sprite for the same Japanese side-view RPG hero.
Input image: authoritative reference for exact hero identity, equipment, body proportions, outfit, weapon, render style, framing and scale.
Primary request: Edit this exact reference into the pose below. Keep the same large BROWN eyes, round youthful face, tousled brown hair, large head and compact body, short blue gold-trimmed tunic with gold chest emblem and pointed front panel, silver shoulder and forearm plates with simple gold edges, chainmail upper arms, single brown diagonal chest strap, brown belt and gloves, cream trousers, oversized round brown boots and soft polished sculpted anime 3D style. Preserve the exact enormous greatsword design: broad silver blade edges, dark center with gold line and diamond motifs, gold crossguard with blue diamond gem, blue two-hand grip. Do not age or lengthen the character, change eye color, add knee armor, metal toe caps or long coat tails.
Composition: portrait 2:3, 1024x1536. Full character, both boots, both hands and complete sword tip inside canvas with safe padding. Maintain consistent body size and feet baseline near bottom, three-quarter facing RIGHT. Exactly one hero, one sword, two hands and arms, two legs; both hands firmly on the SAME grip. True transparent alpha background; no gradient, halo, scene, floor, shadow field, effects, motion trails, particles, text, watermark, shield or extra weapon.
Pose:
```

### `idle/frame_01.webp`

```text
Middle charge stage: feet planted wide, knees bent, torso slightly twisted and both hands lifting the greatsword beside and above his left shoulder (on viewer's left), with the broad blade rising diagonally across the upper canvas toward upper right. The blade clears his head. Readable preparation pose between the reference low waist-level stance and a fully overhead wind-up. Focused determined expression, exact same friendly youthful facial identity.
```

### `attack/frame_01.webp`

```text
Maximum charge / attack WIND-UP: both arms raised overhead and toward viewer's left, both hands holding the same greatsword hilt high above and behind his head. The huge blade extends diagonally from the raised hilt toward the upper right, wholly above shoulder level, ready for a heavy downward slash. Wide grounded stance, knees bent, torso rotated slightly, eyes looking RIGHT with determined youthful expression. Keep full sword visible, leave margin at top. Clearly different from waist-level ready stance.
```

### `attack/frame_02.webp`

```text
Attack FOLLOW-THROUGH after a powerful downward slash toward the RIGHT: knees deeply bent, grounded wide feet, torso leaning slightly forward, both hands hold hilt low in front of waist, massive blade extends diagonally downward toward LOWER RIGHT. Sword tip near but above bottom edge and safely inside canvas. Intent and determined brown eyes look right. No swoosh or action effect; one crisp still keyframe. Full youthful hero, both boots and sword visible.
```

### `guard/frame_01.webp`

```text
DEFENSIVE GUARD: knees bent in a wide planted stance; both hands grip hilt firmly near chest and brace the huge broad blade upright diagonally IN FRONT of chest, with the sword tip rising toward upper right and flat face of blade presented toward incoming attacks on the RIGHT. Blade acts as a shield while face remains visible. Torso tucked defensively behind the blade. Alert focused youthful expression. No actual shield, no overhead attack swing. Distinct from relaxed waist-level ready stance.
```
