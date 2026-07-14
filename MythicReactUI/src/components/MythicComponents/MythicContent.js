import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import {MythicCluster, MythicStack} from "./MythicLayout";
import styles from "./MythicContent.module.css";

const joinClasses = (...classes) => classes.filter(Boolean).join(" ");

const textPresetClasses = {
    title: "mythic-font-size-body-small mythic-font-weight-heavy mythic-line-height-tight mythic-text-primary",
    label: "mythic-font-size-caption mythic-font-weight-heavy mythic-line-height-tight mythic-text-secondary",
    supporting: "mythic-font-size-caption mythic-font-weight-medium mythic-line-height-normal mythic-text-secondary",
    "section-title": "mythic-font-size-body-small mythic-font-weight-bold mythic-line-height-snug mythic-text-primary",
    "compact-title": "mythic-font-size-small mythic-font-weight-heavy mythic-line-height-tight mythic-text-primary",
    eyebrow: "mythic-font-size-xs mythic-font-weight-extra-bold mythic-letter-spacing-reset mythic-text-secondary",
    caption: "mythic-font-size-xs mythic-font-weight-medium mythic-line-height-normal mythic-text-secondary",
    "item-title": "mythic-break-anywhere mythic-font-size-small mythic-font-weight-extra-bold mythic-line-height-snug mythic-min-width-0 mythic-text-primary",
    value: "mythic-break-anywhere mythic-font-size-small mythic-font-weight-strong mythic-line-height-normal mythic-min-width-0 mythic-text-primary",
    "body-copy": "mythic-break-anywhere mythic-font-size-small mythic-line-height-normal mythic-pre-wrap mythic-text-primary",
    "secondary-copy": "mythic-break-anywhere mythic-font-size-small mythic-pre-wrap mythic-text-secondary",
    "compact-heading": "mythic-font-size-caption mythic-font-weight-heavy mythic-line-height-tight mythic-text-primary",
    "micro-supporting": "mythic-font-size-xs mythic-font-weight-medium mythic-line-height-snug mythic-text-secondary",
    "large-title": "mythic-break-anywhere mythic-font-size-body mythic-font-weight-extra-bold mythic-line-height-snug mythic-min-width-0 mythic-text-primary",
};

export const MythicText = React.forwardRef(function MythicText({
    breakAnywhere = false,
    children,
    className,
    component = "div",
    lineHeight,
    preset = "supporting",
    ...props
}, ref) {
    return (
        <Box
            {...props}
            ref={ref}
            component={component}
            data-mythic-component="text"
            data-break-anywhere={breakAnywhere}
            data-line-height={lineHeight}
            data-preset={preset}
            className={joinClasses(
                textPresetClasses[preset] || textPresetClasses.supporting,
                breakAnywhere && "mythic-break-anywhere",
                lineHeight === "normal" && "mythic-line-height-normal",
                className,
            )}
        >
            {children}
        </Box>
    );
});

export const MythicPanel = React.forwardRef(function MythicPanel({
    children,
    className,
    component = "section",
    "data-mythic-component": componentName = "panel",
    density = "comfortable",
    fill = false,
    gap,
    interactive = false,
    layout = "block",
    overflow = "visible",
    radius = "md",
    tone = "surface",
    ...props
}, ref) {
    return (
        <Box
            {...props}
            ref={ref}
            component={component}
            data-mythic-component={componentName}
            data-density={density}
            data-interactive={interactive}
            data-layout={layout}
            data-overflow={overflow}
            data-tone={tone}
            className={joinClasses(
                "mythic-border",
                radius === "sm" ? "mythic-border-radius-sm" : radius === "lg" ? "mythic-border-radius-lg" : "mythic-border-radius",
                layout === "stack" && "mythic-stack",
                layout === "cluster" && "mythic-cluster",
                gap === "xs" && "mythic-gap-xs",
                gap === "sm" && "mythic-gap-sm",
                gap === "md" && "mythic-gap-md",
                "mythic-min-width-0",
                fill && "mythic-fill",
                overflow === "hidden" && "mythic-overflow-hidden",
                overflow === "auto" && "mythic-overflow-auto",
                styles.panel,
                className,
            )}
        >
            {children}
        </Box>
    );
});

export const MythicToolbar = React.forwardRef(function MythicToolbar({
    children,
    className,
    component = "div",
    density = "comfortable",
    ...props
}, ref) {
    return (
        <MythicCluster
            {...props}
            ref={ref}
            component={component}
            gap="sm"
            justify="between"
            wrap={false}
            data-mythic-component="toolbar"
            data-density={density}
            className={joinClasses(styles.toolbar, className)}
        >
            {children}
        </MythicCluster>
    );
});

export const MythicActionGroup = React.forwardRef(function MythicActionGroup({children, className, ...props}, ref) {
    return (
        <MythicCluster
            {...props}
            ref={ref}
            gap="xs"
            justify="end"
            wrap={false}
            data-mythic-component="action-group"
            className={joinClasses(styles.actionGroup, className)}
        >
            {children}
        </MythicCluster>
    );
});

export const MythicActionButton = React.forwardRef(function MythicActionButton({
    children,
    className,
    emphasis = "hover",
    iconOnly = false,
    tone = "neutral",
    ...props
}, ref) {
    const Component = iconOnly ? IconButton : Button;
    return (
        <Component
            {...props}
            ref={ref}
            data-mythic-component="action-button"
            data-emphasis={emphasis}
            data-icon-only={iconOnly}
            data-tone={tone}
            className={joinClasses(styles.actionButton, className)}
        >
            {children}
        </Component>
    );
});

export const MythicListRow = React.forwardRef(function MythicListRow({
    children,
    className,
    component = "div",
    disabled = false,
    interactive = false,
    selected = false,
    ...props
}, ref) {
    return (
        <Box
            {...props}
            ref={ref}
            component={component}
            data-mythic-component="list-row"
            data-disabled={disabled}
            data-interactive={interactive}
            data-selected={selected}
            className={joinClasses("mythic-border-radius", styles.listRow, className)}
        >
            {children}
        </Box>
    );
});

export const MythicMetadataList = React.forwardRef(function MythicMetadataList({children, className, layout = "grid", ...props}, ref) {
    return (
        <Box
            {...props}
            ref={ref}
            component="div"
            data-mythic-component="metadata-list"
            data-layout={layout}
            className={joinClasses(layout === "grid" && "mythic-grid mythic-gap-sm", styles.metadataList, className)}
        >
            {children}
        </Box>
    );
});

export const MythicMetadataItem = React.forwardRef(function MythicMetadataItem({children, className, density = "normal", label, layout = "stack", value, ...props}, ref) {
    return (
        <Box
            {...props}
            ref={ref}
            component="div"
            data-mythic-component="metadata-item"
            data-density={density}
            data-layout={layout}
            className={joinClasses(
                "mythic-min-width-0",
                layout === "inline" && "mythic-flex mythic-align-center mythic-wrap mythic-gap-xs",
                styles.metadataItem,
                className,
            )}
        >
            <MythicMetadataLabel size={density === "compact" ? "xs" : "caption"}>{label}</MythicMetadataLabel>
            <MythicMetadataValue component="div">{value ?? children}</MythicMetadataValue>
        </Box>
    );
});

export const MythicMetadataLabel = React.forwardRef(function MythicMetadataLabel({
    children,
    className,
    component = "span",
    size = "caption",
    ...props
}, ref) {
    return (
        <Box
            {...props}
            ref={ref}
            component={component}
            data-mythic-component="metadata-label"
            data-size={size}
            className={joinClasses(
                "mythic-text-secondary mythic-block mythic-font-weight-strong mythic-line-height-tight",
                size === "xs" ? "mythic-font-size-xs" : "mythic-font-size-caption",
                className,
            )}
        >
            {children}
        </Box>
    );
});

export const MythicMetadataValue = React.forwardRef(function MythicMetadataValue({
    children,
    className,
    component = "span",
    size = "small",
    tone = "primary",
    ...props
}, ref) {
    return (
        <Box
            {...props}
            ref={ref}
            component={component}
            data-mythic-component="metadata-value"
            data-size={size}
            data-tone={tone}
            className={joinClasses(
                "mythic-break-anywhere mythic-line-height-normal mythic-min-width-0",
                size === "caption" ? "mythic-font-size-caption" : "mythic-font-size-small",
                tone === "secondary" ? "mythic-text-secondary" : "mythic-text-primary",
                className,
            )}
        >
            {children}
        </Box>
    );
});

export const MythicCodeSurface = React.forwardRef(function MythicCodeSurface({
    children,
    className,
    component = "pre",
    density = "comfortable",
    overflow = "auto",
    size = "small",
    tone = "output",
    ...props
}, ref) {
    return (
        <Box
            {...props}
            ref={ref}
            component={component}
            data-mythic-component="code-surface"
            data-density={density}
            data-overflow={overflow}
            data-tone={tone}
            className={joinClasses(
                "mythic-border mythic-border-radius mythic-monospace mythic-pre-wrap mythic-break-anywhere mythic-block mythic-max-width-full mythic-min-width-0 mythic-text-primary",
                size === "caption" ? "mythic-font-size-caption" : "mythic-font-size-small",
                overflow === "auto" && "mythic-overflow-auto",
                overflow === "hidden" && "mythic-overflow-hidden",
                styles.codeSurface,
                className,
            )}
        >
            {children}
        </Box>
    );
});

export const MythicEmptyState = React.forwardRef(function MythicEmptyState({
    actions,
    className,
    description,
    icon,
    title,
    ...props
}, ref) {
    return (
        <MythicStack
            {...props}
            ref={ref}
            align="center"
            gap="sm"
            data-mythic-component="empty-state"
            className={joinClasses(styles.emptyState, className)}
        >
            {icon && <Box className={`${styles.emptyStateIcon} mythic-text-secondary`}>{icon}</Box>}
            {title && <Typography className="mythic-text-primary mythic-font-weight-bold">{title}</Typography>}
            {description && <Typography className="mythic-text-secondary mythic-font-size-small">{description}</Typography>}
            {actions && <MythicActionGroup>{actions}</MythicActionGroup>}
        </MythicStack>
    );
});

export const MythicSectionHeading = React.forwardRef(function MythicSectionHeading({
    children,
    className,
    component = "div",
    ...props
}, ref) {
    return (
        <Typography
            {...props}
            ref={ref}
            component={component}
            data-mythic-component="section-heading"
            className={joinClasses(
                "mythic-font-size-body-small mythic-font-weight-extra-bold mythic-line-height-snug mythic-text-primary",
                className,
            )}
        >
            {children}
        </Typography>
    );
});

export const MythicSectionDescription = React.forwardRef(function MythicSectionDescription({
    children,
    className,
    component = "div",
    ...props
}, ref) {
    return (
        <Typography
            {...props}
            ref={ref}
            component={component}
            data-mythic-component="section-description"
            className={joinClasses(
                "mythic-font-size-small mythic-line-height-normal mythic-text-secondary",
                className,
            )}
        >
            {children}
        </Typography>
    );
});
