## Exploration: Configure Formatters for Frontend and Backend

This document explores options for setting up code formatters across the Dental-Clinic workspace: Prettier for the frontend node application, and Spotless (with Google Java Format) for the backend Spring Boot Maven application.

### Current State
* **Frontend**: Contains Node.js/Express, EJS templates, vanilla JS files, and CSS stylesheets. There is currently no configured code formatting tool, leading to potential style inconsistencies.
* **Backend**: Standard Spring Boot 3.2.1 application targeting Java 21. No maven formatter plugin is currently configured.

---

### Affected Areas
- **Root or `frontend/`**: Location for `.prettierrc` and `.prettierignore`.
- **`frontend/package.json`**: For adding npm scripts to check and run Prettier.
- **`backend/pom.xml`**: For adding `spotless-maven-plugin` and `google-java-format` dependencies.

---

### Approaches

#### 1. Prettier Configuration Placement

| Approach | Pros | Cons | Complexity |
|---|---|---|---|
| **Option A: Root Directory** | Standard mono-repo layout. Formats the entire repository including Markdown files, workflows, and root JSON configuration. | Config files clutter root directory. | Low |
| **Option B: `frontend/` Directory** | Keeps frontend configurations localized and self-contained within the frontend subproject. | Doesn't format Markdown/YAML files outside the frontend folder unless explicitly configured. | Low |

**Recommendation**: Place `.prettierrc` and `.prettierignore` in the **root directory** to enable formatting across the entire workspace, or **`frontend/`** if we wish to keep it strictly scoped to JavaScript/CSS frontend assets. Given that the frontend contains a standalone `package.json`, placing it in `frontend/` with standard paths is very clean. However, a root configuration is better for workspace-wide standards. We recommend **Root** for a unified workspace setting, or **`frontend/`** if subproject isolation is preferred.

#### 2. npm Scripts in `frontend/package.json`
To run Prettier, we should configure:
* **Check command**: `npm run format:check` -> `prettier --check "**/*.{js,json,css,md}"`
* **Format command**: `npm run format:write` -> `prettier --write "**/*.{js,json,css,md}"`
* **`devDependencies`**: Add `"prettier": "^3.3.2"` (or current stable v3 version).

#### 3. Backend Spotless Configuration in `backend/pom.xml`
To format the Spring Boot backend codebase while matching the project's **Java 21** target:
* **Spotless Maven Plugin**: `com.diffplug.spotless:spotless-maven-plugin` version `2.43.0`
* **Google Java Format**: Version `1.22.0` (or `1.19.2`+) fully supports Java 21 language constructs (records, switch pattern matching, etc.) and compiles correctly.
* **Plugin Configuration**:
```xml
<plugin>
    <groupId>com.diffplug.spotless</groupId>
    <artifactId>spotless-maven-plugin</artifactId>
    <version>2.43.0</version>
    <configuration>
        <java>
            <googleJavaFormat>
                <version>1.22.0</version>
                <style>GOOGLE</style>
            </googleJavaFormat>
            <lineEndings>GIT_ATTRIBUTES</lineEndings>
        </java>
    </configuration>
    <executions>
        <execution>
            <goals>
                <goal>check</goal>
            </goals>
            <phase>validate</phase>
        </execution>
    </executions>
</plugin>
```

#### 4. Execution & Verification Flow

* **Manual Execution (Developer)**:
  - **Frontend**:
    - Check formatting: `npm run format:check`
    - Apply formatting: `npm run format:write`
  - **Backend**:
    - Check formatting: `mvn spotless:check`
    - Apply formatting: `mvn spotless:apply`

* **CI/Build Verification**:
  - The CI pipeline should verify code quality by running:
    - `npm run format:check` (frontend)
    - `mvn spotless:check` (backend)
  - This ensures that code style rules are strictly checked on pull requests.

---

### Risks
* **EJS Templates**: Prettier can sometimes format `.ejs` files awkwardly or require additional community plugins. We should either exclude `.ejs` from Prettier or target only `.js`, `.json`, and `.css` files.
* **Line Endings**: OS-specific line endings (LF vs CRLF) might trigger Spotless or Prettier validation failures. Adding proper `.gitattributes` or configuring `lineEndings` configuration is critical.

### Ready for Proposal
**Yes** — The implementation paths are clear. We can proceed with writing a proposal detailing the exact configuration blocks.
