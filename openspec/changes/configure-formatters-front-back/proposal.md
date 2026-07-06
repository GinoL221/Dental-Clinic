# Proposal: Configure Formatters for Frontend and Backend

## Intent
The codebase has no automated code formatting in either the frontend (Node/Express) or backend (Spring Boot). This leads to inconsistent style, noisy diffs, and wasted review cycles. We add **Prettier** for frontend assets and **Spotless + google-java-format** for backend Java, enforcing a single agreed-upon style with zero manual effort.

## Scope

### In Scope
- Add `.prettierrc` and `.prettierignore` at the **project root**.
- Add `.gitattributes` to enforce consistent cross-platform line endings.
- Add `.git-blame-ignore-revs` to ignore formatting commits in git blame.
- Install `prettier` as a devDependency in `frontend/package.json`.
- Add `format` and `format:check` npm scripts.
- Configure `spotless-maven-plugin` with `google-java-format` in `backend/pom.xml`.
- Add `removeUnusedImports` to the Spotless Java block.

### Out of Scope
- CI pipeline integration (future change).
- Pre-commit hooks (e.g., husky/lint-staged).
- Formatting EJS templates (explicitly excluded).
- Any business-logic or test changes.

## Capabilities

### New Capabilities
- `prettier-frontend-format`: Formats JS, CSS, JSON, and MD files via `npm run format` / `npm run format:check`.
- `spotless-backend-format`: Formats Java source files via `mvn spotless:apply` / `mvn spotless:check`.

### Modified Capabilities
- `frontend-dev-scripts`: New `format` and `format:check` entries in `package.json` scripts.

## Approach
1. Create `.prettierrc` at project root with: `singleQuote: true`, `trailingComma: "all"`, `printWidth: 100`.
2. Create `.prettierignore` at project root excluding `node_modules`, `dist`, `build`, and all `*.ejs` files.
3. Create `.gitattributes` at project root with `* text=auto eol=lf`.
4. Create `.git-blame-ignore-revs` at project root with formatting commit SHA placeholders.
5. Install `prettier ^3.3.2` as a devDependency in `frontend/package.json`.
6. Add npm scripts: `"format": "prettier --write \"**/*.{js,json,css,md}\""` and `"format:check": "prettier --check \"**/*.{js,json,css,md}\""`.
7. Add `spotless-maven-plugin` v2.43.0 to `backend/pom.xml` `<build><plugins>` with google-java-format v1.22.0, GOOGLE style, `removeUnusedImports`, and `lineEndings` GIT_ATTRIBUTES. Bind `spotless:check` to the `validate` phase.

## Affected Areas
| Area | Impact | Description |
|------|--------|-------------|
| `.prettierrc` | New | Prettier config (root) |
| `.prettierignore` | New | Ignore EJS, build artifacts |
| `.gitattributes` | New / Mod | Force LF line endings |
| `.git-blame-ignore-revs` | New | Ignore style commits |
| `frontend/package.json` | Modified | Add prettier devDep + scripts |
| `backend/pom.xml` | Modified | Add spotless-maven-plugin |

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Prettier re-formats files causing large diff on first run | High | Run `npm run format` in a dedicated commit before any other changes |
| Spotless re-formats Java causing large diff on first run | High | Run `mvn spotless:apply` in a dedicated commit |
| EJS files accidentally formatted | Low | Excluded via `.prettierignore` and glob pattern |
| google-java-format incompatibility with Java 21 | Low | v1.22.0 fully supports Java 21 |

## Rollback Plan
1. Remove `.prettierrc` and `.prettierignore` from root.
2. Revert `frontend/package.json` (remove prettier dep and scripts).
3. Revert `backend/pom.xml` (remove spotless plugin block).
4. Run `git checkout` on any auto-formatted files if formatting was already applied.

## Dependencies
- Node.js / npm (already present in frontend).
- Maven (already present in backend).
- No new external services required.

## Success Criteria
- [ ] `npm run format:check` exits 0 from `frontend/` after running `npm run format`.
- [ ] `mvn spotless:check` exits 0 from `backend/` after running `mvn spotless:apply`.
- [ ] All 255 frontend tests pass unchanged.
- [ ] All backend tests pass unchanged (`mvn test`).
- [ ] `.ejs` files are untouched by Prettier.
