#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

const projectRoot = path.resolve(__dirname, "..");
const sourceRoot = path.join(projectRoot, "src");
const layoutPath = path.join(sourceRoot, "components", "MythicComponents", "MythicLayout");
const write = process.argv.includes("--write");
const targets = new Set(["Box", "div", "span", "strong"]);

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
    let relative = path.relative(path.dirname(filePath), layoutPath).replaceAll(path.sep, "/");
    return relative.startsWith(".") ? relative : `./${relative}`;
};

let changedFiles = 0;
let migratedElements = 0;
walk(sourceRoot).forEach((filePath) => {
    if(filePath === `${layoutPath}.js`){ return; }
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
            if(!tokens.includes("mythic-truncate")){ return; }
            const originalComponent = opening.name.name;
            const filteredTokens = tokens.filter((token) => ![
                "mythic-truncate", "mythic-nowrap", "mythic-overflow-hidden",
            ].includes(token));
            const hasComponentProp = opening.attributes.some((attribute) => attribute.type === "JSXAttribute"
                && attribute.name.name === "component");
            const props = originalComponent === "Box"
                ? (hasComponentProp ? "" : " component=\"div\"")
                : ` component="${originalComponent}"`;
            edits.push({start: opening.name.start, end: opening.name.end, value: "MythicTruncatedText"});
            edits.push({start: opening.name.end, end: opening.name.end, value: props});
            edits.push({
                start: classAttribute.value.start + 1,
                end: classAttribute.value.end - 1,
                value: filteredTokens.join(" "),
            });
            const element = elementPath.parentPath.node;
            if(element.type === "JSXElement" && element.closingElement?.name.type === "JSXIdentifier"){
                edits.push({start: element.closingElement.name.start, end: element.closingElement.name.end, value: "MythicTruncatedText"});
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
        if(!existingNames.has("MythicTruncatedText")){
            const closingBrace = source.lastIndexOf("}", existingImport.end);
            edits.push({
                start: closingBrace,
                end: closingBrace,
                value: `${existingNames.size > 0 ? ", " : ""}MythicTruncatedText`,
            });
        }
    }else{
        const imports = ast.program.body.filter((statement) => statement.type === "ImportDeclaration");
        const insertion = imports.length > 0 ? imports.at(-1).end : 0;
        edits.push({start: insertion, end: insertion, value: `\nimport {MythicTruncatedText} from "${importSource}";`});
    }

    let output = source;
    edits.sort((left, right) => right.start - left.start).forEach((edit) => {
        output = `${output.slice(0, edit.start)}${edit.value}${output.slice(edit.end)}`;
    });
    changedFiles += 1;
    if(write){ fs.writeFileSync(filePath, output); }
});

console.log(`${write ? "Migrated" : "Would migrate"} ${migratedElements} truncated-text contracts in ${changedFiles} files.`);
if(!write && changedFiles > 0){ process.exitCode = 1; }
