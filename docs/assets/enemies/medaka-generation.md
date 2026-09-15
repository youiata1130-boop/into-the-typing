# メダカの敵キャラクター

- 組み込み日: 2026-09-15
- 採用画像: 赤く鋭い目、紺色の背、銀青色の体、紫色のひれ先。ウロコのない細身の体と前寄りの背びれを持つ、左向きのメダカ風キャラクター。
- 生成ツール: 組み込みの ImageGen。ユーザーが確認した最新版を使用。
- 生成元: C:/Users/youia/.codex/generated_images/01a09f73-1ec4-7702-bddf-65dac5fca912/exec-2d51fb66-bd02-4f8a-9323-c5940e58f9e1.png
- 配置先: src/assets/images/enemies/medaka/level_1/idle/frame_01.png
- 画像: 1916 × 821 px、RGBA、透過背景。生成元から加工せずコピー。
- 用途: ステージ1のチュートリアルとステージ2の最初の2体。攻撃・被ダメージ・撃破は元画像と既存のCSSアニメーションで表現。
- 表示: 縦横比を維持し、敵の表示枠の幅に収める。スマホの画面・キーボードに合わせる既存レイアウトを使用。

## 泳ぎの連続画像

- 作成方式: ユーザーの許可を受けたPython画像処理（Pillow / NumPy）。元画像の読み込みに失敗したImageGenの代わりに、元の画素を変形して作成。
- 生成スクリプト: [generate_medaka_swim.py](../../../scripts/generate_medaka_swim.py)
- 元画像のSHA-256: eafb2b4e7bd959459ebd1cd5e4592cffc04744ba5eadf38aa865a6dd9c699c15。元画像は変更していない。
- 保存先: src/assets/images/enemies/medaka/level_1/swim/frame_01.png ～ frame_16.png
- 形式: 16枚の透過PNG、各768 × 417 px。上下の透明余白でひれの見切れを防止。
- 動き: 顔とえらを固定し、体の後方を周期的に曲げる。尾の短縮と尾びれのわずかな開閉を合わせる。
- 検証: 全コマで顔の画素が一致し、16枚すべてが異なる。透明背景、ひれの余白、元画像が不変であることをスクリプト内で検査。
- 再生: 1コマ70ms、1周1.12秒。プレイヤーの前で止まっている間も泳ぎを続ける。会話・戦闘終了ではタイマーを止め、被ダメージからは泳ぎに戻る。「動きを減らす」設定では静止画。
- 再生成: PillowとNumPyのあるPythonで `python scripts/generate_medaka_swim.py` を実行。`--preview-dir <directory>` で確認用WebP・コマ一覧・マニフェストも出力。
