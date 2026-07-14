#!/usr/bin/env node

const path = require("path");
const childProcess = require("child_process");

const forwardedArguments = process.argv.slice(2);
const scripts = ["migrate-module-primitives.js"];

for(const script of scripts){
    const result = childProcess.spawnSync(process.execPath, [path.join(__dirname, script), ...forwardedArguments], {
        cwd: path.resolve(__dirname, ".."),
        stdio: "inherit",
    });
    if(result.status !== 0){
        process.exit(result.status || 1);
    }
}
