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
