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

## 外部リンクの共通ルール

外部リンクは必ず以下を付ける:

```html
target="_blank" rel="noopener"
```

- `target="_blank"`: 新しいタブで開く
- `rel="noopener"`: セキュリティ対策（opener への参照を遮断）
- `rel="noreferrer"` はリファラーも送らない場合に追加（より強い制限）
