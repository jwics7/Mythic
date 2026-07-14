import {appearanceDefaults} from "./appearance";
import {createMythicTheme, mythicFoundation} from "./createMythicTheme";

describe("createMythicTheme", () => {
    test("builds light and dark schemes with stable semantic CSS references", () => {
        const theme = createMythicTheme(appearanceDefaults);

        expect(theme.colorSchemes.dark.color.table.hover).toBe(appearanceDefaults.colors.table.hover.dark);
        expect(theme.colorSchemes.light.color.table.hover).toBe(appearanceDefaults.colors.table.hover.light);
        expect(theme.vars.color.table.hover).toMatch(/^var\(--mythic-color-table-hover,/);
        expect(theme.vars.effect.table.rowHover).toMatch(/^var\(--mythic-effect-table-rowHover,/);
        expect(theme.cssVarPrefix).toBe("mythic");
    });

    test("publishes the shared foundation scale as stable CSS variables", () => {
        const theme = createMythicTheme(appearanceDefaults);

        expect(theme.foundation).toStrictEqual(mythicFoundation);
        expect(theme.vars.foundation.radius.md).toMatch(/^var\(--mythic-foundation-radius-md,/);
        expect(theme.vars.foundation.spacing.sm).toMatch(/^var\(--mythic-foundation-spacing-sm,/);
        expect(theme.vars.foundation.typography.size.body).toMatch(/^var\(--mythic-foundation-typography-size-body,/);
        expect(theme.vars.foundation.typography.weight.semibold).toMatch(/^var\(--mythic-foundation-typography-weight-semibold,/);
        expect(theme.vars.foundation.typography.family.monospace).toMatch(/^var\(--mythic-foundation-typography-family-monospace,/);
        expect(theme.vars.effect.table.borderSoft).toMatch(/^var\(--mythic-effect-table-borderSoft,/);
        expect(theme.vars.effect.surface.subtle).toMatch(/^var\(--mythic-effect-surface-subtle,/);
        expect(theme.vars.color.application.muted).toMatch(/^var\(--mythic-color-application-muted,/);
        expect(theme.vars.color.application.raised).toMatch(/^var\(--mythic-color-application-raised,/);
        expect(theme.components.MuiButton.styleOverrides.root.borderRadius).toBe("var(--mythic-foundation-radius-md)");
    });

    test("puts production table hover on the shared MUI row state", () => {
        const theme = createMythicTheme(appearanceDefaults);
        const rowRoot = theme.components.MuiTableRow.styleOverrides.root;

        expect(rowRoot["&.MuiTableRow-hover:hover"].backgroundColor)
            .toBe("var(--mythic-effect-table-rowHover)");
    });

    test("owns application-wide table-cell defaults in the MUI override", () => {
        const theme = createMythicTheme(appearanceDefaults);
        const cellRoot = theme.components.MuiTableCell.styleOverrides.root;

        expect(cellRoot).toMatchObject({
            borderBottom: "1px solid var(--mythic-effect-table-borderSoft)",
            fontVariantNumeric: "tabular-nums",
            fontSize: "var(--mythic-foundation-typography-size-bodySmall)",
            lineHeight: 1.35,
            overflowWrap: "anywhere",
            padding: "6px 10px",
            verticalAlign: "middle",
        });
        expect(theme.components.MuiTableCell.styleOverrides.head).toMatchObject({
            fontWeight: "var(--mythic-foundation-typography-weight-bold)",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
        });
    });

    test("custom chart, tasking, image, and typography values are represented in both schemes", () => {
        const appearance = {
            ...appearanceDefaults,
            typography: {fontSize: 15, fontFamily: "Example Sans"},
            backgroundImage: {dark: "url(dark.png)", light: "url(light.png)"},
            colors: {
                ...appearanceDefaults.colors,
                chart: {
                    ...appearanceDefaults.colors.chart,
                    series10: {dark: "#010203", light: "#a1a2a3"},
                },
                tasking: {
                    ...appearanceDefaults.colors.tasking,
                    outputText: {dark: "#111111", light: "#eeeeee"},
                },
            },
        };
        const theme = createMythicTheme(appearance);

        expect(theme.typography.fontFamily).toBe("Example Sans");
        expect(theme.colorSchemes.dark.backgroundImage).toBe("url(dark.png)");
        expect(theme.colorSchemes.light.backgroundImage).toBe("url(light.png)");
        expect(theme.colorSchemes.dark.color.chart.series10).toBe("#010203");
        expect(theme.colorSchemes.light.color.tasking.outputText).toBe("#eeeeee");
    });
});
