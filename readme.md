# Fresh!

A cross-platform Friday Night Funkin' launcher with mod and engine support.

## Project Status

**Phase:** Pre-development / Planning

Fresh! is a new launcher project currently in the planning stage. The repository contains initial branding assets and is being structured for active development.

## Core Features

- **Mod Discovery** - Browse and search mods from sources like GameBanana and Game Jolt
- **Engine Support** - Install and manage multiple FNF engines (Base FNF, Kade Engine, Psych Engine, etc.)
- **Install & Import** - Automated mod/engine installation with dependency resolution
- **Launch Profiles** - One-click launch with custom configurations per mod/engine combo
- **Cross-Platform** - Desktop support for Windows, macOS, and Linux

## Technology Stack

- **Frontend:** TBD (considering Electron or Tauri for cross-platform)
- **Backend:** TBD (could be Node.js, Rust, or embedded)
- **Data Sources:** GameBanana API, Game Jolt API
- **Package Format:** .exe (Windows), .app (macOS), AppImage/deb (Linux)

_Stack decisions will be documented in `docs/architecture.md` once the team agrees on the tech direction._

## Folder Structure

```
FunkHub/                     # Root (project root)
├── README.md                  # This file
├── .gitignore                # Git ignore rules
├── docs/                     # Project documentation
│   ├── architecture.md       # Technical architecture notes
│   ├── roadmap.md            # Feature roadmap and milestones
│   └── CONTRIBUTING.md        # Contribution guidelines
├── Branding/                 # Brand assets
│   ├── icon*.png              # App icons
│   ├── *.psd                  # Source files
│   ├── *.ttf                  # Fonts
│   └── PALETTE.md             # Color palette
└── src/                      # Source code (future)
    ├── main/                  # Main application code
    ├── renderer/              # UI code
    └── shared/                # Shared utilities
```

## What's Already Here

- Branding assets (icons, banners, fonts)
- Color palette (defined in `Branding/PALETTE.md`)

## What's Missing

- No source code yet
- No build configuration
- No mod/engine integration
- No API client implementations
- No launch profiles system
- No installer

_See `docs/roadmap.md` for the full feature timeline._

## Getting Started

This project is not yet buildable. For now:

1. Review `docs/architecture.md` and `docs/roadmap.md`
2. Discuss tech stack choices in issues
3. Claim a module from the roadmap to prototype

## Contributing

See `docs/CONTRIBUTING.md` for contribution setup and guidelines.

## License

TBD - Will be determined when source code is added.