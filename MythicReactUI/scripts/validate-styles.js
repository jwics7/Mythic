#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");
const crypto = require("crypto");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const postcss = require("postcss");
const {PRIMITIVE_DEFINITIONS} = require("./mythic-primitives");

const projectRoot = path.resolve(__dirname, "..");
const sourceRoot = path.resolve(__dirname, "..", "src");
const primitivePath = path.join(sourceRoot, "styles", "MythicPrimitives.css");
const modulePrimitiveAllowlist = new Map(Object.entries({
    "components/App.module.css": ["navigationAccent", "navigationAccentHidden"],
    "components/MythicComponents/MythicDialogLayout.module.css": ["body", "form", "section", "sectionTitle", "sectionDescription", "fieldDescription", "grid", "formGrid", "choiceRow", "choiceDivider", "footer", "button", "formField", "fieldLabel", "formNote", "switchRow"],
    "components/MythicComponents/MythicPageHeader.module.css": ["root"],
    "components/MythicComponents/MythicStateDisplay.module.css": ["root", "icon", "title", "description"],
    "components/pages/Callbacks/TaskDisplay.module.css": ["paper", "taskHeaderBody", "taskMetaRow", "taskMetaItem", "taskHeaderActions", "taskIconButton", "taskCommandRow", "taskCommandText", "taskCommandTextCompact", "taskTags", "taskCommentBlock", "accordionRoot", "accordionContent", "accordionDetails", "accordionDetailsRoot"],
    "components/pages/Login/LoginLayout.module.css": ["root", "panel", "formStack", "methodNote", "menuPaper"],
    "components/pages/Settings/AppearancePreview.module.css": ["modePreview", "modeLabel", "subtleCard"],
}).map(([filePath, classNames]) => [filePath, new Set(classNames)]));
const modulePrimitiveAllowlistFingerprints = new Map(Object.entries({
    "components/App.module.css": "b72131199dfaf2d30b9d084c190d9e3f917271e78efa1e56e74978c8dd22ea04",
    "components/MythicComponents/MythicDialogLayout.module.css": "93e8ee042fe4a396529dbff303e353b9c644f9534d047f8104c974b8fc19e6e0",
    "components/MythicComponents/MythicPageHeader.module.css": "6b79ff3bfd02018d5497f7ff82d4644288ead46709a34e5f1f8eb2072c6c9ac6",
    "components/MythicComponents/MythicStateDisplay.module.css": "3c6fa01dc5ff9cbe57be8602d57ecfd4449714731cd68e8ab47e4dbc6cb4255e",
    "components/pages/Callbacks/TaskDisplay.module.css": "0714bcdc2ebbecf9496225e3c62958c3a5a32679c15be2bbbb516907a2cf69d2",
    "components/pages/Login/LoginLayout.module.css": "7f9fe5dd1bca1c7fb442275175d2bf3dd9ae2f87a6d73b2fa079cf989492c372",
    "components/pages/Settings/AppearancePreview.module.css": "9e943ab16f838e4b9be5f4f208ac4e63f364146a2c285b93d961b91d3ce3890b",
}));
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

const parseJavaScript = (source, filePath) => {
    try{
        return parser.parse(source, {
            sourceFilename: filePath,
            sourceType: "unambiguous",
            plugins: ["jsx", "classProperties", "dynamicImport", "optionalChaining"],
        });
    }catch(error){
        failures.push(`${path.relative(sourceRoot, filePath)} could not be parsed for style validation: ${error.message}`);
        return null;
    }
};

const primitiveTokensFromText = (value) => (value.match(/\bmythic-[a-zA-Z0-9_-]+\b/g) || [])
    .filter((className) => PRIMITIVE_DEFINITIONS[className]);
const combineTokenPaths = (leftPaths, rightPaths) => {
    const combinations = [];
    leftPaths.forEach((left) => rightPaths.forEach((right) => {
        if(combinations.length < 128){
            combinations.push([...left, ...right]);
        }
    }));
    return combinations.length > 0 ? combinations : [[]];
};
const sharedComponentOwnedPrimitives = {
    MythicActionGroup: /^mythic-(?:flex|cluster|inline-cluster|align-(?:center|start|stretch)|justify-(?:start|center|end|between)|wrap|gap-(?:xs|sm|md)|min-width-0|flex-fill)$/,
    MythicActionButton: /^mythic-(?:border|border-radius|text-primary|font-size-(?:caption|small)|font-weight-strong)$/,
    MythicCluster: /^mythic-(?:flex|cluster|inline-cluster|align-(?:center|start|stretch)|justify-(?:start|center|end|between)|wrap|gap-(?:xs|sm|md)|min-width-0|flex-fill)$/,
    MythicCodeSurface: /^mythic-(?:border|border-radius|monospace|pre-wrap|break-anywhere|block|max-width-full|min-width-0|text-primary|font-size-(?:caption|small)|overflow-(?:auto|hidden))$/,
    MythicGrid: /^mythic-(?:grid|gap-(?:xs|sm|md))$/,
    MythicMetadataItem: /^mythic-(?:flex|align-center|wrap|gap-xs|min-width-0)$/,
    MythicMetadataLabel: /^mythic-(?:text-secondary|block|font-weight-strong|line-height-tight|font-size-(?:xs|caption))$/,
    MythicMetadataValue: /^mythic-(?:break-anywhere|line-height-normal|min-width-0|font-size-(?:caption|small)|text-(?:primary|secondary))$/,
    MythicPanel: /^mythic-(?:border(?:-radius(?:-(?:sm|lg))?)?|stack|cluster|gap-(?:xs|sm|md)|fill|min-width-0|overflow-(?:hidden|auto)|surface(?:-(?:muted|raised|subtle))?)$/,
    MythicText: /^mythic-(?:break-anywhere|font-size-(?:xs|caption|small|body|body-small)|font-weight-(?:medium|strong|bold|heavy|extra-bold)|line-height-(?:normal|snug|tight)|letter-spacing-reset|min-width-0|pre-wrap|text-(?:primary|secondary))$/,
    MythicScrollRegion: /^mythic-scroll-region$/,
    MythicSectionDescription: /^mythic-(?:font-size-small|line-height-normal|text-secondary)$/,
    MythicSectionHeading: /^mythic-(?:font-size-body-small|font-weight-extra-bold|line-height-snug|text-primary)$/,
    MythicStack: /^mythic-(?:stack|gap-(?:xs|sm|md)|align-(?:center|start|stretch)|fill|scroll-region|min-width-0)$/,
    MythicToolbar: /^mythic-(?:flex|cluster|inline-cluster|align-(?:center|start|stretch)|justify-(?:start|center|end|between)|wrap|gap-(?:xs|sm|md)|min-width-0)$/,
    MythicTruncatedText: /^mythic-truncate$/,
};
const primitiveTokenPaths = (node) => {
    if(!node){
        return [[]];
    }
    if(node.type === "StringLiteral"){
        return [primitiveTokensFromText(node.value)];
    }
    if(node.type === "TemplateLiteral"){
        let paths = [[]];
        node.quasis.forEach((quasi, index) => {
            paths = combineTokenPaths(paths, [primitiveTokensFromText(quasi.value.cooked || quasi.value.raw || "")]);
            if(node.expressions[index]){
                paths = combineTokenPaths(paths, primitiveTokenPaths(node.expressions[index]));
            }
        });
        return paths;
    }
    if(node.type === "ConditionalExpression"){
        return [...primitiveTokenPaths(node.consequent), ...primitiveTokenPaths(node.alternate)];
    }
    if(node.type === "LogicalExpression"){
        if(node.operator === "&&"){
            return [[], ...primitiveTokenPaths(node.right)];
        }
        return [...primitiveTokenPaths(node.left), ...primitiveTokenPaths(node.right)];
    }
    if(node.type === "BinaryExpression" && node.operator === "+"){
        return combineTokenPaths(primitiveTokenPaths(node.left), primitiveTokenPaths(node.right));
    }
    if(node.type === "ArrayExpression"){
        return node.elements.reduce((paths, element) => combineTokenPaths(paths, primitiveTokenPaths(element)), [[]]);
    }
    if(node.type === "ObjectExpression"){
        return node.properties.reduce((paths, property) => {
            if(property.type !== "ObjectProperty"){
                return paths;
            }
            const key = property.key.type === "Identifier" ? property.key.name : property.key.value;
            const tokens = typeof key === "string" ? primitiveTokensFromText(key) : [];
            return tokens.length > 0 ? [...paths, ...combineTokenPaths(paths, [tokens])] : paths;
        }, [[]]);
    }
    if(node.type === "CallExpression"){
        return node.arguments.reduce((paths, argument) => combineTokenPaths(paths, primitiveTokenPaths(argument)), [[]]);
    }
    return [[]];
};

const validateJavaScriptStructure = (source, filePath) => {
    const ast = parseJavaScript(source, filePath);
    if(!ast){
        return;
    }
    const identityAliases = new Map();
    const importedIdentifiers = new Set();
    ast.program.body.forEach((statement) => {
        if(statement.type === "ImportDeclaration"){
            statement.specifiers.forEach((specifier) => importedIdentifiers.add(specifier.local.name));
        }
        const declaration = statement.type === "ExportNamedDeclaration" ? statement.declaration : statement;
        if(declaration?.type === "VariableDeclaration"){
            declaration.declarations.forEach((variable) => {
                if(variable.id.type === "Identifier" && variable.init?.type === "Identifier"
                    && /^[A-Z][a-zA-Z0-9]*$/.test(variable.id.name)){
                    identityAliases.set(variable.id.name, variable.init.name);
                }
            });
        }
    });
    const exportedNames = new Set();
    ast.program.body.forEach((statement) => {
        if(statement.type === "ExportNamedDeclaration"){
            if(statement.declaration?.type === "VariableDeclaration"){
                statement.declaration.declarations.forEach((variable) => {
                    if(variable.id.type === "Identifier"){
                        exportedNames.add(variable.id.name);
                    }
                });
            }
            statement.specifiers.forEach((specifier) => exportedNames.add(specifier.local.name));
        }
        if(statement.type === "ExportDefaultDeclaration" && statement.declaration.type === "Identifier"){
            const exported = statement.declaration.name;
            if(identityAliases.has(exported)){
                exportedNames.add(exported);
            }else if(importedIdentifiers.has(exported) && /^[A-Z]/.test(exported)){
                failures.push(`${path.relative(sourceRoot, filePath)} default-exports imported component ${exported} without behavior`);
            }
        }
    });
    exportedNames.forEach((exported) => {
        if(identityAliases.has(exported)){
            failures.push(`${path.relative(sourceRoot, filePath)} exports zero-behavior component alias ${exported} = ${identityAliases.get(exported)}`);
        }
    });

    traverse(ast, {
        JSXAttribute(attributePath) {
            if(attributePath.node.name?.name !== "className"){
                return;
            }
            const value = attributePath.node.value;
            const paths = value?.type === "StringLiteral"
                ? primitiveTokenPaths(value)
                : primitiveTokenPaths(value?.expression);
            const duplicates = new Set();
            paths.forEach((tokens) => {
                const seen = new Set();
                tokens.forEach((token) => {
                    if(seen.has(token)){
                        duplicates.add(token);
                    }
                    seen.add(token);
                });
            });
            duplicates.forEach((token) => failures.push(
                `${path.relative(sourceRoot, filePath)} can apply duplicate primitive .${token} on the same className runtime path`,
            ));
            const openingElement = attributePath.parentPath?.node;
            const componentName = openingElement?.name?.type === "JSXIdentifier" ? openingElement.name.name : null;
            const ownedPattern = sharedComponentOwnedPrimitives[componentName];
            if(ownedPattern){
                const restated = new Set(paths.flat().filter((token) => ownedPattern.test(token)));
                restated.forEach((token) => failures.push(
                    `${path.relative(sourceRoot, filePath)} extends ${componentName} with owned primitive .${token}; use its curated variant prop`,
                ));
            }
        },
    });
};

const javascriptFiles = walk(sourceRoot, (filePath) => /\.[jt]sx?$/.test(filePath));
const cssFiles = walk(sourceRoot, (filePath) => filePath.endsWith(".css"));
const moduleFiles = walk(sourceRoot, (filePath) => filePath.endsWith(".module.css"));
const failures = [];
let references = 0;
const moduleImporters = new Map();

javascriptFiles.forEach((filePath) => {
    const source = fs.readFileSync(filePath, "utf8");
    const imports = [
        ...source.matchAll(/import\s+([a-zA-Z_$][\w$]*)\s+from\s+["']([^"']+\.module\.css)["']/g),
        ...[...source.matchAll(/import\s+["']([^"']+\.module\.css)["']/g)]
            .map((match) => [match[0], null, match[1]]),
    ];
    imports.forEach((match) => {
        const resolved = path.resolve(path.dirname(filePath), match[2]);
        if(!fs.existsSync(resolved)){
            failures.push(`${path.relative(sourceRoot, filePath)} imports missing ${match[2]}`);
            return;
        }
        const owners = moduleImporters.get(resolved) || [];
        owners.push({alias: match[1], filePath, source});
        moduleImporters.set(resolved, owners);
    });
});

if(!fs.existsSync(primitivePath)){
    failures.push("styles/MythicPrimitives.css is missing");
}else{
    const primitiveRoot = postcss.parse(fs.readFileSync(primitivePath, "utf8"), {from: primitivePath});
    const actualDefinitions = new Map();
    primitiveRoot.walkRules((rule) => {
        const match = rule.selector.match(/^:where\(\.([a-zA-Z_][\w-]*)\)$/);
        if(!match){
            failures.push(`styles/MythicPrimitives.css contains non-zero-specificity selector ${rule.selector}`);
            return;
        }
        if(actualDefinitions.has(match[1])){
            failures.push(`styles/MythicPrimitives.css defines .${match[1]} more than once`);
        }
        actualDefinitions.set(match[1], Object.fromEntries(rule.nodes
            .filter((node) => node.type === "decl")
            .map((declaration) => [declaration.prop, declaration.value])));
        if(rule.nodes.some((node) => node.type === "decl" && node.important)){
            failures.push(`styles/MythicPrimitives.css uses !important in .${match[1]}`);
        }
    });
    Object.entries(PRIMITIVE_DEFINITIONS).forEach(([className, declarations]) => {
        if(!actualDefinitions.has(className)){
            failures.push(`styles/MythicPrimitives.css is missing .${className}`);
        }else if(JSON.stringify(actualDefinitions.get(className)) !== JSON.stringify(declarations)){
            failures.push(`styles/MythicPrimitives.css .${className} does not match the primitive contract`);
        }
    });
    actualDefinitions.forEach((_, className) => {
        if(!PRIMITIVE_DEFINITIONS[className]){
            failures.push(`styles/MythicPrimitives.css defines unregistered .${className}`);
        }
    });
}

moduleFiles.forEach((modulePath) => {
    const cssSource = fs.readFileSync(modulePath, "utf8");
    const classNames = new Set();
    postcss.parse(cssSource, {from: modulePath}).walkRules((rule) => {
        if(modulePath.includes(`${path.sep}styles${path.sep}families${path.sep}`) && rule.selectors.length >= 10){
            failures.push(`${path.relative(sourceRoot, modulePath)} contains a ${rule.selectors.length}-branch selector group; assign the treatment to a shared contract or bounded owner`);
        }
        const localSelector = rule.selector.replace(/:global\([^)]*\)/g, "");
        (localSelector.match(/\.([a-zA-Z_][\w-]*)/g) || []).forEach((token) => classNames.add(token.slice(1)));
    });
    const importers = moduleImporters.get(modulePath) || [];
    if(importers.length === 0){
        failures.push(`${path.relative(sourceRoot, modulePath)} has no component-family JavaScript owner`);
        return;
    }
    const familyDirectory = path.dirname(modulePath);
    const referenced = new Set();
    importers.forEach(({alias, filePath, source}) => {
        const relativeOwnerPath = path.relative(familyDirectory, filePath);
        if(relativeOwnerPath.startsWith(`..${path.sep}`) || relativeOwnerPath === ".."){
            failures.push(`${path.relative(sourceRoot, filePath)} imports ${path.relative(sourceRoot, modulePath)} outside its component-family directory`);
        }
        if(!alias){
            return;
        }
        const styleAliases = new Set([alias]);
        const aliasAssignmentPattern = new RegExp(`\\bconst\\s+([a-zA-Z_$][\\w$]*)\\s*=\\s*${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*;`, "g");
        [...source.matchAll(aliasAssignmentPattern)].forEach((match) => styleAliases.add(match[1]));
        const directReferences = [
            ...[...styleAliases].flatMap((styleAlias) => {
                const escapedAlias = styleAlias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                const dotPattern = new RegExp(`\\b${escapedAlias}\\.([a-zA-Z_][\\w]*)`, "g");
                const bracketPattern = new RegExp(`\\b${escapedAlias}\\[["']([a-zA-Z_][\\w-]*)["']\\]`, "g");
                return [
                    ...[...source.matchAll(dotPattern)].map((match) => match[1]),
                    ...[...source.matchAll(bracketPattern)].map((match) => match[1]),
                ];
            }),
        ];
        directReferences.forEach((className) => {
            referenced.add(className);
            if(!classNames.has(className)){
                failures.push(`${path.relative(sourceRoot, filePath)} references missing .${className} from ${path.relative(sourceRoot, modulePath)}`);
            }
        });

        // A cohesive family may merge its modules into one resolver so private
        // subcomponents do not need to import implementation CSS independently.
        // In that case, require each local selector to remain traceable as an
        // exact class token or as a visible template-literal prefix.
        const escapedImportAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        if(new RegExp(`\\.\\.\\.${escapedImportAlias}\\b`).test(source)){
            const dynamicPrefixes = [...source.matchAll(/\b([a-zA-Z_][\w-]*-)\$\{/g)].map((match) => match[1]);
            classNames.forEach((className) => {
                const exactPattern = new RegExp(`(^|[^a-zA-Z0-9_-])${className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-zA-Z0-9_-]|$)`);
                if(exactPattern.test(source) || dynamicPrefixes.some((prefix) => className.startsWith(prefix))){
                    referenced.add(className);
                }
            });
        }
    });
    references += referenced.size;
    classNames.forEach((className) => {
        if(!referenced.has(className)){
            failures.push(`${path.relative(sourceRoot, modulePath)} contains unused .${className}`);
        }
    });

    const relativeModulePath = path.relative(sourceRoot, modulePath);
    const allowedClasses = modulePrimitiveAllowlist.get(relativeModulePath) || new Set();
    const allowedSignatures = [];
    const primitiveDeclarations = new Set(Object.values(PRIMITIVE_DEFINITIONS)
        .flatMap((declarations) => Object.entries(declarations).map(([property, value]) => `${property}\u0000${value}`)));
    postcss.parse(cssSource, {from: modulePath}).nodes.filter((node) => node.type === "rule").forEach((rule) => {
        const simpleClasses = rule.selectors.map((selector) => selector.trim().match(/^\.([a-zA-Z_][\w-]*)$/))
            .filter(Boolean)
            .map((match) => match[1]);
        if(simpleClasses.length === 0){
            return;
        }
        rule.nodes.filter((node) => node.type === "decl" && !node.important).forEach((declaration) => {
            if(!primitiveDeclarations.has(`${declaration.prop}\u0000${declaration.value}`)){
                return;
            }
            simpleClasses.forEach((className) => {
                if(allowedClasses.has(className)){
                    allowedSignatures.push(`${className}\u0000${declaration.prop}\u0000${declaration.value}`);
                }else{
                    failures.push(`${relativeModulePath} .${className} repeats primitive declaration ${declaration.prop}: ${declaration.value}`);
                }
            });
        });
    });
    if(modulePrimitiveAllowlistFingerprints.has(relativeModulePath)){
        const fingerprint = crypto.createHash("sha256").update(allowedSignatures.sort().join("\n")).digest("hex");
        if(fingerprint !== modulePrimitiveAllowlistFingerprints.get(relativeModulePath)){
            failures.push(`${relativeModulePath} changed its reviewed primitive-duplication exceptions (${fingerprint}); migrate the change or update the exact fingerprint`);
        }
    }
});

javascriptFiles.forEach((filePath) => {
    const source = fs.readFileSync(filePath, "utf8");
    validateJavaScriptStructure(source, filePath);
    if(source.includes("LegacyGlobalStyles.css") || source.includes("createLegacyCssVariables")){
        failures.push(`${path.relative(sourceRoot, filePath)} imports a removed legacy styling artifact`);
    }
    if(/mythic-table-row-(?:icon-)?action(?:-|\b)|mythic-dialog-title-action\b/.test(source)){
        failures.push(`${path.relative(sourceRoot, filePath)} uses a removed action selector; use MythicActionButton tone/emphasis props`);
    }
});

[...javascriptFiles, ...cssFiles].forEach((filePath) => {
    const source = fs.readFileSync(filePath, "utf8");
    if(/--mythic-theme-palette-[\w-]+-alpha-(?:dark|light|[0-9a-f])/i.test(source)){
        failures.push(`${path.relative(sourceRoot, filePath)} uses a derivation-named color token; use a purpose-based --mythic-effect-* token`);
    }
});

const combinedJavaScript = javascriptFiles.map((filePath) => fs.readFileSync(filePath, "utf8")).join("\n");
const sourcePrimitiveTokens = new Set(combinedJavaScript.match(/\bmythic-[a-zA-Z0-9_-]+\b/g) || []);
Object.keys(PRIMITIVE_DEFINITIONS).forEach((className) => {
    if(!sourcePrimitiveTokens.has(className)){
        failures.push(`styles/MythicPrimitives.css contains unused .${className}`);
    }
});
const reservedPrimitiveName = /^mythic-(?:border(?:-|$)|surface(?:-|$)|flex(?:-|$)|inline-flex$|align-(?:center|start|stretch)$|justify-(?:start|center|end|between)$|gap-(?:xs|sm|md)$|wrap$|min-(?:width|height)-|full-(?:width|height)|max-width-full$|overflow-(?:hidden|auto)$|stack$|cluster$|inline-cluster$|fill$|scroll-region$|truncate$|break-anywhere$|nowrap$|pre-wrap$|block$|relative$|grid-span-full$|clickable$|font-(?:size|weight)-|line-height-|monospace$|divider-(?:top|bottom)$|inherit-color$|text-(?:primary|secondary|info|success|warning|error)$|uppercase$|letter-spacing-reset$)/;
sourcePrimitiveTokens.forEach((className) => {
    if(reservedPrimitiveName.test(className) && !PRIMITIVE_DEFINITIONS[className]){
        failures.push(`JavaScript references undefined primitive .${className}`);
    }
});

const moduleMigrationCheck = childProcess.spawnSync(process.execPath, [path.join(__dirname, "migrate-module-primitives.js"), "--check"], {
    cwd: projectRoot,
    encoding: "utf8",
});
if(moduleMigrationCheck.status !== 0){
    failures.push("CSS Modules contain safely migratable primitive declarations; run npm run style:migrate-primitives -- --write");
}

const removedLegacyArtifacts = [
    path.join(sourceRoot, "themes", "LegacyGlobalStyles.css"),
    path.join(sourceRoot, "themes", "createLegacyCssVariables.js"),
];
removedLegacyArtifacts.forEach((filePath) => {
    if(fs.existsSync(filePath)){
        failures.push(`${path.relative(sourceRoot, filePath)} must not be restored`);
    }
});

const idempotentStyleScripts = [
    "canonicalize-theme-tokens.js",
    "consolidate-style-family-blocks.js",
    "extract-chat-graphql.js",
    "extract-chat-messages.js",
    "extract-style-families.js",
    "migrate-layout-contracts.js",
    "migrate-content-contracts.js",
    "migrate-action-buttons.js",
    "remove-empty-classnames.js",
    "remove-unused-mui-imports.js",
    "migrate-metadata-items.js",
    "migrate-section-copy.js",
    "migrate-search-metadata.js",
    "migrate-metadata-copy.js",
    "migrate-panel-contracts.js",
    "migrate-text-contracts.js",
];
idempotentStyleScripts.forEach((scriptName) => {
    const check = childProcess.spawnSync(process.execPath, [path.join(__dirname, scriptName)], {
        cwd: projectRoot,
        encoding: "utf8",
    });
    if(check.status !== 0){
        failures.push(`${scriptName} is not dry-run idempotent; apply its migration and run validation again`);
    }
});

if(failures.length > 0){
    console.error("Style validation failed:");
    failures.forEach((failure) => console.error(`  - ${failure}`));
    process.exit(1);
}

console.log(`Validated ${moduleFiles.length} CSS Modules and ${references} class references.`);
