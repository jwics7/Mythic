import React from "react";
import {CssBaseline} from "@mui/material";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import {StyledEngineProvider, ThemeProvider, useColorScheme, useTheme} from "@mui/material/styles";
import "../styles/MythicPrimitives.css";
import "../styles/families/FamilyStyles";
import {appearanceDefaults, resolveAppearance} from "./appearance";
import {createMythicTheme} from "./createMythicTheme";

export const useMythicColorMode = () => {
    const {mode, setMode} = useColorScheme();
    const resolvedMode = mode === "light" ? "light" : "dark";
    return {
        mode: resolvedMode,
        setMode,
        toggleMode: React.useCallback(() => setMode(resolvedMode === "light" ? "dark" : "light"), [resolvedMode, setMode]),
    };
};

export const useMythicTokens = () => {
    const theme = useTheme();
    const {mode} = useMythicColorMode();
    const scheme = theme.colorSchemes?.[mode] || theme.colorSchemes?.dark;
    return React.useMemo(() => scheme ? ({...theme, ...scheme, palette: scheme.palette}) : theme, [scheme, theme]);
};

// CSS-capable consumers should use stable variable references. Unlike
// useMythicTokens(), this hook does not subscribe to the active color scheme.
export const useMythicTheme = () => {
    const theme = useTheme();
    return React.useMemo(() => theme.vars ? ({
        ...theme,
        ...theme.vars,
        palette: theme.vars.palette,
    }) : theme, [theme]);
};

export const MythicThemeProvider = ({
    appearance = appearanceDefaults,
    children,
    themeFactory = createMythicTheme,
}) => {
    const resolvedAppearance = React.useMemo(() => resolveAppearance(appearance), [appearance]);
    const theme = React.useMemo(() => themeFactory(resolvedAppearance), [resolvedAppearance, themeFactory]);

    return (
        <StyledEngineProvider injectFirst>
            <InitColorSchemeScript
                attribute="data-mythic-color-scheme"
                defaultMode="dark"
                modeStorageKey="theme"
                colorSchemeStorageKey="mythic-color-scheme"
            />
            <ThemeProvider
                theme={theme}
                defaultMode="dark"
                modeStorageKey="theme"
                colorSchemeStorageKey="mythic-color-scheme"
                disableTransitionOnChange
                forceThemeRerender={false}
            >
                <CssBaseline />
                {children}
            </ThemeProvider>
        </StyledEngineProvider>
    );
};
