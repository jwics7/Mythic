import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Skeleton from "@mui/material/Skeleton";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import HourglassEmptyOutlinedIcon from "@mui/icons-material/HourglassEmptyOutlined";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import SearchOffOutlinedIcon from "@mui/icons-material/SearchOffOutlined";
import styles from "./MythicStateDisplay.module.css";

const stateIcons = {
    empty: <InboxOutlinedIcon />,
    error: <ErrorOutlineOutlinedIcon />,
    loading: <HourglassEmptyOutlinedIcon />,
    search: <SearchOffOutlinedIcon />,
};

export function MythicStateDisplay({
    action,
    actionLabel,
    compact = false,
    description,
    icon,
    loading = false,
    minHeight,
    onAction,
    severity = "empty",
    sx,
    title,
}) {
    const defaultIcon = stateIcons[severity] || stateIcons.empty;
    const iconNode = loading ? (
        <CircularProgress size={compact ? 18 : 22} color="inherit" disableShrink />
    ) : React.cloneElement(icon || defaultIcon, {fontSize: compact ? "small" : "medium"});
    const resolvedTitle = title || (loading ? "Loading" : "Nothing to show");
    const resolvedMinHeight = minHeight || (compact ? 112 : 176);
    return (
        <Box
            className={`${styles.root} mythic-justify-center mythic-align-center mythic-flex mythic-full-width`}
            data-density={compact ? "compact" : "normal"}
            data-severity={severity}
            style={{"--mythic-state-min-height": `${resolvedMinHeight}px`}}
            sx={sx}
        >
            <div className={`${styles.content} mythic-gap-sm mythic-align-center mythic-flex mythic-flex-column`}>
                <span className={`${styles.icon} mythic-justify-center mythic-inline-cluster`}>{iconNode}</span>
                <Typography className={`${styles.title} mythic-font-size-body mythic-font-weight-extra-bold mythic-line-height-snug`} component="div">{resolvedTitle}</Typography>
                {description && <Typography className={`${styles.description} mythic-font-size-small mythic-line-height-normal`} component="div">{description}</Typography>}
                {action || (actionLabel && onAction) ? (
                    action || <Button className={styles.action} size="small" variant="outlined" onClick={onAction}>{actionLabel}</Button>
                ) : null}
            </div>
        </Box>
    );
}

export function MythicEmptyState(props) {
    return <MythicStateDisplay severity="empty" {...props} />;
}

export function MythicSearchEmptyState(props) {
    return <MythicStateDisplay severity="search" title="No results" {...props} />;
}

export function MythicLoadingState(props) {
    return <MythicStateDisplay severity="loading" loading title="Loading" {...props} />;
}

export function MythicErrorState(props) {
    return <MythicStateDisplay severity="error" title="Something went wrong" {...props} />;
}

const TableStateCell = ({children, colSpan, bordered = false}) => (
    <TableCell className={bordered ? `${styles.tableCell} mythic-divider-bottom` : styles.tableCell} colSpan={colSpan}>{children}</TableCell>
);

export function MythicTableEmptyState({colSpan, ...props}) {
    return <TableRow><TableStateCell colSpan={colSpan}><MythicEmptyState {...props} /></TableStateCell></TableRow>;
}

export function MythicTableSearchEmptyState({colSpan, ...props}) {
    return <TableRow><TableStateCell colSpan={colSpan}><MythicSearchEmptyState {...props} /></TableStateCell></TableRow>;
}

export function MythicTableErrorState({colSpan, ...props}) {
    return <TableRow><TableStateCell colSpan={colSpan}><MythicErrorState {...props} /></TableStateCell></TableRow>;
}

export function MythicTableSkeletonRows({colSpan, columns = 4, rows = 4}) {
    const skeletonColumns = Math.max(1, columns);
    return (
        <>
            {[...Array(rows).keys()].map((rowIndex) => (
                <TableRow key={`mythic-table-skeleton-${rowIndex}`}>
                    <TableCell className={styles.skeletonCell} colSpan={colSpan}>
                        <div className={`${styles.skeletonGrid} mythic-gap-sm mythic-grid`} style={{"--mythic-skeleton-columns": skeletonColumns}}>
                            {[...Array(skeletonColumns).keys()].map((columnIndex) => (
                                <Skeleton
                                    animation="wave"
                                    className="mythic-border-radius"
                                    height={22}
                                    key={`mythic-table-skeleton-${rowIndex}-${columnIndex}`}
                                    variant="rounded"
                                    width={columnIndex === skeletonColumns - 1 ? "72%" : "100%"}
                                />
                            ))}
                        </div>
                    </TableCell>
                </TableRow>
            ))}
        </>
    );
}

export function MythicTableLoadingState({colSpan, columns, rows = 4, showSkeleton = true, ...props}) {
    return (
        <>
            <TableRow>
                <TableStateCell bordered={showSkeleton} colSpan={colSpan}><MythicLoadingState {...props} /></TableStateCell>
            </TableRow>
            {showSkeleton && <MythicTableSkeletonRows colSpan={colSpan} columns={columns} rows={rows} />}
        </>
    );
}
