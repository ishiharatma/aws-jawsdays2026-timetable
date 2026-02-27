# デモ動画・GIF 作成ノウハウ

## 概要

ブラウザ操作のデモを GIF アニメーションとして生成するまでのパイプライン。

```
Playwright (TypeScript)          → recording.webm
  ↓ ローカルサーバーで公開       → ブラウザ操作を録画
make_gif.py (Pillow)             → docs/demo.gif
  ↓ webm フレームを PNG 展開     → キャプション合成 → GIF 生成
Remotion (React / TypeScript)    → （オプション）動画として書き出す別ルート
```

---

## 1. Playwright 録画

### セットアップ

```bash
cd video/playwright
npm install
npx playwright install chromium   # Chromium をローカルにダウンロード
npm run record
```

### ポイント

#### Chromium パスを明示指定する

Playwright のデフォルト検索パスは環境によって異なる。
Docker / headless 環境では `executablePath` を明示的に指定しないと起動失敗する。

```ts
const chromiumPath =
  process.env.CHROMIUM_PATH ??
  "/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome";

const browser = await chromium.launch({
  headless: true,
  executablePath: chromiumPath,
  args: ["--no-proxy-server", "--disable-dev-shm-usage", "--no-sandbox"],
});
```

#### 外部リクエストを遮断する

Google Analytics・Google Fonts などへのネットワークリクエストが発生すると、
DNS 解決待ちでページロードが不安定になる。`page.route()` で遮断する。

```ts
await page.route("**/*", (route) => {
  const url = route.request().url();
  if (
    url.includes("googletagmanager.com") ||
    url.includes("google-analytics.com") ||
    url.includes("fonts.googleapis.com") ||
    url.includes("fonts.gstatic.com")
  ) {
    route.abort();
  } else {
    route.continue();
  }
});
```

#### 動的コンテンツの描画完了を待つ

`waitUntil: "load"` だけでは非同期 fetch が完了していない場合がある。
`waitForSelector` でセッションセルが実際に描画されるまで待つ。

```ts
await page.goto(baseUrl, { waitUntil: "load", timeout: 30000 });
await page.waitForSelector(".session-cell", { timeout: 20000 });
```

#### 録画ファイルのリネーム

`context.recordVideo` を使うと webm がランダムなハッシュ名で保存される。
`context.close()` 後に最新の webm ファイルを取得してリネームする。

```ts
await context.close(); // ← close() が完了するまでファイルが確定しない

const allFiles = fs.readdirSync(outputDir)
  .filter((f) => f.endsWith(".webm") && f !== "recording.webm")
  .map((f) => {
    const full = path.join(outputDir, f);
    return { file: full, mtime: fs.statSync(full).mtimeMs, size: fs.statSync(full).size };
  })
  .filter((f) => f.size > 0)           // 空ファイルを除外
  .sort((a, b) => b.mtime - a.mtime);  // 最新を先頭に

fs.renameSync(allFiles[0].file, outputPath);
```

#### スムーズスクロールの実装

`page.mouse.wheel()` は要素内スクロールに効かない場合がある。
要素の `scrollBy()` を小刻みに呼ぶことで滑らかなスクロールを再現する。

```ts
async function smoothScroll(page, element, deltaX, deltaY, steps = 20, delayMs = 30) {
  const stepX = deltaX / steps;
  const stepY = deltaY / steps;
  for (let i = 0; i < steps; i++) {
    await page.locator(element).first().evaluate(
      (el, [dx, dy]) => { el.scrollBy(dx, dy); },
      [stepX, stepY]
    );
    await sleep(delayMs);
  }
}
```

---

## 2. GIF 生成 (make_gif.py)

### 必要ライブラリ

```bash
pip install Pillow
# webm → PNG フレーム展開は ffmpeg を使う
ffmpeg -i recording.webm /tmp/frames/frame%04d.png
```

### 重要パラメータ

| 変数 | 値 | 理由 |
|---|---|---|
| `FPS_IN` | 25 | Playwright 録画の実際の fps |
| `FPS_OUT` | 10 | GIF 出力 fps（10fps でファイルサイズを抑制） |
| `STEP` | 2〜3 | 間引き率（`FPS_IN // FPS_OUT`） |
| `TARGET_W × TARGET_H` | 960 × 540 | GIF 解像度（1280×720 では重すぎる） |
| `colors` | 128 | `Image.ADAPTIVE` の色数（256 より小さくするとファイルサイズ削減） |

### 日本語フォントの指定

Pillow のデフォルトフォントは ASCII のみ。日本語キャプションには NotoSansCJK を使用。
フォントが見つからない場合は `ImageFont.load_default()` にフォールバックする。

```python
try:
    font_main = ImageFont.truetype(
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc", FONT_SIZE_MAIN
    )
except (OSError, AttributeError):
    font_main = ImageFont.load_default()
```

Ubuntu / Debian 系のインストール:
```bash
apt-get install -y fonts-noto-cjk
```

### GIF のファイルサイズを抑える工夫

1. **解像度を下げる**: 1280×720 → 960×540 でおよそ半分
2. **fps を落とす**: 25fps → 10fps で 60% 削減
3. **色数を減らす**: 256色 → 128色
4. `optimize=True` を指定（zlib 圧縮を最適化）
5. キャプションバーは画像下部に追加（コンテンツ部分の高さは変えない）

### 結果サイズの目安

| 設定 | サイズ |
|---|---|
| 1280×720, 25fps, 256色 | 〜40MB（大きすぎ） |
| 960×540, 10fps, 256色 | 〜12MB |
| 960×540, 10fps, 128色 | 〜7MB ✅ |

---

## 3. Remotion（React ベース動画合成）

Playwright で録画した webm に React コンポーネントでオーバーレイを重ねる方法。
GIF より高品質な MP4/WebM を生成したい場合に使う。

### 構成

```
video/remotion/
  src/
    Demo.tsx   ← メインコンポジション（Video + Sequence + Caption）
    Root.tsx   ← コンポジション登録
    index.ts   ← エントリポイント
  public/
    recording.webm  ← Playwright 録画素材
```

### フレーム計算

```ts
const FPS = 30;
const s = (sec: number) => Math.round(sec * FPS);

// 例: 4秒〜10秒のシーン
const scene2 = { from: s(4), durationInFrames: s(6) };
```

### フェードイン・フェードアウト

```ts
import { interpolate, Easing, useCurrentFrame } from "remotion";

function fadeIn(frame: number, startFrame: number, durationFrames = 15): number {
  return interpolate(frame, [startFrame, startFrame + durationFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.ease),
  });
}
```

### レンダリングコマンド

```bash
cd video/remotion
npm install
npx remotion render src/index.ts Demo out/demo.mp4
```

---

## 4. ハマりポイント一覧

| 問題 | 原因 | 解決策 |
|---|---|---|
| Playwright 起動失敗 | Chromium が見つからない | `executablePath` を明示指定 |
| ページロードが不安定 | 外部リクエストのタイムアウト | `page.route()` で遮断 |
| セッションが空で録画 | JSON fetch 完了前にスクリーンショット | `waitForSelector` で待機 |
| webm ファイルが空 | `context.close()` 前にリネームした | `close()` の await 後にリネーム |
| GIF が重い | 解像度・fps・色数が多すぎ | 960×540, 10fps, 128色 |
| 日本語が豆腐 | デフォルトフォントが ASCII のみ | NotoSansCJK を明示指定 |
| 録画ファイル名がランダム | Playwright の仕様 | 最新の webm を mtime でソートしてリネーム |
| GIF が Claude で読み込めない | 7MB 超の画像はツール制限あり | リサイズか参照のみで使用 |

---

## 5. .gitignore 設定

`video/` ディレクトリには `node_modules/` が含まれるためルートに `.gitignore` を追加。

```gitignore
node_modules/
```

各サブディレクトリに個別に `.gitignore` を置くより、ルートで統一するほうがシンプル。

---

## 6. デモ動画シナリオ

### 全体構成（約40秒）

| シーン | 時間帯 | 操作内容 | 表示キャプション |
|---|---|---|---|
| Scene 1 | 0〜4s | ページロード・初期表示 | 「JAWS DAYS 2026 カスタムタイムテーブル（非公式）」タイトルカード |
| Scene 2 | 4〜10s | タイムテーブルを横・縦スクロール | 8トラック同時表示 · スピーカーアイコン · Level バッジ |
| Scene 3 | 10〜18s | セッションセルをクリック → モーダル表示 → 閉じる | セッションをクリック → 詳細モーダル表示 |
| Scene 4 | 18〜30s | 「参加予定」ボタン → チェックモード → 3件チェック → 保存 | 「参加予定」ボタンで編集モードに切り替え |
| Scene 5 | 30〜37s | X（旧Twitter）共有ボタンをクリック | 参加予定を URL で共有 · X に投稿 |
| Scene 6 | 37〜40s | ページトップへ戻る → エンディングオーバーレイ | GitHub Pages で無料公開中 |

### シナリオ設計の意図

- **Scene 1**: 最初の数秒でプロジェクト名を刷り込む。タイトルカードはフェードアウトして録画映像に溶け込む。
- **Scene 2**: 横スクロール（Track A→H）→縦スクロール（時間軸）の順で操作性を見せる。
- **Scene 3**: クリック → モーダル表示のインタラクションを強調。モーダルは 2.5s 表示して内容が伝わるよう待機。
- **Scene 4**: 「参加予定」機能がこのアプリのコア機能。チェック・保存の一連の流れを丁寧に見せる。
- **Scene 5**: 共有機能。X 投稿ボタンは新タブが開くため `context.waitForEvent("page")` でキャッチして閉じる。
- **Scene 6**: エンディングは URL を大きく表示して認知を促す。暗めのオーバーレイで画面を締める。

### フレーム数対応表

Playwright 録画（25fps）と Remotion（30fps）でフレーム数が異なるため、
GIF 生成スクリプト（`make_gif.py`）のキャプション範囲は 25fps 基準で定義している。

| シーン | 25fps 範囲（GIF用） | 30fps 範囲（Remotion用） |
|---|---|---|
| Scene 1 | 1〜75 | 0〜119 |
| Scene 2 | 76〜195 | 120〜299 |
| Scene 3 | 196〜340 | 300〜539 |
| Scene 4 | 341〜490 | 540〜899 |
| Scene 5 | 491〜590 | 900〜1109 |
| Scene 6 | 591〜642 | 1110〜1199 |

### シナリオを変更するときの手順

1. `video/playwright/record.ts` の各 Scene コメントブロックを編集（操作内容）
2. `video/remotion/src/Demo.tsx` の `SCENES` 定数と `<Caption>` テキストを更新（Remotion用）
3. `video/make_gif.py` の `CAPTIONS` リストを更新（GIF用）
4. 録画を再実行: `cd video/playwright && npm run record`
5. GIF を再生成: `ffmpeg -i recording.webm /tmp/frames/frame%04d.png && python3 make_gif.py`
