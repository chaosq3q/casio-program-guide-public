import { normalizeProgramText } from "./normalizeProgram";

type PastedProgramPayload = {
  html: string;
  plain: string;
};

const SUPERSCRIPT_MAP: Record<string, string> = {
  "\u2070": "^0",
  "\u00B9": "^1",
  "\u00B2": "^2",
  "\u00B3": "^3",
  "\u2074": "^4",
  "\u2075": "^5",
  "\u2076": "^6",
  "\u2077": "^7",
  "\u2078": "^8",
  "\u2079": "^9",
  "\u207A": "^+",
  "\u207B": "^-",
  "\u207D": "^(",
  "\u207E": "^)",
  "\u207F": "^n",
};

function normalizeUnicodeSuperscripts(text: string) {
  return Array.from(text)
    .map((character) => SUPERSCRIPT_MAP[character] ?? character)
    .join("");
}

function toDecoratedToken(text: string) {
  const trimmed = text.trim();

  if (trimmed === "x") {
    return "xbar";
  }

  if (trimmed === "y") {
    return "ybar";
  }

  return trimmed;
}

function isLegacyExpFont(element: Element) {
  if (element.tagName !== "FONT") {
    return false;
  }

  const size = element.getAttribute("size")?.trim();
  const text = element.textContent?.trim().toUpperCase();

  return size === "1" && text === "E";
}

function isLegacyRedKeyLegend(element: Element) {
  if (element.tagName !== "FONT") {
    return false;
  }

  const color = element.getAttribute("color")?.trim().toUpperCase();
  const text = element.textContent?.trim().toUpperCase();

  return color === "#FF0000" && (text === "M+" || text === "M-");
}

function htmlToNormalizedText(html: string) {
  const documentFragment = new DOMParser().parseFromString(html, "text/html");

  documentFragment.querySelectorAll("*").forEach((element) => {
    if (isLegacyExpFont(element)) {
      element.replaceWith("EXP");
      return;
    }

    if (isLegacyRedKeyLegend(element)) {
      element.replaceWith("");
      return;
    }

    const styleAttribute = element.getAttribute("style") ?? "";
    if (/text-decoration\s*:\s*overline/i.test(styleAttribute)) {
      element.replaceWith(toDecoratedToken(element.textContent ?? ""));
    }
  });

  documentFragment.querySelectorAll("sup").forEach((element) => {
    element.replaceWith(`^${element.textContent ?? ""}`);
  });

  documentFragment.querySelectorAll("sub").forEach((element) => {
    element.replaceWith(`_${element.textContent ?? ""}`);
  });

  return documentFragment.body.textContent ?? "";
}

export function normalizePastedProgram({ html, plain }: PastedProgramPayload) {
  const baseText = html.trim() ? htmlToNormalizedText(html) : plain;

  return normalizeProgramText(normalizeUnicodeSuperscripts(baseText));
}
