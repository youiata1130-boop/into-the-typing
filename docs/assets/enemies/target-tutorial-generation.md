# 敵選択の導入用素材

2026-11-01、組み込み `image_gen` で生成。CLIは使用していない。

- 左・岩盾の番人: `src/assets/images/enemies/mountain_guard/level_1/idle/frame_01.webp`
- 右・大斧の襲撃者: `src/assets/images/enemies/mountain_raider/level_1/idle/frame_01.webp`
- どちらも1024×1536、透過背景。生成PNGからロスレスWebPへ形式変換し、デコード後の全画素一致を確認。画素の編集・切り抜き・反転・拡大縮小なし。
- 生成元ディレクトリ: `C:/Users/youia/.codex/generated_images/01a195b9-bcef-7870-8082-7247f2dfd4ea`
- 番人: `exec-db212641-326d-4452-874b-fded243ca8a8.png`
- 襲撃者: `exec-8619faca-3d21-4b69-b145-f90df5db5dbf.png`
- すべての戦闘状態で各1枚を使用。移動と被弾演出はゲーム側で制御する。

## 最終プロンプト：岩盾の番人

Use case: stylized-concept. Asset type: transparent game enemy sprite. ONE complete isolated mountain rock guardian enemy sprite for a Japanese fantasy typing RPG. A very bulky, squat, round moss-covered stone golem with thick layered rock armor, huge broad shoulders, sturdy short legs, a very large thick stone tower shield held in front toward SCREEN LEFT, and a small blunt stone fist. Its silhouette should immediately suggest HIGH HEALTH and endurance rather than high attack. Slate blue-gray stone, warm amber eyes, green moss accents. Clearly faces SCREEN LEFT in a three-quarter side battle stance toward a hero standing off canvas on the left. Full body, both feet and the entire shield fully visible. Polished colorful anime RPG illustration, clean dark contour lines, soft cel shading, friendly stylized proportions, consistent with a cute green plant monster game. No long weapon, no spikes, no other creature. Portrait 1024x1536 canvas. Center the silhouette, with at least 90 pixels of clear transparent padding around every extremity, ground baseline at 1400 pixels. Genuine transparent alpha background. No scenery, no ground shadow, no glow, no fog, no UI, no letters, no numbers, no border, no watermark.

## 最終プロンプト：大斧の襲撃者

Use case: stylized-concept. Asset type: transparent game enemy sprite. ONE complete isolated mountain raider enemy sprite for a Japanese fantasy typing RPG. A lean athletic red-orange goblin raider with simple dark brown leather armor, little protective plating, sharp focused amber eyes and a HUGE double-bladed steel battle axe with a long wooden handle held ready toward SCREEN LEFT. The oversized axe and aggressive stance should immediately suggest HIGH ATTACK but comparatively low health. Clearly faces SCREEN LEFT in a three-quarter side battle stance toward a hero standing off canvas on the left. Full body, both feet, the full axe head and handle completely visible. Polished colorful anime RPG illustration, clean dark contour lines, soft cel shading, friendly stylized proportions, consistent with a cute green plant monster game. No blood, no victim, no second creature. Portrait 1024x1536 canvas. Center the silhouette, with at least 90 pixels of clear transparent padding around every extremity, ground baseline at 1400 pixels. Genuine transparent alpha background. No scenery, no ground shadow, no glow, no fog, no UI, no letters, no numbers, no border, no watermark.
