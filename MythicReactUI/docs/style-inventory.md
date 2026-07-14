# Style inventory

The baseline is the working tree at the start of the rewrite. It includes the uncommitted create-flow header flex rule that was subsequently absorbed by `MythicPageHeader`.

| Measurement | Before | After | Change |
| --- | ---: | ---: | ---: |
| Authored CSS declarations | 8,815 | 5,074 | -3,741 (-42.4%) |
| Repeated declaration occurrences | 7,153 | 3,295 | -3,858 (-53.9%) |
| Global/compatibility CSS nonblank lines | 13,504 | 8,588 | -4,916 (-36.4%) |
| Total CSS nonblank lines, including modules | 13,504 | 10,113 | -3,391 (-25.1%) |
| Static `sx` sites | 418 | 293 | -125 (-29.9%) |
| Inline `style` sites | 1,213 | 1,003 | -210 (-17.3%) |
| Runtime `styled()` definitions | 26 | 0 | -26 (-100%) |
| Duplicate declaration-block groups | not recorded | 124 | tracked going forward |

## Primitive consolidation round

This round uses the preceding “After” column as its baseline.

| Measurement | Before primitives | After primitives | Change |
| --- | ---: | ---: | ---: |
| Authored CSS declarations | 5,074 | 4,653 | -421 (-8.3%) |
| Repeated declaration occurrences | 3,295 | 2,915 | -380 (-11.5%) |
| Compatibility CSS nonblank lines | 8,588 | 7,630 | -958 (-11.2%) |
| Total CSS nonblank lines | 10,113 | 9,086 | -1,027 (-10.2%) |
| Primitive CSS nonblank lines | 0 | 109 | +109 controlled lines |
| Safely migrated selector/declaration associations | 0 | 2,983 removed | 2,820 legacy + 163 module |
| Unused legacy selector branches | 0 | 26 removed | retired |
| Simple legacy selectors providing the default radius | 200 | 0 | -200 (-100%) |

The extra primitive stylesheet is 109 nonblank lines, while the compatibility sheet lost 958. The migration added explicit class references to elements but did not reproduce the removed selector groups in another stylesheet. The increase from 124 to 149 identical declaration-block groups is caused by splitting mixed complex/simple selector groups and by the intentionally explicit primitive contract; selector/declaration associations and authored declarations are the meaningful consolidation measures for this round.

## What was removed or absorbed

- The 13,812-line `GlobalStyles.js`, `getModernThemeAdditions`, `ThemeVariables`, `useDarkMode`, and styled-components dependency.
- Duplicate appearance-field definitions and hand-authored preview color calculations.
- Legacy appearance import/export aliases and runtime names such as `theme.tableHover`.
- Broad MUI table, form, accordion, tooltip, navigation, dialog, and control restatements now owned by central component overrides.
- Retired page-header, section-header, dialog-choice, form-switch, form-note, table-empty, and state-display selectors after their shared components took ownership.
- Unused declarations in the file-browser tree, download notification, payload notification, quick-start card, event-feed row, transfer list, and related styled wrappers.
- Repeated word-breaking, menu-icon spacing, local backdrop positioning, and centered-text objects; these are now central component defaults or semantic component props.
- Forty-six selector branches belonging to retired dialog, response, C2-edge, callback-action, resizer, and generic helper classes.

## Selector-group and component-alias cleanup round

This round uses the preceding primitive-consolidation result as its baseline.

| Measurement | Before | After | Change |
| --- | ---: | ---: | ---: |
| Authored CSS declarations | 4,653 | 3,973 | -680 (-14.6%) |
| Repeated declaration occurrences | 2,915 | 2,239 | -676 (-23.2%) |
| Compatibility CSS nonblank lines | 7,630 | 6,423 | -1,207 (-15.8%) |
| Total CSS nonblank lines | 9,086 | 7,893 | -1,193 (-13.1%) |
| Primitive CSS nonblank lines | 109 | 238 | +129 controlled lines |
| All selector/declaration associations | 7,519 | 5,312 | -2,207 (-29.4%) |
| Compatibility selector/declaration associations | 6,566 | 4,415 | -2,151 (-32.8%) |
| Legacy rules with 10+ selectors | 63 | 0 | -63 (-100%) |
| Selector branches in 10+ groups | 1,463 | 0 | -1,463 (-100%) |
| Largest legacy selector group | not recorded | 9 | bounded |
| Primitive catalog classes | 30 | 73 | +43 reviewed concepts |
| Files importing `MythicTableCell` | 43 | 0 | -43 (-100%) |
| Exported zero-behavior component aliases | not recorded | 0 | now enforced |

The 129 new primitive lines replaced 1,207 compatibility lines and removed 2,151 compatibility selector/declaration associations. `MythicTableCell`, the toolbar/dropdown `MenuItem` aliases, the nested-menu rename alias, and the `MythicResizableGrid` pass-through barrel were removed. Table-cell padding, borders, typography, wrapping, and alignment now have one owner: `MuiTableCell.styleOverrides`.

The large selector groups were subsequently assigned to cohesive family owners and the legacy file was removed in the ownership round below.

## Styling ownership and reusable Chat round

This round uses the preceding selector-group result as its baseline. Moving a rule from the legacy file to a family owner is not counted as reduction; the authored totals include every family Module.

| Measurement | Before | After | Change |
| --- | ---: | ---: | ---: |
| Authored CSS declarations | 3,973 | 3,946 | -27 (-0.7%) |
| Repeated declaration occurrences | 2,239 | 2,190 | -49 (-2.2%) |
| Total CSS nonblank lines | 7,893 | 7,795 | -98 (-1.2%) |
| Legacy CSS nonblank lines | 6,423 | 0 | removed, not claimed as authored reduction |
| Primitive references | 8,913 | 4,487 | -4,426 (-49.7%) |
| `sx` sites | 293 | 266 | -27 (-9.2%) |
| Inline `style` sites | 1,003 | 1,000 | -3 (-0.3%) |
| Static primitive bundles (4+ classes) | not recorded | 268 | tracked and enforced |
| Repeated exact primitive bundle groups | not recorded | 56 | tracked and enforced |
| Exact duplicate declaration-block groups | 153 | 153 | tracked; no net increase |
| Zero-behavior component aliases | 0 | 0 | enforced |

The legacy sheet was replaced by six route-family ownership boundaries, but the before/after authored totals deliberately expose that this is primarily a traceability improvement, not a large CSS deletion. Actual reduction in this round comes from shared layout, panel, text, metadata, action, transfer-list, and dashboard-chart contracts; canonical token references; Chat event/status contracts; unused selectors; and safe duplicate-block consolidation. Forty-five repeated bordered surfaces now use `MythicPanel`, 81 repeated title/label/supporting bundles use `MythicText`, and four independently assembled transfer-list panes have one family owner. Private repeated families now also own Eventing metadata panels and accordions, browser-script panes, C2 route chips, callback table cell frames, dashboard rows, chart surfaces, and trigger-rule callouts.

Chat now uses one operation-scoped directory/read-state provider and a controlled `ChatChannelView`. The page and future overlay presentations share the full one-channel runtime. Chat styling has three cohesive owners—channel/conversation, page management, and Markdown adapter—rather than a stylesheet per extracted JavaScript component.

## Shared primitives and variants introduced

- `MythicPageHeader` / `MythicSectionHeader`, with density and action content.
- `MythicDialogLayout` form, field, section, footer, and intent variants.
- `MythicStateDisplay` loading, empty, and error states.
- `MythicDataTableRow`, using `data-state` for forced hover/selected previews and production states.
- `MythicStack`, `MythicCluster`, `MythicGrid`, `MythicScrollRegion`, and `MythicTruncatedText` layout contracts.
- `MythicPanel`, `MythicText`, `MythicToolbar`, `MythicActionGroup`, list/metadata/code/empty-state content contracts, transfer-list contracts, and the normalized `MythicStatusChip`.
- CSS Module owners for application shell, navigation, login, task display, file-browser tree, appearance editor/preview, transfer list, notifications, and shared controls.
- A 73-class zero-specificity primitive catalog covering shared visual treatments, controlled layout/flow/typography values, and compound UI concepts.
- One theme-owned radius, spacing, font-size, and font-weight scale used by MUI overrides, CSS Modules, compatibility CSS, and primitives.

## Remaining duplication

The inventory still reports identical declaration-block groups. Most are responsive one-column overrides or feature-specific state treatments whose selectors participate in different component structures. They remain explicit because merging them would either cross a media-query boundary, change cascade order, or hide a feature-specific state behind an unrecognizable utility abstraction.

The remaining repeated-value associations are on responsive rules, descendant/pseudo-state behavior, MUI internals, third-party adapters, or feature-state selectors. They cannot always receive a class at the generated runtime element. Reviewed local Module exceptions are composed through shared component APIs, conditional slots, or helpers; the allowlists are exact so new primitive duplication still fails validation.

The AST inventory classifies the current JSX styling sites as 187 static and 75 runtime `sx` props, plus 753 static and 207 runtime `style` props. The raw counts above are deliberately retained for repeatability; the small difference is text in comments or other non-JSX syntax. Remaining high-frequency static values are primarily table column widths and sizing contracts passed to split panes, virtualized lists, editors, charts, and graph wrappers. Those values remain at their layout/API boundary instead of becoming utility classes.

Eight global class tokens are intentionally supplied at runtime rather than referenced literally in JSX: Ace's `ace-monokai`, split-pane gutters, React Flow's generated C2 edge tones, and Font Awesome's `svg-inline--fa`.

Generate the current machine-readable inventory with:

```sh
npm run style:inventory -- --json
```
