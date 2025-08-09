# Contributions

Thanks for taking the time to contribute! This document explains how to propose changes, the review workflow, and the commit message style we use.

**TL;DR**
> 1) Create an issue or comment on an existing one. 
> 2) Fork & branch from main. 
> 3) Make focused changes with tests. 
> 4) Use our commit style (Gitmoji). 
> 5) Open a Pull Request (PR).

## Ways to contribute

* **Bug reports**: Describe current behavior, expected behavior, steps to reproduce, and environment details.

* **Feature requests**: Explain the use case and proposed API/UX. Sketch UI/CLI flows if relevant.

* **Code contributions**: Fixes, features, refactors, perf improvements.

* **Documentation**: README sections, examples, tutorials, comments.

* **Testing & tooling**: Unit/integration tests, CI, lint rules.

> Please also review our **Code of Conduct** (see `CODE_OF_CONDUCT.md`) before participating.

## Project workflow

1. **Discuss**: Open or pick up an issue so we can align on scope.

2. **Fork & branch**: Branch from main.

    * Branch naming: `<type>/<short-topic>` or `<type>/<scope>-<topic>`
    * Examples: `feat/ui-3d-shelf-grid`, `fix/api-null-abv`, `docs/contributing`.

3. **Develop**: Keep commits small and cohesive. Include/adjust tests and docs.

4. **Quality checks**:
    * Run linters/formatters and all tests locally.
    * Ensure CI passes.

5. **Pull Request**:
    * Use a clear title (same style as commits).
    * Fill in the PR template (impact, screenshots, breaking changes).
    * Reference issues with Closes #123.

> We prefer squash merges. The PR title becomes the merge commit; please keep it descriptive.

## Commit message style (Gitmoji)

We follow [Gitmoji](https://gitmoji.dev/) so each commit starts with an emoji that communicates intent at a glance. This keeps history skimmable and helps automate release notes.

### Format

```
<type>(<scope>)<!>: <short summary>

[optional body]

[optional footer(s)]
```
* **Emoji**: Use the actual emoji (preferred) or the shortcode like :sparkles: if your environment lacks emoji support.

* **Summary**: Imperative mood ("add", "fix", "refactor"), aim for ≤ 50 chars.

* **Scope** (optional): Area affected, e.g., ui, api, docs.

* **Body** (optional): What and why; wrap at ~72 chars.

* **Footers** (optional): Issue refs (e.g., Closes #123) and breaking changes.

### Common gitmoji

(See the full catalog and meanings at [gitmoji.dev](https://gitmoji.dev/).)

* ✨  New feature

* 🐛  Bug fix

* 📝  Documentation changes

* 🎨  Code style/formatting (non-functional)

* ♻️  Refactor

* ⚡️  Performance improvement

* ✅  Add/update tests

* 🚨  Fix linter/QA warnings

* 📦️ Dependencies / build

* 👷  CI

* 🔧  Config files

* 🔒  Security-related fix

* 🔥  Remove code or files

* 💄  UI/UX tweaks

* 🚑️ Hotfix

* ⏪️ Revert changes

* 🚀  Deploy/release

* ➕  Add a dependency

* ➖  Remove a dependency

* ⬆️  Upgrade dependencies

* ⬇️  Downgrade dependencies

* 💥  Breaking change

### Breaking changes

Use 💥 at the start and include a `BREAKING CHANGE:` footer describing impact and migration steps.

### Issue references

Add footers like `Closes #123` / `Fixes #123` to auto-close issues on merge.

### Examples

```
✨(ui): add 3D rack visualization with orbit controls

- basic bottle geometry and slots
- exposes `RackGrid` component
Closes #42
```
```
🐛(api): handle null SG when calculating ABV

Guard against missing readings to avoid NaNs in batch summary.
Closes #57
```
```
💥(core): replace shelf ID scheme with UUIDs

BREAKING CHANGE: shelf IDs are now UUIDv4; run `tools/migrate_shelf_ids`
before upgrading existing configs.
```
```
⏪️ revert: ✨(ui): add experimental shader material

Reverts commit 8b42c1b due to rendering glitches on low-end GPUs.
```

### Optional: tooling

* Consider using `gitmoji-cli` for prompts and consistency: `npx gitmoji -c`.

* Configure your editor/CI to allow Unicode in commit titles.

### PR titles

PR titles should **start with the same emoji** and follow the same style as commits. We prefer squash merges, so the PR title becomes the merge commit.

## Coding standards

* Follow the existing code style. If none is defined, prefer:
    * Consistent formatter (e.g., Prettier for JS/TS; Black for Python).
    * Lint clean (ESLint/Flake8/etc.).

* Add/update tests for all user-facing changes.
* Update docs (README/examples) when behavior or APIs change.

## Security & responsible disclosure

If you believe you’ve found a vulnerability, please do not open a public issue. Instead, contact the maintainers privately (see SECURITY.md) so we can triage and fix it responsibly.

## License

By contributing, you agree that your contributions are licensed under the project’s LICENSE and that you have the right to contribute the code/content.

## Maintainers: review guidelines (for repo owners)
* Confirm scope/issue alignment and user impact.
* Ensure commit/PR titles follow the style.
* Prefer squash merge with a clean, conventional title.
* Tag breaking changes and update release notes.