#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

const sourceRoot = path.resolve(__dirname, "..", "src");
const contentPath = path.join(sourceRoot, "components", "MythicComponents", "MythicContent");
const write = process.argv.includes("--write");
const contracts = [
    {
        marker: "mythic-search-result-value",
        component: "MythicMetadataValue",
        props: "",
        owned: new Set(["mythic-break-anywhere", "mythic-font-size-small", "mythic-line-height-normal", "mythic-min-width-0", "mythic-text-primary"]),
    },
    {
        marker: "mythic-search-result-secondary",
        component: "MythicMetadataValue",
        props: ' size="caption" tone="secondary"',
        owned: new Set(["mythic-break-anywhere", "mythic-font-size-caption", "mythic-line-height-normal", "mythic-min-width-0", "mythic-text-secondary"]),
    },
    {
        marker: "mythic-search-result-label",
        component: "MythicMetadataLabel",
        props: ' size="xs"',
        owned: new Set(["mythic-font-size-xs", "mythic-font-weight-strong", "mythic-line-height-tight", "mythic-text-secondary"]),
    },
];
const targets = new Set(["Typography", "div", "span"]);
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
    const requiredComponents = new Set();
    traverse(ast, {
        JSXOpeningElement(elementPath) {
            const opening = elementPath.node;
            if(opening.name.type !== "JSXIdentifier" || !targets.has(opening.name.name)){ return; }
            const classAttribute = opening.attributes.find((attribute) => attribute.type === "JSXAttribute"
                && attribute.name.name === "className" && attribute.value?.type === "StringLiteral");
            if(!classAttribute){ return; }
            const tokens = classAttribute.value.value.split(/\s+/).filter(Boolean);
            const contract = contracts.find(({marker}) => tokens.includes(marker));
            if(!contract){ return; }
            const originalComponent = opening.name.name;
            const hasComponentProp = opening.attributes.some((attribute) => attribute.type === "JSXAttribute"
                && attribute.name.name === "component");
            const componentProp = originalComponent === "Typography"
                ? ""
                : (hasComponentProp ? "" : ` component="${originalComponent}"`);
            edits.push({start: opening.name.start, end: opening.name.end, value: contract.component});
            edits.push({start: opening.name.end, end: opening.name.end, value: `${componentProp}${contract.props}`});
            edits.push({
                start: classAttribute.value.start + 1,
                end: classAttribute.value.end - 1,
                value: tokens.filter((token) => !contract.owned.has(token)).join(" "),
            });
            const element = elementPath.parentPath.node;
            if(element.type === "JSXElement" && element.closingElement?.name.type === "JSXIdentifier"){
                edits.push({start: element.closingElement.name.start, end: element.closingElement.name.end, value: contract.component});
            }
            requiredComponents.add(contract.component);
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
        const additions = [...requiredComponents].filter((name) => !existingNames.has(name));
        if(additions.length > 0){
            const closingBrace = source.lastIndexOf("}", existingImport.end);
            edits.push({start: closingBrace, end: closingBrace, value: `${existingNames.size > 0 ? ", " : ""}${additions.join(", ")}`});
        }
    }else{
        const imports = ast.program.body.filter((statement) => statement.type === "ImportDeclaration");
        const insertion = imports.length > 0 ? imports.at(-1).end : 0;
        edits.push({start: insertion, end: insertion, value: `\nimport {${[...requiredComponents].join(", ")}} from "${importSource}";`});
    }

    let output = source;
    edits.sort((left, right) => right.start - left.start).forEach((edit) => {
        output = `${output.slice(0, edit.start)}${edit.value}${output.slice(edit.end)}`;
    });
    changedFiles += 1;
    if(write){ fs.writeFileSync(filePath, output); }
});

console.log(`${write ? "Migrated" : "Would migrate"} ${migratedElements} metadata-copy contracts in ${changedFiles} files.`);
if(!write && changedFiles > 0){ process.exitCode = 1; }
