#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const postcss = require("postcss");

const projectRoot = path.resolve(__dirname, "..");
const sourceRoot = path.join(projectRoot, "src");
const query = process.argv.slice(2).join(" ").trim();

if(!query){
    console.error("Usage: npm run style:trace -- <component|class|token|file>");
    process.exit(1);
}

const normalizedQuery = query.replace(/^\./, "");
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
const relative = (filePath) => path.relative(projectRoot, filePath);
const lineNumberAt = (source, index) => source.slice(0, index).split("\n").length;
const tokenPattern = /--mythic-[a-zA-Z0-9_-]+/g;
const javascriptFiles = walk(sourceRoot, (filePath) => /\.[jt]sx?$/.test(filePath));
const cssFiles = walk(sourceRoot, (filePath) => filePath.endsWith(".css"));
const results = [];
const relatedTokens = new Set();

javascriptFiles.forEach((filePath) => {
    const source = fs.readFileSync(filePath, "utf8");
    source.split("\n").forEach((line, index) => {
        if(line.includes(query) || line.includes(normalizedQuery)){
            const components = [...line.matchAll(/data-mythic-component=["'{]+([^"'}]+)/g)].map((match) => match[1]);
            const variants = [...line.matchAll(/data-(tone|density|selected|disabled|interactive)=["'{]+([^"'}]+)/g)]
                .map((match) => `${match[1]}=${match[2]}`);
            results.push({
                kind: "JSX owner",
                location: `${relative(filePath)}:${index + 1}`,
                detail: [...components.map((name) => `component=${name}`), ...variants].join(", ") || line.trim().slice(0, 180),
            });
        }
    });
});

cssFiles.forEach((filePath) => {
    const source = fs.readFileSync(filePath, "utf8");
    let root;
    try{
        root = postcss.parse(source, {from: filePath});
    }catch(error){
        return;
    }
    root.walkRules((rule) => {
        const declarations = rule.nodes.filter((node) => node.type === "decl");
        const declarationText = declarations.map((node) => `${node.prop}: ${node.value}`).join("; ");
        const matches = rule.selector.includes(query)
            || rule.selector.includes(normalizedQuery)
            || declarationText.includes(query)
            || declarationText.includes(normalizedQuery);
        if(!matches){
            return;
        }
        [...declarationText.matchAll(tokenPattern)].forEach((match) => relatedTokens.add(match[0]));
        results.push({
            kind: filePath.endsWith(".module.css") ? "CSS Module" : "CSS owner",
            location: `${relative(filePath)}:${lineNumberAt(source, rule.source.start.offset)}`,
            detail: `${rule.selector} { ${declarationText} }`.slice(0, 500),
        });
    });
});

const appearanceSource = fs.readFileSync(path.join(sourceRoot, "themes", "appearance.js"), "utf8");
const appearanceFieldPattern = /colorField\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']/g;
[...appearanceSource.matchAll(appearanceFieldPattern)].forEach((match) => {
    const cssToken = `--mythic-color-${match[1].replaceAll(".", "-")}`;
    if(query === cssToken || normalizedQuery === cssToken.replace(/^--/, "")
        || query.includes(match[1]) || match[2].toLowerCase().includes(query.toLowerCase())
        || relatedTokens.has(cssToken)){
        results.push({
            kind: "Appearance setting",
            location: `src/themes/appearance.js:${lineNumberAt(appearanceSource, match.index)}`,
            detail: `appearance.colors.${match[1]} → ${cssToken} → “${match[2]}”`,
        });
    }
});

const themePath = path.join(sourceRoot, "themes", "createMythicTheme.js");
const themeSource = fs.readFileSync(themePath, "utf8");
themeSource.split("\n").forEach((line, index) => {
    if(line.includes(query) || line.includes(normalizedQuery)
        || [...relatedTokens].some((token) => line.includes(token.replace(/^--mythic-/, "")))){
        results.push({kind: "Theme factory / MUI override", location: `${relative(themePath)}:${index + 1}`, detail: line.trim()});
    }
});

console.log(`Style trace: ${query}`);
if(results.length === 0){
    console.log("No styling owner found.");
    process.exitCode = 1;
}else{
    results.slice(0, 80).forEach((result) => {
        console.log(`\n${result.kind}\n  ${result.location}\n  ${result.detail}`);
    });
    if(results.length > 80){
        console.log(`\n… ${results.length - 80} more matches omitted`);
    }
}
