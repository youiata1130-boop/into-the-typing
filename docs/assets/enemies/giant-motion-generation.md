# 巨人の攻撃モーション・生成記録

2026-11-01、組み込み `image_gen` で既存の巨人のポーズ違いを2枚生成。元の巨人の岩肌・苔・画風・左向きを維持し、単体攻撃と全体攻撃の予告を姿勢で区別する。

参照・編集元: `C:/Users/youia/.codex/generated_images/01a195b9-bcef-7870-8082-7247f2dfd4ea/exec-69a279b0-63f7-41b9-88f6-0b345242f3a2.png`

2枚とも1536×1024、透過PNGからロスレスWebPへ変換。可視RGBと全画素のアルファの一致を検証。トリミング・拡大縮小・描き足しは行っていない。ゲームは予告中に各構えを表示し、攻撃が確定すると通常画像へ戻して踏み込み／叩きつけのCSSアニメーションを再生する。

## 単体攻撃・片腕を引く構え

- 使用画像: `src/assets/images/enemies/giant/windup-single.webp`
- 生成元: `C:/Users/youia/.codex/generated_images/01a195b9-bcef-7870-8082-7247f2dfd4ea/exec-51fe0d65-c866-4453-b37f-d3f662d3d6bc.png`

### 生成プロンプト

Use case: identity-preserve. Edit the provided ROCK GIANT sprite into the SINGLE-TARGET PUNCH WINDUP frame of this exact same RPG boss. Preserve its recognizable granite plate shapes, moss patches, small stern amber-eyed head, gigantic torso, thick arms and fists, legs and feet, polished detailed hand-painted Japanese fantasy game style, lighting from upper left, and three-quarter view facing LEFT. Same landscape 1536x1024 canvas, approximately the same body scale and center, both feet at the original bottom baseline. Change only the battle pose: clearly draw the foreground arm BACK toward the RIGHT of the picture, with elbow bent and its huge clenched fist beside the rear shoulder, ready to punch LEFT at one opponent. The other arm remains lower in front as a guard. Turn the chest slightly into the windup and brace the legs, while the head and hostile gaze continue facing LEFT. Strong asymmetric boxing-like anticipation silhouette; NOT both arms raised, NOT the idle pose. The complete giant including both fists and both feet must remain inside the canvas with a small safety margin. Genuine transparent alpha background. No backdrop, halo, floor, shadow plate, scene, weapon, extra limbs, energy effects, text, interface, labels or watermark.

## 全体攻撃・両腕を振り上げる構え

- 使用画像: `src/assets/images/enemies/giant/windup-all.webp`
- 生成元: `C:/Users/youia/.codex/generated_images/01a195b9-bcef-7870-8082-7247f2dfd4ea/exec-0f0e04c8-3087-432c-a7c0-0ff029ba2036.png`

### 生成プロンプト

Use case: identity-preserve. Edit the provided ROCK GIANT sprite into the ALL-TARGET GROUND-SLAM WINDUP frame of this exact same RPG boss. Preserve its recognizable granite plate shapes, moss patches, small stern amber-eyed head, gigantic torso, thick arms and fists, legs and feet, polished detailed hand-painted Japanese fantasy game style, lighting from upper left, and three-quarter view facing LEFT. Same landscape 1536x1024 canvas, approximately the same body scale and center, both feet at the original bottom baseline. Change only the battle pose: lift BOTH massive clenched stone fists HIGH above the head, both elbows bent and clearly visible on either side, preparing a powerful two-handed downward ground smash that will hit every opponent. Bend knees into a braced wide stance and lower the head/chest enough to fit both raised fists comfortably inside this same canvas. Keep the giant enormous and broad, not shrunk; the head and gaze continue facing LEFT. A strong overhead double-fist silhouette visibly different from idle or a single-arm punch. Exactly two arms and two fists, no crossed or fused arms. The complete giant including the raised fists and both feet must remain in frame with small safe margins. Genuine transparent alpha background. No backdrop, halo, floor, shadow plate, scene, weapon, extra limbs, energy effects, text, interface, labels or watermark.
