function normalizeCalculatorFunctionAliases(source: string) {
  return source
    .replace(/x\u207B\u00B9/gi, "x^-1")
    .replace(/x\u00B2/gi, "x^2")
    .replace(/x\u00B3/gi, "x^3")
    .replace(/\u00B2/g, "x^2")
    .replace(/\u00B3/g, "x^3");
}

function normalizeCasioSymbols(source: string) {
  return source
    .replace(/\u00D7/g, "*")
    .replace(/\u00F7/g, "/")
    .replace(/\u2212/g, "-")
    .replace(/\u2013/g, "-")
    .replace(/->/g, "\u2192")
    .replace(/\u2260/g, "!=")
    .replace(/\u2264/g, "<=")
    .replace(/\u2265/g, ">=")
    .replace(/\u2266/g, "<=")
    .replace(/\u2267/g, ">=");
}

function normalizeStatDecorations(source: string) {
  return source
    .replace(/x\u0304/gi, "xbar")
    .replace(/y\u0304/gi, "ybar")
    .replace(/\u0233/gi, "ybar")
    .replace(/x\u0302/gi, "xhat")
    .replace(/y\u0302/gi, "yhat")
    .replace(/\u0177/gi, "yhat");
}

function normalizeDmsShortcut(source: string) {
  return source
    .replace(/\u1D52/g, "DMS")
    .replace(/\u00B0/g, "DMS")
    .replace(/\u00BA/g, "DMS")
    .replace(/\^o/gi, "DMS");
}

export function normalizeProgramText(source: string) {
  return normalizeStatDecorations(
    normalizeCasioSymbols(
      normalizeCalculatorFunctionAliases(
        normalizeDmsShortcut(source)
          .normalize("NFKC")
          .replace(/[\u200B-\u200D\uFEFF]/g, "")
          .replace(/\r\n?/g, "\n")
          .replace(/\uFF1A/g, ":"),
      ),
    ),
  );
}
