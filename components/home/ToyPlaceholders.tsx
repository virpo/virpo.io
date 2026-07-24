import type { ReactNode } from "react";

type TemporaryToyProps = {
  kind: "sounds" | "window-seat" | "study";
  title: string;
  className: string;
  children: ReactNode;
};

function TemporaryToy({
  kind,
  title,
  className,
  children,
}: TemporaryToyProps) {
  return (
    <section
      className={`tile toyPlaceholder ${className}`}
      aria-label={title}
      data-toy-placeholder={kind}
    >
      <header className="toyHeading">
        <h2>{title}</h2>
        <span>Interactive version next</span>
      </header>
      {children}
    </section>
  );
}

export function SoundsToyPlaceholder() {
  const bars = [35, 66, 48, 84, 54, 73, 40, 92, 62, 78, 44, 68];

  return (
    <TemporaryToy
      kind="sounds"
      title="Familiar Japanese Sounds"
      className="soundsPlaceholder"
    >
      <div className="soundsPreview" aria-hidden="true">
        <span className="soundsPlay">▶</span>
        <div className="soundsWave">
          {bars.map((height, index) => (
            <i key={index} style={{ height: `${height}%` }} />
          ))}
        </div>
        <strong>FamilyMart entrance</strong>
      </div>
    </TemporaryToy>
  );
}

export function WindowSeatToyPlaceholder() {
  return (
    <TemporaryToy
      kind="window-seat"
      title="Window Seat"
      className="windowSeatPlaceholder"
    >
      <div className="trainPreview" aria-hidden="true">
        <span className="trainScenery" />
        <img
          src="/assets/train-window.png"
          alt=""
          width="2130"
          height="1481"
        />
      </div>
    </TemporaryToy>
  );
}

export function StudyToyPlaceholder() {
  return (
    <TemporaryToy
      kind="study"
      title="Japanese Study"
      className="studyPlaceholder"
    >
      <div className="studyPreview">
        <span>Hiragana · 0 learned</span>
        <strong lang="ja">あ</strong>
        <small>Interactive deck arrives next.</small>
      </div>
    </TemporaryToy>
  );
}
