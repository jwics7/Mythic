import TableCell from '@mui/material/TableCell';
import React from 'react';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TableRow from '@mui/material/TableRow';
import Switch from '@mui/material/Switch';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import Typography from '@mui/material/Typography';
import {GetMythicSetting, useSetMythicSetting} from "../../MythicComponents/MythicSavedUserSetting";
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Input from '@mui/material/Input';
import {normalizeTaskingDisplayFields, operatorSettingDefaults, taskingContextFieldsOptions, taskingDisplayFieldOptions, taskTimestampDisplayFieldOptions} from "../../../cache";
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import {MythicStyledTooltip} from "../../MythicComponents/MythicStyledTooltip";
import {snackActions} from "../../utilities/Snackbar";
import {userSettingsQuery} from "../../App";
import {copyStringToClipboard} from "../../utilities/Clipboard";
import {useLazyQuery } from '@apollo/client';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {MythicDialog} from "../../MythicComponents/MythicDialog";
import {
    MythicDialogBody,
    MythicDialogButton,
    MythicDialogFooter,
    MythicDialogSection,
} from "../../MythicComponents/MythicDialogLayout";
import {MythicDraggablePortal, reorder} from "../../MythicComponents/MythicDraggableList";
import {MythicActionButton} from "../../MythicComponents/MythicContent";
import {
    Draggable,
    DragDropContext,
    Droppable,
} from "@hello-pangea/dnd";
import {appearanceColorFields, appearanceDefaults, resolveAppearance, updateAppearanceValue} from "../../../themes/appearance";
import {AppearanceEditor} from "./AppearanceEditor";
import {MythicCluster, MythicStack, MythicGrid, MythicTruncatedText} from "../../MythicComponents/MythicLayout";

const interactTypeOptions = [
    {value: "interact", display: "Accordions"},
    {value: "interactSplit", display: "Split View"},
    {value: "interactConsole", display: "Console Like"}
];
const getTaskingDisplayOption = (fieldName) => {
    return taskingDisplayFieldOptions.find((option) => option.name === fieldName);
}
const getTaskingDisplayLayoutItems = (visibleFields) => {
    const visibleSet = new Set(visibleFields);
    const orderedVisibleItems = visibleFields.reduce((prev, fieldName) => {
        const option = getTaskingDisplayOption(fieldName);
        if(option){
            return [...prev, {...option, visible: true}];
        }
        return prev;
    }, []);
    const hiddenItems = taskingDisplayFieldOptions.reduce((prev, option) => {
        if(visibleSet.has(option.name)){
            return prev;
        }
        return [...prev, {...option, visible: false}];
    }, []);
    return [...orderedVisibleItems, ...hiddenItems];
}
const TaskingMetadataSummary = ({value, onChange}) => {
    const [openLayoutDialog, setOpenLayoutDialog] = React.useState(false);
    const selectedOptions = value.map(getTaskingDisplayOption).filter(Boolean);
    const hiddenCount = taskingDisplayFieldOptions.length - selectedOptions.length;
    const onSubmitLayout = (items) => {
        onChange(normalizeTaskingDisplayFields(items.reduce((prev, item) => {
            if(item.visible){
                return [...prev, item.name];
            }
            return prev;
        }, [])));
        setOpenLayoutDialog(false);
    }
    return (
        <>
            <MythicGrid gap="md" columns="custom" className="mythic-tasking-visibility-panel mythic-tasking-visibility-summary-panel mythic-flex mythic-border mythic-flex-column mythic-border-radius">
                <Box>
                    <Typography component="div" className="mythic-tasking-visibility-title mythic-font-weight-extra-bold mythic-font-size-body mythic-line-height-snug mythic-text-primary">
                        Tasking metadata
                    </Typography>
                    <Typography component="div" className="mythic-tasking-visibility-description mythic-font-size-small mythic-line-height-normal mythic-text-secondary">
                        Selected chips appear in this order above task commands.
                    </Typography>
                </Box>
                <MythicCluster gap="sm" justify="end" className="mythic-tasking-visibility-summary-actions">
                    <Typography component="div" className="mythic-tasking-visibility-count mythic-nowrap mythic-font-weight-extra-bold mythic-font-size-caption mythic-text-info mythic-line-height-compact mythic-border-radius">
                        {selectedOptions.length} shown{hiddenCount > 0 ? `, ${hiddenCount} hidden` : ""}
                    </Typography>
                    <MythicActionButton tone="neutral"
                        className="mythic-tasking-visibility-manage-button"
                        onClick={() => setOpenLayoutDialog(true)}
                        size="small"
                        variant="outlined"
                    >
                        Manage
                    </MythicActionButton>
                </MythicCluster>
                <MythicCluster gap="xs" fill className="mythic-tasking-visibility-chip-row mythic-grid-span-full">
                    {selectedOptions.length > 0 ? (
                        selectedOptions.map((option, index) => (
                            <MythicCluster component="span" gap="xs" inline wrap={false} className="mythic-tasking-visibility-chip mythic-font-weight-strong mythic-line-height-tight mythic-font-size-small mythic-text-primary mythic-border-radius" key={option.name}>
                                <MythicCluster component="span" gap="none" justify="center" inline wrap={false} className="mythic-tasking-visibility-chip-index mythic-font-weight-heavy mythic-font-size-xs mythic-border-radius">{index + 1}</MythicCluster>
                                {option.display}
                            </MythicCluster>
                        ))
                    ) : (
                        <Typography component="div" className="mythic-tasking-visibility-empty mythic-font-size-small mythic-text-secondary">
                            No tasking metadata selected.
                        </Typography>
                    )}
                </MythicCluster>
            </MythicGrid>
            {openLayoutDialog &&
                <MythicDialog
                    open={openLayoutDialog}
                    onClose={() => setOpenLayoutDialog(false)}
                    maxWidth="sm"
                    innerDialog={
                        <TaskingMetadataLayoutDialog
                            initialItems={getTaskingDisplayLayoutItems(value)}
                            onClose={() => setOpenLayoutDialog(false)}
                            onReset={() => onSubmitLayout(getTaskingDisplayLayoutItems(operatorSettingDefaults.taskingDisplayFields))}
                            onSubmit={onSubmitLayout}
                        />
                    }
                />
            }
        </>
    )
}
const TaskingMetadataLayoutDialog = ({initialItems, onClose, onReset, onSubmit}) => {
    const [items, setItems] = React.useState(initialItems);
    const onDragEnd = ({destination, source}) => {
        if(!destination){
            return;
        }
        setItems(reorder(items, source.index, destination.index));
    }
    const onToggleVisibility = (index) => {
        setItems(items.map((item, itemIndex) => {
            if(itemIndex === index){
                return {...item, visible: !item.visible};
            }
            return item;
        }));
    }
    return (
        <>
            <DialogTitle id="form-dialog-title">Tasking Metadata Layout</DialogTitle>
            <DialogContent dividers={true} sx={{p: 0, overflow: "hidden"}}>
                <MythicDialogBody sx={{height: "min(70vh, 38rem)", p: 1}}>
                    <MythicDialogSection
                        title="Metadata Chips"
                        description="Drag to set display order. Toggle visibility to choose what appears in tasking."
                        sx={{display: "flex", flexDirection: "column", flex: "1 1 auto", minHeight: 0}}
                    >
                        <TaskingMetadataDraggableList
                            items={items}
                            onDragEnd={onDragEnd}
                            onToggleVisibility={onToggleVisibility}
                        />
                    </MythicDialogSection>
                </MythicDialogBody>
            </DialogContent>
            <MythicDialogFooter>
                <MythicDialogButton onClick={onClose}>
                    Cancel
                </MythicDialogButton>
                <MythicDialogButton onClick={onReset} intent="warning">
                    Reset
                </MythicDialogButton>
                <MythicDialogButton onClick={() => onSubmit(items)} intent="primary">
                    Save
                </MythicDialogButton>
            </MythicDialogFooter>
        </>
    )
}
const TaskingMetadataDraggableList = ({items, onDragEnd, onToggleVisibility}) => {
    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="tasking-metadata-layout-list">
                {(provided) => (
                    <MythicStack component="div" gap="sm" scroll className="mythic-reorder-list mythic-flex-fill" ref={provided.innerRef} {...provided.droppableProps}>
                        {items.map((item, index) => (
                            <TaskingMetadataDraggableListItem
                                item={item}
                                index={index}
                                key={item.name}
                                onToggleVisibility={onToggleVisibility}
                            />
                        ))}
                        {provided.placeholder}
                    </MythicStack>
                )}
            </Droppable>
        </DragDropContext>
    )
}
const TaskingMetadataDraggableListItem = ({item, index, onToggleVisibility}) => {
    return (
        <Draggable draggableId={item.name} index={index}>
            {(provided, snapshot) => {
                const row = (
                    <div
                        ref={provided.innerRef}
                        className={`mythic-reorder-row mythic-gap-sm mythic-tasking-metadata-row mythic-flex mythic-min-width-0 mythic-align-center mythic-surface-raised mythic-border mythic-border-radius mythic-text-primary mythic-flex-fixed mythic-full-width${snapshot.isDragging ? " mythic-reorder-row-dragging" : ""}${item.visible ? "" : " mythic-reorder-row-disabled"}`}
                        {...provided.draggableProps}
                    >
                        <MythicCluster component="span" gap="none" justify="center" inline wrap={false} className="mythic-reorder-drag-handle mythic-border mythic-border-radius mythic-text-secondary" {...provided.dragHandleProps}>
                            <DragHandleIcon fontSize="small" />
                        </MythicCluster>
                        <MythicCluster component="div" gap="sm" align="center" wrap={false} fill className="mythic-reorder-row-main">
                            <MythicTruncatedText component="span" className="mythic-reorder-row-title mythic-font-size-small mythic-font-weight-strong mythic-line-height-snug">{item.display}</MythicTruncatedText>
                            <MythicTruncatedText component="span" className="mythic-reorder-row-description mythic-font-size-caption mythic-font-weight-medium mythic-line-height-snug mythic-text-secondary">{item.description}</MythicTruncatedText>
                        </MythicCluster>
                        <MythicCluster component="div" gap="xs" align="center" wrap={false} className="mythic-reorder-row-actions mythic-flex-fixed">
                            <MythicActionButton iconOnly tone={item.visible ? "error" : "info"}
                                aria-label={item.visible ? `Hide ${item.display}` : `Show ${item.display}`}
                                size="small"
                                onClick={() => onToggleVisibility(index)}
                            >
                                {item.visible ? (
                                    <VisibilityIcon fontSize="small" />
                                ) : (
                                    <VisibilityOffIcon fontSize="small" />
                                )}
                            </MythicActionButton>
                        </MythicCluster>
                    </div>
                );
                return (
                    <MythicDraggablePortal isDragging={snapshot.isDragging}>
                        {row}
                    </MythicDraggablePortal>
                );
            }}
        </Draggable>
    )
}
export function SettingsOperatorUIConfigDialog(props) {
    const fileInputRef = React.useRef(null);
    const [getUserPreferences] = useLazyQuery(userSettingsQuery, {
        fetchPolicy: "no-cache",
        onCompleted: (data) => {
            //console.log("got preferences", data.getOperatorPreferences.preferences)
            if(data.getOperatorPreferences.status === "success"){
                let settingString = JSON.stringify(data.getOperatorPreferences.preferences, null, 4);
                copyStringToClipboard(settingString);
                snackActions.info("Copied settings to clipboard");
            } else {
                snackActions.error(`Failed to get user preferences:\n${data.getOperatorPreferences.error}`);
            }
        },
        onError: (error) => {
            console.log(error);
            snackActions.error(error.message);
        }
    })
    const [getUserAppearancePreferences] = useLazyQuery(userSettingsQuery, {
        fetchPolicy: "no-cache",
        onCompleted: (data) => {
            //console.log("got preferences", data.getOperatorPreferences.preferences)
            if(data.getOperatorPreferences.status === "success"){
                let settingString = JSON.stringify({appearance: data.getOperatorPreferences.preferences?.appearance}, null, 4);
                copyStringToClipboard(settingString);
                snackActions.info("Copied appearance settings to clipboard");
            } else {
                snackActions.error(`Failed to get user preferences:\n${data.getOperatorPreferences.error}`);
            }
        },
        onError: (error) => {
            console.log(error);
            snackActions.error(error.message);
        }
    })

    const initialLocalStorageInteractType = GetMythicSetting({setting_name: 'interactType', default_value: operatorSettingDefaults.interactType});
    const [interactType, setInteractType] = React.useState(initialLocalStorageInteractType);

    const initialAppearance = GetMythicSetting({setting_name: "appearance", default_value: appearanceDefaults});
    const [appearance, setAppearance] = React.useState(() => resolveAppearance(initialAppearance));

    const initialShowMediaValue = GetMythicSetting({setting_name: "showMedia", default_value: operatorSettingDefaults.showMedia});
    const [showMedia, setShowMedia] = React.useState(initialShowMediaValue);

    const initialTaskingDisplayFields = normalizeTaskingDisplayFields(GetMythicSetting({setting_name: "taskingDisplayFields", default_value: operatorSettingDefaults.taskingDisplayFields}));
    const [taskingDisplayFields, setTaskingDisplayFields] = React.useState(initialTaskingDisplayFields);

    const initialUseDisplayParamsForCLIHistory = GetMythicSetting({setting_name: "useDisplayParamsForCLIHistory", default_value: operatorSettingDefaults.useDisplayParamsForCLIHistory});
    const [useDisplayParamsForCLIHistory, setUseDisplayParamsForCLIHistory] = React.useState(initialUseDisplayParamsForCLIHistory);

    const initialTaskTimestampDisplayField = GetMythicSetting({setting_name: "taskTimestampDisplayField", default_value: operatorSettingDefaults.taskTimestampDisplayField});
    const [taskTimestampDisplayField, setTaskTimestampDisplayField] = React.useState(initialTaskTimestampDisplayField);

    const initialHideBrowserTasking = GetMythicSetting({setting_name: "hideBrowserTasking", default_value: operatorSettingDefaults.hideBrowserTasking});
    const [hideBrowserTasking, setHideBrowserTasking] = React.useState(initialHideBrowserTasking);

    const initialHideTaskingContext = GetMythicSetting({setting_name: "hideTaskingContext", default_value: operatorSettingDefaults.hideTaskingContext});
    const [hideTaskingContext, setHideTaskingContext] = React.useState(initialHideTaskingContext);

    const initialTaskingContextField = GetMythicSetting({setting_name: "taskingContextFields", default_value: operatorSettingDefaults.taskingContextFields});
    const [taskingContextFields, setTaskingContextFields] = React.useState(initialTaskingContextField);

    const initialShowOPSECBypassUsername = GetMythicSetting({setting_name: "showOPSECBypassUsername", default_value: operatorSettingDefaults.showOPSECBypassUsername});
    const [showOPSECBypassUsername, setShowOPSECBypassUsername] = React.useState(initialShowOPSECBypassUsername);

    const [resumeNotifications, setResumeNotifications] = React.useState(false);
    const [, updateSettings, clearSettings] = useSetMythicSetting();
    const onHideBrowserTaskingChanged = (evt) => {
        setHideBrowserTasking(!hideBrowserTasking);
    }
    const onShowOPSECBypassUsernameChanged = (evt) => {
        setShowOPSECBypassUsername(!showOPSECBypassUsername);
    }
    const onHideTaskingContextChanged = (evt) => {
        setHideTaskingContext(!hideTaskingContext);
    }
    const onShowMediaChanged = (evt) => {
        setShowMedia(!showMedia);
    }
    const onResumeNotifications = (evt) => {
        setResumeNotifications(!resumeNotifications);
    }
    const onChangeInteractType = (evt) => {
        setInteractType(evt.target.value);
    }
    const onChangeTaskTimestampDisplayField = (evt) => {
        setTaskTimestampDisplayField(evt.target.value);
    }
    const onChangeUseDisplayParamsForCLIHistory = (evt) => {
        setUseDisplayParamsForCLIHistory(!useDisplayParamsForCLIHistory);
    }
    const onChangeTaskingContextFields = (evt) => {
        setTaskingContextFields(evt.target.value);
    }
    const onAccept = () => {
      if(resumeNotifications){
          localStorage.setItem("dnd", JSON.stringify({
              "doNotDisturb": false,
              "doNotDisturbTimeStart": new Date(),
              "doNotDisturbMinutes": 0
          }))
      }
      updateSettings({settings: {
              taskingDisplayFields: normalizeTaskingDisplayFields(taskingDisplayFields),
              appearance: resolveAppearance(appearance),
              showMedia,
              interactType,
              useDisplayParamsForCLIHistory,
              taskTimestampDisplayField,
              hideBrowserTasking,
              hideTaskingContext,
              taskingContextFields,
              showOPSECBypassUsername
      }});
      snackActions.success("updating settings");
      props.onClose();
    }
    const setDefaults = () => {
      setAppearance(resolveAppearance(appearanceDefaults));
      setTaskingDisplayFields(operatorSettingDefaults.taskingDisplayFields);
      setShowMedia(operatorSettingDefaults.showMedia);
      setInteractType(operatorSettingDefaults.interactType);
      setUseDisplayParamsForCLIHistory(operatorSettingDefaults.useDisplayParamsForCLIHistory);
      setResumeNotifications(false);
      setTaskTimestampDisplayField(operatorSettingDefaults.taskTimestampDisplayField);
      setHideBrowserTasking(operatorSettingDefaults.hideBrowserTasking);
      setHideTaskingContext(operatorSettingDefaults.hideTaskingContext);
      setTaskingContextFields(operatorSettingDefaults.taskingContextFields);
      setShowOPSECBypassUsername(operatorSettingDefaults.showOPSECBypassUsername);
    }
    const clearAllUserSettings = () => {
        clearSettings();
        props.onClose();
    }
    const setColorDefaults = (mode) => {
        const withColors = appearanceColorFields.reduce((nextAppearance, field) => updateAppearanceValue(
            nextAppearance,
            `${field.path}.${mode}`,
            field.path.split(".").reduce((value, key) => value[key], appearanceDefaults)[mode],
        ), appearance);
        setAppearance(updateAppearanceValue(withColors, `backgroundImage.${mode}`, appearanceDefaults.backgroundImage[mode]));
    }
    const onFileChange = async (evt) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const contents = e.target.result;
            try{
                let jsonData = JSON.parse(String(contents));
                if(jsonData.appearance){
                    setAppearance(resolveAppearance(jsonData.appearance));
                }
                if(jsonData.taskingDisplayFields){
                    setTaskingDisplayFields(normalizeTaskingDisplayFields(jsonData.taskingDisplayFields));
                }
                if(typeof jsonData.showMedia === "boolean") setShowMedia(jsonData.showMedia);
                if(typeof jsonData.interactType === "string") setInteractType(jsonData.interactType);
                if(typeof jsonData.useDisplayParamsForCLIHistory === "boolean") setUseDisplayParamsForCLIHistory(jsonData.useDisplayParamsForCLIHistory);
                if(typeof jsonData.taskTimestampDisplayField === "string") setTaskTimestampDisplayField(jsonData.taskTimestampDisplayField);
                if(typeof jsonData.hideBrowserTasking === "boolean") setHideBrowserTasking(jsonData.hideBrowserTasking);
                if(typeof jsonData.hideTaskingContext === "boolean") setHideTaskingContext(jsonData.hideTaskingContext);
                if(Array.isArray(jsonData.taskingContextFields)) setTaskingContextFields(jsonData.taskingContextFields);
                if(typeof jsonData.showOPSECBypassUsername === "boolean") setShowOPSECBypassUsername(jsonData.showOPSECBypassUsername);
                snackActions.info("Imported settings into this draft. Select Update to save them.");
            }catch(error){
                console.log(error);
                snackActions.error("Failed to parse file as JSON");
            }
        }
        reader.readAsBinaryString(evt.target.files[0]);
    }

    const getCurrentPreferences = () => {
        getUserPreferences();
    }
    const getCurrentAppearancePreferences = () => {
        getUserAppearancePreferences();
    }
  return (
    <React.Fragment>
        <DialogTitle id="form-dialog-title">
            <MythicCluster gap="md" align="start" justify="between" className="mythic-dialog-title-row mythic-ui-settings-title-row">
                <MythicStack gap="none" className="mythic-ui-settings-title-copy">
                    <Typography component="div" className="mythic-ui-settings-title mythic-font-weight-strong mythic-line-height-snug mythic-text-primary">
                        Configure UI Settings
                    </Typography>
                    <Typography variant={"body2"} className="mythic-ui-settings-subtitle mythic-line-height-normal mythic-text-secondary">
                        Appearance uses a structured, searchable light and dark theme schema.
                    </Typography>
                </MythicStack>
                <MythicCluster gap="sm" justify="end" className="mythic-ui-settings-title-actions">
                    <MythicStyledTooltip title={"Copy all preferences as JSON"}>
                        <MythicActionButton tone="info"
                            className="mythic-ui-settings-title-button"
                            onClick={getCurrentPreferences}
                            size="small"
                            variant="outlined"
                            startIcon={<CloudDownloadIcon fontSize="small" />}
                        >
                            Export
                        </MythicActionButton>
                    </MythicStyledTooltip>
                    <MythicStyledTooltip title={"Copy appearance preferences as JSON"}>
                        <MythicActionButton tone="info"
                            className="mythic-ui-settings-title-button"
                            onClick={getCurrentAppearancePreferences}
                            size="small"
                            variant="outlined"
                            startIcon={
                                <ColorLensIcon fontSize="small" />
                            }
                        >
                            Export Appearance
                        </MythicActionButton>
                    </MythicStyledTooltip>
                    <MythicStyledTooltip title={"Import preferences from a JSON file"}>
                        <MythicActionButton tone="success"
                            className="mythic-ui-settings-title-button"
                            onClick={()=>fileInputRef.current.click()}
                            size="small"
                            variant="outlined"
                            startIcon={<CloudUploadIcon fontSize="small" />}
                        >
                            Import
                            <input ref={fileInputRef} onChange={onFileChange} type="file" hidden />
                        </MythicActionButton>
                    </MythicStyledTooltip>
                </MythicCluster>
            </MythicCluster>
        </DialogTitle>
        <TableContainer className="mythicElement" style={{paddingLeft: "10px", paddingRight: "10px"}}>
          <Table size="small" style={{ "maxWidth": "100%", "overflow": "scroll"}}>
              <TableBody>
                  
                  <TableRow>
                      <TableCell colSpan={2} style={{paddingTop: "16px", paddingBottom: "16px"}}>
                          <TaskingMetadataSummary value={taskingDisplayFields} onChange={setTaskingDisplayFields} />
                      </TableCell>
                  </TableRow>
                  <TableRow hover>
                      <TableCell>Automatically show Media in Browser scripts</TableCell>
                      <TableCell>
                          <Switch
                              checked={showMedia}
                              onChange={onShowMediaChanged}
                              color="info"
                              inputProps={{ 'aria-label': 'info checkbox' }}
                              name="show_media"
                          />
                      </TableCell>
                  </TableRow>
                  <TableRow hover>
                      <TableCell>Resume Info/Warning Notifications</TableCell>
                      <TableCell>
                          <Switch
                              checked={resumeNotifications}
                              onChange={onResumeNotifications}
                              color="info"
                              inputProps={{ 'aria-label': 'info checkbox' }}
                              name="resumeNotifications"
                          />
                      </TableCell>
                  </TableRow>
                  <TableRow hover>
                      <TableCell>Show Display Parameters in CLI History</TableCell>
                      <TableCell>
                          <Switch
                              checked={useDisplayParamsForCLIHistory}
                              onChange={onChangeUseDisplayParamsForCLIHistory}
                              color="info"
                              inputProps={{ 'aria-label': 'info checkbox' }}
                              name="use display params"
                          />
                      </TableCell>
                  </TableRow>
                  <TableRow hover>
                      <TableCell>
                          Choose default type of tasking display
                      </TableCell>
                      <TableCell>
                          <Select
                              labelId="demo-dialog-select-label"
                              id="demo-dialog-select"
                              value={interactType}
                              onChange={onChangeInteractType}
                              input={<Input style={{width: "100%"}}/>}
                          >
                              {interactTypeOptions.map( (opt) => (
                                  <MenuItem value={opt.value} key={opt.value}>{opt.display}</MenuItem>
                              ) )}
                          </Select>
                      </TableCell>
                  </TableRow>
                  <TableRow hover>
                      <TableCell>
                          Choose Which Timestamp to display for Tasks
                      </TableCell>
                      <TableCell>
                          <Select
                              labelId="demo-dialog-select-label"
                              id="demo-dialog-select"
                              value={taskTimestampDisplayField}
                              onChange={onChangeTaskTimestampDisplayField}
                              input={<Input style={{width: "100%"}}/>}
                          >
                              {taskTimestampDisplayFieldOptions.map( (opt) => (
                                  <MenuItem value={opt.name} key={opt.name}>{opt.display}</MenuItem>
                              ) )}
                          </Select>
                      </TableCell>
                  </TableRow>
                  <TableRow hover>
                      <TableCell>Hide Browser-based Tasking</TableCell>
                      <TableCell>
                          <Switch
                              checked={hideBrowserTasking}
                              onChange={onHideBrowserTaskingChanged}
                              color="info"
                              inputProps={{ 'aria-label': 'info checkbox' }}
                              name="hideBrowserTasking"
                          />
                      </TableCell>
                  </TableRow>
                  <TableRow hover>
                      <TableCell>Show OPSEC Bypass Approvers</TableCell>
                      <TableCell>
                          <Switch
                              checked={showOPSECBypassUsername}
                              onChange={onShowOPSECBypassUsernameChanged}
                              color="info"
                              inputProps={{ 'aria-label': 'info checkbox' }}
                              name="showOPSECBypassUsername"
                          />
                      </TableCell>
                  </TableRow>
                  <TableRow hover>
                      <TableCell>Hide Tasking Context Tabs</TableCell>
                      <TableCell>
                          <Switch
                              checked={hideTaskingContext}
                              onChange={onHideTaskingContextChanged}
                              color="info"
                              inputProps={{ 'aria-label': 'info checkbox' }}
                              name="hideTaskingContext"
                          />
                      </TableCell>
                  </TableRow>
                  <TableRow hover>
                      <TableCell>Tasking Context Fields</TableCell>
                      <TableCell>
                          <Select
                              multiple={true}
                              value={taskingContextFields}
                              onChange={onChangeTaskingContextFields}
                              input={<Input style={{width: "100%"}}/>}
                          >
                              {taskingContextFieldsOptions.map( (opt) => (
                                  <MenuItem value={opt} key={opt}>{opt}</MenuItem>
                              ) )}
                          </Select>
                      </TableCell>
                  </TableRow>
                  <TableRow>
                      <TableCell colSpan={2} style={{paddingTop: "16px", paddingBottom: "16px"}}>
                          <AppearanceEditor appearance={appearance} onChange={setAppearance} />
                      </TableCell>
                  </TableRow>
              </TableBody>
          </Table>
        </TableContainer>
        <DialogActions>
            <Button onClick={props.onClose} variant="contained" color="primary">
                Cancel
            </Button>
            <Button onClick={clearAllUserSettings} variant="contained" color="error">
                Clear ALL User Settings
            </Button>
            <Button onClick={setDefaults} variant="contained" color="warning">
                Reset ALL
            </Button>
            <Button onClick={() => setColorDefaults("dark")} variant={"contained"} color={"info"}>Reset Dark Mode</Button>
            <Button onClick={() => setColorDefaults("light")} variant={"contained"} color={"info"}>Reset Light Mode</Button>
            <Button onClick={onAccept} variant="contained" color="success">
                Update
            </Button>
        </DialogActions>
    </React.Fragment>
  );
}
