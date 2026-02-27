/**
 * JAWS DAYS 2026 タイムテーブル デモ動画 録画スクリプト
 *
 * 録画内容（台本に沿った操作）:
 *   Scene 1 ( 0s- 4s): ページロード
 *   Scene 2 ( 4s-10s): タイムテーブル横・縦スクロール
 *   Scene 3 (10s-18s): セッション詳細モーダル
 *   Scene 4 (18s-30s): 参加予定チェック → 保存
 *   Scene 5 (30s-37s): URL 共有 (Xに投稿)
 *   Scene 6 (37s-40s): ページトップへ戻る → エンディング
 *
 * 使い方:
 *   cd video/playwright
 *   npm install
 *   npx playwright install chromium
 *   npm run record
 *
 * 出力: ../remotion/public/recording.webm
 */

import { chromium } from "playwright";
import * as path from "path";
import * as http from "http";
import * as fs from "fs";

// ローカル静的ファイルサーバー（public/ を配信）
function startLocalServer(publicDir: string, port: number): Promise<http.Server> {
  const mimeTypes: Record<string, string> = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
  };

  const server = http.createServer((req, res) => {
    const urlPath = req.url === "/" ? "/index.html" : (req.url ?? "/index.html");
    const filePath = path.join(publicDir, urlPath.split("?")[0]);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("Not Found");
        return;
      }
      const ext = path.extname(filePath);
      res.writeHead(200, { "Content-Type": mimeTypes[ext] ?? "application/octet-stream" });
      res.end(data);
    });
  });

  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function smoothScroll(
  page: import("playwright").Page,
  element: string | null,
  deltaX: number,
  deltaY: number,
  steps = 20,
  delayMs = 30
) {
  const stepX = deltaX / steps;
  const stepY = deltaY / steps;
  for (let i = 0; i < steps; i++) {
    if (element) {
      await page.locator(element).first().evaluate(
        (el, [dx, dy]) => { el.scrollBy(dx, dy); },
        [stepX, stepY]
      );
    } else {
      await page.mouse.wheel(stepX, stepY);
    }
    await sleep(delayMs);
  }
}

async function main() {
  const publicDir = path.resolve(__dirname, "../../public");
  const outputDir = path.resolve(__dirname, "../remotion/public");
  const outputPath = path.join(outputDir, "recording.webm");

  fs.mkdirSync(outputDir, { recursive: true });

  // ローカルサーバー起動
  const port = 18080;
  const server = await startLocalServer(publicDir, port);
  const baseUrl = `http://localhost:${port}`;
  console.log(`Local server: ${baseUrl}`);

  // キャッシュ済みの Chromium を使用（ダウンロード不要）
  const chromiumPath =
    process.env.CHROMIUM_PATH ??
    "/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome";

  const browser = await chromium.launch({
    headless: true,
    executablePath: chromiumPath,
    args: [
      "--no-proxy-server",          // プロキシを使わない
      "--disable-dev-shm-usage",    // Docker 環境での安定性
      "--no-sandbox",
    ],
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: outputDir,
      size: { width: 1280, height: 720 },
    },
    // クッキーを空にして初期状態で録画
  });

  const page = await context.newPage();

  // ページのコンソールエラーをデバッグ出力
  page.on("console", (msg) => {
    if (msg.type() === "error") console.error("[browser]", msg.text());
  });
  page.on("pageerror", (err) => console.error("[pageerror]", err.message));
  page.on("requestfailed", (req) =>
    console.warn("[requestfailed]", req.url(), req.failure()?.errorText)
  );

  // 外部リクエスト（Google Analytics 等）を遮断してロードを安定化
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

  // ============================================================
  // Scene 1: ページロード（0〜4s）
  // ============================================================
  console.log("Scene 1: ページロード");
  await page.goto(baseUrl, { waitUntil: "load", timeout: 30000 });
  // timetable.json の非同期 fetch + DOM 描画を waitForSelector でポーリング待ち
  await page.waitForSelector(".session-cell", { timeout: 20000 });
  console.log("Session cells rendered");
  await sleep(1000); // 追加描画余韻

  // ============================================================
  // Scene 2: タイムテーブル スクロール（4〜10s）
  // ============================================================
  console.log("Scene 2: スクロール");
  const wrapper = ".timetable-wrapper";

  // 横スクロール: Track A → H
  await smoothScroll(page, wrapper, 800, 0, 40, 50);
  await sleep(500);

  // 縦スクロール: 時間軸に沿って下
  await smoothScroll(page, wrapper, 0, 500, 30, 60);
  await sleep(500);

  // ============================================================
  // Scene 3: セッション詳細モーダル（10〜18s）
  // ============================================================
  console.log("Scene 3: モーダル");

  // 最初のクリック可能なセッションセルを選択（non-session は除外）
  const sessionCard = page.locator(".session-cell:not(.non-session)").first();
  await sessionCard.scrollIntoViewIfNeeded();
  await sleep(500);
  await sessionCard.click();
  await sleep(1000);

  // モーダルが表示されるのを待つ
  await page.waitForSelector("#session-modal:not(.hidden)", { timeout: 3000 });
  await sleep(2500);

  // モーダルを閉じる
  await page.locator("#modal-close-btn").click();
  await sleep(800);

  // ============================================================
  // Scene 4: 参加予定チェック（18〜30s）
  // ============================================================
  console.log("Scene 4: チェックモード");

  // ページトップ付近にスクロールして操作しやすくする
  await page.locator(wrapper).evaluate((el) => el.scrollTo(0, 0));
  await sleep(500);

  // 「参加予定」ボタンをクリックしてチェックモードに
  await page.locator("#edit-check-btn").click();
  await sleep(800);

  // 3つのセッションをチェック（.session-cell かつ .non-session でないもの）
  const checkableCards = page.locator(".session-cell:not(.non-session)");
  const count = await checkableCards.count();
  const targets = Math.min(3, count);

  for (let i = 0; i < targets; i++) {
    const card = checkableCards.nth(i);
    await card.scrollIntoViewIfNeeded();
    await sleep(300);
    await card.click();
    await sleep(500);
  }

  await sleep(800);

  // 「保存」ボタンをクリック
  await page.locator("#save-check-btn").click();
  await sleep(1200);

  // ============================================================
  // Scene 5: URL 共有（30〜37s）
  // ============================================================
  console.log("Scene 5: 共有");

  // Xに投稿ボタン（共有）をクリック
  // 実際には新しいタブが開くがデモなのでダイアログをキャッチして閉じる
  page.on("dialog", async (dialog) => {
    await sleep(1500);
    await dialog.dismiss();
  });

  // 新しいページが開く場合はそのままにして閉じる
  const [newPage] = await Promise.all([
    context.waitForEvent("page", { timeout: 3000 }).catch(() => null),
    page.locator("#share-url-btn").click(),
  ]);

  if (newPage) {
    await sleep(2000);
    await newPage.close();
  } else {
    await sleep(2000);
  }

  // ============================================================
  // Scene 6: ページトップへ戻る（37〜40s）
  // ============================================================
  console.log("Scene 6: ページトップ");

  // スクロールトップボタンが表示される位置までスクロール
  await smoothScroll(page, wrapper, 0, 600, 20, 40);
  await sleep(500);

  const scrollTopBtn = page.locator("#scroll-top-btn");
  const isVisible = await scrollTopBtn.isVisible();
  if (isVisible) {
    await scrollTopBtn.click();
    await sleep(1000);
  }

  await sleep(1500); // エンディング静止

  // ============================================================
  // 録画終了・ファイル名変更
  // ============================================================
  await context.close();
  await browser.close();
  server.close();

  // Playwright が生成したファイルを recording.webm に移動
  // ※ 修正時刻が最も新しい webm ファイルを選ぶ（既存ファイルとの競合を防ぐ）
  const allFiles = fs.readdirSync(outputDir)
    .filter((f) => f.endsWith(".webm") && f !== "recording.webm")
    .map((f) => {
      const full = path.join(outputDir, f);
      return { file: full, mtime: fs.statSync(full).mtimeMs, size: fs.statSync(full).size };
    })
    .filter((f) => f.size > 0) // 空ファイルを除外
    .sort((a, b) => b.mtime - a.mtime); // 新しい順

  if (allFiles.length > 0) {
    const generated = allFiles[0].file;
    fs.renameSync(generated, outputPath);
    console.log(`\n録画完了: ${outputPath} (${(allFiles[0].size / 1024 / 1024).toFixed(1)} MB)`);
  } else {
    console.error("録画ファイルが見つかりません（空ファイルのみ）");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
