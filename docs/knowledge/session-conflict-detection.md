# セッション競合検出ロジック (参加予定機能)

## 概要

参加予定の編集モードで、選択済みセッションと時間が重なるセッションをブロック（選択不可）にするロジック。

## 実装箇所

`public/app.js` — `sessionConflicts(checked, target)` 関数

## 正しい競合判定ロジック（第4世代・現行）

### 基本方針

**「target と checked の時間帯が1分でも重なる場合はブロック」**（標準的な区間重複判定）

```javascript
function sessionConflicts(checked, target) {
  const targetStart = timeToMinutes(target.start);
  const targetEnd = timeToMinutes(target.end);
  const checkedStart = timeToMinutes(checked.start);
  const checkedEnd = timeToMinutes(checked.end);
  return targetStart < checkedEnd && checkedStart < targetEnd;
}
```

判定式: `target.start < checked.end AND checked.start < target.end`

### 判定例

| checked（選択済み） | target（対象） | 結果 | 理由 |
|---|---|---|---|
| 11:00–11:20 | 11:00–11:50 | ブロック ✗ | 11:00〜11:20 が重複 |
| 11:30–11:50 | 11:00–11:50 | ブロック ✗ | 11:30〜11:50 が重複 |
| 11:00–11:50 | 11:30–11:50 | ブロック ✗ | 11:30〜11:50 が重複 |
| 11:00–11:50 | 11:00–11:20 | ブロック ✗ | 11:00〜11:20 が重複 |
| 12:00–12:15 | 12:00–13:30 | ブロック ✗ | 12:00〜12:15 が重複 |
| 12:00–13:30 | 12:00–12:15 | ブロック ✗ | 12:00〜12:15 が重複 |
| 11:00–11:20 | 11:30–11:50 | 許可 ✓ | 時間帯が連続するが重複なし |
| 11:00–11:20 | 11:20–11:40 | 許可 ✓ | 隣接（11:20 == 11:20）は重複なし |

### 複数選択時の重要なケース（バグ修正のきっかけ）

| checked1 | checked2 | target | 結果 | 旧挙動 |
|---|---|---|---|---|
| 11:00–11:20 | 11:30–11:50 | 11:00–11:50 | ブロック ✗ | 許可（バグ）|

①(11:00-11:20) と②(11:30-11:50) を選択済みの場合、③(11:00-11:50) は
いずれか一方と重複するためブロックされる。

## バグ履歴

### 第3世代（直前の実装、バグあり）

```javascript
// target が checked に包含される場合のみブロック
return checkedStart <= targetStart && targetStart < checkedEnd && targetEnd <= checkedEnd;
```

**問題**: checked が target を内包する方向のみ検出し、逆方向（target が checked より長い）を見逃す。

| ケース | 旧ロジック | 正しい挙動 | 問題 |
|---|---|---|---|
| checked=11:00–11:20, target=11:00–11:50 | 許可（11:50 > 11:20） | ブロックすべき | **誤りで許可** |
| checked=11:30–11:50, target=11:00–11:50 | 許可（11:00 < 11:30） | ブロックすべき | **誤りで許可** |

**根本的な問題**: 複数の短いセッション（①②）が組み合わさって長いセッション（③）の
時間帯を覆っていても、個々の checked が③を包含しないためブロックされなかった。

### 第1世代（誤り）

```javascript
function sessionConflicts(checked, target) {
  if (!sessionsOverlap(checked, target)) return false;
  return timeToMinutes(checked.end) >= timeToMinutes(target.end);
}
```

### 第2世代（開始時刻のみ判定、部分的に誤り）

```javascript
return checkedStart <= targetStart && targetStart < checkedEnd;
```

**問題**: 同じ開始時刻かつ target が checked より長い場合もブロックしてしまう。

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
