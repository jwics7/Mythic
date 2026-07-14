import React from "react";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SearchIcon from "@mui/icons-material/Search";
import UploadIcon from "@mui/icons-material/Upload";
import {
    appearanceDefaults,
    appearanceFieldGroups,
    getAppearanceValue,
    normalizeAppearanceBackgroundImage,
    updateAppearanceValue,
} from "../../../themes/appearance";
import {MythicColorSwatchInput} from "../../MythicComponents/MythicColorInput";
import {MythicStyledTooltip} from "../../MythicComponents/MythicStyledTooltip";
import {AppearancePreview} from "./AppearancePreview";
import {createMythicTheme} from "../../../themes/createMythicTheme";
import styles from "./AppearanceEditor.module.css";

const ModeColorControl = ({appearance, field, mode, onChange}) => {
    const color = getAppearanceValue(appearance, `${field.path}.${mode}`);
    const defaultColor = getAppearanceValue(appearanceDefaults, `${field.path}.${mode}`);
    const modeLabel = mode === "dark" ? "Dark" : "Light";
    return (
        <div className="mythic-min-width-0">
            <div className={`${styles.modeControlHeader} mythic-justify-between mythic-align-center mythic-flex`}>
                <Typography color="text.secondary" variant="caption">{modeLabel}</Typography>
                <MythicStyledTooltip title={`Reset ${field.label} ${modeLabel.toLowerCase()} color`}>
                    <span>
                        <IconButton
                            aria-label={`Reset ${field.label} ${modeLabel.toLowerCase()} color`}
                            disabled={color === defaultColor}
                            onClick={() => onChange(field.path, mode, defaultColor)}
                            size="small"
                        >
                            <RestartAltIcon fontSize="small" />
                        </IconButton>
                    </span>
                </MythicStyledTooltip>
            </div>
            <MythicColorSwatchInput
                color={color}
                label={`${field.label} ${modeLabel.toLowerCase()} color`}
                onChange={(value) => onChange(field.path, mode, value)}
            />
        </div>
    );
};

const AppearanceField = ({appearance, field, onChange, onSelect, selected}) => (
    <div
        className={`${styles.field} mythic-align-center mythic-grid`}
        data-selected={selected || undefined}
        onClick={onSelect}
        onFocusCapture={onSelect}
    >
        <div className={`${styles.fieldDescription} mythic-min-width-0`}>
            <Typography className="mythic-font-weight-bold" variant="body2">{field.label}</Typography>
            <Typography color="text.secondary" variant="caption">{field.description}</Typography>
            <Typography className={styles.usedBy} color="text.secondary" variant="caption">
                Used by: {field.usedBy.join(", ")}
            </Typography>
            <code className={`${styles.tokenPath} mythic-font-size-xs mythic-break-anywhere`}>{field.path}</code>
        </div>
        <div className={`${styles.modeControls} mythic-grid mythic-min-width-0`}>
            <ModeColorControl appearance={appearance} field={field} mode="dark" onChange={onChange} />
            <ModeColorControl appearance={appearance} field={field} mode="light" onChange={onChange} />
        </div>
    </div>
);

const BackgroundImageControl = ({appearance, field, onChange, onSelect, selected}) => {
    const image = getAppearanceValue(appearance, field.path);
    const {mode} = field;
    const onFileChange = (event) => {
        const file = event.target.files?.[0];
        if(!file){
            return;
        }
        const reader = new FileReader();
        reader.onload = ({target}) => onChange(field.path, normalizeAppearanceBackgroundImage(target.result));
        reader.readAsDataURL(file);
        event.target.value = "";
    };
    return (
        <div
            className={`${styles.imageControl} mythic-overflow-hidden`}
            data-mythic-color-scheme={mode}
            data-selected={selected || undefined}
            onClick={onSelect}
            onFocusCapture={onSelect}
        >
            <div className={`${styles.imageActions} mythic-gap-sm mythic-align-center mythic-flex`}>
                <Typography className={`${styles.imageLabel} mythic-font-weight-bold`} variant="body2">{field.label}</Typography>
                <Button component="label" size="small" startIcon={<UploadIcon />} variant="outlined">
                    Upload
                    <input accept="image/*" hidden onChange={onFileChange} type="file" />
                </Button>
                <Button disabled={!image} onClick={() => onChange(field.path, field.defaultValue)} size="small" variant="outlined">
                    Remove
                </Button>
            </div>
            <div className={styles.imagePreview} style={{backgroundImage: image || "none"}} />
        </div>
    );
};

const ScalarAppearanceField = ({appearance, field, onChange, onSelect, selected}) => {
    const value = getAppearanceValue(appearance, field.path);
    const isFontSize = field.type === "fontSize";
    return (
        <div
            className={`${styles.field} mythic-align-center mythic-grid`}
            data-selected={selected || undefined}
            onClick={onSelect}
            onFocusCapture={onSelect}
        >
            <div className={`${styles.fieldDescription} mythic-min-width-0`}>
                <Typography className="mythic-font-weight-bold" variant="body2">{field.label}</Typography>
                <Typography color="text.secondary" variant="caption">{field.description}</Typography>
                <Typography className={styles.usedBy} color="text.secondary" variant="caption">
                    Used by: {field.usedBy.join(", ")}
                </Typography>
                <code className={`${styles.tokenPath} mythic-font-size-xs mythic-break-anywhere`}>{field.path}</code>
            </div>
            <div className={`${styles.scalarControl} mythic-align-start mythic-gap-sm mythic-grid`}>
                <TextField
                    fullWidth
                    inputProps={isFontSize ? {min: 10, max: 24, step: 1} : undefined}
                    multiline={!isFontSize}
                    onChange={(event) => onChange(field.path, isFontSize ? Number(event.target.value) : event.target.value)}
                    size="small"
                    type={isFontSize ? "number" : "text"}
                    value={value}
                />
                <Button
                    disabled={value === field.defaultValue}
                    onClick={() => onChange(field.path, field.defaultValue)}
                    size="small"
                    startIcon={<RestartAltIcon />}
                    variant="outlined"
                >
                    Reset
                </Button>
            </div>
        </div>
    );
};

export const AppearanceEditor = ({appearance, onChange}) => {
    const [search, setSearch] = React.useState("");
    const [selectedPath, setSelectedPath] = React.useState("colors.table.hover");
    const deferredAppearance = React.useDeferredValue(appearance);
    const previewTheme = React.useMemo(() => createMythicTheme(deferredAppearance), [deferredAppearance]);
    const query = search.trim().toLowerCase();
    const visibleGroups = React.useMemo(() => appearanceFieldGroups.map((group) => ({
        ...group,
        fields: group.fields.filter((field) => !query || [
            field.label,
            field.description,
            field.path,
            ...field.usedBy,
        ].some((value) => value.toLowerCase().includes(query))),
    })).filter((group) => group.fields.length > 0), [query]);

    const onColorChange = (path, mode, value) => onChange(updateAppearanceValue(appearance, `${path}.${mode}`, value));
    const onScalarChange = (path, value) => onChange(updateAppearanceValue(appearance, path, value));
    const selectedField = appearanceFieldGroups.flatMap((group) => group.fields)
        .find((field) => field.path === selectedPath) || appearanceFieldGroups[0].fields[0];

    return (
        <section className={`${styles.root} mythic-full-width`}>
            <header className={`${styles.header} mythic-grid`}>
                <div>
                    <Typography variant="h5">Appearance</Typography>
                    <Typography color="text.secondary" variant="body2">
                        Draft changes stay inside these previews until you select Update.
                    </Typography>
                </div>
                <TextField
                    aria-label="Search appearance controls"
                    InputProps={{startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>}}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search colors or where they are used"
                    size="small"
                    value={search}
                />
            </header>

            <div className={`${styles.editorLayout} mythic-grid`}>
              <div className="mythic-min-width-0">
                {visibleGroups.map((group) => (
                <section className={styles.group} key={group.id}>
                    <div className={styles.groupHeader}>
                        <Typography variant="h6">{group.label}</Typography>
                        <Typography color="text.secondary" variant="caption">{group.description}</Typography>
                    </div>
                    <div className={`${styles.fieldList} mythic-border-radius-lg mythic-overflow-hidden`}>
                        {group.fields.map((field) => field.type === "color" ? (
                            <AppearanceField
                                appearance={appearance}
                                field={field}
                                key={field.path}
                                onChange={onColorChange}
                                onSelect={() => setSelectedPath(field.path)}
                                selected={selectedField.path === field.path}
                            />
                        ) : field.type === "image" ? (
                            <BackgroundImageControl
                                appearance={appearance}
                                field={field}
                                key={field.path}
                                onChange={onScalarChange}
                                onSelect={() => setSelectedPath(field.path)}
                                selected={selectedField.path === field.path}
                            />
                        ) : (
                            <ScalarAppearanceField
                                appearance={appearance}
                                field={field}
                                key={field.path}
                                onChange={onScalarChange}
                                onSelect={() => setSelectedPath(field.path)}
                                selected={selectedField.path === field.path}
                            />
                        ))}
                    </div>
                </section>
                ))}

                {visibleGroups.length === 0 && (
                <Typography className={styles.noResults} color="text.secondary">
                    No appearance controls match “{search}”.
                </Typography>
                )}

              </div>
              <aside className={`${styles.previewPanel} mythic-gap-sm mythic-border-radius-lg mythic-flex mythic-flex-column`}>
                  <Typography variant="overline">Selected control</Typography>
                  <Typography variant="h6">{selectedField.label}</Typography>
                  <Typography color="text.secondary" variant="caption">{selectedField.description}</Typography>
                  <AppearancePreview kind={selectedField.preview} theme={previewTheme} />
                  <Typography className={styles.previewUsage} color="text.secondary" variant="caption">
                      Used by: {selectedField.usedBy.join(", ")}
                  </Typography>
              </aside>
            </div>
        </section>
    );
};
