const COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

const modeValue = (dark, light) => ({dark, light});

export const appearanceDefaults = {
    version: 2,
    typography: {
        fontSize: 13,
        fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    backgroundImage: modeValue(null, null),
    colors: {
        application: {
            background: modeValue("#0b0f14", "#f6f8fb"),
            surface: modeValue("#111820", "#ffffff"),
            raised: modeValue("#16212b", "#ffffff"),
            muted: modeValue("#0f1720", "#fafbfc"),
            border: modeValue("#263241", "#d5dee9"),
        },
        text: {
            primary: modeValue("#e6edf3", "#111827"),
            secondary: modeValue("#a7b2c2", "#526174"),
            disabled: modeValue("#6f7c8d", "#93a1b2"),
        },
        header: {
            surface: modeValue("#111a23", "#ffffff"),
            text: modeValue("#e7edf5", "#0f172a"),
            accent: modeValue("#7dd3fc", "#b3cbff"),
            gradientStart: modeValue("#153049", "#dbeafe"),
            gradientMiddle: modeValue("#111f2e", "#eef6ff"),
            gradientEnd: modeValue("#111820", "#ffffff"),
            subtleGradientStart: modeValue("#132338", "#eef6ff"),
            subtleGradientEnd: modeValue("#111820", "#ffffff"),
        },
        chat: {
            operatorMessage: modeValue("#111820", "#ffffff"),
            selfMessage: modeValue("#142033", "#f8fbff"),
            systemMessage: modeValue("#2a2116", "#fff7ed"),
            markdownSurface: modeValue("#0b1118", "#f5f5f5"),
            markdownSurfaceStrong: modeValue("#1f2a37", "#e2e8f0"),
        },
        graph: {
            group: modeValue("#24384a", "#d9e6f2"),
        },
        navigation: {
            gradientStart: modeValue("#1a283d", "#5c73a5"),
            gradientEnd: modeValue("#0c131c", "#1f2937"),
            icon: modeValue("#dce8f8", "#ffffff"),
            text: modeValue("#dce8f8", "#ffffff"),
        },
        table: {
            header: modeValue("#17212c", "#e8eef5"),
            hover: modeValue("#1e2a36", "#eaf1f8"),
            selectedCallback: modeValue("#123a5a", "#dbeafe"),
            selectedHierarchy: modeValue("#172d49", "#edf6ff"),
        },
        status: {
            primary: modeValue("#7dd3fc", "#2563eb"),
            secondary: modeValue("#94a3b8", "#64748b"),
            info: modeValue("#22d3ee", "#0891b2"),
            success: modeValue("#34d399", "#15803d"),
            warning: modeValue("#fbbf24", "#b45309"),
            error: modeValue("#fb7185", "#dc2626"),
        },
        chart: {
            series1: modeValue("#38bdf8", "#0284c7"),
            series2: modeValue("#34d399", "#16a34a"),
            series3: modeValue("#fbbf24", "#ca8a04"),
            series4: modeValue("#fb7185", "#e11d48"),
            series5: modeValue("#a78bfa", "#7c3aed"),
            series6: modeValue("#2dd4bf", "#0d9488"),
            series7: modeValue("#f472b6", "#db2777"),
            series8: modeValue("#f97316", "#ea580c"),
            series9: modeValue("#818cf8", "#4f46e5"),
            series10: modeValue("#a3e635", "#65a30d"),
        },
        tasking: {
            promptText: modeValue("#9fb3c8", "#64748b"),
            commandText: modeValue("#f8fafc", "#0f172a"),
            context: modeValue("#14324f", "#dbeafe"),
            impersonationContext: modeValue("#4a1824", "#fee2e2"),
            extraContext: modeValue("#123a35", "#dcfce7"),
            outputBackground: modeValue("#070b10", "#f8fafc"),
            outputText: modeValue("#e6edf3", "#111827"),
        },
        fileBrowser: {
            folder: modeValue("#f2c86b", "#d6a23f"),
            emptyFolder: modeValue("#8997aa", "#64748b"),
        },
    },
};

export const isValidAppearanceColor = (value) => typeof value === "string" && COLOR_PATTERN.test(value);

const readPath = (source, path) => path.split(".").reduce((value, key) => value?.[key], source);

const colorField = (path, label, description, usedBy, preview) => ({
    path: `colors.${path}`,
    type: "color",
    label,
    description,
    usedBy,
    preview,
    defaultValue: readPath(appearanceDefaults, `colors.${path}`),
    validate: isValidAppearanceColor,
    reset: "mode-default",
});

export const appearanceFieldGroups = [
    {
        id: "typography",
        label: "Typography",
        description: "Application-wide font family and base scale.",
        fields: [
            {
                path: "typography.fontFamily",
                type: "fontFamily",
                label: "Font Family",
                description: "The CSS font stack used throughout Mythic.",
                usedBy: ["Application text", "Editors", "Previews"],
                preview: "typography",
                defaultValue: appearanceDefaults.typography.fontFamily,
                validate: (value) => typeof value === "string" && value.trim().length > 0,
                reset: "default",
            },
            {
                path: "typography.fontSize",
                type: "fontSize",
                label: "Base Font Size",
                description: "The MUI base font size in pixels.",
                usedBy: ["Application text", "Controls", "Previews"],
                preview: "typography",
                defaultValue: appearanceDefaults.typography.fontSize,
                validate: (value) => Number.isFinite(Number(value)) && Number(value) >= 10 && Number(value) <= 24,
                reset: "default",
            },
        ],
    },
    {
        id: "application",
        label: "Application Shell",
        description: "Page chrome, surfaces, typography, and borders.",
        fields: [
            colorField("application.background", "App Background", "The background behind application views and dialogs.", ["Page backgrounds", "Workspace shells"], "surface"),
            colorField("application.surface", "Panel Background", "The base surface used by panels, menus, and dialogs.", ["Panels", "Dialogs", "Menus"], "surface"),
            colorField("application.raised", "Raised Surface", "A stronger surface for elevated or prominent content.", ["Cards", "Popovers", "Side panels"], "surface"),
            colorField("application.muted", "Muted Surface", "A quiet background for low-emphasis groups.", ["Metadata groups", "Secondary panels"], "surface"),
            colorField("text.primary", "Primary Text", "The primary readable text color.", ["Headings", "Body text", "Values"], "typography"),
            colorField("text.secondary", "Secondary Text", "Muted helper text, labels, metadata, and icons.", ["Labels", "Descriptions", "Metadata"], "typography"),
            colorField("text.disabled", "Disabled Text", "Text and icons for unavailable controls.", ["Disabled controls", "Inactive values"], "typography"),
            colorField("application.border", "Borders", "Outlines separating controls, panels, and rows.", ["Panels", "Tables", "Inputs"], "surface"),
        ],
    },
    {
        id: "headers",
        label: "Headers and Gradients",
        description: "Page headers, section headers, and accent gradients.",
        fields: [
            colorField("header.surface", "Page Header Surface", "The base surface behind page and section headers.", ["Page headers", "Section headers"], "header"),
            colorField("header.text", "Page Header Text", "Text and icon color inside headers.", ["Header titles", "Header actions"], "header"),
            colorField("header.accent", "Section Accent", "The emphasis color used by section headers.", ["Header accent strips", "Section borders"], "header"),
            colorField("header.gradientStart", "Header Gradient Start", "The first color stop in section-header gradients.", ["Section headers"], "header"),
            colorField("header.gradientMiddle", "Header Gradient Middle", "The middle color stop in section-header gradients.", ["Section headers"], "header"),
            colorField("header.gradientEnd", "Header Gradient End", "The final color stop in section-header gradients.", ["Section headers"], "header"),
            colorField("header.subtleGradientStart", "Subtle Gradient Start", "The visible edge of quiet accent gradients.", ["Overview cards", "Option cards"], "subtleGradient"),
            colorField("header.subtleGradientEnd", "Subtle Gradient End", "The fade-out edge of quiet accent gradients.", ["Overview cards", "Option cards"], "subtleGradient"),
        ],
    },
    {
        id: "chat",
        label: "Chat",
        description: "Chat messages and markdown surfaces.",
        fields: [
            colorField("chat.operatorMessage", "Other Messages", "Message background for other operators.", ["Chat operator messages"], "chat"),
            colorField("chat.selfMessage", "My Messages", "Message background for the current operator.", ["Your chat messages"], "chat"),
            colorField("chat.systemMessage", "System Messages", "Message background for system-generated chat entries.", ["Chat system messages"], "chat"),
            colorField("chat.markdownSurface", "Markdown Surface", "Background for code, blockquotes, and markdown tables.", ["Inline code", "Code blocks", "Blockquotes"], "chat"),
            colorField("chat.markdownSurfaceStrong", "Markdown Label Surface", "A stronger markdown surface for compact labels.", ["Code language labels", "Markdown badges"], "chat"),
        ],
    },
    {
        id: "graphs",
        label: "Graphs",
        description: "Graph grouping and node surfaces.",
        fields: [
            colorField("graph.group", "Graph Group", "Background for grouped nodes in graph views.", ["Callback graphs", "Eventing graphs"], "graph"),
        ],
    },
    {
        id: "navigation",
        label: "Navigation",
        description: "Navigation gradient, text, and icons.",
        fields: [
            colorField("navigation.gradientStart", "Navigation Top", "The first color in the navigation gradient.", ["Left navigation"], "navigation"),
            colorField("navigation.gradientEnd", "Navigation Bottom", "The final color in the navigation gradient.", ["Left navigation"], "navigation"),
            colorField("navigation.icon", "Navigation Icons", "Icon color in the navigation bar.", ["Navigation icons"], "navigation"),
            colorField("navigation.text", "Navigation Text", "Text color in the navigation bar.", ["Navigation labels", "Navigation actions"], "navigation"),
        ],
    },
    {
        id: "tables",
        label: "Tables and Selection",
        description: "Table headers, hover states, and callback selection.",
        fields: [
            colorField("table.header", "Table Header", "Background for table and grid header rows.", ["Table headers", "Sticky grid headers"], "table"),
            colorField("table.hover", "Table Row Hover", "Background shown when a table row is hovered or softly emphasized.", ["Table row hover", "Grid row hover"], "tableHover"),
            colorField("table.selectedCallback", "Active Callback", "Highlight for the currently active callback.", ["Callbacks table", "Selected callback"], "table"),
            colorField("table.selectedHierarchy", "Tree Host Highlight", "Highlight for the selected host in hierarchy views.", ["Callback tree", "Host hierarchy"], "table"),
        ],
    },
    {
        id: "status",
        label: "Status Colors",
        description: "Actions, alerts, tags, and state accents.",
        fields: [
            colorField("status.primary", "Primary", "Primary actions and key affordances.", ["Primary buttons", "Selected controls"], "status"),
            colorField("status.secondary", "Secondary", "Supporting actions and secondary accents.", ["Secondary actions"], "status"),
            colorField("status.info", "Info", "Informational actions and notices.", ["Info actions", "Notices"], "status"),
            colorField("status.success", "Success", "Healthy states and confirmations.", ["Success actions", "Healthy states"], "status"),
            colorField("status.warning", "Warning", "Caution states and warning actions.", ["Warnings", "Caution actions"], "status"),
            colorField("status.error", "Error", "Danger actions and failures.", ["Errors", "Delete actions", "Failed states"], "status"),
        ],
    },
    {
        id: "charts",
        label: "Data Visualization",
        description: "Fallback series colors for dashboard visualizations.",
        fields: Array.from({length: 10}, (_, index) => colorField(
            `chart.series${index + 1}`,
            `Chart Series ${index + 1}`,
            `Dashboard chart fallback color ${index + 1}.`,
            ["Dashboard charts", "Multi-series visualizations"],
            "chart",
        )),
    },
    {
        id: "tasking",
        label: "Tasking",
        description: "Task prompts, context badges, and command output.",
        fields: [
            colorField("tasking.promptText", "Prompt Text", "Text used for the tasking prompt.", ["Tasking prompt"], "task"),
            colorField("tasking.commandText", "Command Text", "Command and parameter text in tasking.", ["Commands", "Task parameters"], "task"),
            colorField("tasking.context", "Context", "Generic tasking context labels.", ["Tasking context"], "task"),
            colorField("tasking.impersonationContext", "Impersonation Context", "User and impersonation context labels.", ["Impersonation context"], "task"),
            colorField("tasking.extraContext", "Extra Context", "Additional tasking context labels.", ["Extra task context"], "task"),
            colorField("tasking.outputBackground", "Output Background", "Background for task output and terminal-style responses.", ["Task output", "Interactive terminal"], "output"),
            colorField("tasking.outputText", "Output Text", "Text color for task output and terminal-style responses.", ["Task output", "Interactive terminal"], "output"),
        ],
    },
    {
        id: "files",
        label: "File Browsing",
        description: "Folder colors in file-browser views.",
        fields: [
            colorField("fileBrowser.folder", "Folder", "Normal folder icon color.", ["File browser trees"], "file"),
            colorField("fileBrowser.emptyFolder", "Empty Folder", "Empty-folder icon and label color.", ["File browser trees"], "file"),
        ],
    },
    {
        id: "background-images",
        label: "Background Images",
        description: "Optional page background images for each mode.",
        fields: [
            {
                path: "backgroundImage.dark",
                type: "image",
                mode: "dark",
                label: "Dark Background Image",
                description: "Optional page background image used in dark mode.",
                usedBy: ["Application background"],
                preview: "surface",
                defaultValue: appearanceDefaults.backgroundImage.dark,
                validate: (value) => value === null || typeof value === "string",
                reset: "default",
            },
            {
                path: "backgroundImage.light",
                type: "image",
                mode: "light",
                label: "Light Background Image",
                description: "Optional page background image used in light mode.",
                usedBy: ["Application background"],
                preview: "surface",
                defaultValue: appearanceDefaults.backgroundImage.light,
                validate: (value) => value === null || typeof value === "string",
                reset: "default",
            },
        ],
    },
];

export const appearanceFields = appearanceFieldGroups.flatMap((group) => group.fields);
export const appearanceColorFields = appearanceFields.filter(({type}) => type === "color");

export const normalizeAppearanceBackgroundImage = (value) => {
    if(typeof value !== "string" || value.length === 0){
        return null;
    }
    if(value.startsWith("data:image/")){
        return `url("${value}")`;
    }
    if(value.startsWith("url(\"data:image/") && !value.endsWith("\")")){
        return `${value}")`;
    }
    if(value.startsWith("url(data:image/") && !value.endsWith(")")){
        return `${value})`;
    }
    return value;
};

export const getAppearanceValue = readPath;

const setAppearanceValue = (target, path, value) => {
    const keys = path.split(".");
    const leaf = keys.pop();
    const container = keys.reduce((current, key) => {
        current[key] = current[key] || {};
        return current[key];
    }, target);
    container[leaf] = value;
};

export const updateAppearanceValue = (appearance, path, value) => {
    const keys = path.split(".");
    const update = (current, index) => {
        if(index === keys.length){
            return value;
        }
        const key = keys[index];
        return {
            ...(current || {}),
            [key]: update(current?.[key], index + 1),
        };
    };
    return update(appearance, 0);
};

export const resolveAppearance = (appearance) => {
    const fontFamilyField = appearanceFields.find(({path}) => path === "typography.fontFamily");
    const fontSizeField = appearanceFields.find(({path}) => path === "typography.fontSize");
    const resolved = {
        version: 2,
        typography: {
            fontSize: fontSizeField.validate(appearance?.typography?.fontSize)
                ? Number(appearance.typography.fontSize)
                : appearanceDefaults.typography.fontSize,
            fontFamily: fontFamilyField.validate(appearance?.typography?.fontFamily)
                ? appearance.typography.fontFamily
                : appearanceDefaults.typography.fontFamily,
        },
        backgroundImage: {
            dark: normalizeAppearanceBackgroundImage(appearance?.backgroundImage?.dark ?? appearanceDefaults.backgroundImage.dark),
            light: normalizeAppearanceBackgroundImage(appearance?.backgroundImage?.light ?? appearanceDefaults.backgroundImage.light),
        },
        colors: {},
    };
    appearanceColorFields.forEach(({path}) => {
        const supplied = getAppearanceValue(appearance, path);
        const fallback = getAppearanceValue(appearanceDefaults, path);
        setAppearanceValue(resolved, path, {
            dark: isValidAppearanceColor(supplied?.dark) ? supplied.dark : fallback.dark,
            light: isValidAppearanceColor(supplied?.light) ? supplied.light : fallback.light,
        });
    });
    return resolved;
};

export const resolveAppearanceMode = (appearance, mode) => {
    const safeMode = mode === "light" ? "light" : "dark";
    const resolved = resolveAppearance(appearance);
    const colors = {};
    appearanceColorFields.forEach(({path}) => {
        const colorPath = path.replace(/^colors\./, "");
        setAppearanceValue(colors, colorPath, getAppearanceValue(resolved, path)[safeMode]);
    });
    return {
        mode: safeMode,
        typography: resolved.typography,
        backgroundImage: resolved.backgroundImage[safeMode],
        color: colors,
    };
};
