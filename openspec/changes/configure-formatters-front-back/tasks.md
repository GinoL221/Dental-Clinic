# Tasks: Configure Formatters for Frontend and Backend

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~52 client files to edit with JSDoc comments + global.d.ts. This will be around 600-800 lines of comment additions. |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Config) → PR 2 (Frontend Format) → PR 3 (Backend Format) |
| Delivery strategy | exception-ok |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units
- **PR 1**: Infrastructure configuration files (.prettierrc, .prettierignore, .gitattributes, .git-blame-ignore-revs) and build/package file updates (frontend/package.json, backend/pom.xml).
- **PR 2**: Apply frontend formatting.
- **PR 3**: Apply backend formatting.

## Phase 1: Configuration & Infrastructure Setup
- [x] 1.1 Create [/.prettierrc](file:///home/ginopc/Desarrollo/Dental-Clinic/.prettierrc) with JSON config.
- [x] 1.2 Create [/.prettierignore](file:///home/ginopc/Desarrollo/Dental-Clinic/.prettierignore) to ignore build targets and EJS files.
- [x] 1.3 Create [/.gitattributes](file:///home/ginopc/Desarrollo/Dental-Clinic/.gitattributes) for global LF line endings.
- [x] 1.4 Create [/.git-blame-ignore-revs](file:///home/ginopc/Desarrollo/Dental-Clinic/.git-blame-ignore-revs) with placeholders for commits.
- [x] 1.5 Modify [frontend/package.json](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/package.json) to add `prettier` under `devDependencies` and format scripts.
- [x] 1.6 Modify [backend/pom.xml](file:///home/ginopc/Desarrollo/Dental-Clinic/backend/pom.xml) with `spotless-maven-plugin`.
- [ ] 1.7 Commit these configuration files as Commit 1.

## Phase 2: Frontend Formatting & Rollout
- [x] 2.1 Run `npm install` inside the [frontend](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend) folder to install devDependencies.
- [x] 2.2 Execute `npm run format` from the [frontend](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend) directory.
- [x] 2.3 Verify `npm run format:check` runs successfully and exits with code 0.
- [x] 2.4 Verify no `.ejs` files were modified via `git status`.
- [ ] 2.5 Commit frontend formatting changes as Commit 2.
- [ ] 2.6 Append Commit 2 SHA to [/.git-blame-ignore-revs](file:///home/ginopc/Desarrollo/Dental-Clinic/.git-blame-ignore-revs).

## Phase 3: Backend Formatting & Rollout
- [x] 3.1 Run `mvn spotless:apply` in the [backend](file:///home/ginopc/Desarrollo/Dental-Clinic/backend) directory.
- [x] 3.2 Verify `mvn spotless:check` exits with 0.
- [ ] 3.3 Commit backend formatting changes as Commit 3.
- [ ] 3.4 Append Commit 3 SHA to [/.git-blame-ignore-revs](file:///home/ginopc/Desarrollo/Dental-Clinic/.git-blame-ignore-revs).

## Phase 4: Final Integration & Verification
- [ ] 4.1 Run frontend test suite (`npm test`) in [frontend](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend).
- [ ] 4.2 Run backend test suite (`mvn test`) in [backend](file:///home/ginopc/Desarrollo/Dental-Clinic/backend).
- [ ] 4.3 Verify format checks on both directories to ensure full compliance.
