#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");

const projectRoot = path.resolve(__dirname, "..");
const sourcePath = path.join(projectRoot, "src", "components", "Chat", "ChatExperience.js");
const graphqlPath = path.join(projectRoot, "src", "components", "Chat", "ChatGraphql.js");
const write = process.argv.includes("--write");
const source = fs.readFileSync(sourcePath, "utf8");
const ast = parser.parse(source, {sourceType: "module", plugins: ["jsx"]});
const declarations = ast.program.body.filter((statement) => statement.type === "VariableDeclaration"
    && statement.declarations.length > 0
    && statement.declarations.every((declaration) => declaration.id.type === "Identifier"
        && declaration.init?.type === "TaggedTemplateExpression"
        && declaration.init.tag.type === "Identifier"
        && declaration.init.tag.name === "gql"));

if(declarations.length === 0){
    console.log("Chat GraphQL extraction is already complete.");
    process.exit(0);
}

const names = declarations.flatMap((statement) => statement.declarations.map((declaration) => declaration.id.name));
const graphqlSource = [
    'import {gql} from "@apollo/client";',
    "",
    ...declarations.map((statement) => source.slice(statement.start, statement.end).replace(/^const\s+/, "export const ")),
    "",
].join("\n");
let nextSource = source;
[...declarations].sort((left, right) => right.start - left.start).forEach((statement) => {
    let end = statement.end;
    while(nextSource[end] === "\n"){
        end += 1;
    }
    nextSource = `${nextSource.slice(0, statement.start)}${nextSource.slice(end)}`;
});
nextSource = nextSource.replace(
    "import { gql, useApolloClient, useLazyQuery, useMutation, useQuery, useSubscription } from '@apollo/client';",
    "import { useApolloClient, useLazyQuery, useMutation, useQuery, useSubscription } from '@apollo/client';",
);
const importLine = `import {${names.join(", ")}} from "./ChatGraphql";\n`;
const importAnchor = 'import { getChatMessagePageInfo, getChatMessagePageVariables, getProgressivelyVisibleRows, mergeRowsByID } from "./ChatStreamUtils";\n';
nextSource = nextSource.replace(importAnchor, `${importAnchor}${importLine}`);

console.log(`${write ? "Extracted" : "Would extract"} ${names.length} Chat GraphQL operations into ChatGraphql.js.`);
if(write){
    fs.writeFileSync(graphqlPath, graphqlSource);
    fs.writeFileSync(sourcePath, nextSource);
}else{
    process.exitCode = 1;
}
