# JAWS DAYS 2026 タイムライン改 - 仕様書

## 概要

JAWS DAYS 2026 (2026/03/07) の公式タイムテーブル (fortee.jp) をベースに、追加機能を提供するカスタムタイムテーブル Web アプリケーション。

## 基本情報

| 項目 | 値 |
|------|-----|
| イベント名 | JAWS DAYS 2026 |
| 開催日 | 2026年3月7日 (土) |
| 時間帯 | 09:00 - 19:40 (JST) |
| 会場 | 池袋サンシャインシティ |
| トラック数 | 8 (Track A - Track H) |
| 公式URL | https://fortee.jp/jawsdays-2026/timetable |

## 機能一覧

### F1: タイムテーブルグリッド表示
- **横軸**: Track A-H の 8 トラック
- **縦軸**: 09:00-19:40 を 5 分刻みで表示
- **セルの内容**: 時間帯、セッションタイトル、スピーカーアイコン画像＋名前、タグ
- **CSS Grid** による配置、各セルは開始時刻と duration から自動計算
- **インライン横スクロール** 対応（ページ幅に収まらない場合にスクロール）
- **行の高さ**: 20px（5分スロット）

### F2: セッション詳細モーダル
- セッションセルをクリックするとモーダルダイアログを表示
- 表示項目:
  - Track バッジ (Track A 等)
  - 時間帯 (HH:MM - HH:MM, Nmin)
  - タグ (Level 200, サポーター等) ※ Level バッジは fortee.jp のデザインに準拠した色で表示
  - セッションタイトル
  - スピーカーアイコン画像 (fortee.jp の画像を使用) と名前
- アクションボタン:
  - Google カレンダーに追加
  - Proposal ページを開く (fortee.jp、新規タブ)
  - X (Twitter) でポスト

### F3: Google カレンダー連携
- タイトル形式: `【トラック】セッション名 by スピーカー`
- 場所: `池袋サンシャインシティ`
- タイムゾーン: `Asia/Tokyo`
- 詳細: Proposal URL (あれば)

### F4: X (Twitter) ポスト連携
- テキスト形式:
  ```
  セッションタイトル by スピーカー
  #jawsdays2026 #jawsug #jawsdays2026_{track}
  Proposal URL
  ```
- `https://x.com/intent/post` API を使用

### F5: セッションチェック機能
- Cookie ベースの永続化 (cookie名: `jawsdays2026_checked`, 有効期間: 90日)
- ワークフロー:
  1. 「参加予定を編集」ボタンで編集モード開始
  2. チェックボックスでセッションを選択/解除（休憩・受付などの非セッション枠はチェック不可）
  3. 「保存」で Cookie に確定、「キャンセル」で破棄
- 編集中は `pendingChecked` で仮保持 (直接 `checkedSessions` を変更しない)

### F6: チェック済みセッションの視覚表示
- 3px solid orange (`#ff9900`) ボーダー
- 薄オレンジ (`rgba(255, 153, 0, 0.06)`) 背景

### F7: 開催中セッションハイライト
- JST 時刻を基に判定 (1分間隔でポーリング)
- 薄グリーン (`rgba(52, 199, 89, 0.15)`) 背景
- チェック済みと開催中が両立する場合、グラデーション背景で併用表示

### F8: テーブルヘッダ固定 (上下)
- 上部ヘッダ: `position: sticky` でスクロール時も固定表示
- 下部ヘッダ: グリッド最終行にも Track ヘッダを配置

### F9: スクロールトップボタン
- 400px 以上スクロールすると右下に表示
- クリックでスムーズスクロールでページトップへ戻る

### F10: 初期表示時自動スクロール
- 開催日 (2026-03-07): 現在のJST時刻付近へスクロール
- 開催日以外: 10:00 (セッション開始付近) へスクロール

### F11: 非セッション表示
- 休憩、受付、会場レイアウト変更、オープニング、キーノートはグレー背景
- クリック不可 (モーダル非表示)
- 編集モード時もチェックボックスを表示しない（チェック不可）

## データ構造

### timetable.json
```json
{
  "event": {
    "name": "JAWS DAYS 2026",
    "date": "2026-03-07",
    "venue": "池袋サンシャインシティ",
    "hashtag": "#jawsdays2026",
    "timetableUrl": "https://fortee.jp/jawsdays-2026/timetable"
  },
  "tracks": [
    { "id": "A", "name": "Track A", "hashtag": "#jawsdays2026_a" }
  ],
  "sessions": [
    {
      "id": 1,
      "track": "A",
      "date": "2026-03-07",
      "start": "09:00",
      "end": "09:50",
      "duration": 50,
      "title": "セッション名",
      "speaker": "スピーカー名",
      "speakerImage": "https://fortee.jp/files/jawsdays-2026/speaker/{uuid}.jpg",
      "proposalUrl": "https://fortee.jp/jawsdays-2026/proposal/...",
      "tags": ["Level 300"]
    }
  ]
}
```

#### speakerImage フィールド
- fortee.jp 上のスピーカーアイコン画像の URL
- `https://fortee.jp/files/jawsdays-2026/speaker/{uuid}.{jpg|png}` 形式
- 画像がない場合は空文字列 `""`

### Level バッジの色 (fortee.jp 準拠)

| Level | CSS クラス | 背景色 |
|-------|-----------|--------|
| Level 200 | `level-200` | `#50cd89` (緑) |
| Level 300 | `level-300` | `#7239ea` (紫) |
| Level 400 | `level-400` | `#ff8f00` (オレンジ) |
| その他 | なし | `#8899a6` (グレー) |

### fortee.jp HTML 構造からのデータ変換
- `track-N` クラス → Track A-H (1=A, 2=B, ..., 8=H)
- CSS `top` 値 → 開始時刻: `start_minutes = top_px / 6`, 基準: 09:00
- CSS `height` 値 → 所要時間: `duration_minutes = height_px / 6`
- 5分 = 30px

## 技術仕様

| 項目 | 仕様 |
|------|------|
| フロントエンド | Vanilla HTML/CSS/JS (フレームワーク不使用) |
| レイアウト | CSS Grid |
| 永続化 | Cookie |
| ホスティング | GitHub Pages (`public/` ディレクトリ) |
| デプロイ | GitHub Actions (push to main で自動デプロイ) |
| タイムゾーン | JST (Asia/Tokyo) |
| レスポンシブ | 768px ブレークポイント |
