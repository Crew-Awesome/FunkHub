# Contributing to FunkHub

Thanks for helping improve FunkHub.

## Quick start

1. Fork the repository and create a feature branch from `main`.
2. Install dependencies: `bun install`
3. Run the app locally: `bun run electron:dev`
4. Make your changes with clear, focused commits.
5. Open a pull request using the PR template.

## Reporting bugs

- Use GitHub Issues and pick the **Bug report** template.
- Include exact repro steps, expected result, actual result, and logs.
- For one-click installs, include the full `funkhub://` link used.

## Proposing features

- Use the **Feature request** template.
- Explain the user problem first, then the proposed solution.

## Development notes

- Keep fixes scoped to one issue when possible.
- Prefer readable code over clever code.
- If you touch install/deep-link logic, test both:
  - app closed then open `funkhub://...`
  - app already open then open `funkhub://...`

## Pull request checklist

- [ ] Linked issue (if applicable)
- [ ] Repro steps included for bug fixes
- [ ] No unrelated changes bundled
- [ ] README/docs updated when behavior changes

<!-- ai-assisted prs/commits are allowed as long as you've reviewed the code and know what you're doing!! -->

## Community

- Discord: https://discord.gg/cdP7JhDv4u
