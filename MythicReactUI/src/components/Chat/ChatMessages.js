import {useMythicTheme} from "../../themes/MythicThemeProvider";
import React, {useState} from "react";
import ReactMarkdown from "react-markdown";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SmartToyTwoToneIcon from "@mui/icons-material/SmartToyTwoTone";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {findIconDefinition} from "@fortawesome/fontawesome-svg-core";
import {MythicStyledTooltip} from "../MythicComponents/MythicStyledTooltip";
import {snackActions} from "../utilities/Snackbar";
import {markdownPlugins} from "../utilities/Markdown";
import {markdownComponents} from "../utilities/MarkdownComponents";
import {getIconName} from "../utilities/IconName";
import {MythicStack, MythicTruncatedText} from "../MythicComponents/MythicLayout";
import {formatChatTimestamp as formatTimestamp, jsonTextForChatConfigValue as jsonTextForConfigValue} from "./ChatFormatters";
import pageStyles from "./ChatPage.module.css";
import channelStyles from "./ChatChannelView.module.css";
import adapterStyles from "./ChatContentAdapter.module.css";
import {MythicActionButton} from "../MythicComponents/MythicContent";

const CHAT_STYLE_MAP = {...pageStyles, ...channelStyles, ...adapterStyles};
const chatClasses = (value = "") => String(value).split(/\s+/).filter(Boolean)
    .map((className) => CHAT_STYLE_MAP[className] || className).join(" ");

const ChatInlineEvent = ({children, state}) => (
  <MythicStack
    className={chatClasses("mythic-chat-inline-event mythic-max-width-full mythic-relative mythic-text-primary")}
    data-state={state}
    data-mythic-component="chat-inline-event"
    gap="none"
  >
    {children}
  </MythicStack>
);

const ChatSpecialStatus = ({label}) => (
  <Chip
    className={chatClasses("mythic-chat-special-status mythic-border-radius mythic-font-weight-extra-bold mythic-flex-fixed mythic-font-size-xs")}
    label={label}
    size="small"
    variant="outlined"
  />
);

const ChatInlineEventDetails = ({children}) => (
  <MythicStack className={chatClasses("mythic-chat-inline-event-details")} gap="none">
    {children}
  </MythicStack>
);

const MarkdownMessage = React.memo(({
  message
}) => {
  if (!message) {
    return null;
  }
  return <Box className={chatClasses("mythic-chat-markdown mythic-break-anywhere")}>
            <ReactMarkdown remarkPlugins={markdownPlugins} components={markdownComponents} skipHtml>
                {message}
            </ReactMarkdown>
        </Box>;
});
const ChatAssistantMessage = React.memo(({
  message,
  timestamp,
  viewUTCTime
}) => {
  const formattedTimestamp = formatTimestamp(timestamp, viewUTCTime);
  return <Box className={chatClasses("mythic-chat-assistant-message mythic-max-width-full mythic-min-width-0 mythic-text-primary")}>

            {formattedTimestamp && <Typography variant="caption" color="text.secondary" className={chatClasses("mythic-chat-assistant-timestamp mythic-block")}>
                    {formattedTimestamp}
                </Typography>}
            <MarkdownMessage message={message} />
        </Box>;
});
const CHAT_SPECIAL_TYPE_EVENTING_USER_INTERACTION = "eventing_user_interaction";
const CHAT_SPECIAL_TYPE_INPUT_REQUESTED = "input_requested";
const CHAT_SPECIAL_TYPE_TOOL_USE = "tool_use";
const CHAT_SPECIAL_TYPE_SUBAGENT = "subagent";
const subagentFallbackIcons = ["SA", "AI", "OPS", "T1", "JOB", "RUN"];
const subagentFallbackPalette = ["info", "success", "warning", "primary", "secondary"];
const getChatMessageMetadata = message => {
  const metadata = message?.metadata || {};
  if (typeof metadata === "string") {
    try {
      const parsed = JSON.parse(metadata);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch (error) {
      return {};
    }
  }
  return metadata && typeof metadata === "object" && !Array.isArray(metadata) ? metadata : {};
};
const getMetadataString = (metadata, key) => {
  const value = metadata?.[key];
  return typeof value === "string" ? value.trim() : "";
};
export const getMessageDelegationID = message => getMetadataString(getChatMessageMetadata(message), "delegation_id");
export const getMessageDelegationName = message => getMetadataString(getChatMessageMetadata(message), "delegation_name");
export const getEventingInteractionSnapshot = message => {
  const metadata = getChatMessageMetadata(message);
  if (metadata.special_type !== CHAT_SPECIAL_TYPE_EVENTING_USER_INTERACTION) {
    return null;
  }
  const snapshot = metadata.eventing_user_interaction || {};
  return snapshot && typeof snapshot === "object" && !Array.isArray(snapshot) ? snapshot : {};
};
const getInputRequestedSnapshot = message => {
  const metadata = getChatMessageMetadata(message);
  if (metadata.special_type !== CHAT_SPECIAL_TYPE_INPUT_REQUESTED) {
    return null;
  }
  const snapshot = metadata.input_requested || {};
  return snapshot && typeof snapshot === "object" && !Array.isArray(snapshot) ? snapshot : {};
};
const getToolUseSnapshot = message => {
  const metadata = getChatMessageMetadata(message);
  if (metadata.special_type !== CHAT_SPECIAL_TYPE_TOOL_USE) {
    return null;
  }
  const snapshot = metadata.tool_use || {};
  return snapshot && typeof snapshot === "object" && !Array.isArray(snapshot) ? snapshot : {};
};
export const getSubagentSnapshot = message => {
  const metadata = getChatMessageMetadata(message);
  if (metadata.special_type !== CHAT_SPECIAL_TYPE_SUBAGENT) {
    return null;
  }
  const snapshot = metadata.subagent || {};
  return snapshot && typeof snapshot === "object" && !Array.isArray(snapshot) ? snapshot : {};
};
const hashStringToIndex = (value, length) => {
  if (length <= 0) {
    return 0;
  }
  const text = `${value || ""}`;
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % length;
};
export const isPendingChatHumanInteraction = message => {
  const inputRequestedSnapshot = getInputRequestedSnapshot(message);
  if (inputRequestedSnapshot) {
    return (inputRequestedSnapshot.status || "pending") === "pending";
  }
  const eventingInteractionSnapshot = getEventingInteractionSnapshot(message);
  if (eventingInteractionSnapshot) {
    return Boolean(eventingInteractionSnapshot.waiting);
  }
  return false;
};
export const shouldShowMessageInMainChat = message => {
  const delegationID = getMessageDelegationID(message);
  if (!delegationID) {
    return true;
  }
  if (getSubagentSnapshot(message)) {
    return true;
  }
  return isPendingChatHumanInteraction(message);
};
const getChatEventingPrompt = snapshot => {
  if (snapshot.approval_required && snapshot.approval_prompt) {
    return snapshot.approval_prompt;
  }
  if (snapshot.input_required && snapshot.input_prompt) {
    return snapshot.input_prompt;
  }
  if (snapshot.approval_required && snapshot.input_required) {
    return "Approval and input are required before this step can continue.";
  }
  if (snapshot.approval_required) {
    return "Approval is required before this step can continue.";
  }
  return "Input is required before this step can continue.";
};
const chatEventingStatusLabels = {
  awaiting_approval: "Awaiting approval",
  input_needed: "Input needed",
  queued: "Queued",
  running: "Running",
  success: "Success",
  error: "Error",
  cancelled: "Cancelled",
  skipped: "Skipped"
};
const getChatEventingStatusText = snapshot => {
  if (snapshot.status === "awaiting_approval") {
    return "Awaiting approval";
  }
  if (snapshot.status === "input_needed") {
    return "Input needed";
  }
  return chatEventingStatusLabels[snapshot.status] || snapshot.status || "Unknown";
};
const getChatEventingStateClass = snapshot => {
  switch (snapshot.status) {
    case "success":
      return "success";
    case "error":
    case "cancelled":
      return "error";
    case "running":
      return "running";
    case "queued":
      return "queued";
    case "awaiting_approval":
    case "input_needed":
      return "waiting";
    default:
      return snapshot.waiting ? "waiting" : "neutral";
  }
};
const ChatEventingUserInteractionEvent = ({
  message,
  me,
  onRefresh,
  onReview,
  refreshing
}) => {
  const metadata = getChatMessageMetadata(message);
  const snapshot = getEventingInteractionSnapshot(message) || {};
  const waiting = Boolean(snapshot.waiting);
  const statusText = getChatEventingStatusText(snapshot);
  const stateClass = getChatEventingStateClass(snapshot);
  const stepName = snapshot.step_name || `Step ${snapshot.eventstepinstance_id || ""}`.trim();
  const requirementText = [snapshot.approval_required ? "approval" : null, snapshot.input_required ? `${snapshot.input_count || 0} input${snapshot.input_count === 1 ? "" : "s"}` : null].filter(Boolean).join(" + ");
  const refreshedAt = metadata.refreshed_at || snapshot.user_interaction_updated_at;
  const detailItems = [snapshot.step_action ? {
    label: "Action",
    value: snapshot.step_action
  } : null, requirementText ? {
    label: "Needs",
    value: requirementText
  } : null, snapshot.run_operator_username ? {
    label: "Run as",
    value: snapshot.run_operator_username
  } : null, snapshot.resolved_by_username ? {
    label: "Resolved by",
    value: snapshot.resolved_by_username
  } : null].filter(Boolean);
  const [showDetails, setShowDetails] = useState(waiting);
  React.useEffect(() => {
    if (!waiting) {
      setShowDetails(false);
    }
  }, [waiting]);
  return <ChatInlineEvent state={stateClass}>
            <Box className={chatClasses("mythic-chat-inline-event-summary mythic-justify-between mythic-gap-sm mythic-flex mythic-min-width-0 mythic-align-center")}>
                <Box className={chatClasses("mythic-chat-inline-event-main mythic-flex mythic-flex-fill mythic-min-width-0 mythic-align-center")}>
                    <ChatSpecialStatus label={statusText} />

                    <Typography className={chatClasses("mythic-chat-inline-event-title mythic-min-width-0 mythic-text-secondary")} variant="body2" noWrap>
                        Eventing interaction: {stepName}
                    </Typography>
                </Box>
                <Box className={chatClasses("mythic-chat-inline-event-actions mythic-gap-xs mythic-flex mythic-align-center mythic-flex-fixed")}>
                    <MythicStyledTooltip title="Refresh">
                        <span>
                            <IconButton aria-label="Refresh eventing interaction" className={chatClasses("mythic-chat-special-refresh-button mythic-border-radius")} disabled={refreshing} onClick={() => onRefresh(message)} size="small">

                                <RestartAltIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </MythicStyledTooltip>
                    {waiting && <MythicActionButton tone="success" size="small" variant="contained"  onClick={() => onReview(message)}>

                            Review
                        </MythicActionButton>}
                    <Button size="small" variant="text" className={chatClasses("mythic-chat-inline-details-toggle mythic-text-secondary mythic-border-radius mythic-font-size-caption")} startIcon={showDetails ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />} onClick={() => setShowDetails(open => !open)}>

                        Details
                    </Button>
                </Box>
            </Box>
            <Collapse in={showDetails} timeout="auto" unmountOnExit>
                <ChatInlineEventDetails>
                    <Typography variant="caption" className={chatClasses("mythic-chat-inline-event-description mythic-pre-wrap mythic-text-secondary")}>
                        {getChatEventingPrompt(snapshot)}
                    </Typography>
                    <Box className={chatClasses("mythic-chat-special-card-details mythic-grid mythic-min-width-0")}>
                        {detailItems.map(item => <span className={chatClasses("mythic-chat-special-card-detail mythic-stack")} key={`${message.id}-${item.label}`}>
                                <span className={chatClasses("mythic-chat-special-card-detail-label mythic-letter-spacing-reset mythic-uppercase mythic-font-weight-heavy mythic-text-secondary")}>{item.label}</span>
                                <span className={chatClasses("mythic-chat-special-card-detail-value mythic-truncate mythic-line-height-tight mythic-font-size-caption mythic-font-weight-bold mythic-nowrap mythic-overflow-hidden mythic-text-primary")}>{item.value}</span>
                            </span>)}
                    </Box>
                    {refreshedAt && <Typography className={chatClasses("mythic-chat-special-card-refresh-time mythic-truncate mythic-flex-fill mythic-text-secondary")} variant="caption">
                            Refreshed {formatTimestamp(refreshedAt, me?.user?.view_utc_time)}
                        </Typography>}
                </ChatInlineEventDetails>
            </Collapse>
        </ChatInlineEvent>;
};
const getInputRequestedStatusText = snapshot => {
  const status = snapshot.status || "pending";
  if (status === "pending") {
    return "Input requested";
  }
  if (status === "accepted") {
    return "Accepted";
  }
  if (status === "rejected") {
    return "Rejected";
  }
  if (status === "responded") {
    return "Responded";
  }
  if (status === "selected") {
    return "Selected";
  }
  if (status === "cancelled") {
    return "Cancelled";
  }
  return status;
};
const getInputRequestedStateClass = snapshot => {
  switch (snapshot.status || "pending") {
    case "accepted":
    case "selected":
      return "success";
    case "rejected":
    case "cancelled":
      return "error";
    case "responded":
      return "queued";
    case "pending":
      return "waiting";
    default:
      return "neutral";
  }
};
const ChatInputRequestedEvent = ({
  message,
  me,
  onSubmit,
  submitting
}) => {
  const snapshot = getInputRequestedSnapshot(message) || {};
  const pending = (snapshot.status || "pending") === "pending";
  const stateClass = getInputRequestedStateClass(snapshot);
  const statusText = getInputRequestedStatusText(snapshot);
  const inputType = snapshot.input_type || "approval";
  const title = snapshot.title || "Input requested";
  const prompt = snapshot.prompt || message.message || "";
  const choices = Array.isArray(snapshot.choices) ? snapshot.choices : [];
  const response = snapshot.response && typeof snapshot.response === "object" && !Array.isArray(snapshot.response) ? snapshot.response : null;
  const [showDetails, setShowDetails] = useState(pending);
  React.useEffect(() => {
    if (!pending) {
      setShowDetails(false);
    }
  }, [pending]);
  const detailItems = [{
    label: "Type",
    value: inputType
  }, message.updated_at ? {
    label: "Updated",
    value: formatTimestamp(message.updated_at, me?.user?.view_utc_time)
  } : null, snapshot.resolved_at ? {
    label: "Resolved",
    value: formatTimestamp(snapshot.resolved_at, me?.user?.view_utc_time)
  } : null, snapshot.resolved_by ? {
    label: "Resolved by",
    value: snapshot.resolved_by
  } : null, response?.action ? {
    label: "Action",
    value: response.action
  } : null].filter(Boolean);
  const dataText = jsonTextForConfigValue(snapshot.data || {});
  const responseText = response ? jsonTextForConfigValue(response) : "";
  return <ChatInlineEvent state={stateClass}>
            <Box className={chatClasses("mythic-chat-inline-event-summary mythic-justify-between mythic-gap-sm mythic-flex mythic-min-width-0 mythic-align-center")}>
                <Box className={chatClasses("mythic-chat-inline-event-main mythic-flex mythic-flex-fill mythic-min-width-0 mythic-align-center")}>
                    <ChatSpecialStatus label={statusText} />

                    <Typography className={chatClasses("mythic-chat-inline-event-title mythic-min-width-0 mythic-text-secondary")} variant="body2" noWrap>
                        {title}
                    </Typography>
                </Box>
                <Box className={chatClasses("mythic-chat-inline-event-actions mythic-gap-xs mythic-flex mythic-align-center mythic-flex-fixed")}>
                    {pending && inputType === "approval" && <>
                            <MythicActionButton tone="success" size="small" variant="contained"  disabled={submitting} onClick={() => onSubmit(message, "accept")}>

                                Accept
                            </MythicActionButton>
                            <Button size="small" variant="text" disabled={submitting} onClick={() => onSubmit(message, "reject")}>

                                Reject
                            </Button>
                            <Button size="small" variant="text" disabled={submitting} onClick={() => onSubmit(message, "respond")}>

                                Respond
                            </Button>
                        </>}
                    {pending && inputType === "text" && <MythicActionButton tone="success" size="small" variant="contained"  disabled={submitting} onClick={() => onSubmit(message, "respond")}>

                            Respond
                        </MythicActionButton>}
                    <Button size="small" variant="text" className={chatClasses("mythic-chat-inline-details-toggle mythic-text-secondary mythic-border-radius mythic-font-size-caption")} startIcon={showDetails ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />} onClick={() => setShowDetails(open => !open)}>

                        Details
                    </Button>
                </Box>
            </Box>
            <Collapse in={showDetails} timeout="auto" unmountOnExit>
                <ChatInlineEventDetails>
                    {prompt && <Typography variant="caption" className={chatClasses("mythic-chat-inline-event-description mythic-pre-wrap mythic-text-secondary")}>
                            {prompt}
                        </Typography>}
                    {snapshot.description && <Typography variant="caption" className={chatClasses("mythic-chat-inline-event-description mythic-pre-wrap mythic-text-secondary")}>
                            {snapshot.description}
                        </Typography>}
                    {pending && inputType === "single_choice" && <Box className={chatClasses("mythic-chat-input-choice-list mythic-gap-sm mythic-flex mythic-flex-column mythic-full-width")}>
                            {choices.map((choice, index) => {
            const choiceID = choice?.id || `${index}`;
            return <Button key={`${message.id}-choice-${choiceID}`} className={chatClasses("mythic-chat-input-choice mythic-align-stretch mythic-border-radius mythic-justify-start")} disabled={submitting} onClick={() => onSubmit(message, "select", {
              choice_id: choiceID
            })} variant="outlined">

                                        <Box className={chatClasses("mythic-chat-input-choice-content mythic-stack mythic-full-width")}>
                                            <Typography variant="body2" className={chatClasses("mythic-chat-input-choice-label mythic-font-weight-strong mythic-text-primary mythic-line-height-snug")}>
                                                {choice?.label || choiceID}
                                            </Typography>
                                            {choice?.description && <Typography variant="caption" color="text.secondary" className={chatClasses("mythic-chat-input-choice-description mythic-line-height-snug")}>
                                                    {choice.description}
                                                </Typography>}
                                        </Box>
                                    </Button>;
          })}
                        </Box>}
                    <Box className={chatClasses("mythic-chat-special-card-details mythic-grid mythic-min-width-0")}>
                        {detailItems.map(item => <span className={chatClasses("mythic-chat-special-card-detail mythic-stack")} key={`${message.id}-${item.label}`}>
                                <span className={chatClasses("mythic-chat-special-card-detail-label mythic-letter-spacing-reset mythic-uppercase mythic-font-weight-heavy mythic-text-secondary")}>{item.label}</span>
                                <span className={chatClasses("mythic-chat-special-card-detail-value mythic-truncate mythic-line-height-tight mythic-font-size-caption mythic-font-weight-bold mythic-nowrap mythic-overflow-hidden mythic-text-primary")}>{item.value}</span>
                            </span>)}
                    </Box>
                    {dataText !== "{}" && <Typography component="pre" variant="caption" className={chatClasses("mythic-chat-input-data mythic-pre-wrap mythic-text-primary mythic-border-radius mythic-overflow-auto")}>
                            {dataText}
                        </Typography>}
                    {responseText && <Typography component="pre" variant="caption" className={chatClasses("mythic-chat-input-data mythic-pre-wrap mythic-text-primary mythic-border-radius mythic-overflow-auto")}>
                            {responseText}
                        </Typography>}
                </ChatInlineEventDetails>
            </Collapse>
        </ChatInlineEvent>;
};
const getToolUseStatusText = snapshot => {
  switch (snapshot.status || "started") {
    case "started":
      return "Running";
    case "completed":
      return "Finished";
    case "error":
      return "Failed";
    case "waiting_confirmation":
      return "Waiting confirmation";
    default:
      return snapshot.status || "Tool use";
  }
};
const getToolUseStateClass = snapshot => {
  switch (snapshot.status || "started") {
    case "completed":
      return "success";
    case "error":
      return "error";
    case "waiting_confirmation":
      return "waiting";
    case "started":
      return "running";
    default:
      return "neutral";
  }
};
export const getSubagentStatusText = snapshot => {
  switch (`${snapshot.status || "running"}`.toLowerCase()) {
    case "finished":
    case "completed":
    case "complete":
      return "Finished";
    case "failed":
    case "error":
      return "Failed";
    case "cancelled":
      return "Cancelled";
    case "running":
    case "started":
      return "Running";
    default:
      return snapshot.status || "Sub-agent";
  }
};
export const getSubagentStateClass = snapshot => {
  switch (`${snapshot.status || "running"}`.toLowerCase()) {
    case "finished":
    case "completed":
    case "complete":
      return "success";
    case "failed":
    case "error":
    case "cancelled":
      return "error";
    case "running":
    case "started":
      return "running";
    default:
      return "neutral";
  }
};
const isTerminalSubagentSnapshot = snapshot => ["finished", "completed", "complete", "failed", "error", "cancelled"].includes(`${snapshot.status || ""}`.toLowerCase());
const normalizeFontAwesomeIconName = value => {
  const text = `${value || ""}`.trim();
  if (text === "") {
    return "";
  }
  if (text.includes(" ")) {
    const parts = text.split(/\s+/).filter(Boolean);
    return normalizeFontAwesomeIconName(parts[parts.length - 1]);
  }
  return text.replace(/^fas?-/, "").replace(/^fa-/, "").replace(/^fa(?=[A-Z])/, "").replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/_/g, "-").toLowerCase();
};
const resolveSubagentFontAwesomeIcon = iconName => {
  const text = `${iconName || ""}`.trim();
  if (text === "") {
    return null;
  }
  const browserScriptIcon = getIconName(text);
  if (browserScriptIcon && typeof browserScriptIcon === "object") {
    return browserScriptIcon;
  }
  const normalizedIconName = normalizeFontAwesomeIconName(text);
  if (normalizedIconName === "") {
    return null;
  }
  return findIconDefinition({
    prefix: "fas",
    iconName: normalizedIconName
  }) || null;
};
export const getSubagentVisual = (delegationID, snapshot, theme) => {
  const hashSource = delegationID || snapshot.title || snapshot.name || "subagent";
  const fallbackIcon = subagentFallbackIcons[hashStringToIndex(hashSource, subagentFallbackIcons.length)];
  const paletteName = subagentFallbackPalette[hashStringToIndex(`${hashSource}:color`, subagentFallbackPalette.length)];
  const fallbackColor = theme.palette[paletteName]?.main || theme.palette.info.main;
  const configuredIcon = `${snapshot.icon || ""}`.trim();
  const fontAwesomeIcon = resolveSubagentFontAwesomeIcon(configuredIcon);
  return {
    icon: fontAwesomeIcon ? "" : `${configuredIcon || fallbackIcon}`.slice(0, 4),
    fontAwesomeIcon,
    color: snapshot.icon_color || fallbackColor
  };
};
export const ChatSubagentAvatar = ({
  visual,
  size = 26
}) => {
  return <Box className={chatClasses(`mythic-chat-subagent-avatar mythic-inline-flex mythic-flex-fixed mythic-justify-center mythic-align-center mythic-line-height-compact mythic-font-weight-heavy mythic-border-radius ${size > 28 ? "mythic-font-size-small" : "mythic-font-size-xs"}`)} data-size={size > 28 ? "large" : "default"} style={{
    "--mythic-chat-avatar-color": visual.color || "var(--mythic-palette-info-main)",
    "--mythic-chat-avatar-size": `${size}px`
  }}>

            {visual.fontAwesomeIcon ? <FontAwesomeIcon icon={visual.fontAwesomeIcon} /> : visual.icon}
        </Box>;
};
const ChatSubagentEvent = ({
  message,
  me,
  onOpenDelegation
}) => {
  const theme = useMythicTheme();
  const snapshot = getSubagentSnapshot(message) || {};
  const delegationID = getMessageDelegationID(message);
  const delegationName = getMessageDelegationName(message) || snapshot.name || "Sub-agent";
  const summaryOutput = [message.message, snapshot.summary, snapshot.output, snapshot.result, snapshot.final_output].find(value => typeof value === "string" && value.trim()) || "";
  const title = snapshot.title || delegationName;
  const stateClass = getSubagentStateClass(snapshot);
  const visual = getSubagentVisual(delegationID, snapshot, theme);
  const terminal = isTerminalSubagentSnapshot(snapshot);
  const prompt = snapshot.prompt || "";
  const toolCount = Number(snapshot.tool_count ?? snapshot.tools_done ?? snapshot.completed_tools);
  const toolTotal = Number(snapshot.tool_total ?? snapshot.tools_total ?? snapshot.total_tools);
  const hasProgress = !Number.isNaN(toolCount) && !Number.isNaN(toolTotal) && toolTotal > 0;
  const [showDetails, setShowDetails] = useState(false);
  const detailItems = [delegationName ? {
    label: "Agent",
    value: delegationName
  } : null, delegationID ? {
    label: "Delegation",
    value: delegationID
  } : null, message.updated_at ? {
    label: terminal ? "End" : "Updated",
    value: formatTimestamp(message.updated_at, me?.user?.view_utc_time)
  } : null].filter(Boolean);
  return <ChatInlineEvent state={stateClass}>
            <Box className={chatClasses("mythic-chat-inline-event-summary mythic-justify-between mythic-gap-sm mythic-flex mythic-min-width-0 mythic-align-center")}>
                <Box className={chatClasses("mythic-chat-inline-event-main mythic-flex mythic-flex-fill mythic-min-width-0 mythic-align-center")}>
                    <ChatSubagentAvatar visual={visual} />
                    <ChatSpecialStatus label={getSubagentStatusText(snapshot)} />

                    {hasProgress && <ChatSpecialStatus label={`${toolCount}/${toolTotal} tools`} />}
                    <Typography className={chatClasses("mythic-chat-inline-event-title mythic-min-width-0 mythic-text-secondary")} variant="body2" noWrap>
                        {title}
                    </Typography>
                </Box>
                <Box className={chatClasses("mythic-chat-inline-event-actions mythic-gap-xs mythic-flex mythic-align-center mythic-flex-fixed")}>
                    {summaryOutput && <Button size="small" variant="text" className={chatClasses("mythic-chat-inline-details-toggle mythic-text-secondary mythic-border-radius mythic-font-size-caption")} startIcon={showDetails ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />} onClick={() => setShowDetails(open => !open)}>

                            Summary
                        </Button>}
                    {onOpenDelegation && <Button size="small" variant="outlined" className={chatClasses("mythic-chat-inline-details-toggle mythic-text-secondary mythic-border-radius mythic-font-size-caption")} onClick={() => onOpenDelegation(message)}>

                            Open
                        </Button>}
                </Box>
            </Box>
            <Collapse in={showDetails} timeout="auto" unmountOnExit>
                <ChatInlineEventDetails>
                    {prompt && <Typography variant="caption" className={chatClasses("mythic-chat-inline-event-description mythic-pre-wrap mythic-text-secondary")}>
                            {prompt}
                        </Typography>}
                    <Box className={chatClasses("mythic-chat-special-card-details mythic-grid mythic-min-width-0")}>
                        {detailItems.map(item => <span className={chatClasses("mythic-chat-special-card-detail mythic-stack")} key={`${message.id}-${item.label}`}>
                                <span className={chatClasses("mythic-chat-special-card-detail-label mythic-letter-spacing-reset mythic-uppercase mythic-font-weight-heavy mythic-text-secondary")}>{item.label}</span>
                                <span className={chatClasses("mythic-chat-special-card-detail-value mythic-truncate mythic-line-height-tight mythic-font-size-caption mythic-font-weight-bold mythic-nowrap mythic-overflow-hidden mythic-text-primary")}>{item.value}</span>
                            </span>)}
                    </Box>
                    {summaryOutput && <Box className={chatClasses("mythic-chat-assistant-message mythic-max-width-full mythic-chat-subagent-summary-output mythic-min-width-0 mythic-text-primary")}>

                            <MarkdownMessage message={summaryOutput} />
                        </Box>}
                </ChatInlineEventDetails>
            </Collapse>
        </ChatInlineEvent>;
};
const ChatToolUseEvent = ({
  message,
  me,
  onViewToolOutput
}) => {
  const snapshot = getToolUseSnapshot(message) || {};
  const [showDetails, setShowDetails] = useState(false);
  const stateClass = getToolUseStateClass(snapshot);
  const toolName = snapshot.tool_name || "unknown_tool";
  const source = snapshot.tool_source || "unknown";
  const sourceLabel = source === "mcp" ? "MCP" : source === "mythic" ? "Mythic" : "Tool";
  const isDuplicateMCPConfirmationWait = source === "mcp" && (snapshot.status || "") === "waiting_confirmation";
  const detailItems = [{
    label: "Source",
    value: source
  }, snapshot.server_name ? {
    label: "Server",
    value: snapshot.server_name
  } : null, snapshot.tool_call_id ? {
    label: "Call ID",
    value: snapshot.tool_call_id
  } : null, snapshot.tool_call_round ? {
    label: "Round",
    value: snapshot.tool_call_round
  } : null, snapshot.tool_call_count ? {
    label: "Call",
    value: `${snapshot.tool_call_index || 1} of ${snapshot.tool_call_count}`
  } : null, snapshot.requires_confirmation ? {
    label: "Confirmation",
    value: "Required"
  } : null, snapshot.confirmed ? {
    label: "Approval",
    value: "Confirmed"
  } : null, message.updated_at ? {
    label: "Updated",
    value: formatTimestamp(message.updated_at, me?.user?.view_utc_time)
  } : null].filter(Boolean);
  if (isDuplicateMCPConfirmationWait) {
    return null;
  }
  return <ChatInlineEvent state={stateClass}>
            <Box className={chatClasses("mythic-chat-inline-event-summary mythic-justify-between mythic-gap-sm mythic-flex mythic-min-width-0 mythic-align-center")}>
                <Box className={chatClasses("mythic-chat-inline-event-main mythic-flex mythic-flex-fill mythic-min-width-0 mythic-align-center")}>
                    <ChatSpecialStatus label={getToolUseStatusText(snapshot)} />

                    <Typography className={chatClasses("mythic-chat-inline-event-title mythic-min-width-0 mythic-text-secondary")} variant="body2" noWrap>
                        {sourceLabel} tool: {toolName}
                    </Typography>
                </Box>
                <Button size="small" variant="text" className={chatClasses("mythic-chat-inline-details-toggle mythic-text-secondary mythic-border-radius mythic-font-size-caption")} startIcon={showDetails ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />} onClick={() => setShowDetails(open => !open)}>

                    Details
                </Button>
                {snapshot.output_available && onViewToolOutput && <Button size="small" variant="outlined" className={chatClasses("mythic-chat-inline-details-toggle mythic-text-secondary mythic-border-radius mythic-font-size-caption")} onClick={() => onViewToolOutput(message)}>

                        View output
                    </Button>}
            </Box>
            <Collapse in={showDetails} timeout="auto" unmountOnExit>
                <ChatInlineEventDetails>
                    {message.message && <Typography variant="caption" className={chatClasses("mythic-chat-inline-event-description mythic-pre-wrap mythic-text-secondary")}>
                            {message.message}
                        </Typography>}
                    <Box className={chatClasses("mythic-chat-special-card-details mythic-grid mythic-min-width-0")}>
                        {detailItems.map(item => <span className={chatClasses("mythic-chat-special-card-detail mythic-stack")} key={`${message.id}-${item.label}`}>
                                <span className={chatClasses("mythic-chat-special-card-detail-label mythic-letter-spacing-reset mythic-uppercase mythic-font-weight-heavy mythic-text-secondary")}>{item.label}</span>
                                <span className={chatClasses("mythic-chat-special-card-detail-value mythic-truncate mythic-line-height-tight mythic-font-size-caption mythic-font-weight-bold mythic-nowrap mythic-overflow-hidden mythic-text-primary")}>{item.value}</span>
                            </span>)}
                    </Box>
                    {snapshot.result_preview && <Typography component="pre" variant="caption" className={chatClasses("mythic-chat-tooluse-result mythic-pre-wrap mythic-border-radius mythic-overflow-auto")}>
                            {snapshot.result_preview}
                        </Typography>}
                </ChatInlineEventDetails>
            </Collapse>
        </ChatInlineEvent>;
};
const ChatSpecialEventFrame = ({
  message,
  me,
  children
}) => {
  const formattedTimestamp = formatTimestamp(message.created_at, me?.user?.view_utc_time);
  return <Box className={chatClasses("mythic-chat-special-event-frame mythic-full-width mythic-min-width-0")}>

            {formattedTimestamp && <Typography variant="caption" color="text.secondary" className={chatClasses("mythic-chat-assistant-timestamp mythic-block")}>
                    {formattedTimestamp}
                </Typography>}
            {children}
        </Box>;
};
const MessageBubbleComponent = ({
  message,
  request,
  me,
  onEdit,
  onDelete,
  onRetry,
  onRefreshSpecial,
  onReviewSpecial,
  onSubmitInputResponse,
  onOpenDelegation,
  onViewToolOutput,
  refreshingSpecialMessageID,
  submittingInputResponseID,
  editing,
  editText,
  setEditText,
  saveEdit,
  cancelEdit
}) => {
  const [actionMenuAnchor, setActionMenuAnchor] = React.useState(null);
  const isMine = message.operator_id === me?.user?.user_id;
  const isAI = message.author_type === "ai";
  const isSystem = message.author_type === "system";
  const eventingInteractionSnapshot = getEventingInteractionSnapshot(message);
  const inputRequestedSnapshot = getInputRequestedSnapshot(message);
  const toolUseSnapshot = getToolUseSnapshot(message);
  const subagentSnapshot = getSubagentSnapshot(message);
  const canEdit = isMine && message.author_type === "operator" && !message.deleted;
  const canDelete = !message.deleted && (isMine || message.author_type !== "operator");
  const canCopy = !message.deleted && `${message.message || ""}` !== "";
  const hasMessageActions = canCopy || canEdit || canDelete;
  const streaming = message.status === "streaming";
  const closeActionMenu = () => setActionMenuAnchor(null);
  const copyMessageText = async () => {
    const text = `${message.message || ""}`;
    closeActionMenu();
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else if (typeof document !== "undefined") {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      } else {
        throw new Error("clipboard unavailable");
      }
      snackActions.success("Copied message text");
    } catch (error) {
      snackActions.error("Failed to copy message text");
    }
  };
  if (subagentSnapshot) {
    return <ChatSpecialEventFrame message={message} me={me}>
                <ChatSubagentEvent message={message} me={me} onOpenDelegation={onOpenDelegation} />
            </ChatSpecialEventFrame>;
  }
  if (toolUseSnapshot) {
    if ((toolUseSnapshot.tool_source || "unknown") === "mcp" && (toolUseSnapshot.status || "") === "waiting_confirmation") {
      return null;
    }
    return <ChatSpecialEventFrame message={message} me={me}>
                <ChatToolUseEvent message={message} me={me} onViewToolOutput={onViewToolOutput} />
            </ChatSpecialEventFrame>;
  }
  if (inputRequestedSnapshot) {
    return <ChatSpecialEventFrame message={message} me={me}>
                <ChatInputRequestedEvent message={message} me={me} onSubmit={onSubmitInputResponse} submitting={submittingInputResponseID === message.id} />

            </ChatSpecialEventFrame>;
  }
  if (eventingInteractionSnapshot) {
    return <ChatEventingUserInteractionEvent message={message} me={me} onRefresh={onRefreshSpecial} onReview={onReviewSpecial} refreshing={refreshingSpecialMessageID === message.id} />;
  }
  if (isAI && !eventingInteractionSnapshot) {
    return <ChatAssistantMessage message={message.message} timestamp={message.created_at} viewUTCTime={me?.user?.view_utc_time} />;
  }
  return <Box className={chatClasses(`mythic-chat-message-row mythic-justify-start mythic-flex ${isMine ? "mythic-chat-message-row-mine mythic-justify-end" : ""}`)}>
            <Box className={chatClasses(`mythic-chat-message mythic-max-width-full mythic-overflow-hidden mythic-min-width-0 mythic-border-radius-lg ${isAI ? "mythic-chat-message-ai" : ""} ${isSystem ? "mythic-chat-message-system" : ""}`.trim())} data-author={message.author_type || "operator"} data-mine={isMine || undefined}>

                <Box className={chatClasses("mythic-chat-message-header mythic-justify-between mythic-gap-sm mythic-flex mythic-align-center")}>
                    <Box className={chatClasses("mythic-chat-author mythic-font-weight-strong mythic-gap-xs mythic-inline-cluster mythic-min-width-0")}>
                        {isAI && <SmartToyTwoToneIcon fontSize="small" color="info" />}
                        <MythicTruncatedText component="span" >{message.sender_display_name || message.operator?.username || "unknown"}</MythicTruncatedText>
                        {message.edited && !message.deleted && <Chip size="small" variant="outlined" label="edited" />}
                        {streaming && <Chip size="small" color="warning" variant="outlined" label={message.status} />}
                    </Box>
                    <Box className={chatClasses("mythic-chat-message-actions mythic-nowrap mythic-flex mythic-align-center")}>
                        <Typography variant="caption" color="text.secondary">{formatTimestamp(message.created_at, me?.user?.view_utc_time)}</Typography>
                        {request && ["error", "cancelled"].includes(request.status) && (message.status === "error" || message.status === "cancelled") && <MythicStyledTooltip title="Retry request">
                                <IconButton size="small" onClick={() => onRetry(request.id)}>
                                    <RestartAltIcon fontSize="small" />
                                </IconButton>
                            </MythicStyledTooltip>}
                        {hasMessageActions && <>
                                <MythicStyledTooltip title="Message actions">
                                    <IconButton size="small" aria-controls={actionMenuAnchor ? `chat-message-actions-${message.id}` : undefined} aria-haspopup="true" aria-expanded={actionMenuAnchor ? "true" : undefined} onClick={e => setActionMenuAnchor(e.currentTarget)}>

                                        <MoreVertIcon fontSize="small" />
                                    </IconButton>
                                </MythicStyledTooltip>
                                <Menu id={`chat-message-actions-${message.id}`} anchorEl={actionMenuAnchor} open={Boolean(actionMenuAnchor)} onClose={closeActionMenu} anchorOrigin={{
              vertical: "bottom",
              horizontal: "right"
            }} transformOrigin={{
              vertical: "top",
              horizontal: "right"
            }}>

                                    {canCopy && <MenuItem onClick={copyMessageText}>
                                            <ListItemIcon>
                                                <ContentCopyIcon fontSize="small" />
                                            </ListItemIcon>
                                            <ListItemText>Copy text</ListItemText>
                                        </MenuItem>}
                                    {canEdit && <MenuItem onClick={() => {
                closeActionMenu();
                onEdit(message);
              }}>
                                            <ListItemIcon>
                                                <EditIcon fontSize="small" />
                                            </ListItemIcon>
                                            <ListItemText>Edit</ListItemText>
                                        </MenuItem>}
                                    {canDelete && <MenuItem onClick={() => {
                closeActionMenu();
                onDelete(message.id);
              }}>
                                            <ListItemIcon>
                                                <DeleteIcon fontSize="small" />
                                            </ListItemIcon>
                                            <ListItemText>Delete</ListItemText>
                                        </MenuItem>}
                                </Menu>
                            </>}
                    </Box>
                </Box>
                {editing ? <Box className={chatClasses("mythic-chat-edit-box mythic-gap-sm mythic-flex mythic-flex-column")}>
                        <TextField fullWidth multiline minRows={2} value={editText} onChange={e => setEditText(e.target.value)} size="small" />

                        <Box className={chatClasses("mythic-chat-edit-actions mythic-justify-end mythic-gap-sm mythic-flex")}>
                            <Button size="small" onClick={cancelEdit}>Cancel</Button>
                            <Button size="small" variant="contained" onClick={saveEdit}>Save</Button>
                        </Box>
                    </Box> : <MarkdownMessage message={message.message} />}
                {request?.error && <Typography variant="caption" color="error" sx={{
        display: "block",
        mt: 0.5
      }}>{request.error}</Typography>}
            </Box>
        </Box>;
};
const messageBubblePropsAreEqual = (previous, next) => previous.message === next.message && previous.request === next.request && previous.me?.user?.user_id === next.me?.user?.user_id && previous.me?.user?.view_utc_time === next.me?.user?.view_utc_time && previous.editing === next.editing && (!next.editing || previous.editText === next.editText) && previous.refreshingSpecialMessageID === previous.message.id === (next.refreshingSpecialMessageID === next.message.id) && previous.submittingInputResponseID === previous.message.id === (next.submittingInputResponseID === next.message.id) && Boolean(previous.onOpenDelegation) === Boolean(next.onOpenDelegation);
export const MessageBubble = React.memo(MessageBubbleComponent, messageBubblePropsAreEqual);
