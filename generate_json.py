#!/usr/bin/env python3
"""Generate timetable.json from hardcoded session data extracted from fortee.jp HTML."""
import json

def top_to_time(top_px):
    """Convert CSS top px to start time string. 0px = 09:00, 6px = 1 min."""
    minutes_from_start = top_px / 6
    total_minutes = 9 * 60 + minutes_from_start
    h = int(total_minutes // 60)
    m = int(total_minutes % 60)
    return f"{h:02d}:{m:02d}"

def height_to_duration(height_px):
    """Convert CSS height px to duration in minutes."""
    return int(height_px / 6)

def end_time(start, duration):
    """Calculate end time from start time and duration."""
    h, m = map(int, start.split(":"))
    total = h * 60 + m + duration
    return f"{total // 60:02d}:{total % 60:02d}"

# Track mapping
TRACK_MAP = {1: "A", 2: "B", 3: "C", 4: "D", 5: "E", 6: "F", 7: "G", 8: "H"}

sessions = []

# ===== STRUCTURAL SESSIONS =====

# 受付 - all 8 tracks, top:0, h:300
for t in range(1, 9):
    sessions.append({"track": TRACK_MAP[t], "top": 0, "height": 300, "title": "受付", "speaker": "", "url": "", "tags": [], "is_proposal": False})

# オープニング・会場説明 - tracks 1,2,3
for t in [1, 2, 3]:
    sessions.append({"track": TRACK_MAP[t], "top": 300, "height": 60, "title": "オープニング・会場説明", "speaker": "清家史郎", "url": "", "tags": [], "is_proposal": False})

# 休憩 - tracks 4,5 at top:300, h:360
for t in [4, 5]:
    sessions.append({"track": TRACK_MAP[t], "top": 300, "height": 360, "title": "休憩", "speaker": "", "url": "", "tags": [], "is_proposal": False})

# 休憩 - tracks 6,7,8 at top:300, h:60
for t in [6, 7, 8]:
    sessions.append({"track": TRACK_MAP[t], "top": 300, "height": 60, "title": "休憩", "speaker": "", "url": "", "tags": [], "is_proposal": False})

# キーノート - tracks 1,2,3
for t in [1, 2, 3]:
    sessions.append({"track": TRACK_MAP[t], "top": 360, "height": 300, "title": "キーノート", "speaker": "", "url": "", "tags": [], "is_proposal": False})

# 休憩 - top:660, tracks 1-6
for t in [1, 2, 3, 4, 5, 6]:
    sessions.append({"track": TRACK_MAP[t], "top": 660, "height": 60, "title": "休憩", "speaker": "", "url": "", "tags": [], "is_proposal": False})

# 休憩 - top:840, tracks 1-5
for t in [1, 2, 3, 4, 5]:
    sessions.append({"track": TRACK_MAP[t], "top": 840, "height": 60, "title": "休憩", "speaker": "", "url": "", "tags": [], "is_proposal": False})

# 休憩 - top:1020, tracks 1-7
for t in [1, 2, 3, 4, 5, 6, 7]:
    sessions.append({"track": TRACK_MAP[t], "top": 1020, "height": 60, "title": "休憩", "speaker": "", "url": "", "tags": [], "is_proposal": False})

# 休憩 - top:1170, tracks 1-7
for t in [1, 2, 3, 4, 5, 6, 7]:
    sessions.append({"track": TRACK_MAP[t], "top": 1170, "height": 30, "title": "休憩", "speaker": "", "url": "", "tags": [], "is_proposal": False})

# 休憩 - top:1290, tracks 1-7
for t in [1, 2, 3, 4, 5, 6, 7]:
    sessions.append({"track": TRACK_MAP[t], "top": 1290, "height": 30, "title": "休憩", "speaker": "", "url": "", "tags": [], "is_proposal": False})

# 休憩 - top:1500, tracks 1-5
for t in [1, 2, 3, 4, 5]:
    sessions.append({"track": TRACK_MAP[t], "top": 1500, "height": 60, "title": "休憩", "speaker": "", "url": "", "tags": [], "is_proposal": False})

# 会場レイアウト変更 - top:1500, tracks 6,7
for t in [6, 7]:
    sessions.append({"track": TRACK_MAP[t], "top": 1500, "height": 240, "title": "会場レイアウト変更", "speaker": "", "url": "", "tags": [], "is_proposal": False})

# 休憩 - top:1680, tracks 1,3,4,5
for t in [1, 3, 4, 5]:
    sessions.append({"track": TRACK_MAP[t], "top": 1680, "height": 60, "title": "休憩", "speaker": "", "url": "", "tags": [], "is_proposal": False})

# 休憩 - top:1860, tracks 1-5
for t in [1, 2, 3, 4, 5]:
    sessions.append({"track": TRACK_MAP[t], "top": 1860, "height": 60, "title": "休憩", "speaker": "", "url": "", "tags": [], "is_proposal": False})

# 休憩 - top:2040, tracks 3,4,5
for t in [3, 4, 5]:
    sessions.append({"track": TRACK_MAP[t], "top": 2040, "height": 60, "title": "休憩", "speaker": "", "url": "", "tags": [], "is_proposal": False})

# 休憩 - top:2220, tracks 1-5
for t in [1, 2, 3, 4, 5]:
    sessions.append({"track": TRACK_MAP[t], "top": 2220, "height": 60, "title": "休憩", "speaker": "", "url": "", "tags": [], "is_proposal": False})

# 休憩 - top:2280, track 7
sessions.append({"track": "G", "top": 2280, "height": 120, "title": "休憩", "speaker": "", "url": "", "tags": [], "is_proposal": False})

# 休憩 - top:2400, tracks 3,4
for t in [3, 4]:
    sessions.append({"track": TRACK_MAP[t], "top": 2400, "height": 60, "title": "休憩", "speaker": "", "url": "", "tags": [], "is_proposal": False})

# 休憩 - top:2580, tracks 1-5
for t in [1, 2, 3, 4, 5]:
    sessions.append({"track": TRACK_MAP[t], "top": 2580, "height": 60, "title": "休憩", "speaker": "", "url": "", "tags": [], "is_proposal": False})

# 休憩 - top:2760, tracks 3,4
for t in [3, 4]:
    sessions.append({"track": TRACK_MAP[t], "top": 2760, "height": 60, "title": "休憩", "speaker": "", "url": "", "tags": [], "is_proposal": False})

# 会場レイアウト変更 - top:2940, tracks 1-7
for t in [1, 2, 3, 4, 5, 6, 7]:
    sessions.append({"track": TRACK_MAP[t], "top": 2940, "height": 120, "title": "会場レイアウト変更", "speaker": "", "url": "", "tags": [], "is_proposal": False})

# 懇親会 - structural (no proposal URL) for tracks B-G
for t in [2, 3, 4, 5, 6, 7]:
    sessions.append({"track": TRACK_MAP[t], "top": 3060, "height": 780, "title": "懇親会", "speaker": "", "url": "", "tags": [], "is_proposal": False})

# ===== GENERIC/TBD SESSIONS =====
generic_sessions = [
    {"track": "B", "top": 720, "height": 120, "title": "セッション", "speaker": "", "url": "", "tags": [], "is_proposal": False},
    {"track": "B", "top": 1920, "height": 300, "title": "セッション", "speaker": "", "url": "", "tags": [], "is_proposal": False},
    {"track": "B", "top": 2280, "height": 300, "title": "セッション", "speaker": "", "url": "", "tags": [], "is_proposal": False},
    {"track": "B", "top": 2640, "height": 300, "title": "セッション", "speaker": "", "url": "", "tags": [], "is_proposal": False},
    {"track": "C", "top": 1740, "height": 120, "title": "セッション", "speaker": "", "url": "", "tags": [], "is_proposal": False},
    {"track": "C", "top": 2640, "height": 120, "title": "セッション", "speaker": "", "url": "", "tags": [], "is_proposal": False},
]
sessions.extend(generic_sessions)

# ===== ACTUAL PROPOSAL SESSIONS =====
proposals = [
    # Track A
    {"track": "A", "top": 720, "height": 120, "title": "AWS IAM は誰の責任か？ ~ Cloud Infrastructure チーム が全部守る設計はなぜ失敗するのか", "speaker": "辻 水月", "url": "https://fortee.jp/jawsdays-2026/proposal/a80f2a1f-9472-4572-83e0-7363088456a0", "tags": ["Level 300"], "is_proposal": True},
    {"track": "A", "top": 900, "height": 120, "title": "ランサムウエア対策してますか？やられた時の対策は本当にできてますか？AWSでのリスク分析と対応フローの泥臭いお話。", "speaker": "大瀧広宣", "url": "https://fortee.jp/jawsdays-2026/proposal/3543e3a1-d825-4b73-9b1c-c0a2fd23f4ef", "tags": ["Level 300"], "is_proposal": True},
    {"track": "A", "top": 1080, "height": 90, "title": "Jr. Championsとともに歩んだAWSキャリア ― 未経験からの挑戦と、学びの広がり", "speaker": "中山 稀斗/髙坂 雄大", "url": "https://fortee.jp/jawsdays-2026/proposal/ff4998f0-95ec-4168-8f6a-e63b913a8535", "tags": [], "is_proposal": True},
    {"track": "A", "top": 1200, "height": 90, "title": "業務（SAP）の中心で、AIを叫ぶ", "speaker": "河村 晋弥/浅野 佑貴", "url": "https://fortee.jp/jawsdays-2026/proposal/3e13b5ec-9be8-4616-af64-164fb0614385", "tags": [], "is_proposal": True},
    {"track": "A", "top": 1320, "height": 180, "title": "現場SEが語る 回せるセキュリティ運用　～設計で可視化、AIで加速する「楽に回る」運用設計のコツ～", "speaker": "畑 彰毅/渡邉 優輔", "url": "https://fortee.jp/jawsdays-2026/proposal/fbc3deac-4f03-4020-a136-e229eee927da", "tags": ["Level 200", "サポーター"], "is_proposal": True},
    {"track": "A", "top": 1560, "height": 300, "title": "生成AI時代の開発と運用", "speaker": "山口能迪", "url": "https://fortee.jp/jawsdays-2026/proposal/59962e25-4761-4d86-81c8-9d6547aa8f9b", "tags": ["Level 200"], "is_proposal": True},
    {"track": "A", "top": 1920, "height": 300, "title": "AWS×クラウドネイティブソフトウェア設計――依存を「選ぶ」イベントドリブンアーキテクチャ", "speaker": "nrs / 成瀬允宣", "url": "https://fortee.jp/jawsdays-2026/proposal/3cac8170-ae2f-4d1a-9cc6-32482916c5a1", "tags": ["Level 300"], "is_proposal": True},
    {"track": "A", "top": 2280, "height": 300, "title": "クラウドネイティブ時代のウェブセキュリティ再考 ～AWS、コンテナ、CI/CDに潜む死角～", "speaker": "徳丸浩", "url": "https://fortee.jp/jawsdays-2026/proposal/ef8aaf5a-c5cc-49ea-bf4e-7b8a67ce042a", "tags": ["Level 300"], "is_proposal": True},
    {"track": "A", "top": 2640, "height": 300, "title": "初手AIで実現するAIと一緒に働くということ - AIファーストを実現する汎用タスクエージェントの作りかた", "speaker": "西見公宏 / 吉田真吾", "url": "https://fortee.jp/jawsdays-2026/proposal/0de570f8-c2b3-4ed9-a1be-0f7df5b7a726", "tags": ["Level 300"], "is_proposal": True},
    {"track": "A", "top": 3060, "height": 780, "title": "懇親会", "speaker": "jawsdays2026", "url": "https://fortee.jp/jawsdays-2026/proposal/795b2db8-4144-4834-821a-df6d2c888323", "tags": [], "is_proposal": True},
    # Track B
    {"track": "B", "top": 900, "height": 120, "title": "200アカウント規模を見据えた開発・検証・本番の環境分離を成立させる、AWS Transit Gatewayによるネットワーク設計と実践", "speaker": "鶴田諒輔", "url": "https://fortee.jp/jawsdays-2026/proposal/cc9dafc9-1598-4000-89a7-3facb4718587", "tags": ["Level 400"], "is_proposal": True},
    {"track": "B", "top": 1080, "height": 90, "title": "DSQL導入のリアル～実プロジェクトで見えたメリットと落とし穴～", "speaker": "佐藤 慎", "url": "https://fortee.jp/jawsdays-2026/proposal/c9b37788-f42d-490c-b06a-f4aab4d4039b", "tags": [], "is_proposal": True},
    {"track": "B", "top": 1200, "height": 90, "title": "MLエンジニアだらけの組織が、AWSアドバンストティアになって変わったこと 〜「理想の育成」と「運用の現実」の両輪で進む組織変革〜", "speaker": "堺 勇人/長谷川 裕一", "url": "https://fortee.jp/jawsdays-2026/proposal/33787cb8-987f-4394-aa5b-45f2a7dfe282", "tags": [], "is_proposal": True},
    {"track": "B", "top": 1320, "height": 180, "title": "AWSコスト分析入門 ― 削減の前に「なぜ高いのか」を理解する", "speaker": "浜崎 春哉", "url": "https://fortee.jp/jawsdays-2026/proposal/5c49c7bf-3cba-4cfc-aeb0-aa8b02b4bbb9", "tags": ["Level 200", "サポーター"], "is_proposal": True},
    {"track": "B", "top": 1560, "height": 300, "title": "クラウド × シリコンの Mashup - AWS チップ開発で広がる AI 基盤の選択肢", "speaker": "常世大史", "url": "https://fortee.jp/jawsdays-2026/proposal/edc33865-2417-47e2-9774-19d6945fd58f", "tags": ["Level 200", "Level 300"], "is_proposal": True},
    # Track C
    {"track": "C", "top": 720, "height": 120, "title": "楽しく学ぼう！AWSとは？AWSの歴史 入門", "speaker": "AWS Academy 平賀博司", "url": "https://fortee.jp/jawsdays-2026/proposal/03205c08-e4ed-4c13-9dfc-8bbef8e3992a", "tags": ["Level 200"], "is_proposal": True},
    {"track": "C", "top": 900, "height": 120, "title": "楽しく学ぼう！EC2・コンテナ 入門", "speaker": "石原晶子(初心者支部)", "url": "https://fortee.jp/jawsdays-2026/proposal/b37fc500-d961-463b-8fbf-e67ae4235594", "tags": ["Level 200"], "is_proposal": True},
    {"track": "C", "top": 1080, "height": 90, "title": "「きっかけ作り」から始めるKiro定着の軌跡", "speaker": "菊池 恵悟/岡田 直樹", "url": "https://fortee.jp/jawsdays-2026/proposal/2bc9de4f-ea35-4b72-98eb-3cb1a2fb154e", "tags": [], "is_proposal": True},
    {"track": "C", "top": 1200, "height": 90, "title": "AI で実現する AWS Well-Architected レビューの効率化 ～ ナレッジベースと生成AIを活用した設計レビュー実践 ～", "speaker": "小島 陽介/棚橋 誠", "url": "https://fortee.jp/jawsdays-2026/proposal/23ef4e3c-c41c-45be-ace7-715281ff3224", "tags": [], "is_proposal": True},
    {"track": "C", "top": 1320, "height": 180, "title": "こたつから始まったプロダクトは、どう育ち続けているのか ── 技術・人・プロダクトの\"判断\"がつないできたもの", "speaker": "波多野 謙介", "url": "https://fortee.jp/jawsdays-2026/proposal/5b7e689f-f24c-4815-a871-c8065df71d7d", "tags": ["Level 200", "サポーター"], "is_proposal": True},
    {"track": "C", "top": 1560, "height": 120, "title": "楽しく学ぼう！データベース 入門", "speaker": "丸本　健二郎", "url": "https://fortee.jp/jawsdays-2026/proposal/454a0be8-f6e8-4226-b05a-5048d96f8f7e", "tags": ["Level 200"], "is_proposal": True},
    {"track": "C", "top": 1920, "height": 120, "title": "楽しく学ぼう！ネットワーク 入門", "speaker": "白鳥　翔太(NW-JAWS)", "url": "https://fortee.jp/jawsdays-2026/proposal/6f6e252c-d19f-4910-9386-594b78770fc0", "tags": ["Level 200"], "is_proposal": True},
    {"track": "C", "top": 2100, "height": 120, "title": "楽しく学ぼう！セキュリティ 入門", "speaker": "臼田佳祐", "url": "https://fortee.jp/jawsdays-2026/proposal/24bd73e8-a64a-48ec-a7b1-407f85277f4e", "tags": [], "is_proposal": True},
    {"track": "C", "top": 2280, "height": 120, "title": "楽しく学ぼう！サーバレス 入門", "speaker": "JAWS UG千葉支部", "url": "https://fortee.jp/jawsdays-2026/proposal/7d509a1b-15ae-488f-9529-938d20f81740", "tags": ["Level 200"], "is_proposal": True},
    {"track": "C", "top": 2460, "height": 120, "title": "楽しく学ぼう！認証認可 入門", "speaker": "CLI専門支部", "url": "https://fortee.jp/jawsdays-2026/proposal/f6377e81-fb19-4dd0-827d-1abee0e98362", "tags": ["Level 200"], "is_proposal": True},
    {"track": "C", "top": 2820, "height": 120, "title": "楽しく学ぼう！コミュニティ入門 〜AWSと人がつむいできたストーリー〜", "speaker": "Hiromi Ito (AWS Community Hero)", "url": "https://fortee.jp/jawsdays-2026/proposal/33fdc5fc-3d09-48d1-91e5-b304ce3e4df7", "tags": [], "is_proposal": True},
    # Track D
    {"track": "D", "top": 720, "height": 120, "title": "実務経験なし、資格なしの学生が、AWSとAlexaをフルで活用し福岡の地域課題解決に挑んでみた話", "speaker": "さどるふ", "url": "https://fortee.jp/jawsdays-2026/proposal/d64bb1ac-cb76-4f3c-9ddb-38c9c622d160", "tags": ["Level 200"], "is_proposal": True},
    {"track": "D", "top": 900, "height": 120, "title": "Abuse report だけじゃない。AWS から緊急連絡が来る状況とは？昨今の攻撃や被害の事例の紹介と備えておきたい考え方について", "speaker": "kazzpapa3(ICHINO Kazuaki)", "url": "https://fortee.jp/jawsdays-2026/proposal/3b3a803e-a264-4b9f-a3f0-45a085f98b7d", "tags": ["Level 200"], "is_proposal": True},
    {"track": "D", "top": 1080, "height": 90, "title": "Amazon Q Developerをクライアントワークで、チームで導入した話", "speaker": "松本 祐樹/佐々木 慎也", "url": "https://fortee.jp/jawsdays-2026/proposal/d94c0b9e-a1b0-4043-b684-ac3716fd218d", "tags": [], "is_proposal": True},
    {"track": "D", "top": 1200, "height": 90, "title": "そのツール、全部使えて大丈夫？　～ランチ15分で学ぶ、Okta × Bedrock AgentCoreの認可制御レシピ～", "speaker": "平林 徹", "url": "https://fortee.jp/jawsdays-2026/proposal/0e857de3-64b8-4dd6-bc57-52c4b0150fdc", "tags": [], "is_proposal": True},
    {"track": "D", "top": 1320, "height": 180, "title": "作りっぱなしで終わらせない！価値を出し続ける AI エージェントのための「信頼性」設計", "speaker": "木村 健人", "url": "https://fortee.jp/jawsdays-2026/proposal/81fb6f2f-904d-4d00-9569-3180c54f79f6", "tags": ["Level 300", "サポーター"], "is_proposal": True},
    {"track": "D", "top": 1560, "height": 120, "title": "オレ達はAWS管理をやりたいんじゃない！開発の生産性を爆アゲしたいんだ！！", "speaker": "若松 剛志", "url": "https://fortee.jp/jawsdays-2026/proposal/a2377e25-53ee-4461-bb4c-423cf819752f", "tags": ["Level 300"], "is_proposal": True},
    {"track": "D", "top": 1740, "height": 120, "title": "その起票、愛が足りてますか？AWSサポートを味方につける、技術的「ラブレター」の書き方", "speaker": "hirosys", "url": "https://fortee.jp/jawsdays-2026/proposal/d6a57628-b4ef-4587-8c71-bee73bdb467b", "tags": ["Level 200"], "is_proposal": True},
    {"track": "D", "top": 1920, "height": 120, "title": "タスク管理も1on1も、もう「管理」じゃない - KiroとBedrock AgentCoreで変わった\"判断の仕事\" -", "speaker": "志水友輔", "url": "https://fortee.jp/jawsdays-2026/proposal/23de68e2-17df-4b00-a79e-46f5aa284b97", "tags": ["Level 300"], "is_proposal": True},
    {"track": "D", "top": 2100, "height": 120, "title": "us-east-1 に障害が起きた時に、ap-northeast-1 にどんな影響があるか説明できるようになろう！", "speaker": "三浦一樹", "url": "https://fortee.jp/jawsdays-2026/proposal/73f0fad0-2b16-4cb8-a10f-7b2674ea3c6d", "tags": ["Level 300"], "is_proposal": True},
    {"track": "D", "top": 2280, "height": 120, "title": "JAWS Festa 2014をきっかけに生まれた東北発のクロスコミュニティ！～東北IT物産展の軌跡～", "speaker": "武田一成", "url": "https://fortee.jp/jawsdays-2026/proposal/b7c83677-5df9-40e2-9997-2fd05503b952", "tags": ["Level 200"], "is_proposal": True},
    {"track": "D", "top": 2460, "height": 120, "title": "AWS DevOps Agentで実現する‼︎ AWS Well-Architected(W-A)を実現するシステム設計", "speaker": "奥田 雅基", "url": "https://fortee.jp/jawsdays-2026/proposal/1a0bcae1-6f8d-4646-8de3-f3bf900cf3e6", "tags": ["Level 300"], "is_proposal": True},
    {"track": "D", "top": 2640, "height": 120, "title": "2025年で何が変わった？AWS新ベストプラクティス総まとめ", "speaker": "大畑 一志", "url": "https://fortee.jp/jawsdays-2026/proposal/0e4276a8-24c6-4878-84bd-cfe0f5e1893b", "tags": ["Level 200"], "is_proposal": True},
    {"track": "D", "top": 2820, "height": 120, "title": "AIエージェント時代に備えるAWS Organizationsとアカウント設計 ― 権限とスコープの視点で「システム境界」を再考する", "speaker": "Hajime KOSHIRO", "url": "https://fortee.jp/jawsdays-2026/proposal/f290167d-77b8-494e-9c98-8f761f8c8376", "tags": ["Level 300"], "is_proposal": True},
    # Track E
    {"track": "E", "top": 720, "height": 120, "title": "CCoEはAI指揮官へ。Bedrock×MCPで構築するコスト・セキュリティ自律運用基盤", "speaker": "石井拓也", "url": "https://fortee.jp/jawsdays-2026/proposal/965c03e3-380d-4faa-a1af-74b47fc29103", "tags": ["Level 300"], "is_proposal": True},
    {"track": "E", "top": 900, "height": 120, "title": "AWS DevOps Agent vs SRE俺", "speaker": "加我 貴志", "url": "https://fortee.jp/jawsdays-2026/proposal/8f8f1e95-1575-4b0c-b0bf-ead118f44b2d", "tags": ["Level 300"], "is_proposal": True},
    {"track": "E", "top": 1080, "height": 90, "title": "CloudWatchカスタムメトリクスで実現するコードカバレッジの継続的モニタリング", "speaker": "常盤 匠", "url": "https://fortee.jp/jawsdays-2026/proposal/32c4b9e5-a1ba-403e-9da4-1f02b6170792", "tags": [], "is_proposal": True},
    {"track": "E", "top": 1200, "height": 90, "title": "Kiro CLI で変わる、AWS運用とコスト管理", "speaker": "大嵩 洋喜", "url": "https://fortee.jp/jawsdays-2026/proposal/b4f86a49-2275-4bba-a7ec-87b5e91b6033", "tags": [], "is_proposal": True},
    {"track": "E", "top": 1320, "height": 180, "title": "ECS/Fargateでセキュアかつ信頼性の高いアーキテクチャを実現する", "speaker": "井平 竣也/髙橋 洋樹", "url": "https://fortee.jp/jawsdays-2026/proposal/226ed90c-0902-4850-851e-40be246dd018", "tags": ["Level 300", "サポーター"], "is_proposal": True},
    {"track": "E", "top": 1560, "height": 120, "title": "S3ストレージクラスの「見える」「ある」「使える」は全部違う ─ 体験から見た、仕様の深淵を覗く", "speaker": "山本 光彦", "url": "https://fortee.jp/jawsdays-2026/proposal/e7a6519a-abc7-41d2-9b29-93a99d9aeb6a", "tags": ["Level 400"], "is_proposal": True},
    {"track": "E", "top": 1740, "height": 120, "title": "JAWS FESTA 2025でリリースしたほぼリアルタイム文字起こし/翻訳機能の構成について", "speaker": "木村直紀", "url": "https://fortee.jp/jawsdays-2026/proposal/fb768121-8069-4ea2-874e-b9bddec85418", "tags": ["Level 300"], "is_proposal": True},
    {"track": "E", "top": 1920, "height": 120, "title": "マルチアカウント環境でSecurity Hubの運用！導入の苦労とポイント", "speaker": "大澤 優貴", "url": "https://fortee.jp/jawsdays-2026/proposal/80627e84-7f04-4046-bab2-fbd5900eaee2", "tags": ["Level 300"], "is_proposal": True},
    {"track": "E", "top": 2100, "height": 120, "title": "IPv4とVPCエンドポイント依存からの卒業。AWSの最新アップデートとIPv6サポートを活用した次世代Web配信アーキテクチャ", "speaker": "suzryo", "url": "https://fortee.jp/jawsdays-2026/proposal/01b34643-ecb4-4e01-abb0-03395e87e122", "tags": ["Level 300"], "is_proposal": True},
    {"track": "E", "top": 2280, "height": 300, "title": "AI ミステリー: この中で AI 使っていないのは誰だ", "speaker": "Katz Ueno", "url": "https://fortee.jp/jawsdays-2026/proposal/a85e4703-b7eb-460b-83e9-8743b888a74e", "tags": ["Level 200", "ゲームショー"], "is_proposal": True},
    {"track": "E", "top": 2640, "height": 300, "title": "恒例！AWSエンジニアたちの怒涛のLT", "speaker": "大久保裕太", "url": "https://fortee.jp/jawsdays-2026/proposal/0e4f1434-39bb-43b4-b966-6b67a69f3b29", "tags": ["Level 300"], "is_proposal": True},
    # Track F
    {"track": "F", "top": 360, "height": 300, "title": "チーム対抗提案コンペ 〜仮想RFPに提案してみよう！", "speaker": "岡田行司", "url": "https://fortee.jp/jawsdays-2026/proposal/13c58998-c12a-4d03-863f-cc6ca1ecaf10", "tags": ["Level 200", "コンテスト"], "is_proposal": True},
    {"track": "F", "top": 720, "height": 300, "title": "AWSの知識・技術力を使って隠された旗をゲットせよ！〜出張版「ごーとんカップ」〜", "speaker": "古屋 啓介", "url": "https://fortee.jp/jawsdays-2026/proposal/1d8df953-5b5b-4d55-92e8-dc5a55ebaaa2", "tags": ["Level 300", "コンテスト"], "is_proposal": True},
    {"track": "F", "top": 1080, "height": 90, "title": "Dr. Werner Vogels の12年のキーノートから紐解くエンジニアリング組織への処方箋", "speaker": "早川 裕志/須賀 功太", "url": "https://fortee.jp/jawsdays-2026/proposal/5f364bd1-1934-4dcc-96ce-7de80e2ae415", "tags": [], "is_proposal": True},
    {"track": "F", "top": 1200, "height": 90, "title": "IaC実行基盤を観点別に評価〜AWS環境での選択指針〜", "speaker": "小山ちひろ", "url": "https://fortee.jp/jawsdays-2026/proposal/352a0c6c-4337-4751-a914-933ca4f5f2aa", "tags": [], "is_proposal": True},
    {"track": "F", "top": 1320, "height": 180, "title": "S3はフラットである — AWS公式SDKにも存在した、署名付きURLにおけるパストラバーサル脆弱性", "speaker": "松井 遼太朗/Eui Chul Chung", "url": "https://fortee.jp/jawsdays-2026/proposal/13feafcd-7494-484c-9e96-f6ff42066fa2", "tags": ["Level 300", "サポーター"], "is_proposal": True},
    {"track": "F", "top": 1740, "height": 1200, "title": "GameDay", "speaker": "川路義隆", "url": "https://fortee.jp/jawsdays-2026/proposal/a5731ba7-7d03-42da-bc3b-d504f97cefc6", "tags": ["Level 300"], "is_proposal": True},
    # Track G
    {"track": "G", "top": 360, "height": 660, "title": "AIとMCPを活用したライブ配信アプリケーションのプロトタイピング", "speaker": "Todd Sharp", "url": "https://fortee.jp/jawsdays-2026/proposal/e8d3ed23-254a-41a0-986a-07712525111c", "tags": ["Level 200", "ワークショップ"], "is_proposal": True},
    {"track": "G", "top": 1080, "height": 90, "title": "巨大組織で四苦八苦！？ 三菱電機グループで進めるクラウド移行 ～大規模マイグレーションへの挑戦～", "speaker": "齊藤 大樹/紅林 俊之", "url": "https://fortee.jp/jawsdays-2026/proposal/1b3f8e59-c815-4dca-9bbf-ce44441c1b2f", "tags": [], "is_proposal": True},
    {"track": "G", "top": 1200, "height": 90, "title": "データを知らずにインフラを組むな 〜RNA-Seq × Fargate 死亡日記〜", "speaker": "一ノ瀬 美帆/井山 学", "url": "https://fortee.jp/jawsdays-2026/proposal/2a806fd3-8acf-4306-8878-65ab2e0e53d1", "tags": [], "is_proposal": True},
    {"track": "G", "top": 1320, "height": 180, "title": "安全にAIを活用してセキュリティ運用を効率化した実践談", "speaker": "平木 佳介", "url": "https://fortee.jp/jawsdays-2026/proposal/f4221466-df8e-455d-8eeb-113665293d71", "tags": ["Level 200", "サポーター"], "is_proposal": True},
    {"track": "G", "top": 1740, "height": 540, "title": "アーキテクチャ専門支部 presents 帰ってきた！CDP道場 〜サメシャイン水族館 事業停止の危機を救え！〜", "speaker": "山﨑 奈緒美", "url": "https://fortee.jp/jawsdays-2026/proposal/aa8130ff-8c5f-4347-8458-c07ac52c26b0", "tags": ["Level 300", "ワークショップ"], "is_proposal": True},
    {"track": "G", "top": 2400, "height": 540, "title": "ランサムウェア攻撃シミュレーション - チームで挑む机上訓練ゲーム", "speaker": "吉田裕貴", "url": "https://fortee.jp/jawsdays-2026/proposal/6900cc9a-2f27-43e7-96be-0d045d315b48", "tags": ["Level 200", "ワークショップ"], "is_proposal": True},
    # Track H
    {"track": "H", "top": 360, "height": 540, "title": "親子で Mashup for the Future！しゃべって楽しむ 初手AI駆動でものづくり体験", "speaker": "お祭り班", "url": "https://fortee.jp/jawsdays-2026/proposal/fcc45875-6652-4854-bb33-60d7228c799f", "tags": [], "is_proposal": True},
    {"track": "H", "top": 900, "height": 180, "title": "サポーターブースツアー①", "speaker": "お祭り班", "url": "https://fortee.jp/jawsdays-2026/proposal/af07013d-a740-491c-b102-a4b49bb3a1f2", "tags": [], "is_proposal": True},
    {"track": "H", "top": 1080, "height": 540, "title": "AWS BuilderCards バトル in JAWS DAYS 2026", "speaker": "お祭り班", "url": "https://fortee.jp/jawsdays-2026/proposal/a3f7e5c4-c98e-4ea2-b4ad-bfa852a47a73", "tags": [], "is_proposal": True},
    {"track": "H", "top": 1620, "height": 180, "title": "サポーターブースツアー②", "speaker": "お祭り班", "url": "https://fortee.jp/jawsdays-2026/proposal/c5582930-eac5-4afe-83d4-d74469241f4c", "tags": [], "is_proposal": True},
    {"track": "H", "top": 1800, "height": 540, "title": "JAWS DAYS お茶会テーブル「純喫茶 鮫」", "speaker": "お祭り班", "url": "https://fortee.jp/jawsdays-2026/proposal/8c6c2eea-7aad-4336-a393-22dc56578bc5", "tags": [], "is_proposal": True},
    {"track": "H", "top": 2340, "height": 180, "title": "サポーターブースツアー③", "speaker": "お祭り班", "url": "https://fortee.jp/jawsdays-2026/proposal/683f2971-06ee-4cff-af83-5b8031c293d2", "tags": [], "is_proposal": True},
    {"track": "H", "top": 2520, "height": 360, "title": "JAWS DAYS2026版！チーム対抗 AWS ウルトラクイズ", "speaker": "お祭り班", "url": "https://fortee.jp/jawsdays-2026/proposal/582d5add-caa1-4b62-9a2e-a5c16d0daf69", "tags": [], "is_proposal": True},
]
sessions.extend(proposals)

# Deduplicate: proposals override generics at same (track, top)
seen = {}
for s in sessions:
    key = (s["track"], s["top"])
    if key in seen:
        # If new one is a proposal, it overrides; otherwise keep existing
        if s["is_proposal"]:
            seen[key] = s
        # If existing is already a proposal, skip generic
    else:
        seen[key] = s

# Convert to final format
track_order = {"A": 0, "B": 1, "C": 2, "D": 3, "E": 4, "F": 5, "G": 6, "H": 7}
deduped = sorted(seen.values(), key=lambda s: (track_order[s["track"]], s["top"]))

final_sessions = []
for i, s in enumerate(deduped, 1):
    start = top_to_time(s["top"])
    dur = height_to_duration(s["height"])
    e = end_time(start, dur)
    final_sessions.append({
        "id": i,
        "track": s["track"],
        "date": "2026-03-07",
        "start": start,
        "end": e,
        "duration": dur,
        "title": s["title"],
        "speaker": s["speaker"],
        "proposalUrl": s["url"],
        "tags": s["tags"]
    })

output = {
    "event": {
        "name": "JAWS DAYS 2026",
        "date": "2026-03-07",
        "venue": "池袋サンシャインシティ",
        "hashtag": "#jawsdays2026",
        "timetableUrl": "https://fortee.jp/jawsdays-2026/timetable"
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
    "sessions": final_sessions
}

with open("/home/user/aws-jawsdays2026-timetable-unofficial/docs/timetable.json", "w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"Generated {len(final_sessions)} sessions")
# Print summary per track
for track_id in "ABCDEFGH":
    track_sessions = [s for s in final_sessions if s["track"] == track_id]
    print(f"  Track {track_id}: {len(track_sessions)} sessions")
