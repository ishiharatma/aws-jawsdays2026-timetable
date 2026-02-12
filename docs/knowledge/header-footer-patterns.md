# ヘッダー・フッターの UI パターン

## Google Maps リンク

場所名の後ろに地図ピンアイコンを添えて Google Maps を新しいタブで開くパターン。

```html
<a href="https://www.google.com/maps/search/サンシャインシティ+池袋"
   target="_blank" rel="noopener" class="venue-link">
  池袋サンシャインシティ
  <svg class="map-icon" width="14" height="14" viewBox="0 0 24 24"
       fill="none" stroke="currentColor" stroke-width="2"
       stroke-linecap="round" stroke-linejoin="round"
       aria-label="Google Mapで開く">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
</a>
```

```css
.venue-link {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
.map-icon {
  vertical-align: middle;
  flex-shrink: 0;
}
```

### Google Maps URL パターン
- 検索URL: `https://www.google.com/maps/search/検索語句` (日本語OK、スペースは+)
- 座標指定: `https://www.google.com/maps?q=緯度,経度`
- 短縮URL (`maps.app.goo.gl/...`) はハードコードしない（外部サービス依存）

---

## X (Twitter) アカウントリンク

Xのロゴ SVG + アカウント名でリンクするパターン。

```html
<a href="https://x.com/jawsdays" target="_blank" rel="noopener" class="x-account-link">
  <svg class="x-icon" width="13" height="13" viewBox="0 0 24 24"
       fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
  @jawsdays
</a>
```

- X の SVG パスは公式ロゴ形状
- `aria-hidden="true"` をSVGに付け、テキストでアカウント名を表示する
- URL は `https://x.com/{アカウント名}`

---

## コピーライトフッター

```html
<footer class="site-footer">
  <p>&copy; 2026 <a href="https://ishiharatma.github.io/" target="_blank" rel="noopener">issy</a>.
  This is an unofficial timetable viewer for JAWS DAYS 2026.</p>
</footer>
```

```css
.site-footer {
  background: var(--color-header);
  color: #a0aab4;
  text-align: center;
  padding: 10px 24px;
  font-size: 0.8rem;
  flex-shrink: 0;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.site-footer a {
  color: var(--color-accent);
  text-decoration: none;
}
.site-footer a:hover {
  text-decoration: underline;
}
```

- フッターをインラインスクロールレイアウトで使う場合は `flex-shrink: 0` 必須
- スクロールトップボタンを `position: fixed` で使う場合、`bottom` をフッター高さ分ずらす

---

## イベント開催状態バッジ

イベントの開催状態（開催前/開催中/開催終了）をヘッダーに表示するパターン。

```html
<span id="event-status" class="event-status"></span>
```

```javascript
function getEventStatus() {
  // JST時刻で判定
  // 開催日前: 🗓️ 開催前
  // 開催日当日 開始前: 🗓️ 開催前
  // 開催日当日 開始〜終了: 🎉 開催中
  // 開催日当日 終了後〜: ✅ 開催終了
  // 開催日後: ✅ 開催終了
}
```

```css
.event-status { font-size: 0.8rem; font-weight: 600; padding: 2px 8px; border-radius: 10px; }
.event-status-before  { background: rgba(160,170,180,0.2); color: #a0aab4; }
.event-status-current { background: rgba(52,199,89,0.2);  color: #34c759; }
.event-status-after   { background: rgba(255,153,0,0.2);  color: var(--color-accent); }
```

- JS の `setInterval` で定期更新（CURRENT_CHECK_INTERVAL と同じ間隔でよい）

---

## X ハッシュタグリンク（ポスト intent）

ハッシュタグをクリックすると X のポスト画面を開くパターン。

```html
<a href="https://x.com/intent/post?text=%23jawsdays2026%20%23jawsug"
   target="_blank" rel="noopener" class="x-hashtag-link">
  <svg ...><!-- X icon --></svg>
  #jawsdays2026
</a>
```

タイムテーブルのトラックヘッダーハッシュタグへの応用:
```javascript
const hashtagXUrl = `https://x.com/intent/post?text=${encodeURIComponent(`#jawsdays2026 #jawsug ${track.hashtag}`)}`;
th.innerHTML = `${track.name}<span class="track-hashtag"><a href="${hashtagXUrl}" target="_blank" rel="noopener">${track.hashtag}</a></span>`;
```

- `encodeURIComponent` で URL エンコードする
- ハッシュタグは `#` を含む文字列で渡す

---

## フッターに GitHub / X リンクを追加する

フッターに区切り `|` でリンクを並べるパターン。GitHub アイコン（SVG）と X アイコンを使用。

```html
<footer class="site-footer">
  <p>
    &copy; 2026 <a href="..." target="_blank" rel="noopener">issy</a>. ...
    |
    <a href="https://github.com/{user}/{repo}" target="_blank" rel="noopener" class="footer-link">
      <svg class="footer-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.167 6.839 9.49..."/>
      </svg>
      GitHub
    </a>
    |
    <a href="https://x.com/{account}" target="_blank" rel="noopener" class="footer-link">
      <svg class="footer-icon" width="14" height="14" ...><!-- X icon --></svg>
      @{account}
    </a>
  </p>
</footer>
```

```css
.footer-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.footer-icon {
  vertical-align: middle;
  flex-shrink: 0;
}
```

- GitHub SVG: `viewBox="0 0 24 24"` の公式 Octicon パスを使用
- フッターの高さ (`--footer-height: 40px`) はリンクが増えても inline なので変更不要
- `aria-hidden="true"` をアイコン SVG に付け、テキストラベルで意味を伝える

---

## 外部リンクの共通ルール

外部リンクは必ず以下を付ける:

```html
target="_blank" rel="noopener"
```

- `target="_blank"`: 新しいタブで開く
- `rel="noopener"`: セキュリティ対策（opener への参照を遮断）
- `rel="noreferrer"` はリファラーも送らない場合に追加（より強い制限）

---

## X ハッシュタグ検索リンク（Latest/最新 タブ）

ハッシュタグをクリックすると X の最新投稿検索画面を開くパターン。

```html
<a href="https://x.com/search?q=%23jawsug+%23jawsdays2026+%23jawsdays2026%E5%8B%95%E7%94%BB%E3%83%AA%E3%83%AC%E3%83%BC&f=live"
   target="_blank" rel="noopener" class="x-video-relay-link">
  <svg class="x-icon" ...><!-- X icon --></svg>
  jawsdays2026動画リレー
</a>
```

- `f=live` パラメータで「最新（Latest）」タブを指定
- `q=` に複数ハッシュタグを URL エンコードして指定（スペースは `+` または `%20`）
- 日本語ハッシュタグ: 例 `#jawsdays2026動画リレー` → `%23jawsdays2026%E5%8B%95%E7%94%BB%E3%83%AA%E3%83%AC%E3%83%BC`

---

## モバイル向けハンバーガーメニュー

デスクトップでは全リンクを表示し、モバイルではハンバーガーに収納するパターン。

### HTML 構造

```html
<header class="site-header">
  <div class="header-content">
    <h1>タイトル</h1>

    <!-- ハンバーガーで格納されるナビゲーション -->
    <nav class="header-nav" id="header-nav" aria-label="ナビゲーション">
      <p class="event-meta">
        <!-- 常時表示させたくないリンク群 -->
        <!-- モバイルでは .desktop-hashtag を非表示 -->
        <a class="x-hashtag-link desktop-hashtag">#jawsdays2026</a>
      </p>
    </nav>

    <!-- 常時表示のアクション群 -->
    <div class="header-actions">
      <!-- モバイルのみ常時表示 -->
      <a class="x-hashtag-link mobile-hashtag">#jawsdays2026</a>
      <button id="edit-check-btn" class="btn btn-edit">参加予定</button>
      <!-- ハンバーガーボタン (モバイルのみ表示) -->
      <button id="hamburger-btn" class="hamburger-btn" aria-expanded="false">
        <svg class="hamburger-icon"><!-- 3本線 --></svg>
        <svg class="close-icon" style="display:none"><!-- X --></svg>
      </button>
    </div>
  </div>
</header>
```

### CSS のポイント

```css
/* デスクトップ */
.mobile-hashtag { display: none; }
.hamburger-btn  { display: none; }
.header-nav     { flex: 1; }

@media (max-width: 768px) {
  .mobile-hashtag { display: inline-flex; }
  .hamburger-btn  { display: flex; }

  /* header-nav は order:10 + width:100% で flex 折り返しで下段に配置 */
  .header-nav {
    flex: none;
    order: 10;
    width: 100%;
    display: none; /* デフォルト非表示 */
  }
  .header-nav.open { display: block; }

  .desktop-hashtag { display: none; }

  /* header-content は flex-wrap: wrap にして折り返しを許可 */
  .header-content { flex-wrap: wrap; }
}
```

### JS のポイント

```javascript
hamburgerBtn.addEventListener("click", () => {
  const isOpen = headerNav.classList.toggle("open");
  hamburgerBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
  hamburgerBtn.querySelector(".hamburger-icon").style.display = isOpen ? "none" : "";
  hamburgerBtn.querySelector(".close-icon").style.display    = isOpen ? "" : "none";
});
```

---

## モバイルでのプルツーリフレッシュ対応

デスクトップでは `html, body { overflow: hidden }` + スクロール要素のみスクロール設計。
モバイルでは body を自然スクロールに切り替えてブラウザのプルツーリフレッシュを有効にする。

```css
@media (max-width: 768px) {
  html, body {
    height: auto;
    overflow: auto;
    overscroll-behavior-y: auto; /* プルツーリフレッシュを許可 */
  }
  body {
    min-height: 100vh;
    display: block;
    /* 固定ヘッダー・フッター分のパディング（JS で実測値に更新） */
    padding-top: var(--site-header-height, 52px);
    padding-bottom: var(--site-footer-height, 42px);
  }
  .timetable-container {
    overflow: visible;  /* body スクロールに委ねる */
    flex: none;
    height: auto;
  }
}
```

### JS での対応

スクロールイベントリスナーを `timetableContainer` と `window` の両方に登録し、
モバイルかどうかで振り分ける。

```javascript
function isMobileLayout() {
  return window.innerWidth <= 768;
}

// スクロール量の取得
const scrolled = isMobileLayout() ? window.scrollY : timetableContainer.scrollTop;

// スクロールトップ
if (isMobileLayout()) {
  window.scrollTo({ top: 0, behavior: "smooth" });
} else {
  timetableContainer.scrollTo({ top: 0, behavior: "smooth" });
}

// 自動スクロール (イベント当日の現在時刻へ)
if (isMobileLayout()) {
  const rect = targetLabel.getBoundingClientRect();
  // siteHeader.offsetHeight で実際のヘッダー高さを取得
  const headerOffset = siteHeader ? siteHeader.offsetHeight + 8 : 60;
  const scrollTop = window.scrollY + rect.top - headerOffset;
  window.scrollTo({ top: Math.max(0, scrollTop), behavior: "smooth" });
}
```

---

## モバイルでのヘッダー・フッター固定（position: fixed）

### 問題: sticky ヘッダーの水平スクロール時の切れ

`position: sticky` はドキュメントの水平オーバーフローを考慮しない。
タイムテーブルが横に長く（8トラック × `--track-width`）水平スクロールが発生すると、
sticky ヘッダーはビューポート内に留まるが、幅がビューポート幅に制限されるため
右端が「途切れて」見える。

### 解決策: position: fixed + body パディング

```css
@media (max-width: 768px) {
  /* fixed は常にビューポート全幅に広がるため水平スクロールで切れない */
  .site-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    z-index: 200;
  }
  .site-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    z-index: 200;
  }
  body {
    /* fixed 要素の分だけボディをオフセット */
    padding-top: var(--site-header-height, 52px);
    padding-bottom: var(--site-footer-height, 42px);
  }

  /* テーブルヘッダーを fixed ページヘッダーの直下に sticky */
  .track-header {
    top: var(--site-header-height, 52px);
  }
  /* テーブルフッターを fixed ページフッターの直上に sticky */
  .track-header-bottom {
    bottom: var(--site-footer-height, 42px);
  }
  /* スクロールトップボタンも fixed フッターの上に */
  .scroll-top-btn {
    bottom: calc(var(--site-footer-height, 42px) + 12px);
  }
}
```

### JS: ヘッダー高さを CSS 変数に設定

ハンバーガーを開くとヘッダー高さが変わるため、JS で実測して CSS 変数を更新する。

```javascript
function updateLayoutHeights() {
  if (!isMobileLayout()) return;
  if (siteHeader) {
    document.documentElement.style.setProperty(
      "--site-header-height",
      siteHeader.offsetHeight + "px"
    );
  }
  if (siteFooter) {
    document.documentElement.style.setProperty(
      "--site-footer-height",
      siteFooter.offsetHeight + "px"
    );
  }
}

// 呼び出しタイミング:
// 1. init() 時 (初回計測)
// 2. window.resize イベント
// 3. ハンバーガー toggle 後 (requestAnimationFrame でレンダリング後に計測)
hamburgerBtn.addEventListener("click", () => {
  // ...toggle処理...
  requestAnimationFrame(updateLayoutHeights);
});
window.addEventListener("resize", updateLayoutHeights);
```

---

## モバイルでの4トラック全幅表示

CSS カスタムプロパティで track-width を動的計算し、4トラックを画面幅に収める。

```css
@media (max-width: 768px) {
  :root {
    --time-col-width: 44px;
    /* 左右パディング合計 32px を除いた幅を 4 等分 */
    --track-width: calc((100vw - 44px - 32px) / 4);
  }
  .timetable-wrapper {
    padding: 8px 16px; /* 左右 16px = 合計 32px */
    min-width: 0;
    justify-content: flex-start;
    min-height: auto;
  }
}
```

JS 側では `gridTemplateColumns` に CSS 変数参照を設定しているため、
メディアクエリで変数を上書きするだけで自動的に反映される。

```javascript
timetableEl.style.gridTemplateColumns =
  `var(--time-col-width) repeat(${numTracks}, var(--track-width))`;
```
