import React from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Select from '@mui/material/Select';
import ToggleButton from '@mui/material/ToggleButton';
import Tooltip from '@mui/material/Tooltip';
import SearchIcon from '@mui/icons-material/Search';
import MythicTextField from './MythicTextField';
import {MythicActionButton} from "./MythicContent";

export const MythicTableToolbar = ({children, className = "", style = {}, variant}) => {
    return (
        <Box className={`mythic-table-toolbar mythic-gap-sm mythic-flex mythic-border-radius mythic-border mythic-full-width mythic-surface-muted mythic-wrap mythic-flex-fixed ${variant ? `mythic-flex mythic-border-radius mythic-border mythic-full-width mythic-surface-muted mythic-wrap mythic-flex-fixed mythic-table-toolbar-${variant}` : ""} ${className}`.trim()} style={style}>
            {children}
        </Box>
    );
};

export const MythicTableToolbarGroup = ({children, grow = false, label, className = "", style = {}}) => {
    return (
        <Box className={`mythic-table-toolbar-group mythic-gap-sm mythic-max-width-full mythic-flex mythic-align-center mythic-wrap ${grow ? "mythic-table-toolbar-group-grow" : ""} ${className}`.trim()} style={style}>
            {label &&
                <span className="mythic-table-toolbar-group-label mythic-font-size-xs mythic-font-weight-extra-bold mythic-line-height-compact mythic-text-secondary">{label}</span>
            }
            {children}
        </Box>
    );
};

export const MythicToolbarSelect = ({children, className = "", style = {}, ...props}) => {
    return (
        <Select
            className={`mythic-toolbar-select mythic-full-width ${className}`.trim()}
            size="small"
            style={style}
            {...props}
        >
            {children}
        </Select>
    );
};

export const MythicSearchField = ({
    value,
    onChange,
    onEnter,
    onSearch,
    disabled = false,
    placeholder = "Search...",
    name = "Search",
    showLabel = false,
    autoFocus,
    inputProps = {},
    endAdornment = null,
}) => {
    return (
        <MythicTextField
            disabled={disabled}
            placeholder={placeholder}
            value={value}
            marginTop="0px"
            marginBottom="0px"
            showLabel={showLabel}
            onChange={onChange}
            onEnter={onEnter || onSearch}
            name={name}
            autoFocus={autoFocus}
            InputProps={{
                endAdornment: onSearch ? (
                    <React.Fragment>
                        {endAdornment}
                        <Tooltip title="Search">
                            <span>
                                <IconButton
                                    className="mythic-toolbar-icon-button mythic-text-secondary"
                                    disabled={disabled}
                                    onClick={onSearch}
                                    size="small"
                                >
                                    <SearchIcon fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </React.Fragment>
                ) : endAdornment,
                style: {padding: 0},
                ...inputProps,
            }}
        />
    );
};

export const MythicToolbarButton = ({children, className = "", tone = "neutral", ...props}) => {
    return (
        <MythicActionButton className={`mythic-toolbar-button mythic-nowrap ${className}`.trim()} tone={tone} size="small" {...props}>
            {children}
        </MythicActionButton>
    );
};

export const MythicToolbarToggle = ({
    checked,
    onClick,
    label,
    activeLabel,
    inactiveLabel,
    activeIcon,
    inactiveIcon,
    value = "toggle",
    className = "",
    ...props
}) => {
    return (
        <ToggleButton
            className={`mythic-toolbar-toggle mythic-gap-xs mythic-nowrap mythic-border mythic-border-radius mythic-text-secondary ${className}`.trim()}
            value={value}
            selected={checked}
            onClick={onClick}
            size="small"
            {...props}
        >
            {checked ? activeIcon : inactiveIcon}
            <span>{checked ? (activeLabel || label) : (inactiveLabel || label)}</span>
        </ToggleButton>
    );
};
