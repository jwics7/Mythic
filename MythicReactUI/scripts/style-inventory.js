#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const postcss = require("postcss");
const {PRIMITIVE_DEFINITIONS} = require("./mythic-primitives");

const projectRoot = path.resolve(__dirname, "..");
const sourceRoot = path.join(projectRoot, "src");
const legacyGlobalStylesPath = path.join(sourceRoot, "themes", "LegacyGlobalStyles.css");
const primitiveStylesPath = path.join(sourceRoot, "styles", "MythicPrimitives.css");
const primitiveClassNames = Object.keys(PRIMITIVE_DEFINITIONS);
const primitiveClassNameSet = new Set(primitiveClassNames);
const primitiveBundleSites = [];
const legacyOwnerPatterns = [
    "credential-search", "eventing", "chat", "c2", "callback", "tasking", "dashboard", "response",
    "installed-service", "process", "dialog", "table", "graph", "file-browser", "state", "tag",
];

const walk = (directory, predicate, results = []) => {
    if(!fs.existsSync(directory)){
        return results;
    }
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

const countMatches = (source, expression) => (source.match(expression) || []).length;
const declarationExpression = /^\s*[a-zA-Z-]+\s*:\s*.+;\s*$/;
const isStaticExpression = (node) => {
    if(!node){
        return true;
    }
    if(["StringLiteral", "NumericLiteral", "BooleanLiteral", "NullLiteral"].includes(node.type)){
        return true;
    }
    if(node.type === "TemplateLiteral"){
        return node.expressions.length === 0;
    }
    if(node.type === "UnaryExpression"){
        return isStaticExpression(node.argument);
    }
    if(node.type === "ArrayExpression"){
        return node.elements.every(isStaticExpression);
    }
    if(node.type === "ObjectExpression"){
        return node.properties.every((property) => property.type === "ObjectProperty"
            && !property.computed
            && isStaticExpression(property.value));
    }
    return false;
};

const classifyJsxStyles = (source) => {
    const counts = {staticSx: 0, dynamicSx: 0, staticInlineStyle: 0, dynamicInlineStyle: 0};
    try{
        const ast = parser.parse(source, {sourceType: "unambiguous", plugins: ["jsx", "classProperties", "dynamicImport"]});
        traverse(ast, {
            JSXAttribute(attributePath) {
                const name = attributePath.node.name?.name;
                if(name !== "sx" && name !== "style"){
                    return;
                }
                const expression = attributePath.node.value?.expression;
                const staticValue = isStaticExpression(expression);
                if(name === "sx"){
                    counts[staticValue ? "staticSx" : "dynamicSx"] += 1;
                }else{
                    counts[staticValue ? "staticInlineStyle" : "dynamicInlineStyle"] += 1;
                }
            },
        });
    }catch(error){
        counts.dynamicSx = countMatches(source, /\bsx\s*=/g);
        counts.dynamicInlineStyle = countMatches(source, /\bstyle\s*=/g);
    }
    return counts;
};

const collectPrimitiveBundles = (source, filePath) => {
    try{
        const ast = parser.parse(source, {sourceType: "unambiguous", plugins: ["jsx", "classProperties", "dynamicImport"]});
        traverse(ast, {
            JSXAttribute(attributePath) {
                if(attributePath.node.name?.name !== "className" || attributePath.node.value?.type !== "StringLiteral"){
                    return;
                }
                const tokens = [...new Set(attributePath.node.value.value.split(/\s+/)
                    .filter((token) => primitiveClassNameSet.has(token)))];
                if(tokens.length < 4){ return; }
                const opening = attributePath.parentPath?.node;
                const component = opening?.name?.type === "JSXIdentifier" ? opening.name.name : "unknown";
                primitiveBundleSites.push({
                    component,
                    file: path.relative(sourceRoot, filePath),
                    line: attributePath.node.loc?.start.line || 0,
                    signature: [...tokens].sort().join(" "),
                    tokens,
                });
            },
        });
    }catch(error){
        // Parsing failures are already treated as dynamic styling by the main inventory.
    }
};

const findIdentityComponentAliases = (source, filePath) => {
    try{
        const ast = parser.parse(source, {sourceType: "unambiguous", plugins: ["jsx", "classProperties", "dynamicImport"]});
        const imported = new Set();
        const aliases = new Map();
        const exported = new Set();
        ast.program.body.forEach((statement) => {
            if(statement.type === "ImportDeclaration"){
                statement.specifiers.forEach((specifier) => imported.add(specifier.local.name));
            }
            const declaration = statement.type === "ExportNamedDeclaration" ? statement.declaration : statement;
            if(declaration?.type === "VariableDeclaration"){
                declaration.declarations.forEach((variable) => {
                    if(variable.id.type === "Identifier" && variable.init?.type === "Identifier"
                        && /^[A-Z][a-zA-Z0-9]*$/.test(variable.id.name)){
                        aliases.set(variable.id.name, variable.init.name);
                    }
                });
            }
        });
        ast.program.body.forEach((statement) => {
            if(statement.type === "ExportNamedDeclaration"){
                if(statement.declaration?.type === "VariableDeclaration"){
                    statement.declaration.declarations.forEach((variable) => exported.add(variable.id.name));
                }
                statement.specifiers.forEach((specifier) => exported.add(specifier.local.name));
            }
            if(statement.type === "ExportDefaultDeclaration" && statement.declaration.type === "Identifier"){
                const name = statement.declaration.name;
                if(aliases.has(name)){
                    exported.add(name);
                }else if(imported.has(name) && /^[A-Z]/.test(name)){
                    exported.add(name);
                    aliases.set(name, name);
                }
            }
        });
        return [...exported]
            .filter((name) => aliases.has(name))
            .map((name) => `${path.relative(sourceRoot, filePath)}:${name}=${aliases.get(name)}`);
    }catch(error){
        return [];
    }
};

const classifyLegacySelectorGroup = (selector) => {
    const owners = legacyOwnerPatterns.filter((owner) => selector.includes(`mythic-${owner}`));
    const owner = owners.length === 1 ? owners[0] : "legacy-compatibility";
    if(/react-flow|ace-|xterm|ReactVirtualized|svg-inline--fa/.test(selector)){
        return {category: "third-party-adapter", owner};
    }
    if(/\.Mui/.test(selector)){
        return {category: "mui-internal-compatibility", owner};
    }
    if(/:(?:hover|focus|disabled)|\.selected|status|active|warning|success|error|disabled/.test(selector)){
        return {category: "feature-state", owner};
    }
    if(/[ >+~]/.test(selector)){
        return {category: "owned-descendant", owner};
    }
    return {category: "legacy-compatibility", owner};
};

const cssFiles = walk(sourceRoot, (filePath) => filePath.endsWith(".css"));
const jsFiles = walk(sourceRoot, (filePath) => /\.[jt]sx?$/.test(filePath));
const declarationLines = [];
const parsedRoots = [];
let authoredStyleLines = 0;
let selectorDeclarationAssociations = 0;
let legacySelectorDeclarationAssociations = 0;
const legacySelectorGroupBuckets = {one: 0, twoToFour: 0, fiveToNine: 0, tenOrMore: 0};
const legacySelectorGroupExceptions = [];
let largestLegacySelectorGroup = 0;

cssFiles.forEach((filePath) => {
    const source = fs.readFileSync(filePath, "utf8");
    const lines = source.split(/\r?\n/);
    authoredStyleLines += lines.filter((line) => line.trim().length > 0).length;
    declarationLines.push(...lines.map((line) => line.trim()).filter((line) => declarationExpression.test(line)));
    parsedRoots.push({filePath, root: postcss.parse(source, {from: filePath})});
});

let legacyGlobalLines = 0;
let legacyGlobalDeclarations = 0;
let primitiveLines = 0;
if(fs.existsSync(legacyGlobalStylesPath)){
    const staticLines = fs.readFileSync(legacyGlobalStylesPath, "utf8").split(/\r?\n/);
    legacyGlobalLines = staticLines.filter((line) => line.trim().length > 0).length;
    const declarations = staticLines.map((line) => line.trim()).filter((line) => declarationExpression.test(line));
    legacyGlobalDeclarations = declarations.length;
}
if(fs.existsSync(primitiveStylesPath)){
    primitiveLines = fs.readFileSync(primitiveStylesPath, "utf8").split(/\r?\n/)
        .filter((line) => line.trim().length > 0).length;
}

let combinedJavaScriptSource = "";
const identityComponentAliases = [];

const sourceCounts = jsFiles.reduce((counts, filePath) => {
    const source = fs.readFileSync(filePath, "utf8");
    const jsxStyleCounts = classifyJsxStyles(source);
    collectPrimitiveBundles(source, filePath);
    identityComponentAliases.push(...findIdentityComponentAliases(source, filePath));
    combinedJavaScriptSource += `\n${source}`;
    counts.sx += countMatches(source, /\bsx\s*=/g);
    counts.inlineStyle += countMatches(source, /\bstyle\s*=/g);
    counts.styledCalls += countMatches(source, /\bstyled\s*\(/g);
    counts.classNames += countMatches(source, /\bclassName\s*=/g);
    counts.legacyMythicClassReferences += countMatches(source, /["'`]mythic-[a-zA-Z0-9_-]+/g);
    counts.primitiveClassReferences += (source.match(/\bmythic-[a-zA-Z0-9_-]+\b/g) || [])
        .filter((className) => primitiveClassNameSet.has(className)).length;
    counts.staticSx += jsxStyleCounts.staticSx;
    counts.dynamicSx += jsxStyleCounts.dynamicSx;
    counts.staticInlineStyle += jsxStyleCounts.staticInlineStyle;
    counts.dynamicInlineStyle += jsxStyleCounts.dynamicInlineStyle;
    return counts;
}, {
    sx: 0,
    inlineStyle: 0,
    styledCalls: 0,
    classNames: 0,
    legacyMythicClassReferences: 0,
    primitiveClassReferences: 0,
    staticSx: 0,
    dynamicSx: 0,
    staticInlineStyle: 0,
    dynamicInlineStyle: 0,
});

const cssClassTokens = new Set();
const declarationBlocks = new Map();
let cssRuleCount = 0;
parsedRoots.forEach(({root}) => root.walkRules((rule) => {
    cssRuleCount += 1;
    const associationCount = rule.selectors.length * rule.nodes.filter((node) => node.type === "decl").length;
    selectorDeclarationAssociations += associationCount;
    if(rule.source?.input?.file === legacyGlobalStylesPath){
        legacySelectorDeclarationAssociations += associationCount;
        const selectorCount = rule.selectors.length;
        largestLegacySelectorGroup = Math.max(largestLegacySelectorGroup, selectorCount);
        if(selectorCount === 1){
            legacySelectorGroupBuckets.one += 1;
        }else if(selectorCount < 5){
            legacySelectorGroupBuckets.twoToFour += 1;
        }else if(selectorCount < 10){
            legacySelectorGroupBuckets.fiveToNine += 1;
            legacySelectorGroupExceptions.push({
                ...classifyLegacySelectorGroup(rule.selector),
                selectorCount,
                selector: rule.selector,
            });
        }else{
            legacySelectorGroupBuckets.tenOrMore += 1;
        }
    }
    (rule.selector.match(/\.([a-zA-Z_][a-zA-Z0-9_-]*)/g) || [])
        .forEach((token) => cssClassTokens.add(token.slice(1)));
    const declarations = rule.nodes
        .filter((node) => node.type === "decl")
        .map((node) => `${node.prop}:${node.value}${node.important ? "!important" : ""}`)
        .join(";");
    if(declarations){
        const entries = declarationBlocks.get(declarations) || [];
        entries.push(rule.selector);
        declarationBlocks.set(declarations, entries);
    }
}));

const duplicateBlocks = [...declarationBlocks.entries()]
    .filter(([, selectors]) => selectors.length > 1)
    .sort((left, right) => right[1].length - left[1].length);
const runtimeClassPrefixes = ["Mui", "ace_", "react-flow__", "ReactVirtualized__", "xterm", "Toastify__"];
const isRuntimeClass = (token) => runtimeClassPrefixes.some((prefix) => token.startsWith(prefix));
const isSourceReferenced = (token) => {
    if(combinedJavaScriptSource.includes(token)){
        return true;
    }
    const segments = token.split("-");
    return segments.slice(0, -1).some((_, index) => {
        const prefix = segments.slice(0, segments.length - index - 1).join("-");
        return prefix.length >= 16 && combinedJavaScriptSource.includes(prefix);
    });
};
const referencedClassTokens = [...cssClassTokens]
    .filter((token) => isRuntimeClass(token) || isSourceReferenced(token));
const unusedClassTokens = [...cssClassTokens]
    .filter((token) => !isRuntimeClass(token) && !isSourceReferenced(token))
    .sort();

const declarationFrequency = declarationLines.reduce((frequencies, declaration) => {
    frequencies.set(declaration, (frequencies.get(declaration) || 0) + 1);
    return frequencies;
}, new Map());
const repeatedDeclarations = [...declarationFrequency.entries()]
    .filter(([, count]) => count > 1)
    .sort((left, right) => right[1] - left[1]);

const inventory = {
    generatedAt: new Date().toISOString(),
    files: {
        css: cssFiles.length,
        javascript: jsFiles.length,
    },
    styles: {
        authoredCssNonblankLines: authoredStyleLines,
        legacyGlobalNonblankLines: legacyGlobalLines,
        primitiveNonblankLines: primitiveLines,
        declarations: declarationLines.length,
        legacyGlobalDeclarations,
        uniqueDeclarationLines: declarationFrequency.size,
        repeatedDeclarationOccurrences: declarationLines.length - declarationFrequency.size,
        rules: cssRuleCount,
        distinctDeclarationBlocks: declarationBlocks.size,
        duplicateDeclarationBlockGroups: duplicateBlocks.length,
        rulesInDuplicateDeclarationBlocks: duplicateBlocks.reduce((total, [, selectors]) => total + selectors.length, 0),
        selectorDeclarationAssociations,
        legacySelectorDeclarationAssociations,
    },
    selectors: {
        classTokens: cssClassTokens.size,
        referencedClassTokens: referencedClassTokens.length,
        unusedClassTokens: unusedClassTokens.length,
        unusedExamples: unusedClassTokens.slice(0, 50),
        legacyGroupSizeBuckets: legacySelectorGroupBuckets,
        largestLegacySelectorGroup,
        reviewedLegacyExceptions: legacySelectorGroupExceptions,
    },
    primitives: {
        catalogClasses: primitiveClassNames.length,
        sourceReferences: sourceCounts.primitiveClassReferences,
        referencedCatalogClasses: primitiveClassNames.filter((className) => combinedJavaScriptSource.includes(className)).length,
        bundleSites: primitiveBundleSites.length,
        featureBundleSites: primitiveBundleSites.filter((site) => site.file.startsWith(`components${path.sep}pages${path.sep}`)
            || site.file.startsWith(`components${path.sep}Chat${path.sep}`)).length,
        repeatedBundleGroupCount: new Set(primitiveBundleSites
            .map((site) => site.signature)
            .filter((signature, index, signatures) => signatures.indexOf(signature) !== index)).size,
        repeatedBundleGroups: [...primitiveBundleSites.reduce((groups, site) => {
            const entries = groups.get(site.signature) || [];
            entries.push(`${site.file}:${site.line}`);
            groups.set(site.signature, entries);
            return groups;
        }, new Map()).entries()]
            .filter(([, sites]) => sites.length > 1)
            .sort((left, right) => right[1].length - left[1].length)
            .slice(0, 20)
            .map(([signature, sites]) => ({count: sites.length, signature, sites: sites.slice(0, 12)})),
    },
    identityComponentAliases: {
        count: identityComponentAliases.length,
        aliases: identityComponentAliases,
    },
    source: sourceCounts,
    mostRepeatedDeclarations: repeatedDeclarations.slice(0, 30).map(([declaration, count]) => ({declaration, count})),
    mostRepeatedDeclarationBlocks: duplicateBlocks.slice(0, 20).map(([declarations, selectors]) => ({
        count: selectors.length,
        declarations,
        selectors: selectors.slice(0, 12),
    })),
};

if(process.argv.includes("--json")){
    process.stdout.write(`${JSON.stringify(inventory, null, 2)}\n`);
    process.exit(0);
}

console.log("Mythic style inventory");
console.log(`CSS files: ${inventory.files.css}`);
console.log(`Authored CSS nonblank lines: ${inventory.styles.authoredCssNonblankLines}`);
console.log(`Legacy global nonblank lines: ${inventory.styles.legacyGlobalNonblankLines}`);
console.log(`Primitive CSS nonblank lines: ${inventory.styles.primitiveNonblankLines}`);
console.log(`CSS declarations: ${inventory.styles.declarations}`);
console.log(`Unique declaration lines: ${inventory.styles.uniqueDeclarationLines}`);
console.log(`Repeated declaration occurrences: ${inventory.styles.repeatedDeclarationOccurrences}`);
console.log(`CSS rules: ${inventory.styles.rules}`);
console.log(`Duplicate declaration block groups: ${inventory.styles.duplicateDeclarationBlockGroups}`);
console.log(`Unused selector class tokens: ${inventory.selectors.unusedClassTokens}`);
console.log(`JSX sx props: ${inventory.source.sx}`);
console.log(`  Static sx props: ${inventory.source.staticSx}`);
console.log(`  Runtime sx props: ${inventory.source.dynamicSx}`);
console.log(`JSX style props: ${inventory.source.inlineStyle}`);
console.log(`  Static style props: ${inventory.source.staticInlineStyle}`);
console.log(`  Runtime style props: ${inventory.source.dynamicInlineStyle}`);
console.log(`styled() calls: ${inventory.source.styledCalls}`);
console.log(`Legacy Mythic class references: ${inventory.source.legacyMythicClassReferences}`);
console.log(`Primitive class references: ${inventory.source.primitiveClassReferences}`);
console.log(`Primitive catalog classes: ${inventory.primitives.catalogClasses}`);
console.log(`Static primitive bundles (4+ classes): ${inventory.primitives.bundleSites}`);
console.log(`  Feature/Chat primitive bundles: ${inventory.primitives.featureBundleSites}`);
console.log(`Repeated exact primitive bundle groups: ${inventory.primitives.repeatedBundleGroupCount}`);
console.log(`Legacy selector groups (1 / 2-4 / 5-9 / 10+): ${inventory.selectors.legacyGroupSizeBuckets.one} / ${inventory.selectors.legacyGroupSizeBuckets.twoToFour} / ${inventory.selectors.legacyGroupSizeBuckets.fiveToNine} / ${inventory.selectors.legacyGroupSizeBuckets.tenOrMore}`);
console.log(`Largest legacy selector group: ${inventory.selectors.largestLegacySelectorGroup}`);
console.log(`Zero-behavior component aliases: ${inventory.identityComponentAliases.count}`);
if(process.argv.includes("--unused")){
    console.log("Unused selector class tokens:");
    unusedClassTokens.forEach((token) => console.log(`  ${token}`));
}
console.log("Most repeated declarations:");
inventory.mostRepeatedDeclarations.forEach(({declaration, count}) => console.log(`${String(count).padStart(5)}  ${declaration}`));
