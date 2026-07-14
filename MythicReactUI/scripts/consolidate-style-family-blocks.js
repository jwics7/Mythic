#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const postcss = require("postcss");

const projectRoot = path.resolve(__dirname, "..");
const familyRoot = path.join(projectRoot, "src", "styles", "families");
const write = process.argv.includes("--write");
const familyFiles = fs.readdirSync(familyRoot)
    .filter((fileName) => fileName.endsWith(".module.css"))
    .map((fileName) => path.join(familyRoot, fileName));

const declarationsFor = (rule) => rule.nodes.filter((node) => node.type === "decl");
const declarationKey = (rule) => declarationsFor(rule)
    .map((declaration) => `${declaration.prop}:${declaration.value}${declaration.important ? "!important" : ""}`)
    .join(";");
const classTokens = (selector) => new Set(
    (selector.match(/\.([a-zA-Z_][\w-]*)/g) || []).map((token) => token.slice(1)),
);
const intersects = (left, right) => [...left].some((value) => right.has(value));

let totalRulesRemoved = 0;
let totalDeclarationsRemoved = 0;
let totalAtRulesMerged = 0;
let totalLargeGroupsSplit = 0;

const mergeAdjacentAtRules = (parent) => {
    const nodes = parent.nodes || [];
    for(let index = nodes.length - 1; index > 0; index -= 1){
        const current = nodes[index];
        const previous = nodes[index - 1];
        if(current.type !== "atrule" || previous.type !== "atrule"
            || current.name !== previous.name || current.params !== previous.params){
            continue;
        }
        current.nodes.forEach((node) => previous.append(node.clone()));
        current.remove();
        totalAtRulesMerged += 1;
    }
    (parent.nodes || []).filter((node) => node.type === "atrule").forEach(mergeAdjacentAtRules);
};

const consolidateParent = (parent) => {
    const rules = (parent.nodes || []).filter((node) => node.type === "rule");
    const groups = new Map();
    rules.forEach((rule) => {
        const key = declarationKey(rule);
        if(!key){ return; }
        const group = groups.get(key) || [];
        group.push(rule);
        groups.set(key, group);
    });

    groups.forEach((group) => {
        if(group.length < 2){ return; }
        const target = group[0];
        const properties = new Set(declarationsFor(target).map((declaration) => declaration.prop));
        group.slice(1).forEach((candidate) => {
            if(!candidate.parent || candidate.parent !== target.parent){ return; }
            const nodes = candidate.parent.nodes;
            const targetIndex = nodes.indexOf(target);
            const candidateIndex = nodes.indexOf(candidate);
            if(candidateIndex <= targetIndex){ return; }
            const candidateClasses = classTokens(candidate.selector);
            const conflicts = nodes.slice(targetIndex + 1, candidateIndex).some((node) => (
                node.type === "rule"
                && intersects(candidateClasses, classTokens(node.selector))
                && declarationsFor(node).some((declaration) => properties.has(declaration.prop))
            ));
            if(conflicts){ return; }
            if(target.selectors.length + candidate.selectors.length > 9){ return; }
            target.selectors = [...target.selectors, ...candidate.selectors];
            totalDeclarationsRemoved += declarationsFor(candidate).length;
            totalRulesRemoved += 1;
            candidate.remove();
        });
    });
};

familyFiles.forEach((filePath) => {
    const root = postcss.parse(fs.readFileSync(filePath, "utf8"), {from: filePath});
    mergeAdjacentAtRules(root);
    consolidateParent(root);
    root.walkAtRules((atRule) => consolidateParent(atRule));
    root.walkRules((rule) => {
        if(rule.selectors.length > 9){
            totalLargeGroupsSplit += 1;
            const selectors = rule.selectors;
            for(let index = 0; index < selectors.length; index += 9){
                const clone = rule.clone({selector: selectors.slice(index, index + 9).join(", ")});
                rule.parent.insertBefore(rule, clone);
            }
            rule.remove();
            return;
        }
        const lines = [];
        for(let index = 0; index < rule.selectors.length; index += 4){
            lines.push(rule.selectors.slice(index, index + 4).join(", "));
        }
        rule.selector = lines.join(",\n");
    });
    if(write){
        fs.writeFileSync(filePath, root.toString());
    }
});

console.log(`${write ? "Updated" : "Would update"} ${totalRulesRemoved} repeated family rules, ${totalDeclarationsRemoved} declarations, ${totalAtRulesMerged} adjacent at-rules, and ${totalLargeGroupsSplit} oversized selector groups.`);
if(!write && (totalRulesRemoved > 0 || totalAtRulesMerged > 0 || totalLargeGroupsSplit > 0)){ process.exitCode = 2; }
