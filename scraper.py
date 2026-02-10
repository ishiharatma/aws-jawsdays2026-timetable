#!/usr/bin/env python3
"""
JAWS DAYS 2026 Timetable Scraper

fortee.jp のタイムテーブルページからセッション情報をスクレイピングし、
正規化したJSONファイルを生成するスクリプト。

fortee.jp はJavaScriptで動的にレンダリングされるため、
Selenium (Chrome) を使用してページを取得します。

fortee.jp の HTML 構造:
  - トラック: CSS クラス track-N (1=A, 2=B, ..., 8=H)
  - 時間計算: 5分 = 30px → start_minutes = top_px / 6, duration = height_px / 6
  - セッション種別:
    - 汎用スロット: class="proposal time-slot ... track-N"
    - 実プロポーザル: class="proposal ... proposal-in-timetable ... track-N"

使い方:
  pip install selenium beautifulsoup4
  python scraper.py

出力:
  public/timetable.json
"""

import json
import re
import sys
import time
from pathlib import Path

try:
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
except ImportError:
    print("Error: selenium が必要です。以下のコマンドでインストールしてください:")
    print("  pip install selenium beautifulsoup4")
    sys.exit(1)

try:
    from bs4 import BeautifulSoup
except ImportError:
    print("Error: beautifulsoup4 が必要です。以下のコマンドでインストールしてください:")
    print("  pip install beautifulsoup4")
    sys.exit(1)

TIMETABLE_URL = "https://fortee.jp/jawsdays-2026/timetable"
FORTEE_BASE_URL = "https://fortee.jp"
EVENT_DATE = "2026-03-07"
OUTPUT_PATH = Path(__file__).parent / "public" / "timetable.json"

TRACK_MAP = {
    1: "A", 2: "B", 3: "C", 4: "D",
    5: "E", 6: "F", 7: "G", 8: "H",
}


def create_driver():
    """Selenium WebDriverを作成する"""
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument(
        "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )
    driver = webdriver.Chrome(options=options)
    driver.set_page_load_timeout(30)
    return driver


def fetch_timetable_html(driver):
    """タイムテーブルページのHTMLを取得する"""
    print(f"Fetching: {TIMETABLE_URL}")
    driver.get(TIMETABLE_URL)

    # ページのレンダリングを待機
    time.sleep(5)

    try:
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, ".proposal"))
        )
    except Exception:
        print("Warning: proposal要素の検出がタイムアウトしました。")

    time.sleep(3)
    return driver.page_source


def top_to_time(top_px):
    """CSS top (px) を開始時刻に変換する。0px = 09:00"""
    minutes_from_start = top_px / 6
    total_minutes = 9 * 60 + minutes_from_start
    h = int(total_minutes // 60)
    m = int(total_minutes % 60)
    return f"{h:02d}:{m:02d}"


def height_to_duration(height_px):
    """CSS height (px) を所要時間 (分) に変換する"""
    return int(height_px / 6)


def end_time(start, duration):
    """開始時刻と所要時間から終了時刻を計算する"""
    h, m = map(int, start.split(":"))
    total = h * 60 + m + duration
    return f"{total // 60:02d}:{total % 60:02d}"


def extract_track(classes):
    """CSS クラスリストからトラック番号を抽出する"""
    for cls in classes:
        match = re.match(r"track-(\d+)", cls)
        if match:
            num = int(match.group(1))
            if num in TRACK_MAP:
                return TRACK_MAP[num]
    return None


def extract_style_value(style_str, prop):
    """style属性から特定のプロパティ値を抽出する (px単位)"""
    match = re.search(rf"{prop}\s*:\s*([\d.]+)px", style_str)
    if match:
        return float(match.group(1))
    return None


def parse_sessions(html):
    """HTMLからセッション情報をパースする"""
    soup = BeautifulSoup(html, "html.parser")
    raw_sessions = []

    # すべての proposal 要素を取得
    proposal_divs = soup.select("div.proposal")

    for div in proposal_divs:
        classes = div.get("class", [])
        style = div.get("style", "")

        # トラック取得
        track = extract_track(classes)
        if not track:
            continue

        # top, height 取得
        top_px = extract_style_value(style, "top")
        height_px = extract_style_value(style, "height")
        if top_px is None or height_px is None:
            continue

        # プロポーザルかどうか判定
        is_proposal = "proposal-in-timetable" in classes

        # タイトル取得
        title = ""
        proposal_url = ""
        speaker = ""
        tags = []

        if is_proposal:
            # 実プロポーザル: <a> タグからタイトルとURL取得
            link = div.select_one("a[href*='proposal']")
            if link:
                title = link.get_text(strip=True)
                href = link.get("href", "")
                if href.startswith("/"):
                    proposal_url = FORTEE_BASE_URL + href
                elif href.startswith("http"):
                    proposal_url = href
        else:
            # 汎用スロット: .title からタイトル取得
            title_el = div.select_one(".title")
            if title_el:
                title = title_el.get_text(strip=True)

        if not title:
            continue

        # スピーカー取得
        speaker_el = div.select_one(".speaker-name")
        if speaker_el:
            speaker = speaker_el.get_text(strip=True)

        # タグ取得 (Level バッジ等)
        badge_els = div.select(".badge")
        for badge in badge_els:
            tag_text = badge.get_text(strip=True)
            if tag_text:
                tags.append(tag_text)

        raw_sessions.append({
            "track": track,
            "top": top_px,
            "height": height_px,
            "title": title,
            "speaker": speaker,
            "url": proposal_url,
            "tags": tags,
            "is_proposal": is_proposal,
        })

    return raw_sessions


def deduplicate_sessions(raw_sessions):
    """同じ (track, top) の重複を排除する。プロポーザルを優先。"""
    seen = {}
    for s in raw_sessions:
        key = (s["track"], s["top"])
        if key in seen:
            if s["is_proposal"]:
                seen[key] = s
        else:
            seen[key] = s

    track_order = {v: k for k, v in TRACK_MAP.items()}
    return sorted(seen.values(), key=lambda s: (track_order.get(s["track"], 99), s["top"]))


def build_output(deduped_sessions):
    """出力用のJSON構造を構築する"""
    final_sessions = []
    for i, s in enumerate(deduped_sessions, 1):
        start = top_to_time(s["top"])
        dur = height_to_duration(s["height"])
        e = end_time(start, dur)
        final_sessions.append({
            "id": i,
            "track": s["track"],
            "date": EVENT_DATE,
            "start": start,
            "end": e,
            "duration": dur,
            "title": s["title"],
            "speaker": s["speaker"],
            "proposalUrl": s["url"],
            "tags": s["tags"],
        })

    return {
        "event": {
            "name": "JAWS DAYS 2026",
            "date": EVENT_DATE,
            "venue": "池袋サンシャインシティ",
            "hashtag": "#jawsdays2026",
            "timetableUrl": TIMETABLE_URL,
        },
        "tracks": [
            {"id": letter, "name": f"Track {letter}", "hashtag": f"#jawsdays2026_{letter.lower()}"}
            for letter in "ABCDEFGH"
        ],
        "sessions": final_sessions,
    }


def main():
    driver = None
    try:
        driver = create_driver()
        html = fetch_timetable_html(driver)

        raw_sessions = parse_sessions(html)
        if not raw_sessions:
            print("Warning: セッションが検出されませんでした。")
            dump_path = Path(__file__).parent / "debug_timetable.html"
            dump_path.write_text(html, encoding="utf-8")
            print(f"  HTMLを {dump_path} に保存しました。")
            sys.exit(1)

        deduped = deduplicate_sessions(raw_sessions)
        output = build_output(deduped)

        OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT_PATH.write_text(
            json.dumps(output, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        print(f"Success: {len(deduped)} sessions saved to {OUTPUT_PATH}")

        # サマリー表示
        for letter in "ABCDEFGH":
            count = sum(1 for s in deduped if s["track"] == letter)
            print(f"  Track {letter}: {count} sessions")

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
    finally:
        if driver:
            driver.quit()


if __name__ == "__main__":
    main()
