import React, {act} from "react";
import {createRoot} from "react-dom/client";
import {useTheme} from "@mui/material/styles";
import {appearanceDefaults} from "./appearance";
import {createMythicTheme} from "./createMythicTheme";
import {MythicThemeProvider, useMythicColorMode, useMythicTheme} from "./MythicThemeProvider";

const StableCssProbe = React.memo(({renders, themes}) => {
    const theme = useMythicTheme();
    renders.current += 1;
    themes.push(theme);
    return <span data-token={theme.color.text.primary}>CSS tokens</span>;
});

const Probe = ({themes, modes}) => {
    const theme = useTheme();
    const {mode, toggleMode} = useMythicColorMode();
    themes.push(theme);
    modes.push(mode);
    return <button onClick={toggleMode}>Toggle</button>;
};

describe("MythicThemeProvider mode performance", () => {
    let container;
    let root;

    beforeEach(() => {
        global.IS_REACT_ACT_ENVIRONMENT = true;
        window.localStorage.setItem("theme", "dark");
        document.documentElement.setAttribute("data-mythic-color-scheme", "dark");
        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
        window.localStorage.clear();
        delete global.IS_REACT_ACT_ENVIRONMENT;
    });

    test("toggling mode persists the attribute without rebuilding or replacing the theme", async () => {
        const factory = jest.fn(createMythicTheme);
        const themes = [];
        const modes = [];
        const cssThemes = [];
        const cssRenders = {current: 0};
        await act(async () => {
            root.render(
                <MythicThemeProvider appearance={appearanceDefaults} themeFactory={factory}>
                    <Probe themes={themes} modes={modes} />
                    <StableCssProbe renders={cssRenders} themes={cssThemes} />
                </MythicThemeProvider>,
            );
        });

        const firstTheme = themes.at(-1);
        const firstCssTheme = cssThemes.at(-1);
        await act(async () => container.querySelector("button").click());

        expect(factory).toHaveBeenCalledTimes(1);
        expect(themes.at(-1)).toBe(firstTheme);
        expect(cssThemes.at(-1)).toBe(firstCssTheme);
        expect(cssRenders.current).toBe(1);
        expect(firstCssTheme.color.table.hover).toContain("--mythic-color-table-hover");
        expect(window.localStorage.getItem("theme")).toBe("light");
        expect(document.documentElement.getAttribute("data-mythic-color-scheme")).toBe("light");
        expect(modes).toContain("light");
    });
});
