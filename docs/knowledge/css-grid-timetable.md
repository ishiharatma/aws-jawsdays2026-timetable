# CSS Grid によるタイムテーブル実装

## ランチタグのアイコン表示

`.lunch-tag` には元々 `background-color: #e8a000`（オレンジ）が設定されていたが、
絵文字 🍴 がオレンジ背景と重なって視認しにくかった。
`background-color: transparent` に変更して絵文字のみを表示するよう修正した。

- **ハマりポイント**: セッションタグは `.session-tag` の共通スタイルで背景色が付くが、
  絵文字タグの場合は背景色を `transparent` にすることで絵文字がそのまま見える。

---

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
  30:  コーナーセル上 (.track-header:first-child)
  25:  コーナーセル下 (.track-header-bottom:first-of-type)
  20:  トラックヘッダ (.track-header)
  10:  トラックヘッダ下 (.track-header-bottom)
  9:   現在時刻ライン (.current-time-line)  ← 時間ラベル (5) より上に表示
  6:   チェックボックス (.session-check)
  5:   時間ラベル (.time-label, sticky)
  5:   ホバー中セル (.session-cell:hover)
```

## 現在時刻ライン実装

### 設計方針

- 5分刻みグリッド上で **分単位の精密配置** を行う
- イベント当日 (2026-03-07) かつ開催時間内 (09:00〜19:40) のみ表示
- 1分ごとに位置・時刻バッジを更新

### 位置計算ロジック

```javascript
// 現在時刻が属する 5分スロットの DOM 要素を取得
const slotMinutes = Math.floor(currentMinutes / SLOT_MINUTES) * SLOT_MINUTES;
const slotLabel = timetableEl.querySelector(`[data-time="${slotTime}"]`);

// スロット内の小数位置で補間
const fraction = (currentMinutes % SLOT_MINUTES) / SLOT_MINUTES;
const topPx = slotLabel.offsetTop + fraction * slotLabel.offsetHeight;
```

`offsetTop` は DOM に挿入後に正確な値を返すため、`renderTimetable()` 直後に呼び出し可能。

### UI 構成

```
[● 14:23]─────────────────────────────────────────
 ↑          ↑
 circle     badge + line (height: 2px, z-index: 9)
(::before)  (.current-time-badge)
```

- **Circle**: `::before` 疑似要素, `10×10px`, `left: -1px, top: -4px` で中央揃え
- **Badge**: `<span class="current-time-badge">` をJS で挿入。`left: 13px` (circle右)
- **色**: `#ff3b30` — オレンジ (accent)・緑 (current session) と明確に区別

### 呼び出しタイミング

| タイミング | 場所 |
|---|---|
| 初期表示 | `init()` 内 `renderTimetable()` 直後 |
| 1分毎更新 | `setInterval()` 内 |
| 編集モード終了後 | `exitEditMode()` 内 `renderTimetable()` 直後 |

`renderTimetable()` は `timetableEl.innerHTML = ""` でリセットするため、
ライン要素が消えるので毎回再生成が必要。`updateCurrentTimeLine()` は既存要素を
再利用（querySelector で取得、なければ createElement）。

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

## row-height の調整（10分セッションの視認性）

`SLOT_MINUTES = 5` のため、10分セッションは 2行 = `2 × --row-height` の高さになる。
`--row-height` が小さいと 10分セッションがほぼ潰れて見えなくなる。

| row-height | 10min セッション高 | 備考 |
|---|---|---|
| 20px | 40px | タイトルが 1〜2 行しか入らない |
| 28px | 56px | タイトルが 2〜3 行入り視認可能（採用値） |

```css
:root {
  --row-height: 28px; /* デスクトップ */
}
@media (max-width: 768px) {
  :root {
    --row-height: 22px; /* モバイル */
  }
}
```

## hour-mark の位置（区切り線の方向）

時刻ラベルの毎時 `:00` に太い区切り線を引く。
`border-bottom` だと「その行の下」に線が入り、次の行の上に見えてしまう。
`border-top` にすると「その行の上 = 毎時の開始位置」に線が引かれ、視覚的に自然。

```css
/* 改善前: border-bottom では線が次の行に食い込む */
.time-label.hour-mark { border-bottom: 2px solid #b0b8c4; }

/* 改善後: border-top で毎時の区切りを明確に */
.time-label.hour-mark {
  border-top: 2px solid #b0b8c4;
  border-bottom: 1px solid var(--color-border);
}
```

---

## 注意点

### パフォーマンス
- 173 セッション × DOM 要素 → レンダリングは軽量
- CSS Grid は大量の行でもブラウザが効率的に処理

### セルの重複
- 同じグリッド位置に複数セルが配置されることはない（データ側で重複排除済み）
- `margin: 1px` でセル間に隙間を確保
