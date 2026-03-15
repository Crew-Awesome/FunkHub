# Changelog

This changelog tracks release history from Git tags used for GitHub Releases.

Notes:
- Commit messages in early history are informal; explanations below translate likely intent.
- Version sections map to release tags.

## [Unreleased / v0.1.3-draft]

Changes after `v0.1.2` (not tagged as `v0.1.3` yet):

- `1821cf2` - `fix everythingn on versioning fuck github`  
  Final pass on versioning consistency (release tag version, build channel/version reporting, and release artifact naming alignment).

## [v0.1.2] - 2026-03-15

### Summary
- Deep-link parsing expanded and hardened (install + pair formats, legacy compatibility).
- Onboarding flow and settings UX improvements landed.
- Version/update logic was refined to avoid false update prompts.
- Settings merge behavior was fixed to avoid nested config regressions.

### Commit-by-commit
- `e60c874` - `bummrt`  
  Misc release-cycle cleanup and prep changes.
- `8b92f0d` - `deep link parsing and onboarding`  
  Added robust deep-link parsing and first-run onboarding flow.
- `fb4cb7d` - `uhm`  
  Follow-up polish/fixes on the above feature work.
- `60e3798` - `bruh`  
  Additional iteration fixes around update/deep-link behavior.
- `521db95` - `fix versioning`  
  Corrected version/channel handling for release vs InDev builds.
- `6b8b26d` - `fix merge bugs`  
  Fixed settings merge issues (especially nested config objects).

## [v0.1.1] - 2026-03-14

### Summary
- Release workflow reliability improved.
- Packaging/release process stabilized after first release.

### Commit-by-commit
- `904de87` - `Update release.yml`  
  Updated GitHub release workflow configuration.
- `a2029cb` - `fixed, hopefully :C`  
  Follow-up release pipeline fixes and stabilization.

## [v0.1.0] - 2026-03-14

### Summary
Initial public release cycle: core app implementation, engine/mod management functionality, packaging for desktop platforms, protocol handling, and docs/assets cleanup.

### Commit-by-commit
- `5c96000` - `Initial commit`  
  Project bootstrap and initial repository setup.
- `4ad0606` - `bum shit`  
  Early internal fixes/refactors during bootstrap.
- `bbb1270` - `say wallahi bro say wallahi`  
  Iteration pass on early app scaffolding.
- `75aadc4` - `services`  
  Added/expanded service-layer logic.
- `f45f61d` - `update`  
  General feature and wiring updates.
- `cc3d90a` - `make app building`  
  Build pipeline setup so the app compiles/runs.
- `e9f7cf5` - `real settings/path management end-to-end`  
  Implemented full settings and path management flow.
- `33773b4` - `updated package cus im a fat chud`  
  Package/dependency configuration updates.
- `29c2823` - `uhm`  
  General fixes and iteration pass.
- `f8cec4a` - `uhm`  
  Additional follow-up fixes.
- `d66d86e` - `fix`  
  Bug fix pass.
- `ec66e0e` - `uhm`  
  Further implementation cleanup.
- `dfe3b9c` - `try to fix`  
  Attempted fix for active issue(s).
- `b423c1c` - `change browse`  
  Updated browse/discovery behavior.
- `a371987` - `update images`  
  Updated visual/image assets.
- `adc341c` - `uhm`  
  Additional iteration/fixes.
- `ba5dbc5` - `uhm`  
  Additional iteration/fixes.
- `85aa726` - `shit`  
  General bugfix batch.
- `757711e` - `some fucking changes :)`  
  Multi-area functional updates.
- `1d2b651` - `shit ton of changes`  
  Large feature and refactor pass.
- `522fb19` - `itch io and other shit`  
  Added itch.io integration and related logic.
- `dc028c4` - `fixed versions and updated itch`  
  itch integration/version handling fixes.
- `eee6662` - `uhm`  
  Follow-up fixes.
- `83e2e17` - `fixes`  
  Bugfix pass.
- `9351f1b` - `fix`  
  Targeted fix.
- `e7e83fc` - `bum bullshit i forgot`  
  Post-merge cleanup/fix for missed issue.
- `a8f3365` - `boom more passes cus im back`  
  Additional polish and stabilization pass.
- `4a15677` - `cum`  
  Internal iteration commit during stabilization.
- `f386eb2` - `fixes, no cum this time`  
  Further bug fixes after previous pass.
- `ceaee23` - `fix launch or ima kms`  
  Critical launch/boot execution fix.
- `cea88f5` - `god fucking dammit`  
  Follow-up urgent fix after launch issues.
- `dc998e0` - `Delete .megamemory directory`  
  Removed `.megamemory` from repository.
- `dd69e7a` - `protocols and fix grid`  
  Added protocol handling and fixed UI grid behavior.
- `b0c4989` - `Merge branch 'main' of https://github.com/Crew-Awesome/FunkHub`  
  Synced branch with upstream main.
- `d519506` - `gyatt`  
  Additional iteration changes.
- `86b49e7` - `add missing categories`  
  Added missing discovery/category entries.
- `e5a56d2` - `icons and stuff`  
  Icon/branding and related UI asset updates.
- `bfe9b05` - `more fixes oh and hello debian`  
  Added Debian packaging support and related fixes.
- `ac32a48` - `fix readme and also`  
  README and supporting adjustments.
- `c8d753c` - `bum stuff`  
  General cleanup/fix pass.
- `c70ea55` - `separate appimage from deb`  
  Split Linux packaging flow for AppImage vs DEB.
- `8831a58` - `even more bummer bullshit`  
  Additional packaging/build fixes.
- `7f3be8b` - `join deb and appimage, fix icons matrix`  
  Reworked Linux packaging matrix and icon handling.
- `d7d0efc` - `fix shit`  
  Stabilization bugfix pass.
- `def681d` - `screenshots in readme`  
  Added screenshots to README.
- `119fe03` - `GNU 3.0 LICENCE`  
  Added GPL-3.0 licensing metadata for first public release.
