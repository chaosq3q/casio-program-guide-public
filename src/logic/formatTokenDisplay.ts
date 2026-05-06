const SUPERSCRIPT_DIGITS: Record<string, string> = {
  "0": "\u2070",
  "1": "\u00B9",
  "2": "\u00B2",
  "3": "\u00B3",
  "4": "\u2074",
  "5": "\u2075",
  "6": "\u2076",
  "7": "\u2077",
  "8": "\u2078",
  "9": "\u2079",
};

const SUPERSCRIPT_SYMBOLS: Record<string, string> = {
  "-": "\u207B",
  "+": "\u207A",
  "(": "\u207D",
  ")": "\u207E",
  o: "\u1D52",
  r: "\u02B3",
};

function toSuperscript(value: string) {
  return Array.from(value)
    .map((character) => SUPERSCRIPT_DIGITS[character] ?? SUPERSCRIPT_SYMBOLS[character] ?? character)
    .join("");
}

export function formatTokenDisplay(value: string) {
  if (value === "EXP") {
    return "E";
  }

  if (value === "DMS") {
    return toSuperscript("o");
  }

  if (value === "x^-1") {
    return toSuperscript("-1");
  }

  if (value === "x^2") {
    return toSuperscript("2");
  }

  if (value === "x^3") {
    return toSuperscript("3");
  }

  if (value === "\u03C0^r") {
    return `\u03C0${toSuperscript("r")}`;
  }

  return value
    .replace(/^\^3\u221A(\()?$/, (_match, suffix: string) => `\u221B${suffix ?? ""}`)
    .replace(/\bxbar\b/g, "x\u0304")
    .replace(/\bybar\b/g, "y\u0304")
    .replace(/\bxhat\b/g, "x\u0302")
    .replace(/\byhat\b/g, "y\u0302")
    .replace(/x\^([+\-()0-9]+)/g, (_match, exponent: string) => `x${toSuperscript(exponent)}`)
    .replace(/(sin|cos|tan)\^\((-?[\d+]+)\)\(?/g, (match, fn, exponent) => {
      const suffix = match.endsWith("(") ? "(" : "";
      return `${fn}${toSuperscript(exponent)}${suffix}`;
    })
    .replace(/(sin|cos|tan)\^(-?\d+)\(?/g, (match, fn, exponent) => {
      const suffix = match.endsWith("(") ? "(" : "";
      return `${fn}${toSuperscript(exponent)}${suffix}`;
    });
}
