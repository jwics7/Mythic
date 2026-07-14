#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const postcss = require("postcss");
const {
    ATOMIC_PRIMITIVES,
    COMPOUND_PRIMITIVES,
    MIGRATION_DECLARATIONS,
} = require("./mythic-primitives");

const projectRoot = path.resolve(__dirname, "..");
const sourceRoot = path.join(projectRoot, "src");
const write = process.argv.includes("--write");
const check = process.argv.includes("--check");
const verbose = process.argv.includes("--verbose");
const simpleClassPattern = /^\.([a-zA-Z_][\w-]*)$/;
const declarationKey = (property, value) => `${property}\u0000${value}`;
const migrationByDeclaration = new Map(MIGRATION_DECLARATIONS.map(([property, value, key]) => [declarationKey(property, value), key]));

const walk = (directory, predicate, results = []) => {
    fs.readdirSync(directory, {withFileTypes: true}).forEach((entry) => {
        const entryPath = path.join(directory, entry.name);
        if(entry.isDirectory()){
            walk(entryPath, predicate, results);
        }else if(predicate(entryPath)){
            results.push(entryPath);
        }
    });
    return results;
};

const choosePrimitives = (keys) => {
    const remaining = new Set(keys);
    const migratedKeys = new Set();
    const primitives = [];
    COMPOUND_PRIMITIVES.forEach((compound) => {
        const applies = compound.triggerAny
            ? compound.triggerAny.some((key) => remaining.has(key))
            : compound.keys.every((key) => remaining.has(key));
        if(applies){
            primitives.push(compound.name);
            compound.keys.forEach((key) => {
                if(remaining.delete(key)){
                    migratedKeys.add(key);
                }
            });
        }
    });
    remaining.forEach((key) => {
        const primitive = ATOMIC_PRIMITIVES[key];
        if(primitive){
            primitives.push(primitive);
            migratedKeys.add(key);
        }
    });
    return {migratedKeys, primitives: [...new Set(primitives)]};
};

const formatSelectors = (selectors) => {
    const lines = [];
    for(let index = 0; index < selectors.length; index += 4){
        lines.push(selectors.slice(index, index + 4).join(", "));
    }
    return lines.join(",\n");
};

let changedModules = 0;
let changedOwners = 0;
let removedAssociations = 0;

walk(sourceRoot, (filePath) => filePath.endsWith(".module.css")).forEach((modulePath) => {
    const ownerPath = modulePath.replace(/\.module\.css$/, ".js");
    if(!fs.existsSync(ownerPath)){
        return;
    }
    const cssSource = fs.readFileSync(modulePath, "utf8");
    const root = postcss.parse(cssSource, {from: modulePath});
    const classProperties = new Map();
    root.nodes.filter((node) => node.type === "rule").forEach((rule) => {
        rule.selectors.forEach((selector) => {
            const match = selector.trim().match(simpleClassPattern);
            if(!match){
                return;
            }
            const properties = classProperties.get(match[1]) || new Map();
            rule.nodes.filter((node) => node.type === "decl" && !node.important).forEach((declaration) => {
                const values = properties.get(declaration.prop) || new Set();
                values.add(declaration.value);
                properties.set(declaration.prop, values);
            });
            classProperties.set(match[1], properties);
        });
    });

    const candidatePlans = new Map();
    classProperties.forEach((properties, className) => {
        const keys = new Set();
        properties.forEach((values, property) => {
            if(values.size !== 1){
                return;
            }
            const [value] = values;
            const key = migrationByDeclaration.get(declarationKey(property, value));
            if(key){
                keys.add(key);
            }
        });
        const plan = choosePrimitives(keys);
        if(plan.primitives.length > 0){
            candidatePlans.set(className, plan);
        }
    });
    if(candidatePlans.size === 0){
        return;
    }

    const ownerSource = fs.readFileSync(ownerPath, "utf8");
    const ast = parser.parse(ownerSource, {
        sourceFilename: ownerPath,
        sourceType: "unambiguous",
        plugins: ["jsx", "classProperties", "dynamicImport", "optionalChaining", "nullishCoalescingOperator"],
    });
    const occurrences = new Map();
    traverse(ast, {
        MemberExpression(memberPath) {
            const {node} = memberPath;
            if(node.computed || !["styles", "classes"].includes(node.object?.name) || node.property?.type !== "Identifier"){
                return;
            }
            const className = node.property.name;
            if(!candidatePlans.has(className)){
                return;
            }
            const attribute = memberPath.findParent((parent) => parent.isJSXAttribute()
                && parent.node.name?.name === "className");
            let target = null;
            if(attribute){
                const expression = attribute.node.value?.expression;
                if(expression === node){
                    target = {attribute, kind: "direct", start: node.start, end: node.end};
                }else if(memberPath.parentPath?.isTemplateLiteral()){
                    const template = memberPath.parentPath.node;
                    const expressionIndex = template.expressions.indexOf(node);
                    if(expressionIndex >= 0){
                        const quasi = template.quasis[expressionIndex + 1];
                        target = {attribute, kind: "template", start: quasi.start, end: quasi.end};
                    }
                }
            }
            const entries = occurrences.get(className) || [];
            entries.push(target);
            occurrences.set(className, entries);
        },
    });

    const plans = new Map();
    candidatePlans.forEach((plan, className) => {
        const entries = occurrences.get(className) || [];
        if(entries.length > 0 && entries.every(Boolean)){
            plans.set(className, {...plan, targets: entries});
        }
    });
    if(plans.size === 0){
        return;
    }

    const editsByRange = new Map();
    plans.forEach((plan) => {
        plan.targets.forEach((target) => {
            const rangeKey = `${target.kind}:${target.start}:${target.end}`;
            const entry = editsByRange.get(rangeKey) || {...target, primitives: new Set()};
            const attributeSource = ownerSource.slice(target.attribute.node.start, target.attribute.node.end);
            plan.primitives.forEach((primitive) => {
                if(!attributeSource.includes(primitive)){
                    entry.primitives.add(primitive);
                }
            });
            editsByRange.set(rangeKey, entry);
        });
    });
    const edits = [...editsByRange.values()].filter((entry) => entry.primitives.size > 0).map((entry) => {
        const primitives = [...entry.primitives].join(" ");
        if(entry.kind === "direct"){
            const expression = ownerSource.slice(entry.start, entry.end);
            return {...entry, value: `\`${"${"}${expression}} ${primitives}\``};
        }
        const quasi = ownerSource.slice(entry.start, entry.end);
        return {...entry, value: ` ${primitives}${quasi}`};
    }).sort((left, right) => right.start - left.start);

    const activePlans = new Map([...plans].filter(([, plan]) => plan.targets.every((target) => {
        const attributeSource = ownerSource.slice(target.attribute.node.start, target.attribute.node.end);
        return plan.primitives.every((primitive) => attributeSource.includes(primitive))
            || edits.some((edit) => edit.start === target.start && edit.end === target.end);
    })));

    root.nodes.filter((node) => node.type === "rule").slice().forEach((rule) => {
        const declarations = rule.nodes.filter((node) => node.type === "decl");
        const groups = new Map();
        let changed = false;
        rule.selectors.forEach((selector) => {
            const match = selector.trim().match(simpleClassPattern);
            const plan = match ? activePlans.get(match[1]) : null;
            const indexes = declarations.map((declaration, index) => {
                const key = migrationByDeclaration.get(declarationKey(declaration.prop, declaration.value));
                if(plan && !declaration.important && key && plan.migratedKeys.has(key)){
                    changed = true;
                    removedAssociations += 1;
                    return null;
                }
                return index;
            }).filter((index) => index !== null);
            const signature = indexes.join(",");
            const group = groups.get(signature) || {indexes, selectors: []};
            group.selectors.push(selector.trim());
            groups.set(signature, group);
        });
        if(!changed){
            return;
        }
        groups.forEach(({indexes, selectors}) => {
            if(indexes.length === 0){
                return;
            }
            const clone = rule.clone();
            clone.selector = formatSelectors(selectors);
            clone.nodes.filter((node) => node.type === "decl").forEach((declaration, index) => {
                if(!indexes.includes(index)){
                    declaration.remove();
                }
            });
            rule.before(clone);
        });
        rule.remove();
    });

    if(edits.length > 0){
        let nextOwnerSource = ownerSource;
        edits.forEach((edit) => {
            nextOwnerSource = `${nextOwnerSource.slice(0, edit.start)}${edit.value}${nextOwnerSource.slice(edit.end)}`;
        });
        changedOwners += 1;
        if(verbose){
            console.log(`  ${path.relative(projectRoot, ownerPath)}: ${edits.length} className edit(s)`);
        }
        if(write){
            fs.writeFileSync(ownerPath, nextOwnerSource);
        }
    }
    if(root.toString() !== cssSource){
        changedModules += 1;
        if(write){
            fs.writeFileSync(modulePath, root.toString());
        }
    }
});

console.log(`CSS Module primitive migration ${write ? "wrote" : "would write"} ${changedOwners} owners and ${changedModules} modules.`);
console.log(`CSS Module primitive migration ${write ? "removed" : "would remove"} ${removedAssociations} selector/declaration associations.`);

if(check && (changedOwners > 0 || changedModules > 0 || removedAssociations > 0)){
    process.exit(1);
}
