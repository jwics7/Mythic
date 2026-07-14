#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const postcss = require("postcss");

const projectRoot = path.resolve(__dirname, "..");
const legacyPath = path.join(projectRoot, "src", "themes", "LegacyGlobalStyles.css");
const familyDirectory = path.join(projectRoot, "src", "styles", "families");
const write = process.argv.includes("--write");

if(!fs.existsSync(legacyPath)){
    console.log("LegacyGlobalStyles.css has already been extracted into owned style families.");
    process.exit(0);
}

const prefixFamily = new Map(Object.entries({
    eventing: "Eventing",
    c2: "Operations",
    callback: "Operations",
    file: "Operations",
    graph: "Operations",
    interactive: "Operations",
    link: "Operations",
    response: "Operations",
    single: "Operations",
    task: "Operations",
    tasking: "Operations",
    tree: "Operations",
    credential: "Search",
    json: "Search",
    process: "Search",
    search: "Search",
    dashboard: "Dashboard",
    api: "CreationAndServices",
    browser: "CreationAndServices",
    create: "CreationAndServices",
    installed: "CreationAndServices",
    parameter: "CreationAndServices",
    service: "CreationAndServices",
}));
const families = ["Eventing", "Operations", "Search", "Dashboard", "CreationAndServices", "Shared"];
const roots = new Map(families.map((family) => [family, postcss.root()]));
const atRuleCache = new Map();
const familyForSelector = (selector) => {
    const prefixes = [...selector.matchAll(/\.mythic-([a-zA-Z0-9]+)/g)].map((match) => match[1]);
    if(prefixes.length === 0){
        return "Shared";
    }
    const owners = new Set(prefixes.map((prefix) => prefixFamily.get(prefix) || "Shared"));
    return owners.size === 1 ? [...owners][0] : "Shared";
};
const globalizeSelector = (selector) => selector.replace(/(?<!:global\()\.([a-zA-Z_][\w-]*)/g, ":global(.$1)");
const targetParent = (family, rule) => {
    const ancestors = [];
    for(let parent = rule.parent; parent && parent.type !== "root"; parent = parent.parent){
        if(parent.type === "atrule"){
            ancestors.unshift({name: parent.name, params: parent.params});
        }
    }
    let target = roots.get(family);
    let key = family;
    ancestors.forEach(({name, params}) => {
        key += `|${name}:${params}`;
        if(!atRuleCache.has(key)){
            const atRule = postcss.atRule({name, params});
            target.append(atRule);
            atRuleCache.set(key, atRule);
        }
        target = atRuleCache.get(key);
    });
    return target;
};

const legacyRoot = postcss.parse(fs.readFileSync(legacyPath, "utf8"), {from: legacyPath});
let extractedRules = 0;
legacyRoot.walkRules((rule) => {
    // Nested rules travel with their owning rule clone. Cloning them again would
    // produce orphaned `&` blocks in the extracted family.
    if (rule.parent?.type === "rule") {
        return;
    }
    const selectorFamilies = new Set(rule.selectors.map(familyForSelector));
    const family = selectorFamilies.size === 1 ? [...selectorFamilies][0] : "Shared";
    const clone = rule.clone({selector: rule.selectors.map(globalizeSelector).join(",\n")});
    targetParent(family, rule).append(clone);
    extractedRules += 1;
});

console.log(`${write ? "Extracted" : "Would extract"} ${extractedRules} rules into ${families.length} cohesive style families.`);
if(write){
    fs.mkdirSync(familyDirectory, {recursive: true});
    families.forEach((family) => {
        const banner = `/* ${family} visual family. Global selectors are scoped here during the final owner migration. */\n\n`;
        fs.writeFileSync(path.join(familyDirectory, `${family}Family.module.css`), `${banner}${roots.get(family).toString().trim()}\n`);
    });
    fs.unlinkSync(legacyPath);
}else{
    process.exitCode = 1;
}
