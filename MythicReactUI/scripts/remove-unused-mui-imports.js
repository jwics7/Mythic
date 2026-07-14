#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

const sourceRoot = path.resolve(__dirname, "..", "src");
const write = process.argv.includes("--write");
const walk = (directory, results = []) => {
    fs.readdirSync(directory, {withFileTypes: true}).forEach((entry) => {
        const entryPath = path.join(directory, entry.name);
        if(entry.isDirectory()){
            walk(entryPath, results);
        }else if(/\.[jt]sx?$/.test(entryPath)){
            results.push(entryPath);
        }
    });
    return results;
};
const renderImport = (statement, specifiers, source) => {
    if(specifiers.length === 0){ return ""; }
    const defaultSpecifier = specifiers.find((specifier) => specifier.type === "ImportDefaultSpecifier");
    const namespaceSpecifier = specifiers.find((specifier) => specifier.type === "ImportNamespaceSpecifier");
    const namedSpecifiers = specifiers.filter((specifier) => specifier.type === "ImportSpecifier");
    const clauses = [];
    if(defaultSpecifier){ clauses.push(defaultSpecifier.local.name); }
    if(namespaceSpecifier){ clauses.push(`* as ${namespaceSpecifier.local.name}`); }
    if(namedSpecifiers.length > 0){
        clauses.push(`{${namedSpecifiers.map((specifier) => {
            const imported = specifier.imported.name || specifier.imported.value;
            return imported === specifier.local.name ? imported : `${imported} as ${specifier.local.name}`;
        }).join(", ")}}`);
    }
    const sourceLiteral = source.slice(statement.source.start, statement.source.end);
    return `import ${clauses.join(", ")} from ${sourceLiteral};`;
};

let changedFiles = 0;
let removedSpecifiers = 0;
walk(sourceRoot).forEach((filePath) => {
    const source = fs.readFileSync(filePath, "utf8");
    let ast;
    try{
        ast = parser.parse(source, {sourceType: "unambiguous", plugins: ["jsx", "classProperties", "dynamicImport"]});
    }catch(error){
        return;
    }
    const edits = [];
    traverse(ast, {
        Program(programPath) {
            programPath.get("body").forEach((statementPath) => {
                const statement = statementPath.node;
                if(statement.type !== "ImportDeclaration" || !statement.source.value.startsWith("@mui/")){
                    return;
                }
                const retained = statement.specifiers.filter((specifier) => {
                    const binding = programPath.scope.getBinding(specifier.local.name);
                    const used = Boolean(binding && binding.referenced);
                    if(!used){ removedSpecifiers += 1; }
                    return used;
                });
                if(retained.length === statement.specifiers.length){ return; }
                edits.push({start: statement.start, end: statement.end, value: renderImport(statement, retained, source)});
            });
        },
    });
    if(edits.length === 0){ return; }
    let output = source;
    edits.sort((left, right) => right.start - left.start).forEach((edit) => {
        output = `${output.slice(0, edit.start)}${edit.value}${output.slice(edit.end)}`;
    });
    changedFiles += 1;
    if(write){ fs.writeFileSync(filePath, output); }
});

console.log(`${write ? "Removed" : "Would remove"} ${removedSpecifiers} unused MUI import specifiers in ${changedFiles} files.`);
if(!write && changedFiles > 0){ process.exitCode = 1; }
