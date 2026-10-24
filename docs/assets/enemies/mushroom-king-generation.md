# キノコの王様の画像素材

- 組み込みの `image_gen` ツールで既存キノコを参照して生成。透過PNGを加工せず保存した。
- 保存先: `src/assets/images/enemies/mushroom/boss/idle/frame_01.webp`（1536×1024）。透明部分のアルファ値0を確認。
- 待機・攻撃・被弾・撃破で同じ画像を使用し、既存のCSS演出を組み合わせる。
- 攻撃直前は[専用の振りかぶり画像](mushroom-windup-generation.md)に切り替える。
- 元画像: `C:/Users/youia/.codex/generated_images/01a15984-234c-7a83-b057-7157135af534/exec-20e06944-9062-44c7-bd3d-e95d3dd7fb70.png`。

## 生成プロンプト

参照: `src/assets/images/enemies/mushroom/level_1/idle/frame_01.webp`。`transparent_background: true`。

Use case: stylized-concept. Create a transparent PNG boss enemy sprite for the same Japanese fantasy typing RPG as the reference. The reference is a style and species reference: cute stout cream mushroom creature, broad glossy red-orange cap with ivory spots, expressive brown eyes, tiny feet, clean dark brown outlines and polished cel shaded anime game illustration. Create its royal boss counterpart, the Mushroom King: one larger broad deep crimson cap with cream spots, a substantial ornate gold crown with a red jewel sitting clearly on TOP of the cap, short rich purple royal mantle with cream trim around the stem body, confident stern but cute face, tiny mushroom feet. Remain a mushroom creature, no human arms or humanoid body, no weapons or throne. Three-quarter front view facing slightly LEFT toward the hero. Whole body including crown, cap and both feet comfortably inside a landscape 3:2 frame with transparent margins. Readable at small mobile sprite sizes, simple bold silhouette. Real transparent alpha, no backdrop, gradient, ground, shadow, outer glow, particles, text, letters, labels, UI or watermark. One character only.
