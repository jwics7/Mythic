#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

const sourceRoot = path.resolve(__dirname, "..", "src");
const contentPath = path.join(sourceRoot, "components", "MythicComponents", "MythicContent");
const write = process.argv.includes("--write");
const targets = new Set(["Box", "aside", "div", "section"]);
const layoutTokens = new Set([
    "mythic-flex", "mythic-grid", "mythic-stack", "mythic-cluster", "mythic-inline-cluster", "mythic-inline-flex",
]);
const surfaceTone = [
    ["mythic-surface-muted", "muted"],
    ["mythic-surface-raised", "raised"],
    ["mythic-surface-subtle", "subtle"],
    ["mythic-surface", "surface"],
];
const ownedTokens = new Set([
    "mythic-border", "mythic-border-radius", "mythic-border-radius-sm", "mythic-border-radius-lg",
    "mythic-min-width-0", "mythic-overflow-hidden", "mythic-overflow-auto", "mythic-fill",
    ...surfaceTone.map(([token]) => token),
]);
const walk = (directory, results = []) => {
    fs.readdirSync(directory, {withFileTypes: true}).forEach((entry) => {
        const entryPath = path.join(directory, entry.name);
        if(entry.isDirectory()){
            walk(entryPath, results);
        }else if(/\.[jt]sx?$/.test(entryPath) && !entryPath.endsWith(".test.js")){
            results.push(entryPath);
        }
    });
    return results;
};
const relativeImport = (filePath) => {
    let relative = path.relative(path.dirname(filePath), contentPath).replaceAll(path.sep, "/");
    return relative.startsWith(".") ? relative : `./${relative}`;
};

let changedFiles = 0;
let migratedElements = 0;
const migrationLocations = [];
walk(sourceRoot).forEach((filePath) => {
    if(filePath === `${contentPath}.js`){ return; }
    const source = fs.readFileSync(filePath, "utf8");
    let ast;
    try{
        ast = parser.parse(source, {sourceType: "unambiguous", plugins: ["jsx", "classProperties", "dynamicImport"]});
    }catch(error){
        return;
    }
    const edits = [];
    traverse(ast, {
        JSXOpeningElement(elementPath) {
            const opening = elementPath.node;
            if(opening.name.type !== "JSXIdentifier" || !targets.has(opening.name.name)){ return; }
            const classAttribute = opening.attributes.find((attribute) => attribute.type === "JSXAttribute"
                && attribute.name.name === "className" && attribute.value?.type === "StringLiteral");
            if(!classAttribute){ return; }
            const tokens = classAttribute.value.value.split(/\s+/).filter(Boolean);
            const radiusToken = ["mythic-border-radius-sm", "mythic-border-radius-lg", "mythic-border-radius"]
                .find((token) => tokens.includes(token));
            const hasSurface = surfaceTone.some(([token]) => tokens.includes(token));
            const hasOverflow = tokens.includes("mythic-overflow-hidden") || tokens.includes("mythic-overflow-auto");
            if(!tokens.includes("mythic-border") || !radiusToken || (!hasSurface && !hasOverflow)
                || tokens.some((token) => layoutTokens.has(token)) || tokens.includes("mythic-border-radius-pill")){
                return;
            }
            migrationLocations.push(`${path.relative(sourceRoot, filePath)}:${opening.loc.start.line} <${opening.name.name}> ${classAttribute.value.value}`);
            const originalComponent = opening.name.name;
            const hasComponentProp = opening.attributes.some((attribute) => attribute.type === "JSXAttribute"
                && attribute.name.name === "component");
            const componentProp = originalComponent === "Box"
                ? (hasComponentProp ? "" : ' component="div"')
                : ` component="${originalComponent}"`;
            const tone = surfaceTone.find(([token]) => tokens.includes(token))?.[1] || "inherit";
            const overflow = tokens.includes("mythic-overflow-hidden") ? "hidden"
                : tokens.includes("mythic-overflow-auto") ? "auto" : "visible";
            const radius = radiusToken.endsWith("-sm") ? "sm" : radiusToken.endsWith("-lg") ? "lg" : "md";
            const variantProps = `${componentProp} density="flush" tone="${tone}" overflow="${overflow}" radius="${radius}"${tokens.includes("mythic-fill") ? " fill" : ""}`;
            edits.push({start: opening.name.start, end: opening.name.end, value: "MythicPanel"});
            edits.push({start: opening.name.end, end: opening.name.end, value: variantProps});
            edits.push({
                start: classAttribute.value.start + 1,
                end: classAttribute.value.end - 1,
                value: tokens.filter((token) => !ownedTokens.has(token)).join(" "),
            });
            const element = elementPath.parentPath.node;
            if(element.type === "JSXElement" && element.closingElement?.name.type === "JSXIdentifier"){
                edits.push({start: element.closingElement.name.start, end: element.closingElement.name.end, value: "MythicPanel"});
            }
            migratedElements += 1;
        },
    });
    if(edits.length === 0){ return; }

    const importSource = relativeImport(filePath);
    const existingImport = ast.program.body.find((statement) => statement.type === "ImportDeclaration"
        && statement.source.value === importSource);
    if(existingImport){
        const existingNames = new Set(existingImport.specifiers.filter((specifier) => specifier.type === "ImportSpecifier")
            .map((specifier) => specifier.imported.name));
        if(!existingNames.has("MythicPanel")){
            const closingBrace = source.lastIndexOf("}", existingImport.end);
            edits.push({start: closingBrace, end: closingBrace, value: `${existingNames.size > 0 ? ", " : ""}MythicPanel`});
        }
    }else{
        const imports = ast.program.body.filter((statement) => statement.type === "ImportDeclaration");
        const insertion = imports.length > 0 ? imports.at(-1).end : 0;
        edits.push({start: insertion, end: insertion, value: `\nimport {MythicPanel} from "${importSource}";`});
    }

    let output = source;
    edits.sort((left, right) => right.start - left.start).forEach((edit) => {
        output = `${output.slice(0, edit.start)}${edit.value}${output.slice(edit.end)}`;
    });
    changedFiles += 1;
    if(write){ fs.writeFileSync(filePath, output); }
});

console.log(`${write ? "Migrated" : "Would migrate"} ${migratedElements} panel contracts in ${changedFiles} files.`);
if(!write){ migrationLocations.forEach((location) => console.log(`  ${location}`)); }
if(!write && changedFiles > 0){ process.exitCode = 1; }
