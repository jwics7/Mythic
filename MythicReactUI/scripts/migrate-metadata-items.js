#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

const sourceRoot = path.resolve(__dirname, "..", "src");
const contentPath = path.join(sourceRoot, "components", "MythicComponents", "MythicContent");
const write = process.argv.includes("--write");
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
const staticClasses = (element) => {
    const attribute = element.openingElement.attributes.find((candidate) => candidate.type === "JSXAttribute"
        && candidate.name.name === "className" && candidate.value?.type === "StringLiteral");
    return attribute?.value.value.split(/\s+/).filter(Boolean) || [];
};

let changedFiles = 0;
let migratedItems = 0;
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
        JSXElement(elementPath) {
            const element = elementPath.node;
            if(element.openingElement.name.type !== "JSXIdentifier" || element.openingElement.name.name !== "div"
                || element.openingElement.attributes.length > 0){
                return;
            }
            const children = element.children.filter((child) => child.type !== "JSXText" || child.value.trim() !== "");
            if(children.length !== 2 || children.some((child) => child.type !== "JSXElement")){
                return;
            }
            const [labelElement, valueElement] = children;
            if(!staticClasses(labelElement).includes("mythic-create-meta-label")
                || !staticClasses(valueElement).includes("mythic-create-meta-value")){
                return;
            }
            const labelSource = source.slice(labelElement.openingElement.end, labelElement.closingElement.start).trim();
            const valueSource = source.slice(valueElement.openingElement.end, valueElement.closingElement.start).trim();
            const labelProp = /^[^<{]+$/.test(labelSource)
                ? `label=${JSON.stringify(labelSource)}`
                : `label={<React.Fragment>${labelSource}</React.Fragment>}`;
            edits.push({
                start: element.start,
                end: element.end,
                value: `<MythicMetadataItem ${labelProp}>${valueSource}</MythicMetadataItem>`,
            });
            migratedItems += 1;
            elementPath.skip();
        },
    });
    if(edits.length === 0){ return; }

    const importSource = relativeImport(filePath);
    const existingImport = ast.program.body.find((statement) => statement.type === "ImportDeclaration"
        && statement.source.value === importSource);
    if(existingImport){
        const existingNames = new Set(existingImport.specifiers.filter((specifier) => specifier.type === "ImportSpecifier")
            .map((specifier) => specifier.imported.name));
        if(!existingNames.has("MythicMetadataItem")){
            const closingBrace = source.lastIndexOf("}", existingImport.end);
            edits.push({start: closingBrace, end: closingBrace, value: `${existingNames.size > 0 ? ", " : ""}MythicMetadataItem`});
        }
    }else{
        const imports = ast.program.body.filter((statement) => statement.type === "ImportDeclaration");
        const insertion = imports.length > 0 ? imports.at(-1).end : 0;
        edits.push({start: insertion, end: insertion, value: `\nimport {MythicMetadataItem} from "${importSource}";`});
    }

    let output = source;
    edits.sort((left, right) => right.start - left.start).forEach((edit) => {
        output = `${output.slice(0, edit.start)}${edit.value}${output.slice(edit.end)}`;
    });
    changedFiles += 1;
    if(write){ fs.writeFileSync(filePath, output); }
});

console.log(`${write ? "Migrated" : "Would migrate"} ${migratedItems} metadata items in ${changedFiles} files.`);
if(!write && changedFiles > 0){ process.exitCode = 1; }
