import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import {MythicCluster, MythicStack} from "./MythicLayout";
import styles from "./MythicPageHeader.module.css";

const joinClasses = (...values) => values.filter(Boolean).join(" ");

export const MythicPageHeader = ({
    actions,
    children,
    className = "",
    dense = false,
    icon,
    meta,
    style,
    subtitle,
    sx,
    title,
    headerVariant = "h6",
}) => {
    const hasActionContent = actions || children;
    return (
        <Paper
            className={joinClasses(styles.root, dense && styles.dense, className)}
            data-density={dense ? "compact" : "normal"}
            elevation={0}
            style={style}
            sx={sx}
            data-mythic-component="page-header"
        >
            <MythicCluster className={styles.identity} align="start" gap="sm" wrap={false}>
                {icon && <MythicCluster className={styles.icon} component="span" inline justify="center" wrap={false}>{icon}</MythicCluster>}
                <MythicStack className={styles.copy} gap="xs">
                    <Typography className={`${styles.title} mythic-font-weight-strong mythic-letter-spacing-reset mythic-min-width-0`} variant={headerVariant}>{title}</Typography>
                    {subtitle && <Typography className={`${styles.subtitle} mythic-font-size-small mythic-font-weight-medium mythic-line-height-normal`} component="div">{subtitle}</Typography>}
                    {meta && <MythicCluster className={styles.meta} gap="xs">{meta}</MythicCluster>}
                </MythicStack>
            </MythicCluster>
            {hasActionContent && (
                <MythicCluster className={styles.actions} gap="xs" justify="end">
                    {actions}
                    {children}
                </MythicCluster>
            )}
        </Paper>
    );
};

export const MythicPageHeaderChip = ({status, className = "", sx, ...props}) => {
    const tone = status === "active" || status === "enabled" ? "success" :
        status === "inactive" || status === "disabled" ? "warning" :
        status || "neutral";
    return (
        <Chip
            {...props}
            className={joinClasses(styles.chip, "mythic-font-size-caption mythic-font-weight-strong", className)}
            data-tone={tone}
            size="small"
            sx={sx}
            variant="outlined"
        />
    );
};

export const MythicSectionHeader = ({actions, dense = false, subtitle, sx, title}) => (
    <MythicPageHeader
        actions={actions}
        className={`${styles.section} mythic-relative mythic-overflow-hidden`}
        dense={dense}
        subtitle={subtitle}
        sx={sx}
        title={title}
    />
);
