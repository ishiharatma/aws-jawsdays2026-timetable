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

## 外部リンクの共通ルール

外部リンクは必ず以下を付ける:

```html
target="_blank" rel="noopener"
```

- `target="_blank"`: 新しいタブで開く
- `rel="noopener"`: セキュリティ対策（opener への参照を遮断）
- `rel="noreferrer"` はリファラーも送らない場合に追加（より強い制限）
