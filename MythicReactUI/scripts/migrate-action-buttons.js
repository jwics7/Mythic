#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

const projectRoot = path.resolve(__dirname, "..");
const sourceRoot = path.join(projectRoot, "src");
const contentPath = path.join(sourceRoot, "components", "MythicComponents", "MythicContent");
const write = process.argv.includes("--write");
const ownedTokens = new Set([
    "mythic-table-row-icon-action",
    "mythic-table-row-icon-action-hover-danger",
    "mythic-table-row-icon-action-hover-info",
    "mythic-table-row-icon-action-hover-success",
    "mythic-table-row-icon-action-hover-warning",
    "mythic-table-row-icon-action-danger",
    "mythic-table-row-icon-action-info",
    "mythic-table-row-icon-action-success",
    "mythic-table-row-icon-action-warning",
    "mythic-table-row-action",
    "mythic-table-row-action-hover-danger",
    "mythic-table-row-action-hover-error",
    "mythic-table-row-action-hover-info",
    "mythic-table-row-action-hover-success",
    "mythic-table-row-action-hover-warning",
    "mythic-table-row-action-danger",
    "mythic-table-row-action-error",
    "mythic-table-row-action-info",
    "mythic-table-row-action-success",
    "mythic-table-row-action-warning",
    "mythic-border",
    "mythic-border-radius",
    "mythic-text-primary",
    "mythic-font-size-caption",
    "mythic-font-size-small",
    "mythic-font-weight-strong",
    "mythic-dialog-title-action",
    "mythic-dialog-button-success",
    "mythic-ui-settings-title-button-info",
    "mythic-ui-settings-title-button-success",
]);
const toneTokens = [
    ["mythic-table-row-icon-action-hover-danger", "error", "hover"],
    ["mythic-table-row-icon-action-hover-info", "info", "hover"],
    ["mythic-table-row-icon-action-hover-success", "success", "hover"],
    ["mythic-table-row-icon-action-hover-warning", "warning", "hover"],
    ["mythic-table-row-icon-action-danger", "error", "always"],
    ["mythic-table-row-icon-action-info", "info", "always"],
    ["mythic-table-row-icon-action-success", "success", "always"],
    ["mythic-table-row-icon-action-warning", "warning", "always"],
    ["mythic-table-row-action-hover-danger", "error", "hover"],
    ["mythic-table-row-action-hover-error", "error", "hover"],
    ["mythic-table-row-action-hover-info", "info", "hover"],
    ["mythic-table-row-action-hover-success", "success", "hover"],
    ["mythic-table-row-action-hover-warning", "warning", "hover"],
    ["mythic-table-row-action-danger", "error", "always"],
    ["mythic-table-row-action-error", "error", "always"],
    ["mythic-table-row-action-info", "info", "always"],
    ["mythic-table-row-action-success", "success", "always"],
    ["mythic-table-row-action-warning", "warning", "always"],
    ["mythic-dialog-button-success", "success", "hover"],
    ["mythic-ui-settings-title-button-info", "info", "hover"],
    ["mythic-ui-settings-title-button-success", "success", "hover"],
];

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
            if(opening.name.type !== "JSXIdentifier" || !["Button", "IconButton", "MythicActionButton"].includes(opening.name.name)){ return; }
            const classAttribute = opening.attributes.find((attribute) => attribute.type === "JSXAttribute"
                && attribute.name.name === "className" && attribute.value?.type === "StringLiteral");
            if(!classAttribute){ return; }
            const tokens = classAttribute.value.value.split(/\s+/).filter(Boolean);
            if(opening.name.name === "MythicActionButton"){
                const filteredTokens = tokens.filter((token) => !ownedTokens.has(token));
                if(filteredTokens.length === tokens.length){ return; }
                edits.push({
                    start: classAttribute.value.start + 1,
                    end: classAttribute.value.end - 1,
                    value: filteredTokens.join(" "),
                });
                migratedElements += 1;
                return;
            }
            const isIconButton = opening.name.name === "IconButton";
            const baseToken = isIconButton ? "mythic-table-row-icon-action" : "mythic-table-row-action";
            if(!tokens.includes(baseToken) && !tokens.includes("mythic-dialog-title-action")){ return; }
            const toneMatch = toneTokens.find(([token]) => tokens.includes(token));
            const tone = toneMatch?.[1] || "neutral";
            const emphasis = toneMatch?.[2] || "hover";
            const filteredTokens = tokens.filter((token) => !ownedTokens.has(token));
            const variantProps = `${isIconButton ? " iconOnly" : ""} tone="${tone}"${emphasis === "always" ? " emphasis=\"always\"" : ""}`;
            edits.push({start: opening.name.start, end: opening.name.end, value: "MythicActionButton"});
            edits.push({start: opening.name.end, end: opening.name.end, value: variantProps});
            edits.push({
                start: classAttribute.value.start + 1,
                end: classAttribute.value.end - 1,
                value: filteredTokens.join(" "),
            });
            const element = elementPath.parentPath.node;
            if(element.type === "JSXElement" && element.closingElement?.name.type === "JSXIdentifier"){
                edits.push({start: element.closingElement.name.start, end: element.closingElement.name.end, value: "MythicActionButton"});
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
        if(!existingNames.has("MythicActionButton")){
            const closingBrace = source.lastIndexOf("}", existingImport.end);
            edits.push({start: closingBrace, end: closingBrace, value: `${existingNames.size > 0 ? ", " : ""}MythicActionButton`});
        }
    }else{
        const imports = ast.program.body.filter((statement) => statement.type === "ImportDeclaration");
        const insertion = imports.length > 0 ? imports.at(-1).end : 0;
        edits.push({start: insertion, end: insertion, value: `\nimport {MythicActionButton} from "${importSource}";`});
    }

    let output = source;
    edits.sort((left, right) => right.start - left.start).forEach((edit) => {
        output = `${output.slice(0, edit.start)}${edit.value}${output.slice(edit.end)}`;
    });
    const withoutIconButtonImport = output.replace(/^import IconButton from ["']@mui\/material\/IconButton["'];\r?\n/m, "");
    if(!/\bIconButton\b/.test(withoutIconButtonImport)){
        output = withoutIconButtonImport;
    }
    changedFiles += 1;
    if(write){ fs.writeFileSync(filePath, output); }
});

console.log(`${write ? "Migrated" : "Would migrate"} ${migratedElements} action-button contracts in ${changedFiles} files.`);
if(!write && changedFiles > 0){ process.exitCode = 1; }
