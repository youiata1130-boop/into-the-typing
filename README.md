# Into the Typing

## Play Locally

Open `index.html` directly in a browser, or serve it over HTTP:

```sh
npm start
```

The local server prints a `Local` URL and, when available, a `Network` URL
that other devices on the same network can open.

## Publish Online

This is a static site, so it can be published without a backend.

### GitHub Pages

1. Push this folder to a GitHub repository.
2. In the repository settings, enable GitHub Pages with GitHub Actions.
3. Push to the `main` branch.

The workflow in `.github/workflows/pages.yml` deploys the current files.

### Other Static Hosts

For Netlify, Vercel, Cloudflare Pages, Firebase Hosting, or similar services:

- Build command: leave empty.
- Publish directory: `.`.
- Entry file: `index.html`.

## Folder Structure

```text
into-the-typing/
├── index.html              # App entry point and script loading order
├── src/
│   ├── app/game.js         # Game state, typing, story, and battle flow
│   ├── config/             # Stage, weapon, animation, and progression settings
│   ├── data/               # Typing words and interface text
│   ├── input/              # Japanese reading matching and mobile keyboard
│   ├── styles/main.css     # Layout and visual effects
│   └── assets/images/      # Images used by the game
│       ├── backgrounds/    # Shared, status, and stage-map backgrounds
│       ├── player/         # Player frames by weapon and state
│       ├── items/          # Weapon illustrations for story scenes
│       └── enemies/        # Enemy frames by type, level, and state
├── scripts/                # Local server and syntax checking
├── tests/
│   ├── unit/               # Progression rules
│   ├── integration/        # Story and greatsword battle behavior
│   └── helpers/            # Shared DOM and clock fixture
├── docs/assets/player/     # Art-generation notes and prompts
├── archive/assets/images/  # Preserved unused and legacy images
└── .github/workflows/      # GitHub Pages deployment
```

| Change | File |
| --- | --- |
| Game behavior | `src/app/game.js` |
| Typing words | `src/data/words.js` |
| Interface text | `src/data/labels.js` |
| Stages, enemy waves, and rewards | `src/config/stages.js` |
| Weapons and player animation frames | `src/config/weapons.js` |
| Enemy animation frames | `src/config/enemyAnimations.js` |
| EXP, HP growth, and skill points | `src/config/playerProgression.js` |
| Layout and visual effects | `src/styles/main.css` |

Scripts load in the order listed in `index.html`. They remain classic browser scripts so opening `index.html` directly still works without a build step. The integration-test helper follows that same script order.

- Player images: `src/assets/images/player/{weapon}/{state}/frame_{nn}.png`.
- Enemy images: `src/assets/images/enemies/{enemy}/level_{n}/{state}/frame_{nn}.png`.
- Backgrounds: `src/assets/images/backgrounds/{shared,status,stage_map}`.
- Art records: [greatsword](docs/assets/player/greatsword-generation.md), [unarmed](docs/assets/player/unarmed-generation.md), and [wooden branch](docs/assets/player/branch-generation.md).
- Legacy images: see the [archive guide](archive/README.md).

`npm run check` checks every JavaScript file under `src`, `scripts`, and `tests`. `npm test` runs the unit and integration tests.

## Asset Notes

- Add enemy frames under `src/assets/images/enemies/{enemy}/level_{n}`.
- Register new enemy frames in `src/config/enemyAnimations.js`.
- Add player frames under `src/assets/images/player/{weapon}/{state}` and register them in `src/config/weapons.js`.
- Enemy types without registered idle frames are skipped by the wave spawner.
- Move retired assets to `archive/assets/images` instead of mixing them with runtime assets.
- Preserve the relative image path when archiving an asset, and update any links in its generation notes.
- Keep existing frame numbers when moving assets; animation order is set by the registered frame arrays.
- Keep temporary preview/check images outside the project.
- Local dependencies, npm debug logs, and operating-system metadata are excluded from Git by `.gitignore`.

## Current Gameplay

- The start screen opens an old map on a desk. Only circular quest markers are shown at first; selecting one reveals its name and start controls. A portrait map is used on portrait screens.
- Stage `1 チュートリアル` contains only the equipment lesson against a single egg. Its three punches and four branch attacks finish the stage and award 10 EXP. The result shows `チュートリアル完了` with a `ステージ2へ` button.
- The equipment tutorial opens with `敵が現れた！`; `次へ` reveals the first egg. This enemy has no HP fields: it is defeated by three successful unarmed prompts followed by four successful wooden-branch prompts, independently of attack stats. Mistakes and duplicate input events do not advance the lesson.
- Three punches reduce the displayed enemy gauge to 99%, 98%, and 97%. The branch illustration and `これを使って！` then appear; `装備する` equips the branch against the same egg. The four branch attacks reduce the gauge to 72.75%, 48.5%, 24.25%, and 0%. Dialogue pauses combat, and special moves are blocked throughout this first encounter.
- Defeating the tutorial egg saves `equipmentTutorialCompleted` and unlocks stage 2; receiving the branch alone does not unlock it. An unfinished lesson restarts on retry or reload, and stage 1 can always be replayed as the full lesson. Existing completed saves immediately unlock stage 2 without resetting EXP, level, stats, or equipment. `introCompleted` continues to record receipt of the branch.
- Stage `2 霧の古道` starts the main game with the saved weapon, normal HP and damage, and seven encounters: three eggs, three chicks, and a chick boss. It awards 110 EXP on clear. Stage 3 remains locked.
- Egg and chick idle frames loop to create walking animation. Attack, damage, and defeat states use their registered enemy frames.
- Typing a target correctly plays the swordsman's attack sequence: idle, sword raised, then sword lowered.
- Typing text is displayed in the bottom input panel; labels above the player and enemies are hidden.
- The wooden branch is the initial weapon. It uses complete prompts with 2–3 roman letters for normal enemies and bosses and deals 0.2 damage at base attack outside the tutorial. Agility can shorten these prompts to 2 letters. After receiving the branch, Home → Weapons allows selection of the one-handed sword and greatsword. Equipment persists across retries and reloads.
- The one-handed sword keeps the original short-word, ×1-damage behavior.
- At base agility, the greatsword uses long prompts (at least 12 input characters for both normal enemies and bosses). A no-miss completion deals ×4 attack damage; each mistype lowers the multiplier by one step down to ×1.
- Correct greatsword input progresses through three poses: low guard, raised blade, and overhead wind-up. Each third of the current charge advances the pose; the aura grows with every correct character. A miss immediately resets the pose and aura while preserving correctly typed text, and the remaining letters rebuild the charge. Backspace rewinds the charge, and each new prompt starts from the low guard. A perfect completion plays the overhead attack and its impact effects.

- The battle input panel displays only the Japanese prompt and romanized typing text. Use the upper-left Back button to return to the stage map; Space still activates the special move when charged.

## Player Progression

- Defeated enemies add EXP once to the current stage reward, including kills from the special move. EXP, levels, HP growth, and skill points are awarded and saved together only after a successful stage clear. Failed, interrupted, or restarted attempts discard the pending reward. The tutorial rewards 10 EXP; stage 2 rewards 10 / 15 / 35 EXP by wave.
- EXP needed for the next level is `40 + 20 × (level − 1) + 5 × (level − 1)²`: 40, 65, 100, 145, and so on. Excess EXP carries over, including when multiple levels are gained at once. The maximum level is 99.
- Each level adds 10 maximum HP and 1 skill point. Current HP also rises by 10, preserving any damage already taken. Returning to the map or starting a quest restores full HP.
- Spend 1 SP in the status screen for +1 attack (maximum 99) or +1 agility (maximum 9). Attack increases equipped weapon damage (the branch deals 0.2 per attack stat). Each agility upgrade reduces the prompt selection range by one character: the branch has a minimum of 2 characters; swords have minimum bounds of 2 for the lower end and 4 for the upper end. Words remain complete; alternate romanizations can vary in length.
- Attack upgrades do not increase prompt length. The status screen shows the actual selection range for the current stage and weapon.
- This version begins a fresh adventure using `into-the-typing.player.v2`; the previous `into-the-typing.player.v1` save remains untouched as a backup. Level, EXP, allocated stats, remaining points, selected weapon, and receipt of the branch persist across retries and browser reloads in the new save. Different browsers or site origins have separate saves. If storage is unavailable, play continues in memory and the status screen explains this.
- The battle EXP bar shows previously earned progress during combat and updates at stage clear. Clear results show the awarded EXP and, when a level is gained, the previous and new levels plus HP and skill-point gains.

Run `npm run check` and `npm test` to validate the game scripts and progression behavior.

## Mobile Japanese Input

On a phone or tablet, the battle and dialogue Next buttons focus the Japanese input field. Use the device's Japanese flick keyboard. The prompt includes its hiragana reading. Input is judged on each text update, including during composition; completing the reading attacks without a confirmation or Enter press. Hiragana, katakana (including halfwidth kana), the exact displayed kanji, and romaji are accepted.

- Wrong kana immediately record a miss, and deleting them does not restore the combo or perfect greatsword damage. The last composing kana may wait for a valid dakuten, handakuten, or small-kana edit; unrelated wrong characters are judged immediately.
- Correct prefixes immediately update the reading and existing attack/charge logic. Completing a word clears the entire native field and resets the caret and composition state after the IME event finishes. Restored text and delayed old commits are removed without erasing a newly typed prefix or counting a miss; the same focused editor is retained.
- The native editor uses a single-row textarea and a Return key hint so confirming a word keeps the keyboard available. Return and cancelable line-break events are prevented even during composition, without blurring the editor or adding blank lines; new prompts keep the same focused editor. An intentional keyboard dismissal never triggers automatic refocusing. Editability changes only when entering or leaving dialogue/battle. Leaving or restarting discards old pending composition.
- The battle fits the visual viewport above the keyboard. The page requests text input; the keyboard language and flick layout are selected on the device.
- Desktop hardware romaji input remains available.
- Input files: `src/input/japanese.js` handles readings and matching; `src/input/mobile.js` handles native input and viewport sizing.
- Validation: integration tests cover composition, dakuten, kana variants, correction, stale events, story handoff, and greatsword charge. Chromium mobile emulation completes the tutorial and stage 2 without Enter or confirmation, verifies immediate miss retention after deletion, observes no battle blur on composing Enter, and checks an empty field with its caret at zero after every answer. Injected IME restoration and late-commit cases also pass; physical iOS/Android keyboard layouts require device verification.

Browser API references: [compositionend](https://developer.mozilla.org/en-US/docs/Web/API/Element/compositionend_event), [InputEvent.isComposing](https://developer.mozilla.org/en-US/docs/Web/API/InputEvent/isComposing), [VisualViewport](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport), [enterkeyhint](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/enterkeyhint).
