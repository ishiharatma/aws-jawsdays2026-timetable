# CSS Grid によるタイムテーブル実装

## 基本構造

タイムテーブルは CSS Grid で実装。行が時間スロット、列がトラックに対応。

```
Grid Template:
  Columns: [time-col-width] [track-width × 8]
  Rows:    [auto(header)] [row-height × N(time slots)] [auto(footer)]
```

## グリッド定義

```javascript
const colTemplate = `var(--time-col-width) repeat(${numTracks}, var(--track-width))`;
const rowTemplate = `auto repeat(${totalRows}, var(--row-height)) auto`;
```

- **row 1**: 上部トラックヘッダ (sticky)
- **row 2 ~ N+1**: 時間スロット (5分刻み)
- **row N+2**: 下部トラックヘッダ

## セッションの配置

```javascript
cell.style.gridColumn = `${trackIdx + 2}`;  // +2 for time column offset
cell.style.gridRow = `${startRow} / span ${span}`;
```

- `startRow`: `(startMinutes - 540) / 5 + 2` (540 = 09:00の分換算、+2 for header)
- `span`: `duration / 5`

## 固定ヘッダ (Sticky Header)

```css
.track-header {
  position: sticky;
  top: var(--site-header-height);  /* サイトヘッダの高さ分オフセット */
  z-index: 10;
}
```

ポイント:
- `sticky` の `top` 値はサイトヘッダの高さを考慮
- レスポンシブ時にヘッダ高さが変わるため、CSS 変数で管理
- 下部ヘッダは sticky 不要 (ページ末尾に位置)

## セッションセルの重ね順

```
z-index 階層:
  100: サイトヘッダ (.site-header)
  10:  トラックヘッダ (.track-header)
  8:   現在時刻ライン (.current-time-line)
  6:   チェックボックス (.session-check)
  5:   ホバー中セル (.session-cell:hover)
```

## レスポンシブ対応

768px 以下でサイズ変更:
```css
@media (max-width: 768px) {
  :root {
    --track-width: 140px;      /* 180px → 140px */
    --time-col-width: 48px;    /* 60px → 48px */
    --row-height: 10px;        /* 12px → 10px */
    --site-header-height: 90px; /* ヘッダ折り返し分 */
  }
}
```

## 注意点

### パフォーマンス
- 173 セッション × DOM 要素 → レンダリングは軽量
- CSS Grid は大量の行でもブラウザが効率的に処理

### セルの重複
- 同じグリッド位置に複数セルが配置されることはない（データ側で重複排除済み）
- `margin: 1px` でセル間に隙間を確保
