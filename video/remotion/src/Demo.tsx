import {
  AbsoluteFill,
  Sequence,
  Video,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";

// ============================================================
// 定数: 各シーンのフレーム範囲 (30fps)
// ============================================================
const FPS = 30;
const s = (sec: number) => Math.round(sec * FPS);

const SCENES = {
  scene1: { from: s(0),  durationInFrames: s(4) },   // ページロード
  scene2: { from: s(4),  durationInFrames: s(6) },   // スクロール
  scene3: { from: s(10), durationInFrames: s(8) },   // モーダル
  scene4: { from: s(18), durationInFrames: s(12) },  // チェック
  scene5: { from: s(30), durationInFrames: s(7) },   // 共有
  scene6: { from: s(37), durationInFrames: s(3) },   // エンディング
} as const;

// ============================================================
// ユーティリティ
// ============================================================
function fadeIn(frame: number, startFrame: number, durationFrames = 15): number {
  return interpolate(frame, [startFrame, startFrame + durationFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.ease),
  });
}

function fadeOut(frame: number, endFrame: number, durationFrames = 10): number {
  return interpolate(frame, [endFrame - durationFrames, endFrame], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.ease),
  });
}

// ============================================================
// キャプションオーバーレイ
// ============================================================
interface CaptionProps {
  text: string;
  sub?: string;
  fromFrame: number;
  toFrame: number;
}

const Caption: React.FC<CaptionProps> = ({ text, sub, fromFrame, toFrame }) => {
  const frame = useCurrentFrame();
  const opacity = Math.min(fadeIn(frame, fromFrame), fadeOut(frame, toFrame));

  return (
    <div
      style={{
        position: "absolute",
        bottom: 48,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        opacity,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          background: "rgba(15, 20, 40, 0.82)",
          backdropFilter: "blur(4px)",
          borderRadius: 10,
          padding: "10px 28px",
          color: "#ffffff",
          fontSize: 22,
          fontWeight: 700,
          fontFamily: "'Noto Sans JP', 'Hiragino Sans', 'Yu Gothic', sans-serif",
          letterSpacing: "0.03em",
          textShadow: "0 1px 4px rgba(0,0,0,0.6)",
          maxWidth: 900,
          textAlign: "center",
        }}
      >
        {text}
      </div>
      {sub && (
        <div
          style={{
            background: "rgba(15, 20, 40, 0.70)",
            borderRadius: 8,
            padding: "5px 20px",
            color: "#c8d8f0",
            fontSize: 15,
            fontFamily: "'Noto Sans JP', 'Hiragino Sans', 'Yu Gothic', sans-serif",
            letterSpacing: "0.03em",
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
};

// ============================================================
// タイトルカード (Scene 1 のみ最初に表示)
// ============================================================
const TitleCard: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = Math.min(fadeIn(frame, 0, 20), fadeOut(frame, s(3.5), 15));

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        paddingTop: 20,
        opacity,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, rgba(35,95,200,0.88), rgba(12,40,100,0.88))",
          borderRadius: 12,
          padding: "12px 36px",
          color: "#ffffff",
          fontSize: 26,
          fontWeight: 800,
          fontFamily: "'Noto Sans JP', 'Hiragino Sans', 'Yu Gothic', sans-serif",
          letterSpacing: "0.05em",
          boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        }}
      >
        🗓 JAWS DAYS 2026 カスタムタイムテーブル（非公式）
      </div>
    </div>
  );
};

// ============================================================
// エンディングオーバーレイ
// ============================================================
const EndingOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const opacity = fadeIn(frame, s(37), 15);

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `rgba(10, 20, 50, ${interpolate(frame, [s(38), durationInFrames], [0, 0.7], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })})`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 16,
        opacity,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          color: "#ffffff",
          fontSize: 32,
          fontWeight: 800,
          fontFamily: "'Noto Sans JP', 'Hiragino Sans', 'Yu Gothic', sans-serif",
          textShadow: "0 2px 12px rgba(0,0,0,0.8)",
        }}
      >
        GitHub Pages で無料公開中
      </div>
      <div
        style={{
          color: "#90b8f0",
          fontSize: 18,
          fontFamily: "monospace",
        }}
      >
        ishiharatma.github.io/aws-jawsdays2026-timetable-unofficial/
      </div>
    </div>
  );
};

// ============================================================
// メインコンポジション
// ============================================================
export const Demo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* Playwright で録画した素材 */}
      <Video
        src={`${process.env.PUBLIC_DIR ?? ""}/recording.webm`}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />

      {/* Scene 1: タイトルカード */}
      <Sequence from={SCENES.scene1.from} durationInFrames={SCENES.scene1.durationInFrames}>
        <TitleCard />
      </Sequence>

      {/* Scene 2: スクロール キャプション */}
      <Sequence from={SCENES.scene2.from} durationInFrames={SCENES.scene2.durationInFrames}>
        <Caption
          text="8トラック同時表示 · スピーカーアイコン · Level バッジ"
          sub="Track A〜H を横スクロールで確認"
          fromFrame={SCENES.scene2.from}
          toFrame={SCENES.scene2.from + SCENES.scene2.durationInFrames}
        />
      </Sequence>

      {/* Scene 3: モーダル キャプション */}
      <Sequence from={SCENES.scene3.from} durationInFrames={SCENES.scene3.durationInFrames}>
        <Caption
          text="セッションをクリック → 詳細モーダル表示"
          sub="Googleカレンダー追加 · Proposal リンク · X でポスト"
          fromFrame={SCENES.scene3.from}
          toFrame={SCENES.scene3.from + SCENES.scene3.durationInFrames}
        />
      </Sequence>

      {/* Scene 4: チェック キャプション */}
      <Sequence from={SCENES.scene4.from} durationInFrames={SCENES.scene4.durationInFrames}>
        <Caption
          text="「参加予定」ボタンで編集モードに切り替え"
          sub="チェックしたセッションはオレンジ枠でハイライト · ブラウザに90日保存"
          fromFrame={SCENES.scene4.from}
          toFrame={SCENES.scene4.from + SCENES.scene4.durationInFrames}
        />
      </Sequence>

      {/* Scene 5: 共有 キャプション */}
      <Sequence from={SCENES.scene5.from} durationInFrames={SCENES.scene5.durationInFrames}>
        <Caption
          text="参加予定を URL で共有 · X に投稿"
          sub="チェック状態がクエリパラメータに含まれるため誰とでも共有可能"
          fromFrame={SCENES.scene5.from}
          toFrame={SCENES.scene5.from + SCENES.scene5.durationInFrames}
        />
      </Sequence>

      {/* Scene 6: エンディング */}
      <Sequence from={SCENES.scene6.from} durationInFrames={SCENES.scene6.durationInFrames}>
        <EndingOverlay />
      </Sequence>
    </AbsoluteFill>
  );
};
