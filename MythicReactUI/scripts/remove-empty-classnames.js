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

let changedFiles = 0;
let removedAttributes = 0;
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
        JSXAttribute(attributePath) {
            const attribute = attributePath.node;
            if(attribute.name?.name !== "className" || attribute.value?.type !== "StringLiteral"
                || attribute.value.value.trim() !== ""){
                return;
            }
            edits.push({start: attribute.start, end: attribute.end});
            removedAttributes += 1;
        },
    });
    if(edits.length === 0){ return; }
    let output = source;
    edits.sort((left, right) => right.start - left.start).forEach((edit) => {
        output = `${output.slice(0, edit.start)}${output.slice(edit.end)}`;
    });
    changedFiles += 1;
    if(write){ fs.writeFileSync(filePath, output); }
});

console.log(`${write ? "Removed" : "Would remove"} ${removedAttributes} empty className attributes in ${changedFiles} files.`);
if(!write && changedFiles > 0){ process.exitCode = 1; }
