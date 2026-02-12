# インラインスクロールレイアウトの実装

## 概要

タイムテーブルをブラウザ全体でスクロールさせるのではなく、
ヘッダー・フッターを固定したまま中央エリアだけをスクロールさせるレイアウト。

---

## 基本構造 (Flex Column Layout)

```
html, body                → height: 100%; overflow: hidden
  body                    → display: flex; flex-direction: column
    .site-header          → flex-shrink: 0 (固定)
    .timetable-container  → flex: 1; overflow: auto; min-height: 0  ← スクロールコンテナ
      .timetable-wrapper  → min-width: fit-content; display: flex; justify-content: center
        .timetable        → (CSS Grid) align-self: flex-start
    .site-footer          → flex-shrink: 0 (固定)
```

### キーポイント

- `html, body { height: 100%; overflow: hidden }` — ページ全体のスクロールを無効化
- `.timetable-container { flex: 1; min-height: 0 }` — **`min-height: 0` が必須**。
  Flexbox のデフォルトは `min-height: auto` で、コンテンツ高さより小さくならないため
  overflow が効かない。`min-height: 0` で初めて `overflow: auto` が機能する。
- `.site-header` に `position: sticky` は不要。Flexレイアウトで自然に固定される。

---

## CSS Grid の Sticky ヘッダー修正

### 問題

```css
/* 旧: ページ全体スクロール前提 → インラインスクロール後は機能しない */
.track-header {
  position: sticky;
  top: var(--site-header-height);  /* サイトヘッダー分オフセット */
}
```

ページ全体スクロール時は `top: サイトヘッダー高さ` でサイトヘッダーの下に固定できたが、
スクロールコンテナを `.timetable-container` に変更した場合、
sticky の基準はコンテナの先頭になるため `top: 0` が正しい。

### 解決策

```css
/* 新: スクロールコンテナ(.timetable-container)の先頭を基準に */
.track-header {
  position: sticky;
  top: 0;
}

.track-header-bottom {
  position: sticky;
  bottom: 0;
}

.time-label {
  position: sticky;
  left: 0;
}
```

### CSS Grid で Sticky が効く条件

1. sticky 要素の**スクロールコンテナ**（= overflow が auto/scroll の先祖要素）が存在する
2. スクロールコンテナと sticky 要素の**間の要素が overflow: visible**（デフォルト）である
3. CSS Grid の直接の子要素に `position: sticky` を付ける場合は動作する

> **注意**: `display: grid` 自体は sticky の妨げにならない。
> ただし、grid コンテナに `overflow: hidden` などを付けると sticky が効かなくなる。

---

## タイムテーブルの中央揃え

横スクロールが必要な場合の中央揃えは通常の `margin: 0 auto` では不十分。
`min-width: fit-content` の wrapper で flex center を使う。

```css
.timetable-wrapper {
  min-width: fit-content;     /* 横スクロール時にコンテンツが潰れない */
  min-height: 100%;
  display: flex;
  justify-content: center;    /* タイムテーブルを中央揃え */
  padding: 16px 24px;
}

.timetable {
  width: fit-content;
  align-self: flex-start;     /* 縦方向は上揃え */
}
```

---

## スクロール制御のJS変更点

スクロールコンテナが `window` から DOM 要素に変わったため、
イベントリスナーとスクロール操作を変更する。

```js
// Before (window scroll)
window.addEventListener("scroll", handler);
window.scrollTo({ top: y, behavior: "smooth" });

// After (container scroll)
const container = document.getElementById("timetable-container");
container.addEventListener("scroll", handler);
container.scrollTo({ top: y, behavior: "smooth" });

// スクロール位置の読み取り
// Before: window.scrollY
// After:  container.scrollTop
```

---

## 固定ページ内スクロールのUI考慮点

- **スクロールトップボタン**: `position: fixed` は viewport 基準なので変更不要。
  ただし `bottom` の値はフッター高さを考慮して `bottom: フッター高さ + 余白` にする。
- **モーダル**: `position: fixed; inset: 0` は viewport 基準なので変更不要。
- **自動スクロール**: コンテナへの `scrollTo` に変更し、サイトヘッダー高さのオフセット計算は不要になる。

---

## 現在時刻スクロール: CSS変数計算 vs DOM offsetTop

### 問題: CSS変数から手動計算するとズレる

```js
// NG: CSS変数 + trackHeaderHeight を加算していたが誤差が大きかった
const rowHeight = parseFloat(
  getComputedStyle(document.documentElement).getPropertyValue("--row-height")
);
const scrollTarget = containerPadding + trackHeaderHeight + targetRow * rowHeight - 20;
```

このアプローチの問題点:
- `trackHeaderHeight` (sticky header の実高さ) を加算するのは誤り。
  sticky ヘッダーはスクロール座標系では y=0 にあるため、
  ターゲット時刻の grid 座標 = `targetRow * rowHeight` がそのままスクロール量になる。
  (sticky ヘッダー分を加えると 2〜3 時間分ずれる)
- レスポンシブ対応で `--row-height` が変わる（20px → 16px）が、
  計算タイミングによっては正しい値を取れない場合がある。

### 解決策: DOM の offsetTop を使う

```js
// 1. renderTimetable() で時刻ラベルに data-time 属性を付ける
lbl.dataset.time = time; // e.g. "14:00"

// 2. autoScrollToCurrentTime() で offsetTop を読む
const targetLabel = timetableEl.querySelector(`[data-time="${targetTime}"]`);
if (!targetLabel) return;
const labelTop = targetLabel.offsetTop; // 実際の DOM 上の位置
timetableContainer.scrollTo({ top: Math.max(0, labelTop - 20), behavior: "smooth" });
```

`offsetTop` はブラウザが計算した実際のピクセル位置なので、
CSS変数の値・レスポンシブ変化・padding・行高さすべてを正確に反映する。

---

## 開催中セッションの即時ハイライト

### 問題: setInterval は初回実行しない

```js
renderTimetable(); // 初期レンダリング時に isSessionCurrent() を呼ぶが、
                   // タイミングによっては border に変更がない場合がある
setInterval(updateCurrentSessions, 60000); // 60秒後まで更新されない
```

### 解決策: renderTimetable 直後に即時実行

```js
renderTimetable();
updateCurrentSessions(); // ← ページ読込直後に一度確実に実行
setInterval(updateCurrentSessions, 60000);
```

---

## 開催日以外のスクロール動作

開催日以外に特定時刻（10:00）にスクロールすると、意図しない画面位置になる。
開催日以外は先頭（9:00）を表示するのが自然。

```js
function autoScrollToCurrentTime() {
  if (!isEventDay()) return; // 開催日以外はスクロールしない（先頭表示）
  // ...
}
```

---

## モバイル: 横スクロールが消える問題

### 問題

`@media (max-width: 768px)` で `.timetable-wrapper { min-width: 0 }` を設定すると、
8 トラックのタイムテーブルが viewport 幅を超えても横スクロールバーが表示されない。

**原因**: `min-width: 0` でラッパーが収縮し、body がオーバーフロー量を検知できない。
`html, body { overflow: auto }` は設定済みでも、body の scrollWidth が viewport 幅と
同じになるため横スクロールが発生しない。

### 解決策

```css
@media (max-width: 768px) {
  .timetable-wrapper {
    min-width: fit-content; /* 0 ではなく fit-content で横スクロールを有効化 */
  }
}
```

`fit-content` にすることで:
1. ラッパーがタイムテーブルの実際の幅まで拡張される
2. body がオーバーフロー幅を検知してスクロールバーを表示する

---

## モバイル: 9:00 が隠れる / 19:40 が見えない問題

### 問題

`updateLayoutHeights()` の呼び出しタイミングが早すぎると、
ヘッダー・フッターの `offsetHeight` が正しく計測できない場合がある。

- DOMContentLoaded 直後: フォントが未適用で高さが違う場合がある
- `renderTimetable()` 前の呼び出し: レンダリング後にレイアウトが変わる可能性

### 解決策

複数のタイミングで `updateLayoutHeights()` を呼ぶ:

```js
// 1. init() 内: 同期的に即時実行（既存）
updateLayoutHeights();

// 2. renderTimetable() 直後: レンダリング後に再計測
renderTimetable();
requestAnimationFrame(updateLayoutHeights); // ← 追加

// 3. window.load: フォント・画像ロード後に再計測
window.addEventListener("load", updateLayoutHeights); // ← 追加

// 4. resize: 既存
window.addEventListener("resize", updateLayoutHeights);

// 5. ハンバーガーメニュー open/close 後: 既存
requestAnimationFrame(updateLayoutHeights);
```

これにより、どのタイミングでもヘッダー/フッターの高さを正確に反映できる。
