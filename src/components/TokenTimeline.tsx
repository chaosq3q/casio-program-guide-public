import { formatTokenDisplay } from "../logic/formatTokenDisplay";
import { useLayoutEffect, useRef } from "react";
import type { ProgramToken } from "../types/program";

type TokenTimelineProps = {
  currentTokenIndex: number;
  onTokenSelect: (tokenIndex: number) => void;
  tokens: ProgramToken[];
};

export function TokenTimeline({
  currentTokenIndex,
  onTokenSelect,
  tokens,
}: TokenTimelineProps) {
  const tokenRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useLayoutEffect(() => {
    const activeToken = tokenRefs.current[currentTokenIndex];
    activeToken?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [currentTokenIndex, tokens.length]);

  return (
    <section className="panel panel--timeline">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Timeline</p>
          <h2>Tokens</h2>
        </div>
        <span className="timeline-hint">Tap to jump</span>
      </div>

      <div className="timeline-grid">
        {tokens.map((token, index) => {
          const isCurrent = index === currentTokenIndex;
          const isPast = index < currentTokenIndex;

          return (
            <button
              className={
                token.kind === "unknown"
                  ? "token-chip token-chip--error"
                  : isCurrent
                    ? "token-chip token-chip--active"
                    : isPast
                      ? "token-chip token-chip--done"
                      : "token-chip"
              }
              key={`${token.start}-${token.value}-${index}`}
              ref={(element) => {
                tokenRefs.current[index] = element;
              }}
              onClick={() => onTokenSelect(index)}
              type="button"
            >
              <span
                className={
                  token.value === "EXP"
                    ? "token-chip__value token-chip__value--exp"
                    : "token-chip__value"
                }
              >
                {formatTokenDisplay(token.value)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
