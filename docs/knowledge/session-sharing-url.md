# セッション共有 URL (クエリパラメータでチェック状態を共有)

## 概要

チェック済みセッションの状態をクエリパラメータで URL エンコードし、他のユーザーやデバイスと共有できる機能。

## URL 形式

```
https://.../?share=1,5,23,42
```

- パラメータ名: `share`
- 値: チェック済みセッション ID をカンマ区切りで並べたもの（数値の昇順）
- セッションが未選択の場合は `share` パラメータなし

## 実装ポイント

### `buildShareUrl()` — URL 生成

```javascript
function buildShareUrl() {
  const ids = Array.from(checkedSessions).sort((a, b) => a - b);
  const url = new URL(window.location.href);
  url.search = "";
  if (isDebugMode) url.searchParams.set("mode", "debug");
  if (ids.length > 0) {
    url.searchParams.set("share", ids.join(","));
  }
  return url.toString();
}
```

- 既存のクエリパラメータをリセットしてから再構築する（余計なパラメータを除去）
- デバッグモードの `mode=debug` は意図的に含めない（X に投稿するURLにデバッグパラメータを乗せない）

### `loadFromShareUrl()` — URL 読み込み

```javascript
function loadFromShareUrl() {
  const params = new URLSearchParams(window.location.search);
  const shareParam = params.get("share");
  if (!shareParam) return false;
  const ids = shareParam.split(",").map(Number).filter(n => !isNaN(n) && n > 0);
  if (ids.length > 0) {
    checkedSessions = new Set(ids);
    // URLをきれいにする（share パラメータ除去）
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete("share");
    history.replaceState(null, "", cleanUrl.toString());
    return true;
  }
  return false;
}
```

- `init()` 内で `loadCheckedSessions()`（Cookie）の **直後** に呼び出す
- **自分の保存データ（Cookie）がある場合は共有データを無視**、ない場合のみ共有データを使用
- ロード後は `history.replaceState()` で URL を清潔に保つ（ブックマーク汚染防止）

### ロード優先順位

```
Cookie → Share URL（Cookie が空の場合のみ適用）→ renderTimetable()
```

#### バグ修正履歴: 自分のデータが共有データに上書きされる問題 (2026-02)

**症状**: 共有 URL を開いた後に「参加予定」ボタンを押すと、自分の保存した予定ではなく共有された予定が表示される。

**原因**: `loadFromShareUrl()` が `checkedSessions.size` を確認せずに常に上書きしていた。

```javascript
// 修正前（問題のあるコード）
if (ids.length > 0) {
  checkedSessions = new Set(ids); // 自分のデータを無条件で上書き
}

// 修正後
if (ids.length > 0) {
  if (checkedSessions.size === 0) { // 自分のデータがない場合のみ適用
    checkedSessions = new Set(ids);
  }
}
```

**解決策**: `checkedSessions.size === 0` の条件を追加して、自分の保存データがある場合は共有データを無視するよう変更。

### 編集モードとの共存

- 編集モード開始時にシェアボタンを `hidden` にする（操作の混乱を防ぐ）
- 編集モード終了時に再表示する

### X (Twitter) 投稿連携

クリップボードコピーから X への直接投稿に変更。

```javascript
shareUrlBtn.addEventListener("click", () => {
  const url = buildShareUrl();
  const text = `参加予定のセッションです！\n${url}\n#jawsdays2026 #jawsug`;
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(tweetUrl, "_blank", "noopener");
});
```

- `twitter.com/intent/tweet?text=` に `encodeURIComponent` でエンコードしたテキストを渡す
- `window.open` の第3引数に `"noopener"` を指定（セキュリティ）
- ツイート本文: 「参加予定のセッションです！\n{share URL}\n#jawsdays2026 #jawsug」
- `buildShareUrl()` が生成する URL はそのままツイートに含まれるため、受け取った人がアクセスすると共有セッションが反映される

#### Twitter Web Intent 仕様

- URL: `https://twitter.com/intent/tweet`
- パラメータ: `text` (URL エンコードしたツイート本文)
- ログイン済みならそのままポスト画面へ、未ログインならログイン後にポスト画面へ遷移

## セキュリティ考慮

- Share URL の ID は数値フィルタ（`!isNaN(n) && n > 0`）で不正値を除去
- 自分の保存データ（Cookie）がある場合は共有 URL のデータを無視する（自分のデータを守る）
- `window.open` には必ず `"noopener"` を指定する

## UX 設計

- ボタンラベルは「Xに投稿」、X ロゴアイコン付き
- クリックすると X の投稿画面が新規タブで開く
- 編集モード中は非表示（保存/キャンセル中の誤操作防止）
- セッション未選択時でもボタンは押せる（ベース URL が含まれたツイート画面が開く）
