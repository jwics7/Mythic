#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");

const projectRoot = path.resolve(__dirname, "..");
const sourcePath = path.join(projectRoot, "src", "components", "Chat", "ChatExperience.js");
const messagesPath = path.join(projectRoot, "src", "components", "Chat", "ChatMessages.js");
const write = process.argv.includes("--write");
const source = fs.readFileSync(sourcePath, "utf8");
const ast = parser.parse(source, {sourceType: "module", plugins: ["jsx"]});
const firstNode = ast.program.body.find((statement) => statement.type === "VariableDeclaration"
    && statement.declarations.some((declaration) => declaration.id?.name === "MarkdownMessage"));

if(!firstNode){
    console.log("Chat message-component extraction is already complete.");
    process.exit(0);
}

const tail = source.slice(firstNode.start).trim();
const header = `import {useMythicTheme} from "../../themes/MythicThemeProvider";
import React, {useState} from "react";
import ReactMarkdown from "react-markdown";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SmartToyTwoToneIcon from "@mui/icons-material/SmartToyTwoTone";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {findIconDefinition} from "@fortawesome/fontawesome-svg-core";
import {MythicStyledTooltip} from "../MythicComponents/MythicStyledTooltip";
import {snackActions} from "../utilities/Snackbar";
import {markdownPlugins} from "../utilities/Markdown";
import {markdownComponents} from "../utilities/MarkdownComponents";
import {getIconName} from "../utilities/IconName";
import {formatChatTimestamp as formatTimestamp, jsonTextForChatConfigValue as jsonTextForConfigValue} from "./ChatFormatters";
import pageStyles from "./ChatPage.module.css";
import channelStyles from "./ChatChannelView.module.css";
import adapterStyles from "./ChatContentAdapter.module.css";

const CHAT_STYLE_MAP = {...pageStyles, ...channelStyles, ...adapterStyles};
const chatClasses = (value = "") => String(value).split(/\\s+/).filter(Boolean)
    .map((className) => CHAT_STYLE_MAP[className] || className).join(" ");

`;
const nextSource = `${source.slice(0, firstNode.start).trimEnd()}\n`;
const importAnchor = 'import { getChatMessagePageInfo, getChatMessagePageVariables, getProgressivelyVisibleRows, mergeRowsByID } from "./ChatStreamUtils";\n';
const withImport = nextSource.replace(importAnchor, `${importAnchor}import {MessageBubble} from "./ChatMessages";\n`);

console.log(`${write ? "Extracted" : "Would extract"} the Chat message, event, delegation, and tool-output component family.`);
if(write){
    fs.writeFileSync(messagesPath, `${header}${tail}\n`);
    fs.writeFileSync(sourcePath, withImport);
}else{
    process.exitCode = 1;
}
