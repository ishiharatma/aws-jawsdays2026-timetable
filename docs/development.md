# 開発ガイド

## プロジェクト構成

```
aws-jawsdays2026-timetable/
├── public/                  # GitHub Pages デプロイ対象
│   ├── index.html           # メインページ
│   ├── style.css            # スタイルシート
│   ├── app.js               # アプリケーションロジック
│   └── timetable.json       # タイムテーブルデータ
├── docs/                    # ドキュメント
│   ├── spec.md              # 仕様書
│   ├── development.md       # 開発ガイド (本ファイル)
│   ├── plan.md              # 実装計画
│   └── knowledge/           # ナレッジベース
├── .github/
│   └── workflows/
│       └── deploy.yml       # GitHub Pages デプロイワークフロー
├── generate_json.py         # timetable.json 生成スクリプト
├── scraper.py               # fortee.jp スクレイパー (参考用)
├── requirements.txt         # Python 依存パッケージ
├── HISTORY.md               # 実装履歴
└── README.md                # プロジェクト概要
```

## ローカル開発

### 必要環境
- 任意の HTTP サーバー (Python, Node.js 等)
- Python 3.x (timetable.json 生成時のみ)

### ローカルサーバー起動

```bash
# Python の場合
cd public
python3 -m http.server 8000

# Node.js (npx) の場合
npx serve public
```

ブラウザで `http://localhost:8000` を開く。

### timetable.json の再生成

fortee.jp のデータが更新された場合:

1. `generate_json.py` のセッションデータを更新
2. スクリプトを実行:
   ```bash
   python3 generate_json.py
   ```
3. `docs/timetable.json` が更新される → `public/timetable.json` にコピー

### fortee.jp HTML 構造の解析

fortee.jp のタイムテーブルは CSS absolute positioning で実装されている:

```
開始時刻 = 09:00 + (top値px / 6) 分
所要時間 = height値px / 6 分
トラック = track-N クラス (1=A, 2=B, ..., 8=H)
```

例: `top:720px; height:120px;` → 11:00 開始、20分間

## デプロイ

### 自動デプロイ (推奨)
`main` ブランチの `public/` ディレクトリに変更を push すると、GitHub Actions が自動的に GitHub Pages へデプロイする。

### 手動デプロイ
GitHub リポジトリの Actions タブから `Deploy to GitHub Pages` ワークフローを手動実行できる。

## コーディング規約

### JavaScript
- Vanilla JS (フレームワーク不使用)
- IIFE パターンで名前空間を保護
- `"use strict"` 使用
- DOM 参照は初期化時に取得してキャッシュ
- イベント委任パターンを活用 (特にチェックボックス)

### CSS
- CSS Variables (カスタムプロパティ) で色・サイズを管理
- BEM に近い命名規則 (`.session-cell`, `.session-title`)
- メディアクエリは 768px ブレークポイント

### HTML
- セマンティック HTML (`<header>`, `<main>`, `<button>`)
- WAI-ARIA 属性 (`role="dialog"`, `aria-modal="true"`, `aria-label`)

## 既知の注意点

### Cookie サイズ制限
Cookie には最大 4KB の制限がある。チェック済みセッション数が多い場合、Cookie サイズが上限に近づく可能性がある。将来的には localStorage への移行を検討。

### fortee.jp アクセス制限
fortee.jp は直接的な HTTP リクエスト (curl, fetch) に対して 403 を返す。データ取得には:
- ブラウザでページを開き、HTML ソースをコピー
- Selenium などのブラウザ自動化ツールを使用

### タイムゾーン処理
すべての時刻処理は JST (Asia/Tokyo) で行う。`toLocaleString("en-US", { timeZone: "Asia/Tokyo" })` を使用して正確な JST 時刻を取得。
