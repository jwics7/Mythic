import {useMythicTokens} from '../../../themes/MythicThemeProvider';
import React, {useEffect, useRef} from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import AceEditor from 'react-ace';
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/ext-searchbox";

import { gql, useQuery, useLazyQuery } from '@apollo/client';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import Tooltip from '@mui/material/Tooltip';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Split from 'react-split';
import {TaskDisplay} from "../Callbacks/TaskDisplay";
import {taskingDataFragment} from '../Callbacks/CallbackMutations'
import {
    MythicDialogBody,
    MythicDialogButton,
    MythicDialogFooter,
    MythicFormField,
    MythicFormGrid,
    MythicFormNote
} from "../../MythicComponents/MythicDialogLayout";
import {MythicEmptyState, MythicLoadingState} from "../../MythicComponents/MythicStateDisplay";
import {MythicCluster, MythicStack} from "../../MythicComponents/MythicLayout";
import {MythicPanel} from "../../MythicComponents/MythicContent";

const BrowserScriptPane = ({children, className = "", meta, title}) => (
    <MythicPanel component="section" density="flush" layout="stack" overflow="hidden" tone="raised" className={`mythic-browser-script-pane mythic-min-height-0 mythic-full-height ${className}`.trim()}>
        <MythicCluster component="header" gap="none" align="center" justify="between" wrap={false} className="mythic-browser-script-pane-header mythic-divider-bottom mythic-font-size-small mythic-font-weight-extra-bold mythic-letter-spacing-reset mythic-flex-fixed mythic-text-primary mythic-surface-muted">
            <span>{title}</span>
            <span>{meta}</span>
        </MythicCluster>
        {children}
    </MythicPanel>
);


const getCommandsAndPayloadTypesQuery = gql`
query getCommandsAndPayloadTypes{
  payloadtype(where: {deleted: {_eq: false}, wrapper: {_eq: false}}, order_by: {name: asc}){
    id
    name
    commands(order_by: {cmd: asc}){
      id
      cmd
    }
  }
}
`;
const getExistingTasksForCommand = gql`
${taskingDataFragment}
query getAvailableTasks($command_id: Int!){
    task(order_by: {display_id: desc}, where: {command_id: {_eq: $command_id}}) {
        ...taskData
  }
}
`;

const BROWSER_SCRIPT_WORKBENCH_SPLIT_KEY = "browserScriptWorkbenchSplitSizes";
const BROWSER_SCRIPT_TOP_SPLIT_KEY = "browserScriptTopSplitSizes";
const defaultWorkbenchSplitSizes = [48, 52];
const defaultTopSplitSizes = [68, 32];

const getStoredSplitSizes = (storageKey, fallback) => {
    try {
        if(typeof window === "undefined"){
            return fallback;
        }
        const storedSizes = window.localStorage.getItem(storageKey);
        if(!storedSizes){
            return fallback;
        }
        const parsedSizes = JSON.parse(storedSizes);
        if(!Array.isArray(parsedSizes) || parsedSizes.length !== fallback.length || !parsedSizes.every(Number.isFinite)){
            return fallback;
        }
        return parsedSizes;
    } catch (error) {
        return fallback;
    }
}

const storeSplitSizes = (storageKey, sizes) => {
    try {
        window.localStorage.setItem(storageKey, JSON.stringify(sizes));
    } catch (error) {
        // Best effort only; layout still works without persisted sizes.
    }
}

export function EditScriptDialog(props) {
    const theme = useMythicTokens();
    const [script, setScript] = React.useState("");
    const [selectedPayloadType, setSelectedPayloadType] = React.useState('');
    const [selectedCommand, setSelectedCommand] = React.useState('');
    const [payloadTypeCmdOptions, setPayloadTypeCmdOptions] = React.useState([]);
    const [commandOptions, setCommandOptions] = React.useState([]);
    const [availableTasks, setAvailableTasks] = React.useState([]);
    const [selectedTask, setSelectedTask] = React.useState('');
    const [workbenchSplitSizes, setWorkbenchSplitSizes] = React.useState(() => getStoredSplitSizes(BROWSER_SCRIPT_WORKBENCH_SPLIT_KEY, defaultWorkbenchSplitSizes));
    const [topSplitSizes, setTopSplitSizes] = React.useState(() => getStoredSplitSizes(BROWSER_SCRIPT_TOP_SPLIT_KEY, defaultTopSplitSizes));
    const [targetOpen, setTargetOpen] = React.useState(() => props.new === true);
    const selectedPayloadTypeOption = React.useMemo(() => {
        return payloadTypeCmdOptions.find((payloadType) => payloadType.id === selectedPayloadType);
    }, [payloadTypeCmdOptions, selectedPayloadType]);
    const selectedCommandOption = React.useMemo(() => {
        return commandOptions.find((command) => command.id === selectedCommand);
    }, [commandOptions, selectedCommand]);
    const taskSelectorValue = selectedTask || "";
    const {loading: targetLoading} = useQuery(getCommandsAndPayloadTypesQuery, {
      onCompleted: data => {
        setPayloadTypeCmdOptions(data.payloadtype);
        if(props.payload_type_id !== undefined){
          setSelectedPayloadType(props.payload_type_id);
        }else{
          if(data.payloadtype.length > 0){
            setSelectedPayloadType(data.payloadtype[0].id);
          }
        }
        if(props.command_id !== undefined){
          setSelectedCommand(props.command_id);
          const payloadType = data.payloadtype.find((payloadType) => payloadType.id === props.payload_type_id);
          setCommandOptions(payloadType?.commands || []);
        }else{
          if(data.payloadtype.length > 0){
            if(data.payloadtype[0].commands.length > 0){
              setCommandOptions(data.payloadtype[0].commands);
              setSelectedCommand(data.payloadtype[0].commands[0].id);
            }
          }
        }
      },
      onError: data => {

      }
    });
    const [getAvailableTasks, {loading: tasksLoading}] = useLazyQuery(getExistingTasksForCommand, {
        onCompleted: data => {
            setAvailableTasks(data.task);
            if(data.task.length > 0){
                setSelectedTask(data.task[0]);
            }else{
                setSelectedTask('');
            }
        },
        onError: data => {

        }
    });
    const editorRef = useRef(null);
    const outputRef = useRef(null);
    const [logOutput, setLogOutput] = React.useState("console.log messages:\n");
    const logStreamRef = React.useRef("console.log messages:\n");
    useEffect( () => {
        if(selectedCommand !== ""){
            getAvailableTasks({variables: {command_id: selectedCommand}})
        }else{
            setAvailableTasks([]);
            setSelectedTask('');
        }

    }, [selectedCommand, getAvailableTasks]);
    useEffect( () => {
        if(props.script !== undefined){
          try{
            //setScript(atob(props.script));
            setScript(decodeURIComponent(window.atob(props.script)));
          }catch(error){
            setScript(props.script);
          }
        }        
    }, [props.script]);
    const onChange = (value) => {
        setScript(value);
    }
    const onSubmit = () => {
        //let newScript = window.btoa(encodeURIComponent(script));
        //props.onSubmitEdit({script: newScript, command_id: selectedCommand, payload_type_id: selectedPayloadType});
        props.onSubmitEdit({script: script, command_id: selectedCommand, payload_type_id: selectedPayloadType});
        props.onClose();
    }
    const onTest = () => {
        //let newScript = window.btoa(encodeURIComponent(script));
        //props.onSubmitEdit({script: newScript, command_id: selectedCommand, payload_type_id: selectedPayloadType});
        props.onSubmitEdit({script: script, command_id: selectedCommand, payload_type_id: selectedPayloadType});
        logStreamRef.current = "console.log messages:\n";
        setLogOutput(logStreamRef.current);
    }
    const onRevert = () => {
        props.onRevert();
        props.onClose();
    }
    const onChangeSelectedPayloadType = (event) => {
      setSelectedPayloadType(event.target.value);
      const selectedPayload = payloadTypeCmdOptions.find( (p) => p.id === event.target.value);
      const cmds = selectedPayload?.commands || [];
      setCommandOptions(cmds);
      setSelectedCommand(cmds[0]?.id || '');
      setAvailableTasks([]);
      setSelectedTask('');
    }
    const onChangeTask = (event) => {
        setSelectedTask(event.target.value);
    }
    const onChangeSelectedCommand = (event) => {
      setSelectedCommand(event.target.value);
    }
    const onLoad = (editor) => {
        editorRef.current = editor;
        requestAnimationFrame(() => editor.resize());
    }
    const onOutputLoad = (editor) => {
        outputRef.current = editor;
        requestAnimationFrame(() => editor.resize());
    }
    React.useEffect( () => {
        const logBackup = console.log;
        const formatConsoleArg = (arg) => {
            if(typeof arg === "string"){
                return arg;
            }
            try {
                return JSON.stringify(arg, null, 2);
            } catch (error) {
                return String(arg);
            }
        };
        console.log = function(...args) {
            const message = args.map(formatConsoleArg).join(" ");
            logStreamRef.current += "\n" + message;
            setLogOutput(logStreamRef.current);
            logBackup.apply(console, args);
        };
        return () => {
            console.log = logBackup;
        };
    }, []);

    React.useEffect(() => {
        requestAnimationFrame(() => {
            if(editorRef.current){
                editorRef.current.resize();
            }
            if(outputRef.current){
                outputRef.current.resize();
            }
        });
    }, [selectedTask, tasksLoading]);

    const resizeEditors = () => {
        if(editorRef.current){
            editorRef.current.resize();
        }
        if(outputRef.current){
            outputRef.current.resize();
        }
    }
    const onWorkbenchDragEnd = (sizes) => {
        setWorkbenchSplitSizes(sizes);
        storeSplitSizes(BROWSER_SCRIPT_WORKBENCH_SPLIT_KEY, sizes);
        resizeEditors();
    }
    const onTopDragEnd = (sizes) => {
        setTopSplitSizes(sizes);
        storeSplitSizes(BROWSER_SCRIPT_TOP_SPLIT_KEY, sizes);
        resizeEditors();
    }
    const onToggleTargetOpen = () => {
        setTargetOpen((current) => !current);
    }
    const selectedTaskLabel = (task) => {
        return `${task.command_name} / ${task.display_id} / ${task.display_params}`;
    }
  return (
    <React.Fragment>
        <DialogTitle>
            <MythicCluster gap="md" justify="between" className="mythic-dialog-title-row">
                <Box component="span">{props.title ? props.title : "Edit " + props.author + "'s BrowserScript Code"}</Box>
            </MythicCluster>
        </DialogTitle>
        <MythicStack component={DialogContent} gap="none" className="mythic-browser-script-dialog-content mythic-overflow-hidden" dividers={true}>
            <MythicDialogBody className="mythic-browser-script-dialog-body mythic-flex-fill mythic-overflow-hidden mythic-min-height-0">
                <Box className={`mythic-browser-script-target-panel mythic-border-radius mythic-overflow-hidden mythic-border mythic-surface-raised ${targetOpen ? "mythic-browser-script-target-panel-open" : ""}`}>
                    <MythicCluster gap="md" align="center" justify="between" wrap={false} className="mythic-browser-script-target-summary">
                        <MythicCluster gap="md" align="center" wrap={false} className="mythic-browser-script-target-copy">
                            <Box component="span" className="mythic-browser-script-target-label mythic-font-size-caption mythic-font-weight-extra-bold mythic-line-height-compact mythic-flex-fixed mythic-text-secondary">Script Target</Box>
                            <MythicCluster gap="xs" className="mythic-browser-script-target-chips">
                                <Chip size="small" label={selectedPayloadTypeOption?.name || (targetLoading ? "Loading payload types" : "No payload type")} />
                                <Chip size="small" label={selectedCommandOption?.cmd || "No command"} />
                            </MythicCluster>
                        </MythicCluster>
                        <Tooltip title={targetOpen ? "Collapse target settings" : "Edit target settings"}>
                            <IconButton
                                aria-expanded={targetOpen}
                                aria-label={targetOpen ? "Collapse target settings" : "Edit target settings"}
                                className="mythic-browser-script-target-toggle mythic-border mythic-border-radius mythic-text-secondary"
                                onClick={onToggleTargetOpen}
                                size="small"
                            >
                                {targetOpen ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
                            </IconButton>
                        </Tooltip>
                    </MythicCluster>
                    <Collapse
                        in={targetOpen}
                        onEntered={resizeEditors}
                        onExited={resizeEditors}
                        timeout="auto"
                        unmountOnExit
                    >
                        <MythicStack gap="sm" className="mythic-browser-script-target-details mythic-surface-muted">
                            <MythicFormGrid minWidth="16rem">
                                <MythicFormField label="Payload Type">
                                    <FormControl fullWidth size="small">
                                        <InputLabel id="browser-script-payload-type-label">Payload Type</InputLabel>
                                        <Select
                                            label="Payload Type"
                                            labelId="browser-script-payload-type-label"
                                            value={selectedPayloadType}
                                            onChange={onChangeSelectedPayloadType}
                                            disabled={targetLoading}
                                        >
                                            {payloadTypeCmdOptions.map( (opt) => (
                                                <MenuItem value={opt.id} key={"payloadtype" + opt.id}>{opt.name}</MenuItem>
                                            ) )}
                                        </Select>
                                    </FormControl>
                                </MythicFormField>
                                <MythicFormField label="Command">
                                    <FormControl fullWidth size="small">
                                        <InputLabel id="browser-script-command-label">Command</InputLabel>
                                        <Select
                                            label="Command"
                                            labelId="browser-script-command-label"
                                            value={selectedCommand}
                                            onChange={onChangeSelectedCommand}
                                            disabled={targetLoading || commandOptions.length === 0}
                                        >
                                            {commandOptions.map( (opt) => (
                                                <MenuItem value={opt.id} key={"command" + opt.id}>{opt.cmd}</MenuItem>
                                            ) )}
                                        </Select>
                                    </FormControl>
                                </MythicFormField>
                            </MythicFormGrid>
                            <MythicFormNote>
                                Use Save for Testing to update the script without closing the editor. Select an already executed matching task below, then collapse and re-expand that task if you need it to reload the updated renderer.
                            </MythicFormNote>
                        </MythicStack>
                    </Collapse>
                </Box>
                <MythicStack component={Split} gap="none"
                    className="mythic-browser-script-workbench mythic-full-width mythic-flex-fill mythic-min-height-0"
                    direction="vertical"
                    gutterSize={8}
                    minSize={[210, 300]}
                    onDrag={resizeEditors}
                    onDragEnd={onWorkbenchDragEnd}
                    sizes={workbenchSplitSizes}
                >
                    <MythicCluster component={Split} gap="none" wrap={false} align="stretch"
                        className="mythic-browser-script-top-split mythic-full-width mythic-min-height-0"
                        gutterSize={8}
                        minSize={[320, 220]}
                        onDrag={resizeEditors}
                        onDragEnd={onTopDragEnd}
                        sizes={topSplitSizes}
                    >
                        <BrowserScriptPane className="mythic-browser-script-editor-pane" title="Script Code" meta="JavaScript">
                            <div className="mythic-browser-script-editor-frame mythic-fill">
                                <AceEditor
                                    mode="javascript"
                                    theme={theme.palette.mode === 'dark' ? 'monokai' : 'github'}
                                    width="100%"
                                    onLoad={onLoad}
                                    height="100%"
                                    value={script}
                                    focus={true}
                                    onChange={onChange}
                                    setOptions={{
                                        displayIndentGuides: true,
                                        fontSize: 13,
                                        showPrintMargin: false,
                                        tabSize: 4,
                                        useWorker: false,
                                    }}
                                />
                            </div>
                        </BrowserScriptPane>
                        <BrowserScriptPane className="mythic-browser-script-console-pane" title="Console Output" meta="console.log">
                            <div className="mythic-browser-script-editor-frame mythic-fill">
                                <AceEditor
                                    mode="javascript"
                                    theme={theme.palette.mode === 'dark' ? 'monokai' : 'github'}
                                    width="100%"
                                    onLoad={onOutputLoad}
                                    height="100%"
                                    value={logOutput}
                                    focus={false}
                                    readOnly
                                    setOptions={{
                                        fontSize: 12,
                                        highlightActiveLine: false,
                                        showGutter: false,
                                        showPrintMargin: false,
                                        tabSize: 4,
                                        useWorker: false,
                                    }}
                                />
                            </div>
                        </BrowserScriptPane>
                    </MythicCluster>
                    <BrowserScriptPane className="mythic-browser-script-preview-pane" title="Test Preview" meta={availableTasks.length === 1 ? "1 task" : `${availableTasks.length} tasks`}>
                        <div className="mythic-browser-script-preview-controls mythic-divider-bottom mythic-flex-fixed">
                            <FormControl fullWidth size="small">
                                <InputLabel id="browser-script-test-task-label">Test Script With Task</InputLabel>
                                <Select
                                    label="Test Script With Task"
                                    labelId="browser-script-test-task-label"
                                    value={taskSelectorValue}
                                    onChange={onChangeTask}
                                    disabled={tasksLoading || availableTasks.length === 0}
                                    onOpen={resizeEditors}
                                    renderValue={(task) => task ? selectedTaskLabel(task) : ""}
                                >
                                    {availableTasks.map( (opt) => (
                                        <MenuItem value={opt} key={"task" + opt.id}>{selectedTaskLabel(opt)}</MenuItem>
                                    ) )}
                                </Select>
                            </FormControl>
                        </div>
                        <div className="mythic-browser-script-preview-frame mythic-fill mythic-overflow-auto">
                            {tasksLoading ? (
                                <MythicLoadingState compact title="Loading test tasks" description="Fetching previous tasks for this command." />
                            ) : selectedTask !== "" ? (
                                <TaskDisplay me={props.me} task={selectedTask} command_id={selectedTask.command == null ? 0 : selectedTask.command.id} />
                            ) : (
                                <MythicEmptyState compact title="No matching tasks" description="Run this command at least once to preview this browser script against task output." />
                            )}
                        </div>
                    </BrowserScriptPane>
                </MythicStack>
            </MythicDialogBody>
        </MythicStack>
        <MythicDialogFooter>
          <MythicDialogButton onClick={props.onClose}>
            Close
          </MythicDialogButton>
          {props.new ? (
            <MythicDialogButton disabled={selectedCommand === "" || selectedPayloadType === ""} intent="primary" onClick={onSubmit}>
              Create
          </MythicDialogButton>
          ) : (
            <React.Fragment>
              <MythicDialogButton intent="warning" onClick={onRevert}>
                Revert
              </MythicDialogButton>
                <MythicDialogButton intent="info" disabled={selectedCommand === "" || selectedPayloadType === ""} onClick={onTest}>
                    Save For Testing
                </MythicDialogButton>
              <MythicDialogButton disabled={selectedCommand === "" || selectedPayloadType === ""} intent="primary" onClick={onSubmit}>
                Save and Exit
              </MythicDialogButton>
            </React.Fragment>
          )}
        </MythicDialogFooter>
  </React.Fragment>
  );
}
