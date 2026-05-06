import { useEffect, useMemo, useState } from "react";
import type { ClipboardEvent } from "react";
import { CalculatorCanvas } from "./components/CalculatorCanvas";
import { TokenTimeline } from "./components/TokenTimeline";
import { sampleProgramText } from "./data/sampleProgram";
import { formatTokenDisplay } from "./logic/formatTokenDisplay";
import { normalizePastedProgram } from "./logic/normalizePastedProgram";
import { parseProgram } from "./logic/parseProgram";
import type { ParseResult } from "./types/program";

type PlaybackMode = "step" | "token";
type ThemeName = "origin" | "toy-story";

const DEFAULT_SPEED_MS = 700;
const THEME_STORAGE_KEY = "cal-gay-auto.theme";
const DISCLAIMER_STORAGE_KEY = "cal-gay-auto.disclaimer-accepted";
const THEME_OPTIONS: Array<{
  value: ThemeName;
  label: string;
  description: string;
}> = [
  {
    value: "origin",
    label: "Original",
    description: "Keep the current warm dark calculator look.",
  },
  {
    value: "toy-story",
    label: "Toy Theme",
    description: "Bright blue, red, and yellow with a playful toy-box feel.",
  },
];

function readStoredTheme(): ThemeName {
  if (typeof window === "undefined") {
    return "origin";
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return storedTheme === "toy-story" ? "toy-story" : "origin";
}

function readStoredDisclaimerAccepted() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(DISCLAIMER_STORAGE_KEY) === "true";
}

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(target.closest("button, a, input, textarea, select, [contenteditable='true']"));
}

function formatProgress(currentStepIndex: number, totalSteps: number) {
  if (totalSteps === 0) {
    return "0 / 0";
  }

  return `${currentStepIndex + 1} / ${totalSteps}`;
}

function formatTokenProgress(currentTokenIndex: number, totalTokens: number) {
  if (totalTokens === 0) {
    return "0 / 0";
  }

  if (currentTokenIndex < 0) {
    return `0 / ${totalTokens}`;
  }

  return `${Math.min(currentTokenIndex + 1, totalTokens)} / ${totalTokens}`;
}

function renderSourcePreview(
  sourceText: string,
  tokens: ParseResult["tokens"],
  activeTokenIndex: number,
) {
  if (!sourceText) {
    return null;
  }

  if (tokens.length === 0) {
    return <span>{sourceText}</span>;
  }

  const parts: JSX.Element[] = [];
  let cursor = 0;

  tokens.forEach((token, index) => {
    if (cursor < token.start) {
      parts.push(
        <span key={`text-${cursor}`}>
          {sourceText.slice(cursor, token.start)}
        </span>,
      );
    }

    const className =
      index === activeTokenIndex
        ? "source-preview__token source-preview__token--active"
        : index < activeTokenIndex
          ? "source-preview__token source-preview__token--done"
          : token.kind === "unknown"
            ? "source-preview__token source-preview__token--error"
            : "source-preview__token";

    parts.push(
      <mark className={className} key={`token-${token.start}-${token.end}-${index}`}>
        <span className={token.value === "EXP" ? "token-display token-display--exp" : "token-display"}>
          {formatTokenDisplay(token.value)}
        </span>
      </mark>,
    );

    cursor = token.end;
  });

  if (cursor < sourceText.length) {
    parts.push(<span key={`tail-${cursor}`}>{sourceText.slice(cursor)}</span>);
  }

  return parts;
}

export function App() {
  const [sourceText, setSourceText] = useState(sampleProgramText);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>("step");
  const [speedMs, setSpeedMs] = useState(DEFAULT_SPEED_MS);
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>(readStoredTheme);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(() => !readStoredDisclaimerAccepted());

  const parseResult = useMemo(() => parseProgram(sourceText), [sourceText]);
  const { errors, firstStepIndexByToken, steps, tokenStepCounts, tokens } = parseResult;

  useEffect(() => {
    document.body.dataset.theme = selectedTheme;
    window.localStorage.setItem(THEME_STORAGE_KEY, selectedTheme);
  }, [selectedTheme]);

  useEffect(() => {
    document.body.style.overflow = isDisclaimerOpen || isThemeOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isDisclaimerOpen, isThemeOpen]);

  useEffect(() => {
    setCurrentStepIndex((previousIndex) => {
      if (steps.length === 0) {
        return 0;
      }

      return Math.min(previousIndex, steps.length - 1);
    });
  }, [steps.length]);

  useEffect(() => {
    if (!isPlaying || steps.length === 0 || errors.length > 0) {
      return;
    }

    if (playbackMode === "step" && currentStepIndex >= steps.length - 1) {
      setIsPlaying(false);
      return;
    }

    const timer = window.setInterval(() => {
      const nextIndex = getNextStepIndex({
        currentStepIndex,
        firstStepIndexByToken,
        playbackMode,
        steps,
      });

      if (nextIndex === currentStepIndex) {
        setIsPlaying(false);
        return;
      }

      setCurrentStepIndex(nextIndex);
    }, speedMs);

    return () => window.clearInterval(timer);
  }, [
    currentStepIndex,
    errors.length,
    firstStepIndexByToken,
    isPlaying,
    playbackMode,
    speedMs,
    steps,
  ]);

  const activeStep = steps[currentStepIndex] ?? null;
  const activeTokenIndex = activeStep?.tokenIndex ?? -1;
  const activeToken = activeTokenIndex >= 0 ? tokens[activeTokenIndex] ?? null : null;
  const completedStepCount = steps.length === 0 ? 0 : Math.min(currentStepIndex, steps.length - 1);
  const progressLabel = `${formatProgress(currentStepIndex, steps.length)} steps`;
  const tokenProgressLabel = `${formatTokenProgress(activeTokenIndex, tokens.length)} tokens`;
  const canAutoPlay = steps.length > 0 && errors.length === 0;
  const markerFlashKey = activeStep ? `${currentStepIndex}-${activeStep.displayKey}-${activeStep.buttonLabel}` : "none";

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.repeat) {
        return;
      }

      if (event.code !== "Space" && event.key !== " ") {
        return;
      }

      if (isInteractiveTarget(event.target)) {
        return;
      }

      if (!canAutoPlay) {
        return;
      }

      event.preventDefault();
      setIsPlaying((previous) => !previous);
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canAutoPlay]);

  function resetPlayback() {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }

  function handleParse() {
    resetPlayback();
  }

  function handleReset() {
    resetPlayback();
  }

  function handlePrevious() {
    const nextIndex = getPreviousStepIndex({
      currentStepIndex,
      firstStepIndexByToken,
      playbackMode,
      steps,
      tokenStepCounts,
    });

    setCurrentStepIndex(nextIndex);
    setIsPlaying(false);
  }

  function handleNext() {
    const nextIndex = getNextStepIndex({
      currentStepIndex,
      firstStepIndexByToken,
      playbackMode,
      steps,
    });

    if (nextIndex !== currentStepIndex) {
      setCurrentStepIndex(nextIndex);
    }

    setIsPlaying(false);
  }

  function handleTogglePlay() {
    if (!canAutoPlay) {
      return;
    }

    setIsPlaying((previous) => !previous);
  }

  function handleTokenSelect(tokenIndex: number) {
    const nextIndex = firstStepIndexByToken[tokenIndex];
    if (nextIndex == null || nextIndex < 0) {
      return;
    }

    setCurrentStepIndex(nextIndex);
    setIsPlaying(false);
  }

  function handleThemeSelect(theme: ThemeName) {
    setSelectedTheme(theme);
    setIsThemeOpen(false);
  }

  function handleDismissDisclaimer() {
    window.localStorage.setItem(DISCLAIMER_STORAGE_KEY, "true");
    setIsDisclaimerOpen(false);
  }

  function handleProgramPaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const html = event.clipboardData.getData("text/html") || "";
    const plain = event.clipboardData.getData("text/plain") || "";
    const normalized = normalizePastedProgram({ html, plain });
    const textarea = event.currentTarget;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const nextValue = `${textarea.value.slice(0, start)}${normalized}${textarea.value.slice(end)}`;

    event.preventDefault();
    textarea.setRangeText(normalized, start, end, "end");
    setSourceText(nextValue);
    resetPlayback();
  }

  return (
    <main className="app-shell">
      <div className="app-shell__backdrop" />

      <section className="main-stage">
        <section className="main-stage__calculator">
          <CalculatorCanvas
            activeStep={activeStep}
            completedStepCount={completedStepCount}
            progressLabel={progressLabel}
            markerFlashKey={markerFlashKey}
          />
        </section>

        <section className="main-stage__timeline">
          <TokenTimeline
            currentTokenIndex={activeTokenIndex}
            onTokenSelect={handleTokenSelect}
            tokens={tokens}
          />
        </section>

        <section className="main-stage__workspace">
          <section className="panel panel--editor">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Program input</p>
              </div>
              <div className="panel__header-actions">
                <span className="status-pill">{tokenProgressLabel}</span>
                <a
                  className="header-link"
                  href="https://webcal.freetzi.com/casio.fx-50FH/fx-50F_Plus.htm"
                  rel="noreferrer"
                  target="_blank"
                >
                  Open WebCal reference
                </a>
              </div>
            </div>

            <label className="textarea-wrap">
              <span className="sr-only">Program source</span>
              <textarea
                value={sourceText}
                onChange={(event) => setSourceText(event.target.value)}
                onPaste={handleProgramPaste}
                placeholder="Paste program text here"
                spellCheck={false}
              />
            </label>

            <section className="source-preview" aria-label="Highlighted source preview">
              <div className="source-preview__header">
                <span>Current token in source</span>
                <strong className={activeToken?.value === "EXP" ? "token-display token-display--exp" : "token-display"}>
                  {activeToken ? formatTokenDisplay(activeToken.value) : "None"}
                </strong>
              </div>
              <pre className="source-preview__content">{renderSourcePreview(parseResult.normalizedSource, tokens, activeTokenIndex)}</pre>
            </section>

            <div className="button-row">
              <button className="primary-button" onClick={handleParse} type="button">
                Parse
              </button>
              <button
                className="primary-button primary-button--quiet"
                disabled={!canAutoPlay}
                onClick={handleTogglePlay}
                type="button"
              >
                {isPlaying ? "Pause" : "Auto play"}
              </button>
              <button className="ghost-button" onClick={handleReset} type="button">
                Reset
              </button>
            </div>
          </section>

          <section className="panel panel--controls">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Playback</p>
                <h2>Move through steps or tokens</h2>
              </div>

              <div className="mode-toggle" role="group" aria-label="Playback mode">
                <button
                  className={playbackMode === "step" ? "mode-toggle__button is-active" : "mode-toggle__button"}
                  onClick={() => setPlaybackMode("step")}
                  type="button"
                >
                  Step
                </button>
                <button
                  className={playbackMode === "token" ? "mode-toggle__button is-active" : "mode-toggle__button"}
                  onClick={() => setPlaybackMode("token")}
                  type="button"
                >
                  Token
                </button>
              </div>
            </div>

            <div className="transport">
              <button className="transport__button" onClick={handlePrevious} type="button">
                Prev
              </button>
              <button className="transport__button transport__button--primary" onClick={handleTogglePlay} type="button">
                {isPlaying ? "Pause" : "Play"}
              </button>
              <button
                className="transport__button"
                onClick={handleNext}
                type="button"
              >
                Next
              </button>
            </div>

            <label className="speed-control">
              <div className="speed-control__row">
                <span>Speed</span>
                <strong>{speedMs} ms</strong>
              </div>
              <input
                max={3000}
                min={500}
                onChange={(event) => setSpeedMs(Number(event.target.value))}
                step={50}
                type="range"
                value={speedMs}
              />
            </label>

            <div className="info-grid">
              <article className="info-card">
                <span>Current token</span>
                <strong>{activeToken ? formatTokenDisplay(activeToken.value) : "None"}</strong>
              </article>
              <article className="info-card">
                <span>Token</span>
                <strong>{tokenProgressLabel}</strong>
              </article>
              <article className="info-card">
                <span>Current key</span>
                <strong>{activeStep?.displayKey ?? "None"}</strong>
              </article>
              <article className="info-card">
                <span>Status</span>
                <strong>{errors.length === 0 ? "Ready" : `${errors.length} warnings`}</strong>
              </article>
            </div>
          </section>
        </section>
      </section>

      <div className="floating-button-stack" aria-label="Quick actions">
        <button
          className="floating-editor-button floating-theme-button"
          onClick={() => setIsThemeOpen(true)}
          aria-label="Choose theme"
          title="Choose theme"
          type="button"
        >
          <svg aria-hidden="true" className="floating-editor-button__icon" viewBox="0 0 24 24">
            <circle cx="7" cy="8" r="2.3" />
            <circle cx="12" cy="5.8" r="2.3" />
            <circle cx="17" cy="8" r="2.3" />
            <rect x="5" y="11" width="14" height="8" rx="4" />
          </svg>
        </button>
      </div>

      {isDisclaimerOpen ? (
        <div className="theme-modal-backdrop disclaimer-modal-backdrop" role="presentation">
          <section
            aria-labelledby="disclaimer-title"
            className="theme-modal disclaimer-modal"
            role="dialog"
            aria-modal="true"
          >
            <div className="theme-modal__header">
              <div>
                <p className="eyebrow">Notice</p>
                <h2 id="disclaimer-title">Double-check before entering it on your calculator</h2>
              </div>
            </div>

            <p className="disclaimer-modal__text">
              This tool is still a prototype. Please verify the generated steps yourself before using them on a real device.
            </p>

            <div className="disclaimer-modal__actions">
              <button className="primary-button" onClick={handleDismissDisclaimer} type="button">
                I understand
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {isThemeOpen ? (
        <div className="theme-modal-backdrop" role="presentation" onClick={() => setIsThemeOpen(false)}>
          <section
            aria-labelledby="theme-selector-title"
            className="theme-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="theme-modal__header">
              <div>
                <p className="eyebrow">Theme</p>
                <h2 id="theme-selector-title">Choose theme</h2>
                <p className="theme-modal__description">
                  Switch between the original look and the Toy Theme version.
                </p>
              </div>
              <button
                className="theme-modal__close"
                onClick={() => setIsThemeOpen(false)}
                type="button"
                aria-label="Close theme selector"
              >
                x
              </button>
            </div>

            <div className="theme-option-list">
              {THEME_OPTIONS.map((theme) => (
                <button
                  className={selectedTheme === theme.value ? "theme-option-card is-active" : "theme-option-card"}
                  key={theme.value}
                  onClick={() => handleThemeSelect(theme.value)}
                  type="button"
                >
                  <div className={`theme-option-preview theme-preview-${theme.value}`} aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="theme-option-copy">
                    <strong>{theme.label}</strong>
                    <p>{theme.description}</p>
                  </div>
                  <span className="theme-option-state">
                    {selectedTheme === theme.value ? "Selected" : "Apply"}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function getNextStepIndex({
  currentStepIndex,
  firstStepIndexByToken,
  playbackMode,
  steps,
}: {
  currentStepIndex: number;
  firstStepIndexByToken: number[];
  playbackMode: PlaybackMode;
  steps: ParseResult["steps"];
}) {
  if (steps.length === 0) {
    return 0;
  }

  if (playbackMode === "step") {
    return Math.min(currentStepIndex + 1, steps.length - 1);
  }

  const currentTokenIndex = steps[currentStepIndex]?.tokenIndex ?? 0;

  for (let tokenIndex = currentTokenIndex + 1; tokenIndex < firstStepIndexByToken.length; tokenIndex += 1) {
    const nextStepIndex = firstStepIndexByToken[tokenIndex];
    if (nextStepIndex != null && nextStepIndex >= 0) {
      return nextStepIndex;
    }
  }

  return currentStepIndex;
}

function getPreviousStepIndex({
  currentStepIndex,
  firstStepIndexByToken,
  playbackMode,
  steps,
  tokenStepCounts,
}: {
  currentStepIndex: number;
  firstStepIndexByToken: number[];
  playbackMode: PlaybackMode;
  steps: ParseResult["steps"];
  tokenStepCounts: number[];
}) {
  if (steps.length === 0) {
    return 0;
  }

  if (playbackMode === "step") {
    return Math.max(currentStepIndex - 1, 0);
  }

  const currentTokenIndex = steps[currentStepIndex]?.tokenIndex ?? 0;

  for (let tokenIndex = currentTokenIndex - 1; tokenIndex >= 0; tokenIndex -= 1) {
    if (tokenStepCounts[tokenIndex] > 0) {
      const previousStepIndex = firstStepIndexByToken[tokenIndex];
      if (previousStepIndex != null && previousStepIndex >= 0) {
        return previousStepIndex;
      }
    }
  }

  return 0;
}
