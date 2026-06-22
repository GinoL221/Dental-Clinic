# Proposal: Refactor Frontend CSS Modularization

## Intent

Our custom `style.css` is a monolithic file that mixes tokens, layout, components, and view-specific styles. This makes maintenance hard: changing a button style requires scanning the entire file, and view-specific rules bleed into unrelated pages. This refactor restructures the CSS into a modular, maintainable hierarchy without changing any visual output.

## Scope

### In Scope
- Split monolithic `style.css` into categorized modules (base, components, layout, views, utilities)
- Create shared base layer (tokens, layout, typography) used by all views
- Create per-view CSS files for page-specific styles
- Update HTML templates to reference new CSS structure
- Preserve pixel-identical visual output

### Out of Scope
- Changing any visual styles, colors, spacing, or layouts
- Modifying Bootstrap CSS (loaded from CDN, untouched)
- Adding new features or UI components
- Migrating to a CSS preprocessor or framework
- JavaScript or backend changes

## Capabilities

> This section is the CONTRACT between proposal and specs phases.

### New Capabilities
- None — this is a pure refactor, no new capabilities.

### Modified Capabilities
- None — existing behavior is preserved exactly.

## Approach

**Hybrid modularization (Option C)**: shared base layer + per-view overrides.

1. **Extract base layer**: CSS variables, reset/normalize, container/grid rules, typography → `base/`
2. **Extract components**: buttons, forms, cards, alerts, tables → `components/`
3. **Extract layout**: header, nav, footer → `layout/`
4. **Extract view-specific**: landing, auth, dashboard, dentists, patients, appointments → `views/`
5. **Extract utilities**: animations, responsive breakpoints → `utilities/`
6. **Update templates**: replace single `style.css` link with appropriate module imports per view
7. **Visual verification**: compare before/after screenshots to confirm pixel-identical output

Structure follows **Section Rule / Scope Rule** from Gentleman Programming book:
```
css/
  base/
    tokens.css        # Variables CSS, reset, normalize
    layout.css        # Contenedores, grid, estructura
    typography.css    # Tipografía
  components/
    buttons.css       # Botones, inputs, forms
    cards.css         # Cards, panels
    alerts.css        # Mensajes flash
    tables.css        # Tablas de datos
  layout/
    header.css        # Nav, header
    footer.css        # Footer
  views/
    landing.css
    auth.css
    dashboard.css
    dentists.css
    patients.css
    appointments.css
  utilities/
    animations.css
    responsive.css
```

Bootstrap CSS (CDN) remains untouched — we split only our custom CSS.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/main/resources/static/css/style.css` | Removed | Monolithic file split into modules |
| `src/main/resources/static/css/base/` | New | Shared tokens, layout, typography |
| `src/main/resources/static/css/components/` | New | Reusable component styles |
| `src/main/resources/static/css/layout/` | New | Header, footer, nav structures |
| `src/main/resources/static/css/views/` | New | Per-view specific styles |
| `src/main/resources/static/css/utilities/` | New | Animations, responsive rules |
| `src/main/resources/templates/**/*.html` | Modified | Update CSS link tags to new structure |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| CSS specificity changes cause visual differences | Medium | Manual visual comparison per view; keep original selectors intact |
| Missing selector during split (orphaned rule) | Medium | Grep all selectors from original; verify each appears in new files |
| Template CSS link order causes cascade issues | Low | Document load order; test each view individually |
| Bootstrap dependency assumptions broken | Low | Bootstrap CDN untouched; verify no custom CSS overrides Bootstrap incorrectly |

## Rollback Plan

1. Revert git commit — all changes are file moves and template updates
2. Restore original `style.css` from git history
3. Revert template changes to single `style.css` link
4. No database or backend changes to roll back

## Dependencies

- None — pure frontend refactor, no backend or external dependencies

## Success Criteria

- [ ] All views render pixel-identical to current production
- [ ] No CSS selectors lost during split (grep verification)
- [ ] Each view loads only its required CSS modules (no unused imports)
- [ ] No visual regressions on mobile/responsive breakpoints
- [ ] Original `style.css` fully decomposed — no orphaned rules remain
