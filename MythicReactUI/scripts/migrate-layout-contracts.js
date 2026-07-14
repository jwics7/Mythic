#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

const projectRoot = path.resolve(__dirname, "..");
const sourceRoot = path.join(projectRoot, "src");
const layoutPath = path.join(sourceRoot, "components", "MythicComponents", "MythicLayout");
const write = process.argv.includes("--write");
const migratableElements = new Set([
    "AppBar", "Box", "DialogActions", "DialogContent", "DialogTitle", "EventingGridCell",
    "FormControlLabel", "IconButton", "Split", "TableCell", "TableContainer", "TableRow", "Typography",
    "aside", "button", "div", "label", "section", "span",
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
const tokenSet = (value) => new Set(value.split(/\s+/).filter(Boolean));
const classValue = (tokens) => [...tokens].join(" ");
const relativeImport = (filePath) => {
    let relative = path.relative(path.dirname(filePath), layoutPath).replaceAll(path.sep, "/");
    return relative.startsWith(".") ? relative : `./${relative}`;
};

let changedFiles = 0;
let migratedElements = 0;
walk(sourceRoot).forEach((filePath) => {
    if(filePath === `${layoutPath}.js`){
        return;
    }
    const source = fs.readFileSync(filePath, "utf8");
    let ast;
    try{
        ast = parser.parse(source, {sourceType: "unambiguous", plugins: ["jsx", "classProperties", "dynamicImport"]});
    }catch(error){
        return;
    }
    const edits = [];
    const required = new Set();
    traverse(ast, {
        JSXOpeningElement(elementPath) {
            const opening = elementPath.node;
            if(opening.name.type !== "JSXIdentifier" || !migratableElements.has(opening.name.name)){
                return;
            }
            const originalComponent = opening.name.name;
            if(originalComponent !== "Box" && opening.attributes.some((attribute) => (
                attribute.type === "JSXAttribute" && attribute.name.name === "component"
            ))){
                return;
            }
            const classAttribute = opening.attributes.find((attribute) => attribute.type === "JSXAttribute"
                && attribute.name.name === "className" && attribute.value?.type === "StringLiteral");
            if(!classAttribute){
                return;
            }
            const tokens = tokenSet(classAttribute.value.value);
            const rawFlex = tokens.has("mythic-flex")
                && !tokens.has("mythic-stack")
                && !tokens.has("mythic-cluster")
                && !tokens.has("mythic-inline-cluster")
                && !tokens.has("mythic-grid")
                && !tokens.has("mythic-inline-flex");
            const grid = tokens.has("mythic-grid");
            const stack = tokens.has("mythic-stack") || (rawFlex && tokens.has("mythic-flex-column"));
            const inlineCluster = tokens.has("mythic-inline-cluster");
            const cluster = tokens.has("mythic-cluster");
            if(!grid && !stack && !inlineCluster && !cluster && !rawFlex){
                return;
            }
            const componentName = grid ? "MythicGrid" : stack ? "MythicStack" : "MythicCluster";
            const ownedTokens = new Set([grid ? "mythic-grid" : stack ? "mythic-stack" : inlineCluster ? "mythic-inline-cluster" : "mythic-cluster"]);
            const props = [];
            if(originalComponent !== "Box"){
                props.push(/^[a-z]/.test(originalComponent)
                    ? `component="${originalComponent}"`
                    : `component={${originalComponent}}`);
            }
            const gap = ["md", "sm", "xs"].find((size) => tokens.has(`mythic-gap-${size}`));
            props.push(`gap="${gap || "none"}"`);
            ["xs", "sm", "md"].forEach((size) => ownedTokens.add(`mythic-gap-${size}`));
            if(grid){
                props.push('columns="custom"');
            }
            const align = ["stretch", "start", "center"].find((value) => tokens.has(`mythic-align-${value}`));
            if(align && !grid){
                props.push(`align="${align}"`);
            }
            if(!grid){
                ["center", "start", "stretch"].forEach((value) => ownedTokens.add(`mythic-align-${value}`));
            }
            if(grid){
                // Unique templates and alignment remain with the owning feature class.
            }else if(stack){
                ownedTokens.add("mythic-flex");
                ownedTokens.add("mythic-flex-column");
                ownedTokens.add("mythic-min-width-0");
                if(tokens.has("mythic-fill")){
                    props.push("fill");
                    ownedTokens.add("mythic-fill");
                }
                if(tokens.has("mythic-scroll-region")){
                    props.push("scroll");
                    ownedTokens.add("mythic-scroll-region");
                }
            }else{
                ownedTokens.add("mythic-flex");
                ownedTokens.add("mythic-min-width-0");
                const justify = ["start", "center", "end", "between"].find((value) => tokens.has(`mythic-justify-${value}`));
                if(justify){
                    props.push(`justify="${justify}"`);
                    ownedTokens.add(`mythic-justify-${justify}`);
                }
                if(inlineCluster){
                    props.push("inline");
                    if(!tokens.has("mythic-wrap")){
                        props.push("wrap={false}");
                    }
                }else if(rawFlex && !tokens.has("mythic-wrap")){
                    props.push("wrap={false}");
                }
                if(tokens.has("mythic-wrap")){
                    ownedTokens.add("mythic-wrap");
                }
                if(tokens.has("mythic-flex-fill")){
                    props.push("fill");
                    ownedTokens.add("mythic-flex-fill");
                }
                if(rawFlex && !align){
                    props.push('align="stretch"');
                }
            }
            ownedTokens.forEach((token) => tokens.delete(token));
            edits.push({start: opening.name.start, end: opening.name.end, value: componentName});
            edits.push({start: opening.name.end, end: opening.name.end, value: ` ${props.join(" ")}`});
            edits.push({start: classAttribute.value.start + 1, end: classAttribute.value.end - 1, value: classValue(tokens)});
            const element = elementPath.parentPath.node;
            if(element.type === "JSXElement" && element.closingElement?.name.type === "JSXIdentifier"){
                edits.push({start: element.closingElement.name.start, end: element.closingElement.name.end, value: componentName});
            }
            required.add(componentName);
            migratedElements += 1;
        },
    });
    if(edits.length === 0){
        return;
    }

    const importSource = relativeImport(filePath);
    const existingImport = ast.program.body.find((statement) => statement.type === "ImportDeclaration"
        && statement.source.value === importSource);
    if(existingImport){
        const existingNames = new Set(existingImport.specifiers.filter((specifier) => specifier.type === "ImportSpecifier")
            .map((specifier) => specifier.imported.name));
        const missing = [...required].filter((name) => !existingNames.has(name));
        if(missing.length > 0){
            const closingBrace = source.lastIndexOf("}", existingImport.end);
            edits.push({start: closingBrace, end: closingBrace, value: `${existingNames.size > 0 ? ", " : ""}${missing.join(", ")}`});
        }
    }else{
        const imports = ast.program.body.filter((statement) => statement.type === "ImportDeclaration");
        const insertion = imports.length > 0 ? imports.at(-1).end : 0;
        edits.push({start: insertion, end: insertion, value: `\nimport {${[...required].join(", ")}} from "${importSource}";`});
    }

    let output = source;
    edits.sort((left, right) => right.start - left.start).forEach((edit) => {
        output = `${output.slice(0, edit.start)}${edit.value}${output.slice(edit.end)}`;
    });
    changedFiles += 1;
    if(write){
        fs.writeFileSync(filePath, output);
    }
});

console.log(`${write ? "Migrated" : "Would migrate"} ${migratedElements} explicit layout contracts in ${changedFiles} files.`);
if(!write && changedFiles > 0){
    process.exitCode = 1;
}
