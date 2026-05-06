import type { ProgramToken } from "../types/program";

const EXPONENT_SHORTCUTS = new Map<string, string>([
  ["2", "x^2"],
  ["3", "x^3"],
  ["-1", "x^-1"],
]);

function createFoldedToken(source: ProgramToken[], startIndex: number, endIndex: number, value: string): ProgramToken {
  const firstToken = source[startIndex];
  const lastToken = source[endIndex];

  return {
    end: lastToken.end,
    index: firstToken.index,
    kind: "keyword",
    raw: source.slice(startIndex, endIndex + 1).map((token) => token.raw).join(""),
    start: firstToken.start,
    value,
  };
}

function canUseExponentShortcut(token: ProgramToken | undefined) {
  if (!token) {
    return false;
  }

  if (token.kind === "separator" || token.kind === "command" || token.kind === "unknown") {
    return false;
  }

  if (token.kind === "operator") {
    return token.value === ")";
  }

  return !token.value.endsWith("(");
}

export function foldExponentShortcutTokens(tokens: ProgramToken[]) {
  const foldedTokens: ProgramToken[] = [];

  for (let index = 0; index < tokens.length; index += 1) {
    const currentToken = tokens[index];
    const previousToken = foldedTokens[foldedTokens.length - 1];

    if (
      currentToken?.value === "^" &&
      canUseExponentShortcut(previousToken)
    ) {
      const nextToken = tokens[index + 1];
      const negativeToken = tokens[index + 1];
      const digitToken = tokens[index + 2];

      if (nextToken && EXPONENT_SHORTCUTS.has(nextToken.value)) {
        foldedTokens.push(createFoldedToken(tokens, index, index + 1, EXPONENT_SHORTCUTS.get(nextToken.value)!));
        index += 1;
        continue;
      }

      if (negativeToken?.value === "-" && digitToken?.value === "1") {
        foldedTokens.push(createFoldedToken(tokens, index, index + 2, "x^-1"));
        index += 2;
        continue;
      }
    }

    foldedTokens.push({ ...currentToken });
  }

  return foldedTokens.map((token, index) => ({
    ...token,
    index,
  }));
}
