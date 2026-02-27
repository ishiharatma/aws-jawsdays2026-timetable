#!/usr/bin/env python3
"""
Playwright で録画した webm フレームから、キャプション付きアニメーション GIF を生成する。

使い方:
  python3 make_gif.py --frames /tmp/frames --output docs/demo.gif
"""

import argparse
import os
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# ----------------------------------------------------------------
# 設定
# ----------------------------------------------------------------
TARGET_W, TARGET_H = 960, 540       # 出力解像度 (16:9)
CAPTION_BAR_H = 72                  # キャプションバー高さ
FONT_SIZE_MAIN = 22
FONT_SIZE_SUB = 15
FPS_IN = 25                         # 入力 webm の FPS
FPS_OUT = 10                        # GIF の FPS (10fps = 100ms/frame)
STEP = FPS_IN // FPS_OUT            # 何フレームおきに 1 枚取るか

# ----------------------------------------------------------------
# キャプション定義
# フレーム範囲は実際の 25fps 動画 (25.68s = 642 フレーム) に基づく
# ----------------------------------------------------------------
CAPTIONS: list[tuple[int, int, str, str]] = [
    # (開始フレーム, 終了フレーム, メインテキスト, サブテキスト)
    (  1,  75, "JAWS DAYS 2026 カスタムタイムテーブル（非公式）",
               "ishiharatma.github.io/aws-jawsdays2026-timetable-unofficial/"),
    ( 76, 195, "8トラック同時表示 · スピーカーアイコン · Level バッジ",
               "Track A〜H を横スクロールで確認"),
    (196, 340, "セッションをクリック → 詳細モーダル表示",
               "Googleカレンダー追加 · Proposal リンク · X でポスト"),
    (341, 490, "「参加予定」ボタンで編集モードに切り替え",
               "チェックしたセッションはオレンジ枠でハイライト"),
    (491, 590, "参加予定を URL で共有 · X に投稿",
               "チェック状態がクエリパラメータに含まれる"),
    (591, 642, "GitHub Pages で無料公開中",
               "ishiharatma.github.io/aws-jawsdays2026-timetable-unofficial/"),
]


def get_caption(frame_num: int) -> tuple[str, str]:
    for start, end, main, sub in CAPTIONS:
        if start <= frame_num <= end:
            return main, sub
    return "", ""


def add_caption(img: Image.Image, main: str, sub: str) -> Image.Image:
    """画像下部にキャプションバーを合成する。"""
    bar_top = TARGET_H
    total_h = TARGET_H + CAPTION_BAR_H
    canvas = Image.new("RGB", (TARGET_W, total_h), (15, 20, 40))
    canvas.paste(img, (0, 0))

    draw = ImageDraw.Draw(canvas)

    # 半透明バーは Pillow でシンプルに塗りつぶし
    draw.rectangle([0, bar_top, TARGET_W, total_h], fill=(15, 20, 50))

    try:
        font_main = ImageFont.truetype("/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
                                        FONT_SIZE_MAIN)
        font_sub  = ImageFont.truetype("/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
                                        FONT_SIZE_SUB)
    except (OSError, AttributeError):
        font_main = ImageFont.load_default()
        font_sub  = font_main

    if main:
        # メインテキストを中央揃え
        bbox = draw.textbbox((0, 0), main, font=font_main)
        text_w = bbox[2] - bbox[0]
        x = (TARGET_W - text_w) // 2
        draw.text((x, bar_top + 8), main, fill=(255, 255, 255), font=font_main)

    if sub:
        bbox = draw.textbbox((0, 0), sub, font=font_sub)
        text_w = bbox[2] - bbox[0]
        x = (TARGET_W - text_w) // 2
        draw.text((x, bar_top + 38), sub, fill=(180, 210, 255), font=font_sub)

    return canvas


def make_gif(frames_dir: Path, output_path: Path) -> None:
    frame_files = sorted(frames_dir.glob("frame*.png"))
    total = len(frame_files)
    print(f"Total frames: {total}, STEP: {STEP}, output fps: {FPS_OUT}")

    selected = frame_files[::STEP]  # 間引き
    print(f"Selected frames: {len(selected)}")

    pil_frames = []
    for i, fpath in enumerate(selected):
        raw_idx = (i * STEP) + 1  # 元の 1-indexed フレーム番号

        with Image.open(fpath) as img:
            img_rgb = img.convert("RGB")
            # リサイズ
            img_resized = img_rgb.resize((TARGET_W, TARGET_H), Image.LANCZOS)

            # キャプション追加
            main, sub = get_caption(raw_idx)
            captioned = add_caption(img_resized, main, sub)

            # GIF 用に P モード変換（256色）
            gif_frame = captioned.convert("P", palette=Image.ADAPTIVE, colors=128)
            pil_frames.append(gif_frame)

        if (i + 1) % 20 == 0:
            print(f"  Processed {i + 1}/{len(selected)} frames")

    if not pil_frames:
        print("ERROR: フレームが見つかりません")
        sys.exit(1)

    duration_ms = 1000 // FPS_OUT  # 各フレームの表示時間 (ms)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    pil_frames[0].save(
        output_path,
        save_all=True,
        append_images=pil_frames[1:],
        duration=duration_ms,
        loop=0,
        optimize=True,
    )

    size_mb = output_path.stat().st_size / 1024 / 1024
    print(f"\nGIF 生成完了: {output_path} ({size_mb:.1f} MB, {len(pil_frames)} フレーム)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--frames", default="/tmp/frames", type=Path)
    parser.add_argument("--output", default="docs/demo.gif", type=Path)
    args = parser.parse_args()

    make_gif(args.frames, args.output)
