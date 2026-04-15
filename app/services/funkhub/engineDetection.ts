import type { EngineSlug, GameBananaModProfile } from "./types";

const ENGINE_CATEGORY_MAP: Partial<Record<number, EngineSlug>> = {
  28367: "psych",
  29202: "basegame",
  34764: "codename",
  43798: "p-slice",
  43850: "fps-plus",
  44037: "ale-psych",
  44036: "js-engine",
};

const EXECUTABLE_CATEGORY_IDS = new Set([3827]);

type CategoryLike = {
  id?: number;
  name?: string;
  profileUrl?: string;
} | undefined;

export function collectModCategoryIds(input: {
  rootCategory?: CategoryLike;
  category?: CategoryLike;
  superCategory?: CategoryLike;
}): number[] {
  return [input.category?.id, input.superCategory?.id, input.rootCategory?.id]
    .filter((value): value is number => typeof value === "number" && value > 0);
}

export function detectRequiredEngineFromCategories(input: {
  rootCategory?: CategoryLike;
  category?: CategoryLike;
  superCategory?: CategoryLike;
}): EngineSlug | undefined {
  const categoryIds = collectModCategoryIds(input);

  for (const categoryId of categoryIds) {
    const engine = ENGINE_CATEGORY_MAP[categoryId];
    if (engine) {
      return engine;
    }
  }

  return undefined;
}

export function detectExecutableFromCategories(input: {
  rootCategory?: CategoryLike;
  category?: CategoryLike;
  superCategory?: CategoryLike;
}): boolean {
  return collectModCategoryIds(input).some((categoryId) => EXECUTABLE_CATEGORY_IDS.has(categoryId));
}

export function detectRequiredEngineForProfile(mod: Pick<GameBananaModProfile, "rootCategory" | "category" | "superCategory">): EngineSlug | undefined {
  return detectRequiredEngineFromCategories(mod);
}
