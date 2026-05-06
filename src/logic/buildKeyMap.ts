import type { KeyPoint } from "../types/program";

type KeyCoordinateMap = Record<string, KeyPoint>;

function normalizeLookupLabel(label: string) {
  return label
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/\u2192/g, "->");
}

function registerAlias(map: KeyCoordinateMap, aliases: string[], point: KeyPoint) {
  for (const alias of aliases) {
    map[normalizeLookupLabel(alias)] = point;
  }
}

export function buildKeyCoordinateMap(points: KeyPoint[]) {
  const map: KeyCoordinateMap = {};

  for (const point of points) {
    registerAlias(map, [point.label], point);

    if (point.label === "sqrt") {
      registerAlias(map, ["\u221A"], point);
    }

    if (point.label === "ab/c") {
      registerAlias(map, ["\u2518"], point);
    }

    if (point.label === "\u2212") {
      registerAlias(map, ["-"], point);
    }

    if (point.label === "\u00D7") {
      registerAlias(map, ["*"], point);
    }

    if (point.label === "\u00F7") {
      registerAlias(map, ["/"], point);
    }

    if (point.label === "REPLAY") {
      registerAlias(
        map,
        ["REPLAY", "REPLAY_LEFT", "REPLAY_RIGHT", "REPLAY_UP", "REPLAY_DOWN"],
        point,
      );
    }
  }

  return map;
}

export function resolvePointLabel(key: string) {
  if (key.startsWith("REPLAY_")) {
    return "REPLAY";
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

export function lookupPoint(map: KeyCoordinateMap, key: string) {
  return map[normalizeLookupLabel(key)];
}
