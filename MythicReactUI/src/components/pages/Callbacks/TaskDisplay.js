import {useMythicTheme} from '../../../themes/MythicThemeProvider';
import React, {useEffect, useLayoutEffect, useRef} from 'react';
import styles from './TaskDisplay.module.css';
import {IconButton, Link} from '@mui/material';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import {getSkewedNow, toLocalTime, toLocalTimeShort} from '../../utilities/Time';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined';

import {gql, useSubscription } from '@apollo/client';
import {TaskDisplayContainer, TaskDisplayContainerConsole} from './TaskDisplayContainer';
import {TagsDisplay} from '../../MythicComponents/MythicTag';
import {taskingDataFragment} from './CallbackMutations';
import {GetMythicSetting, useGetMythicSetting} from "../../MythicComponents/MythicSavedUserSetting";
import PlayCircleFilledTwoToneIcon from '@mui/icons-material/PlayCircleFilledTwoTone';
import CropRotateTwoToneIcon from '@mui/icons-material/CropRotateTwoTone';
import {MythicStyledTooltip} from "../../MythicComponents/MythicStyledTooltip";
import {normalizeTaskingDisplayFields, operatorSettingDefaults} from "../../../cache";
import {TaskFromUIButton} from "./TaskFromUIButton";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faSkullCrossbones} from '@fortawesome/free-solid-svg-icons';
import LockOpenIcon from '@mui/icons-material/LockOpen';
// Icons for console-view display
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ComputerIcon from '@mui/icons-material/Computer';
import PublicIcon from '@mui/icons-material/Public';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import NumbersIcon from '@mui/icons-material/Numbers';
import {getMythicStatusFromTaskStatus, MythicStatusChip} from '../../MythicComponents/MythicStatusChip';
import {TaskReferenceDisplay} from './taskingReferences';
import {mergeTasksByID} from "./CallbackTaskingStreamUtils";


export const classes = {
  root: styles.paper,
  taskHeaderBody: styles.taskHeaderBody,
  taskMetaRow: styles.taskMetaRow,
  taskMetaItem: styles.taskMetaItem,
  taskMetaIcon: `${styles.taskMetaIcon} mythic-font-size-body-small`,
  taskHeaderBodyCompact: `${styles.taskHeaderBodyCompact} mythic-gap-xs`,
  taskHeaderActions: styles.taskHeaderActions,
  taskIconButton: styles.taskIconButton,
  taskCommandRow: styles.taskCommandRow,
  taskCommandText: styles.taskCommandText,
  taskCommandTextCompact: styles.taskCommandTextCompact,
  taskCommandName: `${styles.taskCommandName} mythic-font-weight-extra-bold`,
  taskCommandParams: `${styles.taskCommandParams} mythic-break-anywhere`,
  taskTags: styles.taskTags,
  taskChildToggle: styles.taskChildToggle,
  taskCommentBlock: styles.taskCommentBlock,
  consolePrompt: `${styles.consolePrompt} mythic-font-weight-extra-bold`,
};
export const accordionClasses = {
  root: styles.accordionRoot,
  content: styles.accordionContent,
  expandIcon: styles.accordionExpandIcon,
  expanded: styles.accordionExpanded,
  details: styles.accordionDetails,
  detailsRoot: styles.accordionDetailsRoot,
};

export const StyledPaper = ({className = "", ...props}) => (
  <Paper data-mythic-component="task-display" className={`${styles.paper} ${className}`} {...props} />
);

const getSubTaskingQuery = gql`
${taskingDataFragment}
subscription getSubTasking($task_id: Int!){
    task_stream(batch_size: 10, cursor: {initial_value: {timestamp: "1970-01-01"}}, where: {parent_task_id: {_eq: $task_id}, is_interactive_task: {_eq: false}}) {
        ...taskData
  }
}
 `;

const useTaskChildren = ({taskID, taskChildrenStore, active}) => {
  const [localChildren, setLocalChildren] = React.useState([]);
  const subscribe = React.useCallback((listener) => {
    return taskChildrenStore ? taskChildrenStore.subscribe(taskID, listener) : () => {};
  }, [taskChildrenStore, taskID]);
  const getSnapshot = React.useCallback(() => {
    return taskChildrenStore ? taskChildrenStore.getSnapshot(taskID) : localChildren;
  }, [localChildren, taskChildrenStore, taskID]);
  const externalChildren = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  React.useEffect(() => {
    if(!taskChildrenStore){
      setLocalChildren([]);
    }
  }, [taskChildrenStore, taskID]);

  useSubscription(getSubTaskingQuery, {
    variables: {task_id: taskID},
    skip: Boolean(taskChildrenStore) || !active,
    ignoreResults: true,
    onData: ({data}) => {
      setLocalChildren((current) => mergeTasksByID(current, data.data?.task_stream || []));
    },
  });

  return taskChildrenStore ? externalChildren : localChildren;
};

export const StyledAccordionSummary = (props) => (
  <AccordionSummary data-mythic-slot="task-summary" {...props} />
);

function TaskDisplayPreMemo({task, me, filterOptions, newlyIssuedTasks, collapseAllRequest, taskChildrenStore, active=true}){
  return (
      <TaskRow me={me} task={task} newlyIssuedTasks={newlyIssuedTasks} filterOptions={filterOptions}
               indentLevel={0} collapseAllRequest={collapseAllRequest}
               taskChildrenStore={taskChildrenStore} active={active} />
  );
}
export const TaskDisplay = React.memo(TaskDisplayPreMemo);
function TaskDisplayFlatPreMemo({task, me, filterOptions, selectedTask, onSelectTask, showOnSelectTask, taskChildrenStore, active=true}){
  return (
      <TaskRowFlat me={me} indentLevel={0} task={task}
                   filterOptions={filterOptions} onSelectTask={onSelectTask}
                   showOnSelectTask={showOnSelectTask} selectedTask={selectedTask}
                   taskChildrenStore={taskChildrenStore} active={active}
      />
  )
}
export const TaskDisplayFlat = React.memo(TaskDisplayFlatPreMemo);
function TaskDisplayConsolePreMemo({task, me, filterOptions, newlyIssuedTasks, taskChildrenStore, active=true}){
  return (
      <TaskRowConsole me={me} task={task} newlyIssuedTasks={newlyIssuedTasks} filterOptions={filterOptions}
               indentLevel={0} taskChildrenStore={taskChildrenStore} active={active} />
  );
}
export const TaskDisplayConsole = React.memo(TaskDisplayConsolePreMemo);
const TaskStatusDisplay = ({task}) => {
  const chipSx = {
    display: "inline-flex",
    height: 22,
    mx: 0.5,
    verticalAlign: "middle",
    "& .MuiChip-icon": {
      fontSize: "0.86rem",
    },
    "& .MuiChip-label": {
      px: 0.7,
    },
  };
  if(task.status.toLowerCase().includes("error")){
    return <MythicStatusChip component="span" label={task.status.toLowerCase()} status="error" sx={{...chipSx, maxWidth: "16rem"}} />
  }else if(task.status === "cleared"){
    return <MythicStatusChip component="span" label="cleared" status="warning" sx={chipSx} />
  }else if(task.status === "completed" || task.status === "success"){
    return null//return (<Typography size="small" style={{padding: "0", color: theme.palette.success.main, marginLeft: "5%", display: "inline-block", fontSize: theme.typography.pxToRem(15)}}>completed</Typography>)
  }else if(task.opsec_pre_blocked && !task.opsec_pre_bypassed){
    return <MythicStatusChip component="span" label="OPSEC blocked pre" status="blocked" sx={chipSx} />
  }else if(task.opsec_post_blocked && !task.opsec_post_bypassed){
    return <MythicStatusChip component="span" label="OPSEC blocked post" status="blocked" sx={chipSx} />
  }else{
      return (
        <MythicStatusChip
          component="span"
          label={task.status.toLowerCase()}
          status={getMythicStatusFromTaskStatus(task.status)}
          sx={{...chipSx, maxWidth: "16rem"}}
        />
      )
  }
}
const getTaskAccentColor = (task, theme) => {
  if(task.status.toLowerCase().includes("error")){
    return theme.palette.error.main;
  }
  if(task.status.toLowerCase() === "cleared"){
    return theme.palette.warning.main;
  }
  if(task.status === "submitted"){
    return theme.palette.info.main;
  }
  if(task.opsec_pre_blocked && !task.opsec_pre_bypassed){
    return theme.palette.warning.main;
  }
  if(task.opsec_post_blocked && !task.opsec_post_bypassed){
    return theme.palette.warning.main;
  }
  if(task.status.toLowerCase().includes("processing")){
    return theme.palette.warning.main;
  }
  if(task.status === "completed" || task.completed){
    return theme.palette.success.main;
  }
  return theme.palette.info.main;
}
const getCallbackPrimaryIP = (task) => {
  try{
    return JSON.parse(task.callback.ip)[0] || "";
  }catch(error){
    return "";
  }
}
const useTaskingDisplayFields = () => {
  const taskingDisplayFields = useGetMythicSetting({setting_name: "taskingDisplayFields", default_value: operatorSettingDefaults.taskingDisplayFields});
  return React.useMemo(() => normalizeTaskingDisplayFields(taskingDisplayFields), [taskingDisplayFields]);
}
const TaskingMetadataField = ({fieldName, task, displayTimestamp, me, compactTimestamp=false}) => {
  const ipValue = getCallbackPrimaryIP(task);
  const callbackGroups = task.callback.mythictree_groups?.join(', ') || "";
  switch(fieldName){
    case "timestamp":
      return (
        <TaskMetaItem title={"Task timestamp"} icon={<AccessTimeIcon />}>
          {compactTimestamp ? toLocalTimeShort(displayTimestamp, me?.user?.view_utc_time || false) : toLocalTime(displayTimestamp, me?.user?.view_utc_time || false)}
        </TaskMetaItem>
      );
    case "task":
      return (
        <TaskMetaItem title={"View Task in separate page"} icon={<NumbersIcon />}>
          <Link underline="hover" target="_blank" href={"/new/task/" + task.display_id}>T-{task.display_id}</Link>
        </TaskMetaItem>
      );
    case "username":
      return (
        <TaskMetaItem title={"Operator"} icon={<PersonOutlineIcon />}>
          {task.operator.username}
        </TaskMetaItem>
      );
    case "callback":
      return (
        <TaskMetaItem title={"View Callback in separate page"}>
          <Link underline="hover" target="_blank" href={"/new/callbacks/" + task.callback.display_id}>C-{task.callback.display_id}</Link>
        </TaskMetaItem>
      );
    case "host":
      return (
        <TaskMetaItem title={"Host"} icon={<ComputerIcon />}>
          {task.callback.host}
        </TaskMetaItem>
      );
    case "ip":
      return ipValue !== "" ? (
        <TaskMetaItem title={"IP address"} icon={<PublicIcon />}>
          {ipValue}
        </TaskMetaItem>
      ) : null;
    case "groups":
      return callbackGroups !== "" ? (
        <TaskMetaItem title={"Callback groups"}>
          {callbackGroups}
        </TaskMetaItem>
      ) : null;
    case "payload_type":
      return task?.command?.payloadtype?.name ? (
        <TaskMetaItem title={"Payload type"}>
          {task.command.payloadtype.name}
        </TaskMetaItem>
      ) : null;
    default:
      return null;
  }
}
const TaskMetaItem = ({children, icon, title, style}) => {
  const item = (
    <span className={classes.taskMetaItem} style={style}>
      {icon && React.cloneElement(icon, {
        className: classes.taskMetaIcon,
        fontSize: "inherit",
      })}
      <span>{children}</span>
    </span>
  );
  if(title){
    return (
      <MythicStyledTooltip title={title}>
        {item}
      </MythicStyledTooltip>
    )
  }
  return item;
}
const TaskHeaderAction = ({title, children, ...props}) => (
  <MythicStyledTooltip title={title}>
    <IconButton className={classes.taskIconButton} size="small" color="inherit"
                disableFocusRipple={true} disableRipple={true} {...props}>
      {children}
    </IconButton>
  </MythicStyledTooltip>
)
const TaskTagDisplay = ({task}) => {
  if(!task.tags || task.tags.length === 0){
    return null;
  }
  return (
    <span className={classes.taskTags}>
      <TagsDisplay tags={task.tags} />
    </span>
  )
}
const isTaskHeaderInteractiveClick = (e) => {
  const clickedInteractiveElement = e.target?.closest?.(
    `a, button, [role="button"], input, select, textarea`
  );
  return Boolean(clickedInteractiveElement && e.currentTarget.contains(clickedInteractiveElement));
}
const handleTaskHeaderClick = (e, onClick) => {
  if(window.getSelection().toString() !== ""){
    return;
  }
  if(isTaskHeaderInteractiveClick(e)){
    e.stopPropagation();
    return;
  }
  if(onClick){
    e.stopPropagation();
    e.preventDefault();
    onClick(e);
  }
}
const ColoredTaskDisplay = ({task, theme, children, expanded}) => {
  const themeColor = getTaskAccentColor(task, theme);
  return(
    <span style={{display: "flex", margin: 0, borderWidth: 0, padding: "8px 10px 8px 9px", minHeight: "58px", alignItems: "center",
      height: "100%", borderLeft: "4px solid " + themeColor, width: "100%", maxWidth: "100%",
      borderTopLeftRadius: theme.shape.borderRadius, borderBottomLeftRadius: expanded ? 0 : theme.shape.borderRadius}}>
      {children}
    </span>
  )
}
export const ColoredTaskLabel = ({task, theme, me, taskDivID, onClick, displayChildren, toggleDisplayChildren, expanded, compact=false, hasChildren }) => {
  const [displayComment, setDisplayComment] = React.useState(false);
  const taskingDisplayFields = useTaskingDisplayFields();
  const initialTaskTimestampDisplayField = GetMythicSetting({setting_name: "taskTimestampDisplayField", default_value: operatorSettingDefaults.taskTimestampDisplayField});
  const initialShowOPSECBypassUsername = GetMythicSetting({setting_name: "showOPSECBypassUsername", default_value: operatorSettingDefaults.showOPSECBypassUsername});
  const displayTimestamp = task[initialTaskTimestampDisplayField] ? task[initialTaskTimestampDisplayField] : task.timestamp;
  const [openKillTaskButton, setOpenKillTaskButton] = React.useState({open: false});
  const command = task?.command?.cmd || task.command_name;
  const commandLine = command + " " + task.display_params;
  const opsecBypassUsers = [
    task?.opsec_pre_bypass_user?.username,
    task?.opsec_post_bypass_user?.username,
  ].filter(Boolean).join(", ");
  const toggleDisplayComment = (evt) => {
    evt.stopPropagation();
    setDisplayComment(!displayComment);
  }
  const preventPropagation = (e) => {
    e.stopPropagation();
    //e.preventDefault();
  }
  const onClickKillIcon = (e, open) => {
    if(e){
      e.stopPropagation();
    }
    setOpenKillTaskButton({open: open});
  }
  return (
      <ColoredTaskDisplay task={task} theme={theme} expanded={expanded} >
        <div id={taskDivID} className={compact ? `${classes.taskHeaderBody} ${classes.taskHeaderBodyCompact}` : classes.taskHeaderBody}
             onClick={(e) => handleTaskHeaderClick(e, onClick)}>
          {displayComment && (
              <div className={classes.taskCommentBlock} onClick={preventPropagation}>
                <Typography component="div" sx={{fontSize: "0.72rem", fontWeight: 800, color: theme.palette.text.secondary, mb: 0.5}}>
                  {task.commentOperator?.username || "comment"}
                </Typography>
                <Typography component="div" sx={{fontSize: "0.82rem", overflowWrap: "anywhere"}}>
                  {task.comment}
                </Typography>
              </div>
          )}
          <div className={classes.taskMetaRow}>
            {taskingDisplayFields.map((fieldName) => (
              <TaskingMetadataField
                displayTimestamp={displayTimestamp}
                fieldName={fieldName}
                key={fieldName}
                me={me}
                task={task}
              />
            ))}
            {initialShowOPSECBypassUsername && opsecBypassUsers !== "" &&
              <TaskMetaItem title={"The specified usernames approved OPSEC bypasses for this task"} icon={<LockOpenIcon />}>
                {opsecBypassUsers}
              </TaskMetaItem>
            }
            {task.comment.length > 0 &&
              <TaskMetaItem title={task.comment} style={{maxWidth: "24rem"}}>
                {task.comment}
              </TaskMetaItem>
            }
            <span className={classes.taskHeaderActions}>
              {task.has_intercepted_response &&
                <TaskHeaderAction title={"This task has responses that have been intercepted and changed due to a workflow container"}>
                  <CropRotateTwoToneIcon />
                </TaskHeaderAction>
              }
              {task?.eventstepinstance &&
                <TaskHeaderAction title={"Task created via Eventing, click to view entire event flow in separate page"}
                                  component={Link}
                                  href={'/new/eventing?eventgroup=' +
                                      task?.eventstepinstance?.eventgroupinstance?.eventgroup?.id +
                                      "&eventgroupinstance=" + task?.eventstepinstance?.eventgroupinstance?.id
                                  }
                                  target={"_blank"}>
                  <PlayCircleFilledTwoToneIcon />
                </TaskHeaderAction>
              }
              {!task.completed && task.status_timestamp_processing &&
                <TaskHeaderAction title={"Task the agent to kill this task"} onClick={(e) => onClickKillIcon(e, true)}>
                  <FontAwesomeIcon size={"sm"} icon={faSkullCrossbones} style={{height: "0.82rem"}} />
                </TaskHeaderAction>
              }
              <TaskStatusDisplay task={task}/>
              {task.comment.length > 0 &&
                <TaskHeaderAction title={displayComment ? "Hide comment" : "Show comment"} onClick={toggleDisplayComment}>
                  <ChatOutlinedIcon />
                </TaskHeaderAction>
              }
            </span>
          </div>
          <div className={classes.taskCommandRow}>
            {(hasChildren ?? task.tasks.length > 0) &&
              <IconButton className={classes.taskChildToggle} size="small" onClick={toggleDisplayChildren}>
                {displayChildren ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </IconButton>
            }
            <MythicStyledTooltip maxWidth={"calc(80vw)"}
                                 enterDelay={2000}
                                 placement={"top"}
                                 tooltipStyle={{display: "block", flex: "1 1 auto", minWidth: 0}}
                                 title={commandLine} >
              <Typography className={compact ? `${classes.taskCommandText} ${classes.taskCommandTextCompact}` : classes.taskCommandText} component="div">
                <span className={classes.taskCommandName}>{command}</span>
                {task.display_params !== "" &&
                  <span className={classes.taskCommandParams}> <TaskReferenceDisplay text={task.display_params}/></span>
                }
              </Typography>
            </MythicStyledTooltip>
            <TaskTagDisplay task={task}/>
          </div>
        </div>
        {openKillTaskButton.open &&
            <TaskFromUIButton ui_feature={"task:job_kill"}
                              callback_id={task.callback?.id}
                              display_id={task.callback?.display_id}
                              parameters={task.agent_task_id}
                              openDialog={false}
                              getConfirmation={true}
                              acceptText={"KILL JOB"}
                              selectCallback={false}
                              onTasked={({tasked}) => onClickKillIcon(null, false)}/>
        }
      </ColoredTaskDisplay>
  )
}
const TaskRow = ({task, filterOptions, me, newlyIssuedTasks, indentLevel, collapseAllRequest, taskChildrenStore, active=true}) => {
		const [dropdownOpen, setDropdownOpen] = React.useState(false);
    const taskingData = useTaskChildren({taskID: task.id, taskChildrenStore, active});
    const [shouldDisplay, setShouldDisplay] = React.useState(true);
    const [displayChildren, setDisplayChildren] = React.useState(false);
    const hideBrowserTasking = GetMythicSetting({setting_name: "hideBrowserTasking", default_value: operatorSettingDefaults.hideBrowserTasking});

    useEffect( () => {
      /*props.onSubmit({
      "operatorsList": onlyOperators,
      "commentsFlag": onlyHasComments,
      "commandsList": onlyCommands,
      "everythingButList": everythingBut,
      "parameterString": onlyParameters,
      "hideErrors": hideErrors
    }); */
      if(hideBrowserTasking && task.tasking_location.includes("_browser")){
        setShouldDisplay(false);
        return;
      }
      if(task.display_params.includes("help") && task.operator.username !== me.user.username){
        setShouldDisplay(false);
        return;
      }
      if(filterOptions === undefined){
        if(!shouldDisplay){
          setShouldDisplay(true);
        }
        return;
      }
      if(filterOptions["operatorsList"].length > 0){
        if(!filterOptions["operatorsList"].includes(task.operator.username)){
          if(shouldDisplay){
            setShouldDisplay(false);
          }
          return;
        }
      }
      if(filterOptions["commentsFlag"]){
        if(task.comment === ""){
          if(shouldDisplay){
            setShouldDisplay(false);
          }
          return;
        }
      }
      if(filterOptions["commandsList"].length > 0){
        // only show these commands
        if(!filterOptions["commandsList"].includes(task.command_name)){
          if(shouldDisplay){
            setShouldDisplay(false);
          }
          return;
        }
      }
      if(filterOptions["everythingButList"].length > 0){
          if(filterOptions["everythingButList"].includes(task.command_name)){
            if(shouldDisplay){
              setShouldDisplay(false);
            }
            return;
          }
      }
      if(filterOptions["parameterString"] !== ""){
        let regex = new RegExp(filterOptions["parameterString"]);
        if(!regex.test(task.display_params)){
          if(shouldDisplay){
            setShouldDisplay(false);
          }
          return;
        }
      }
      if(filterOptions["hideErrors"]){
        if(task.status.toLowerCase().includes("error")){
          if(shouldDisplay){
            setShouldDisplay(false);
          }
          return;
        }
      }
      if(!shouldDisplay){
        setShouldDisplay(true);
      }
    }, [filterOptions, task.comment, task.command, task.status, task.display_params, task.operator.username]);
    const toggleTaskDropdown = React.useCallback( (event, expanded) => {
      if(window.getSelection().toString() !== ""){
        return;
      }
      if(event){
        event.stopPropagation();
        event.preventDefault();
      }
      setDropdownOpen(!dropdownOpen);
    }, [dropdownOpen]);
    const toggleDisplayChildren = React.useCallback( (event, expanded) => {
      if(window.getSelection().toString() !== ""){
        return;
      }
      setDisplayChildren(!displayChildren);
        if(event){
            event.stopPropagation();
            event.preventDefault();
        }
    }, [displayChildren]);
    useEffect( () => {
      if(collapseAllRequest > 0){
        setDropdownOpen(false);
      }
    }, [collapseAllRequest]);
    /*
    useEffect( () => {
      if(!isFetchingSubtasks && task.tasks.length > 0){
        getSubTasks();
      }
    }, [task.tasks]);
    */
    return (
      shouldDisplay ? (
          <div style={{marginLeft: (indentLevel * 10) + "px"}}>
            <TaskLabel me={me} task={task} newlyIssuedTasks={newlyIssuedTasks} dropdownOpen={dropdownOpen}
                       toggleTaskDropdown={toggleTaskDropdown}
                       toggleDisplayChildren={toggleDisplayChildren} displayChildren={displayChildren}
                       hasChildren={taskingData.length > 0 || task.tasks.length > 0} active={active}/>
            { displayChildren &&
              taskingData.map( (tsk) => (
                  <TaskRow key={"taskrow: " + tsk.id} me={me} task={tsk}
                           filterOptions={filterOptions} indentLevel={indentLevel+1}
                           taskChildrenStore={taskChildrenStore} active={active}/>
              ))
            }
          </div>

      ) : null
    )
}
const TaskRowFlat = ({task, filterOptions, me, onSelectTask, showOnSelectTask, selectedTask, indentLevel, taskChildrenStore, active=true}) => {
  const rawTaskingData = useTaskChildren({taskID: task.id, taskChildrenStore, active});
  const taskingData = React.useMemo(() => rawTaskingData.map((child) => ({
    ...child,
    selected: child.id === selectedTask.id,
  })), [rawTaskingData, selectedTask.id]);
  const [shouldDisplay, setShouldDisplay] = React.useState(true);
  const [displayChildren, setDisplayChildren] = React.useState(false);
  const hideBrowserTasking = GetMythicSetting({setting_name: "hideBrowserTasking", default_value: operatorSettingDefaults.hideBrowserTasking});

  useEffect( () => {
    /*props.onSubmit({
    "operatorsList": onlyOperators,
    "commentsFlag": onlyHasComments,
    "commandsList": onlyCommands,
    "everythingButList": everythingBut,
    "parameterString": onlyParameters
  }); */
    if(hideBrowserTasking && task.tasking_location.includes("browser")){
      setShouldDisplay(false);
      return;
    }
    if(task.display_params.includes("help") && task.operator.username !== me.user.username){
      setShouldDisplay(false);
      return;
    }
    if(filterOptions === undefined){
      if(!shouldDisplay){
        setShouldDisplay(true);
      }
      return;
    }
    if(filterOptions["operatorsList"].length > 0){
      if(!filterOptions["operatorsList"].includes(task.operator.username)){
        if(shouldDisplay){
          setShouldDisplay(false);
        }
        return;
      }
    }
    if(filterOptions["commentsFlag"]){
      if(task.comment === ""){
        if(shouldDisplay){
          setShouldDisplay(false);
        }
        return;
      }
    }
    if(filterOptions["commandsList"].length > 0){
      // only show these commands
      if(!filterOptions["commandsList"].includes(task.command_name)){
        if(shouldDisplay){
          setShouldDisplay(false);
        }
        return;
      }
    }
    if(filterOptions["everythingButList"].length > 0){
      if(filterOptions["everythingButList"].includes(task.command_name)){
        if(shouldDisplay){
          setShouldDisplay(false);
        }
        return;
      }
    }
    if(filterOptions["parameterString"] !== ""){
      let regex = new RegExp(filterOptions["parameterString"]);
      if(!regex.test(task.display_params)){
        if(shouldDisplay){
          setShouldDisplay(false);
        }
        return;
      }
    }
    if(filterOptions["hideErrors"]){
      if(task.status.includes("error")){
        if(shouldDisplay){
          setShouldDisplay(false);
        }
        return;
      }
    }
    if(!shouldDisplay){
      setShouldDisplay(true);
    }
  }, [filterOptions, task.comment, task.command, task.display_params, task.operator.username]);
  const toggleDisplayChildren = React.useCallback( (event, expanded) => {
    if(window.getSelection().toString() !== ""){
      return;
    }
    setDisplayChildren(!displayChildren);
    event.stopPropagation();
    event.preventDefault();
  }, [displayChildren]);
  const onLocalSelectTask = React.useCallback( () => {
      onSelectTask(task);
  }, [task]);
  return (
      shouldDisplay && (
          <div style={{marginLeft: (indentLevel * 10) + "px"}}>
            <TaskLabelFlat me={me} task={task}
                           onSelectTask={onLocalSelectTask}
                           showOnSelectTask={showOnSelectTask}
                           toggleDisplayChildren={toggleDisplayChildren} displayChildren={displayChildren}
                           hasChildren={taskingData.length > 0 || task.tasks.length > 0}
            />
            { displayChildren &&
              taskingData.map( (tsk) => (
                  <TaskRowFlat key={"taskrow: " + tsk.id} indentLevel={indentLevel+1}
                               me={me} task={tsk} onSelectTask={()=>{onSelectTask(tsk)}}
                               filterOptions={filterOptions} showOnSelectTask={true}
                               selectedTask={selectedTask}
                               taskChildrenStore={taskChildrenStore} active={active}
                  />
              ))
            }
          </div>
      )
  )
}
const TaskLabel = ({task, dropdownOpen, toggleTaskDropdown, me, newlyIssuedTasks, displayChildren, toggleDisplayChildren, hasChildren, active=true}) => {
  const [fromNow] = React.useState(getSkewedNow());
  const theme = useMythicTheme();
  const prevResponseMaxId = useRef(0);
  useEffect( () => {
    //console.log("in use effect", prevResponseCount.current, props.task.responses);
    let currentData = task.response_count;
    if(!dropdownOpen){
      // only automatically open the dropdown if a new response comes in while we're looking
      if((new Date(task.timestamp + "Z")) >= fromNow){
        if(prevResponseMaxId.current === 0 && currentData > 0){
          toggleTaskDropdown();
          prevResponseMaxId.current = currentData;
        }
      } else if(newlyIssuedTasks !== undefined) {
        let newIndex = newlyIssuedTasks.findIndex( (e) => e === task.id);
        if (newIndex > -1) {
          toggleTaskDropdown();
          prevResponseMaxId.current = currentData;
          newlyIssuedTasks.splice(newIndex, 1);
        }
      }
    }else{
      prevResponseMaxId.current = currentData;
    }
  }, [task.response_count, dropdownOpen]);
  const scrollContent = (node, isAppearing) => {
    // only auto-scroll if you issued the task
    if(task.operator.username === (me?.user?.username || "")){
      let el = document.getElementById(`taskingPanel${task.callback_id}`);
      if(el && el.scrollHeight - el.scrollTop - el.clientHeight < 100){
        document.getElementById(`scrolltotask${task.id}`)?.scrollIntoView({
          //behavior: "smooth",
          block: "start",
          inline: "start"
        });
      }
    }
  }

  return (
    <StyledPaper className={classes.root + " no-box-shadow"} elevation={5}  id={`taskHeader-${task.id}`}>
      <Accordion TransitionProps={{ unmountOnExit: true, onEnter: scrollContent }} defaultExpanded={false}
                 onChange={toggleTaskDropdown} expanded={dropdownOpen}
                 sx={{
                   backgroundColor: "unset",
                   backgroundImage: "unset",
                   border: 0,
                   boxShadow: "unset",
                   "&:before": {display: "none"},
                   "&.Mui-expanded": {margin: 0},
                 }}
      >
        <StyledAccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls={`panel1c-content-task-${task.id}`}
          id={`panel1c-header-${task.id}`}
          classes={accordionClasses}
        >
          <ColoredTaskLabel theme={theme} task={task} me={me} taskDivID={'scrolltotask' + task.id}
            displayChildren={displayChildren} toggleDisplayChildren={toggleDisplayChildren}
                            expanded={dropdownOpen}
                            hasChildren={hasChildren}
                            onClick={toggleTaskDropdown}
          />
        </StyledAccordionSummary>
        {active && <TaskDisplayContainer key={task.id} me={me} task={task} />}
      </Accordion>
  </StyledPaper>
  );
}
export const getLabelText = (task, graphView) => {
  if(graphView){
      if(task.display_params.length > 50){
        return (task?.command?.cmd || task.command_name) + " " + task.display_params.substring(0, 50) + "...";
      }
      return (task?.command?.cmd || task.command_name) + " " + task.display_params.substring(0, 50);
  }
  return (task?.command?.cmd || task.command_name) + " " + task.display_params;
}
export const TaskLabelFlat = ({task, me, showOnSelectTask, onSelectTask, graphView, displayChildren, toggleDisplayChildren, hasChildren}) => {
  const theme = useMythicTheme();

  useLayoutEffect( () => {
    if(task.operator.username === (me?.user?.username || "")){
      scrollContent();
    }
  }, [])

  const scrollContent = (node, isAppearing) => {
    // only auto-scroll if you issued the task
    if(task.operator.username === (me?.user?.username || "")){
      let el = document.getElementById(`taskingPanelSplit${task.callback_id}`);
      if(el && el.scrollHeight - el.scrollTop - el.clientHeight < 100){
        document.getElementById(`scrolltotasksplit${task.id}`)?.scrollIntoView({
          //behavior: "smooth",
          block: "start",
          inline: "start"
        });
      }
    }

  }
  const onClickEntry = (e) => {
    if(showOnSelectTask){
      onSelectTask(e);
    }
  }

  return(
      <StyledPaper className={task.selected && showOnSelectTask ? classes.root + " selectedTask no-box-shadow" : classes.root}
                   elevation={5} style={{marginRight: 0, cursor: "pointer"}} id={`taskHeader-${task.id}`}
                   onClick={onClickEntry}
      >
        <ColoredTaskLabel theme={theme} task={task} me={me} taskDivID={`scrolltotasksplit${task.id}`} onClick={onClickEntry}
                          displayChildren={displayChildren} toggleDisplayChildren={toggleDisplayChildren} expanded={false}
                          hasChildren={hasChildren}
                          compact={showOnSelectTask}
        />
      </StyledPaper>
  )
}


const ColoredTaskDisplayConsole = ({task, theme, children, expanded}) => {
  const themeColor = getTaskAccentColor(task, theme);
  return(
      <span style={{display: "flex", margin: 0, borderWidth: 0, padding: "8px 10px 8px 9px", minHeight: "58px", alignItems: "center",
        height: "100%", borderLeft: "4px solid " + themeColor, width: "100%",
        borderTopLeftRadius: theme.shape.borderRadius, borderBottomLeftRadius: expanded ? 0 : theme.shape.borderRadius}}>
        {children}
      </span>
  )
}
const TaskRowConsole = ({task, filterOptions, me, newlyIssuedTasks, indentLevel, taskChildrenStore, active=true}) => {
  const taskingData = useTaskChildren({taskID: task.id, taskChildrenStore, active});
  const [shouldDisplay, setShouldDisplay] = React.useState(true);
  const hideBrowserTasking = GetMythicSetting({setting_name: "hideBrowserTasking", default_value: operatorSettingDefaults.hideBrowserTasking});

  useEffect( () => {
    /*props.onSubmit({
    "operatorsList": onlyOperators,
    "commentsFlag": onlyHasComments,
    "commandsList": onlyCommands,
    "everythingButList": everythingBut,
    "parameterString": onlyParameters,
    "hideErrors": hideErrors
  }); */
    if(hideBrowserTasking && task.tasking_location.includes("browser")){
      setShouldDisplay(false);
      return;
    }
    if(task.display_params.includes("help") && task.operator.username !== me.user.username){
      setShouldDisplay(false);
      return;
    }
    if(filterOptions === undefined){
      if(!shouldDisplay){
        setShouldDisplay(true);
      }
      return;
    }
    if(filterOptions["operatorsList"].length > 0){
      if(!filterOptions["operatorsList"].includes(task.operator.username)){
        if(shouldDisplay){
          setShouldDisplay(false);
        }
        return;
      }
    }
    if(filterOptions["commentsFlag"]){
      if(task.comment === ""){
        if(shouldDisplay){
          setShouldDisplay(false);
        }
        return;
      }
    }
    if(filterOptions["commandsList"].length > 0){
      // only show these commands
      if(!filterOptions["commandsList"].includes(task.command_name)){
        if(shouldDisplay){
          setShouldDisplay(false);
        }
        return;
      }
    }
    if(filterOptions["everythingButList"].length > 0){
      if(filterOptions["everythingButList"].includes(task.command_name)){
        if(shouldDisplay){
          setShouldDisplay(false);
        }
        return;
      }
    }
    if(filterOptions["parameterString"] !== ""){
      let regex = new RegExp(filterOptions["parameterString"]);
      if(!regex.test(task.display_params)){
        if(shouldDisplay){
          setShouldDisplay(false);
        }
        return;
      }
    }
    if(filterOptions["hideErrors"]){
      if(task.status.includes("error")){
        if(shouldDisplay){
          setShouldDisplay(false);
        }
        return;
      }
    }
    if(!shouldDisplay){
      setShouldDisplay(true);
    }
  }, [filterOptions, task.comment, task.command, task.display_params, task.operator.username]);
  // marginLeft: (indentLevel * 10) + "px"
  return (
      shouldDisplay ? (
          <div>
            <TaskLabelConsole me={me} task={task} newlyIssuedTasks={newlyIssuedTasks} active={active} />
            {
              taskingData.map( (tsk) => (
                  <TaskRowConsole key={"taskrow: " + tsk.id} me={me} task={tsk}
                                  filterOptions={filterOptions} indentLevel={indentLevel+1}
                                  taskChildrenStore={taskChildrenStore} active={active}/>
              ))
            }
          </div>

      ) : null
  )
}
export const ColoredTaskLabelConsole = ({task, theme, me, taskDivID, onClick, displayChildren, toggleDisplayChildren, expanded }) => {
  const taskingDisplayFields = useTaskingDisplayFields();
  const initialTaskTimestampDisplayField = GetMythicSetting({setting_name: "taskTimestampDisplayField", default_value: operatorSettingDefaults.taskTimestampDisplayField});
  const displayTimestamp = task[initialTaskTimestampDisplayField] ? task[initialTaskTimestampDisplayField] : task.timestamp;
  const [openKillTaskButton, setOpenKillTaskButton] = React.useState({open: false});
  const command = task?.command?.cmd || task.command_name;
  const commandLine = command + " " + task.display_params;
  const onClickKillIcon = (e, open) => {
    if(e){
      e.stopPropagation();
    }
    setOpenKillTaskButton({open: open});
  }
  return (
	    <ColoredTaskDisplayConsole task={task} theme={theme} expanded={expanded}>
	        <div id={taskDivID} className={classes.taskHeaderBody}
               onClick={(e) => handleTaskHeaderClick(e, onClick)}>
            <div className={classes.taskMetaRow}>
              {taskingDisplayFields.map((fieldName) => (
                <TaskingMetadataField
                  compactTimestamp
                  displayTimestamp={displayTimestamp}
                  fieldName={fieldName}
                  key={fieldName}
                  me={me}
                  task={task}
                />
              ))}
              {(task.opsec_pre_blocked && !task.opsec_pre_bypassed) &&
                <TaskMetaItem title={"OPSEC blocked before tasking"} icon={<WarningAmberIcon />}>
                  OPSEC pre
                </TaskMetaItem>
              }
              {(task.opsec_post_blocked && !task.opsec_post_bypassed) &&
                <TaskMetaItem title={"OPSEC blocked after tasking"} icon={<WarningAmberIcon />}>
                  OPSEC post
                </TaskMetaItem>
              }
              <span className={classes.taskHeaderActions}>
                {!task.completed && task.status_timestamp_processing &&
                  <TaskHeaderAction title={"Task the agent to kill this task"} onClick={(e) => onClickKillIcon(e, true)}>
                    <FontAwesomeIcon size={"sm"} icon={faSkullCrossbones} style={{height: "0.82rem"}} />
                  </TaskHeaderAction>
                }
                <TaskStatusDisplay task={task}/>
              </span>
            </div>
            <MythicStyledTooltip
                title={commandLine}
                maxWidth="calc(80vw)"
                enterDelay={2000}
                placement="top">
              <Typography className={classes.taskCommandText} component="div"
                          sx={{display: "flex", alignItems: "baseline", gap: "6px", fontFamily: 'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'}}>
                <span className={classes.consolePrompt}>{">"}</span>
                <span style={{minWidth: 0}}>
                  <span className={classes.taskCommandName}>{command}</span>
                  {task.display_params !== "" &&
                    <span className={classes.taskCommandParams}> <TaskReferenceDisplay text={task.display_params}/></span>
                  }
                </span>
              </Typography>
            </MythicStyledTooltip>
	        </div>
          {openKillTaskButton.open &&
              <TaskFromUIButton ui_feature={"task:job_kill"}
                                callback_id={task.callback?.id}
                                display_id={task.callback?.display_id}
                                parameters={task.agent_task_id}
                                openDialog={false}
                                getConfirmation={true}
                                acceptText={"KILL JOB"}
                                selectCallback={false}
                                onTasked={({tasked}) => onClickKillIcon(null, false)}/>
          }
	    </ColoredTaskDisplayConsole>
	);
}
const TaskLabelConsole = ({task, me, active=true}) => {
  const theme = useMythicTheme();
  useLayoutEffect( () => {
    if(task.operator.username === (me?.user?.username || "")){
      scrollContent();
    }
  }, [])
  const scrollContent = (node, isAppearing) => {
    // only auto-scroll if you issued the task
    if(task.operator.username === (me?.user?.username || "")){
      let el = document.getElementById(`taskingPanelConsole${task.callback_id}`);
      if(el && el.scrollHeight - el.scrollTop - el.clientHeight < 100){
        document.getElementById(`scrolltotaskconsole${task.id}`)?.scrollIntoView({
          //behavior: "smooth",
          block: "start",
          inline: "start"
        });
      }
    }

  }

  return (
      <StyledPaper className={classes.root + " no-box-shadow"} elevation={5} style={{marginRight: 0, marginBottom: "5px"}} id={`taskHeader-${task.id}`}>
          <ColoredTaskLabelConsole theme={theme} task={task} me={me} taskDivID={`scrolltotaskconsole${task.id}`} expanded={true}/>
          {active && <TaskDisplayContainerConsole me={me} task={task} />}
      </StyledPaper>
  );
}
