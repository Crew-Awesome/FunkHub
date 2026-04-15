# Engine Category Hardcode Draft

This is the editable draft before replacing the current detector with hardcoded category rules.

## How the current detector works

Today the launcher uses a mixed strategy:

1. `app/services/funkhub/installer.ts` → `detectRequiredEngine()`
2. If `mod.requiredEngine` already exists on the fetched profile, it uses that.
3. Otherwise it calls `detectRequiredEngineFromMetadata()` in `app/services/funkhub/engineDetection.ts`.
4. That fallback is **text-driven**, using keywords from:
   - mod name
   - mod text/description
   - root category name
5. Executable detection is also mixed:
   - file extension (`.exe`, `.msi`, `.app`, `.dmg`, `.pkg`, `.appimage`, `.sh`, `.bat`)
   - category IDs in `installer.ts`
   - keyword hints like `launcher`, `runtime`, `portable`, `binary`

## Why this should change

Your category structure is now strong enough that engine detection should be driven primarily by **GameBanana category IDs**, not by text heuristics. That makes installs more predictable and avoids false matches from descriptions.

## Live category snapshot used for this draft

Fetched from the current FNF GameBanana category endpoints (`_idGameRow=8694`).

### Root categories

| ID | Name | Proposed meaning |
|---|---|---|
| 3827 | Executables | executable |
| 43772 | Legacy Categories (DO NOT UPLOAD THERE) | legacy / do not auto-map broadly |
| 43771 | Mod Folders | container only |
| 3046 | Other/Misc | unknown / no engine inference |
| 3828 | Translations | unknown / no engine inference |

### Mod Folders children

| ID | Name | Proposed engine |
|---|---|---|
| 28367 | Psych Mod Folders | psych |
| 29202 | Base Game Mod Folders | basegame |
| 34764 | Codename Mod Folders | codename |
| 43773 | Other/Misc Mod Folders | container only |

### Other/Misc Mod Folders children

| ID | Name | Proposed engine |
|---|---|---|
| 43798 | P-Slice Engine Mod Folders | p-slice |
| 43850 | FPS+ Engine Mod Folders | fps-plus |
| 44037 | ALE Engine Mod Folders | ale-psych |

### Direct engine category

| ID | Name | Proposed engine |
|---|---|---|
| 44036 | JS Engine Mod Folders | js-engine |

### Legacy category children

These are currently under `Legacy Categories (DO NOT UPLOAD THERE)`.

| ID | Name | Proposed engine |
|---|---|---|
| 3819 | New Songs | no hard map |
| 3821 | New Songs + Skins | no hard map |
| 3825 | Remixes/Recharts | no hard map |
| 3826 | Remixes/Recharts + Skins | no hard map |
| 3833 | Skins | no hard map |
| 38080 | Mobile Compatible (Base) | maybe basegame, needs confirmation |

## Proposed hardcoded rule set

### Engine by category ID

```md
28367 -> psych
29202 -> basegame
34764 -> codename
43798 -> p-slice
43850 -> fps-plus
44037 -> ale-psych
44036 -> js-engine
```

### Executable by category ID

```md
3827 -> executable
```

## Proposed behavior rules

1. Check `category.id`, `superCategory.id`, and `rootCategory.id` against the hardcoded map.
2. If any category matches an engine ID above, set that engine.
3. If any category matches `3827`, treat as executable.
4. Do **not** infer executable from `3046` (Other/Misc) or `3828` (Translations) by default.
5. Do **not** infer engine from legacy categories unless we explicitly approve specific legacy IDs.
6. Keep file-extension executable detection only as a fallback safety net, not as the primary signal.
7. Remove text/name/description keyword engine detection once this map is approved.

## Recommended cleanup after approval

- Delete or bypass `detectRequiredEngineFromMetadata()` for install routing.
- Replace `HYBRID_EXECUTABLE_CATEGORY_IDS = [3046, 3828]` because those current IDs are broad roots, not true executable categories.
- Move all approved mappings into one explicit constant like `ENGINE_CATEGORY_MAP` and `EXECUTABLE_CATEGORY_IDS`.

## Review checklist

- [ ] `44036` JS Engine Mod Folders should map to `js-engine`
- [ ] `44037` ALE Engine Mod Folders should map to `ale-psych`
- [ ] `43850` FPS+ Engine Mod Folders should map to `fps-plus`
- [ ] `43798` P-Slice Engine Mod Folders should map to `p-slice`
- [ ] `34764` Codename Mod Folders should map to `codename`
- [ ] `29202` Base Game Mod Folders should map to `basegame`
- [ ] `28367` Psych Mod Folders should map to `psych`
- [ ] `3827` Executables should be the only hard executable category
- [ ] Legacy category `38080` Mobile Compatible (Base) should / should not map to `basegame`
- [ ] No other legacy categories should auto-map

## My recommendation

The safest hardcoded version is:

- hardcode the 7 engine category IDs above
- hardcode `3827` as executable
- stop using text-driven engine inference
- stop treating `3046` and `3828` as hybrid executable categories
- leave legacy categories unmapped unless you explicitly approve them
