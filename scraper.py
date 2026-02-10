#!/usr/bin/env python3
"""
JAWS DAYS 2026 Timetable Scraper

fortee.jp のタイムテーブルページからセッション情報をスクレイピングし、
正規化したJSONファイルを生成するスクリプト。

fortee.jp はJavaScriptで動的にレンダリングされるため、
Selenium (Chrome) を使用してページを取得します。

使い方:
  pip install selenium beautifulsoup4
  python scraper.py

出力:
  docs/timetable.json
"""

import json
import re
import sys
import time
from pathlib import Path

try:
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.chrome.service import Service
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
OUTPUT_PATH = Path(__file__).parent / "docs" / "timetable.json"


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


def parse_time(time_str):
    """時間文字列をパースする (例: '09:00' -> '09:00')"""
    time_str = time_str.strip()
    match = re.match(r"(\d{1,2}):(\d{2})", time_str)
    if match:
        h, m = match.groups()
        return f"{int(h):02d}:{m}"
    return time_str


def extract_timetable(driver):
    """タイムテーブルページからセッション情報を抽出する"""
    print(f"Fetching: {TIMETABLE_URL}")
    driver.get(TIMETABLE_URL)

    # ページのレンダリングを待機
    time.sleep(5)

    # さらにテーブルが表示されるまで待機
    try:
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "table, .timetable, [class*='timetable'], [class*='schedule']"))
        )
    except Exception:
        print("Warning: テーブル要素の検出がタイムアウトしました。現在のHTMLで解析を試みます。")

    time.sleep(3)
    html = driver.page_source
    soup = BeautifulSoup(html, "html.parser")
    return soup


def parse_sessions_from_table(soup):
    """HTMLからセッション情報をパースする"""
    sessions = []
    tracks = []

    # fortee.jp のタイムテーブルは <table> ベースの場合がある
    table = soup.select_one("table")
    if table:
        return parse_table_based(table)

    # div ベースのレイアウトを試みる
    timetable_div = soup.select_one("[class*='timetable'], [class*='schedule'], .timetable-container")
    if timetable_div:
        return parse_div_based(soup)

    # フォールバック: ページ全体からリンクとセッション情報を抽出
    return parse_fallback(soup)


def parse_table_based(table):
    """<table> ベースのタイムテーブルをパースする"""
    sessions = []
    tracks = []

    # ヘッダーからトラック名を取得
    header_row = table.select_one("thead tr, tr:first-child")
    if header_row:
        for th in header_row.select("th, td"):
            text = th.get_text(strip=True)
            if text and text != "" and not re.match(r"^\d{1,2}:\d{2}", text):
                tracks.append(text)

    # 各行からセッション情報を取得
    rows = table.select("tbody tr, tr")
    for row in rows:
        cells = row.select("td")
        time_cell = row.select_one("th, td:first-child")
        if not time_cell:
            continue

        time_text = time_cell.get_text(strip=True)
        time_match = re.match(r"(\d{1,2}:\d{2})", time_text)
        if not time_match:
            continue

        start_time = parse_time(time_match.group(1))

        for i, cell in enumerate(cells):
            # セルにセッション情報があるか確認
            link = cell.select_one("a[href*='proposal']")
            title_el = cell.select_one("a, .title, [class*='title']")

            if not title_el and not cell.get_text(strip=True):
                continue

            title = ""
            proposal_url = ""
            speaker = ""

            if link:
                title = link.get_text(strip=True)
                href = link.get("href", "")
                if href.startswith("/"):
                    proposal_url = FORTEE_BASE_URL + href
                elif href.startswith("http"):
                    proposal_url = href
            elif title_el:
                title = title_el.get_text(strip=True)
            else:
                title = cell.get_text(strip=True)

            if not title:
                continue

            # スピーカー情報を探す
            speaker_el = cell.select_one(".speaker, [class*='speaker'], [class*='name']")
            if speaker_el:
                speaker = speaker_el.get_text(strip=True)
            else:
                # "by XXX" パターンを探す
                cell_text = cell.get_text(separator="\n", strip=True)
                by_match = re.search(r"by\s+(.+)", cell_text)
                if by_match:
                    speaker = by_match.group(1).strip()

            # rowspan からセッション時間を推定
            rowspan = cell.get("rowspan")
            duration = 25  # デフォルト25分
            if rowspan:
                duration = int(rowspan) * 5  # 5分刻み

            # トラック特定
            track = ""
            if i < len(tracks):
                track = tracks[i]

            session = {
                "track": track,
                "start": start_time,
                "duration": duration,
                "title": title,
                "speaker": speaker,
                "proposalUrl": proposal_url,
            }
            sessions.append(session)

    return sessions


def parse_div_based(soup):
    """div ベースのレイアウトをパースする"""
    sessions = []

    # セッションカードを探す
    session_cards = soup.select(
        "[class*='session'], [class*='proposal'], [class*='talk'], "
        "[class*='event-item'], [class*='slot']"
    )

    for card in session_cards:
        title = ""
        speaker = ""
        proposal_url = ""
        track = ""
        start_time = ""
        duration = 25

        # タイトル
        title_el = card.select_one("a[href*='proposal'], .title, h3, h4, [class*='title']")
        if title_el:
            title = title_el.get_text(strip=True)
            if title_el.name == "a":
                href = title_el.get("href", "")
                if href.startswith("/"):
                    proposal_url = FORTEE_BASE_URL + href
                elif href.startswith("http"):
                    proposal_url = href

        # スピーカー
        speaker_el = card.select_one("[class*='speaker'], [class*='name'], .by")
        if speaker_el:
            speaker = speaker_el.get_text(strip=True)

        # トラック
        track_el = card.select_one("[class*='track']")
        if track_el:
            track = track_el.get_text(strip=True)

        # 時間
        time_el = card.select_one("[class*='time'], time")
        if time_el:
            time_text = time_el.get_text(strip=True)
            time_match = re.match(r"(\d{1,2}:\d{2})", time_text)
            if time_match:
                start_time = parse_time(time_match.group(1))

        if title:
            sessions.append({
                "track": track,
                "start": start_time,
                "duration": duration,
                "title": title,
                "speaker": speaker,
                "proposalUrl": proposal_url,
            })

    return sessions


def parse_fallback(soup):
    """フォールバック: リンクからセッション情報を抽出する"""
    sessions = []

    # proposal リンクを全て取得
    links = soup.select("a[href*='proposal']")
    for link in links:
        href = link.get("href", "")
        title = link.get_text(strip=True)
        if not title or "proposal" in title.lower():
            continue

        if href.startswith("/"):
            proposal_url = FORTEE_BASE_URL + href
        elif href.startswith("http"):
            proposal_url = href
        else:
            proposal_url = ""

        # 親要素からスピーカー等の情報を探す
        parent = link.parent
        speaker = ""
        if parent:
            speaker_el = parent.select_one("[class*='speaker'], [class*='name']")
            if speaker_el:
                speaker = speaker_el.get_text(strip=True)

        sessions.append({
            "track": "",
            "start": "",
            "duration": 25,
            "title": title,
            "speaker": speaker,
            "proposalUrl": proposal_url,
        })

    return sessions


def calculate_end_time(start, duration_min):
    """開始時間とdurationから終了時間を計算する"""
    if not start:
        return ""
    match = re.match(r"(\d{2}):(\d{2})", start)
    if not match:
        return ""
    h, m = int(match.group(1)), int(match.group(2))
    total = h * 60 + m + duration_min
    return f"{total // 60:02d}:{total % 60:02d}"


def build_output(sessions):
    """出力用のJSON構造を構築する"""
    # セッションデータを正規化
    normalized = []
    for s in sessions:
        end_time = calculate_end_time(s["start"], s["duration"])
        normalized.append({
            "id": len(normalized) + 1,
            "track": s["track"],
            "date": EVENT_DATE,
            "start": s["start"],
            "end": end_time,
            "duration": s["duration"],
            "title": s["title"],
            "speaker": s["speaker"],
            "proposalUrl": s["proposalUrl"],
        })

    output = {
        "event": {
            "name": "JAWS DAYS 2026",
            "date": EVENT_DATE,
            "venue": "池袋サンシャインシティ",
            "hashtag": "#jawsdays2026",
            "timetableUrl": TIMETABLE_URL,
        },
        "tracks": [
            {"id": "A", "name": "Track A", "hashtag": "#jawsdays2026_a"},
            {"id": "B", "name": "Track B", "hashtag": "#jawsdays2026_b"},
            {"id": "C", "name": "Track C", "hashtag": "#jawsdays2026_c"},
            {"id": "D", "name": "Track D", "hashtag": "#jawsdays2026_d"},
            {"id": "E", "name": "Track E", "hashtag": "#jawsdays2026_e"},
            {"id": "F", "name": "Track F", "hashtag": "#jawsdays2026_f"},
            {"id": "G", "name": "Track G", "hashtag": "#jawsdays2026_g"},
            {"id": "H", "name": "Track H", "hashtag": "#jawsdays2026_h"},
        ],
        "sessions": normalized,
    }
    return output


def main():
    driver = None
    try:
        driver = create_driver()
        soup = extract_timetable(driver)
        sessions = parse_sessions_from_table(soup)

        if not sessions:
            print("Warning: セッションが検出されませんでした。")
            print("ページの構造が変わっている可能性があります。")
            print("HTMLをdump して手動確認してください:")
            dump_path = Path(__file__).parent / "debug_timetable.html"
            dump_path.write_text(driver.page_source, encoding="utf-8")
            print(f"  -> {dump_path}")
            sys.exit(1)

        output = build_output(sessions)

        OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT_PATH.write_text(
            json.dumps(output, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        print(f"Success: {len(sessions)} sessions saved to {OUTPUT_PATH}")

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
    finally:
        if driver:
            driver.quit()


if __name__ == "__main__":
    main()
