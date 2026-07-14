import React from "react";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import {ThemeProvider} from "@mui/material/styles";
import {MythicDataTableRow} from "../../MythicComponents/MythicDataTable";
import styles from "./AppearancePreview.module.css";

export const getPreviewCssVariables = (theme, mode) => theme.generateStyleSheets().reduce((variables, sheet) => {
    Object.entries(sheet).forEach(([selector, values]) => {
        const isSharedRoot = selector.trim() === ":root";
        const isRequestedScheme = selector.includes(`data-mythic-color-scheme="${mode}"`);
        if(isSharedRoot || isRequestedScheme){
            Object.assign(variables, values);
        }
    });
    return variables;
}, {});

const StatusPreview = () => (
    <div className={`${styles.statusRow} mythic-gap-xs mythic-align-center mythic-flex mythic-wrap`}>
        <Button color="primary" variant="contained">Run</Button>
        <Chip color="success" label="Healthy" size="small" />
        <Chip color="warning" label="Waiting" size="small" />
    </div>
);

const TablePreview = () => (
    <TableContainer className={styles.tableContainer}>
        <Table aria-label="Theme table-row preview" size="small">
            <TableHead>
                <TableRow><TableCell>Callback</TableCell><TableCell>Status</TableCell></TableRow>
            </TableHead>
            <TableBody>
                <TableRow><TableCell>C-41</TableCell><TableCell>Normal</TableCell></TableRow>
                <MythicDataTableRow state="hover">
                    <TableCell>C-42</TableCell><TableCell>Hover</TableCell>
                </MythicDataTableRow>
            </TableBody>
        </Table>
    </TableContainer>
);

const PreviewContent = ({kind}) => {
    switch(kind){
        case "table":
        case "tableHover":
            return <TablePreview />;
        case "status":
            return <StatusPreview />;
        case "typography":
            return (
                <div className={`${styles.copyPreview} mythic-border-radius-sm mythic-flex mythic-flex-column`}>
                    <Typography variant="subtitle2">Primary task title</Typography>
                    <Typography color="text.secondary" variant="caption">Secondary metadata</Typography>
                    <Typography color="text.disabled" variant="caption">Unavailable action</Typography>
                </div>
            );
        case "navigation":
            return (
                <div className={`${styles.navigationPreview} mythic-font-size-caption mythic-font-weight-bold mythic-align-center mythic-border-radius-sm mythic-flex`}>
                    <span className={styles.navigationIcon}>◆</span>
                    <span>Callbacks</span>
                </div>
            );
        case "header":
        case "headerGradient":
            return <div className={`${styles.headerPreview} mythic-font-size-caption mythic-font-weight-bold mythic-align-center mythic-border-radius-sm mythic-flex`}><span>Section Header</span></div>;
        case "subtleGradient":
            return <div className={`${styles.subtleCard} mythic-font-size-xs mythic-gap-xs mythic-border-radius-sm mythic-flex mythic-flex-column`}><strong>Dashboard card</strong><span>Overview content</span></div>;
        case "chat":
            return (
                <div className={`${styles.chatPreview} mythic-gap-xs mythic-grid`}>
                    <span className={styles.otherMessage}>Other operator</span>
                    <span className={styles.selfMessage}>My message</span>
                    <code>markdown block</code>
                </div>
            );
        case "graph":
            return <div className={`${styles.graphGroup} mythic-border-radius mythic-grid`}><span>Grouped node</span></div>;
        case "chart":
            return <div className={`${styles.chart} mythic-grid`}>{Array.from({length: 10}, (_, index) => <i key={index} />)}</div>;
        case "task":
            return (
                <div className={`${styles.taskPreview} mythic-font-size-xs mythic-border-radius-sm mythic-flex mythic-flex-column`}>
                    <span className={styles.prompt}>operator@host</span>
                    <strong>shell whoami</strong>
                    <div><i /><i /><i /></div>
                </div>
            );
        case "output":
            return <pre className={`${styles.outputPreview} mythic-font-size-xs mythic-border-radius-sm`}>user\\host{"\n"}completed</pre>;
        case "file":
            return <div className={`${styles.filePreview} mythic-border-radius-sm mythic-flex mythic-flex-column`}><span>▰ Folder with files</span><span>▱ Empty folder</span></div>;
        case "surface":
        default:
            return (
                <div className={`${styles.surfacePreview} mythic-border-radius-sm mythic-flex mythic-flex-column`}>
                    <strong>Panel title</strong>
                    <span>Primary content</span>
                    <small>Supporting metadata</small>
                </div>
            );
    }
};

const AppearanceModePreview = ({mode, kind, theme}) => {
    const variables = React.useMemo(() => getPreviewCssVariables(theme, mode), [mode, theme]);
    return (
        <ThemeProvider theme={theme} disableStyleSheetGeneration forceThemeRerender={false}>
            <div
                className={`${styles.modePreview} mythic-border-radius mythic-min-width-0 mythic-overflow-hidden`}
                data-mythic-color-scheme={mode}
                style={{...variables, colorScheme: mode}}
            >
                <span className={`${styles.modeLabel} mythic-block mythic-font-size-xs mythic-font-weight-bold mythic-uppercase`}>{mode}</span>
                <PreviewContent kind={kind} />
            </div>
        </ThemeProvider>
    );
};

export const AppearancePreview = React.memo(function AppearancePreview({theme, kind}) {
    return (
        <div className={`${styles.previewPair} mythic-gap-sm mythic-grid mythic-min-width-0`}>
            <AppearanceModePreview mode="dark" kind={kind} theme={theme} />
            <AppearanceModePreview mode="light" kind={kind} theme={theme} />
        </div>
    );
});
