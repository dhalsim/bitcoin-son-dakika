import { useRef } from "react";

interface TimelineRulerProps {
  duration: number;
  zoom: number;
  onSeek: (time: number) => void;
}

export function TimelineRuler({ duration, zoom, onSeek }: TimelineRulerProps) {
  const rulerRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    if (!rulerRef.current) return;

    const rect = rulerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = Math.max(0, Math.min((x / zoom) * 1000, duration));
    onSeek(time);
  };

  // Calculate tick marks
  const widthInPixels = (duration / 1000) * zoom;
  const ticks: { position: number; label: string; major: boolean }[] = [];

  // Determine tick interval based on zoom level
  let tickInterval = 1000; // 1 second
  if (zoom < 50) {
    tickInterval = 5000; // 5 seconds
  } else if (zoom < 20) {
    tickInterval = 10000; // 10 seconds
  } else if (zoom > 200) {
    tickInterval = 500; // 0.5 seconds
  }

  const minorTickInterval = tickInterval / 5;

  // Generate ticks
  for (let time = 0; time <= duration; time += minorTickInterval) {
    const isMajor = time % tickInterval === 0;
    ticks.push({
      position: (time / 1000) * zoom,
      label: isMajor ? `${(time / 1000).toFixed(1)}s` : "",
      major: isMajor,
    });
  }

  return (
    <div
      ref={rulerRef}
      className="h-8 border-b bg-muted/30 relative cursor-pointer select-none"
      style={{ width: `${widthInPixels}px`, minWidth: "100%" }}
      onClick={handleClick}
    >
      {ticks.map((tick, i) => (
        <div key={i} className="absolute top-0" style={{ left: `${tick.position}px` }}>
          <div className={`${tick.major ? "h-4 bg-foreground/40" : "h-2 bg-foreground/20"} w-px`} />
          {tick.label && (
            <div className="absolute top-4 -translate-x-1/2 text-[10px] text-muted-foreground font-mono">
              {tick.label}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
