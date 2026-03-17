# Release Notes and Changelog Guide

This document explains how to create release notes and maintain the changelog for FunkHub.

---

## GitHub Release Notes

Release notes are written for users and should be friendly, easy to read, and highlight the most important changes.

### Format

```markdown
## FunkHub v0.X.X - Codename

<img width="1138" height="640" alt="image" src="https://github.com/user-attachments/assets/ea5ae499-37db-479f-ba4e-de38c9e58932" />

Brief description of what this release brings.

### Highlights

* **Feature Name** - Brief explanation of what it does
* **Another Feature** - Brief explanation

### Added

* List of new features

### Changed

* List of improvements

### Fixed

* List of bug fixes

### Compare

https://github.com/Crew-Awesome/FunkHub/compare/v0.X.Y...v0.X.Z
```

### Rules

1. Use dashes (-) NOT em dashes (--) or en dashes (-)
2. Use asterisks (*) for bullet points
3. No emojis in release notes
4. Use title case for feature names in Highlights
5. Image URL is always the same: `https://github.com/user-attachments/assets/ea5ae499-37db-479f-ba4e-de38c9e58932`
6. Keep descriptions short and user-friendly
7. Compare URL format: `https://github.com/Crew-Awesome/FunkHub/compare/v{previous}...v{current}`

### Codenames

Each version should have a fun codename based on the theme:

- v0.5.0 - I Found My Mods
- v0.4.0 - Time Well Spent
- v0.3.0 - Lost in Translation
- v0.2.0 - Click and Install
- v0.1.2 - First Steps
- v0.1.1 - Release Pipeline
- v0.1.0 - Hello World

### How to Create

1. Get commits since last release:
   ```bash
   git log v0.4.0..HEAD --oneline
   ```

2. Get file changes:
   ```bash
   git diff v0.4.0..HEAD --stat
   ```

3. Read the actual code changes to understand what was implemented

4. Write the release notes following the format above

5. Create the GitHub release with the tag (e.g., v0.5.0)

---

## Changelog (CHANGELOG.md)

The changelog is a structured record of all notable changes, following the [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format.

### Format

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

## [v0.X.X] - YYYY-MM-DD

### Added
- New features

### Changed
- Improvements to existing features

### Fixed
- Bug fixes

### Removed
- Features that were removed

### Infrastructure
- CI/CD, build, or tooling changes
```

### Rules

1. Use dashes (-) NOT em dashes (--) or en dashes (-)
2. No emojis
3. Use proper Keep a Changelog sections: Added, Changed, Deprecated, Removed, Fixed, Security
4. Dates in YYYY-MM-DD format
5. Most recent version first
6. Link to GitHub compare for each version

### Sections Explained

- **Added**: New features
- **Changed**: Features that work differently than before
- **Deprecated**: Features that will be removed in future releases
- **Removed**: Features that have been removed
- **Fixed**: Bug fixes
- **Security**: Security-related changes
- **Infrastructure**: CI/CD, build tools, dependencies (internal changes)

### How to Update

1. Before releasing a new version, update the Unreleased section with changes
2. When releasing, rename Unreleased to the version number and date
3. Add a new Unreleased section for future changes
4. Run these commands to see changes:

   ```bash
   # Get commits since last tag
   git log v0.4.0..HEAD --oneline
   
   # Get file changes
   git diff v0.4.0..HEAD --stat
   
   # Get specific code changes
   git diff v0.4.0..HEAD -- app/services/ app/features/ app/providers/
   ```

5. Review the actual code to understand what changed (not just commit messages)

---

## Quick Reference

### Release Notes Checklist

- [ ] Title with version and codename
- [ ] Image (use existing URL)
- [ ] Brief description (1-2 sentences)
- [ ] Highlights section (key features)
- [ ] Added section
- [ ] Changed section
- [ ] Fixed section
- [ ] Compare link

### Changelog Checklist

- [ ] Unreleased section at top
- [ ] Version with date (YYYY-MM-DD)
- [ ] Added section
- [ ] Changed section
- [ ] Fixed section
- [ ] Removed section (if applicable)
- [ ] Infrastructure section (if applicable)
- [ ] Previous version entries intact

---

## Changelog Update Guide

This section explains how to analyze code changes and update the changelog accurately.

### Step 1: Find the Previous Tag

```bash
# List all tags
git tag -l

# Find the previous version
git describe --tags --abbrev=0
```

### Step 2: Get Commit List

```bash
# Get commits between versions
git log v0.4.0..HEAD --oneline

# Get all commits from initial release
git log v0.1.0..HEAD --oneline
```

### Step 3: Analyze File Changes

```bash
# Get summary of changed files
git diff v0.4.0..HEAD --stat

# Get changes in specific directories
git diff v0.4.0..HEAD -- app/services/ app/features/ app/providers/ electron/

# Get changes to specific file
git diff v0.4.0..HEAD -- app/services/funkhub/funkhubService.ts
```

### Step 4: Analyze Specific Features

For each changed file, read the actual code to understand what was added or modified:

```bash
# View specific file diff
git diff v0.4.0..HEAD -- app/features/library/LibraryPage.tsx | head -200
```

### Step 5: Categorize Changes

Group changes into these categories:

| Category | What goes here |
|----------|----------------|
| Added | New features, new functions, new API endpoints, new settings |
| Changed | Modified features, behavior changes, UI updates |
| Fixed | Bug fixes, error handling improvements |
| Removed | Deleted features (temporary, until next release) |
| Infrastructure | CI/CD, build scripts, dependencies |

### Step 6: Update the Changelog

1. Move Unreleased changes to the new version section
2. Add the new version with date (YYYY-MM-DD)
3. Add new Unreleased section for future changes

Example:

```markdown
## [Unreleased]

## [v0.5.0] - 2026-03-16

### Added
- New feature one
- New feature two

### Changed
- Improved feature

## [v0.4.0] - 2026-03-15

### Added
- (previous version)
```

### Common Change Patterns

#### New Feature
Look for:
- New functions in service files
- New state variables in providers
- New UI components
- New API endpoints

Example indicators:
- `export function newFeature()`
- `const [newState, setNewState] = useState()`
- `new` in commit message (but don't rely on this)

#### Bug Fix
Look for:
- Error handling additions
- Null/undefined checks
- Validation improvements

Example indicators:
- `if (!value) return` added
- `try/catch` blocks added
- `.filter()` or `.find()` added

#### UI Changes
Look for:
- Component prop changes
- Style changes
- New states (loading, error, etc.)

### Commands Quick Reference

```bash
# Full release workflow
git tag -l                          # List tags
git log v0.4.0..HEAD --oneline    # Commits since last release
git diff v0.4.0..HEAD --stat      # Files changed
git diff v0.4.0..HEAD -- app/     # App changes only
git diff v0.4.0..HEAD -- electron/ # Desktop changes only

# Check specific files
git diff v0.4.0..HEAD -- app/services/funkhub/types.ts
git diff v0.4.0..HEAD -- app/features/library/LibraryPage.tsx
```

### Tips

1. Don't trust commit messages - read the actual code
2. Group related changes together
3. Keep descriptions short but descriptive
4. Focus on user-facing changes in release notes
5. Include infrastructure changes in changelog but not release notes
6. Use present tense for Added, past tense for Fixed
