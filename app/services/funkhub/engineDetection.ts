import type { EngineSlug } from "./types";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function includesAny(text: string, tokens: string[]): boolean {
  return tokens.some((token) => {
    const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(token)}([^a-z0-9]|$)`, "i");
    return pattern.test(text);
  });
}

export function detectRequiredEngineFromMetadata(input: {
  name?: string;
  text?: string;
  rootCategoryName?: string;
}): EngineSlug | undefined {
  const haystack = `${input.name ?? ""} ${input.text ?? ""} ${input.rootCategoryName ?? ""}`.toLowerCase();

  if (includesAny(haystack, ["base game", "basegame", "v-slice", "vanilla"])) {
    return "basegame";
  }
  if (includesAny(haystack, ["ale psych", "ale-psych", "ale engine"])) {
    return "ale-psych";
  }
  if (includesAny(haystack, ["psych", "psych engine", "psychengine"])) {
    return "psych";
  }
  if (includesAny(haystack, ["codename", "codename engine"])) {
    return "codename";
  }
  if (includesAny(haystack, ["fps+", "fps plus"])) {
    return "fps-plus";
  }
  if (includesAny(haystack, ["js engine", "fnf js"])) {
    return "js-engine";
  }
  if (includesAny(haystack, ["p-slice", "pslice"])) {
    return "p-slice";
  }

  return undefined;
}
