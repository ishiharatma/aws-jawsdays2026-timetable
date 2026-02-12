# デバッグ時刻モード (`?mode=debug`)

## 目的

OS の日時を変更せずに、イベント開催日時での画面表示（セッションハイライト・タイムライン・ステータスバッジ）が正しく動作するかを確認するためのデバッグ機能。

## 使い方

```
https://ishiharatma.github.io/aws-jawsdays2026-timetable-unofficial/?mode=debug
```

クエリパラメータ `?mode=debug` を付けてアクセスすると、ヘッダー直下に黄色のデバッグパネルが表示される。

- **仮想日時 (JST)**: `<input type="datetime-local">` で任意の日時を入力
- **プリセットボタン**: 開催前 / 開会直後 / 午前中 / 昼休み / 午後 / 夕方 / 終了後
- **リセット (実時刻)**: デバッグ時刻を解除して実際の時刻に戻す

## 実装方針

### 仮想時刻の集約

時刻関連の関数がすべて `getCurrentDate()` を経由するよう設計。

```javascript
// null = 実時刻, Date オブジェクト = 仮想時刻
let debugDate = null;

function getCurrentDate() {
  return debugDate !== null ? debugDate : new Date();
}
```

### 影響を受ける関数

| 関数 | 用途 |
|---|---|
| `isSessionCurrent()` | セッションの `.current` ハイライト判定 |
| `getCurrentJSTMinutes()` | 現在時刻ラインの位置計算 |
| `isEventDay()` | イベント当日かどうかの判定 |
| `getEventStatus()` | ヘッダーのステータスバッジ (開催前/開催中/開催終了) |

上記 4 関数の `new Date()` を `getCurrentDate()` に置き換えるだけでよい。

### datetime-local の JST 解釈

`datetime-local` 入力値はブラウザのローカル時刻だが、このサービスでは **JST として解釈**する。

```javascript
function applyDebugTime(datetimeStr) {
  // "2026-03-07T09:00" を JST として UTC の Date に変換
  const [datePart, timePart] = datetimeStr.split("T");
  const [y, mo, d] = datePart.split("-").map(Number);
  const [h, min] = timePart.split(":").map(Number);
  // JST = UTC+9 なので UTC = JST - 9h
  debugDate = new Date(Date.UTC(y, mo - 1, d, h - 9, min));
}
```

負の時刻 (例: 08:00 JST → UTC h-9 = -1h) も `Date.UTC` が前日 23:00 UTC に正規化するため正しく動作する。

### 非デバッグ時への影響なし

- `isDebugMode` は `?mode=debug` がない場合 `false`
- `setupDebugPanel()` は `isDebugMode === false` なら即 return
- 通常アクセスでは DOM 変更もゼロ

## ハマりポイント

### `applyDebugTime()` 初期呼び出し時の依存関係

`setupDebugPanel()` は `init()` の冒頭で呼ばれるが、その時点では `timetableData` が未ロード。
`updateCurrentSessions()` 等は `timetableData` が null なら早期 return するので問題ない。
`debugDate` はセットされており、後続の `renderTimetable()` 時には正しく反映される。

### 60 秒ポーリングとの共存

既存の `setInterval` は `updateCurrentSessions()` / `updateCurrentTimeLine()` / `updateEventStatus()` を定期呼び出しするが、デバッグ時刻は変化しないため、再描画しても同じ状態が維持される。

## モバイルレイアウトの注意

モバイルでは `.site-header` が `position: fixed` のため、デバッグパネルはスクロール可能なコンテンツの先頭に表示される。スクロールすると隠れるが、デバッグ用途なので許容範囲。
