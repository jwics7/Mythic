import {
    appearanceDefaults,
    appearanceColorFields,
    appearanceFields,
    getAppearanceValue,
    isValidAppearanceColor,
    resolveAppearance,
    resolveAppearanceMode,
} from "./appearance";

describe("appearance registry", () => {
    test("every registered appearance control owns complete metadata, defaults, validation, and a preview", () => {
        expect(appearanceFields.length).toBeGreaterThan(40);
        appearanceFields.forEach((field) => {
            expect(field.label).toBeTruthy();
            expect(field.description).toBeTruthy();
            expect(field.usedBy.length).toBeGreaterThan(0);
            expect(field.preview).toBeTruthy();
            expect(field.reset).toBeTruthy();
            expect(typeof field.validate).toBe("function");

            const defaults = getAppearanceValue(appearanceDefaults, field.path);
            expect(defaults).toEqual(field.defaultValue);
            if(field.type === "color"){
                expect(isValidAppearanceColor(defaults.dark)).toBe(true);
                expect(isValidAppearanceColor(defaults.light)).toBe(true);
                expect(field.validate(defaults.dark)).toBe(true);
                expect(field.validate(defaults.light)).toBe(true);
            } else {
                expect(field.validate(defaults)).toBe(true);
            }
        });
        expect(appearanceColorFields.every(({path}) => path.startsWith("colors."))).toBe(true);
    });

    test("table hover resolves end to end for both modes", () => {
        const appearance = resolveAppearance({
            colors: {table: {hover: {dark: "#123456", light: "#abcdef"}}},
        });

        expect(resolveAppearanceMode(appearance, "dark").color.table.hover).toBe("#123456");
        expect(resolveAppearanceMode(appearance, "light").color.table.hover).toBe("#abcdef");
        expect(appearanceColorFields.find(({path}) => path === "colors.table.hover").label).toBe("Table Row Hover");
    });

    test("invalid or missing values fall back independently", () => {
        const resolved = resolveAppearance({
            colors: {status: {error: {dark: "not-a-color", light: "#112233"}}},
        });

        expect(resolved.colors.status.error.dark).toBe(appearanceDefaults.colors.status.error.dark);
        expect(resolved.colors.status.error.light).toBe("#112233");
        expect(resolved.typography).toEqual(appearanceDefaults.typography);
    });

    test("invalid typography values use registry defaults", () => {
        const resolved = resolveAppearance({typography: {fontFamily: "", fontSize: 99}});

        expect(resolved.typography).toEqual(appearanceDefaults.typography);
    });

});
