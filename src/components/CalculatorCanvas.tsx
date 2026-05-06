import type { KeyStep } from "../types/program";
import { remapPoint } from "../logic/remapPoint";

type CalculatorCanvasProps = {
  activeStep: KeyStep | null;
  completedStepCount: number;
  markerFlashKey: string;
  progressLabel: string;
};

export function CalculatorCanvas({
  activeStep,
  completedStepCount,
  markerFlashKey,
  progressLabel,
}: CalculatorCanvasProps) {
  const markerPosition = activeStep
    ? remapPoint({
        x: activeStep.x,
        y: activeStep.y,
      })
    : null;
  const calculatorImageSrc = `${import.meta.env.BASE_URL}calgay-clean.webp`;

  return (
    <section className="panel panel--canvas">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Calculator view</p>
          <h2>Highlight the next key</h2>
        </div>
        <span className="status-pill">{progressLabel}</span>
      </div>

      <div className="calculator-stage">
        <img alt="Casio calculator" className="calculator-stage__image" draggable={false} src={calculatorImageSrc} />

        {activeStep && markerPosition ? (
          <div
            className="highlight-marker"
            style={{
              left: `${markerPosition.x}%`,
              top: `${markerPosition.y}%`,
            }}
          >
            <span className="highlight-marker__ping" key={markerFlashKey} />
          </div>
        ) : (
          <div className="calculator-stage__empty">
            Paste a program and press Parse to start the guided walkthrough.
          </div>
        )}
      </div>

      <div className="canvas-footer">
        <span>Active step is highlighted on the device image.</span>
        <strong>{completedStepCount} completed</strong>
      </div>
    </section>
  );
}
