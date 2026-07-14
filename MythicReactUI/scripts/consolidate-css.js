#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const postcss = require("postcss");

const projectRoot = path.resolve(__dirname, "..");
const write = process.argv.includes("--write");
const requestedFiles = process.argv.slice(2).filter((argument) => argument !== "--write");
if(requestedFiles.length === 0){
    console.error("Usage: node scripts/consolidate-css.js [--write] <css-file> [...]");
    process.exit(1);
}

const declarationsFor = (rule) => rule.nodes.filter((node) => node.type === "decl");
const classesFor = (selector) => new Set((selector.match(/\.([a-zA-Z_][\w-]*)/g) || []).map((token) => token.slice(1)));
const intersects = (left, right) => [...left].some((value) => right.has(value));

let totalMerged = 0;
requestedFiles.forEach((requestedFile) => {
    const filePath = path.resolve(projectRoot, requestedFile);
    const root = postcss.parse(fs.readFileSync(filePath, "utf8"), {from: filePath});
    let merged = 0;

    const consolidateParent = (parent) => {
        const nodes = parent.nodes || [];
        const groups = new Map();
        nodes.forEach((node, index) => {
            if(node.type !== "rule"){ return; }
            const key = node.selector.replace(/\s+/g, " ").trim();
            const entries = groups.get(key) || [];
            entries.push({index, rule: node});
            groups.set(key, entries);
        });
        groups.forEach((entries) => {
            if(entries.length < 2){ return; }
            const first = entries[0];
            const selectorClasses = classesFor(first.rule.selector);
            const duplicateProperties = new Set(entries.flatMap(({rule}) => declarationsFor(rule).map((declaration) => declaration.prop)));
            const hasConflict = entries.slice(1).some((entry, entryIndex) => {
                const previousIndex = entries[entryIndex].index;
                return nodes.slice(previousIndex + 1, entry.index).some((node) => (
                    node.type === "rule"
                    && intersects(classesFor(node.selector), selectorClasses)
                    && declarationsFor(node).some((declaration) => duplicateProperties.has(declaration.prop))
                ));
            });
            if(hasConflict){ return; }
            entries.slice(1).forEach(({rule}) => {
                declarationsFor(rule).forEach((declaration) => first.rule.append(declaration.clone()));
                rule.nodes.filter((node) => node.type !== "decl").forEach((node) => first.rule.append(node.clone()));
                rule.remove();
                merged += 1;
            });
        });
    };

    consolidateParent(root);
    root.walkAtRules((atRule) => consolidateParent(atRule));
    root.walkRules((rule) => {
        const lines = [];
        for(let index = 0; index < rule.selectors.length; index += 4){
            lines.push(rule.selectors.slice(index, index + 4).join(", "));
        }
        rule.selector = lines.join(",\n");
    });
    totalMerged += merged;
    if(write){ fs.writeFileSync(filePath, root.toString()); }
    console.log(`${write ? "Merged" : "Would merge"} ${merged} duplicate selector rules in ${path.relative(projectRoot, filePath)}.`);
});

if(!write && totalMerged > 0){ process.exitCode = 2; }
