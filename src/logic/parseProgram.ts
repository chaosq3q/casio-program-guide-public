import { expandTokensToSteps } from "./expandTokensToSteps";
import { foldExponentShortcutTokens } from "./foldExponentShortcutTokens";
import { normalizeProgramText } from "./normalizeProgram";
import { tokenizeProgram } from "./tokenizeProgram";
import type { ParseResult } from "../types/program";

export function parseProgram(sourceText: string): ParseResult {
  const normalizedSource = normalizeProgramText(sourceText);
  const { errors: tokenErrors, tokens: rawTokens } = tokenizeProgram(normalizedSource);
  const tokens = foldExponentShortcutTokens(rawTokens);
  const {
    errors: expansionErrors,
    firstStepIndexByToken,
    steps,
    tokenStepCounts,
  } = expandTokensToSteps(tokens);

  return {
    errors: [...tokenErrors, ...expansionErrors],
    firstStepIndexByToken,
    normalizedSource,
    sourceText,
    steps,
    tokenStepCounts,
    tokens,
  };
}
