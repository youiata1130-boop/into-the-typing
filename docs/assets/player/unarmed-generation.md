# Unarmed player art

- Generated with the built-in imagegen tool on 2026-09-07.
- Reference: `src/assets/images/player/sword/idle/frame_01.png` (inline preview).
- Runtime assets: `src/assets/images/player/unarmed/idle/frame_01.png` and `src/assets/images/player/unarmed/attack/frame_01.png`.
- The built-in attempts returned RGB images with a painted checkerboard. The follow-up transparency fix uses local alpha masking to remove the light neutral background connected to the image border; character colors and canvas dimensions are preserved. Both runtime files are now RGBA PNGs with fully transparent borders.
- The opaque originals are preserved under `archive/assets/images/player/unarmed/{idle,attack}/frame_01.png`.

## unarmedIdle

Use case: identity-preserve. Asset type: transparent PNG player sprite for the existing typing RPG. The most recent inline image (brown-haired blue-clothed swordsman) is the identity and art-style reference. Re-create this exact hero, same face, proportions, blue-and-gold tunic, silver shoulder and arm armor, cream trousers, brown gloves and boots, same polished game illustration rendering. Full body, facing screen right, identical scale and similar feet alignment to reference in a 1024x1536 portrait canvas. Remove ALL weapons: no sword, blade, hilt, scabbard, shield or weapon anywhere. Only empty gloved hands. True transparent background with clean alpha, no scenery, floor, text, border, labels or effect trails. Leave room for hands and boots. Pose: unarmed ready stance with both empty gloved fists held at chest level, knees slightly bent, confident expression. Preserve the reference hero identity and clothes exactly.

## unarmedStrike

Use case: identity-preserve. Asset type: transparent PNG player sprite for the existing typing RPG. The most recent inline image (brown-haired blue-clothed swordsman) is the identity and art-style reference. Re-create this exact hero, same face, proportions, blue-and-gold tunic, silver shoulder and arm armor, cream trousers, brown gloves and boots, same polished game illustration rendering. Full body, facing screen right, identical scale and similar feet alignment to reference in a 1024x1536 portrait canvas. Remove ALL weapons: no sword, blade, hilt, scabbard, shield or weapon anywhere. Only empty gloved hands. True transparent background with clean alpha, no scenery, floor, text, border, labels or effect trails. Leave room for hands and boots. Pose: unarmed straight punch toward screen right. Front gloved fist extended forward at chest height, other empty fist pulled back at the waist, torso leaning slightly into a punch, feet in the same broad stance as reference. Clearly depict a fist punch, not holding anything. Preserve the reference hero identity and clothes exactly.

## unarmedIdleFinal

Use case: background-extraction. Edit the FIRST of the two reference images, the standing hero with both fists raised. Remove the gray and white checkerboard entirely. Return an actual RGBA PNG cutout with alpha=0 for every background pixel. The checkerboard in the input is baked-in color and must NOT appear in the resulting image. Do NOT draw a checkerboard or white background. Actual transparent background required, not a visualization of transparency. Preserve every part of the hero exactly: pose, body, hands, face, clothing, boots, dimensions and position. No sword, no shield. Keep the whole 1024x1536 canvas and preserve fine hair edges. Change only the background into real alpha transparency.

## unarmedStrikeFinal

Use case: background-extraction. Edit the reference image of the hero punching toward screen right. Remove the gray and white checkerboard entirely. Return an actual RGBA PNG cutout with alpha=0 for every background pixel. The checkerboard in the input is baked-in color and must NOT appear in the resulting image. Do NOT draw a checkerboard or white background. Actual transparent background required, not a visualization of transparency. Preserve every part of the hero exactly: pose, body, hands, face, clothing, boots, dimensions and position. No sword, no shield. Keep the whole 1024x1536 canvas and preserve fine hair edges. Change only the background into real alpha transparency.
