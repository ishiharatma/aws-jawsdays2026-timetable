# セッション競合検出ロジック (参加予定機能)

## 概要

参加予定の編集モードで、選択済みセッションと時間が重なるセッションをブロック（選択不可）にするロジック。

## 実装箇所

`public/app.js` — `sessionConflicts(checked, target)` 関数

## 正しい競合判定ロジック

### 基本方針

**「target（対象セッション）の開始時刻が、checked（選択済みセッション）の実施中に重なる場合のみブロック」**

```javascript
function sessionConflicts(checked, target) {
  const targetStart = timeToMinutes(target.start);
  const checkedStart = timeToMinutes(checked.start);
  const checkedEnd = timeToMinutes(checked.end);
  return checkedStart <= targetStart && targetStart < checkedEnd;
}
```

判定式: `checked.start <= target.start < checked.end`

### 判定例

| checked（選択済み） | target（対象） | 結果 | 理由 |
|---|---|---|---|
| 11:30–11:50 | 11:00–11:50 | 許可 ✓ | target は 11:00 に開始→ 11:30 より前なのでチェック可 |
| 11:00–11:20 | 11:00–11:50 | ブロック ✗ | target は 11:00 に開始→ checked 実施中 [11:00, 11:20) に該当 |
| 11:00–11:50 | 11:30–11:50 | ブロック ✗ | target は 11:30 に開始→ checked 実施中 [11:00, 11:50) に該当 |
| 11:00–11:20 | 11:30–11:50 | 許可 ✓ | target は 11:30 に開始→ checked は 11:20 に終了済み |

## 旧ロジックの問題点

```javascript
// 旧実装（誤り）
function sessionConflicts(checked, target) {
  if (!sessionsOverlap(checked, target)) return false;
  return timeToMinutes(checked.end) >= timeToMinutes(target.end);
}
```

| ケース | 旧ロジック | 正しい挙動 | 問題 |
|---|---|---|---|
| checked=11:30–11:50, target=11:00–11:50 | ブロック（end同士が710=710） | 許可すべき | **誤りでブロック** |
| checked=11:00–11:20, target=11:00–11:50 | 許可（680 < 710） | ブロックすべき | **誤りで許可** |

## 設計の考え方

「セッション A の開始時刻に自分が空いているか」を基準にする。

- target の開始時刻 < checked の開始時刻 → target が先に始まる → その時間帯は空きなのでチェック可
- target の開始時刻が checked の実施中に重なる → checked を途中で抜けないとtarget に参加できない → ブロック
- target の開始時刻 >= checked の終了時刻 → checked が先に終わっている → チェック可

この方針は「セッションを最初から参加することを前提」にしているが、
前のセッションが終わる前に始まる長いセッション（例: 11:00–11:50 を 11:30 以降に途中参加）は
意図的にチェック可能にしている。
