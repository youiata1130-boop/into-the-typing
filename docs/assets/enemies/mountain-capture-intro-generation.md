# 大鳥が飛来して捕まえる一枚絵

2026-10-24、組み込み `image_gen` を使用して制作。外部の画像生成API・CLIは使用していない。

- 使用画像: `src/assets/images/events/mountain_capture/arrival.webp`
- 生成元: `C:/Users/youia/.codex/generated_images/01a16dfa-dd4d-7f80-87a7-b455309503c6/exec-144da930-cd75-4fbe-97cd-1b16160395b6.png`
- 仕様: 1536×1024、不透明。PNGからロスレスWebPへの形式変換のみ。変換前後の画素一致を確認し、切り抜き・拡大縮小・描き直しは行っていない。
- 採用確認: 主人公の茶髪・茶色の目・青と金の衣装、茶と白の大鳥、山道の背景を維持。大鳥が肩の鎧をつかみ、主人公が持ち上がる瞬間を描写。
- 用途: 4-1の最後の敵の撃破後に3秒間表示。その後に25秒の脱出入力を開始。文字や操作UIは画像に描き込んでいない。

## 参照画像

1. `src/assets/images/player/sword/idle/frame_01.webp` — 主人公の顔・体格・衣装の参照。武器を目立たせず、装備にかかわらず使える構図にする。
2. `src/assets/images/enemies/mountain_eagle/capture/frame_01.webp` — 大鳥の姿・羽色・爪の参照。
3. `src/assets/images/backgrounds/stages/mountain.webp` — 山道・時間帯・風景の参照。

## 生成プロンプト

Use case: illustration-story. Asset type: one cinematic full-color event illustration for an existing friendly Japanese fantasy typing RPG, landscape 1536x1024. Input images are references, not edit targets: image 1 defines the exact youthful hero identity, face, brown eyes, tousled brown hair, short blue tunic with gold trim, silver-and-gold shoulder armor, diagonal brown leather strap, cream trousers and large brown boots; image 2 defines the exact huge brown eagle with creamy ivory head/chest, golden hooked beak, amber eyes, layered brown-gold wings and golden talons; image 3 defines the sunny mountain trail setting. Create a NEW single dramatic illustration of the moment this giant eagle swoops down from above and catches the hero on the mountain path. The eagle has just arrived in a powerful wingbeat, broad wings sweeping diagonally through the upper half, wind stirring loose feathers and a little trail dust. Its TWO talons visibly grasp the hero by the leather shoulder straps and upper-arm armor, lifting him just clear of the ground; safe non-graphic adventure peril, no injuries. The surprised hero is large and clearly recognizable in the lower center, brown eyes wide, body tilted, knees bent and boots off the ground, looking back up at the eagle. Keep the reference hero's round youthful face and compact proportions, never age or lengthen him. Hands and arms react to the grab; no prominently visible weapon or shield so the image works with every equipped weapon. Eagle and hero are interacting as one cohesive narrative scene, not separate pasted sprites. Match the polished softly sculpted anime-inspired 3D game illustration rendering of the references, with crisp feather detail, blue and gold cloth, vivid natural light, beautiful layered blue-green peaks and mountain trail behind. Strong sense of sudden arrival and capture, diagonal composition with clear readable silhouettes. Keep the hero's entire body and the eagle's head, talons and both wing tips inside the canvas with safe margins; central action dominates, hero roughly 38 percent of image height, readable at phone size. Full opaque scenic background, absolutely no transparency, no black studio backdrop, no text, captions, speech bubbles, numbers, frames, UI, watermark, extra people or additional birds. Exactly one hero and one eagle.
