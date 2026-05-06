import { tokenDictionary, tokenLexemes } from "./tokenDictionary";
import type { ParseError, ProgramToken, TokenKind } from "../types/program";

const commandTokens = new Set(["?", "\u2192", "\u25E2"]);

const operatorTokens = new Set([
  "+",
  "-",
  "*",
  "/",
  "^",
  "(",
  ")",
  "=",
  ",",
  "<",
  ">",
  ".",
  ";",
  "=>",
  "!=",
  "<=",
  ">=",
  "\u2212",
  "\u00D7",
  "\u00F7",
]);

const keywordTokens = new Set(
  Object.keys(tokenDictionary).filter((token) => {
    if (commandTokens.has(token) || operatorTokens.has(token) || token === ":") {
      return false;
    }

    if (/^\d+(\.\d+)?$/.test(token)) {
      return false;
    }

    if (/^[A-Z]$/.test(token)) {
      return false;
    }

    return true;
  }),
);

function classifyToken(value: string): TokenKind {
  if (value === ":") {
    return "separator";
  }

  if (commandTokens.has(value)) {
    return "command";
  }

  if (keywordTokens.has(value)) {
    return "keyword";
  }

  if (/^\d+(\.\d+)?$/.test(value)) {
    return "number";
  }

  if (/^[A-Z]$/.test(value)) {
    return "variable";
  }

  if (operatorTokens.has(value)) {
    return "operator";
  }

  return "unknown";
}

function createToken(index: number, value: string, start: number, end: number): ProgramToken {
  return {
    end,
    index,
    kind: classifyToken(value),
    raw: value,
    start,
    value,
  };
}

function matchLongestToken(source: string, index: number) {
  for (const lexeme of tokenLexemes) {
    if (lexeme === "M+" && shouldSplitMemoryPlus(source, index)) {
      continue;
    }

    if (source.startsWith(lexeme, index)) {
      return lexeme;
    }
  }

  return null;
}

function shouldSplitMemoryPlus(source: string, index: number) {
  if (!source.startsWith("M+", index)) {
    return false;
  }

  let nextIndex = index + 2;

  while (/\s/.test(source[nextIndex] ?? "")) {
    nextIndex += 1;
  }

  const nextCharacter = source[nextIndex] ?? "";

  if (!nextCharacter) {
    return false;
  }

  if (
    nextCharacter === ":" ||
    nextCharacter === "\u25E2"
  ) {
    return false;
  }

  return /[A-Za-z0-9?.(]/.test(nextCharacter);
}

function readNumber(source: string, index: number) {
  let cursor = index;
  let sawDot = false;

  while (cursor < source.length) {
    const char = source[cursor];
    if (/\d/.test(char)) {
      cursor += 1;
      continue;
    }

    if (char === "." && !sawDot && /\d/.test(source[cursor + 1] ?? "")) {
      sawDot = true;
      cursor += 1;
      continue;
    }

    break;
  }

  return source.slice(index, cursor);
}

function readWord(source: string, index: number) {
  let cursor = index;

  while (cursor < source.length && /[A-Za-z]/.test(source[cursor])) {
    cursor += 1;
  }

  return source.slice(index, cursor);
}

export function tokenizeProgram(source: string) {
  const tokens: ProgramToken[] = [];
  const errors: ParseError[] = [];

  let cursor = 0;

  while (cursor < source.length) {
    const char = source[cursor];

    if (/\s/.test(char)) {
      cursor += 1;
      continue;
    }

    const tokenStart = cursor;
    const matchedToken = matchLongestToken(source, cursor);

    if (matchedToken) {
      tokens.push(createToken(tokens.length, matchedToken, tokenStart, tokenStart + matchedToken.length));
      cursor += matchedToken.length;
      continue;
    }

    if (/\d/.test(char)) {
      const value = readNumber(source, cursor);
      tokens.push(createToken(tokens.length, value, tokenStart, tokenStart + value.length));
      cursor += value.length;
      continue;
    }

    if (/[A-Z]/.test(char)) {
      if (/[a-z]/.test(source[cursor + 1] ?? "")) {
        const value = readWord(source, cursor);
        tokens.push(createToken(tokens.length, value, tokenStart, tokenStart + value.length));
        errors.push({
          index: tokenStart,
          message: `Unknown token near: "${value}${source[tokenStart + value.length] === "(" ? "(" : ""}"`,
          token: value,
        });
        cursor += value.length;
        continue;
      }

      tokens.push(createToken(tokens.length, char, tokenStart, tokenStart + 1));
      cursor += 1;
      continue;
    }

    if (/[a-z]/.test(char)) {
      const value = readWord(source, cursor);
      tokens.push(createToken(tokens.length, value, tokenStart, tokenStart + value.length));
      errors.push({
        index: tokenStart,
        message: `Unknown token near: "${value}"`,
        token: value,
      });
      cursor += value.length;
      continue;
    }

    if (
      char === "." ||
      char === "," ||
      char === "+" ||
      char === "-" ||
      char === "\u00D7" ||
      char === "\u00F7" ||
      char === "^" ||
      char === "(" ||
      char === ")" ||
      char === "=" ||
      char === "<" ||
      char === ">" ||
      char === "?" ||
      char === ";" ||
      char === "\u2212"
    ) {
      tokens.push(createToken(tokens.length, char, tokenStart, tokenStart + 1));
      cursor += 1;
      continue;
    }

    tokens.push(createToken(tokens.length, char, tokenStart, tokenStart + 1));
    errors.push({
      index: tokenStart,
      message: `Unknown token near: "${char}"`,
      token: char,
    });
    cursor += 1;
  }

  return {
    errors,
    tokens,
  };
}
