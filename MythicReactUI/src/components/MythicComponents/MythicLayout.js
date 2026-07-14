import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import styles from "./MythicLayout.module.css";

const joinClasses = (...classes) => classes.filter(Boolean).join(" ");
const gapClass = {
    none: undefined,
    xs: "mythic-gap-xs",
    sm: "mythic-gap-sm",
    md: "mythic-gap-md",
};
const alignClass = {
    start: "mythic-align-start",
    center: "mythic-align-center",
    stretch: "mythic-align-stretch",
};
const justifyClass = {
    start: "mythic-justify-start",
    center: "mythic-justify-center",
    end: "mythic-justify-end",
    between: "mythic-justify-between",
};

export const MythicStack = React.forwardRef(function MythicStack({
    align,
    children,
    className,
    component = "div",
    "data-mythic-component": componentName = "stack",
    fill = false,
    fullSize = false,
    gap = "sm",
    overflow = "visible",
    position = "static",
    scroll = false,
    ...props
}, ref) {
    return (
        <Box
            {...props}
            ref={ref}
            component={component}
            data-mythic-component={componentName}
            data-gap={gap}
            data-fill={fill || undefined}
            data-full-size={fullSize || undefined}
            data-overflow={overflow}
            data-position={position}
            data-scroll={scroll || undefined}
            className={joinClasses(
                "mythic-stack",
                "mythic-min-width-0",
                gapClass[gap],
                alignClass[align],
                fill && "mythic-fill",
                fullSize && "mythic-full-height",
                fullSize && "mythic-full-width",
                fullSize && "mythic-min-height-0",
                overflow === "hidden" && "mythic-overflow-hidden",
                overflow === "auto" && "mythic-overflow-auto",
                position === "relative" && "mythic-relative",
                scroll && "mythic-scroll-region",
                className,
            )}
        >
            {children}
        </Box>
    );
});

export const MythicCluster = React.forwardRef(function MythicCluster({
    align = "center",
    children,
    className,
    component = "div",
    "data-mythic-component": componentName = "cluster",
    fill = false,
    gap = "xs",
    inline = false,
    justify = "start",
    wrap = true,
    ...props
}, ref) {
    return (
        <Box
            {...props}
            ref={ref}
            component={component}
            data-mythic-component={componentName}
            data-gap={gap}
            data-inline={inline || undefined}
            data-wrap={wrap || undefined}
            className={joinClasses(
                inline ? "mythic-inline-cluster" : "mythic-flex",
                "mythic-min-width-0",
                !inline && alignClass[align],
                justifyClass[justify],
                wrap && "mythic-wrap",
                gapClass[gap],
                fill && "mythic-flex-fill",
                className,
            )}
        >
            {children}
        </Box>
    );
});

export const MythicGrid = React.forwardRef(function MythicGrid({
    children,
    className,
    columns = "auto",
    component = "div",
    gap = "sm",
    minWidth = "form",
    ...props
}, ref) {
    const ownsTemplate = columns !== "custom";
    return (
        <Box
            {...props}
            ref={ref}
            component={component}
            data-mythic-component="grid"
            data-columns={columns}
            data-min-width={minWidth}
            className={joinClasses("mythic-grid", gapClass[gap], ownsTemplate && styles.grid, className)}
        >
            {children}
        </Box>
    );
});

export const MythicScrollRegion = React.forwardRef(function MythicScrollRegion({
    children,
    className,
    component = "div",
    ...props
}, ref) {
    return (
        <Box
            {...props}
            ref={ref}
            component={component}
            data-mythic-component="scroll-region"
            className={joinClasses("mythic-scroll-region", styles.scrollRegion, className)}
        >
            {children}
        </Box>
    );
});

export const MythicTruncatedText = React.forwardRef(function MythicTruncatedText({
    children,
    className,
    component = "span",
    lines = 1,
    title,
    variant,
    ...props
}, ref) {
    const Component = variant ? Typography : Box;
    return (
        <Component
            {...props}
            ref={ref}
            component={component}
            variant={variant}
            title={title ?? (typeof children === "string" ? children : undefined)}
            data-mythic-component="truncated-text"
            data-lines={lines}
            className={joinClasses(lines === 1 && "mythic-truncate", styles.truncatedText, className)}
        >
            {children}
        </Component>
    );
});
