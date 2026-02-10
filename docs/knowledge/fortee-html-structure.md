# fortee.jp タイムテーブル HTML 構造

## 概要

fortee.jp のタイムテーブルは CSS absolute positioning を使用して表示されている。JavaScript で動的にレンダリングされるため、単純な HTTP リクエストでは取得できない (403 エラー)。

## データ属性

タイムテーブルのコンテナ要素:
```html
<div data-from="2026-03-07T09:00:00+09:00" data-to="2026-03-07T19:40:00+09:00">
```

## トラックマッピング

CSS クラスでトラックを識別:

| CSS クラス | トラック |
|-----------|---------|
| `track-1` | Track A |
| `track-2` | Track B |
| `track-3` | Track C |
| `track-4` | Track D |
| `track-5` | Track E |
| `track-6` | Track F |
| `track-7` | Track G |
| `track-8` | Track H |

## 時間計算

CSS の `top` と `height` の値から時間を計算する:

```
5分 = 30px

開始時刻 = 09:00 + (top値 / 6) 分
所要時間 = height値 / 6 分
終了時刻 = 開始時刻 + 所要時間
```

### 計算例
| top (px) | height (px) | 開始時刻 | 所要時間 | 終了時刻 |
|----------|------------|---------|---------|---------|
| 0        | 300        | 09:00   | 50min   | 09:50   |
| 360      | 300        | 10:00   | 50min   | 10:50   |
| 720      | 120        | 11:00   | 20min   | 11:20   |
| 1080     | 90         | 12:00   | 15min   | 12:15   |
| 1320     | 180        | 12:40   | 30min   | 13:10   |
| 3060     | 780        | 17:30   | 130min  | 19:40   |

## セッション要素の種類

### 1. 汎用タイムスロット (構造的)
```html
<div class="proposal time-slot ... track-N" style="height:Xpx; top:Ypx;">
  <div class="title">休憩</div>
  <div class="speaker-name">...</div>
</div>
```
- 受付、休憩、オープニング、キーノート、会場レイアウト変更 等
- Proposal URL なし

### 2. 実際のプロポーザルセッション
```html
<div class="proposal email-tags-selector-v2-container proposal-in-timetable ... track-N" style="height:Xpx; top:Ypx;">
  <a href="/jawsdays-2026/proposal/UUID">セッションタイトル</a>
  <div class="speaker-name">スピーカー名</div>
  <span class="badge ...">Level 300</span>
</div>
```
- Proposal URL: `https://fortee.jp` + href 属性の値
- タグ/レベルバッジ付き

### 3. プレースホルダーセッション
```html
<div class="proposal time-slot ... track-N" style="height:Xpx; top:Ypx;">
  <div class="title">セッション</div>
</div>
```
- タイトルが「セッション」のみの未確定枠
- 同じ位置にプロポーザルがあれば、プロポーザルで上書き

## 重複処理のルール

同じ `(track, top)` に複数の要素がある場合:
1. `proposal-in-timetable` クラスを持つもの (実際のプロポーザル) を優先
2. 汎用タイムスロットはプロポーザルがない場合のみ採用

## アクセス制限

- fortee.jp は自動アクセスに対して 403 を返す
- User-Agent やリファラの設定では回避不可
- データ取得方法:
  - ブラウザで開いてソースをコピー
  - Selenium / Playwright などのブラウザ自動化
