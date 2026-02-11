# セッション競合検出ロジック (参加予定機能)

## 概要

参加予定の編集モードで、選択済みセッションと時間が重なるセッションをブロック（選択不可）にするロジック。

## 実装箇所

`public/app.js` — `sessionConflicts(checked, target)` 関数

## 正しい競合判定ロジック

### 基本方針

**「target の開始時刻が checked の実施中に該当し、かつ target が checked に包含される（target の終了 ≤ checked の終了）場合のみブロック」**

```javascript
function sessionConflicts(checked, target) {
  const targetStart = timeToMinutes(target.start);
  const targetEnd = timeToMinutes(target.end);
  const checkedStart = timeToMinutes(checked.start);
  const checkedEnd = timeToMinutes(checked.end);
  return checkedStart <= targetStart && targetStart < checkedEnd && targetEnd <= checkedEnd;
}
```

判定式: `checked.start <= target.start < checked.end AND target.end <= checked.end`

### 判定例

| checked（選択済み） | target（対象） | 結果 | 理由 |
|---|---|---|---|
| 11:30–11:50 | 11:00–11:50 | 許可 ✓ | target は 11:00 に開始→ 11:30 より前なのでチェック可 |
| 11:00–11:20 | 11:00–11:50 | 許可 ✓ | target は checked より長い（11:50 > 11:20）→ チェック可 |
| 11:00–11:50 | 11:30–11:50 | ブロック ✗ | target は 11:30 に開始、かつ checked に包含（11:50 ≤ 11:50） |
| 11:00–11:50 | 11:00–11:20 | ブロック ✗ | target は同時開始、かつ checked に包含（11:20 ≤ 11:50） |
| 12:00–12:15 | 12:00–13:30 | 許可 ✓ | target は checked より長い（13:30 > 12:15）→ チェック可 |
| 12:00–13:30 | 12:00–12:15 | ブロック ✗ | target は同時開始、かつ checked に包含（12:15 ≤ 13:30） |
| 11:00–11:20 | 11:30–11:50 | 許可 ✓ | target は 11:30 に開始→ checked は 11:20 に終了済み |

## 旧ロジックの問題点（バグ履歴）

### 第1世代（誤り）

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

### 第2世代（開始時刻のみ判定、部分的に誤り）

```javascript
// 開始時刻が checked の実施中ならブロック（終了時刻を考慮しない）
return checkedStart <= targetStart && targetStart < checkedEnd;
```

**問題**: 同じ開始時刻かつ target が checked より長い場合もブロックしてしまう。

例: checked=12:00–12:15, target=12:00–13:30 → `720 <= 720 && 720 < 735` = true → **誤りでブロック** ❌

## 設計の考え方

「target（対象セッション）が checked（選択済みセッション）に時間的に包含されるかどうか」を基準にする。

- target の開始時刻 < checked の開始時刻 → target が先に始まる → チェック可
- target の開始時刻 >= checked の終了時刻 → checked が先に終わっている → チェック可
- target の開始時刻が checked の実施中かつ target.end > checked.end → target は checked より長い → チェック可
- target の開始時刻が checked の実施中かつ target.end ≤ checked.end → target は checked に包含 → **ブロック**

この方針により、短いセッション（①）をチェック済みでも、それより長いセッション（②）は
「よりスコープが広い選択肢」として選択可能になる。

---

## timetable.json の重複エントリバグ（データ品質）

### 発生したバグ

トラックAの 13:20-14:10 スロットに、実セッション (id:15) と重複する
プレースホルダーエントリが残存し、タイムテーブル上に視覚的に重なって表示された。

```
id:15  track:A  13:20-14:10  「生成AI時代の開発と運用」  ← 実セッション
id:16  track:A  13:40-13:50  「休憩」                    ← 削除すべきプレースホルダー
id:17  track:A  13:50-14:10  「セッション」              ← 削除すべきプレースホルダー
```

### 原因

スクレイパーがセッション枠をプレースホルダーで埋めた後、
実セッションが追加された際に古いプレースホルダーが削除されていなかった。

### 解決策

重複するプレースホルダーエントリ (id:16, id:17) を `timetable.json` から削除。

### 再発防止

- `timetable.json` を更新する際は、同一トラック・時間帯の重複エントリがないか確認する
- 特に「タイトルが `セッション` のエントリ」は確定セッション追加後に削除漏れが起きやすい
