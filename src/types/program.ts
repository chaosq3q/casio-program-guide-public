export type TokenKind =
  | "command"
  | "keyword"
  | "number"
  | "operator"
  | "separator"
  | "unknown"
  | "variable";

export type ProgramToken = {
  end: number;
  index: number;
  kind: TokenKind;
  raw: string;
  start: number;
  value: string;
};

export type KeyPoint = {
  id: number;
  label: string;
  x: number;
  y: number;
};

export type KeyStep = {
  buttonLabel: string;
  displayKey: string;
  key: string;
  stepIndex: number;
  tokenIndex: number;
  tokenKind: TokenKind;
  tokenValue: string;
  x: number;
  y: number;
};

export type ParseError = {
  index?: number;
  message: string;
  token?: string;
};

export type ParseResult = {
  errors: ParseError[];
  firstStepIndexByToken: number[];
  normalizedSource: string;
  sourceText: string;
  steps: KeyStep[];
  tokenStepCounts: number[];
  tokens: ProgramToken[];
};
