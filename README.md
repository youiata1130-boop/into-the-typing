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
│   ├── app/                # Asset loading, game state, story, and battle flow
│   ├── config/             # Stage, weapon, animation, progression, and save-slot storage
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
| Startup image loading | `src/app/loading.js` |
| Game behavior | `src/app/game.js` |
| Three save slots and legacy migration | `src/config/saveSlots.js` |
| New / Continue and player names | `src/ui/saveMenu.js` |
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

- Startup waits for all playable enemy frames, weapon frames, page images, and map variants to download and decode. A progress screen blocks play until everything is ready; failed or timed-out loads offer a retry. Successfully loaded assets are retained for retry.
- CSS-only backgrounds are declared as image preload links in `index.html`; keep those links in sync when adding backgrounds. Images already referenced by the page or responsive map are collected automatically.

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

- The title screen offers `初めから` and `続きから`. Choose one of three slots and enter a player name (1–20 characters) for a new adventure. Slot cards show the name, level, and highest available stage. Creating a save writes it before opening the map; overwriting an occupied slot requires the explicitly labeled confirmation button. Canceling leaves the existing data untouched.
- `続きから` opens the map with the selected player's saved growth and equipment. Battles restart when entered. The map's `タイトル` button returns to player selection.

- The start screen opens an old map on a desk. Only circular quest markers are shown at first; selecting one reveals its name and start controls. A portrait map is used on portrait screens.
- Stage `1 旅の始まり` contains only the equipment lesson against a single medaka. Its three punches and four branch attacks finish the stage and award no EXP, so replaying stage 1 cannot cause a level-up. The result shows a treasure chest and `鉄の剣を手に入れた！`, saves ownership of the sword, and offers an `装備画面へ` button on first acquisition. The equipment screen asks the player to select the iron sword; selecting it equips and saves it, then enables `ステージ2へ`. An unfinished equipment prompt resumes when continuing that save, while completed and older saves keep the normal menu flow. Failed or interrupted attempts do not grant the sword.
- The equipment tutorial opens with `敵が現れた！`; `次へ` reveals the first medaka. This enemy has no HP fields: it is defeated by three successful unarmed prompts followed by four successful wooden-branch prompts, independently of attack stats. The unarmed prompts are `あ`, `木` (`き` / `ki`), and `手` (`て` / `te`), in that order; each takes one kana on mobile. Mistakes and duplicate input events do not advance the lesson.
- Three punches reduce the displayed enemy gauge to 99%, 98%, and 97%. The branch illustration and `これを使って！` then appear; `装備する` equips the branch against the same medaka. The four branch attacks reduce the gauge to 72.75%, 48.5%, 24.25%, and 0%. Dialogue pauses combat, and special moves are blocked throughout this first encounter.
- Defeating the tutorial medaka saves `equipmentTutorialCompleted` and unlocks stage 2; receiving the branch alone does not unlock it. An unfinished lesson restarts on retry or reload, and stage 1 can always be replayed as the full lesson. Existing completed saves immediately unlock stage 2 without resetting EXP, level, stats, or equipment. `introCompleted` continues to record receipt of the branch.
- Stage `2 霧の古道` starts the main game with the saved weapon, normal HP and damage, and seven encounters: three medaka, three chicks, and a chick boss. It awards 40 EXP on clear, taking a new player from level 1 to level 2 with 1 SP. The level-up result offers `ステータスへ`; a short guide explains attack and agility and asks the player to spend one point with `＋1`. Successful allocation saves the upgrade and completes the guide, then enables `ステージ選択へ`. The pending guide resumes per save and is not repeated after completion. Stage 3 remains locked.
- The medaka uses the approved smooth silver-blue fish artwork with sharp red eyes and purple fin edges. Its transparent sprite keeps its aspect ratio, fills the enemy width on desktop and mobile, and swims through 16 transparent frames in a 1.12-second loop. Its face stays fixed while its body and tail move, including when waiting between attacks. Reduced-motion mode displays a still frame. Attack, damage, and defeat use the original art with CSS reactions. Chick idle frames loop to create walking animation; its other states use their registered frames.
- Typing a target correctly plays the swordsman's attack sequence: idle, sword raised, then sword lowered.
- Typing text is displayed in the bottom input panel; labels above the player and enemies are hidden.
- The wooden branch is the initial weapon. It uses complete prompts with 2–3 roman letters for normal enemies and bosses and deals 0.2 damage at base attack outside the tutorial. Agility can shorten these prompts to 2 letters. Home → Weapons unlocks the iron sword after the stage 1 treasure reward; equipment lists only owned weapons. The greatsword requires its own `greatswordObtained` save flag and is not awarded by the opening lesson. Older saves with the greatsword equipped retain ownership; newer saves retain the explicit acquisition flag even when another weapon is equipped. Older version-2 saves without `ironSwordObtained` retain their previous sword access if the branch was already received. Equipment persists across retries and reloads.
- The iron sword keeps the original short-word, ×1-damage behavior.
- At base agility, the greatsword uses long prompts (at least 12 input characters for both normal enemies and bosses). A no-miss completion deals ×4 attack damage; each mistype lowers the multiplier by one step down to ×1.
- Correct greatsword input progresses through three poses: low guard, raised blade, and overhead wind-up. Each third of the current charge advances the pose; the aura grows with every correct character. A miss immediately resets the pose and aura while preserving correctly typed text, and the remaining letters rebuild the charge. Backspace rewinds the charge, and each new prompt starts from the low guard. A perfect completion plays the overhead attack and its impact effects.

- The battle input panel displays only the Japanese prompt and romanized typing text. Use the upper-left Back button to return to the stage map; Space still activates the special move when charged.

## Player Progression

- Defeated enemies add EXP once to the current stage reward, including kills from the special move. EXP, levels, HP growth, and skill points are awarded and saved together only after a successful stage clear. Failed, interrupted, or restarted attempts discard the pending reward. The tutorial rewards 0 EXP; stage 2 rewards 5 / 5 / 10 EXP per enemy by wave (40 EXP total).
- EXP needed for the next level is `40 + 20 × (level − 1) + 5 × (level − 1)²`: 40, 65, 100, 145, and so on. Excess EXP carries over, including when multiple levels are gained at once. The maximum level is 99.
- Each level adds 10 maximum HP and 1 skill point. Current HP also rises by 10, preserving any damage already taken. Returning to the map or starting a quest restores full HP.
- Spend 1 SP in the status screen for +1 attack (maximum 99) or +1 agility (maximum 9). Attack increases equipped weapon damage (the branch deals 0.2 per attack stat). Each agility upgrade reduces the prompt selection range by one character: the branch has a minimum of 2 characters; swords have minimum bounds of 2 for the lower end and 4 for the upper end. Words remain complete; alternate romanizations can vary in length.
- Attack upgrades do not increase prompt length. The status screen shows the actual selection range for the current stage and weapon.
- Player saves use independent `into-the-typing.slot.1.v1`, `.slot.2.v1`, and `.slot.3.v1` keys. Each holds the player's name, update time, and version-2 progression. Level, EXP, stats, equipment, tutorial completion, and the iron sword unlock are isolated by slot. The existing `into-the-typing.player.v2` save is imported into an empty slot 1 as `プレイヤー1`; original version-1/version-2 keys remain untouched as backups. Subsequent saves never rewrite those backups or another player's slot. A stale selection cannot overwrite a slot updated in another tab.
- Different browsers and site origins keep separate saves. A new or replacement adventure does not begin if its initial save fails. If an active game's autosave fails, play continues in memory and the status screen shows the failure.
- The battle EXP bar shows previously earned progress during combat and updates at stage clear. Clear results show the awarded EXP and, when a level is gained, the previous and new levels plus HP and skill-point gains.

Run `npm run check` and `npm test` to validate the game scripts and progression behavior.

## Mobile Japanese Input

On a phone or tablet, battles use an in-game hiragana flick keyboard. The system keyboard is not opened during battle, so its input accessory bar and conversion suggestions do not appear. Player names still use a normal text field outside battle.

- Kana keys occupy the middle three columns, with deletion at the upper right. The bottom row has 小゛゜ under ま, わ under や, and ー under ら. Unneeded language/conversion controls are omitted.
- Tap a kana key for its center letter; flick left, up, right, or down for the other letters. A stationary press shows a guide after 300 ms. Flicking shows the direction immediately and never waits for this delay. The guide surrounds the pressed key and stays within the viewport. This is an approximation of native kana input, not a measured reproduction of Apple's private timing or the user's device settings.
- The bottom-left 小゛゜ key cycles the last letter, including は → ば → ぱ → は and つ → っ → づ → つ. Small kana such as ゃ use the same key. Intermediate ば and っ can wait when ぱ and づ are expected, without recording a miss.
- Wrong kana immediately record a miss and disappear, keeping the correct prefix. Completing a word attacks immediately and clears the input for the next word.
- Input is committed once on pointer release. Cancellation, a second finger, focus loss, rotation, a new word, and a new battle cancel unfinished gestures and guide timers.
- The whole battle control panel, including key gaps, disabled keys, and the output, prevents touch scrolling, pinch/double-tap zoom, text selection, dragging, and context menus. Non-passive touch and Safari gesture listeners supplement CSS touch-action. Touches remain protected after leaving the panel until released. Zoom outside the panel and normal name-entry controls are unchanged; operating-system gestures are outside the page's control. See [Apple's touch and gesture handling guide](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/HandlingEvents/HandlingEvents.html).
- The keyboard hides during dialogue and outside battle. Portrait layouts keep the battle above the keys; short landscape layouts put them side by side. Desktop hardware romaji input remains available.
- Input files: `src/input/flickKeyboard.js` manages keys and gestures; `src/input/mobile.js` manages the shared kana matcher, input reset, and viewport; `src/input/japanese.js` parses readings. The internal textarea is hidden and readonly. Battle controls focus the non-editable prompt.
- Validation covers all 223 playable prompts using the shared modifier key, miss/deletion handling, guide timing and cancellation, scoped browser-event prevention, and the existing battle/save flows. Browser checks use actual touch events and verify the viewport scale and scroll position during swipes, pinches, and repeated taps. Physical iPhone Safari behavior still requires device verification.
