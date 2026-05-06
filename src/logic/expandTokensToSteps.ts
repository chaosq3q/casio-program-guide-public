import { formatTokenDisplay } from "./formatTokenDisplay";
import { calculatorKeyPoints } from "../data/keypoints";
import { buildKeyCoordinateMap, lookupPoint, resolvePointLabel } from "./buildKeyMap";
import { tokenDictionary } from "./tokenDictionary";
import type { KeyPoint, KeyStep, ParseError, ProgramToken } from "../types/program";

const coordinateMap = buildKeyCoordinateMap(calculatorKeyPoints);

function formatDisplayKey(key: string) {
  if (key === "DMS" || key === "x^-1" || key === "x^2" || key === "x^3") {
    return formatTokenDisplay(key);
  }

  if (key === "REPLAY_RIGHT") {
    return "\u2192";
  }

  if (key === "REPLAY_LEFT") {
    return "\u2190";
  }

  if (key === "REPLAY_UP") {
    return "\u2191";
  }

  if (key === "REPLAY_DOWN") {
    return "\u2193";
  }

  if (key === "-") {
    return "\u2212";
  }

  if (key === "*") {
    return "\u00D7";
  }

  if (key === "/") {
    return "\u00F7";
  }

  return key;
}

function expandNumberToken(value: string) {
  return value.split("");
}

function resolveTokenSequence(token: ProgramToken) {
  if (token.kind === "number") {
    return expandNumberToken(token.value);
  }

  if (tokenDictionary[token.value]) {
    return tokenDictionary[token.value];
  }

  return null;
}

function createStep(token: ProgramToken, key: string, stepIndex: number, point: KeyPoint): KeyStep {
  const buttonLabel = resolvePointLabel(key);

  return {
    buttonLabel,
    displayKey: formatDisplayKey(key),
    key,
    stepIndex,
    tokenIndex: token.index,
    tokenKind: token.kind,
    tokenValue: token.value,
    x: point.x,
    y: point.y,
  };
}

export function expandTokensToSteps(tokens: ProgramToken[]) {
  const steps: KeyStep[] = [];
  const tokenStepCounts = tokens.map(() => 0);
  const firstStepIndexByToken = tokens.map(() => -1);
  const errors: ParseError[] = [];

  for (const token of tokens) {
    const sequence = resolveTokenSequence(token);

    if (!sequence) {
      if (token.kind !== "unknown") {
        errors.push({
          index: token.start,
          message: `Unknown token near: "${token.value}"`,
          token: token.value,
        });
      }

      continue;
    }

    firstStepIndexByToken[token.index] = steps.length;
    tokenStepCounts[token.index] = sequence.length;

    for (const key of sequence) {
      const buttonLabel = resolvePointLabel(key);
      const point = lookupPoint(coordinateMap, buttonLabel) ?? lookupPoint(coordinateMap, key);

      if (!point) {
        errors.push({
          index: token.start,
          message: `Missing coordinate mapping for key: ${key}`,
          token: token.value,
        });
        continue;
      }

      steps.push(createStep(token, key, steps.length, point));
    }
  }

  return {
    errors,
    firstStepIndexByToken,
    steps,
    tokenStepCounts,
  };
}
