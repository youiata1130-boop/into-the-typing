# Archived Assets

This folder preserves images that are not loaded by the current game.

- `assets/images/home`: legacy player-base illustrations from the removed base screen.
- `assets/images/enemies`: unused first frames and alternate enemy frames, kept in their original enemy/level/state structure.
- `assets/images/player/branch`: original branch-equipped sprites before background removal.
- `assets/images/player/unarmed`: original opaque sprites before their backgrounds were made transparent.
- `assets/images/player/greatsword/equipped`: unused greatsword equipped-pose illustration. The game currently uses the greatsword idle, charge, and attack frames from `src/assets/images/player/greatsword`.

Do not reference archived images from runtime code. Move an image back under `src/assets/images` before registering it in the game.

Keep the same path beneath `assets/images` when archiving a file so its original location is clear. Player generation notes remain in [docs/assets/player](../docs/assets/player/greatsword-generation.md), with archived image paths updated there.
