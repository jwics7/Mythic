#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

const sourceRoot = path.resolve(__dirname, "..", "src");
const contentPath = path.join(sourceRoot, "components", "MythicComponents", "MythicContent");
const write = process.argv.includes("--write");
const targets = new Set(["Box", "Typography", "div", "span", "strong", "p"]);
const presets = [
    ["title", "mythic-font-size-body-small mythic-font-weight-heavy mythic-line-height-tight mythic-text-primary"],
    ["label", "mythic-font-size-caption mythic-font-weight-heavy mythic-line-height-tight mythic-text-secondary"],
    ["supporting", "mythic-font-size-caption mythic-font-weight-medium mythic-line-height-normal mythic-text-secondary"],
    ["section-title", "mythic-font-size-body-small mythic-font-weight-bold mythic-line-height-snug mythic-text-primary"],
    ["compact-title", "mythic-font-size-small mythic-font-weight-heavy mythic-line-height-tight mythic-text-primary"],
    ["eyebrow", "mythic-font-size-xs mythic-font-weight-extra-bold mythic-letter-spacing-reset mythic-text-secondary"],
    ["caption", "mythic-font-size-xs mythic-font-weight-medium mythic-line-height-normal mythic-text-secondary"],
    ["item-title", "mythic-break-anywhere mythic-font-size-small mythic-font-weight-extra-bold mythic-line-height-snug mythic-min-width-0 mythic-text-primary"],
    ["value", "mythic-break-anywhere mythic-font-size-small mythic-font-weight-strong mythic-line-height-normal mythic-min-width-0 mythic-text-primary"],
    ["body-copy", "mythic-break-anywhere mythic-font-size-small mythic-line-height-normal mythic-pre-wrap mythic-text-primary"],
    ["secondary-copy", "mythic-break-anywhere mythic-font-size-small mythic-pre-wrap mythic-text-secondary"],
    ["compact-heading", "mythic-font-size-caption mythic-font-weight-heavy mythic-line-height-tight mythic-text-primary"],
    ["micro-supporting", "mythic-font-size-xs mythic-font-weight-medium mythic-line-height-snug mythic-text-secondary"],
    ["large-title", "mythic-break-anywhere mythic-font-size-body mythic-font-weight-extra-bold mythic-line-height-snug mythic-min-width-0 mythic-text-primary"],
].map(([preset, signature]) => [preset, new Set(signature.split(" "))]);

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
            const match = presets.find(([, signature]) => [...signature].every((token) => tokens.includes(token)));
            if(!match){ return; }
            const [preset, signature] = match;
            const originalComponent = opening.name.name;
            if(originalComponent === "Typography" && opening.attributes.some((attribute) => attribute.type === "JSXAttribute"
                && attribute.name.name === "variant")){
                return;
            }
            const hasComponentProp = opening.attributes.some((attribute) => attribute.type === "JSXAttribute"
                && attribute.name.name === "component");
            const componentProp = hasComponentProp ? ""
                : originalComponent === "Box" || originalComponent === "Typography" ? ' component="div"'
                    : ` component="${originalComponent}"`;
            migrationLocations.push(`${path.relative(sourceRoot, filePath)}:${opening.loc.start.line} preset=${preset}`);
            edits.push({start: opening.name.start, end: opening.name.end, value: "MythicText"});
            edits.push({start: opening.name.end, end: opening.name.end, value: `${componentProp} preset="${preset}"`});
            const remainingTokens = tokens.filter((token) => !signature.has(token));
            if(remainingTokens.length > 0){
                edits.push({start: classAttribute.value.start + 1, end: classAttribute.value.end - 1, value: remainingTokens.join(" ")});
            }else{
                edits.push({start: classAttribute.start, end: classAttribute.end, value: ""});
            }
            const element = elementPath.parentPath.node;
            if(element.type === "JSXElement" && element.closingElement?.name.type === "JSXIdentifier"){
                edits.push({start: element.closingElement.name.start, end: element.closingElement.name.end, value: "MythicText"});
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
        if(!existingNames.has("MythicText")){
            const closingBrace = source.lastIndexOf("}", existingImport.end);
            edits.push({start: closingBrace, end: closingBrace, value: `${existingNames.size > 0 ? ", " : ""}MythicText`});
        }
    }else{
        const imports = ast.program.body.filter((statement) => statement.type === "ImportDeclaration");
        const insertion = imports.length > 0 ? imports.at(-1).end : 0;
        edits.push({start: insertion, end: insertion, value: `\nimport {MythicText} from "${importSource}";`});
    }

    let output = source;
    edits.sort((left, right) => right.start - left.start).forEach((edit) => {
        output = `${output.slice(0, edit.start)}${edit.value}${output.slice(edit.end)}`;
    });
    changedFiles += 1;
    if(write){ fs.writeFileSync(filePath, output); }
});

console.log(`${write ? "Migrated" : "Would migrate"} ${migratedElements} text contracts in ${changedFiles} files.`);
if(!write){ migrationLocations.forEach((location) => console.log(`  ${location}`)); }
if(!write && changedFiles > 0){ process.exitCode = 1; }
