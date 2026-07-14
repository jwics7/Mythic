#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const sourceRoot = path.resolve(__dirname, "..", "src");
let removed = 0;
const redundantPatterns = [
    /\s+style=\{\{\s*["']?wordBreak["']?\s*:\s*["']break-all["']\s*\}\}/g,
    /\s+style=\{\{\s*["']?overflowWrap["']?\s*:\s*["']break-word["']\s*\}\}/g,
    /\s+style=\{\{\s*["']?paddingRight["']?\s*:\s*["']5px["']\s*\}\}/g,
    /\s+style=\{\{\s*\}\}/g,
];

const semanticPatterns = [
    {
        pattern: /\s+style=\{\{\s*zIndex\s*:\s*2\s*,\s*position\s*:\s*["']absolute["']\s*,?\s*\}\}/g,
        replacement: ' className="mythic-local-backdrop"',
    },
    {
        pattern: /\s+style=\{\{\s*textAlign\s*:\s*["']center["']\s*\}\}/g,
        replacement: ' align="center"',
    },
];

const walk = (directory) => fs.readdirSync(directory, {withFileTypes: true}).forEach((entry) => {
    const entryPath = path.join(directory, entry.name);
    if(entry.isDirectory()){
        walk(entryPath);
        return;
    }
    if(!/\.[jt]sx?$/.test(entryPath)){
        return;
    }
    const source = fs.readFileSync(entryPath, "utf8");
    let nextSource = redundantPatterns.reduce((currentSource, pattern) => currentSource.replace(pattern, () => {
            removed += 1;
            return "";
        }), source);
    nextSource = semanticPatterns.reduce((currentSource, {pattern, replacement}) => currentSource.replace(pattern, () => {
        removed += 1;
        return replacement;
    }), nextSource);
    if(nextSource !== source){
        fs.writeFileSync(entryPath, nextSource);
    }
});

walk(sourceRoot);
console.log(`Removed ${removed} redundant static style sites now owned by central component defaults.`);
