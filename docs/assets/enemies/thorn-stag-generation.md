# 荊冠の魔鹿の画像

組み込み image_gen を使用。通常姿と攻撃前の構えを作成し、透過と解像度を維持した可逆圧縮WebPとして保存。

- 通常姿: `src/assets/images/enemies/thorn_stag/boss/idle/frame_01.webp`
- 攻撃前: `src/assets/images/enemies/thorn_stag/boss/windup/frame_01.webp`
- 原本: `exec-fee55024-a7da-4d76-aa0f-fff537ee0b2e.png`、構えの採用版 `exec-34bfa93e-2053-49fb-a728-d98f4c3db0da.png`。
- 1254×1254、アルファ0〜255。変換後の全画素一致を確認。専用画像は3-4開始時だけ読み込む。

## 通常姿のプロンプト

Use case: stylized-concept. Asset type: transparent enemy sprite for a Japanese 2D typing RPG, square 1024x1024 canvas. Primary request: one formidable forest boss, a thorn-crowned demonic stag (荊冠の魔鹿), standing idle and facing LEFT toward the player. Style: polished hand-painted chibi JRPG monster, bold dark outlines and clean cel shading, matches cute wooden forest fairies and mushroom enemies but much more intimidating. Subject: compact muscular four-legged dark charcoal deer, enormous branching antlers covered with sharp woody thorns and a few emerald leaves, purple glowing eyes, dark bark armor, small violet crystal in chest, cloven hooves. Composition: full body, all antlers and hooves within generous transparent margins, side-three-quarter view looking LEFT, readable silhouette at 150px size. Keep one single character, no environment, no ground, no shadow plate, no text, no border, no extra characters. Background: genuine transparent alpha. Do not paint a glow or aura around the silhouette; the game adds timing-dependent aura. Idle stance with all four feet planted, head raised slightly, preparing to fight.

## 攻撃前の構えのプロンプト

Use case: precise-object-edit. Asset type: transparent attack wind-up sprite for a Japanese 2D RPG. Edit the referenced thorn-crowned stag into its unmistakable attack wind-up pose. Keep the exact same individual: dark charcoal fur, bark armor, huge thorny branching antlers with emerald leaves, purple eyes and violet chest gem; same hand-painted cel-shaded bold-outline style, transparent background and square canvas. Change ONLY pose: lower its head and point its mighty antlers LEFT toward the player, hunch shoulders, bend front knees and brace rear legs as if drawing back for a powerful thorn blast. The horn crown should tilt forward clearly, with a visibly different silhouette from idle. Keep the entire body, every hoof and all antler tips inside ample transparent margins; same approximate overall character scale and ground baseline as reference. One character only, no surroundings, no text, no extra objects, no painted aura, preserve genuine transparency.

## 構図修正のプロンプト

Use case: precise-object-edit. Keep exactly the same thorn-crowned stag wind-up illustration, pose, colors, proportions, transparent background and square canvas. Fix the framing only: make the entire stag approximately 15% smaller, center it horizontally, and ensure ALL horn tips, muzzle, rear quarters and all hooves are fully visible with a generous completely transparent margin of at least 7% at left and right and top. Keep the hooves near the lower portion but not against the edge. Do not crop any part. Preserve the crouched head-lowered LEFT-facing attack preparation pose. No aura, no new objects, no text; genuine transparent alpha.

