# 開発資料

| フォルダ | 内容 |
| --- | --- |
| [gameplay](gameplay/weapons.md) | 武器・クールタイム・スキルの仕様 |
| [stages](stages/maps.md) | 地図、ステージ構成、敵数、報酬、難易度 |
| [assets/player](assets/player/dual-blades-generation.md) | 主人公・武器素材の制作記録と生成プロンプト |
| [assets/enemies](assets/enemies/bee-generation.md) | 敵素材の制作記録と生成プロンプト |
| [testing](testing/mobile-layout.md) | 画面と動作の検証方法 |

森エリア: [3-1 キノコの森](stages/mushroom-forest.md)、[キノコ・森の画像と生成プロンプト](assets/enemies/mushroom-generation.md)。
続きのステージ: [3-2 胞子の小道](stages/spore-path.md)。

片手剣: [ガードの仕様](gameplay/weapons.md#片手剣と盾)、[剣と盾の画像・生成プロンプト](assets/player/sword-shield-generation.md)。

実際に使う画像は `src/assets/images/`、未使用素材は [archive](../archive/README.md) に保存する。検証用の一時ログ・画像・スクリプトはGit対象外の `tmp/verification/` にまとめる。

- 素材生成スクリプト: `scripts/assets/`。
- 結合テスト: `tests/integration/` 内の `battle/`・`input/`・`progression/`・`stages/`・`ui/`。
- 一時検証ファイル: `tmp/verification/` 内の `scripts/`・`logs/`・`screenshots/`・`profiles/`。
