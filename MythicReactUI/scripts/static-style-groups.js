#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generate = require("@babel/generator").default;

const sourceRoot = path.resolve(__dirname, "..", "src");
const files = [];
const walk = (directory) => fs.readdirSync(directory, {withFileTypes: true}).forEach((entry) => {
    const entryPath = path.join(directory, entry.name);
    if(entry.isDirectory()){
        walk(entryPath);
    }else if(/\.[jt]sx?$/.test(entryPath)){
        files.push(entryPath);
    }
});
walk(sourceRoot);

const isStatic = (node) => {
    if(!node) return false;
    if(["StringLiteral", "NumericLiteral", "BooleanLiteral", "NullLiteral"].includes(node.type)) return true;
    if(node.type === "TemplateLiteral") return node.expressions.length === 0;
    if(node.type === "UnaryExpression") return isStatic(node.argument);
    if(node.type === "ArrayExpression") return node.elements.every(isStatic);
    return node.type === "ObjectExpression" && node.properties.every((property) => (
        property.type === "ObjectProperty" && !property.computed && isStatic(property.value)
    ));
};

const groups = new Map();
files.forEach((filePath) => {
    const source = fs.readFileSync(filePath, "utf8");
    let ast;
    try{
        ast = parser.parse(source, {sourceType: "unambiguous", plugins: ["jsx", "classProperties", "dynamicImport"]});
    }catch(error){
        return;
    }
    traverse(ast, {
        JSXAttribute(attributePath) {
            const name = attributePath.node.name?.name;
            const expression = attributePath.node.value?.expression;
            if((name !== "style" && name !== "sx") || !isStatic(expression)) return;
            const signature = generate(expression, {compact: true}).code;
            const key = `${name}:${signature}`;
            const entries = groups.get(key) || [];
            entries.push(`${path.relative(sourceRoot, filePath)}:${attributePath.node.loc?.start.line || 0}`);
            groups.set(key, entries);
        },
    });
});

[...groups.entries()]
    .sort((left, right) => right[1].length - left[1].length)
    .slice(0, 60)
    .forEach(([signature, locations]) => {
        console.log(`${String(locations.length).padStart(4)}  ${signature}`);
        console.log(`      ${locations.slice(0, 8).join(", ")}`);
    });
