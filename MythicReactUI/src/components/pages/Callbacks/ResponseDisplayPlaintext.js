import {useMythicTokens} from '../../../themes/MythicThemeProvider';
import React, { useEffect } from 'react';
import AceEditor from 'react-ace';

import {snackActions} from "../../utilities/Snackbar";
import {modeOptions} from "./ResponseDisplayMedia";
import WrapTextIcon from '@mui/icons-material/WrapText';
import {MythicStyledTooltip} from "../../MythicComponents/MythicStyledTooltip";
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import { gql, useMutation, useReactiveVar } from '@apollo/client';
import { meState } from '../../../cache';
import CodeIcon from '@mui/icons-material/Code';
import ArticleIcon from '@mui/icons-material/Article';
import NotesIcon from '@mui/icons-material/Notes';
import TerminalIcon from '@mui/icons-material/Terminal';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import ReactMarkdown from 'react-markdown';
import {Terminal} from '@xterm/xterm';
import {FitAddon} from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import {
  getInteractiveTerminalTheme as getTerminalTheme,
  getLongestTerminalTextLineLength as getLongestTerminalLineLength,
  sanitizeTerminalOutput
} from "./ResponseDisplayInteractive";
import {markdownPlugins} from "../../utilities/Markdown";
import {markdownComponents} from "../../utilities/MarkdownComponents";
import {MythicDialog} from "../../MythicComponents/MythicDialog";
import {CredentialTableNewCredentialDialog} from "../Search/CredentialTableNewCredentialDialog";
import {MythicCluster} from "../../MythicComponents/MythicLayout";

const MaxRenderSize = 2000000;
const RenderModes = {
  plaintext: "plaintext",
  markdown: "markdown",
  terminal: "terminal",
};
const renderModeOptions = [
  {value: RenderModes.plaintext, label: "Plaintext", Icon: ArticleIcon},
  {value: RenderModes.markdown, label: "Markdown", Icon: NotesIcon},
  {value: RenderModes.terminal, label: "Terminal", Icon: TerminalIcon},
];
const createCredentialMutation = gql`
mutation createCredential($comment: String!, $account: String!, $realm: String!, $type: String!, $subtype: String, $credential: String!, $metadata: jsonb, $custom_display: String) {
    createCredential(account: $account, credential: $credential, comment: $comment, realm: $realm, credential_type: $type, credential_subtype: $subtype, metadata: $metadata, custom_display: $custom_display) {
      status
      error
      id
    }
  }
`;
const normalizeRenderMode = (value) => {
  return Object.values(RenderModes).includes(value) ? value : RenderModes.plaintext;
}
const getInitialRenderMode = (props) => {
  if(props?.render_mode !== undefined){
    return normalizeRenderMode(props.render_mode);
  }
  if(props?.initial_render_mode !== undefined){
    return normalizeRenderMode(props.initial_render_mode);
  }
  return props?.render_colors ? RenderModes.terminal : RenderModes.plaintext;
}
const ResponseMarkdownDisplay = ({value, wrapText, expand}) => {
  return (
      <div className={`mythic-response-markdown mythic-max-width-full mythic-font-size-body-small mythic-scroll-region mythic-full-width${wrapText ? " is-wrapped" : " is-unwrapped"}${expand ? " is-expanded" : " is-capped"}`}>
        <ReactMarkdown remarkPlugins={markdownPlugins} components={markdownComponents} skipHtml>
          {value}
        </ReactMarkdown>
      </div>
  )
}

const ResponseTerminalDisplay = ({value, wrapText, expand, theme}) => {
  const terminalScrollContainerRef = React.useRef(null);
  const terminalElementRef = React.useRef(null);
  const terminalRef = React.useRef(null);
  const fitAddonRef = React.useRef(null);
  const resizeObserverRef = React.useRef(null);
  const fitAnimationFrameRef = React.useRef(null);
  const wrapTextRef = React.useRef(wrapText);
  const unwrappedColumnCountRef = React.useRef(0);
  const [terminalReady, setTerminalReady] = React.useState(false);
  const longestLineLength = React.useMemo( () => getLongestTerminalLineLength(value), [value]);
  const fitTerminal = React.useCallback( () => {
    const terminal = terminalRef.current;
    const fitAddon = fitAddonRef.current;
    const terminalElement = terminalElementRef.current;
    const scrollContainer = terminalScrollContainerRef.current;
    if(!terminal || !fitAddon || !terminalElement || !scrollContainer){
      return;
    }
    try{
      terminalElement.style.width = "100%";
      const proposedDimensions = fitAddon.proposeDimensions();
      if(!proposedDimensions){
        return;
      }
      const rows = Math.max(1, proposedDimensions.rows);
      if(wrapTextRef.current){
        fitAddon.fit();
        scrollContainer.scrollLeft = 0;
      } else {
        const visibleCols = Math.max(1, proposedDimensions.cols);
        const cols = Math.max(visibleCols, unwrappedColumnCountRef.current);
        terminalElement.style.width = `${Math.ceil((cols / visibleCols) * scrollContainer.clientWidth)}px`;
        terminal.resize(cols, rows);
      }
    }catch(error){
      console.error(error);
    }
  }, []);
  const scheduleFitTerminal = React.useCallback( () => {
    if(fitAnimationFrameRef.current !== null){
      return;
    }
    fitAnimationFrameRef.current = window.requestAnimationFrame(() => {
      fitAnimationFrameRef.current = null;
      fitTerminal();
    });
  }, [fitTerminal]);
  React.useEffect( () => {
    wrapTextRef.current = wrapText;
    if(wrapText){
      unwrappedColumnCountRef.current = 0;
    } else {
      unwrappedColumnCountRef.current = Math.min(Math.max(longestLineLength + 2, 1), 1000);
    }
    scheduleFitTerminal();
  }, [longestLineLength, scheduleFitTerminal, wrapText]);
  React.useEffect( () => {
    if(!terminalElementRef.current){
      return;
    }
    const terminal = new Terminal({
      allowTransparency: true,
      convertEol: true,
      cursorBlink: false,
      disableStdin: true,
      fontFamily: 'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      fontSize: 13,
      scrollback: 5000,
      theme: getTerminalTheme(theme),
    });
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(terminalElementRef.current);
    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;
    resizeObserverRef.current = new ResizeObserver(() => scheduleFitTerminal());
    if(terminalScrollContainerRef.current){
      resizeObserverRef.current.observe(terminalScrollContainerRef.current);
    }
    fitAnimationFrameRef.current = window.requestAnimationFrame(() => {
      fitAnimationFrameRef.current = null;
      fitTerminal();
      setTerminalReady(true);
    });
    return () => {
      if(fitAnimationFrameRef.current !== null){
        window.cancelAnimationFrame(fitAnimationFrameRef.current);
        fitAnimationFrameRef.current = null;
      }
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      fitAddonRef.current = null;
      terminalRef.current = null;
      terminal.dispose();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect( () => {
    if(terminalRef.current){
      terminalRef.current.options.theme = getTerminalTheme(theme);
    }
  }, [theme]);
  React.useEffect( () => {
    if(!terminalReady || !terminalRef.current){
      return;
    }
    const terminal = terminalRef.current;
    scheduleFitTerminal();
    terminal.reset();
    terminal.write(sanitizeTerminalOutput(value), () => terminal.scrollToBottom());
  }, [scheduleFitTerminal, terminalReady, value]);
  return (
      <div className="mythic-response-terminal-shell mythic-min-width-0 mythic-full-width"
           style={{height: expand ? "100%" : "360px", minHeight: expand ? 0 : "140px"}}>
        <div
            ref={terminalScrollContainerRef}
            className={"MythicInteractiveTerminal mythic-response-terminal mythic-full-width mythic-min-height-0"}
            style={{
              height: "100%",
              overflowX: wrapText ? "hidden" : "auto",
              overflowY: "hidden",
              width: "100%",
            }}>
          <div ref={terminalElementRef} style={{height: "100%", width: "100%"}} />
        </div>
      </div>
  )
}

export const ResponseDisplayPlaintext = (props) =>{
  const theme = useMythicTokens();
  const me = useReactiveVar(meState);
  const currentContentRef = React.useRef();
  const [plaintextView, setPlaintextView] = React.useState("");
  const initialMode = props?.initial_mode || "html";
  const [mode, setMode] = React.useState(initialMode);
  const [renderMode, setRenderMode] = React.useState(getInitialRenderMode(props));
  const [wrapText, setWrapText] = React.useState(props?.wrap_text === undefined ? true : props.wrap_text);
  const [showOptions, setShowOptions] = React.useState(Boolean(props?.initial_show_options));
  const [createCredentialDialogOpen, setCreateCredentialDialogOpen] = React.useState(false);
  const [initialCredentialValues, setInitialCredentialValues] = React.useState({});
  const largeResponseWarningShown = React.useRef(false);
  const [createCredential] = useMutation(createCredentialMutation, {
      fetchPolicy: "no-cache",
      onCompleted: (data) => {
          if(data.createCredential.status === "success"){
              snackActions.success("Successfully created new credential");
          } else {
              snackActions.error(data.createCredential.error);
          }
      },
      onError: (data) => {
          snackActions.error("Failed to create credential");
          console.log(data);
      }
  });
  const onChangeText = (data) => {
      if(props.onChangeContent){
          props?.onChangeContent(data);
      }
      setPlaintextView(data);
  }
  React.useEffect( () => {
      largeResponseWarningShown.current = false;
  }, [props?.task?.id]);
  useEffect( () => {
      const plaintext = props.plaintext === undefined || props.plaintext === null ? "" : String(props.plaintext);
      if(plaintext.length > MaxRenderSize){
          if(!largeResponseWarningShown.current){
              snackActions.warning("Response too large (> 2MB), truncating the render. Download task output to view entire response.");
              largeResponseWarningShown.current = true;
          }
          setPlaintextView(plaintext.substring(0, MaxRenderSize));
      } else {
          largeResponseWarningShown.current = false;
          try{
              if(props.autoFormat === undefined || props.autoFormat){
                  const newPlaintext = JSON.stringify(JSON.parse(plaintext), null, 4);
                  setPlaintextView(newPlaintext);
                  setMode("json");
              } else {
                  setPlaintextView(plaintext);
              }
          }catch(error){
              setPlaintextView(plaintext);
          }
      }
  }, [props.plaintext, props.autoFormat]);
    const onChangeMode = (event) => {
        setMode(event.target.value);
    }
    const onChangeRenderMode = (newMode) => {
        setRenderMode(newMode);
    }
    const toggleWrapText = () => {
        setWrapText(!wrapText);
    }
    const formatJSON = () => {
        try{
            const currentValue = currentContentRef.current?.editor?.getValue?.() || plaintextView;
            let tmp = JSON.stringify(JSON.parse(currentValue), null, 2);
            setPlaintextView(tmp);
            props.onChangeContent?.(tmp);
            setMode("json");
        }catch(error){
            snackActions.warning("Failed to reformat as JSON")
        }
    }
    const onChangeShowOptions = () => {
        setShowOptions(!showOptions);
    }
    const sourceTaskMetadata = () => {
        const taskMetadata = props?.task?.id ? {task_id: props.task.id} : {};
        const credentialMetadata = typeof props?.credentialMetadata === "function" ?
            props.credentialMetadata() :
            (props?.credentialMetadata || {});
        return {
            ...taskMetadata,
            ...credentialMetadata,
        };
    };
    const openCreateCredentialDialog = () => {
        const selectedText = currentContentRef.current?.editor?.getSelectedText?.() || "";
        const credentialText = selectedText.trim() === "" ? plaintextView : selectedText;
        if(credentialText.trim() === ""){
            snackActions.warning("No credential text selected");
            return;
        }
        setInitialCredentialValues({
            credential: credentialText,
            metadata: sourceTaskMetadata(),
        });
        setCreateCredentialDialogOpen(true);
    }
    const onCreateCredential = ({type, subtype, account, realm, comment, credential, metadata, custom_display}) => {
        createCredential({variables: {type, subtype, account, realm, comment, credential, metadata, custom_display}})
    }
    const scrollContent = (node, isAppearing) => {
        // only auto-scroll if you issued the task
        if(props?.task?.operator?.username === (me?.user?.username || "")){
            let el = document.getElementById(`taskingPanel${props.task.callback_id}`);
            if(props.expand || props.displayType === "console"){
                el = document.getElementById(`taskingPanelConsole${props.task.callback_id}`);
            }
            if(el && el.scrollHeight - el.scrollTop - el.clientHeight < 600){
                document.getElementById(`scrolltotaskbottom${props.task.id}`)?.scrollIntoView({
                    //behavior: "smooth",
                    block: "end",
                    inline: "nearest"
                });
            }
        }

    }
    React.useLayoutEffect( () => {
        scrollContent()
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    React.useEffect( () => {
        setMode(props?.initial_mode || "html");
    }, [props?.initial_mode]);
    React.useEffect( () => {
        setRenderMode(getInitialRenderMode({
            initial_render_mode: props?.initial_render_mode,
            render_colors: props?.render_colors,
            render_mode: props?.render_mode,
        }));
    }, [props?.initial_render_mode, props?.render_mode, props?.render_colors]);
    const currentRenderModeLabel = renderModeOptions.find((option) => option.value === renderMode)?.label || "Plaintext";
    const displayWrapText = renderMode === RenderModes.plaintext ? wrapText : true;
    const toolbarActions = props?.toolbarActions || [];
    const showCreateCredentialAction = props?.enableCredentialCreation !== false &&
        (props.task || props.credentialMetadata || props.showCredentialAction);
  return (
      <div style={{display: "flex", height: "100%", minHeight: 0, minWidth: 0, flexDirection: "column", flex: "1 1 auto"}}>
          {createCredentialDialogOpen &&
              <MythicDialog fullWidth={true} maxWidth="md" open={createCredentialDialogOpen}
                            onClose={()=>{setCreateCredentialDialogOpen(false);}}
                            innerDialog={<CredentialTableNewCredentialDialog initialValues={initialCredentialValues} onSubmit={onCreateCredential} onClose={()=>{setCreateCredentialDialogOpen(false);}} />}
              />
          }
          {props.displayType !== 'console' &&
              <div className={`mythic-response-render-toolbar mythic-stack mythic-flex-fixed${showOptions ? " is-open" : ""}`}>
                  <MythicCluster component="button" gap="xs" justify="start" inline wrap={false} className="mythic-response-render-toolbar-toggle mythic-clickable mythic-inherit-color mythic-full-width"
                          type="button"
                          onClick={onChangeShowOptions}
                          style={{color: theme.color.tasking.outputText}}>
                      {showOptions ? <UnfoldLessIcon fontSize="small" /> : <UnfoldMoreIcon fontSize="small" />}
                      <span className="mythic-response-render-toolbar-title mythic-font-weight-heavy mythic-line-height-compact mythic-font-size-caption">{props?.toolbarTitle || "Output"}</span>
                      <MythicCluster component="span" gap="none" inline wrap={false} className="mythic-response-render-toolbar-mode mythic-font-weight-extra-bold mythic-line-height-compact mythic-font-size-xs mythic-border-radius mythic-flex-fixed">{currentRenderModeLabel}</MythicCluster>
                  </MythicCluster>
                  {showOptions &&
                      <MythicCluster component="div" gap="sm" align="center" wrap={false} className="mythic-response-render-toolbar-controls">
                          <MythicCluster component="div" gap="none" inline wrap={false} className="mythic-response-render-mode-group mythic-border-radius mythic-flex-fixed mythic-overflow-hidden" role="group" aria-label="Response render mode">
                              {renderModeOptions.map(({value, label, Icon}) => (
                                  <button
                                      aria-pressed={renderMode === value}
                                      className={`mythic-response-render-mode-button mythic-font-weight-extra-bold mythic-clickable mythic-font-size-caption mythic-gap-xs mythic-justify-center mythic-inline-cluster${renderMode === value ? " is-selected" : ""}`}
                                      key={value}
                                      onClick={() => onChangeRenderMode(value)}
                                      type="button">
                                      <Icon fontSize="small" />
                                      <span>{label}</span>
                                  </button>
                              ))}
                          </MythicCluster>
                          {toolbarActions.length > 0 &&
                              <MythicCluster component="div" gap="none" inline wrap={false} className="mythic-response-render-action-group mythic-border-radius mythic-flex-fixed mythic-overflow-hidden">
                                  {toolbarActions.map((action, index) => (
                                      <React.Fragment key={action?.key || index}>{action}</React.Fragment>
                                  ))}
                              </MythicCluster>
                          }
                          {renderMode === RenderModes.plaintext &&
                              <>
                                  <MythicCluster component="div" gap="none" inline wrap={false} className="mythic-response-render-action-group mythic-border-radius mythic-flex-fixed mythic-overflow-hidden">
                                      <MythicStyledTooltip title={wrapText ?  "Unwrap Text" : "Wrap Text"} >
                                          <button
                                              aria-label={wrapText ? "Unwrap Text" : "Wrap Text"}
                                              aria-pressed={wrapText}
                                              className={`mythic-response-render-action-button mythic-clickable mythic-justify-center mythic-inline-cluster${wrapText ? " is-selected" : ""}`}
                                              onClick={toggleWrapText}
                                              type="button">
                                              <WrapTextIcon fontSize="small" />
                                          </button>
                                      </MythicStyledTooltip>
                                      <MythicStyledTooltip title={"Auto format JSON"} >
                                          <MythicCluster component="button" gap="none" justify="center" inline wrap={false}
                                              aria-label="Auto format JSON"
                                              className="mythic-response-render-action-button mythic-clickable"
                                              onClick={formatJSON}
                                              type="button">
                                              <CodeIcon fontSize="small" />
                                          </MythicCluster>
                                      </MythicStyledTooltip>
                                      {showCreateCredentialAction &&
                                          <MythicStyledTooltip title={"Create Credential"} >
                                              <MythicCluster component="button" gap="none" justify="center" inline wrap={false}
                                                  aria-label="Create Credential"
                                                  className="mythic-response-render-action-button mythic-clickable"
                                                  onClick={openCreateCredentialDialog}
                                                  type="button">
                                                  <VpnKeyIcon fontSize="small" />
                                              </MythicCluster>
                                          </MythicStyledTooltip>
                                      }
                                  </MythicCluster>
                                  <MythicCluster component="label" gap="xs" inline wrap={false} className="mythic-response-syntax-group mythic-font-weight-extra-bold mythic-line-height-compact mythic-font-size-caption mythic-border-radius mythic-flex-fixed mythic-overflow-hidden">
                                      <span>Syntax</span>
                                      <select
                                          className="mythic-response-syntax-select mythic-clickable mythic-full-height"
                                          value={mode}
                                          onChange={onChangeMode}>
                                          {
                                              modeOptions.map((opt) => (
                                                  <option key={"searchopt" + opt} value={opt}>{opt}</option>
                                              ))
                                          }
                                      </select>
                                  </MythicCluster>
                              </>
                          }
                          {props.toolbarNotice}
                      </MythicCluster>
                  }
              </div>
          }

          <div style={{
              flexGrow: 1,
              height: "100%",
              minHeight: 0,
          }}>
              {renderMode === RenderModes.markdown &&
                  <ResponseMarkdownDisplay value={plaintextView} wrapText={displayWrapText} expand={props.expand} />
              }
              {renderMode === RenderModes.terminal &&
                  <ResponseTerminalDisplay value={plaintextView} wrapText={displayWrapText} expand={props.expand} theme={theme} />
              }
              {renderMode === RenderModes.plaintext &&
                  <AceEditor
                      className={"roundedBottomCorners"}
                      ref={currentContentRef}
                      mode={props.displayType !== 'console' ? mode : 'html'}
                      theme={theme.palette.mode === "dark" ? "monokai" : "xcode"}
                      fontSize={14}
                      showGutter={ props.displayType !== 'console'}
                      onChange={onChangeText}
                      readOnly={Boolean(props?.readOnly)}
                      //onLoad={onLoad}
                      highlightActiveLine={false}
                      showPrintMargin={false}
                      value={plaintextView}
                      height={props.expand ? "100%": undefined}
                      maxLines={props.expand ? undefined : 20}
                      width={"100%"}
                      //style={{backgroundColor: "transparent"}}
                      //autoScrollEditorIntoView={true}
                      wrapEnabled={props.displayType !== 'console' ? displayWrapText : true}
                      minLines={1}
                      setOptions={{
                          showLineNumbers: props.displayType !== 'console',
                          tabSize: 4,
                          useWorker: false,
                          showInvisibles: false,
                      }}/>
              }

          </div>
      </div>
  )
      
}
