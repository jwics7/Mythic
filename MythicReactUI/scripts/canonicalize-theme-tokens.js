#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const sourceRoot = path.resolve(__dirname, "..", "src");
const compatibilityVariablePath = path.join(sourceRoot, "themes", "createDerivedThemeVariables.js");
const write = process.argv.includes("--write");
const replacements = new Map([
    ["--mythic-theme-border-color", "--mythic-color-application-border"],
    ["--mythic-theme-chat-header-bg", "--mythic-color-header-surface"],
    ["--mythic-theme-output-bg", "--mythic-color-tasking-outputBackground"],
    ["--mythic-theme-output-text", "--mythic-color-tasking-outputText"],
    ["--mythic-theme-page-header-main", "--mythic-color-header-surface"],
    ["--mythic-theme-page-header-text", "--mythic-color-header-text"],
    ["--mythic-color-header-text-border", "--mythic-effect-header-border"],
    ["--mythic-color-header-text-muted", "--mythic-effect-header-muted"],
    ["--mythic-color-header-text-secondary", "--mythic-effect-header-secondary"],
    ["--mythic-color-header-text-soft", "--mythic-effect-header-soft"],
    ["--mythic-color-header-text-strong-border", "--mythic-effect-header-strongBorder"],
    ["--mythic-theme-page-header-text-border", "--mythic-effect-header-border"],
    ["--mythic-theme-page-header-text-muted", "--mythic-effect-header-muted"],
    ["--mythic-theme-page-header-text-secondary", "--mythic-effect-header-secondary"],
    ["--mythic-theme-page-header-text-soft", "--mythic-effect-header-soft"],
    ["--mythic-theme-page-header-text-strong-border", "--mythic-effect-header-strongBorder"],
    ["--mythic-theme-panel-muted-bg", "--mythic-color-application-muted"],
    ["--mythic-theme-panel-raised-bg", "--mythic-color-application-raised"],
    ["--mythic-theme-shape-border-radius", "--mythic-shape-borderRadius"],
    ["--mythic-theme-surface-hover-bg", "--mythic-effect-table-rowHover"],
    ["--mythic-theme-table-header", "--mythic-color-table-header"],
    ["--mythic-theme-table-header-hover-bg", "--mythic-effect-table-rowHover"],
    ["--mythic-theme-table-hover", "--mythic-color-table-hover"],
    ["--mythic-theme-table-row-hover-bg", "--mythic-effect-table-rowHover"],
    ["--mythic-theme-table-row-stripe-bg", "--mythic-effect-table-rowStripe"],
    ["--mythic-theme-table-selected-bg", "--mythic-effect-table-selected"],
    ["--mythic-theme-table-selected-hierarchy-bg", "--mythic-effect-table-selectedHierarchy"],
    ["--mythic-theme-transfer-list-header-bg", "--mythic-color-table-header"],
    ["--mythic-theme-typography-font-family-mono", "--mythic-foundation-typography-family-monospace"],
    ["--mythic-theme-typography-font-family-monospace", "--mythic-foundation-typography-family-monospace"],
    ["--mythic-theme-workspace-muted-bg", "--mythic-color-application-muted"],
]);

const walk = (directory, results = []) => {
    fs.readdirSync(directory, {withFileTypes: true}).forEach((entry) => {
        const entryPath = path.join(directory, entry.name);
        if(entry.isDirectory()){
            walk(entryPath, results);
        }else if(/\.(?:css|js|jsx|ts|tsx)$/.test(entryPath)){
            results.push(entryPath);
        }
    });
    return results;
};

const files = walk(sourceRoot);
let changedFiles = 0;
let replacedReferences = 0;
files.forEach((filePath) => {
    const original = fs.readFileSync(filePath, "utf8");
    let source = original;
    replacements.forEach((canonical, compatibility) => {
        if(filePath === compatibilityVariablePath){
            const escaped = compatibility.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const definition = new RegExp(`^\\s*"${escaped}":.*\\n`, "m");
            if(definition.test(source)){
                source = source.replace(definition, "");
                replacedReferences += 1;
            }
            return;
        }
        const occurrences = source.split(compatibility).length - 1;
        if(occurrences > 0){
            source = source.replaceAll(compatibility, canonical);
            replacedReferences += occurrences;
        }
    });
    if(filePath === compatibilityVariablePath){
        source = source.replace(/^\s*"--mythic-theme-palette-[^"]+":.*\n/gm, "");
    }else{
        const paletteOccurrences = source.match(/--mythic-theme-palette-/g)?.length || 0;
        source = source.replaceAll("--mythic-theme-palette-", "--mythic-palette-");
        replacedReferences += paletteOccurrences;
    }
    const genericThemeOccurrences = source.match(/--mythic-theme-/g)?.length || 0;
    source = source.replaceAll("--mythic-theme-", "--mythic-effect-");
    replacedReferences += genericThemeOccurrences;
    if(source !== original){
        changedFiles += 1;
        if(write){
            fs.writeFileSync(filePath, source);
        }
    }
});

console.log(`${write ? "Canonicalized" : "Would canonicalize"} ${replacedReferences} token references in ${changedFiles} files.`);
if(!write && changedFiles > 0){
    process.exitCode = 1;
}
