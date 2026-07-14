# Mythic theme and styling system

## Finding the owner of a style

Start with the element in browser devtools. Shared contracts expose `data-mythic-component`; their variants use `data-tone`, `data-density`, `data-selected`, `data-disabled`, and `data-interactive`. Run the trace command with any component name, class, CSS token, or file fragment:

```sh
npm run style:trace -- panel
npm run style:trace -- mythic-chat-inline-event
npm run style:trace -- --mythic-color-table-hover
npm run style:trace -- MuiTableCell
```

The trace reports the JSX owner, shared component/variant, CSS owner, declarations, theme tokens, and appearance field when one exists.

Use this ownership decision tree when editing or adding a style:

1. MUI-wide Button, Input, Table, Dialog, Menu, Tab, Chip, Tooltip, or slot behavior belongs in `src/themes/createMythicTheme.js`.
2. A visual or layout concept used by more than one feature belongs in `src/components/MythicComponents` as a curated component or variant.
3. A concept repeated within one feature belongs in a private component for that feature family.
4. Unique layout, responsive behavior, or pseudo-state belongs in that component family's single cohesive CSS Module.
5. React Flow, Ace, xterm, Markdown, chart, virtualization, and drag/drop internals belong in the owning adapter module.
6. Redundant MUI defaults and obsolete selectors are deleted.

`src/styles/families` is the searchable ownership boundary for the remaining global route-family selectors. It has six intentionally broad owners instead of per-page copies. It is closed to new reusable declarations: touched common behavior moves to a shared contract, while touched unique behavior moves beside its real component family. `LegacyGlobalStyles.css`, `createLegacyCssVariables.js`, and their obsolete migration scripts have been removed and validation prevents the runtime artifacts from returning.

## Shared visual contracts

Feature and page JSX should normally use these APIs instead of assembling primitive lists:

- Layout: `MythicStack`, `MythicCluster`, `MythicGrid`, `MythicScrollRegion`, and `MythicTruncatedText`. `MythicStack` also owns named fill, full-size, overflow, and positioning variants for bounded workspaces.
- Surfaces: `MythicPanel` with `tone`, `density`, `layout`, `overflow`, `fill`, and `interactive` variants.
- Controls: `MythicToolbar`, `MythicActionGroup`, and `MythicActionButton`.
- Content: `MythicText` presets, `MythicListRow`, `MythicMetadataList`, `MythicMetadataItem`, `MythicCodeSurface`, and `MythicEmptyState`.
- Transfer lists: `MythicTransferListPane`, `MythicTransferLayout`, and `MythicTransferButton`; pages provide data and selection behavior without rebuilding the visual shell.
- Status: `MythicStatusChip` with normalized tone and size variants.
- Existing families: `MythicPageBody`, `MythicPageHeader`, `MythicSectionHeader`, dialog layouts, state displays, and data tables.

Primitive classes in `src/styles/MythicPrimitives.css` are zero-specificity implementation tools used inside those contracts. They are a finite vocabulary, not a utility framework and not the first choice for page composition. A placement-specific `className` may extend a shared component, but it must not restate the component's owned surface, spacing, border, or state behavior; add a curated variant instead.

For example:

```jsx
<MythicPanel layout="stack" gap="md" tone="muted" overflow="auto">
    <MythicToolbar density="compact">...</MythicToolbar>
    <MythicText preset="label">Selected channel</MythicText>
    <MythicScrollRegion>...</MythicScrollRegion>
</MythicPanel>
```

Import MUI components directly. Application-wide behavior belongs in the theme, so pass-through aliases are forbidden:

```jsx
import TableCell from "@mui/material/TableCell";

<TableCell>Operator</TableCell>
```

## Theme ownership and performance

Operator appearance settings live under `preferences.appearance`. The schema, defaults, validation, editor metadata, search text, and preview type have one owner: `src/themes/appearance.js`.

Every editable color follows one mapping. Table row hover is:

| Layer | Value |
| --- | --- |
| Saved setting | `appearance.colors.table.hover` |
| Runtime token | `useMythicTokens().color.table.hover` |
| CSS token | `--mythic-color-table-hover` |
| Editor label | Table Row Hover |

Add operator-facing colors to that registry. Do not add a separate setting form, preview calculation, or compatibility palette name. `createMythicTheme()` resolves light and dark schemes together. `createDerivedThemeVariables.js` derives purpose-based effects while the theme is built; it is not a runtime legacy stylesheet or a second appearance schema.

CSS-capable components use `useMythicTheme()`, `theme.vars`, or `--mythic-*` variables and do not subscribe to mode. Only canvas, SVG, graph, chart, and editor integrations that require concrete color strings call `useMythicTokens()`.

Mode uses the existing `theme` local-storage key and `data-mythic-color-scheme`. `InitColorSchemeScript` applies it before paint. A mode toggle updates the attribute and stored value without rebuilding or replacing the theme, and `forceThemeRerender` remains disabled.

## Appearance editor and previews

`AppearanceEditor` is generated from `appearanceFieldGroups` and keeps an isolated draft. Picker input is immediate; only its isolated preview update is deferred. Save performs one appearance update and provider rebuild, while cancel never mutates the active theme.

`AppearancePreview` uses the production resolver, two-scheme factory, CSS variables, MUI components, and shared contracts. It renders light and dark together. Interactive previews use production state contracts—for example, table hover forces the same `MythicDataTableRow` state used by a real table.

## Chat ownership

`src/components/Chat/ChatDirectoryContext.js` owns the operation-scoped channel directory, read state, unread count, and subscriptions. Navigation and the Chat page consume this single provider. It clears on logout or operation change.

`ChatChannelView` is the controlled, reusable one-channel runtime. `active` gates message/request queries and subscriptions, `channelId` selects the only live stream, and `presentation="page" | "overlay"` changes layout without removing interactions. `ChatPage` owns directory management and persisted page selection. The future any-page launcher can supply its own selected channel and render the overlay presentation without copying Chat state or styling.

Chat has three styling owners: the reusable channel/conversation module, the page-only directory/management module, and the Markdown adapter. Private message, composer, event, delegation, and tool-output components reuse those owners rather than creating one stylesheet per file.

## Validation

Run:

```sh
npm run style:check
CI=true npm run react-test -- --watchAll=false --runInBand
npm run build
```

Style validation checks CSS Module family ownership and references, unused local classes, primitive registry accuracy, duplicate runtime primitive tokens, component identity aliases, removed legacy artifacts, safely migratable Module declarations, and idempotence of the migration/consolidation scripts. The panel and semantic-text codemods are dry-runnable and must remain idempotent. The inventory reports shared contracts, declarations, selector associations, primitive leakage, static styling sites, and exact duplicate blocks.
