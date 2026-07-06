# Design: Configure Formatters for Frontend and Backend

## Technical Approach
Configure automated code formatting and style verification across the codebase to ensure consistent code styling, reduce pull request diff noise, and automate style enforcement. This will be achieved by introducing Prettier for frontend JS/CSS/JSON/MD files (excluding EJS templates), and Spotless (with google-java-format) for Java backend source files. Consistent line endings (LF) will be enforced via Git and Spotless.

## Architecture Decisions

### Decision: Enforce LF Line Endings via Git
**Choice**: Configure `.gitattributes` to force LF endings globally (`* text=auto eol=lf`).
**Alternatives considered**: Relying on OS defaults or developer-specific Git configurations.
**Rationale**: Inconsistent line endings (LF vs CRLF) lead to formatting verification failures on different operating systems (Windows vs Linux). Forcing LF at the repository level ensures consistent behavior across all developer machines and CI environments.

### Decision: Spotless + google-java-format for Java
**Choice**: Use `spotless-maven-plugin` v2.43.0 with `google-java-format` v1.22.0 (Google style) and `removeUnusedImports` enabled.
**Alternatives considered**: Checkstyle, manual formatting, or maven-formatter-plugin.
**Rationale**: `google-java-format` is a industry-standard formatter that minimizes style debates. `spotless-maven-plugin` integrates it easily with Maven, offers unused import removal, can enforce `.gitattributes` line ending rules, and binds directly to the `validate` lifecycle phase.

### Decision: Blame History Preservation
**Choice**: Create `.git-blame-ignore-revs` at the project root.
**Alternatives considered**: Not using git blame ignore, which pollutes git blame history.
**Rationale**: Re-formatting a legacy codebase alters almost every line, masking the original authorship. Listing the formatting commit SHAs in `.git-blame-ignore-revs` allows git blame to bypass these commits and correctly attribute lines to their original authors.

## File Changes
| File | Action | Description |
|------|--------|-------------|
| [.prettierrc](file:///home/ginopc/Desarrollo/Dental-Clinic/.prettierrc) | Create | Root Prettier configuration defining singleQuote, trailingComma, and printWidth rules. |
| [.prettierignore](file:///home/ginopc/Desarrollo/Dental-Clinic/.prettierignore) | Create | Excludes EJS templates, node_modules, and build output targets from formatting. |
| [.gitattributes](file:///home/ginopc/Desarrollo/Dental-Clinic/.gitattributes) | Create | Forces LF line endings globally. |
| [.git-blame-ignore-revs](file:///home/ginopc/Desarrollo/Dental-Clinic/.git-blame-ignore-revs) | Create | Placeholder file to ignore formatting commits in git blame. |
| [frontend/package.json](file:///home/ginopc/Desarrollo/Dental-Clinic/frontend/package.json) | Modify | Adds Prettier as a devDependency and defines `format` and `format:check` npm scripts. |
| [backend/pom.xml](file:///home/ginopc/Desarrollo/Dental-Clinic/backend/pom.xml) | Modify | Adds spotless-maven-plugin to enforce Java code format and remove unused imports. |

## Interfaces / Contracts

### 1. Root Configuration Files

**`.prettierrc`**
```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100
}
```

**`.prettierignore`**
```ignore
# Exclude node_modules and build artifacts
node_modules/
dist/
build/
target/

# Exclude template files
**/*.ejs
```

**`.gitattributes`**
```text
* text=auto eol=lf
```

**`.git-blame-ignore-revs`**
```text
# Prettier frontend formatting commit
# <FRONTEND_FORMATTING_COMMIT_SHA>

# Spotless backend formatting commit
# <BACKEND_FORMATTING_COMMIT_SHA>
```

### 2. Frontend Scripts (`frontend/package.json`)
```json
  "scripts": {
    "format": "prettier --write \"**/*.{js,json,css,md}\"",
    "format:check": "prettier --check \"**/*.{js,json,css,md}\""
  },
  "devDependencies": {
    "prettier": "^3.3.2"
  }
```

### 3. Backend Spotless Configuration (`backend/pom.xml`)
```xml
            <plugin>
                <groupId>com.diffplug.spotless</groupId>
                <artifactId>spotless-maven-plugin</artifactId>
                <version>2.43.0</version>
                <configuration>
                    <lineEndings>GIT_ATTRIBUTES</lineEndings>
                    <java>
                        <googleJavaFormat>
                            <version>1.22.0</version>
                            <style>GOOGLE</style>
                        </googleJavaFormat>
                        <removeUnusedImports />
                    </java>
                </configuration>
                <executions>
                    <execution>
                        <id>spotless-check</id>
                        <phase>validate</phase>
                        <goals>
                            <goal>check</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
```

## Testing Strategy
Developers can run and verify the formatting using standard command line tools.

| Layer | What to Test | Approach |
|-------|-------------|----------|
| **Frontend Style** | Check compliance of frontend JS, CSS, JSON, and MD files | Run `npm run format:check` to check for violations; run `npm run format` to automatically apply style changes. |
| **Backend Style** | Check compliance of Java source code and unused imports | Run `mvn spotless:check` to verify; run `mvn spotless:apply` to automatically apply formatting and import cleanup. |
| **No-Regressions** | Verify formatting did not break frontend or backend functionality | Run existing frontend tests (`npm test`) and backend tests (`mvn test`) to ensure all tests pass post-formatting. |
| **EJS Exclusion** | Verify EJS files are not modified | Run `npm run format` and verify that no `.ejs` files are modified (via `git status`). |

## Migration / Rollout
To minimize merge conflicts and ensure clean history:
1. **Commit 1: Configurations**: Commit the configuration files (`.prettierrc`, `.prettierignore`, `.gitattributes`, `.git-blame-ignore-revs`) and package changes (`package.json`, `pom.xml`).
2. **Commit 2: Frontend Format**: Run `npm run format` from the `frontend/` directory and commit all formatted frontend files in a dedicated, single format-only commit. Add the commit SHA to `.git-blame-ignore-revs`.
3. **Commit 3: Backend Format**: Run `mvn spotless:apply` from the `backend/` directory and commit all formatted Java files in a dedicated, single format-only commit. Add the commit SHA to `.git-blame-ignore-revs`.

## Open Questions
- [ ] None. The specs and proposal outline all styling rules and toolchain configurations clearly.
