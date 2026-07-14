import {alpha, createTheme} from "@mui/material/styles";
import {appearanceDefaults, resolveAppearance, resolveAppearanceMode} from "./appearance";
import {createDerivedThemeVariables} from "./createDerivedThemeVariables";

const variable = (path) => `var(--mythic-${path})`;

export const mythicFoundation = Object.freeze({
    radius: Object.freeze({sm: "4px", md: "6px", lg: "8px", pill: "999px"}),
    spacing: Object.freeze({xs: "0.25rem", sm: "0.5rem", md: "0.75rem", lg: "1rem", xl: "1.5rem"}),
    typography: Object.freeze({
        family: Object.freeze({monospace: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"}),
        size: Object.freeze({xs: "0.68rem", caption: "0.72rem", small: "0.78rem", bodySmall: "0.86rem", body: "0.92rem", title: "1rem"}),
        weight: Object.freeze({medium: 600, semibold: 650, bold: 700, strong: 750, extraBold: 800, heavy: 850, black: 900}),
    }),
});

const foundationVariable = (path) => variable(`foundation-${path}`);
const foundationVars = {
    radius: {
        sm: foundationVariable("radius-sm"),
        md: foundationVariable("radius-md"),
        lg: foundationVariable("radius-lg"),
        pill: foundationVariable("radius-pill"),
    },
    spacing: {
        xs: foundationVariable("spacing-xs"),
        sm: foundationVariable("spacing-sm"),
        md: foundationVariable("spacing-md"),
        lg: foundationVariable("spacing-lg"),
        xl: foundationVariable("spacing-xl"),
    },
    typography: {
        size: {
            caption: foundationVariable("typography-size-caption"),
            small: foundationVariable("typography-size-small"),
            bodySmall: foundationVariable("typography-size-bodySmall"),
            body: foundationVariable("typography-size-body"),
            title: foundationVariable("typography-size-title"),
        },
        weight: {
            semibold: foundationVariable("typography-weight-semibold"),
            bold: foundationVariable("typography-weight-bold"),
        },
    },
};

const vars = {
    background: variable("color-application-background"),
    surface: variable("color-application-surface"),
    border: variable("color-application-border"),
    textPrimary: variable("color-text-primary"),
    textSecondary: variable("color-text-secondary"),
    tableHeader: variable("color-table-header"),
    tableRowStripe: variable("effect-table-rowStripe"),
    tableRowHover: variable("effect-table-rowHover"),
    tableSelected: variable("effect-table-selected"),
    tableBorderSoft: variable("effect-table-borderSoft"),
    paginationSelected: variable("effect-control-selected"),
    paginationSelectedHover: variable("effect-control-selectedHover"),
    dialogShadow: variable("effect-shadow-dialog"),
    menuShadow: variable("effect-shadow-menu"),
    primary: variable("palette-primary-main"),
};

const createEffects = (color, mode) => ({
    code: {
        surface: mode === "dark" ? "rgba(0, 0, 0, 0.36)" : "rgba(15, 23, 42, 0.06)",
    },
    header: {
        border: alpha(color.header.text, 0.22),
        muted: alpha(color.header.text, 0.18),
        secondary: alpha(color.header.text, 0.78),
        soft: alpha(color.header.text, 0.12),
        strongBorder: alpha(color.header.text, 0.42),
    },
    surface: {
        subtle: alpha(mode === "dark" ? "#ffffff" : "#000000", mode === "dark" ? 0.045 : 0.028),
    },
    gradient: {
        sectionHeader: `linear-gradient(90deg, ${color.header.gradientStart} 0%, ${color.header.gradientMiddle} 48%, ${color.header.gradientEnd} 100%)`,
        subtle: `linear-gradient(135deg, ${color.header.subtleGradientStart} 0%, ${color.header.subtleGradientEnd} 62%)`,
        subtleHorizontal: `linear-gradient(90deg, ${color.header.subtleGradientStart} 0%, ${color.header.subtleGradientEnd} 100%)`,
        navigation: `linear-gradient(180deg, ${color.navigation.gradientStart}, ${color.navigation.gradientEnd})`,
    },
    table: {
        rowStripe: alpha(color.table.hover, mode === "dark" ? 0.33 : 0.4),
        rowHover: alpha(color.table.hover, 0.8),
        selected: alpha(color.table.selectedCallback, 0.8),
        selectedHierarchy: alpha(color.table.selectedHierarchy, 0.8),
        borderSoft: alpha(color.application.border, mode === "dark" ? 0.67 : 0.8),
    },
    navigation: {
        hover: alpha(color.table.hover, 0.4),
        selected: alpha(color.table.selectedCallback, 0.6),
        muted: alpha(color.navigation.text, 0.7),
    },
    control: {
        selected: alpha(color.status.primary, mode === "dark" ? 0.27 : 0.12),
        selectedHover: alpha(color.status.primary, mode === "dark" ? 0.33 : 0.17),
    },
    shadow: {
        dialog: mode === "dark" ? "0 24px 80px rgba(0, 0, 0, 0.45)" : "0 24px 80px rgba(15, 23, 42, 0.14)",
        menu: mode === "dark" ? "0 18px 48px rgba(0, 0, 0, 0.40)" : "0 18px 48px rgba(15, 23, 42, 0.12)",
    },
});

const createColorScheme = (appearance, mode) => {
    const resolved = resolveAppearanceMode(appearance, mode);
    const {color} = resolved;
    const effect = createEffects(color, mode);
    return {
        palette: {
            mode,
            contrastThreshold: 4.5,
            primary: {main: color.status.primary},
            secondary: {main: color.status.secondary},
            info: {main: color.status.info},
            success: {main: color.status.success},
            warning: {main: color.status.warning},
            error: {main: color.status.error},
            background: {
                default: color.application.background,
                paper: color.application.surface,
                contrast: mode === "dark" ? appearance.colors.application.background.light : appearance.colors.application.background.dark,
                image: resolved.backgroundImage,
            },
            text: {
                primary: color.text.primary,
                secondary: color.text.secondary,
                disabled: color.text.disabled,
                contrast: mode === "dark" ? "#000000" : "#ffffff",
            },
            action: {
                hover: effect.table.rowHover,
                selected: effect.navigation.selected,
                focus: alpha(color.status.primary, mode === "dark" ? 0.33 : 0.2),
            },
            divider: color.application.border,
            graphGroupRGBA: alpha(color.graph.group, 0.5),
        },
        color,
        effect,
        backgroundImage: resolved.backgroundImage || "none",
        gradients: {
            sectionHeader: effect.gradient.sectionHeader,
            subtleAccent: effect.gradient.subtle,
            subtleAccentHorizontal: effect.gradient.subtleHorizontal,
        },
        navigation: {
            background: effect.gradient.navigation,
            backgroundColor: color.navigation.gradientStart,
            border: color.application.border,
            hover: effect.navigation.hover,
            selected: effect.navigation.selected,
            text: color.navigation.text,
            icon: color.navigation.icon,
            muted: effect.navigation.muted,
            accent: color.navigation.gradientEnd,
        },
        sectionHeader: {
            accent: color.header.accent,
            gradientStart: color.header.gradientStart,
            gradientMiddle: color.header.gradientMiddle,
            gradientEnd: color.header.gradientEnd,
        },
        surfaces: {
            app: color.application.background,
            paper: color.application.surface,
            raised: color.application.raised,
            muted: color.application.muted,
            hover: effect.table.rowHover,
            selected: effect.table.selected,
        },
        chat: {
            message: {
                operatorBackground: color.chat.operatorMessage,
                selfBackground: color.chat.selfMessage,
                systemBackground: color.chat.systemMessage,
                markdownSurface: color.chat.markdownSurface,
                markdownSurfaceStrong: color.chat.markdownSurfaceStrong,
            },
        },
        table: {
            header: color.table.header,
            headerHover: effect.table.rowHover,
            rowStripe: effect.table.rowStripe,
            rowHover: effect.table.rowHover,
            selected: effect.table.selected,
            selectedHierarchy: effect.table.selectedHierarchy,
            border: color.application.border,
            borderSoft: effect.table.borderSoft,
        },
    };
};

const createComponentOverrides = () => ({
    MuiCssBaseline: {
        styleOverrides: {
            "html, body, #root": {
                colorScheme: "light dark",
                height: "100%",
                overscrollBehaviorY: "none",
                width: "100%",
            },
            "*": {
                boxSizing: "border-box",
                scrollbarColor: `${vars.border} transparent`,
                scrollbarWidth: "thin",
            },
            "::selection": {backgroundColor: `rgba(${variable("palette-primary-mainChannel")} / 0.45)`},
            "*::-webkit-scrollbar": {height: 10, width: 10},
            "*::-webkit-scrollbar-thumb": {
                backgroundClip: "padding-box",
                backgroundColor: vars.border,
                border: "3px solid transparent",
                borderRadius: 999,
            },
            "*::-webkit-scrollbar-track": {background: "transparent"},
            body: {
                margin: 0,
                backgroundColor: vars.background,
                color: vars.textPrimary,
                WebkitFontSmoothing: "antialiased",
                MozOsxFontSmoothing: "grayscale",
            },
        },
    },
    MuiPaper: {
        defaultProps: {elevation: 0},
        styleOverrides: {root: {backgroundImage: "none", borderRadius: foundationVars.radius.md, boxShadow: "none"}},
    },
    MuiButton: {
        defaultProps: {disableElevation: true, size: "small"},
        styleOverrides: {
            root: {minHeight: 30, borderRadius: foundationVars.radius.md, textTransform: "none", fontWeight: foundationVars.typography.weight.semibold},
            contained: {boxShadow: "none"},
        },
    },
    MuiIconButton: {
        styleOverrides: {
            root: {
                borderRadius: foundationVars.radius.md,
                padding: 5,
                color: vars.textSecondary,
                "&:hover": {backgroundColor: vars.tableRowHover, color: vars.textPrimary},
            },
        },
    },
    MuiAppBar: {
        styleOverrides: {root: {backgroundImage: "none", boxShadow: "none", borderBottom: `1px solid ${vars.border}`}},
    },
    MuiBackdrop: {styleOverrides: {root: {"&.mythic-local-backdrop": {position: "absolute", zIndex: 2}}}},
    MuiDialog: {
        styleOverrides: {
            paper: {
                borderRadius: foundationVars.radius.lg,
                border: `1px solid ${vars.border}`,
                backgroundImage: "none",
                boxShadow: vars.dialogShadow,
            },
        },
    },
    MuiDialogTitle: {
        styleOverrides: {root: {padding: "10px 14px", fontSize: foundationVars.typography.size.title, fontWeight: foundationVars.typography.weight.semibold, borderBottom: `1px solid ${vars.border}`, overflowWrap: "anywhere"}},
    },
    MuiDialogContent: {styleOverrides: {root: {padding: "12px 14px"}}},
    MuiDialogContentText: {
        styleOverrides: {root: {color: vars.textSecondary, fontSize: "0.88rem", lineHeight: 1.45, margin: "0 0 10px"}},
    },
    MuiDialogActions: {
        styleOverrides: {root: {alignItems: "center", display: "flex", gap: 8, padding: "10px 14px", borderTop: `1px solid ${vars.border}`}},
    },
    MuiOutlinedInput: {
        styleOverrides: {
            root: {
                borderRadius: foundationVars.radius.md,
                backgroundColor: vars.surface,
                "&:hover .MuiOutlinedInput-notchedOutline": {borderColor: vars.textSecondary},
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {borderColor: vars.primary, borderWidth: 1},
            },
            notchedOutline: {borderColor: vars.border},
        },
    },
    MuiInput: {
        styleOverrides: {root: {"&:before": {borderBottomColor: vars.border}, "&:after": {borderBottomColor: vars.primary}}},
    },
    MuiInputBase: {styleOverrides: {root: {fontSize: foundationVars.typography.size.body}}},
    MuiInputAdornment: {styleOverrides: {root: {color: vars.textSecondary}}},
    MuiInputLabel: {
        styleOverrides: {root: {color: vars.textSecondary, "&.Mui-focused": {color: vars.primary}}},
    },
    MuiFormControlLabel: {
        styleOverrides: {
            root: {marginLeft: 0, marginRight: 0},
            label: {color: vars.textPrimary, fontSize: foundationVars.typography.size.bodySmall},
        },
    },
    MuiFormHelperText: {
        styleOverrides: {root: {color: vars.textSecondary, fontSize: foundationVars.typography.size.caption, lineHeight: 1.35, marginLeft: 0}},
    },
    MuiTypography: {styleOverrides: {root: {minWidth: 0, overflowWrap: "anywhere"}}},
    MuiLink: {styleOverrides: {root: {overflowWrap: "anywhere"}}},
    MuiTabs: {styleOverrides: {root: {minHeight: 34}, indicator: {height: 2, borderRadius: 2}}},
    MuiTab: {
        styleOverrides: {
            root: {minHeight: 34, padding: "6px 10px", textTransform: "none", fontSize: foundationVars.typography.size.small, fontWeight: foundationVars.typography.weight.semibold, letterSpacing: 0},
        },
    },
    MuiMenu: {
        styleOverrides: {paper: {border: `1px solid ${vars.border}`, borderRadius: foundationVars.radius.lg, boxShadow: vars.menuShadow}},
    },
    MuiMenuItem: {styleOverrides: {root: {borderRadius: foundationVars.radius.md, gap: 5}}},
    MuiList: {styleOverrides: {root: {backgroundImage: "none", borderRadius: foundationVars.radius.md}}},
    MuiTooltip: {
        styleOverrides: {
            tooltip: {
                backgroundColor: variable("palette-background-contrast"),
                borderRadius: foundationVars.radius.md,
                color: variable("palette-text-contrast"),
                fontSize: 13,
            },
            arrow: {color: variable("palette-background-contrast")},
        },
    },
    MuiAccordion: {styleOverrides: {root: {border: 0, boxShadow: "none", margin: 0, "&:before": {display: "none"}}}},
    MuiAccordionDetails: {styleOverrides: {root: {paddingBottom: 0, paddingTop: 0}}},
    MuiAccordionSummary: {
        styleOverrides: {
            root: {"&.Mui-expanded": {minHeight: "unset"}},
            content: {"&.Mui-expanded": {margin: 0, minHeight: "unset"}},
        },
    },
    MuiSelect: {
        styleOverrides: {
            select: {alignItems: "center", display: "flex", minWidth: 0, overflow: "hidden", paddingLeft: 10, textOverflow: "ellipsis", whiteSpace: "nowrap"},
        },
    },
    MuiListItem: {
        styleOverrides: {root: {"&:hover": {backgroundColor: vars.tableRowHover, color: vars.textPrimary}}},
    },
    MuiTreeItem: {
        styleOverrides: {label: {".MuiTreeItem-root.Mui-selected > .MuiTreeItem-content &": {backgroundColor: "transparent"}}},
    },
    MuiChip: {
        styleOverrides: {
            root: {borderRadius: foundationVars.radius.sm, fontWeight: foundationVars.typography.weight.semibold},
            label: {minWidth: 0, overflow: "hidden", textOverflow: "ellipsis"},
        },
    },
    MuiFormControl: {styleOverrides: {root: {margin: 0, "&:has(> .MuiInputLabel-root)": {marginTop: "0.45rem"}}}},
    MuiTextField: {styleOverrides: {root: {margin: 0, "&:has(> .MuiInputLabel-root)": {marginTop: "0.45rem"}}}},
    MuiGrid: {styleOverrides: {root: {maxWidth: "100%", minWidth: 0}}},
    MuiCollapse: {
        styleOverrides: {
            root: {maxWidth: "100%", minWidth: 0},
            wrapper: {maxWidth: "100%", minWidth: 0},
            wrapperInner: {maxWidth: "100%", minWidth: 0},
        },
    },
    MuiTabScrollButton: {styleOverrides: {root: {borderRadius: foundationVars.radius.md}}},
    MuiTableContainer: {
        styleOverrides: {
            root: {backgroundColor: vars.surface, border: `1px solid ${vars.border}`, borderRadius: 6, minHeight: 0, overflow: "auto"},
        },
    },
    MuiTable: {
        styleOverrides: {root: {backgroundColor: vars.surface, borderCollapse: "separate", borderSpacing: 0, width: "100%"}},
    },
    MuiTableHead: {styleOverrides: {root: {"& .MuiTableRow-root": {backgroundColor: vars.tableHeader}}}},
    MuiTableCell: {
        styleOverrides: {
            root: {
                borderBottom: `1px solid ${vars.tableBorderSoft}`,
                color: vars.textPrimary,
                fontVariantNumeric: "tabular-nums",
                fontSize: foundationVars.typography.size.bodySmall,
                lineHeight: 1.35,
                overflowWrap: "anywhere",
                padding: "6px 10px",
                verticalAlign: "middle",
                "&:first-of-type": {paddingLeft: 12},
                "&:last-of-type": {paddingRight: 12},
            },
            head: {
                backgroundColor: vars.tableHeader,
                borderBottom: `1px solid ${vars.border}`,
                borderTop: 0,
                color: vars.textPrimary,
                fontSize: foundationVars.typography.size.small,
                fontWeight: foundationVars.typography.weight.bold,
                letterSpacing: 0,
                textTransform: "uppercase",
                whiteSpace: "nowrap",
            },
            paddingCheckbox: {paddingLeft: 6, paddingRight: 6, width: 36},
            stickyHeader: {backgroundColor: vars.tableHeader, zIndex: 3},
        },
    },
    MuiTableRow: {
        styleOverrides: {
            root: {
                backgroundColor: vars.surface,
                ".MuiTableBody-root &:nth-of-type(even):not(.Mui-selected):not(.selectedCallback):not(.selectedCallbackHierarchy)": {
                    backgroundColor: vars.tableRowStripe,
                },
                "&:last-child .MuiTableCell-root": {borderBottom: 0},
                "&.Mui-selected": {backgroundColor: vars.tableSelected, "&:hover": {backgroundColor: vars.tableSelected}},
                "&.MuiTableRow-hover:hover": {backgroundColor: vars.tableRowHover},
            },
        },
    },
    MuiTablePagination: {
        styleOverrides: {
            root: {color: vars.textSecondary},
            selectLabel: {color: vars.textSecondary, fontSize: foundationVars.typography.size.small},
            displayedRows: {color: vars.textSecondary, fontSize: foundationVars.typography.size.small},
            toolbar: {minHeight: 34},
        },
    },
    MuiTableSortLabel: {
        styleOverrides: {
            root: {color: vars.textSecondary, "&.Mui-active": {color: vars.textPrimary}, "&:hover": {color: vars.textPrimary}},
            icon: {color: `${vars.textSecondary} !important`},
        },
    },
    MuiPagination: {styleOverrides: {root: {display: "flex"}, ul: {gap: 4}}},
    MuiPaginationItem: {
        styleOverrides: {
            root: {
                minWidth: 28,
                height: 28,
                borderRadius: foundationVars.radius.md,
                color: vars.textSecondary,
                fontSize: foundationVars.typography.size.small,
                fontWeight: foundationVars.typography.weight.semibold,
                "&.Mui-selected": {
                    backgroundColor: vars.paginationSelected,
                    borderColor: vars.primary,
                    color: vars.textPrimary,
                    "&:hover": {backgroundColor: vars.paginationSelectedHover},
                },
                "&:hover": {backgroundColor: vars.tableRowHover, color: vars.textPrimary},
            },
            outlined: {borderColor: vars.tableBorderSoft},
            icon: {fontSize: "1rem"},
        },
    },
    MuiToggleButton: {
        styleOverrides: {
            root: {
                borderColor: vars.tableBorderSoft,
                borderRadius: foundationVars.radius.md,
                color: vars.textSecondary,
                fontSize: foundationVars.typography.size.small,
                fontWeight: foundationVars.typography.weight.semibold,
                gap: 6,
                minHeight: 32,
                padding: "5px 9px",
                textTransform: "none",
                "&:hover": {backgroundColor: vars.tableRowHover, color: vars.textPrimary},
                "&.Mui-selected": {
                    backgroundColor: vars.paginationSelected,
                    borderColor: vars.primary,
                    color: vars.textPrimary,
                    "&:hover": {backgroundColor: vars.paginationSelectedHover},
                },
            },
            sizeSmall: {minHeight: 30},
        },
    },
});

export const createMythicTheme = (appearance = appearanceDefaults) => {
    const resolved = resolveAppearance(appearance);
    const theme = createTheme({
        cssVariables: {
            cssVarPrefix: "mythic",
            colorSchemeSelector: "data-mythic-color-scheme",
        },
        defaultColorScheme: "dark",
        colorSchemes: {
            light: createColorScheme(resolved, "light"),
            dark: createColorScheme(resolved, "dark"),
        },
        foundation: mythicFoundation,
        shape: {borderRadius: Number.parseFloat(mythicFoundation.radius.md)},
        typography: {
            fontSize: resolved.typography.fontSize,
            fontFamily: resolved.typography.fontFamily,
            h5: {fontWeight: 650, letterSpacing: 0},
            h6: {fontWeight: 650, letterSpacing: 0},
            subtitle1: {fontWeight: 650},
            button: {textTransform: "none", fontWeight: 650, letterSpacing: 0},
        },
        transitions: {create: () => "none"},
        components: createComponentOverrides(),
    });
    const themeForScheme = (mode) => ({
        ...theme,
        ...theme.colorSchemes[mode],
        palette: theme.colorSchemes[mode].palette,
    });
    theme.components.MuiCssBaseline.styleOverrides = {
        ...theme.components.MuiCssBaseline.styleOverrides,
        ':root, :root[data-mythic-color-scheme="dark"]': createDerivedThemeVariables(themeForScheme("dark")),
        ':root[data-mythic-color-scheme="light"]': createDerivedThemeVariables(themeForScheme("light")),
    };
    return theme;
};
