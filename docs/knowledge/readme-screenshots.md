# README スクリーンショット追加

## 概要

README にスクリーンショットセクションを追加した際の構成と運用方針。

## ディレクトリ構成

```
docs/screenshots/
├── README.md                     # ファイル名規則の説明
├── screenshot-pc-initial.png     # PC 初期表示
├── screenshot-pc-live.png        # PC 開催中セッション（緑ハイライト）
└── screenshot-pc-edit.png        # PC 参加予定の編集モード
```

## README への組み込み位置

`## GitHub Pages` の直後、`## イベント概要` の前に `## スクリーンショット` セクションを配置。
トップに近い位置に置くことで、訪問者が最初に視覚的な概要を把握できる。

## Markdown の書き方

```markdown
![初期表示](docs/screenshots/screenshot-pc-initial.png)
```

- 相対パスで記述することで GitHub Pages と GitHub.com 両方で参照可能
- `alt` テキストは日本語で機能説明を記載

## 運用方針

- 画像は `docs/screenshots/` に置く（`public/` には置かない）
- ファイル名は `screenshot-{デバイス}-{内容}.png` の形式に統一
- 画像ファイル追加後は `docs/screenshots/README.md` の表も更新する
