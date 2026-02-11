# 外部サービス連携

## Google カレンダー

### API エンドポイント
```
https://www.google.com/calendar/render?{params}
```

### パラメータ
| パラメータ | 値 |
|-----------|-----|
| `action`   | `TEMPLATE` |
| `text`     | `【トラック】セッション名 by スピーカー` |
| `dates`    | `20260307T{HHMMSS}/20260307T{HHMMSS}` |
| `ctz`      | `Asia/Tokyo` |
| `location` | `池袋サンシャインシティ` |
| `details`  | `Proposal: {URL}` または `JAWS DAYS 2026` |

### 注意点
- `dates` は `YYYYMMDDTHHMMSS` 形式（ISO 8601のコンパクト形式）
- `ctz` を指定することでローカルタイムとして扱われる
- `text` は URL エンコードされる（`URLSearchParams` で自動処理）

## X (Twitter) ポスト

### API エンドポイント
```
https://x.com/intent/post?{params}
```

### パラメータ
| パラメータ | 値 |
|-----------|-----|
| `text`    | ポスト本文（改行含む） |

### テキスト構成
```
{セッションタイトル} by {スピーカー名}
#jawsdays2026 #jawsug #jawsdays2026_{track_letter}
{Proposal URL}
```

### ハッシュタグ
- `#jawsdays2026`: イベント共通
- `#jawsug`: JAWS UG コミュニティ共通
- `#jawsdays2026_{a-h}`: トラック固有（小文字）

### 注意点
- X の intent URL は改行 (`\n`) を含むテキストを `URLSearchParams` で正しくエンコードする
- URL が含まれる場合、X 側で自動的にリンクカード (OGP) を生成する
- テキストの最大長は 280 文字（URL は t.co 短縮で 23 文字扱い）

## fortee.jp (Proposal ページ)

### URL 形式
```
https://fortee.jp/jawsdays-2026/proposal/{UUID}
```

### 動作
- `target="_blank"` で新規タブに開く
- `rel="noopener"` を指定してセキュリティ確保

## Google Analytics (GA4)

### タグの埋め込み方法

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

- `<head>` 内に配置する
- 計測 ID は `G-` で始まる形式（GA4）
- `async` 属性でページ読み込みをブロックしない

## Favicon（外部URL）

```html
<link rel="icon" href="https://example.com/favicon.png">
```

- 外部 URL を favicon に指定できる（ただし CORS に注意）
- JAWS-UG 公式: `https://jaws-ug.jp/assets/images/cropped-favicon-1-32x32.png`
