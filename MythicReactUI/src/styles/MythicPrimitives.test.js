const fs = require("fs");
const path = require("path");
const postcss = require("postcss");
const {PRIMITIVE_DEFINITIONS} = require("../../scripts/mythic-primitives");

describe("Mythic primitive class contract", () => {
    test("defines every registered primitive exactly once with zero specificity", () => {
        const cssPath = path.join(__dirname, "MythicPrimitives.css");
        const root = postcss.parse(fs.readFileSync(cssPath, "utf8"), {from: cssPath});
        const actual = new Map();

        root.walkRules((rule) => {
            const match = rule.selector.match(/^:where\(\.([a-zA-Z_][\w-]*)\)$/);
            expect(match).not.toBeNull();
            expect(actual.has(match[1])).toBe(false);
            expect(rule.nodes.some((node) => node.type === "decl" && node.important)).toBe(false);
            actual.set(match[1], Object.fromEntries(rule.nodes
                .filter((node) => node.type === "decl")
                .map((declaration) => [declaration.prop, declaration.value])));
        });

        expect(Object.fromEntries(actual)).toStrictEqual(PRIMITIVE_DEFINITIONS);
    });
});
