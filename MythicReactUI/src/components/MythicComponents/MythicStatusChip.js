import React from 'react';
import Chip from '@mui/material/Chip';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import TimelapseIcon from '@mui/icons-material/Timelapse';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import BlockIcon from '@mui/icons-material/Block';
import HideSourceIcon from '@mui/icons-material/HideSource';
import styles from './MythicStatusChip.module.css';

const statusConfig = {
    success: {palette: "success", icon: <CheckCircleOutlineIcon />, label: "Success"},
    error: {palette: "error", icon: <ErrorOutlineIcon />, label: "Error"},
    warning: {palette: "warning", icon: <WarningAmberIcon />, label: "Warning"},
    info: {palette: "info", icon: <InfoOutlinedIcon />, label: "Info"},
    active: {palette: "success", icon: <RadioButtonCheckedIcon />, label: "Active"},
    inactive: {palette: "error", icon: <RadioButtonUncheckedIcon />, label: "Inactive"},
    deleted: {palette: "error", icon: <DeleteOutlineIcon />, label: "Deleted"},
    locked: {palette: "warning", icon: <LockOutlinedIcon />, label: "Locked"},
    building: {palette: "info", icon: <TimelapseIcon />, label: "Building"},
    completed: {palette: "success", icon: <DoneAllIcon />, label: "Completed"},
    blocked: {palette: "error", icon: <BlockIcon />, label: "Blocked"},
    skipped: {palette: "secondary", icon: <HideSourceIcon />, label: "Skipped"},
    neutral: {palette: "secondary", icon: <InfoOutlinedIcon />, label: "Status"},
};

export function getMythicStatusConfig(status) {
    return statusConfig[status] || statusConfig.neutral;
}

export function getMythicStatusFromTaskStatus(status) {
    const normalized = `${status || ""}`.toLowerCase();
    if(normalized.includes("error") || normalized.includes("failed")){
        return "error";
    }
    if(normalized.includes("warning")){
        return "warning";
    }
    if(normalized.includes("success") || normalized.includes("completed")){
        return "success";
    }
    if(normalized.includes("processing") || normalized.includes("building")){
        return "building";
    }
    return "info";
}

export function MythicStatusChip({
    label,
    status = "neutral",
    icon,
    showIcon = true,
    size = "small",
    variant = "soft",
    className = "",
    ...props
}) {
    const config = getMythicStatusConfig(status);
    const chipIcon = showIcon ? (icon || config.icon) : undefined;
    const tone = ["success", "error", "warning", "info"].includes(config.palette) ? config.palette : "neutral";
    const normalizedSize = size === "small" ? "small" : size;

    return (
        <Chip
            label={label || config.label}
            icon={chipIcon}
            size={normalizedSize === "compact" ? "small" : normalizedSize}
            variant="outlined"
            data-mythic-component="status-chip"
            data-size={normalizedSize}
            data-tone={tone}
            data-variant={variant}
            className={`${styles.root} mythic-font-size-caption mythic-font-weight-bold mythic-letter-spacing-reset mythic-max-width-full${className ? ` ${className}` : ""}`}
            {...props}
        />
    );
}
