import { useMythicTheme } from '../../themes/MythicThemeProvider';
import React from 'react';
import { useApolloClient, useLazyQuery, useMutation, useQuery, useSubscription } from '@apollo/client';
import Split from 'react-split';
import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Switch from '@mui/material/Switch';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import ArchiveIcon from '@mui/icons-material/Archive';
import CampaignTwoToneIcon from '@mui/icons-material/CampaignTwoTone';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import EditIcon from '@mui/icons-material/Edit';
import ForumTwoToneIcon from '@mui/icons-material/ForumTwoTone';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import SmartToyTwoToneIcon from '@mui/icons-material/SmartToyTwoTone';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { MythicDialog } from "../MythicComponents/MythicDialog";
import { MythicPageBody } from "../MythicComponents/MythicPageBody";
import { MythicPageHeader, MythicPageHeaderChip } from "../MythicComponents/MythicPageHeader";
import { MythicStyledTooltip } from "../MythicComponents/MythicStyledTooltip";
import { MythicConfirmDialog } from "../MythicComponents/MythicConfirmDialog";
import { MythicChatContainerIcon } from "../MythicComponents/MythicChatContainerIcon";
import { MeContext } from "../App";
import { snackActions } from "../utilities/Snackbar";
import { getSkewedNow } from "../utilities/Time";
import { SchemaFormRenderer, emptyValueForSchema } from "../pages/CreatePayload/SchemaFormRenderer";
import { MythicDraggablePortal, reorder } from "../MythicComponents/MythicDraggableList";
import { Draggable, DragDropContext, Droppable } from "@hello-pangea/dnd";
import { MythicColorSwatchInput } from "../MythicComponents/MythicColorInput";
import { getChatMessagePageInfo, getChatMessagePageVariables, getProgressivelyVisibleRows, mergeRowsByID } from "./ChatStreamUtils";
import {
  ChatSubagentAvatar,
  MessageBubble,
  getEventingInteractionSnapshot,
  getMessageDelegationID,
  getMessageDelegationName,
  getSubagentSnapshot,
  getSubagentStateClass,
  getSubagentStatusText,
  getSubagentVisual,
  isPendingChatHumanInteraction,
  shouldShowMessageInMainChat,
} from "./ChatMessages";
import {formatChatTimestamp as formatTimestamp, jsonTextForChatConfigValue as jsonTextForConfigValue} from "./ChatFormatters";
import {
  CANCEL_REQUEST,
  CHAT_API_TOKENS_QUERY,
  CHAT_CHANNEL_DETAIL_QUERY,
  CHAT_CONTAINERS_QUERY,
  CHAT_CONTAINERS_STREAM_SUBSCRIPTION,
  CHAT_CURRENT_OPERATOR_QUERY,
  CHAT_MESSAGES_QUERY,
  CHAT_MESSAGES_STREAM_SUBSCRIPTION,
  CHAT_OPERATOR_ALIASES_QUERY,
  CHAT_REQUESTS_QUERY,
  CHAT_REQUESTS_STREAM_SUBSCRIPTION,
  CHAT_SEARCH,
  CHAT_TOOL_OUTPUT_QUERY,
  CREATE_API_TOKEN,
  CREATE_CHANNEL,
  CREATE_MESSAGE,
  DELETE_MESSAGE,
  EDIT_MESSAGE,
  INPUT_RESPONSE,
  MARK_READ,
  REFRESH_SPECIAL_MESSAGE,
  RETRY_REQUEST,
  UPDATE_CHANNEL,
} from "./ChatGraphql";
import { getChatReadState as getChannelReadState, useChatDirectory } from "./ChatDirectoryContext";
import pageStyles from "./ChatPage.module.css";
import channelStyles from "./ChatChannelView.module.css";
import adapterStyles from "./ChatContentAdapter.module.css";
import {MythicCluster, MythicStack, MythicTruncatedText} from "../MythicComponents/MythicLayout";
import {MythicActionGroup, MythicEmptyState, MythicPanel, MythicToolbar, MythicActionButton, MythicText} from "../MythicComponents/MythicContent";
const CHAT_STYLE_MAP = {
  ...pageStyles,
  ...channelStyles,
  ...adapterStyles
};
const chatClasses = (value = "") => `${value}`.split(/\s+/).filter(Boolean).map(className => CHAT_STYLE_MAP[className] || className).join(" ");
const CHAT_MESSAGE_PAGE_SIZE = 50;
const CHAT_REQUEST_LIMIT = 50;
const CHAT_RENDER_BATCH_SIZE = 50;
const CHAT_SPLIT_STORAGE_KEY = "chatSplitSizes";
const CHAT_SPLIT_DEFAULT_SIZES = [20, 80];
const CHAT_CHANNEL_SPLIT_STORAGE_KEY = "chatChannelSplitSizes";
const CHAT_CHANNEL_SPLIT_DEFAULT_SIZES = [52, 48];
const CHAT_DELEGATION_SPLIT_STORAGE_KEY = "chatDelegationSplitSizes";
const CHAT_DELEGATION_SPLIT_DEFAULT_SIZES = [70, 30];
const CHAT_DIALOG_TEXT_FIELD_PROPS = {
  multiline: true,
  minRows: 1,
  maxRows: 5
};
const LazyEventStepUserInteractionDialog = React.lazy(() => import("../pages/Eventing/EventStepRender").then(module => ({
  default: module.EventStepUserInteractionDialog
})));
const LazySettingsAPITokenDialog = React.lazy(() => import("../pages/Settings/SettingsOperatorDialog").then(module => ({
  default: module.SettingsAPITokenDialog
})));
const LazyResponseDisplayPlaintext = React.lazy(() => import("../pages/Callbacks/ResponseDisplayPlaintext").then(module => ({
  default: module.ResponseDisplayPlaintext
})));
const isGeneralChatChannel = channel => channel?.channel_type === "standard" && channel?.slug === "general";
const getStoredChatSplitSizes = () => {
  try {
    let sizes = JSON.parse(localStorage.getItem(CHAT_SPLIT_STORAGE_KEY));
    return sizes ? sizes : CHAT_SPLIT_DEFAULT_SIZES;
  } catch (error) {
    return CHAT_SPLIT_DEFAULT_SIZES;
  }
};
const getStoredChatChannelSplitSizes = () => {
  try {
    let sizes = JSON.parse(localStorage.getItem(CHAT_CHANNEL_SPLIT_STORAGE_KEY));
    return sizes ? sizes : CHAT_CHANNEL_SPLIT_DEFAULT_SIZES;
  } catch (error) {
    return CHAT_CHANNEL_SPLIT_DEFAULT_SIZES;
  }
};
const getStoredChatDelegationSplitSizes = () => {
  try {
    let sizes = JSON.parse(localStorage.getItem(CHAT_DELEGATION_SPLIT_STORAGE_KEY));
    return sizes ? sizes : CHAT_DELEGATION_SPLIT_DEFAULT_SIZES;
  } catch (error) {
    return CHAT_DELEGATION_SPLIT_DEFAULT_SIZES;
  }
};
const CHAT_SEARCH_SNIPPET_LENGTH = 260;
const CHAT_SEARCH_SNIPPET_CONTEXT = 90;
const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const getSearchTerms = query => {
  const trimmedQuery = (query || "").trim();
  if (trimmedQuery === "") {
    return [];
  }
  const uniqueTerms = new Set();
  return [trimmedQuery, ...trimmedQuery.split(/\s+/)].map(term => term.replace(/^[^\w]+|[^\w]+$/g, "")).filter(term => term.length > 1 || trimmedQuery.length === 1).filter(term => {
    const normalizedTerm = term.toLocaleLowerCase();
    if (uniqueTerms.has(normalizedTerm)) {
      return false;
    }
    uniqueTerms.add(normalizedTerm);
    return true;
  }).sort((a, b) => b.length - a.length);
};
const buildSearchSnippetParts = (message, query) => {
  const messageText = String(message || "");
  if (messageText === "") {
    return [];
  }
  const searchTerms = getSearchTerms(query);
  const lowerMessageText = messageText.toLocaleLowerCase();
  const firstMatch = searchTerms.reduce((bestMatch, term) => {
    const index = lowerMessageText.indexOf(term.toLocaleLowerCase());
    if (index === -1) {
      return bestMatch;
    }
    if (!bestMatch || index < bestMatch.index) {
      return {
        index,
        term
      };
    }
    return bestMatch;
  }, null);
  let snippetStart = 0;
  let snippetEnd = Math.min(messageText.length, CHAT_SEARCH_SNIPPET_LENGTH);
  if (firstMatch) {
    snippetStart = Math.max(0, firstMatch.index - CHAT_SEARCH_SNIPPET_CONTEXT);
    snippetEnd = Math.min(messageText.length, snippetStart + CHAT_SEARCH_SNIPPET_LENGTH);
    snippetStart = Math.max(0, snippetEnd - CHAT_SEARCH_SNIPPET_LENGTH);
  }
  const hasLeadingText = snippetStart > 0;
  const hasTrailingText = snippetEnd < messageText.length;
  const snippetText = `${hasLeadingText ? "..." : ""}${messageText.slice(snippetStart, snippetEnd).replace(/\s+/g, " ").trim()}${hasTrailingText ? "..." : ""}`;
  if (searchTerms.length === 0) {
    return [{
      text: snippetText,
      highlight: false
    }];
  }
  const highlightExpression = new RegExp(searchTerms.map(escapeRegExp).join("|"), "gi");
  const parts = [];
  let lastIndex = 0;
  snippetText.replace(highlightExpression, (match, offset) => {
    if (offset > lastIndex) {
      parts.push({
        text: snippetText.slice(lastIndex, offset),
        highlight: false
      });
    }
    parts.push({
      text: match,
      highlight: true
    });
    lastIndex = offset + match.length;
    return match;
  });
  if (lastIndex < snippetText.length) {
    parts.push({
      text: snippetText.slice(lastIndex),
      highlight: false
    });
  }
  return parts;
};
const renderSearchSnippet = (message, query) => buildSearchSnippetParts(message, query).map((part, index) => part.highlight ? <mark className={chatClasses("mythic-chat-search-highlight mythic-inherit-color mythic-font-weight-extra-bold mythic-border-radius-sm")} key={`highlight-${index}`}>{part.text}</mark> : <React.Fragment key={`text-${index}`}>{part.text}</React.Fragment>);
const sortChannels = (a, b) => {
  if (a.archived !== b.archived) {
    return a.archived ? 1 : -1;
  }
  if (a.channel_type !== b.channel_type) {
    return a.channel_type.localeCompare(b.channel_type);
  }
  return (a.name || "").localeCompare(b.name || "");
};
const sortContainers = (a, b) => (a.name || "").localeCompare(b.name || "");
const sortByID = (a, b) => a.id - b.id;
const channelDisplayName = channel => `# ${channel?.name || ""}`;
const parseChatContainerModels = container => {
  if (!container || !Array.isArray(container.subscriptions)) {
    return [];
  }
  return container.subscriptions.map(subscription => {
    let model = subscription;
    if (typeof subscription === "string") {
      try {
        model = JSON.parse(subscription);
      } catch (error) {
        model = {
          name: subscription,
          description: ""
        };
      }
    }
    if (typeof model !== "object" || model === null) {
      return {
        name: `${model}`,
        description: ""
      };
    }
    const modelName = model.name || model.Name || "";
    return {
      name: modelName === "" ? "" : `${modelName}`,
      displayName: model.display_name || model.displayName || model.DisplayName || model.label || model.Label || modelName,
      description: model.description || model.Description || model.type || "",
      metadata: model.metadata || model.Metadata || {}
    };
  }).filter(model => model.name);
};
const parseJSONLikeObject = value => {
  if (!value) {
    return {};
  }
  if (typeof value === "object" && !Array.isArray(value)) {
    return value;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch (error) {
      return {};
    }
  }
  return {};
};
const getChannelAIMetadata = channel => parseJSONLikeObject(channel?.ai_metadata);
const getChannelAIConfig = channel => {
  const metadata = getChannelAIMetadata(channel);
  return parseJSONLikeObject(metadata.config || metadata.configuration);
};
const modelForChannel = (channel, chatContainers) => {
  if (!channel || channel.channel_type !== "ai") {
    return null;
  }
  const container = chatContainers.find(item => item.id === channel.chat_container_id) || channel.chat_container;
  return parseChatContainerModels(container).find(model => model.name === channel.chat_model) || null;
};
const normalizeSlashCommandName = value => `${value || ""}`.trim().replace(/^\/+/, "").toLowerCase();
const getModelSlashCommands = model => {
  const metadata = model?.metadata || {};
  const rawCommands = metadata.slash_commands || metadata.slashCommands || metadata.slashcommands || [];
  if (!Array.isArray(rawCommands)) {
    return [];
  }
  return rawCommands.reduce((prev, command) => {
    if (typeof command === "string") {
      const name = normalizeSlashCommandName(command);
      return name ? [...prev, {
        name,
        description: "",
        source: "model"
      }] : prev;
    }
    if (command && typeof command === "object") {
      const name = normalizeSlashCommandName(command.name || command.Name || command.command || command.Command || command.slash_command || command.slashCommand);
      if (!name) {
        return prev;
      }
      return [...prev, {
        name,
        description: command.description || command.Description || "",
        source: "model"
      }];
    }
    return prev;
  }, []);
};
const getAIChatSlashOptions = (channel, chatContainers, aliases) => {
  if (!channel || channel.channel_type !== "ai") {
    return [];
  }
  const modelCommands = getModelSlashCommands(modelForChannel(channel, chatContainers));
  const aliasCommands = (aliases || []).filter(alias => alias.alias_type === "command" && (alias.consuming_container_id === null || alias.consuming_container_id === channel.chat_container_id)).reduce((prev, alias) => {
    if (!alias.name) {
      return prev;
    }
    return [...prev, {
      name: alias.name,
      description: alias.alias,
      source: "alias",
      actualCommand: alias.alias
    }];
  }, []);
  const options = [...modelCommands, ...aliasCommands];
  return options.sort((a, b) => a.name.localeCompare(b.name));
};
const getAIChatGenericAliasOptions = (channel, aliases) => {
  if (!channel || channel.channel_type !== "ai") {
    return [];
  }
  const matchingAliases = (aliases || []).filter(alias => alias.alias_type === "generic" && alias.payloadtype_id === null && (alias.consuming_container_id === null || alias.consuming_container_id === channel.chat_container_id));
  const aliasesByName = {};
  [...matchingAliases].sort((a, b) => {
    const aScoped = a.consuming_container_id ? 0 : 1;
    const bScoped = b.consuming_container_id ? 0 : 1;
    return aScoped - bScoped || a.name.localeCompare(b.name);
  }).forEach(alias => {
    if (alias.name && !aliasesByName[alias.name]) {
      aliasesByName[alias.name] = alias;
    }
  });
  return Object.values(aliasesByName).sort((a, b) => a.name.localeCompare(b.name));
};
const parseComposerSlashCommand = message => {
  const trimmed = message.trim();
  if (!trimmed.startsWith("/")) {
    return {
      isSlash: false,
      name: "",
      argument: ""
    };
  }
  const withoutSlash = trimmed.replace(/^\/+/, "");
  const [first = ""] = withoutSlash.split(/\s+/, 1);
  const name = normalizeSlashCommandName(first);
  const argument = withoutSlash.length > first.length ? withoutSlash.slice(first.length).trim() : "";
  return {
    isSlash: true,
    name,
    argument
  };
};
const getMatchingSlashOptions = (composerSlash, slashOptions) => {
  if (!composerSlash.isSlash) {
    return [];
  }
  const normalizedName = composerSlash.name;
  if (normalizedName === "") {
    return slashOptions.slice(0, 8);
  }
  const startsWith = slashOptions.filter(option => option.name.startsWith(normalizedName));
  const includes = slashOptions.filter(option => !option.name.startsWith(normalizedName) && option.name.includes(normalizedName));
  return [...startsWith, ...includes].slice(0, 8);
};
const getGenericAliasCompletionContext = (message, cursorPosition, selectionEnd, genericAliasOptions = []) => {
  const beforeCursor = message.slice(0, cursorPosition);
  const atIndex = beforeCursor.lastIndexOf("@");
  if (atIndex < 0) {
    return undefined;
  }
  const partial = beforeCursor.slice(atIndex + 1);
  if (!/^[A-Za-z0-9_-]*$/.test(partial)) {
    return undefined;
  }
  const beforeAt = atIndex > 0 ? message[atIndex - 1] : "";
  if (beforeAt !== "" && /[A-Za-z0-9_-]/.test(beforeAt)) {
    return undefined;
  }
  const suffixMatch = message.slice(selectionEnd).match(/^[A-Za-z0-9_-]*/);
  const end = selectionEnd + (suffixMatch ? suffixMatch[0].length : 0);
  const namePrefix = partial.toLowerCase();
  const startsWith = genericAliasOptions.filter(alias => alias.name.startsWith(namePrefix));
  const includes = genericAliasOptions.filter(alias => !alias.name.startsWith(namePrefix) && alias.name.includes(namePrefix));
  const matches = [...startsWith, ...includes].slice(0, 8);
  if (matches.length === 0) {
    return undefined;
  }
  return {
    start: atIndex,
    end,
    matches
  };
};
const isKnownSlashCommand = (selectedChannel, composerSlash, slashOptions) => {
  if (selectedChannel?.channel_type !== "ai") {
    return true;
  }
  if (!composerSlash.isSlash) {
    return true;
  }
  if (composerSlash.name === "") {
    return false;
  }
  return slashOptions.some(option => option.name === composerSlash.name);
};
const getModelConfigOptions = model => {
  const metadata = model?.metadata || {};
  const rawOptions = metadata.configuration_options || metadata.config_options || metadata?.configuration?.options || metadata?.config?.options || [];
  if (!Array.isArray(rawOptions)) {
    return [];
  }
  return rawOptions.map(option => {
    const name = option.name || option.key || option.Name || option.Key || "";
    const choices = Array.isArray(option.choices || option.Choices) ? (option.choices || option.Choices).map(choice => {
      if (choice && typeof choice === "object") {
        const value = choice.value ?? choice.Value ?? choice.name ?? choice.Name ?? choice.label ?? choice.Label ?? "";
        return {
          value,
          label: `${choice.label ?? choice.Label ?? value}`,
          description: choice.description || choice.Description || ""
        };
      }
      return {
        value: choice,
        label: `${choice}`,
        description: ""
      };
    }) : [];
    const jsonStringSchema = option.json_string_schema || null;
    const rawType = `${option.type || option.Type || (jsonStringSchema ? "json" : choices.length > 0 ? "choice" : "string")}`.toLowerCase();
    const type = rawType === "jsonstring" || rawType === "json_string" ? "json" : rawType;
    return {
      name: `${name}`,
      displayName: option.display_name || option.displayName || option.DisplayName || option.label || option.Label || `${name}`,
      description: option.description || option.Description || "",
      type: choices.length > 0 ? "choice" : type,
      required: Boolean(option.required || option.Required),
      defaultValue: option.default_value ?? option.defaultValue ?? option.DefaultValue ?? option.default ?? option.Default ?? "",
      choices,
      jsonStringSchema,
      minRows: Number(option.min_rows || option.minRows || option.MinRows || 6),
      displayAsChip: Boolean(option.display_as_chip || option.displayAsChip || option.DisplayAsChip)
    };
  }).filter(option => option.name);
};
const parseBooleanConfigValue = value => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  const text = `${value ?? ""}`.trim().toLowerCase();
  return ["1", "true", "yes", "y", "on"].includes(text);
};
const configValueForField = (value, option = {}) => {
  if (option.type === "boolean") {
    return parseBooleanConfigValue(value);
  }
  if (option.type === "json") {
    return typeof value === "string" ? value : jsonTextForConfigValue(value);
  }
  if (value === undefined || value === null) {
    return "";
  }
  return `${value}`;
};
const buildDefaultConfigValues = (options, existing = {}) => {
  return options.reduce((prev, option) => {
    const existingValue = existing[option.name];
    prev[option.name] = configValueForField(existingValue !== undefined ? existingValue : option.defaultValue, option);
    return prev;
  }, {});
};
const parseJSONConfigValue = rawValue => {
  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return {
      empty: true,
      value: null,
      error: ""
    };
  }
  if (typeof rawValue !== "string") {
    return {
      empty: false,
      value: rawValue,
      error: ""
    };
  }
  try {
    return {
      empty: false,
      value: JSON.parse(rawValue),
      error: ""
    };
  } catch (error) {
    return {
      empty: false,
      value: null,
      error: error.message
    };
  }
};
const normalizeConfigForSubmit = (values, options) => {
  return options.reduce((prev, option) => {
    const rawValue = values[option.name];
    if (option.type === "boolean") {
      if (rawValue !== undefined && rawValue !== null) {
        prev[option.name] = parseBooleanConfigValue(rawValue);
      }
      return prev;
    }
    if (rawValue === undefined || rawValue === null || `${rawValue}`.trim() === "") {
      return prev;
    }
    if (option.type === "number") {
      const numberValue = Number(rawValue);
      if (!Number.isNaN(numberValue)) {
        prev[option.name] = numberValue;
      }
      return prev;
    }
    if (option.type === "json") {
      const parsed = parseJSONConfigValue(rawValue);
      if (!parsed.empty && !parsed.error) {
        prev[option.name] = parsed.value;
      }
      return prev;
    }
    prev[option.name] = rawValue;
    return prev;
  }, {});
};
const configHasMissingRequiredValues = (values, options) => options.some(option => option.required && option.type !== "boolean" && `${values[option.name] ?? ""}`.trim() === "");
const configHasInvalidValues = (values, options) => options.some(option => {
  const rawValue = values[option.name];
  if (rawValue === undefined || rawValue === null || `${rawValue}`.trim() === "") {
    return false;
  }
  if (option.type === "number") {
    return Number.isNaN(Number(rawValue));
  }
  if (option.type === "json") {
    return Boolean(parseJSONConfigValue(rawValue).error);
  }
  return false;
});
const hasUsableJSONStringSchema = schema => schema && typeof schema === "object" && !Array.isArray(schema) && typeof schema.type === "string" && schema.type.length > 0;
const ChatJSONConfigurationField = ({
  option,
  values,
  setValues
}) => {
  const parsed = parseJSONConfigValue(values[option.name]);
  const rendererSchema = hasUsableJSONStringSchema(option.jsonStringSchema) ? option.jsonStringSchema : null;
  const hasVisualEditor = Boolean(rendererSchema);
  const [editorTab, setEditorTab] = React.useState(() => hasVisualEditor && !parsed.error ? "visual" : "source");
  const [visualParseError, setVisualParseError] = React.useState("");
  const sourceValue = configValueForField(values[option.name], option);
  const visualValue = hasVisualEditor && editorTab === "visual" && !parsed.error ? parsed.empty ? emptyValueForSchema(rendererSchema) : parsed.value : null;
  React.useEffect(() => {
    if (!hasVisualEditor && editorTab !== "source") {
      setEditorTab("source");
    }
    if (hasVisualEditor && editorTab === "visual" && parsed.error) {
      setVisualParseError(parsed.error);
      setEditorTab("source");
    }
    if (!parsed.error && visualParseError !== "") {
      setVisualParseError("");
    }
  }, [editorTab, hasVisualEditor, parsed.error, visualParseError]);
  const setSourceValue = nextValue => {
    setValues(prev => ({
      ...prev,
      [option.name]: nextValue
    }));
  };
  const formatValue = () => {
    if (parsed.error || parsed.empty) {
      return;
    }
    setSourceValue(JSON.stringify(parsed.value, null, 2));
  };
  const onVisualChange = newValue => {
    setSourceValue(JSON.stringify(newValue, null, 2));
  };
  const onSwitchToVisual = () => {
    if (!hasVisualEditor) {
      return;
    }
    if (parsed.error) {
      setVisualParseError(parsed.error);
      setEditorTab("source");
      return;
    }
    setVisualParseError("");
    setEditorTab("visual");
  };
  if (!hasVisualEditor) {
    return <Box key={option.name} sx={{
      display: "flex",
      flexDirection: "column",
      gap: 0.75,
      minWidth: 0
    }}>
                <TextField fullWidth multiline minRows={Math.max(8, option.minRows || 6)} size="small" label={option.displayName} required={option.required} value={sourceValue} error={Boolean(parsed.error)} helperText={parsed.error || option.description} onChange={e => setSourceValue(e.target.value)} inputProps={{
        spellCheck: "false"
      }} />

                <Box sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 0.75
      }}>
                    <Button size="small" variant="outlined" onClick={formatValue} disabled={parsed.empty || Boolean(parsed.error)}>
                        Format JSON
                    </Button>
                </Box>
            </Box>;
  }
  return <MythicPanel component="div" density="flush" tone="muted" overflow="visible" radius="md" key={option.name} className="mythic-dialog-section" sx={{
    display: "flex",
    flexDirection: "column",
    gap: 0.75,
    minWidth: 0,
    p: 1
  }}>

            <Box sx={{
      alignItems: "flex-start",
      display: "flex",
      flexWrap: "wrap",
      gap: 0.75,
      justifyContent: "space-between",
      minWidth: 0
    }}>
                <Box sx={{
        display: "flex",
        flexDirection: "column",
        gap: 0.25,
        minWidth: 0
      }}>
                    <MythicText preset="section-title" component="div" className="mythic-dialog-section-title">
                        {option.displayName}
                    </MythicText>
                    {option.description && <Typography component="div" className="mythic-dialog-section-description mythic-font-size-small mythic-line-height-normal mythic-text-secondary">
                            {option.description}
                        </Typography>}
                </Box>
                <Tabs value={editorTab} onChange={(event, nextTab) => {
        if (nextTab === "visual") {
          onSwitchToVisual();
        } else {
          setEditorTab("source");
        }
      }} style={{
        minHeight: "32px"
      }} TabIndicatorProps={{
        style: {
          height: "2px"
        }
      }}>

                    <Tab value="visual" label="Visual" style={{
          minHeight: "32px",
          textTransform: "none"
        }} />
                    <Tab value="source" label="Source" style={{
          minHeight: "32px",
          textTransform: "none"
        }} />
                </Tabs>
            </Box>
            {editorTab === "visual" && visualValue !== null && <Box sx={{
      display: "flex",
      flexDirection: "column",
      gap: 0.75,
      minWidth: 0
    }}>

                    <SchemaFormRenderer schema={rendererSchema} value={visualValue} onChange={onVisualChange} />

                </Box>}
            {editorTab === "source" && <Box sx={{
      display: "flex",
      flexDirection: "column",
      gap: 0.75,
      minWidth: 0
    }}>
                    {visualParseError !== "" && <Typography component="div" color="error" className="mythic-form-field-description mythic-font-size-caption mythic-line-height-normal mythic-text-secondary">
                            Visual tab unavailable: {visualParseError}
                        </Typography>}
                    <TextField fullWidth multiline minRows={Math.max(8, option.minRows || 6)} size="small" label="Source" required={option.required} value={sourceValue} error={Boolean(parsed.error)} helperText={parsed.error || ""} onChange={e => setSourceValue(e.target.value)} inputProps={{
        spellCheck: "false"
      }} />

                    <Box sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 0.75
      }}>
                        <Button size="small" variant="outlined" onClick={formatValue} disabled={parsed.empty || Boolean(parsed.error)}>
                            Format JSON
                        </Button>
                    </Box>
                </Box>}
        </MythicPanel>;
};
const AI_CHAT_REQUIRED_TOKEN_SCOPES = ["apitoken.write", "chat-ai.write"];
const tokenHasScope = (token, scope) => {
  const scopes = token?.scopes || [];
  if (scopes.includes("*") || scopes.includes(scope)) {
    return true;
  }
  const resource = scope.split(".")[0];
  return scopes.includes(`${resource}.*`);
};
const tokenMeetsAIChatRequirements = token => AI_CHAT_REQUIRED_TOKEN_SCOPES.every(scope => tokenHasScope(token, scope));
const formatTokenLabel = token => {
  if (!token) {
    return "";
  }
  const status = token.active && !token.deleted ? "" : " inactive";
  return `${token.name || `Token ${token.id}`} (#${token.id})${status}`;
};
const tokenOwnerLabel = owner => {
  if (!owner) {
    return "";
  }
  return owner.accountType === "bot" ? `Operation bot (${owner.username})` : `Current user (${owner.username})`;
};
const applyConfigToMetadata = (metadata, config) => ({
  ...parseJSONLikeObject(metadata),
  config
});
const getChannelMetadataItems = channel => {
  const metadata = getChannelAIMetadata(channel);
  const channelMetadata = parseJSONLikeObject(metadata.channel_metadata);
  return Array.isArray(channelMetadata.items) ? channelMetadata.items : [];
};
const getChannelMetadataDefaultDisplayString = channel => {
  const metadata = getChannelAIMetadata(channel);
  const channelMetadata = parseJSONLikeObject(metadata.channel_metadata);
  return typeof channelMetadata.default_display === "string" ? channelMetadata.default_display : typeof channelMetadata.display === "string" ? channelMetadata.display : "";
};
const getChannelMetadataDisplayString = channel => {
  const metadata = getChannelAIMetadata(channel);
  const display = parseJSONLikeObject(metadata.channel_metadata_display);
  return typeof display.display === "string" ? display.display : "";
};
const getEffectiveChannelMetadataDisplayString = (channel, displayStringOverride) => {
  const userDisplayString = displayStringOverride === undefined ? getChannelMetadataDisplayString(channel) : `${displayStringOverride || ""}`;
  return userDisplayString.trim() === "" ? getChannelMetadataDefaultDisplayString(channel) : userDisplayString;
};
const applyMetadataDisplayToMetadata = (metadata, displayString) => {
  const nextMetadata = parseJSONLikeObject(metadata);
  const trimmedDisplay = `${displayString || ""}`.trim();
  if (trimmedDisplay === "") {
    delete nextMetadata.channel_metadata_display;
  } else {
    nextMetadata.channel_metadata_display = {
      ...parseJSONLikeObject(nextMetadata.channel_metadata_display),
      display: trimmedDisplay
    };
  }
  return nextMetadata;
};
const isChipEligibleConfigOption = option => Boolean(option.displayAsChip) && ["string", "number", "boolean", "choice"].includes(option.type);
const formatConfigChipValue = (option, rawValue) => {
  if (option.type === "boolean") {
    return parseBooleanConfigValue(rawValue) ? "Yes" : "No";
  }
  if (option.type === "choice") {
    const choice = option.choices.find(item => `${item.value}` === `${rawValue}`);
    return choice?.label || `${rawValue ?? ""}`;
  }
  return `${rawValue ?? ""}`;
};
const getChannelConfigChips = (channel, chatContainers) => {
  if (!channel || channel.channel_type !== "ai") {
    return [];
  }
  const model = modelForChannel(channel, chatContainers || []);
  const config = getChannelAIConfig(channel);
  return getModelConfigOptions(model).filter(isChipEligibleConfigOption).reduce((chips, option) => {
    const rawValue = config[option.name];
    if (rawValue === undefined || rawValue === null || `${rawValue}`.trim() === "") {
      return chips;
    }
    return [...chips, {
      key: `config:${option.name}`,
      label: option.displayName || option.name,
      value: formatConfigChipValue(option, rawValue),
      tooltip: option.description,
      color: "neutral"
    }];
  }, []);
};
const getChannelModelChip = (channel, chatContainers) => {
  if (!channel || channel.channel_type !== "ai" || !channel.chat_model) {
    return null;
  }
  const model = modelForChannel(channel, chatContainers || []);
  return {
    key: "model",
    label: "Model",
    value: model?.displayName || channel.chat_model,
    tooltip: model?.description || "Selected chat container model.",
    color: "neutral"
  };
};
const getChannelListChips = (channel, chatContainers) => {
  const modelChip = getChannelModelChip(channel, chatContainers);
  const configChips = getChannelConfigChips(channel, chatContainers);
  return modelChip ? [modelChip, ...configChips] : configChips;
};
const metadataDisplayKeyPattern = /^[A-Za-z0-9_.-]+$/;
const metadataDisplayColorPattern = /^(neutral|info|success|warning|error|danger|#[0-9a-fA-F]{6})$/;
const metadataScaleColorPattern = /^scale\((.+)\)$/i;
const normalizeChipColor = color => {
  const text = `${color || ""}`.trim();
  if (text === "") {
    return "";
  }
  return metadataDisplayColorPattern.test(text) ? text.toLowerCase() : "";
};
const parseMetadataScaleColor = rawColor => {
  const match = `${rawColor || ""}`.trim().match(metadataScaleColorPattern);
  if (!match) {
    return null;
  }
  const stops = match[1].split("|").map(rawStop => {
    const [rawAt, ...rawColorParts] = rawStop.split(":");
    const at = Number(`${rawAt || ""}`.trim());
    const color = normalizeChipColor(rawColorParts.join(":"));
    if (Number.isNaN(at) || color === "") {
      return null;
    }
    return {
      at,
      color
    };
  }).filter(Boolean).sort((a, b) => a.at - b.at);
  return stops.length > 0 ? {
    type: "scale",
    source: "value",
    stops
  } : null;
};
const parseMetadataColorValue = rawColor => {
  const text = `${rawColor || ""}`.trim();
  if (text === "") {
    return {
      color: "",
      warning: ""
    };
  }
  const scaleColor = parseMetadataScaleColor(text);
  if (scaleColor) {
    return {
      color: scaleColor,
      warning: ""
    };
  }
  const color = normalizeChipColor(text);
  if (color) {
    return {
      color,
      warning: ""
    };
  }
  return {
    color: "",
    warning: `Invalid color "${text}"`
  };
};
const parseMetadataDisplayItem = rawItem => {
  const text = `${rawItem || ""}`.trim();
  if (text === "") {
    return {
      item: null,
      warning: ""
    };
  }
  const equalIndex = text.indexOf("=");
  const label = equalIndex >= 0 ? text.slice(0, equalIndex).trim() : "";
  const keyAndFormat = equalIndex >= 0 ? text.slice(equalIndex + 1).trim() : text;
  if (equalIndex >= 0 && label === "") {
    return {
      item: null,
      warning: `Missing label in "${text}"`
    };
  }
  const formatIndex = keyAndFormat.lastIndexOf(":");
  const key = (formatIndex >= 0 ? keyAndFormat.slice(0, formatIndex) : keyAndFormat).trim();
  const format = formatIndex >= 0 ? keyAndFormat.slice(formatIndex + 1).trim() : "";
  if (!metadataDisplayKeyPattern.test(key)) {
    return {
      item: null,
      warning: `Invalid metadata key "${key || text}"`
    };
  }
  if (format && !metadataDisplayKeyPattern.test(format)) {
    return {
      item: null,
      warning: `Invalid format "${format}" for ${key}`
    };
  }
  return {
    item: {
      key,
      label: label || "",
      format: format || ""
    },
    warning: ""
  };
};
const parseMetadataDisplayItems = text => {
  const warnings = [];
  const items = `${text || ""}`.split(",").reduce((prev, rawItem) => {
    const parsed = parseMetadataDisplayItem(rawItem);
    if (parsed.warning) {
      warnings.push(parsed.warning);
    }
    return parsed.item ? [...prev, parsed.item] : prev;
  }, []);
  return {
    items,
    warnings
  };
};
const parseMetadataDisplayColors = text => {
  const warnings = [];
  const colors = {};
  `${text || ""}`.split(",").map(item => item.trim()).filter(Boolean).forEach(item => {
    const equalIndex = item.indexOf("=");
    if (equalIndex <= 0) {
      warnings.push(`Invalid color rule "${item}"`);
      return;
    }
    const key = item.slice(0, equalIndex).trim();
    const rawColor = item.slice(equalIndex + 1).trim();
    if (!metadataDisplayKeyPattern.test(key)) {
      warnings.push(`Invalid color metadata key "${key}"`);
      return;
    }
    const parsedColor = parseMetadataColorValue(rawColor);
    if (parsedColor.warning) {
      warnings.push(`${parsedColor.warning} for ${key}`);
      return;
    }
    if (parsedColor.color) {
      colors[key] = parsedColor.color;
    }
  });
  return {
    colors,
    warnings
  };
};
const parseMetadataDisplayString = displayString => {
  const display = `${displayString || ""}`.trim();
  const result = {
    collapsed: null,
    maxVisible: null,
    items: [],
    hidden: [],
    colors: {},
    warnings: []
  };
  if (display === "") {
    return result;
  }
  const segments = display.split(";").map(segment => segment.trim()).filter(Boolean);
  const hasChipsDirective = segments.some(segment => segment.toLowerCase().startsWith("chips:"));
  segments.forEach((segment, index) => {
    const lowerSegment = segment.toLowerCase();
    if (lowerSegment === "collapsed") {
      result.collapsed = true;
      return;
    }
    if (lowerSegment === "expanded") {
      result.collapsed = false;
      return;
    }
    if (lowerSegment.startsWith("max=")) {
      const maxVisible = Number(segment.slice(segment.indexOf("=") + 1).trim());
      if (Number.isInteger(maxVisible) && maxVisible > 0) {
        result.maxVisible = maxVisible;
      } else {
        result.warnings.push(`Invalid max value in "${segment}"`);
      }
      return;
    }
    if (lowerSegment.startsWith("chips:")) {
      const parsed = parseMetadataDisplayItems(segment.slice(segment.indexOf(":") + 1));
      result.items = parsed.items;
      result.warnings.push(...parsed.warnings);
      return;
    }
    if (lowerSegment.startsWith("hide:")) {
      const hidden = segment.slice(segment.indexOf(":") + 1).split(",").map(item => item.trim()).filter(Boolean);
      const validHidden = hidden.filter(item => metadataDisplayKeyPattern.test(item));
      const invalidHidden = hidden.filter(item => !metadataDisplayKeyPattern.test(item));
      result.hidden = validHidden;
      invalidHidden.forEach(item => result.warnings.push(`Invalid hidden metadata key "${item}"`));
      return;
    }
    if (lowerSegment.startsWith("colors:")) {
      const parsed = parseMetadataDisplayColors(segment.slice(segment.indexOf(":") + 1));
      result.colors = parsed.colors;
      result.warnings.push(...parsed.warnings);
      return;
    }
    if (!hasChipsDirective && index === 0) {
      const parsed = parseMetadataDisplayItems(segment);
      result.items = parsed.items;
      result.warnings.push(...parsed.warnings);
      return;
    }
    result.warnings.push(`Unknown display segment "${segment}"`);
  });
  return result;
};
const normalizeMetadataItem = item => {
  if (!item || typeof item !== "object") {
    return null;
  }
  const key = `${item.key || item.name || ""}`.trim();
  if (!metadataDisplayKeyPattern.test(key)) {
    return null;
  }
  return {
    key,
    label: item.label || item.display_name || item.displayName || key,
    value: item.value,
    displayValue: item.display_value ?? item.displayValue,
    format: item.format || "",
    color: item.color || "",
    click: `${item.click || ""}`.trim(),
    clickConfirmationText: item.click_confirmation_text || item.clickConfirmationText || "",
    tooltip: item.tooltip || item.description || "",
    order: Number.isFinite(Number(item.order)) ? Number(item.order) : 1000
  };
};
const formatMetadataValue = item => {
  if (item.displayValue !== undefined && item.displayValue !== null && `${item.displayValue}` !== "") {
    return `${item.displayValue}`;
  }
  const value = item.value;
  if (value === undefined || value === null) {
    return "";
  }
  if (item.format === "percent") {
    const numberValue = Number(value);
    if (!Number.isNaN(numberValue)) {
      return `${numberValue <= 1 ? Math.round(numberValue * 100) : numberValue}%`;
    }
  }
  if (item.format === "currency") {
    const numberValue = Number(value);
    if (!Number.isNaN(numberValue)) {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2
      }).format(numberValue);
    }
  }
  if (item.format === "number") {
    const numberValue = Number(value);
    if (!Number.isNaN(numberValue)) {
      return new Intl.NumberFormat().format(numberValue);
    }
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  return `${value}`;
};
const colorValueToString = color => {
  if (!color) {
    return "";
  }
  if (typeof color === "string") {
    return color;
  }
  if (color.type === "scale" && Array.isArray(color.stops)) {
    return `scale(${color.stops.map(stop => `${stop.at}:${stop.color}`).join("|")})`;
  }
  return "";
};
const resolveScaledChipColor = (color, item) => {
  if (!color || color.type !== "scale" || !Array.isArray(color.stops)) {
    return "";
  }
  const sourceValue = color.source && color.source !== "value" ? item[color.source] : item.value;
  const value = Number(sourceValue);
  if (Number.isNaN(value)) {
    return "";
  }
  const sortedStops = color.stops.map(stop => ({
    at: Number(stop.at),
    color: normalizeChipColor(stop.color)
  })).filter(stop => !Number.isNaN(stop.at) && stop.color).sort((a, b) => a.at - b.at);
  if (sortedStops.length === 0) {
    return "";
  }
  return sortedStops.reduce((selectedColor, stop) => value >= stop.at ? stop.color : selectedColor, sortedStops[0].color);
};
const resolveMetadataChipColor = (item, colorOverride) => {
  const selectedColor = colorOverride || item.color || "neutral";
  const color = typeof selectedColor === "string" ? normalizeChipColor(selectedColor) : resolveScaledChipColor(selectedColor, item);
  return color || "neutral";
};
const chipColorStyle = color => {
  if (typeof color === "string" && color.startsWith("#")) {
    return {
      "--mythic-chat-chip-custom-color": color,
      "--mythic-chat-chip-custom-border": alpha(color, 0.42),
      "--mythic-chat-chip-custom-bg": alpha(color, 0.14)
    };
  }
  return undefined;
};
const normalizeMetadataClickCommand = click => {
  const command = `${click || ""}`.trim();
  if (command === "") {
    return "";
  }
  return command.startsWith("/") ? command : `/${command}`;
};
const buildChannelMetadataChips = (channel, displayStringOverride) => {
  const displayString = getEffectiveChannelMetadataDisplayString(channel, displayStringOverride);
  const parsedDisplay = parseMetadataDisplayString(displayString);
  const hidden = new Set(parsedDisplay.hidden);
  const metadataItemsByKey = new Map();
  getChannelMetadataItems(channel).map(normalizeMetadataItem).filter(Boolean).forEach(item => {
    if (!hidden.has(item.key)) {
      metadataItemsByKey.set(item.key, item);
    }
  });
  const orderedKeys = new Set();
  const orderedItems = parsedDisplay.items.reduce((prev, override) => {
    const item = metadataItemsByKey.get(override.key);
    if (!item) {
      return prev;
    }
    orderedKeys.add(override.key);
    return [...prev, {
      ...item,
      label: override.label || item.label,
      format: override.format || item.format
    }];
  }, []);
  const remainingItems = [...metadataItemsByKey.values()].filter(item => !orderedKeys.has(item.key)).sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
  const chips = [...orderedItems, ...remainingItems].map(item => {
    const color = resolveMetadataChipColor(item, parsedDisplay.colors[item.key]);
    return {
      key: item.key,
      label: item.label,
      value: formatMetadataValue(item),
      color: color.startsWith("#") ? "custom" : color,
      click: normalizeMetadataClickCommand(item.click),
      clickConfirmationText: item.clickConfirmationText,
      tooltip: item.tooltip,
      colorStyle: chipColorStyle(color)
    };
  }).filter(item => item.value !== "");
  return {
    chips,
    collapsed: parsedDisplay.collapsed === null ? false : parsedDisplay.collapsed,
    maxVisible: parsedDisplay.maxVisible || 6,
    warnings: parsedDisplay.warnings
  };
};
const getAvailableChannelMetadataKeys = channel => getChannelMetadataItems(channel).map(normalizeMetadataItem).filter(Boolean).map(item => item.key).filter((key, index, keys) => keys.indexOf(key) === index);
const getAvailableChannelMetadataItems = channel => getChannelMetadataItems(channel).map(normalizeMetadataItem).filter(Boolean).sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
const metadataDisplayExample = "expanded; max=6; chips: 5hr=five_hour_tokens, Cost=total_cost:currency; colors: total_cost=warning";
const metadataNamedColorOptions = ["neutral", "info", "success", "warning", "error", "danger"];
const metadataDefaultScaleStops = [{
  at: 0,
  color: "success"
}, {
  at: 75,
  color: "warning"
}, {
  at: 90,
  color: "error"
}];
const sanitizeMetadataDisplayLabel = label => `${label || ""}`.replace(/[,;=]/g, " ").trim();
const metadataDisplayItemToString = row => {
  const key = `${row.key || ""}`.trim();
  const label = sanitizeMetadataDisplayLabel(row.labelOverride);
  const format = `${row.formatOverride || ""}`.trim();
  if (key === "") {
    return "";
  }
  const labelPrefix = label ? `${label}=` : "";
  return `${labelPrefix}${key}${format ? `:${format}` : ""}`;
};
const metadataWizardRowsFromDisplay = (channel, displayString) => {
  const parsed = parseMetadataDisplayString(displayString);
  const hidden = new Set(parsed.hidden);
  const ordered = new Map(parsed.items.map((item, index) => [item.key, {
    ...item,
    index
  }]));
  const rowsByKey = new Map();
  getAvailableChannelMetadataItems(channel).forEach((item, index) => {
    const override = ordered.get(item.key);
    rowsByKey.set(item.key, {
      key: item.key,
      baseLabel: item.label,
      labelOverride: override?.label || "",
      formatOverride: override?.format || "",
      visible: !hidden.has(item.key),
      order: override ? override.index + 1 : index + 1 + parsed.items.length,
      colorOverride: colorValueToString(parsed.colors[item.key]),
      value: formatMetadataValue(item),
      format: item.format,
      color: colorValueToString(item.color),
      click: item.click,
      clickConfirmationText: item.clickConfirmationText,
      tooltip: item.tooltip
    });
  });
  parsed.items.forEach((item, index) => {
    if (rowsByKey.has(item.key)) {
      return;
    }
    rowsByKey.set(item.key, {
      key: item.key,
      baseLabel: item.key,
      labelOverride: item.label || "",
      formatOverride: item.format || "",
      visible: !hidden.has(item.key),
      order: index + 1,
      colorOverride: colorValueToString(parsed.colors[item.key]),
      value: "",
      format: "",
      color: "",
      tooltip: "Custom key from the current display string. This container has not reported metadata details for it yet."
    });
  });
  parsed.hidden.forEach((key, index) => {
    if (rowsByKey.has(key)) {
      return;
    }
    rowsByKey.set(key, {
      key,
      baseLabel: key,
      labelOverride: "",
      formatOverride: "",
      visible: false,
      order: rowsByKey.size + index + 1,
      colorOverride: colorValueToString(parsed.colors[key]),
      value: "",
      format: "",
      color: "",
      tooltip: "Hidden custom key from the current display string."
    });
  });
  Object.entries(parsed.colors).forEach(([key, color]) => {
    if (rowsByKey.has(key)) {
      return;
    }
    rowsByKey.set(key, {
      key,
      baseLabel: key,
      labelOverride: "",
      formatOverride: "",
      visible: true,
      order: rowsByKey.size + 1,
      colorOverride: colorValueToString(color),
      value: "",
      format: "",
      color: "",
      tooltip: "Custom color key from the current display string."
    });
  });
  return [...rowsByKey.values()].sort((a, b) => Number(a.order) - Number(b.order) || a.key.localeCompare(b.key));
};
const buildMetadataDisplayStringFromWizard = (rows, hiddenInitially, maxVisible) => {
  const max = Number(maxVisible);
  const visibleRows = rows.filter(row => row.visible);
  const hiddenRows = rows.filter(row => !row.visible);
  const segments = [hiddenInitially ? "collapsed" : "expanded", `max=${Number.isInteger(max) && max > 0 ? max : 6}`];
  if (visibleRows.length > 0) {
    segments.push(`chips: ${visibleRows.map(metadataDisplayItemToString).filter(Boolean).join(", ")}`);
  }
  if (hiddenRows.length > 0) {
    segments.push(`hide: ${hiddenRows.map(row => row.key).filter(Boolean).join(", ")}`);
  }
  const colorRules = rows.map(row => ({
    key: row.key,
    color: `${row.colorOverride || ""}`.trim()
  })).filter(row => row.key && row.color).map(row => `${row.key}=${row.color}`);
  if (colorRules.length > 0) {
    segments.push(`colors: ${colorRules.join(", ")}`);
  }
  return segments.join("; ");
};
const metadataColorEditorStateFromString = colorValue => {
  const text = `${colorValue || ""}`.trim();
  if (text === "") {
    return {
      mode: "default",
      named: "neutral",
      custom: "#4f46e5",
      scaleStops: metadataDefaultScaleStops
    };
  }
  const scale = parseMetadataScaleColor(text);
  if (scale) {
    return {
      mode: "scale",
      named: "neutral",
      custom: "#4f46e5",
      scaleStops: scale.stops.length > 0 ? scale.stops : metadataDefaultScaleStops
    };
  }
  if (text.startsWith("#")) {
    return {
      mode: "custom",
      named: "neutral",
      custom: normalizeChipColor(text) || "#4f46e5",
      scaleStops: metadataDefaultScaleStops
    };
  }
  return {
    mode: "named",
    named: normalizeChipColor(text) || "neutral",
    custom: "#4f46e5",
    scaleStops: metadataDefaultScaleStops
  };
};
const metadataColorEditorStringFromState = state => {
  if (state.mode === "default") {
    return "";
  }
  if (state.mode === "custom") {
    return normalizeChipColor(state.custom) || "";
  }
  if (state.mode === "scale") {
    const stops = (state.scaleStops || []).map(stop => ({
      at: Number(stop.at),
      color: normalizeChipColor(stop.color)
    })).filter(stop => !Number.isNaN(stop.at) && stop.color).sort((a, b) => a.at - b.at);
    if (stops.length === 0) {
      return "";
    }
    return `scale(${stops.map(stop => `${stop.at}:${stop.color}`).join("|")})`;
  }
  return normalizeChipColor(state.named) || "";
};
const ChatMetadataColorEditor = ({
  value,
  fallback,
  onChange
}) => {
  const state = React.useMemo(() => metadataColorEditorStateFromString(value), [value]);
  const updateState = updates => {
    onChange(metadataColorEditorStringFromState({
      ...state,
      ...updates
    }));
  };
  const updateScaleStop = (index, updates) => {
    updateState({
      mode: "scale",
      scaleStops: state.scaleStops.map((stop, stopIndex) => stopIndex === index ? {
        ...stop,
        ...updates
      } : stop)
    });
  };
  const addScaleStop = () => {
    const stops = state.scaleStops.length > 0 ? state.scaleStops : metadataDefaultScaleStops;
    const lastAt = stops.reduce((max, stop) => Math.max(max, Number(stop.at) || 0), 0);
    updateState({
      mode: "scale",
      scaleStops: [...stops, {
        at: lastAt + 10,
        color: "error"
      }]
    });
  };
  const removeScaleStop = index => {
    const nextStops = state.scaleStops.filter((_, stopIndex) => stopIndex !== index);
    updateState({
      mode: "scale",
      scaleStops: nextStops.length > 0 ? nextStops : metadataDefaultScaleStops
    });
  };
  return <Box className={chatClasses("mythic-chat-metadata-color-editor mythic-gap-sm mythic-stack mythic-full-width")}>
            <Select size="small" value={state.mode} onChange={e => updateState({
      mode: e.target.value
    })} fullWidth>

                <MenuItem value="default">Container default{fallback ? ` (${fallback})` : ""}</MenuItem>
                <MenuItem value="named">Named color</MenuItem>
                <MenuItem value="custom">Custom color</MenuItem>
                <MenuItem value="scale">Scale cutoffs</MenuItem>
            </Select>
            {state.mode === "named" && <Select size="small" value={state.named} onChange={e => updateState({
      named: e.target.value
    })} fullWidth>

                    {metadataNamedColorOptions.map(color => <MenuItem value={color} key={`metadata-color-${color}`}>{color}</MenuItem>)}
                </Select>}
            {state.mode === "custom" && <MythicColorSwatchInput color={state.custom} label="Custom chip color" onChange={color => updateState({
      custom: color
    })} inputWidth="110px" sx={{
      width: "100%"
    }} />}
            {state.mode === "scale" && <Box className={chatClasses("mythic-chat-metadata-color-scale mythic-gap-sm mythic-flex mythic-flex-column")}>
                    <Box className={chatClasses("mythic-chat-metadata-color-scale-header mythic-justify-between mythic-gap-sm mythic-flex mythic-min-width-0 mythic-align-center")}>
                        <Typography variant="caption" color="text.secondary">
                            Apply the last color whose cutoff is at or below the value.
                        </Typography>
                        <Button size="small" startIcon={<AddIcon fontSize="small" />} onClick={addScaleStop}>
                            Add cutoff
                        </Button>
                    </Box>
                    {state.scaleStops.map((stop, index) => <Box className={chatClasses("mythic-chat-metadata-color-scale-row mythic-gap-sm mythic-grid mythic-align-center")} key={`scale-stop-${index}`}>
                            <TextField size="small" label="At least" type="number" value={stop.at} onChange={e => updateScaleStop(index, {
          at: e.target.value
        })} />

                            <Select size="small" value={stop.color} onChange={e => updateScaleStop(index, {
          color: e.target.value
        })}>

                                {metadataNamedColorOptions.map(color => <MenuItem value={color} key={`scale-${index}-${color}`}>{color}</MenuItem>)}
                            </Select>
                            <MythicActionButton iconOnly tone="error" aria-label="Remove cutoff"  size="small" onClick={() => removeScaleStop(index)} disabled={state.scaleStops.length <= 1}>

                                <DeleteIcon fontSize="small" />
                            </MythicActionButton>
                        </Box>)}
                </Box>}
        </Box>;
};
const ChatConfigurationFields = ({
  options,
  values,
  setValues
}) => {
  if (options.length === 0) {
    return null;
  }
  return <Box sx={{
    display: "flex",
    flexDirection: "column",
    gap: 1.25
  }}>
            <Typography variant="subtitle2">AI Configuration</Typography>
            {options.map(option => {
      if (option.type === "choice") {
        return <FormControl size="small" fullWidth key={option.name}>
                            <InputLabel>{option.displayName}</InputLabel>
                            <Select label={option.displayName} value={configValueForField(values[option.name])} onChange={e => setValues(prev => ({
            ...prev,
            [option.name]: e.target.value
          }))}>

                                {option.choices.map(choice => <MenuItem value={configValueForField(choice.value)} key={`${option.name}-${choice.value}`}>
                                        <Box sx={{
                display: "flex",
                flexDirection: "column",
                py: 0.25
              }}>
                                            <Typography variant="body2">{choice.label}</Typography>
                                            {choice.description && <Typography variant="caption" color="text.secondary" sx={{
                  whiteSpace: "normal"
                }}>
                                                    {choice.description}
                                                </Typography>}
                                        </Box>
                                    </MenuItem>)}
                            </Select>
                            {option.description && <Typography variant="caption" color="text.secondary" sx={{
            mt: 0.5
          }}>
                                    {option.description}
                                </Typography>}
                        </FormControl>;
      }
      if (option.type === "boolean") {
        return <Box key={option.name}>
                            <FormControlLabel control={<Switch checked={Boolean(values[option.name])} onChange={e => setValues(prev => ({
            ...prev,
            [option.name]: e.target.checked
          }))} />} label={option.displayName} />

                            {option.description && <Typography variant="caption" color="text.secondary" sx={{
            display: "block",
            mt: -0.75
          }}>
                                    {option.description}
                                </Typography>}
                        </Box>;
      }
      if (option.type === "json") {
        return <ChatJSONConfigurationField key={option.name} option={option} values={values} setValues={setValues} />;
      }
      return <TextField key={option.name} fullWidth size="small" type={option.type === "number" ? "number" : "text"} label={option.displayName} required={option.required} value={configValueForField(values[option.name], option)} helperText={option.description} multiline={option.type !== "number"} minRows={option.type !== "number" ? 1 : undefined} maxRows={option.type !== "number" ? 5 : undefined} onChange={e => setValues(prev => ({
        ...prev,
        [option.name]: e.target.value
      }))} />;
    })}
        </Box>;
};
const ChatAPITokenSelector = ({
  value,
  setValue,
  currentToken,
  currentUser,
  operationBot
}) => {
  const [openCreateToken, setOpenCreateToken] = React.useState(false);
  const [localTokens, setLocalTokens] = React.useState([]);
  const ownerOptions = React.useMemo(() => {
    const owners = [];
    if (currentUser?.id) {
      owners.push({
        id: currentUser.id,
        username: currentUser.username || `Operator ${currentUser.id}`,
        accountType: "user"
      });
    }
    if (operationBot?.id && !owners.some(owner => owner.id === operationBot.id)) {
      owners.push({
        id: operationBot.id,
        username: operationBot.username || `Operator ${operationBot.id}`,
        accountType: "bot"
      });
    }
    return owners;
  }, [currentUser?.id, currentUser?.username, operationBot?.id, operationBot?.username]);
  const ownerIDs = React.useMemo(() => ownerOptions.map(owner => owner.id), [ownerOptions]);
  const ownerIDKey = React.useMemo(() => ownerIDs.join(","), [ownerIDs]);
  const [tokenOwnerID, setTokenOwnerID] = React.useState("");
  const {
    data,
    loading
  } = useQuery(CHAT_API_TOKENS_QUERY, {
    variables: {
      operator_ids: ownerIDs.length > 0 ? ownerIDs : [0]
    },
    skip: ownerIDs.length === 0,
    fetchPolicy: "no-cache"
  });
  React.useEffect(() => {
    setLocalTokens([]);
  }, [ownerIDKey]);
  React.useEffect(() => {
    if (data?.apitokens) {
      setLocalTokens(data.apitokens);
    }
  }, [data]);
  React.useEffect(() => {
    if (currentToken?.operator_id && ownerOptions.some(owner => owner.id === currentToken.operator_id)) {
      setTokenOwnerID(currentToken.operator_id);
      return;
    }
    setTokenOwnerID(previousOwnerID => ownerOptions.length > 0 && !ownerOptions.some(owner => `${owner.id}` === `${previousOwnerID}`) ? ownerOptions[0].id : previousOwnerID);
  }, [currentToken?.id, currentToken?.operator_id, ownerOptions]);
  const selectedOwner = ownerOptions.find(owner => `${owner.id}` === `${tokenOwnerID}`) || null;
  const tokens = React.useMemo(() => {
    const combined = localTokens.filter(token => `${token.operator_id}` === `${tokenOwnerID}`);
    if (currentToken?.id && `${currentToken.operator_id}` === `${tokenOwnerID}` && !combined.some(token => token.id === currentToken.id)) {
      combined.unshift(currentToken);
    }
    if (value && !combined.some(token => `${token.id}` === `${value}`)) {
      combined.unshift({
        id: value,
        name: `Token ${value}`,
        scopes: [],
        active: true,
        deleted: false,
        operator_id: tokenOwnerID
      });
    }
    return combined;
  }, [localTokens, currentToken, value, tokenOwnerID]);
  const selectedToken = tokens.find(token => `${token.id}` === `${value}`) || null;
  const createTokenInitialScopes = React.useMemo(() => selectedToken?.scopes || [], [selectedToken]);
  const [createAPIToken] = useMutation(CREATE_API_TOKEN, {
    onCompleted: result => {
      if (result.createAPIToken.status === "success") {
        const {
          token_value,
          ...createdToken
        } = result.createAPIToken;
        setLocalTokens(prev => [{
          ...createdToken,
          active: true,
          deleted: false
        }, ...prev]);
        setTokenOwnerID(createdToken.operator_id);
        setValue(createdToken.id);
        snackActions.success("Created and selected API token");
        setOpenCreateToken(false);
      } else {
        snackActions.error(result.createAPIToken.error);
      }
    },
    onError: error => snackActions.error(error.message)
  });
  const createToken = (name, scopes) => {
    createAPIToken({
      variables: {
        operator_id: selectedOwner?.id,
        name,
        scopes
      }
    });
  };
  const changeTokenOwner = event => {
    setTokenOwnerID(Number(event.target.value));
    setValue("");
  };
  const tokenSelectorDisabled = !selectedOwner;
  return <Box sx={{
    display: "flex",
    flexDirection: "column",
    gap: 1
  }}>
            <Box sx={{
      border: `1px solid ${alpha("#ffffff", 0.12)}`,
      borderRadius: 1,
      p: 1.25
    }}>
                <Typography variant="subtitle2">AI Chat API Token</Typography>
                <Typography variant="caption" color="text.secondary" sx={{
        display: "block",
        mt: 0.5
      }}>
                    AI chat can use a token for your operator account or the operation bot{operationBot?.username ? ` (${operationBot.username})` : ""}. The token must include apitoken.write to generate scoped Mythic API tokens and chat-ai.write to stream responses back to this channel.
                </Typography>
                <Box sx={{
        display: "flex",
        gap: 0.75,
        flexWrap: "wrap",
        mt: 1
      }}>
                    {AI_CHAT_REQUIRED_TOKEN_SCOPES.map(scope => <Chip key={scope} size="small" label={scope} color={selectedToken && tokenHasScope(selectedToken, scope) ? "success" : "warning"} />)}
                </Box>
            </Box>
            <Box sx={{
      display: "grid",
      gridTemplateColumns: {
        xs: "1fr",
        md: "minmax(160px, 0.55fr) minmax(220px, 1fr) auto"
      },
      gap: 1,
      alignItems: "stretch"
    }}>
                <FormControl size="small" fullWidth required>
                    <InputLabel>Owner</InputLabel>
                    <Select label="Owner" value={tokenOwnerID ? `${tokenOwnerID}` : ""} disabled={ownerOptions.length === 0} onChange={changeTokenOwner}>

                        {ownerOptions.length === 0 && <MenuItem value="" disabled>No token owners available</MenuItem>}
                        {ownerOptions.map(owner => <MenuItem value={`${owner.id}`} key={`chat-token-owner-${owner.id}`}>
                                {tokenOwnerLabel(owner)}
                            </MenuItem>)}
                    </Select>
                </FormControl>
                <FormControl size="small" fullWidth required>
                    <InputLabel>API Token</InputLabel>
                    <Select label="API Token" value={value ? `${value}` : ""} disabled={tokenSelectorDisabled} onChange={event => setValue(Number(event.target.value))}>

                        {!selectedOwner && <MenuItem value="" disabled>Select a token owner first</MenuItem>}
                        {tokens.length === 0 && <MenuItem value="" disabled>{loading ? "Loading API tokens..." : "No active API tokens available"}</MenuItem>}
                        {tokens.map(token => <MenuItem value={`${token.id}`} key={`chat-token-${token.id}`}>
                                <Box sx={{
              display: "flex",
              flexDirection: "column",
              py: 0.25
            }}>
                                    <Typography variant="body2">{formatTokenLabel(token)}</Typography>
                                    <Typography variant="caption" color={tokenMeetsAIChatRequirements(token) ? "text.secondary" : "warning.main"} sx={{
                whiteSpace: "normal"
              }}>
                                        {(token.scopes || []).join(", ") || "No scopes"}
                                    </Typography>
                                </Box>
                            </MenuItem>)}
                    </Select>
                </FormControl>
                <Button variant="outlined" size="small" disabled={tokenSelectorDisabled} onClick={() => setOpenCreateToken(true)} sx={{
        height: 40,
        whiteSpace: "nowrap",
        px: 2
      }}>

                    Create
                </Button>
            </Box>
            {selectedToken && <Box sx={{
      display: "flex",
      flexWrap: "wrap",
      gap: 0.5
    }}>
                    {selectedOwner && <Chip size="small" variant="outlined" label={tokenOwnerLabel(selectedOwner)} />}
                    {(selectedToken.scopes || []).map(scope => <Chip size="small" key={`${selectedToken.id}-${scope}`} label={scope} />)}
                </Box>}
            {openCreateToken && <MythicDialog open={openCreateToken} fullWidth={true} maxWidth="md" onClose={() => setOpenCreateToken(false)} innerDialog={<React.Suspense fallback={<Typography sx={{
      p: 3
    }} color="text.secondary">Loading token editor...</Typography>}>
                            <LazySettingsAPITokenDialog title={`New AI Chat API Token${selectedOwner ? ` for ${selectedOwner.username}` : ""}`} name={`${selectedOwner?.accountType === "bot" ? "Operation bot" : "Operator"} AI chat token`} initialScopes={createTokenInitialScopes} requiredScopes={AI_CHAT_REQUIRED_TOKEN_SCOPES} requiredScopeDescriptions={{
        "apitoken.write": "Required so the chat container can request scoped Mythic API tokens for tools.",
        "chat-ai.write": "Required so the chat container can stream AI responses back into this channel."
      }} onAccept={createToken} handleClose={() => setOpenCreateToken(false)} />

                        </React.Suspense>} />}
        </Box>;
};
const ChatEmptyState = ({icon, title, detail}) => (
  <MythicEmptyState
    className={chatClasses("mythic-chat-empty-state")}
    description={detail}
    icon={icon}
    title={title}
  />
);
const ChatDisplayChip = ({
  chip,
  className = ""
}) => {
  const chipColor = chip.color || "neutral";
  const clickable = Boolean(chip.click);
  const chipClassName = chatClasses(`mythic-chat-display-chip mythic-inline-flex mythic-line-height-tight mythic-gap-xs mythic-nowrap mythic-inherit-color mythic-border-radius-pill mythic-min-width-0 mythic-align-center${clickable ? " mythic-clickable mythic-chat-display-chip-clickable" : ""} mythic-chat-display-chip-${chipColor}${className ? ` ${className}` : ""}`);
  const children = <>
            <span className={chatClasses("mythic-chat-display-chip-label mythic-font-weight-extra-bold")}>{chip.label}:</span>
            <span className={chatClasses("mythic-chat-display-chip-value mythic-truncate mythic-font-size-xs mythic-font-weight-heavy mythic-overflow-hidden")}>{chip.value}</span>
        </>;
  const content = clickable ? <button className={chipClassName} onClick={() => chip.onClick?.(chip)} style={chip.colorStyle} type="button">

                {children}
            </button> : <span className={chipClassName} style={chip.colorStyle}>

                {children}
            </span>;
  if (chip.tooltip) {
    return <MythicStyledTooltip title={chip.tooltip}>{content}</MythicStyledTooltip>;
  }
  return content;
};
const ChatDisplayChipRow = ({
  chips,
  className = "",
  onChipClick
}) => {
  if (!chips || chips.length === 0) {
    return null;
  }
  return <span className={chatClasses(`mythic-chat-display-chip-row mythic-gap-xs mythic-inline-cluster mythic-wrap mythic-min-width-0${className ? ` ${className}` : ""}`)}>
            {chips.map(chip => <ChatDisplayChip key={chip.key} chip={{
      ...chip,
      onClick: onChipClick
    }} />)}
        </span>;
};
const ChatChannelMetadataBar = ({
  channel,
  displayStringOverride,
  onChipClick
}) => {
  const metadataState = React.useMemo(() => buildChannelMetadataChips(channel, displayStringOverride), [channel, displayStringOverride]);
  const [hidden, setHidden] = React.useState(metadataState.collapsed);
  React.useEffect(() => {
    setHidden(metadataState.collapsed);
  }, [channel?.id, metadataState.collapsed]);
  if (!channel || channel.channel_type !== "ai" || metadataState.chips.length === 0) {
    return null;
  }
  const visibleChips = metadataState.chips.slice(0, metadataState.maxVisible);
  const overflowCount = Math.max(0, metadataState.chips.length - visibleChips.length);
  return <Box className={chatClasses(`mythic-chat-metadata-bar mythic-gap-xs mythic-flex mythic-surface-muted mythic-align-center${hidden ? " mythic-chat-metadata-bar-hidden" : ""}`)}>
            <IconButton className={chatClasses("mythic-chat-metadata-toggle mythic-border-radius")} size="small" onClick={() => setHidden(prev => !prev)}>

                {hidden ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
            </IconButton>
            {hidden ? <Typography variant="caption" color="text.secondary">Metadata hidden</Typography> : <Box className={chatClasses("mythic-chat-metadata-content mythic-gap-xs mythic-cluster mythic-flex-fill")}>
                    <ChatDisplayChipRow chips={visibleChips} onChipClick={onChipClick} />
                    {overflowCount > 0 && <span className={chatClasses("mythic-chat-display-chip mythic-chat-display-chip-neutral")}>
                            <span className={chatClasses("mythic-chat-display-chip-value mythic-truncate mythic-font-size-xs mythic-font-weight-heavy mythic-overflow-hidden")}>+{overflowCount} more</span>
                        </span>}
                </Box>}
        </Box>;
};
const ChatMetadataDisplayPreview = ({
  channel,
  displayString
}) => {
  const metadataState = React.useMemo(() => buildChannelMetadataChips(channel, displayString), [channel, displayString]);
  const availableKeys = React.useMemo(() => getAvailableChannelMetadataKeys(channel), [channel]);
  const availableKeyText = availableKeys.length > 0 ? `Available keys: ${availableKeys.join(", ")}` : "";
  if (metadataState.chips.length === 0) {
    return <Box className={chatClasses("mythic-chat-metadata-preview mythic-gap-xs mythic-flex mythic-border mythic-surface-muted mythic-wrap mythic-align-center mythic-border-radius")}>
                <Typography variant="caption" color="text.secondary">No channel metadata chips available yet.</Typography>
                {availableKeyText && <Typography variant="caption" color="text.secondary" sx={{
        display: "block",
        mt: 0.5
      }}>
                        {availableKeyText}
                    </Typography>}
            </Box>;
  }
  return <Box className={chatClasses("mythic-chat-metadata-preview mythic-gap-xs mythic-flex mythic-border mythic-surface-muted mythic-wrap mythic-align-center mythic-border-radius")}>
            <Box sx={{
      display: "flex",
      flexWrap: "wrap",
      gap: 0.5,
      alignItems: "center"
    }}>
                <ChatDisplayChipRow chips={metadataState.chips.slice(0, metadataState.maxVisible)} />
                {metadataState.chips.length > metadataState.maxVisible && <span className={chatClasses("mythic-chat-display-chip mythic-chat-display-chip-neutral")}>
                        <span className={chatClasses("mythic-chat-display-chip-value mythic-truncate mythic-font-size-xs mythic-font-weight-heavy mythic-overflow-hidden")}>+{metadataState.chips.length - metadataState.maxVisible}</span>
                    </span>}
            </Box>
            {availableKeyText && <Typography variant="caption" color="text.secondary" sx={{
      display: "block",
      mt: 0.75
    }}>
                    {availableKeyText}
                </Typography>}
        </Box>;
};
const ChatMetadataWizardDraggableList = ({
  rows,
  onDragEnd,
  updateRow
}) => <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="chat-metadata-display-wizard-list">
            {provided => <div className={chatClasses("mythic-reorder-list mythic-gap-sm mythic-chat-metadata-wizard-list mythic-scroll-region mythic-flex mythic-flex-fill mythic-flex-column")} ref={provided.innerRef} {...provided.droppableProps}>
                    {rows.map((row, index) => <ChatMetadataWizardDraggableRow key={row.key} row={row} index={index} updateRow={updateRow} />)}
                    {provided.placeholder}
                </div>}
        </Droppable>
    </DragDropContext>;
const ChatMetadataWizardDraggableRow = ({
  row,
  index,
  updateRow
}) => <Draggable draggableId={`metadata-display-${row.key}`} index={index}>
        {(provided, snapshot) => {
    const rowContent = <div ref={provided.innerRef} className={chatClasses(`mythic-reorder-row mythic-gap-sm mythic-chat-metadata-wizard-row mythic-flex mythic-min-width-0 mythic-align-center mythic-surface-raised mythic-border mythic-border-radius mythic-text-primary mythic-flex-fixed mythic-full-width${snapshot.isDragging ? " mythic-reorder-row-dragging" : ""}${row.visible ? "" : " mythic-reorder-row-disabled"}`)} {...provided.draggableProps}>

                    <MythicCluster component="span" gap="none" justify="center" inline wrap={false} className="mythic-reorder-drag-handle mythic-border mythic-border-radius mythic-text-secondary" {...provided.dragHandleProps}>
                        <DragHandleIcon fontSize="small" />
                    </MythicCluster>
                    <div className={chatClasses("mythic-chat-metadata-wizard-row-grid mythic-gap-sm mythic-full-width mythic-grid mythic-min-width-0")}>
                        <Box className={chatClasses("mythic-chat-metadata-wizard-row-key mythic-stack")}>
                            <Typography variant="body2" sx={{
            fontFamily: "monospace"
          }} noWrap>{row.key}</Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>
                                {row.value !== "" ? `Current: ${row.value}` : "No current value"}
                            </Typography>
                        </Box>
                        <TextField size="small" label="Label" value={row.labelOverride} placeholder={row.baseLabel} onChange={e => updateRow(row.key, {
          labelOverride: e.target.value
        })} fullWidth />

                        <Select size="small" displayEmpty value={row.formatOverride} onChange={e => updateRow(row.key, {
          formatOverride: e.target.value
        })} fullWidth>

                            <MenuItem value="">Default{row.format ? ` (${row.format})` : ""}</MenuItem>
                            <MenuItem value="number">Number</MenuItem>
                            <MenuItem value="percent">Percent</MenuItem>
                            <MenuItem value="currency">Currency</MenuItem>
                            <MenuItem value="string">String</MenuItem>
                        </Select>
                        <ChatMetadataColorEditor value={row.colorOverride} fallback={row.color || "neutral"} onChange={colorOverride => updateRow(row.key, {
          colorOverride
        })} />

                        <Typography className={chatClasses("mythic-chat-metadata-wizard-row-detail mythic-block mythic-line-height-snug mythic-overflow-hidden mythic-min-width-0")} variant="caption" color="text.secondary">
                            {row.tooltip || "No description reported."}
                        </Typography>
                    </div>
                    <MythicCluster component="div" gap="xs" align="center" wrap={false} className="mythic-reorder-row-actions mythic-flex-fixed">
                        <MythicActionButton iconOnly tone={row.visible ? "error" : "info"} aria-label={row.visible ? `Hide ${row.key}` : `Show ${row.key}`} size="small" onClick={() => updateRow(row.key, {
          visible: !row.visible
        })}>

                            {row.visible ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                        </MythicActionButton>
                    </MythicCluster>
                </div>;
    return <MythicDraggablePortal isDragging={snapshot.isDragging}>
                    {rowContent}
                </MythicDraggablePortal>;
  }}
    </Draggable>;
const ChatMetadataDisplayWizard = ({
  open,
  channel,
  displayString,
  onClose,
  onApply
}) => {
  const parsedDisplay = React.useMemo(() => parseMetadataDisplayString(displayString), [displayString]);
  const [hiddenInitially, setHiddenInitially] = React.useState(false);
  const [maxVisible, setMaxVisible] = React.useState(6);
  const [rows, setRows] = React.useState([]);
  React.useEffect(() => {
    if (open) {
      setHiddenInitially(parsedDisplay.collapsed === true);
      setMaxVisible(parsedDisplay.maxVisible || 6);
      setRows(metadataWizardRowsFromDisplay(channel, displayString));
    }
  }, [open, channel, displayString, parsedDisplay.collapsed, parsedDisplay.maxVisible]);
  const updateRow = (key, updates) => {
    setRows(prev => prev.map(row => row.key === key ? {
      ...row,
      ...updates
    } : row));
  };
  const onDragEnd = ({
    destination,
    source
  }) => {
    if (!destination) {
      return;
    }
    setRows(prev => reorder(prev, source.index, destination.index));
  };
  const generatedDisplay = React.useMemo(() => buildMetadataDisplayStringFromWizard(rows, hiddenInitially, maxVisible), [rows, hiddenInitially, maxVisible]);
  const generatedWarnings = React.useMemo(() => parseMetadataDisplayString(generatedDisplay).warnings, [generatedDisplay]);
  const apply = () => {
    onApply(generatedDisplay);
    onClose();
  };
  return <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
            <DialogTitle>Metadata Display Wizard</DialogTitle>
            <DialogContent className={chatClasses("mythic-chat-dialog-content")} sx={{
      display: "flex",
      flexDirection: "column",
      gap: 1.5,
      pt: "20px !important",
      px: 3
    }}>
                <Box className={chatClasses("mythic-chat-metadata-wizard-top-grid mythic-align-stretch mythic-grid")}>
                    <Box className={chatClasses("mythic-chat-metadata-wizard-top-card mythic-gap-sm mythic-stack mythic-border mythic-border-radius")}>
                        <Typography className={chatClasses("mythic-chat-metadata-wizard-top-title")} variant="subtitle2">Initial visibility</Typography>
                        <Box className={chatClasses("mythic-chat-metadata-wizard-top-body mythic-flex mythic-flex-fill mythic-min-width-0 mythic-align-center")}>
                            <FormControlLabel className={chatClasses("mythic-chat-metadata-wizard-visibility-control")} control={<Switch checked={!hiddenInitially} onChange={e => setHiddenInitially(!e.target.checked)} />} label="Show initially" />

                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{
            display: "block"
          }}>
                            Users can still hide or show the bar locally from the chat header.
                        </Typography>
                    </Box>
                    <Box className={chatClasses("mythic-chat-metadata-wizard-top-card mythic-gap-sm mythic-stack mythic-border mythic-border-radius")}>
                        <Typography className={chatClasses("mythic-chat-metadata-wizard-top-title")} variant="subtitle2">Visible limit</Typography>
                        <Box className={chatClasses("mythic-chat-metadata-wizard-top-body mythic-flex mythic-flex-fill mythic-min-width-0 mythic-align-center")}>
                            <TextField label="Max visible" type="number" size="small" value={maxVisible} onChange={e => setMaxVisible(e.target.value)} inputProps={{
              min: 1
            }} helperText="Overflow renders as +N more." fullWidth />

                        </Box>
                    </Box>
                    <Box className={chatClasses("mythic-chat-metadata-wizard-top-card mythic-gap-sm mythic-stack mythic-border mythic-border-radius")}>
                        <Typography className={chatClasses("mythic-chat-metadata-wizard-top-title")} variant="subtitle2">Preview</Typography>
                        <Box className={chatClasses("mythic-chat-metadata-wizard-top-body mythic-chat-metadata-wizard-preview-body mythic-align-stretch mythic-flex mythic-flex-fill mythic-min-width-0 mythic-align-center")}>
                            <ChatMetadataDisplayPreview channel={channel} displayString={generatedDisplay} />
                        </Box>
                    </Box>
                </Box>
                <Box sx={{
        display: "flex",
        flexDirection: "column",
        gap: 0.75,
        minHeight: 0
      }}>
                    <Typography variant="subtitle2">Metadata chips</Typography>
                    <Typography variant="caption" color="text.secondary">
                        Drag rows to set display order. Hidden rows do not count toward the max visible preview.
                    </Typography>
                    {rows.length === 0 ? <Box sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
          p: 1.25
        }}>
                            <Typography variant="body2" color="text.secondary">
                                No metadata items have been reported for this channel yet. You can still edit the display string manually.
                            </Typography>
                        </Box> : <Box sx={{
          maxHeight: 420,
          overflow: "auto"
        }}>
                            <ChatMetadataWizardDraggableList rows={rows} onDragEnd={onDragEnd} updateRow={updateRow} />
                        </Box>}
                </Box>
                <TextField label="Generated display string" value={generatedDisplay} fullWidth size="small" multiline minRows={2} InputProps={{
        readOnly: true
      }} helperText={generatedWarnings.length > 0 ? generatedWarnings.join("; ") : "This is what will be written into the Metadata display field."} error={generatedWarnings.length > 0} />

            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={apply} variant="contained" disabled={generatedWarnings.length > 0}>Apply</Button>
            </DialogActions>
        </Dialog>;
};
const ChatMetadataDisplayField = ({
  channel,
  value,
  setValue,
  warnings
}) => {
  const [wizardOpen, setWizardOpen] = React.useState(false);
  return <Box sx={{
    display: "flex",
    flexDirection: "column",
    gap: 0.75
  }}>
            <TextField fullWidth label="Metadata display" size="small" value={value} placeholder={metadataDisplayExample} onChange={e => setValue(e.target.value)} helperText={warnings.length > 0 ? warnings.join("; ") : "Optional compact display string for AI metadata chips."} error={warnings.length > 0} InputProps={{
      endAdornment: <InputAdornment position="end">
                            <MythicStyledTooltip title="Open metadata display wizard">
                                <IconButton size="small" onClick={() => setWizardOpen(true)}>
                                    <SettingsSuggestIcon fontSize="small" />
                                </IconButton>
                            </MythicStyledTooltip>
                        </InputAdornment>
    }} {...CHAT_DIALOG_TEXT_FIELD_PROPS} />

            <Typography variant="caption" color="text.secondary">
                Example: {metadataDisplayExample}
            </Typography>
            <ChatMetadataDisplayPreview channel={channel} displayString={value} />
            <ChatMetadataDisplayWizard open={wizardOpen} channel={channel} displayString={value} onClose={() => setWizardOpen(false)} onApply={setValue} />

        </Box>;
};
const ChannelButtonComponent = ({
  channel,
  selected,
  unread,
  muted,
  chatContainers,
  onSelect,
  onToggleMute
}) => {
  const isAI = channel.channel_type === "ai";
  const secondary = channel.description || (isAI ? channel.chat_container?.name || channel.chat_model || "" : "");
  const channelListChips = getChannelListChips(channel, chatContainers);
  const states = [channel.archived ? {
    label: "Archived",
    className: "mythic-chat-channel-state-archived"
  } : null, channel.locked ? {
    label: "Locked",
    className: "mythic-chat-channel-state-locked"
  } : null, isAI && channel.chat_container && !channel.chat_container.container_running ? {
    label: "Offline",
    className: "mythic-chat-channel-state-offline"
  } : null].filter(Boolean);
  return <Box className={chatClasses("mythic-chat-channel-row mythic-gap-xs mythic-grid mythic-align-center")} data-channel-type={isAI ? "ai" : "standard"}>

            <button type="button" onClick={() => onSelect(channel.id)} className={chatClasses(`mythic-chat-channel-button mythic-clickable mythic-gap-sm mythic-full-width mythic-grid mythic-align-center mythic-border-radius${selected ? " mythic-chat-channel-button-selected" : ""}${channel.archived ? " mythic-chat-channel-button-archived" : ""}`)} data-selected={selected || undefined} data-archived={channel.archived || undefined}>

                <span className={chatClasses("mythic-chat-channel-icon mythic-justify-center mythic-gap-xs mythic-inline-cluster")}>
                    {channel.archived ? <ArchiveIcon fontSize="small" /> : isAI ? <MythicChatContainerIcon altText={channel.chat_container?.name || channelDisplayName(channel)} containerName={channel.chat_container?.name} imgClassName={chatClasses("mythic-chat-channel-icon-image mythic-block")} iconProps={{
          fontSize: "small"
        }} /> : <ForumTwoToneIcon fontSize="small" />}
                </span>
                <span className={chatClasses("mythic-chat-channel-main mythic-stack")}>
                    <span className={chatClasses("mythic-chat-channel-name mythic-truncate mythic-font-weight-semibold mythic-nowrap mythic-overflow-hidden")}>{channelDisplayName(channel)}</span>
                    {secondary && <span className={chatClasses("mythic-chat-channel-meta mythic-truncate mythic-font-size-caption mythic-nowrap mythic-overflow-hidden")}>{secondary} </span>}
                    {channelListChips.length > 0 && <ChatDisplayChipRow chips={channelListChips} className={chatClasses("mythic-chat-channel-config-chips")} />}
                    {states.length > 0 && <span className={chatClasses("mythic-chat-channel-states mythic-gap-xs mythic-flex mythic-wrap")}>
                            {states.map(state => <span key={state.label} className={chatClasses(`mythic-chat-channel-state mythic-line-height-tight mythic-font-weight-extra-bold mythic-nowrap mythic-font-size-xs mythic-inline-cluster mythic-border-radius-pill ${state.className}`)}>{state.label}</span>)}
                        </span>}
                </span>
                {unread && <span className={chatClasses("mythic-chat-unread-badge mythic-line-height-tight mythic-font-weight-extra-bold mythic-nowrap mythic-font-size-xs mythic-inline-cluster mythic-border-radius-pill")}>Unread</span>}
            </button>
            <MythicStyledTooltip title={muted ? "Unsilence notifications" : "Silence notifications"}>
                <IconButton className={chatClasses(`mythic-chat-channel-mute-button mythic-border-radius${muted ? " mythic-chat-channel-mute-button-muted" : ""}`)} size="small" onClick={() => onToggleMute(channel)} aria-label={muted ? `Unsilence ${channelDisplayName(channel)}` : `Silence ${channelDisplayName(channel)}`}>

                    {muted ? <NotificationsOffIcon fontSize="small" /> : <NotificationsActiveIcon fontSize="small" />}
                </IconButton>
            </MythicStyledTooltip>
        </Box>;
};
const ChannelButton = React.memo(ChannelButtonComponent);
const ChatCreateDialog = ({
  open,
  onClose,
  onCreate,
  chatContainers,
  currentUser,
  operationBot,
  initialChannel
}) => {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [channelType, setChannelType] = React.useState("standard");
  const [containerID, setContainerID] = React.useState("");
  const [model, setModel] = React.useState("");
  const [configValues, setConfigValues] = React.useState({});
  const [locked, setLocked] = React.useState(true);
  const [apiTokenID, setAPITokenID] = React.useState("");
  const [metadataDisplay, setMetadataDisplay] = React.useState("");
  React.useEffect(() => {
    if (open) {
      const cloningAI = initialChannel?.channel_type === "ai";
      setName(initialChannel?.name ? `${initialChannel.name} copy` : "");
      setDescription(initialChannel?.description || "");
      setChannelType(cloningAI ? "ai" : "standard");
      setContainerID(cloningAI && initialChannel?.chat_container_id ? `${initialChannel.chat_container_id}` : "");
      setModel(cloningAI ? initialChannel?.chat_model || "" : "");
      setConfigValues({});
      setLocked(cloningAI ? Boolean(initialChannel.locked) : true);
      setAPITokenID(cloningAI && initialChannel?.apitokens_id ? `${initialChannel.apitokens_id}` : "");
      setMetadataDisplay(cloningAI ? getChannelMetadataDisplayString(initialChannel) : "");
    }
  }, [open, initialChannel]);
  const selectedContainer = React.useMemo(() => chatContainers.find(container => `${container.id}` === `${containerID}`), [chatContainers, containerID]);
  const selectedContainerModels = React.useMemo(() => parseChatContainerModels(selectedContainer), [selectedContainer]);
  const selectedModel = React.useMemo(() => selectedContainerModels.find(containerModel => containerModel.name === model) || null, [selectedContainerModels, model]);
  const configOptions = React.useMemo(() => getModelConfigOptions(selectedModel), [selectedModel]);
  React.useEffect(() => {
    if (channelType !== "ai" || !containerID) {
      return;
    }
    if (model && !selectedContainerModels.some(containerModel => containerModel.name === model)) {
      setModel("");
      return;
    }
    if (model === "" && selectedContainerModels.length === 1) {
      setModel(selectedContainerModels[0].name);
    }
  }, [channelType, containerID, model, selectedContainerModels]);
  React.useEffect(() => {
    if (channelType === "ai" && model) {
      const cloningSameModel = initialChannel?.channel_type === "ai" && `${initialChannel.chat_container_id}` === `${containerID}` && initialChannel.chat_model === model;
      setConfigValues(buildDefaultConfigValues(configOptions, cloningSameModel ? getChannelAIConfig(initialChannel) : {}));
    } else {
      setConfigValues({});
    }
  }, [channelType, containerID, model, configOptions, initialChannel]);
  const changeChannelType = event => {
    const nextType = event.target.value;
    setChannelType(nextType);
    if (nextType !== "ai") {
      setContainerID("");
      setModel("");
      setConfigValues({});
      setAPITokenID("");
      setMetadataDisplay("");
    }
  };
  const changeContainer = event => {
    const nextContainerID = event.target.value;
    const nextContainer = chatContainers.find(container => `${container.id}` === `${nextContainerID}`);
    const nextModels = parseChatContainerModels(nextContainer);
    setContainerID(nextContainerID);
    setModel(nextModels.length === 1 ? nextModels[0].name : "");
    setConfigValues({});
  };
  const createDisabled = name.trim() === "" || (channelType === "ai" && (!containerID || selectedContainerModels.length === 0 || model === "" || !apiTokenID || configHasMissingRequiredValues(configValues, configOptions) || configHasInvalidValues(configValues, configOptions)));
  const submit = () => {
    const aiConfig = channelType === "ai" ? normalizeConfigForSubmit(configValues, configOptions) : {};
    const aiMetadata = channelType === "ai" ? applyMetadataDisplayToMetadata(applyConfigToMetadata({}, aiConfig), metadataDisplay) : {};
    onCreate({
      name,
      description,
      channel_type: channelType,
      chat_container_id: channelType === "ai" ? Number(containerID) : null,
      chat_model: channelType === "ai" ? model : "",
      locked: channelType === "ai" ? locked : false,
      ai_metadata: aiMetadata,
      apitokens_id: channelType === "ai" ? Number(apiTokenID) : null
    });
  };
  const metadataDisplayWarnings = React.useMemo(() => parseMetadataDisplayString(metadataDisplay).warnings, [metadataDisplay]);
  const metadataPreviewChannel = initialChannel?.channel_type === "ai" ? initialChannel : null;
  return <Dialog open={open} onClose={onClose} maxWidth={channelType === "ai" ? "lg" : "sm"} fullWidth>
            <DialogTitle>{initialChannel?.channel_type === "ai" ? "Clone AI Chat" : channelType === "ai" ? "New AI Chat" : "New Channel"}</DialogTitle>
            <DialogContent className={chatClasses("mythic-chat-dialog-content")} sx={{
      display: "flex",
      flexDirection: "column",
      gap: 1.75,
      pt: "20px !important",
      px: 3
    }}>
                <FormControl size="small" fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select label="Type" value={channelType} onChange={changeChannelType}>
                        <MenuItem value="standard">Standard</MenuItem>
                        <MenuItem value="ai">AI</MenuItem>
                    </Select>
                </FormControl>
                <TextField label="Name" size="small" value={name} onChange={e => setName(e.target.value)} autoFocus {...CHAT_DIALOG_TEXT_FIELD_PROPS} />
                <TextField label="Description" size="small" value={description} onChange={e => setDescription(e.target.value)} {...CHAT_DIALOG_TEXT_FIELD_PROPS} />
                {channelType === "ai" && <>
                        <FormControl size="small" fullWidth>
                            <InputLabel>Container</InputLabel>
                            <Select label="Container" value={containerID} onChange={changeContainer}>
                                {chatContainers.length === 0 && <MenuItem value="" disabled>No chat containers available</MenuItem>}
                                {chatContainers.map(container => <MenuItem value={`${container.id}`} key={container.id}>
                                        {container.name}{container.container_running ? "" : " (offline)"}
                                    </MenuItem>)}
                            </Select>
                        </FormControl>
                        {containerID !== "" && <>
                                {selectedContainerModels.length > 0 ? <FormControl size="small" fullWidth>
                                        <InputLabel>Model</InputLabel>
                                        <Select label="Model" value={model} onChange={e => setModel(e.target.value)} renderValue={selected => selected}>

                                            {selectedContainerModels.map(containerModel => <MenuItem value={containerModel.name} key={`${containerID}-${containerModel.name}`}>
                                                    <MythicStack className={chatClasses("mythic-chat-model-option")} gap="xs">
                                                        <Typography variant="body2">{containerModel.name}</Typography>
                                                        {containerModel.description && <Typography variant="caption" color="text.secondary">
                                                                {containerModel.description}
                                                            </Typography>}
                                                    </MythicStack>
                                                </MenuItem>)}
                                        </Select>
                                    </FormControl> : <Box className={chatClasses("mythic-chat-dialog-notice mythic-border-radius")} data-tone="warning">
                                        <Typography variant="body2">No models reported</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            This chat container needs to report at least one model before it can be used for a new AI chat.
                                        </Typography>
                                    </Box>}
                            </>}
                        {configOptions.length > 0 && <ChatConfigurationFields options={configOptions} values={configValues} setValues={setConfigValues} />}
                        <ChatMetadataDisplayField channel={metadataPreviewChannel} value={metadataDisplay} setValue={setMetadataDisplay} warnings={metadataDisplayWarnings} />

                        <ChatAPITokenSelector value={apiTokenID} setValue={setAPITokenID} currentUser={currentUser} operationBot={operationBot} />

                        <Box className={chatClasses("mythic-chat-dialog-notice mythic-border-radius")} data-tone="info">
                            <FormControlLabel control={<Switch checked={locked} onChange={e => setLocked(e.target.checked)} />} label="Lock this AI chat" />

                            <Typography className="mythic-block" variant="caption" color="text.secondary">
                                Locked AI chats remain visible to everyone in the operation, but only the lock owner and operation admins or leads can send prompts into that session.
                            </Typography>
                        </Box>
                    </>}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={submit} variant="contained" disabled={createDisabled}>
                    Create
                </Button>
            </DialogActions>
        </Dialog>;
};
const ChatSearchDialog = ({
  open,
  onClose,
  onSearch,
  searchText,
  setSearchText,
  searchQuery,
  results,
  loading,
  hasSearched,
  onSelectResult,
  viewUTCTime
}) => {
  const trimmedSearchText = searchText.trim();
  const searchResults = results || [];
  const highlightQuery = searchQuery || trimmedSearchText;
  return <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{
    className: "mythic-chat-search-dialog"
  }}>
            <DialogTitle>Search Chat</DialogTitle>
            <DialogContent className={chatClasses("mythic-chat-dialog-content mythic-chat-search-content mythic-flex-fill mythic-min-height-0")} sx={{
      display: "flex",
      flexDirection: "column",
      gap: 1.75,
      pt: "20px !important",
      px: 3
    }}>
                <Box className={chatClasses("mythic-chat-search-form mythic-gap-sm mythic-grid mythic-align-center")}>
                    <TextField autoFocus fullWidth size="small" label="Search" value={searchText} onChange={e => setSearchText(e.target.value)} onKeyDown={e => {
          if (e.key === "Enter") {
            onSearch();
          }
        }} />

                    <Button variant="contained" startIcon={<SearchIcon />} disabled={trimmedSearchText === "" || loading} onClick={onSearch}>
                        {loading ? "Searching" : "Search"}
                    </Button>
                </Box>
                <Box className={chatClasses("mythic-chat-search-results mythic-gap-sm mythic-flex mythic-flex-column mythic-flex-fill mythic-min-height-0")}>
                    {loading && <Box className={chatClasses("mythic-chat-search-empty mythic-justify-center mythic-flex mythic-flex-fill mythic-align-center")}>Searching...</Box>}
                    {!loading && hasSearched && searchResults.length === 0 && <Box className={chatClasses("mythic-chat-search-empty mythic-justify-center mythic-flex mythic-flex-fill mythic-align-center")}>No matches</Box>}
                    {!loading && searchResults.map(result => <button type="button" className={chatClasses("mythic-chat-search-result mythic-inherit-color mythic-clickable mythic-gap-sm mythic-border mythic-grid mythic-border-radius")} key={result.id} onClick={() => onSelectResult(result)}>

                            <span className={chatClasses("mythic-chat-search-result-header mythic-justify-between mythic-flex mythic-min-width-0 mythic-align-center")}>
                                <span className={chatClasses("mythic-chat-search-channel mythic-font-weight-strong mythic-gap-xs mythic-inline-cluster mythic-min-width-0")}>
                                    {result.channel_type === "ai" ? <SmartToyTwoToneIcon fontSize="small" /> : <ForumTwoToneIcon fontSize="small" />}
                                    <MythicTruncatedText component="span" >{result.channel_type === "ai" ? result.channel_name : `#${result.channel_name}`}</MythicTruncatedText>
                                </span>
                                <span className={chatClasses("mythic-chat-search-meta mythic-font-size-caption mythic-nowrap mythic-flex-fixed")}>{result.sender_display_name} · {formatTimestamp(result.created_at, viewUTCTime)}</span>
                            </span>
                            <span className={chatClasses("mythic-chat-search-message mythic-break-anywhere mythic-overflow-hidden")}>{renderSearchSnippet(result.message, highlightQuery)}</span>
                        </button>)}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>;
};
const ChatEditChannelDialog = ({
  open,
  channel,
  onClose,
  onSave,
  chatContainers = [],
  currentUser,
  operationBot
}) => {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [chatModel, setChatModel] = React.useState("");
  const [configValues, setConfigValues] = React.useState({});
  const [apiTokenID, setAPITokenID] = React.useState("");
  const [metadataDisplay, setMetadataDisplay] = React.useState("");
  const isGeneralChannel = isGeneralChatChannel(channel);
  const isAIChannel = channel?.channel_type === "ai";
  const containerModels = React.useMemo(() => {
    if (!isAIChannel) {
      return [];
    }
    const container = chatContainers.find(item => item.id === channel.chat_container_id) || channel.chat_container;
    return parseChatContainerModels(container);
  }, [channel, chatContainers, isAIChannel]);
  const selectedModel = React.useMemo(() => containerModels.find(containerModel => containerModel.name === chatModel) || (chatModel ? null : modelForChannel(channel, chatContainers)), [channel, chatContainers, chatModel, containerModels]);
  const configOptions = React.useMemo(() => getModelConfigOptions(selectedModel), [selectedModel]);
  React.useEffect(() => {
    if (open && channel) {
      setName(channel.name || "");
      setDescription(channel.description || "");
      setChatModel(channel.chat_model || "");
      setAPITokenID(channel.apitokens_id || "");
      setMetadataDisplay(getChannelMetadataDisplayString(channel));
      const initialModel = modelForChannel(channel, chatContainers);
      setConfigValues(buildDefaultConfigValues(getModelConfigOptions(initialModel), getChannelAIConfig(channel)));
    }
  }, [open, channel, chatContainers]);
  const changeModel = event => {
    const nextModelName = event.target.value;
    const nextModel = containerModels.find(containerModel => containerModel.name === nextModelName) || null;
    const nextOptions = getModelConfigOptions(nextModel);
    setChatModel(nextModelName);
    setConfigValues(prev => buildDefaultConfigValues(nextOptions, prev));
  };
  const submit = () => {
    if (!channel) {
      return;
    }
    const update = {
      channel_id: channel.id,
      description
    };
    if (!isGeneralChatChannel(channel)) {
      update.name = name.trim();
    }
    if (isAIChannel) {
      update.chat_model = chatModel;
      const metadataWithConfig = applyConfigToMetadata(getChannelAIMetadata(channel), normalizeConfigForSubmit(configValues, configOptions));
      update.ai_metadata = applyMetadataDisplayToMetadata(metadataWithConfig, metadataDisplay);
      update.apitokens_id = Number(apiTokenID);
    }
    onSave(update);
  };
  const metadataDisplayWarnings = React.useMemo(() => parseMetadataDisplayString(metadataDisplay).warnings, [metadataDisplay]);
  const saveDisabled = (!isGeneralChannel && name.trim() === "") || (isAIChannel && (!apiTokenID || configHasMissingRequiredValues(configValues, configOptions) || configHasInvalidValues(configValues, configOptions)));
  return <Dialog open={open} onClose={onClose} maxWidth={isAIChannel ? "lg" : "sm"} fullWidth>
            <DialogTitle>{isAIChannel ? "Edit AI Chat" : "Edit Channel"}</DialogTitle>
            <DialogContent className={chatClasses("mythic-chat-dialog-content")} sx={{
      display: "flex",
      flexDirection: "column",
      gap: 1.75,
      pt: "20px !important",
      px: 3
    }}>
                <TextField autoFocus={!isGeneralChannel} fullWidth label="Name" size="small" disabled={isGeneralChannel} value={name} {...CHAT_DIALOG_TEXT_FIELD_PROPS} onChange={e => setName(e.target.value)} />

                <TextField fullWidth label="Description" multiline minRows={1} maxRows={5} size="small" autoFocus={isGeneralChannel} value={description} onChange={e => setDescription(e.target.value)} />

                {isAIChannel && <>
                        <FormControl size="small" fullWidth>
                            <InputLabel>Model</InputLabel>
                            <Select label="Model" value={chatModel} onChange={changeModel} renderValue={selected => selected}>

                                {containerModels.length === 0 && <MenuItem value={chatModel} disabled>{chatModel || "No models reported"}</MenuItem>}
                                {containerModels.map(containerModel => <MenuItem value={containerModel.name} key={`${channel?.id}-${containerModel.name}`}>
                                        <Box sx={{
                display: "flex",
                flexDirection: "column",
                py: 0.5,
                minWidth: 0
              }}>
                                            <Typography variant="body2">{containerModel.name}</Typography>
                                            {containerModel.description && <Typography variant="caption" color="text.secondary" sx={{
                  whiteSpace: "normal"
                }}>
                                                    {containerModel.description}
                                                </Typography>}
                                        </Box>
                                    </MenuItem>)}
                            </Select>
                        </FormControl>
                        <ChatConfigurationFields options={configOptions} values={configValues} setValues={setConfigValues} />
                        <ChatMetadataDisplayField channel={channel} value={metadataDisplay} setValue={setMetadataDisplay} warnings={metadataDisplayWarnings} />

                        <ChatAPITokenSelector value={apiTokenID} setValue={setAPITokenID} currentToken={channel?.apitoken} currentUser={currentUser} operationBot={operationBot} />

                    </>}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={submit} variant="contained" disabled={saveDisabled}>
                    Save
                </Button>
            </DialogActions>
        </Dialog>;
};
const ChatSystemMessageDialog = ({
  open,
  selectedChannel,
  isMythicAdmin,
  onClose,
  onSend
}) => {
  const [message, setMessage] = React.useState("");
  const [allOperations, setAllOperations] = React.useState(false);
  React.useEffect(() => {
    if (open) {
      setMessage("");
      setAllOperations(false);
    }
  }, [open]);
  const submit = () => {
    const trimmed = message.trim();
    if (trimmed === "" || !selectedChannel) {
      return;
    }
    onSend({
      message: trimmed,
      all_operations: isMythicAdmin && allOperations
    }).then(({
      data
    }) => {
      if (data?.chatCreateMessage?.status === "success") {
        onClose();
      }
    }).catch(() => {});
  };
  const destination = isMythicAdmin && allOperations ? "All operations" : selectedChannel ? channelDisplayName(selectedChannel) : "No channel";
  const sendDisabled = message.trim() === "" || !selectedChannel || (selectedChannel.archived && !(isMythicAdmin && allOperations));
  return <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>System Message</DialogTitle>
            <DialogContent className={chatClasses("mythic-chat-dialog-content")} sx={{
      display: "flex",
      flexDirection: "column",
      gap: 1.75,
      pt: "20px !important",
      px: 3
    }}>
                <Box className={chatClasses("mythic-chat-system-destination mythic-gap-sm mythic-flex mythic-border mythic-min-width-0 mythic-align-center mythic-border-radius")}>
                    <CampaignTwoToneIcon fontSize="small" />
                    <Typography variant="body2" noWrap>{destination}</Typography>
                </Box>
                <TextField autoFocus fullWidth label="Message" multiline minRows={4} size="small" value={message} onChange={e => setMessage(e.target.value)} />

                {isMythicAdmin && <Box className={chatClasses("mythic-chat-system-options mythic-border mythic-border-radius")}>
                        <FormControlLabel control={<Switch checked={allOperations} onChange={e => setAllOperations(e.target.checked)} />} label="Send to all operations" />

                    </Box>}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={submit} variant="contained" disabled={sendDisabled}>
                    Send
                </Button>
            </DialogActions>
        </Dialog>;
};
const ChatComposer = React.memo(({
  autoFocus = false,
  selectedChannel,
  composerScope = "",
  slashOptions,
  genericAliasOptions = [],
  messageHistory = [],
  disabledReason,
  activeAIRequest,
  canCreateSystemMessage,
  isMythicAdmin,
  onOpenSystemMessage,
  onSendMessage,
  onCancelRequest
}) => {
  const inputRef = React.useRef(null);
  const historyDraftRef = React.useRef("");
  const [composer, setComposer] = React.useState("");
  const [historyIndex, setHistoryIndex] = React.useState(null);
  const composerSlash = React.useMemo(() => parseComposerSlashCommand(composer), [composer]);
  const slashCommandIsKnown = React.useMemo(() => isKnownSlashCommand(selectedChannel, composerSlash, slashOptions), [selectedChannel, composerSlash, slashOptions]);
  const matchingSlashOptions = React.useMemo(() => getMatchingSlashOptions(composerSlash, slashOptions), [composerSlash, slashOptions]);
  const composerDisabled = disabledReason !== "";
  const sendDisabled = composerDisabled || composer.trim() === "" || !slashCommandIsKnown;
  const showSlashOptions = selectedChannel?.channel_type === "ai" && composerSlash.isSlash && !slashCommandIsKnown;
  React.useEffect(() => {
    setHistoryIndex(null);
    historyDraftRef.current = "";
  }, [selectedChannel?.id, composerScope]);
  const focusComposer = cursorPosition => {
    const applyFocus = () => {
      inputRef.current?.focus();
      if (typeof cursorPosition === "number" && inputRef.current?.setSelectionRange) {
        const adjustedCursorPosition = Math.min(cursorPosition, inputRef.current.value.length);
        inputRef.current.setSelectionRange(adjustedCursorPosition, adjustedCursorPosition);
      }
    };
    if (typeof window !== "undefined" && window.requestAnimationFrame) {
      window.requestAnimationFrame(applyFocus);
      return;
    }
    applyFocus();
  };
  const selectSlashOption = option => {
    setComposer(`/${option.name}${composerSlash.argument ? ` ${composerSlash.argument}` : " "}`);
    focusComposer();
  };
  const completeGenericAliasReference = () => {
    const input = inputRef.current;
    const cursorPosition = typeof input?.selectionStart === "number" ? input.selectionStart : composer.length;
    const selectionEnd = typeof input?.selectionEnd === "number" ? input.selectionEnd : cursorPosition;
    const completionContext = getGenericAliasCompletionContext(composer, cursorPosition, selectionEnd, genericAliasOptions);
    if (!completionContext) {
      return false;
    }
    // Chat generic aliases are expanded server-side for AI channels. Complete
    // the nearest @ token so aliases still work inside slash-command prompts.
    const replacement = `@${completionContext.matches[0].name}`;
    const updatedComposer = `${composer.slice(0, completionContext.start)}${replacement}${composer.slice(completionContext.end)}`;
    setComposer(updatedComposer);
    focusComposer(completionContext.start + replacement.length);
    return true;
  };
  const composerCursorAllowsHistory = (event, direction) => {
    if (messageHistory.length === 0 || showSlashOptions || event.altKey || event.ctrlKey || event.metaKey) {
      return false;
    }
    const input = event.target;
    const inputValue = typeof input.value === "string" ? input.value : composer;
    const cursorPosition = typeof input.selectionStart === "number" ? input.selectionStart : composer.length;
    const selectionEnd = typeof input.selectionEnd === "number" ? input.selectionEnd : cursorPosition;
    if (cursorPosition !== selectionEnd) {
      return false;
    }
    if (direction < 0) {
      return !inputValue.slice(0, cursorPosition).includes("\n");
    }
    return !inputValue.slice(selectionEnd).includes("\n");
  };
  const navigateComposerHistory = direction => {
    if (direction < 0) {
      if (historyIndex === null) {
        historyDraftRef.current = composer;
        const nextMessage = messageHistory[0] || "";
        setHistoryIndex(0);
        setComposer(nextMessage);
        focusComposer(nextMessage.length);
        return;
      }
      const nextIndex = Math.min(historyIndex + 1, messageHistory.length - 1);
      const nextMessage = messageHistory[nextIndex] || "";
      setHistoryIndex(nextIndex);
      setComposer(nextMessage);
      focusComposer(nextMessage.length);
      return;
    }
    if (historyIndex === null) {
      return;
    }
    const nextIndex = historyIndex - 1;
    if (nextIndex < 0) {
      const draft = historyDraftRef.current;
      setHistoryIndex(null);
      setComposer(draft);
      focusComposer(draft.length);
      return;
    }
    const nextMessage = messageHistory[nextIndex] || "";
    setHistoryIndex(nextIndex);
    setComposer(nextMessage);
    focusComposer(nextMessage.length);
  };
  const submitMessage = () => {
    const message = composer.trim();
    if (sendDisabled || message === "") {
      return;
    }
    if (onSendMessage(message)) {
      setComposer("");
      setHistoryIndex(null);
      historyDraftRef.current = "";
    }
  };
  return <Box className={chatClasses("mythic-chat-composer mythic-justify-between mythic-gap-sm mythic-flex mythic-align-center")}>
            <MythicStack className={chatClasses("mythic-chat-composer-main")} fill gap="sm">
                {activeAIRequest && <MythicToolbar className={chatClasses("mythic-chat-active-request mythic-border-radius")} density="compact">

                        <MythicStack gap="xs">
                            <Typography className="mythic-font-weight-bold" variant="caption">AI response in progress</Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>{activeAIRequest.status || "streaming"}</Typography>
                        </MythicStack>
                        <MythicStyledTooltip title="Cancel request">
                            <IconButton size="small" color="warning" onClick={() => onCancelRequest(activeAIRequest.id)}>
                                <StopCircleIcon fontSize="small" />
                            </IconButton>
                        </MythicStyledTooltip>
                    </MythicToolbar>}
                {showSlashOptions && <MythicStack className={chatClasses("mythic-chat-slash-options mythic-border mythic-border-radius")} gap="xs" scroll>
                        {matchingSlashOptions.length === 0 ? <Box className={chatClasses("mythic-chat-slash-empty mythic-text-secondary mythic-font-size-small")}>No matching slash commands</Box> : matchingSlashOptions.map(option => <MythicCluster className={chatClasses("mythic-chat-slash-option mythic-clickable mythic-inherit-color mythic-full-width")} component="button" gap="sm" justify="between" wrap={false} type="button" key={`${option.source}-${option.name}`} onClick={() => selectSlashOption(option)}>

                                <MythicStack gap="xs">
                                    <Typography className="mythic-monospace" variant="body2">/{option.name}</Typography>
                                    {option.source === "alias" && <Typography variant="caption" color="text.secondary" noWrap>/{option.name} -&gt; {option.actualCommand}</Typography>}
                                    {option.source === "model" && option.description && <Typography variant="caption" color="text.secondary" noWrap>{option.description}</Typography>}
                                </MythicStack>
                                <Chip size="small" label={option.source === "alias" ? "alias" : "model"} />
                            </MythicCluster>)}
                    </MythicStack>}
                <TextField autoFocus={autoFocus} fullWidth multiline minRows={2} maxRows={8} value={composer} disabled={composerDisabled} placeholder={composerDisabled ? disabledReason : "Message"} error={composerSlash.isSlash && !slashCommandIsKnown} helperText={composerSlash.isSlash && !slashCommandIsKnown ? "Unknown slash command" : ""} inputRef={inputRef} onChange={e => {
        setComposer(e.target.value);
        setHistoryIndex(null);
        historyDraftRef.current = "";
      }} onKeyDown={e => {
        if (e.nativeEvent?.isComposing) {
          return;
        }
        if (e.key === "ArrowUp" && composerCursorAllowsHistory(e, -1)) {
          e.preventDefault();
          navigateComposerHistory(-1);
          return;
        }
        if (e.key === "ArrowDown" && historyIndex !== null && composerCursorAllowsHistory(e, 1)) {
          e.preventDefault();
          navigateComposerHistory(1);
          return;
        }
        if (e.key === "Tab" && completeGenericAliasReference()) {
          e.preventDefault();
          return;
        }
        if (e.key === "Tab" && showSlashOptions && matchingSlashOptions.length > 0) {
          e.preventDefault();
          selectSlashOption(matchingSlashOptions[0]);
          return;
        }
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          submitMessage();
        }
      }} size="small" />

            </MythicStack>
            {canCreateSystemMessage && <MythicStyledTooltip title="System message">
                    <span>
                        <IconButton color="secondary" className={chatClasses("mythic-chat-system-button mythic-flex-fixed mythic-border-radius")} disabled={!selectedChannel || (selectedChannel.archived && !isMythicAdmin)} onClick={onOpenSystemMessage}>

                            <CampaignTwoToneIcon />
                        </IconButton>
                    </span>
                </MythicStyledTooltip>}
            <IconButton color="primary" className={chatClasses("mythic-chat-send-button")} disabled={sendDisabled} onClick={submitMessage}>

                <SendIcon />
            </IconButton>
        </Box>;
});
const ChatDelegationPane = ({
  delegation,
  messages,
  requestsByID,
  me,
  selectedChannel,
  slashOptions,
  genericAliasOptions,
  messageHistory,
  disabledReason,
  activeAIRequest,
  onClose,
  onSendMessage,
  onCancelRequest,
  onEdit,
  onDelete,
  onRetry,
  onRefreshSpecial,
  onReviewSpecial,
  onSubmitInputResponse,
  onViewToolOutput,
  refreshingSpecialMessageID,
  submittingInputResponseID,
  editingID,
  editText,
  setEditText,
  saveEdit,
  cancelEdit,
  hasOlderMessages,
  loadingOlderMessages,
  onLoadOlderMessages
}) => {
  const theme = useMythicTheme();
  const [visibleMessageCount, setVisibleMessageCount] = React.useState(CHAT_RENDER_BATCH_SIZE);
  const messagesContainerRef = React.useRef(null);
  const messagesEndRef = React.useRef(null);
  const scrollAnchorRef = React.useRef(null);
  const nearBottomRef = React.useRef(true);
  const messageStateRef = React.useRef({
    delegationID: null,
    ids: new Set(),
    lastUpdatedAt: null,
    lastLength: 0
  });
  const snapshot = delegation?.snapshot || {};
  const stateClass = getSubagentStateClass(snapshot);
  const visual = getSubagentVisual(delegation?.id, snapshot, theme);
  const toolCount = Number(snapshot.tool_count ?? snapshot.tools_done ?? snapshot.completed_tools);
  const toolTotal = Number(snapshot.tool_total ?? snapshot.tools_total ?? snapshot.total_tools);
  const hasProgress = !Number.isNaN(toolCount) && !Number.isNaN(toolTotal) && toolTotal > 0;
  const prompt = delegation?.prompt || snapshot.prompt || snapshot.title || "";
  React.useEffect(() => {
    setVisibleMessageCount(CHAT_RENDER_BATCH_SIZE);
    nearBottomRef.current = true;
  }, [delegation?.id]);
  React.useLayoutEffect(() => {
    const previous = messageStateRef.current;
    if (previous.delegationID === delegation?.id && !nearBottomRef.current) {
      const addedCount = messages.reduce((count, message) => count + (previous.ids.has(message.id) ? 0 : 1), 0);
      if (addedCount > 0) {
        setVisibleMessageCount(count => Math.min(messages.length, count + addedCount));
      }
    }
  }, [delegation?.id, messages]);
  const visibleMessages = React.useMemo(() => getProgressivelyVisibleRows(messages, visibleMessageCount, isPendingChatHumanInteraction), [messages, visibleMessageCount]);
  const hiddenMessageCount = messages.length - visibleMessages.length;
  const updateNearBottom = React.useCallback(() => {
    const container = messagesContainerRef.current;
    nearBottomRef.current = !container || container.scrollHeight - container.scrollTop - container.clientHeight < 80;
  }, []);
  const showOlderMessages = React.useCallback(() => {
    const container = messagesContainerRef.current;
    if (container) {
      scrollAnchorRef.current = {
        scrollHeight: container.scrollHeight,
        scrollTop: container.scrollTop
      };
    }
    nearBottomRef.current = false;
    if (hiddenMessageCount > 0) {
      setVisibleMessageCount(count => Math.min(messages.length, count + CHAT_RENDER_BATCH_SIZE));
      return;
    }
    onLoadOlderMessages().then(loaded => {
      if (!loaded) {
        scrollAnchorRef.current = null;
      }
    });
  }, [hiddenMessageCount, messages.length, onLoadOlderMessages]);
  React.useLayoutEffect(() => {
    const anchor = scrollAnchorRef.current;
    const container = messagesContainerRef.current;
    if (!anchor || !container) {
      return;
    }
    container.scrollTop = anchor.scrollTop + (container.scrollHeight - anchor.scrollHeight);
    scrollAnchorRef.current = null;
    updateNearBottom();
  }, [visibleMessages.length, updateNearBottom]);
  React.useEffect(() => {
    const previous = messageStateRef.current;
    const lastMessage = messages[messages.length - 1];
    const delegationChanged = previous.delegationID !== delegation?.id;
    const hasNewMessages = messages.some(message => !previous.ids.has(message.id));
    const lastMessageChanged = Boolean(lastMessage && (previous.lastUpdatedAt !== lastMessage.updated_at || previous.lastLength !== (lastMessage.message || "").length));
    messageStateRef.current = {
      delegationID: delegation?.id || null,
      ids: new Set(messages.map(message => message.id)),
      lastUpdatedAt: lastMessage?.updated_at || null,
      lastLength: (lastMessage?.message || "").length
    };
    if (lastMessage && (delegationChanged || ((hasNewMessages || lastMessageChanged) && nearBottomRef.current))) {
      messagesEndRef.current?.scrollIntoView({
        block: "end"
      });
      nearBottomRef.current = true;
    }
  }, [delegation?.id, messages]);
  if (!delegation) {
    return null;
  }
  return <Box sx={{
    borderLeft: "1px solid",
    borderColor: "divider",
    display: "flex",
    flex: "1 1 auto",
    height: "100%",
    flexDirection: "column",
    minHeight: 0,
    minWidth: 0,
    width: "100%"
  }}>

            <Box className={chatClasses("mythic-chat-conversation-header mythic-justify-between mythic-gap-sm mythic-flex mythic-align-center")} sx={{
      minHeight: 48
    }}>
                <Box sx={{
        alignItems: "center",
        display: "flex",
        gap: 1,
        minWidth: 0
      }}>
                    <ChatSubagentAvatar visual={visual} size={30} />
                    <Box sx={{
          display: "flex",
          flexDirection: "column",
          minWidth: 0
        }}>
                        <Box sx={{
            alignItems: "center",
            display: "flex",
            gap: 0.75,
            minWidth: 0
          }}>
                            <MythicStyledTooltip title={delegation.title || delegation.name || "Sub-agent"}>
                                <Typography className={chatClasses("mythic-chat-conversation-title")} variant="subtitle2" noWrap>
                                    {delegation.title || delegation.name || "Sub-agent"}
                                </Typography>
                            </MythicStyledTooltip>
                            <Chip size="small" className={chatClasses(`mythic-chat-special-status mythic-border-radius mythic-font-weight-extra-bold mythic-flex-fixed mythic-font-size-xs mythic-chat-special-status-${stateClass}`.trim())} label={getSubagentStatusText(snapshot)} variant="outlined" />

                            {hasProgress && <Chip size="small" className={chatClasses(`mythic-chat-special-status mythic-border-radius mythic-font-weight-extra-bold mythic-flex-fixed mythic-font-size-xs mythic-chat-special-status-${stateClass}`.trim())} label={`${toolCount}/${toolTotal} tools`} variant="outlined" />}
                        </Box>
                        <Typography className={chatClasses("mythic-chat-conversation-subtitle")} variant="caption" color="text.secondary" noWrap>
                            {delegation.name || delegation.id}
                        </Typography>
                    </Box>
                </Box>
                <MythicStyledTooltip title="Close sub-agent view">
                    <IconButton size="small" onClick={onClose}>
                        <KeyboardArrowRightIcon fontSize="small" />
                    </IconButton>
                </MythicStyledTooltip>
            </Box>
            {prompt && <Box className={chatClasses("mythic-chat-delegation-prompt mythic-divider-bottom mythic-stack mythic-surface-muted")}>
                    <Typography className={chatClasses("mythic-chat-delegation-prompt-label mythic-letter-spacing-reset mythic-uppercase mythic-text-secondary")} variant="caption">
                        Prompt
                    </Typography>
                    <Typography className={chatClasses("mythic-chat-delegation-prompt-text mythic-break-anywhere mythic-pre-wrap mythic-text-primary mythic-overflow-auto")} variant="body2">
                        {prompt}
                    </Typography>
                </Box>}
            <Box className={chatClasses("mythic-chat-messages mythic-gap-sm mythic-flex mythic-flex-column mythic-flex-fill mythic-min-height-0")} sx={{
      padding: "8px"
    }} ref={messagesContainerRef} onScroll={updateNearBottom}>
                {(hiddenMessageCount > 0 || hasOlderMessages) && <Box className={chatClasses("mythic-chat-show-older mythic-justify-center mythic-flex mythic-align-center mythic-flex-fixed")}>
                        <Button size="small" variant="text" onClick={showOlderMessages} disabled={loadingOlderMessages}>
                            {hiddenMessageCount > 0 ? `Show ${Math.min(CHAT_RENDER_BATCH_SIZE, hiddenMessageCount)} older messages (${hiddenMessageCount} hidden)` : loadingOlderMessages ? "Fetching previous messages..." : "Fetch previous messages"}
                        </Button>
                    </Box>}
                {messages.length === 0 ? <ChatEmptyState icon={<SmartToyTwoToneIcon fontSize="large" />} title="No sub-agent activity" detail="Delegated messages will appear here." /> : <>
                        {visibleMessages.map(message => <MessageBubble key={message.id} message={message} request={message.chat_request_id ? requestsByID[message.chat_request_id] : null} me={me} onEdit={onEdit} onDelete={onDelete} onRetry={onRetry} onRefreshSpecial={onRefreshSpecial} onReviewSpecial={onReviewSpecial} onSubmitInputResponse={onSubmitInputResponse} onOpenDelegation={null} onViewToolOutput={onViewToolOutput} refreshingSpecialMessageID={refreshingSpecialMessageID} submittingInputResponseID={submittingInputResponseID} editing={editingID === message.id} editText={editText} setEditText={setEditText} saveEdit={saveEdit} cancelEdit={cancelEdit} />)}
                    </>}
                <div ref={messagesEndRef} />
            </Box>
            <ChatComposer selectedChannel={selectedChannel} composerScope={`delegation:${delegation.id}`} slashOptions={slashOptions} genericAliasOptions={genericAliasOptions} messageHistory={messageHistory} disabledReason={disabledReason} activeAIRequest={activeAIRequest} canCreateSystemMessage={false} isMythicAdmin={false} onOpenSystemMessage={() => {}} onSendMessage={message => onSendMessage(message, delegation)} onCancelRequest={onCancelRequest} />

        </Box>;
};
export function ChatExperience({
  active = true,
  autoFocusComposer = false,
  channelId,
  headerActions,
  me,
  onChannelChange,
  presentation = "page"
}) {
  const apolloClient = useApolloClient();
  const meContext = React.useContext(MeContext);
  const currentMe = me || meContext;
  const {
    channels: directoryChannels,
    readState,
    updateReadState
  } = useChatDirectory();
  const pagePresentation = presentation === "page";
  const selectedChannelID = Number(channelId) || null;
  const [showArchived, setShowArchived] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createInitialChannel, setCreateInitialChannel] = React.useState(null);
  const [editChannelOpen, setEditChannelOpen] = React.useState(false);
  const [systemMessageOpen, setSystemMessageOpen] = React.useState(false);
  const [archiveTarget, setArchiveTarget] = React.useState(null);
  const [metadataClickTarget, setMetadataClickTarget] = React.useState(null);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchText, setSearchText] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [editingID, setEditingID] = React.useState(null);
  const [editText, setEditText] = React.useState("");
  const [reviewMessage, setReviewMessage] = React.useState(null);
  const [inputResponseTarget, setInputResponseTarget] = React.useState(null);
  const [inputResponseText, setInputResponseText] = React.useState("");
  const [selectedDelegationSeed, setSelectedDelegationSeed] = React.useState(null);
  const [toolOutputTarget, setToolOutputTarget] = React.useState(null);
  const [toolOutputState, setToolOutputState] = React.useState({
    loading: false,
    error: null,
    plaintext: ""
  });
  const [visibleMainMessageCount, setVisibleMainMessageCount] = React.useState(CHAT_RENDER_BATCH_SIZE);
  const [refreshingSpecialMessageID, setRefreshingSpecialMessageID] = React.useState(null);
  const [submittingInputResponseID, setSubmittingInputResponseID] = React.useState(null);
  const [chatSplitSizes, setChatSplitSizes] = React.useState(getStoredChatSplitSizes);
  const [channelSplitSizes, setChannelSplitSizes] = React.useState(getStoredChatChannelSplitSizes);
  const [delegationSplitSizes, setDelegationSplitSizes] = React.useState(getStoredChatDelegationSplitSizes);
  const messagesContainerRef = React.useRef(null);
  const messagesEndRef = React.useRef(null);
  const messagesNearBottomRef = React.useRef(true);
  const mainScrollAnchorRef = React.useRef(null);
  const mainMessageIDsRef = React.useRef({
    channelID: null,
    ids: new Set()
  });
  const toolOutputAbortRef = React.useRef(null);
  const messagesScrollStateRef = React.useRef({
    channelID: null,
    messageIDs: new Set(),
    lastMessageID: null,
    lastMessageUpdatedAt: null,
    lastMessageStatus: null,
    lastMessageLength: 0
  });
  const readStateRef = React.useRef({});
  const submittedReadStateRef = React.useRef({});
  const pendingReadStateRef = React.useRef({});
  const markReadTimersRef = React.useRef({});
  const streamStart = React.useRef(getSkewedNow().toISOString());
  const [allChatContainers, setAllChatContainers] = React.useState([]);
  const [operatorAliases, setOperatorAliases] = React.useState([]);
  const [messages, setMessages] = React.useState([]);
  const [requests, setRequests] = React.useState([]);
  const [hasOlderMessages, setHasOlderMessages] = React.useState(false);
  const [loadingOlderMessages, setLoadingOlderMessages] = React.useState(false);
  const oldestFetchedMessageIDRef = React.useRef(null);
  const messagePageGenerationRef = React.useRef(0);
  const loadingMessagePageRef = React.useRef(false);
  const selectedChannelIDRef = React.useRef(selectedChannelID);
  const selectedChannelStreamCursor = React.useMemo(() => ({
    channelID: selectedChannelID,
    now: getSkewedNow().toISOString()
  }), [selectedChannelID]);
  selectedChannelIDRef.current = selectedChannelID;
  readStateRef.current = readState;
  const selectChannel = React.useCallback(channelID => {
    const numericChannelID = Number(channelID) || null;
    onChannelChange?.(numericChannelID);
  }, [onChannelChange]);
  const {
    data: containerData
  } = useQuery(CHAT_CONTAINERS_QUERY, {
    skip: !active,
    fetchPolicy: "no-cache"
  });
  const {
    data: aliasData
  } = useQuery(CHAT_OPERATOR_ALIASES_QUERY, {
    skip: !active,
    fetchPolicy: "no-cache"
  });
  const {
    data: currentOperatorData
  } = useQuery(CHAT_CURRENT_OPERATOR_QUERY, {
    variables: {
      operator_id: currentMe?.user?.user_id || 0,
      operation_id: currentMe?.user?.current_operation_id || 0
    },
    skip: !active || !currentMe?.user?.user_id || !currentMe?.user?.current_operation_id,
    fetchPolicy: "no-cache",
    onError: error => console.log(error)
  });
  React.useEffect(() => {
    if (containerData?.consuming_container) {
      setAllChatContainers(prev => mergeRowsByID(prev, containerData.consuming_container, sortContainers));
    }
  }, [containerData]);
  React.useEffect(() => {
    if (aliasData?.operator_alias) {
      setOperatorAliases(aliasData.operator_alias);
    }
  }, [aliasData]);
  useSubscription(CHAT_CONTAINERS_STREAM_SUBSCRIPTION, {
    variables: {
      now: streamStart.current
    },
    skip: !active,
    fetchPolicy: "no-cache",
    onData: ({
      data
    }) => {
      const updates = data.data?.consuming_container_stream || [];
      if (updates.length > 0) {
        setAllChatContainers(prev => mergeRowsByID(prev, updates, sortContainers));
      }
    },
    onError: error => console.log(error)
  });
  const chatContainers = React.useMemo(() => {
    return allChatContainers.filter(container => !container.deleted).sort(sortContainers);
  }, [allChatContainers]);
  const containerByID = React.useMemo(() => {
    return chatContainers.reduce((prev, container) => {
      prev[container.id] = container;
      return prev;
    }, {});
  }, [chatContainers]);
  const channels = React.useMemo(() => {
    return directoryChannels.map(channel => ({
      ...channel,
      chat_container: containerByID[channel.chat_container_id] || channel.chat_container
    })).sort(sortChannels);
  }, [directoryChannels, containerByID]);
  const selectedDirectoryChannel = React.useMemo(() => {
    return channels.find(channel => channel.id === selectedChannelID) || null;
  }, [channels, selectedChannelID]);
  const {
    data: selectedChannelDetailData
  } = useQuery(CHAT_CHANNEL_DETAIL_QUERY, {
    variables: {
      channel_id: selectedChannelID || 0
    },
    skip: !active || !selectedChannelID,
    fetchPolicy: "no-cache"
  });
  const selectedChannel = React.useMemo(() => {
    if (!selectedDirectoryChannel) {
      return null;
    }
    const detail = selectedChannelDetailData?.chat_channel_by_pk;
    return detail?.id === selectedDirectoryChannel.id ? {
      ...selectedDirectoryChannel,
      ...detail
    } : selectedDirectoryChannel;
  }, [selectedDirectoryChannel, selectedChannelDetailData]);
  const generalChannel = React.useMemo(() => {
    return channels.find(channel => isGeneralChatChannel(channel)) || null;
  }, [channels]);
  const currentUser = React.useMemo(() => ({
    id: currentOperatorData?.operator_by_pk?.id || currentMe?.user?.user_id || 0,
    username: currentOperatorData?.operator_by_pk?.username || currentMe?.user?.username || "Current user"
  }), [currentOperatorData?.operator_by_pk?.id, currentOperatorData?.operator_by_pk?.username, currentMe?.user?.user_id, currentMe?.user?.username]);
  const currentOperatorViewMode = currentOperatorData?.operatoroperation?.[0]?.view_mode || currentMe?.user?.view_mode || "";
  const operationBot = currentOperatorData?.operation_bot?.[0] || null;
  const isMythicAdmin = Boolean(currentMe?.user?.admin || currentOperatorData?.operator_by_pk?.admin);
  const canCreateSystemMessage = isMythicAdmin || currentOperatorViewMode === "lead";
  const selectedChannelIsGeneral = isGeneralChatChannel(selectedChannel);
  const selectedChannelReadState = getChannelReadState(readState, selectedChannelID);
  const selectedChannelMuted = Boolean(selectedChannelReadState.muted);
  const updateChatSplitSizes = React.useCallback(sizes => {
    setChatSplitSizes(sizes);
    localStorage.setItem(CHAT_SPLIT_STORAGE_KEY, JSON.stringify(sizes));
  }, []);
  const updateChannelSplitSizes = React.useCallback(sizes => {
    setChannelSplitSizes(sizes);
    localStorage.setItem(CHAT_CHANNEL_SPLIT_STORAGE_KEY, JSON.stringify(sizes));
  }, []);
  const updateDelegationSplitSizes = React.useCallback(sizes => {
    setDelegationSplitSizes(sizes);
    localStorage.setItem(CHAT_DELEGATION_SPLIT_STORAGE_KEY, JSON.stringify(sizes));
  }, []);
  React.useEffect(() => {
    if (pagePresentation && channels.length > 0 && !selectedChannelID && !selectedChannel) {
      const defaultChannel = channels.find(channel => !channel.archived) || channels[0];
      selectChannel(defaultChannel.id);
    }
  }, [channels, pagePresentation, selectedChannel, selectedChannelID, selectChannel]);
  React.useEffect(() => {
    setMessages([]);
    setRequests([]);
    setSelectedDelegationSeed(null);
    setVisibleMainMessageCount(CHAT_RENDER_BATCH_SIZE);
    setHasOlderMessages(false);
    setLoadingOlderMessages(false);
    oldestFetchedMessageIDRef.current = null;
    loadingMessagePageRef.current = false;
    messagesNearBottomRef.current = true;
  }, [selectedChannelID]);
  const [fetchMessagePage] = useLazyQuery(CHAT_MESSAGES_QUERY, {
    fetchPolicy: "no-cache"
  });
  const {
    data: requestData
  } = useQuery(CHAT_REQUESTS_QUERY, {
    variables: {
      channel_id: selectedChannelID || 0,
      limit: CHAT_REQUEST_LIMIT
    },
    skip: !active || !selectedChannelID,
    fetchPolicy: "no-cache"
  });
  React.useEffect(() => {
    const channelID = selectedChannelID;
    const generation = messagePageGenerationRef.current + 1;
    messagePageGenerationRef.current = generation;
    if (!active || !channelID) {
      return;
    }
    loadingMessagePageRef.current = true;
    setLoadingOlderMessages(true);
    fetchMessagePage({
      variables: getChatMessagePageVariables(channelID, CHAT_MESSAGE_PAGE_SIZE)
    }).then(({
      data
    }) => {
      if (messagePageGenerationRef.current !== generation || selectedChannelIDRef.current !== channelID) {
        return;
      }
      const rows = (data?.chat_message || []).filter(message => message.channel_id === channelID);
      const pageInfo = getChatMessagePageInfo(rows, CHAT_MESSAGE_PAGE_SIZE);
      oldestFetchedMessageIDRef.current = pageInfo.oldestID;
      setHasOlderMessages(pageInfo.hasMore);
      setMessages(prev => mergeRowsByID(prev, rows, sortByID, undefined, true));
    }).catch(error => {
      if (messagePageGenerationRef.current === generation) {
        console.log(error);
      }
    }).finally(() => {
      if (messagePageGenerationRef.current === generation) {
        loadingMessagePageRef.current = false;
        setLoadingOlderMessages(false);
      }
    });
    return () => {
      if (messagePageGenerationRef.current === generation) {
        messagePageGenerationRef.current += 1;
        loadingMessagePageRef.current = false;
      }
    };
  }, [active, fetchMessagePage, selectedChannelID]);
  const loadOlderMessages = React.useCallback(() => {
    const channelID = selectedChannelIDRef.current;
    const beforeID = oldestFetchedMessageIDRef.current;
    if (!active || !channelID || !beforeID || !hasOlderMessages || loadingMessagePageRef.current) {
      return Promise.resolve(false);
    }
    messagesNearBottomRef.current = false;
    const generation = messagePageGenerationRef.current;
    loadingMessagePageRef.current = true;
    setLoadingOlderMessages(true);
    return fetchMessagePage({
      variables: getChatMessagePageVariables(channelID, CHAT_MESSAGE_PAGE_SIZE, beforeID)
    }).then(({
      data
    }) => {
      if (messagePageGenerationRef.current !== generation || selectedChannelIDRef.current !== channelID) {
        return false;
      }
      const rows = (data?.chat_message || []).filter(message => message.channel_id === channelID);
      const pageInfo = getChatMessagePageInfo(rows, CHAT_MESSAGE_PAGE_SIZE, beforeID);
      oldestFetchedMessageIDRef.current = pageInfo.oldestID;
      setHasOlderMessages(pageInfo.hasMore);
      if (rows.length > 0) {
        setMessages(prev => mergeRowsByID(prev, rows, sortByID, undefined, true));
      }
      return rows.length > 0;
    }).catch(error => {
      console.log(error);
      return false;
    }).finally(() => {
      if (messagePageGenerationRef.current === generation) {
        loadingMessagePageRef.current = false;
        setLoadingOlderMessages(false);
      }
    });
  }, [active, fetchMessagePage, hasOlderMessages]);
  React.useEffect(() => {
    const currentChannelID = selectedChannelIDRef.current;
    if (currentChannelID && requestData?.chat_request) {
      const rows = requestData.chat_request.filter(request => request.channel_id === currentChannelID);
      setRequests(prev => mergeRowsByID(prev, rows, sortByID, CHAT_REQUEST_LIMIT, true));
    }
  }, [requestData, selectedChannelID]);
  useSubscription(CHAT_MESSAGES_STREAM_SUBSCRIPTION, {
    variables: {
      channel_id: selectedChannelStreamCursor.channelID || 0,
      now: selectedChannelStreamCursor.now
    },
    skip: !active || !selectedChannelStreamCursor.channelID,
    fetchPolicy: "no-cache",
    ignoreResults: true,
    onData: ({
      data
    }) => {
      const currentChannelID = selectedChannelIDRef.current;
      const updates = (data.data?.chat_message_stream || []).filter(message => message.channel_id === currentChannelID);
      if (updates.length > 0) {
        setMessages(prev => mergeRowsByID(prev, updates, sortByID));
      }
    },
    onError: error => console.log(error)
  });
  useSubscription(CHAT_REQUESTS_STREAM_SUBSCRIPTION, {
    variables: {
      channel_id: selectedChannelStreamCursor.channelID || 0,
      now: selectedChannelStreamCursor.now
    },
    skip: !active || !selectedChannelStreamCursor.channelID,
    fetchPolicy: "no-cache",
    ignoreResults: true,
    onData: ({
      data
    }) => {
      const currentChannelID = selectedChannelIDRef.current;
      const updates = (data.data?.chat_request_stream || []).filter(request => request.channel_id === currentChannelID);
      if (updates.length > 0) {
        setRequests(prev => mergeRowsByID(prev, updates, sortByID, CHAT_REQUEST_LIMIT));
      }
    },
    onError: error => console.log(error)
  });
  const requestsByID = React.useMemo(() => {
    return requests.reduce((prev, request) => {
      prev[request.id] = request;
      return prev;
    }, {});
  }, [requests]);
  const [createChannel] = useMutation(CREATE_CHANNEL, {
    onCompleted: data => {
      if (data.chatCreateChannel.status === "success") {
        selectChannel(data.chatCreateChannel.channel_id);
        setCreateOpen(false);
        setCreateInitialChannel(null);
      } else {
        snackActions.error(data.chatCreateChannel.error);
      }
    },
    onError: error => snackActions.error(error.message)
  });
  const [updateChannel] = useMutation(UPDATE_CHANNEL, {
    onCompleted: data => {
      if (data.chatUpdateChannel.status !== "success") {
        snackActions.error(data.chatUpdateChannel.error);
      }
    },
    onError: error => snackActions.error(error.message)
  });
  const [createMessage] = useMutation(CREATE_MESSAGE, {
    onCompleted: data => {
      if (data.chatCreateMessage.status !== "success") {
        snackActions.error(data.chatCreateMessage.error);
      }
    },
    onError: error => snackActions.error(error.message)
  });
  const [editMessage] = useMutation(EDIT_MESSAGE, {
    onCompleted: data => {
      if (data.chatEditMessage.status === "success") {
        setEditingID(null);
        setEditText("");
      } else {
        snackActions.error(data.chatEditMessage.error);
      }
    },
    onError: error => snackActions.error(error.message)
  });
  const [deleteMessage] = useMutation(DELETE_MESSAGE, {
    onCompleted: data => {
      if (data.chatDeleteMessage.status !== "success") {
        snackActions.error(data.chatDeleteMessage.error);
      }
    },
    onError: error => snackActions.error(error.message)
  });
  const [cancelRequest] = useMutation(CANCEL_REQUEST, {
    onCompleted: data => {
      if (data.chatCancelRequest.status !== "success") {
        snackActions.error(data.chatCancelRequest.error);
      }
    },
    onError: error => snackActions.error(error.message)
  });
  const [retryRequest] = useMutation(RETRY_REQUEST, {
    onCompleted: data => {
      if (data.chatRetryRequest.status !== "success") {
        snackActions.error(data.chatRetryRequest.error);
      }
    },
    onError: error => snackActions.error(error.message)
  });
  const [markRead] = useMutation(MARK_READ);
  const queueMarkRead = React.useCallback((channelID, messageID) => {
    if (!channelID || !messageID) {
      return;
    }
    const currentReadID = getChannelReadState(readStateRef.current, channelID).lastReadMessageID || 0;
    const submittedReadID = submittedReadStateRef.current[channelID] || 0;
    const pendingReadID = pendingReadStateRef.current[channelID] || 0;
    if (messageID <= Math.max(currentReadID, submittedReadID, pendingReadID)) {
      return;
    }
    pendingReadStateRef.current[channelID] = messageID;
    if (markReadTimersRef.current[channelID]) {
      clearTimeout(markReadTimersRef.current[channelID]);
    }
    markReadTimersRef.current[channelID] = setTimeout(() => {
      const lastReadMessageID = pendingReadStateRef.current[channelID] || 0;
      delete pendingReadStateRef.current[channelID];
      delete markReadTimersRef.current[channelID];
      const latestKnownReadID = Math.max(getChannelReadState(readStateRef.current, channelID).lastReadMessageID || 0, submittedReadStateRef.current[channelID] || 0);
      if (lastReadMessageID <= latestKnownReadID) {
        return;
      }
      submittedReadStateRef.current[channelID] = lastReadMessageID;
      markRead({
        variables: {
          channel_id: channelID,
          last_read_message_id: lastReadMessageID
        }
      }).catch(() => {
        if ((submittedReadStateRef.current[channelID] || 0) <= lastReadMessageID) {
          submittedReadStateRef.current[channelID] = getChannelReadState(readStateRef.current, channelID).lastReadMessageID || 0;
        }
      });
    }, 750);
  }, [markRead]);
  React.useEffect(() => {
    Object.entries(readState).forEach(([channelID, channelReadState]) => {
      const lastReadMessageID = channelReadState?.lastReadMessageID || 0;
      submittedReadStateRef.current[channelID] = Math.max(submittedReadStateRef.current[channelID] || 0, lastReadMessageID);
      if ((pendingReadStateRef.current[channelID] || 0) <= lastReadMessageID) {
        delete pendingReadStateRef.current[channelID];
        if (markReadTimersRef.current[channelID]) {
          clearTimeout(markReadTimersRef.current[channelID]);
          delete markReadTimersRef.current[channelID];
        }
      }
    });
  }, [readState]);
  React.useEffect(() => {
    return () => {
      Object.values(markReadTimersRef.current).forEach(timer => clearTimeout(timer));
      markReadTimersRef.current = {};
    };
  }, []);
  const [refreshSpecialMessage] = useMutation(REFRESH_SPECIAL_MESSAGE, {
    onCompleted: data => {
      if (data.chatRefreshSpecialMessage.status !== "success") {
        snackActions.error(data.chatRefreshSpecialMessage.error);
      }
    },
    onError: error => snackActions.error(error.message)
  });
  const [submitInputResponse] = useMutation(INPUT_RESPONSE, {
    onCompleted: data => {
      setSubmittingInputResponseID(null);
      if (data.chatInputResponse.status === "success") {
        setInputResponseTarget(null);
        setInputResponseText("");
      }
      if (data.chatInputResponse.status !== "success") {
        snackActions.error(data.chatInputResponse.error);
      }
    },
    onError: error => {
      setSubmittingInputResponseID(null);
      snackActions.error(error.message);
    }
  });
  const submitInputResponseAction = React.useCallback((message, action, response = "", choiceID = "") => {
    if (!message?.id) {
      return;
    }
    setSubmittingInputResponseID(message.id);
    submitInputResponse({
      variables: {
        message_id: message.id,
        action,
        response,
        choice_id: choiceID
      }
    }).catch(() => {
      setSubmittingInputResponseID(null);
    });
  }, [submitInputResponse]);
  const handleInputResponseAction = React.useCallback((message, action, options = {}) => {
    if (action === "respond") {
      setInputResponseTarget(message);
      setInputResponseText("");
      return;
    }
    submitInputResponseAction(message, action, options.response || "", options.choice_id || "");
  }, [submitInputResponseAction]);
  const [runSearch, {
    data: searchData,
    loading: searchLoading
  }] = useLazyQuery(CHAT_SEARCH, {
    fetchPolicy: "no-cache",
    onCompleted: data => {
      if (data.chatSearch.status !== "success") {
        snackActions.error(data.chatSearch.error);
      }
    },
    onError: error => snackActions.error(error.message)
  });
  const closeToolOutput = React.useCallback(() => {
    toolOutputAbortRef.current?.abort();
    toolOutputAbortRef.current = null;
    setToolOutputTarget(null);
    setToolOutputState({
      loading: false,
      error: null,
      plaintext: ""
    });
  }, []);
  const openToolOutput = React.useCallback(message => {
    if (!message?.id) {
      return;
    }
    toolOutputAbortRef.current?.abort();
    const controller = new AbortController();
    toolOutputAbortRef.current = controller;
    setToolOutputTarget(message);
    setToolOutputState({
      loading: true,
      error: null,
      plaintext: ""
    });
    apolloClient.query({
      query: CHAT_TOOL_OUTPUT_QUERY,
      variables: {
        message_id: message.id
      },
      fetchPolicy: "no-cache",
      context: {
        fetchOptions: {
          signal: controller.signal
        }
      }
    }).then(({
      data
    }) => {
      if (controller.signal.aborted || toolOutputAbortRef.current !== controller) {
        return;
      }
      toolOutputAbortRef.current = null;
      setToolOutputState({
        loading: false,
        error: null,
        plaintext: data?.chat_message_by_pk?.tool_output || "No tool output stored for this message."
      });
    }).catch(error => {
      if (controller.signal.aborted || toolOutputAbortRef.current !== controller) {
        return;
      }
      toolOutputAbortRef.current = null;
      setToolOutputState({
        loading: false,
        error,
        plaintext: ""
      });
      snackActions.error(error.message);
    });
  }, [apolloClient]);
  React.useEffect(() => () => {
    toolOutputAbortRef.current?.abort();
    toolOutputAbortRef.current = null;
  }, []);
  const updateMessagesNearBottom = React.useCallback(() => {
    const messagesContainer = messagesContainerRef.current;
    if (!messagesContainer) {
      messagesNearBottomRef.current = true;
      return;
    }
    messagesNearBottomRef.current = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight < 80;
  }, []);
  React.useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    const lastMessageMatchesChannel = Boolean(lastMessage && lastMessage.channel_id === selectedChannelID);
    const previousScrollState = messagesScrollStateRef.current;
    const messageIDs = new Set(messages.map(message => message.id));
    const channelChanged = previousScrollState.channelID !== selectedChannelID;
    const hasNewMessages = messages.some(message => !previousScrollState.messageIDs.has(message.id));
    const lastMessageChanged = Boolean(lastMessage && previousScrollState.lastMessageID === lastMessage.id && (previousScrollState.lastMessageUpdatedAt !== lastMessage.updated_at || previousScrollState.lastMessageStatus !== lastMessage.status || previousScrollState.lastMessageLength !== (lastMessage.message || "").length));
    const shouldScrollToBottom = Boolean(lastMessageMatchesChannel && (channelChanged || ((hasNewMessages || lastMessageChanged) && messagesNearBottomRef.current)));
    messagesScrollStateRef.current = {
      channelID: selectedChannelID,
      messageIDs,
      lastMessageID: lastMessage?.id || null,
      lastMessageUpdatedAt: lastMessage?.updated_at || null,
      lastMessageStatus: lastMessage?.status || null,
      lastMessageLength: (lastMessage?.message || "").length
    };
    if (shouldScrollToBottom) {
      messagesEndRef.current?.scrollIntoView({
        block: "end"
      });
      messagesNearBottomRef.current = true;
    }
    if (selectedChannelID && lastMessageMatchesChannel) {
      queueMarkRead(selectedChannelID, lastMessage.id);
    }
  }, [messages, selectedChannelID, queueMarkRead]);
  const standardChannels = channels.filter(channel => channel.channel_type === "standard" && (showArchived || !channel.archived));
  const aiChannels = channels.filter(channel => channel.channel_type === "ai" && (showArchived || !channel.archived));
  const channelHasUnread = React.useCallback(channel => {
    const latestMessageID = channel.last_message_id || 0;
    if (latestMessageID === 0 || channel.id === selectedChannelID) {
      return false;
    }
    return (getChannelReadState(readState, channel.id).lastReadMessageID || 0) < latestMessageID;
  }, [readState, selectedChannelID]);
  const activeAIRequest = React.useMemo(() => {
    if (selectedChannel?.channel_type !== "ai") {
      return null;
    }
    return requests.find(request => request.channel_id === selectedChannel.id && ["pending", "streaming"].includes(request.status)) || null;
  }, [requests, selectedChannel]);
  const slashOptions = React.useMemo(() => getAIChatSlashOptions(selectedChannel, chatContainers, operatorAliases), [selectedChannel, chatContainers, operatorAliases]);
  const genericAliasOptions = React.useMemo(() => getAIChatGenericAliasOptions(selectedChannel, operatorAliases), [selectedChannel, operatorAliases]);
  const mainMessages = React.useMemo(() => messages.filter(shouldShowMessageInMainChat), [messages]);
  React.useLayoutEffect(() => {
    const previous = mainMessageIDsRef.current;
    const currentIDs = new Set(mainMessages.map(message => message.id));
    if (previous.channelID === selectedChannelID && !messagesNearBottomRef.current) {
      const addedCount = mainMessages.reduce((count, message) => count + (previous.ids.has(message.id) ? 0 : 1), 0);
      if (addedCount > 0) {
        setVisibleMainMessageCount(count => Math.min(mainMessages.length, count + addedCount));
      }
    }
    mainMessageIDsRef.current = {
      channelID: selectedChannelID,
      ids: currentIDs
    };
  }, [mainMessages, selectedChannelID]);
  const visibleMainMessages = React.useMemo(() => getProgressivelyVisibleRows(mainMessages, visibleMainMessageCount, isPendingChatHumanInteraction), [mainMessages, visibleMainMessageCount]);
  const hiddenMainMessageCount = mainMessages.length - visibleMainMessages.length;
  const showOlderMainMessages = React.useCallback(() => {
    const container = messagesContainerRef.current;
    if (container) {
      mainScrollAnchorRef.current = {
        scrollHeight: container.scrollHeight,
        scrollTop: container.scrollTop
      };
    }
    messagesNearBottomRef.current = false;
    if (hiddenMainMessageCount > 0) {
      setVisibleMainMessageCount(count => Math.min(mainMessages.length, count + CHAT_RENDER_BATCH_SIZE));
      return;
    }
    loadOlderMessages().then(loaded => {
      if (!loaded) {
        mainScrollAnchorRef.current = null;
      }
    });
  }, [hiddenMainMessageCount, loadOlderMessages, mainMessages.length]);
  React.useLayoutEffect(() => {
    const anchor = mainScrollAnchorRef.current;
    const container = messagesContainerRef.current;
    if (!anchor || !container) {
      return;
    }
    container.scrollTop = anchor.scrollTop + (container.scrollHeight - anchor.scrollHeight);
    mainScrollAnchorRef.current = null;
    updateMessagesNearBottom();
  }, [messages.length, visibleMainMessages.length, updateMessagesNearBottom]);
  const selectedDelegation = React.useMemo(() => {
    if (!selectedDelegationSeed?.id) {
      return null;
    }
    const summaryMessage = messages.find(message => getMessageDelegationID(message) === selectedDelegationSeed.id && Boolean(getSubagentSnapshot(message)));
    const snapshot = getSubagentSnapshot(summaryMessage) || {};
    return {
      ...selectedDelegationSeed,
      name: getMessageDelegationName(summaryMessage) || snapshot.name || selectedDelegationSeed.name,
      title: snapshot.title || selectedDelegationSeed.title,
      prompt: snapshot.prompt || selectedDelegationSeed.prompt || snapshot.title || "",
      snapshot: Object.keys(snapshot).length > 0 ? snapshot : selectedDelegationSeed.snapshot || {}
    };
  }, [messages, selectedDelegationSeed]);
  const delegationMessages = React.useMemo(() => {
    if (!selectedDelegation?.id) {
      return [];
    }
    return messages.filter(message => getMessageDelegationID(message) === selectedDelegation.id && !getSubagentSnapshot(message));
  }, [messages, selectedDelegation?.id]);
  const messageHistory = React.useMemo(() => {
    const seenMessages = new Set();
    const history = [];
    for (const message of [...messages].reverse()) {
      const messageText = (message.message || "").trim();
      if (message.author_type !== "operator" || message.operator_id !== currentMe?.user?.user_id || message.deleted || messageText === "") {
        continue;
      }
      if (seenMessages.has(messageText)) {
        continue;
      }
      seenMessages.add(messageText);
      history.push(messageText);
    }
    return history;
  }, [messages, currentMe?.user?.user_id]);
  const delegationMessageHistory = React.useMemo(() => {
    const seenMessages = new Set();
    const history = [];
    for (const message of [...delegationMessages].reverse()) {
      const messageText = (message.message || "").trim();
      if (message.author_type !== "operator" || message.operator_id !== currentMe?.user?.user_id || message.deleted || messageText === "") {
        continue;
      }
      if (seenMessages.has(messageText)) {
        continue;
      }
      seenMessages.add(messageText);
      history.push(messageText);
    }
    return history;
  }, [delegationMessages, currentMe?.user?.user_id]);
  const submitMessage = React.useCallback((messageText, delegation = null) => {
    const message = messageText.trim();
    if (!message || !selectedChannel) {
      return false;
    }
    createMessage({
      variables: {
        channel_id: selectedChannel.id,
        message,
        delegation_id: delegation?.id || null,
        delegation_name: delegation?.name || null
      }
    });
    return true;
  }, [createMessage, selectedChannel]);
  const submitSystemMessage = ({
    message,
    all_operations
  }) => {
    if (!selectedChannel) {
      return Promise.resolve({
        data: {
          chatCreateMessage: {
            status: "error",
            error: "No channel selected"
          }
        }
      });
    }
    return createMessage({
      variables: {
        channel_id: selectedChannel.id,
        message,
        system_message: true,
        all_operations
      }
    }).then(result => {
      if (result.data?.chatCreateMessage?.status === "success") {
        snackActions.success("System message sent");
        if (all_operations && generalChannel) {
          selectChannel(generalChannel.id);
        }
      }
      return result;
    });
  };
  const disabledReason = React.useMemo(() => {
    if (!selectedChannel) {
      return "No channel selected";
    }
    if (selectedChannel.archived) {
      return "Archived";
    }
    if (selectedChannel.channel_type === "ai" && selectedChannel.locked && selectedChannel.locked_by !== currentMe?.user?.user_id) {
      return `Locked by ${selectedChannel.locked_operator?.username || "another operator"}`;
    }
    if (activeAIRequest) {
      return "AI response in progress";
    }
    if (selectedChannel.channel_type === "ai" && selectedChannel.chat_container && !selectedChannel.chat_container.container_running) {
      return "AI container offline";
    }
    return "";
  }, [selectedChannel, currentMe, activeAIRequest]);
  const handleMetadataChipClick = React.useCallback(chip => {
    if (!chip?.click) {
      return;
    }
    if (disabledReason) {
      snackActions.error(disabledReason);
      return;
    }
    setMetadataClickTarget(chip);
  }, [disabledReason]);
  const confirmMetadataChipClick = React.useCallback(() => {
    if (!metadataClickTarget?.click) {
      return;
    }
    submitMessage(metadataClickTarget.click);
    setMetadataClickTarget(null);
  }, [metadataClickTarget, submitMessage]);
  const onCreateChannel = variables => createChannel({
    variables
  });
  const openSystemMessageDialog = React.useCallback(() => setSystemMessageOpen(true), []);
  const toggleArchive = () => {
    if (!selectedChannel || isGeneralChatChannel(selectedChannel)) {
      return;
    }
    if (selectedChannel.archived) {
      updateChannel({
        variables: {
          channel_id: selectedChannel.id,
          archived: false
        }
      });
    } else {
      setArchiveTarget(selectedChannel);
    }
  };
  const confirmArchiveChannel = () => {
    if (archiveTarget) {
      updateChannel({
        variables: {
          channel_id: archiveTarget.id,
          archived: true
        }
      });
    }
  };
  const toggleLock = () => {
    if (selectedChannel?.channel_type === "ai") {
      updateChannel({
        variables: {
          channel_id: selectedChannel.id,
          locked: !selectedChannel.locked
        }
      });
    }
  };
  const toggleMute = React.useCallback(channel => {
    if (!channel?.id) {
      return;
    }
    const previousReadState = getChannelReadState(readStateRef.current, channel.id);
    const nextMuted = !previousReadState.muted;
    updateReadState(channel.id, {
      muted: nextMuted
    });
    updateChannel({
      variables: {
        channel_id: channel.id,
        muted: nextMuted
      }
    }).then(({
      data
    }) => {
      if (data?.chatUpdateChannel?.status !== "success") {
        updateReadState(channel.id, {
          muted: previousReadState.muted
        });
      }
    }).catch(() => {
      updateReadState(channel.id, {
        muted: previousReadState.muted
      });
    });
  }, [updateChannel, updateReadState]);
  const saveChannelDetails = variables => {
    updateChannel({
      variables
    }).then(({
      data
    }) => {
      if (data?.chatUpdateChannel?.status === "success") {
        setEditChannelOpen(false);
      }
    }).catch(() => {});
  };
  const openNewChannelDialog = () => {
    setCreateInitialChannel(null);
    setCreateOpen(true);
  };
  const openCloneChannelDialog = () => {
    if (selectedChannel?.channel_type === "ai") {
      setCreateInitialChannel(selectedChannel);
      setCreateOpen(true);
    }
  };
  const beginEdit = message => {
    setEditingID(message.id);
    setEditText(message.message);
  };
  const saveEdit = () => {
    if (editingID && editText.trim()) {
      editMessage({
        variables: {
          message_id: editingID,
          message: editText
        }
      });
    }
  };
  const runChatSearch = () => {
    const trimmedSearchText = searchText.trim();
    if (trimmedSearchText) {
      setSearchQuery(trimmedSearchText);
      runSearch({
        variables: {
          query: trimmedSearchText,
          limit: 50
        }
      });
    }
  };
  const selectSearchResult = result => {
    selectChannel(result.channel_id);
    setSearchOpen(false);
  };
  const refreshChatSpecialMessage = React.useCallback(message => {
    if (!message?.id) {
      return Promise.resolve();
    }
    setRefreshingSpecialMessageID(message.id);
    return refreshSpecialMessage({
      variables: {
        message_id: message.id
      }
    }).finally(() => setRefreshingSpecialMessageID(null));
  }, [refreshSpecialMessage]);
  const reviewChatSpecialMessage = message => {
    setReviewMessage(message);
  };
  const openDelegation = React.useCallback(message => {
    const delegationID = getMessageDelegationID(message);
    if (!delegationID) {
      return;
    }
    const snapshot = getSubagentSnapshot(message) || {};
    setSelectedDelegationSeed({
      id: delegationID,
      name: getMessageDelegationName(message) || snapshot.name || "Sub-agent",
      title: snapshot.title || getMessageDelegationName(message) || "Sub-agent",
      prompt: snapshot.prompt || snapshot.title || message.message || "",
      snapshot
    });
  }, []);
  const reviewSnapshot = getEventingInteractionSnapshot(reviewMessage);
  const metaChips = <>
            <MythicPageHeaderChip label={`${channels.filter(channel => !channel.archived).length} active`} />
            <MythicPageHeaderChip label={`${aiChannels.length} AI`} />
        </>;
  const selectedConfigChips = getChannelConfigChips(selectedChannel, chatContainers);
  const ChatLayout = pagePresentation ? Split : Box;
  const chatLayoutProps = pagePresentation ? {
    direction: "horizontal",
    sizes: chatSplitSizes,
    minSize: [0, 0],
    onDragEnd: updateChatSplitSizes
  } : {};
  return <MythicPageBody data-mythic-component="chat-channel-view" data-presentation={presentation}>
            {pagePresentation && <MythicPageHeader title="Operation Chat" subtitle="Channels and AI sessions for the current operation." icon={<ForumTwoToneIcon />} meta={metaChips} actions={<MythicActionGroup>
                        <MythicActionButton tone="info" size="small" startIcon={<SearchIcon />} onClick={() => setSearchOpen(true)}>Search</MythicActionButton>
                        <MythicActionButton tone="success" size="small" variant="contained" startIcon={<AddIcon />} onClick={openNewChannelDialog}>New channel</MythicActionButton>
                    </MythicActionGroup>} />}
            <ChatLayout {...chatLayoutProps} className={chatClasses(`mythic-chat-layout mythic-flex mythic-full-width mythic-flex-fill mythic-min-height-0`)}>

                {pagePresentation && <MythicPanel className={chatClasses("mythic-chat-sidebar")} density="flush" fill layout="stack" overflow="hidden" radius="lg" tone="raised">
                    <MythicToolbar className={chatClasses("mythic-chat-sidebar-toolbar")}>
                        <MythicCluster className={chatClasses("mythic-chat-sidebar-heading")} gap="sm" wrap={false}>
                            <Typography variant="subtitle2">Channels</Typography>
                            <Chip className={chatClasses("mythic-chat-sidebar-count")} size="small" label={`${channels.length} total`} />
                        </MythicCluster>
                        <FormControlLabel sx={{
            m: 0
          }} control={<Switch size="small" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} />} label={<Typography variant="caption">Show archived</Typography>} />

                    </MythicToolbar>
                    <Split className={chatClasses("mythic-chat-channel-split mythic-flex mythic-flex-column mythic-flex-fill mythic-overflow-hidden mythic-min-height-0")} direction="vertical" sizes={channelSplitSizes} minSize={[90, 90]} gutterSize={5} onDragEnd={updateChannelSplitSizes}>

                        <MythicPanel className={chatClasses("mythic-chat-channel-section")} density="flush" gap="xs" layout="stack" tone="muted">
                            <Typography variant="caption" color="text.secondary">Standard</Typography>
                            {standardChannels.length === 0 ? <Box className={chatClasses("mythic-chat-empty-list mythic-font-size-small mythic-border-radius")}>No standard channels</Box> : standardChannels.map(channel => <ChannelButton key={channel.id} channel={channel} selected={channel.id === selectedChannelID} unread={channelHasUnread(channel)} muted={getChannelReadState(readState, channel.id).muted} chatContainers={chatContainers} onSelect={selectChannel} onToggleMute={toggleMute} />)}
                        </MythicPanel>
                        <MythicPanel className={chatClasses("mythic-chat-channel-section")} density="flush" gap="xs" layout="stack" tone="muted">
                            <Typography variant="caption" color="text.secondary">AI</Typography>
                            {aiChannels.length === 0 ? <Box className={chatClasses("mythic-chat-empty-list mythic-font-size-small mythic-border-radius")}>No AI chats</Box> : aiChannels.map(channel => <ChannelButton key={channel.id} channel={channel} selected={channel.id === selectedChannelID} unread={channelHasUnread(channel)} muted={getChannelReadState(readState, channel.id).muted} chatContainers={chatContainers} onSelect={selectChannel} onToggleMute={toggleMute} />)}
                        </MythicPanel>
                    </Split>
                </MythicPanel>}
                <MythicPanel className={chatClasses("mythic-chat-main")} density="flush" fill layout="stack" overflow="hidden" radius="lg" tone="surface">
                    <MythicToolbar className={chatClasses("mythic-chat-conversation-header")}>
                        <MythicCluster gap="sm" wrap={false}>
                            <MythicCluster className={chatClasses("mythic-chat-conversation-icon")} data-channel-type={selectedChannel?.channel_type || "standard"} inline justify="center" wrap={false}>

                                {selectedChannel?.channel_type === "ai" ? <MythicChatContainerIcon className={chatClasses("mythic-chat-conversation-icon")} altText={selectedChannel?.chat_container?.name || channelDisplayName(selectedChannel)} containerName={selectedChannel?.chat_container?.name} iconProps={{
                fontSize: "small"
              }} /> : <ForumTwoToneIcon fontSize="small" />}
                            </MythicCluster>
                            <MythicStack gap="xs">
                                <MythicTruncatedText className={chatClasses("mythic-chat-conversation-title")} variant="subtitle1">{selectedChannel ? channelDisplayName(selectedChannel) : "Chat"}</MythicTruncatedText>
                                <MythicTruncatedText className={chatClasses("mythic-chat-conversation-subtitle")} variant="caption" color="text.secondary">
                                    {selectedChannel?.description || selectedChannel?.chat_container?.name || ""}
                                </MythicTruncatedText>
                                {selectedConfigChips.length > 0 && <ChatDisplayChipRow chips={selectedConfigChips} className={chatClasses("mythic-chat-header-config-chips mythic-flex")} />}
                            </MythicStack>
                        </MythicCluster>
                        <MythicActionGroup className={chatClasses("mythic-chat-header-actions")}>
                            {selectedChannel && <MythicStyledTooltip title={selectedChannelMuted ? "Unsilence notifications" : "Silence notifications"}>
                                    <IconButton size="small" onClick={() => toggleMute(selectedChannel)}>
                                        {selectedChannelMuted ? <NotificationsOffIcon fontSize="small" /> : <NotificationsActiveIcon fontSize="small" />}
                                    </IconButton>
                                </MythicStyledTooltip>}
                            {pagePresentation && selectedChannel && <MythicStyledTooltip title="Edit channel">
                                    <IconButton size="small" onClick={() => setEditChannelOpen(true)}>
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                </MythicStyledTooltip>}
                            {pagePresentation && selectedChannel?.channel_type === "ai" && <MythicStyledTooltip title="Clone AI chat">
                                    <IconButton size="small" onClick={openCloneChannelDialog}>
                                        <ContentCopyIcon fontSize="small" />
                                    </IconButton>
                                </MythicStyledTooltip>}
                            {pagePresentation && selectedChannel?.channel_type === "ai" && <MythicStyledTooltip title={selectedChannel.locked ? "Unlock AI chat" : "Lock AI chat"}>
                                    <IconButton size="small" onClick={toggleLock}>
                                        {selectedChannel.locked ? <LockIcon fontSize="small" /> : <LockOpenIcon fontSize="small" />}
                                    </IconButton>
                                </MythicStyledTooltip>}
                            {pagePresentation && selectedChannel && <MythicStyledTooltip title={selectedChannelIsGeneral ? "General channel cannot be archived" : selectedChannel.archived ? "Unarchive channel" : "Archive channel"}>
                                    <span>
                                        <IconButton size="small" onClick={toggleArchive} disabled={selectedChannelIsGeneral}>
                                            {selectedChannel.archived ? <UnarchiveIcon fontSize="small" /> : <ArchiveIcon fontSize="small" />}
                                        </IconButton>
                                    </span>
                                </MythicStyledTooltip>}
                            {headerActions}
                        </MythicActionGroup>
                    </MythicToolbar>
                    <Split className={chatClasses("mythic-chat-layout mythic-chat-delegation-split mythic-flex mythic-full-width mythic-flex-fill mythic-min-height-0")} direction="horizontal" sizes={selectedDelegation ? delegationSplitSizes : [100, 0]} minSize={selectedDelegation ? [0, 320] : [0, 0]} gutterSize={selectedDelegation ? 5 : 0} onDragEnd={selectedDelegation ? updateDelegationSplitSizes : undefined}>

                        <MythicStack className="mythic-overflow-hidden" fill gap="xs">
                            <ChatChannelMetadataBar channel={selectedChannel} onChipClick={handleMetadataChipClick} />
                            <MythicStack className={chatClasses("mythic-chat-messages")} fill gap="sm" ref={messagesContainerRef} onScroll={updateMessagesNearBottom}>
                                {selectedChannel && (hiddenMainMessageCount > 0 || hasOlderMessages) && <MythicCluster className={chatClasses("mythic-chat-show-older")} justify="center" wrap={false}>
                                        <Button size="small" variant="text" onClick={showOlderMainMessages} disabled={loadingOlderMessages}>
                                            {hiddenMainMessageCount > 0 ? `Show ${Math.min(CHAT_RENDER_BATCH_SIZE, hiddenMainMessageCount)} older messages (${hiddenMainMessageCount} hidden)` : loadingOlderMessages ? "Fetching previous messages..." : "Fetch previous messages"}
                                        </Button>
                                    </MythicCluster>}
                                {!selectedChannel ? <ChatEmptyState icon={<ForumTwoToneIcon fontSize="large" />} title="No channel selected" /> : messages.length === 0 ? <ChatEmptyState icon={selectedChannel.channel_type === "ai" ? <SmartToyTwoToneIcon fontSize="large" /> : <ForumTwoToneIcon fontSize="large" />} title="No messages yet" detail={selectedChannel.archived ? "This channel is archived." : "No message history for this channel."} /> : mainMessages.length === 0 ? <ChatEmptyState icon={selectedChannel.channel_type === "ai" ? <SmartToyTwoToneIcon fontSize="large" /> : <ForumTwoToneIcon fontSize="large" />} title="No main-channel messages" detail="Delegated activity is available from sub-agent cards." /> : <>
                                        {visibleMainMessages.map(message => <MessageBubble key={message.id} message={message} request={message.chat_request_id ? requestsByID[message.chat_request_id] : null} me={currentMe} onEdit={beginEdit} onDelete={messageID => deleteMessage({
                  variables: {
                    message_id: messageID
                  }
                })} onRetry={requestID => retryRequest({
                  variables: {
                    request_id: requestID
                  }
                })} onRefreshSpecial={refreshChatSpecialMessage} onReviewSpecial={reviewChatSpecialMessage} onSubmitInputResponse={handleInputResponseAction} onOpenDelegation={openDelegation} onViewToolOutput={openToolOutput} refreshingSpecialMessageID={refreshingSpecialMessageID} submittingInputResponseID={submittingInputResponseID} editing={editingID === message.id} editText={editText} setEditText={setEditText} saveEdit={saveEdit} cancelEdit={() => {
                  setEditingID(null);
                  setEditText("");
                }} />)}
                                    </>}
                                <div ref={messagesEndRef} />
                            </MythicStack>
                            <ChatComposer autoFocus={autoFocusComposer} selectedChannel={selectedChannel} slashOptions={slashOptions} genericAliasOptions={genericAliasOptions} messageHistory={messageHistory} disabledReason={disabledReason} activeAIRequest={activeAIRequest} canCreateSystemMessage={canCreateSystemMessage} isMythicAdmin={isMythicAdmin} onOpenSystemMessage={openSystemMessageDialog} onSendMessage={submitMessage} onCancelRequest={requestID => cancelRequest({
              variables: {
                request_id: requestID
              }
            })} />

                        </MythicStack>
                        <Box sx={{
            display: selectedDelegation ? "flex" : "none",
            height: "100%",
            minHeight: 0,
            minWidth: 0,
            overflow: "hidden"
          }}>
                            {selectedDelegation && <ChatDelegationPane delegation={selectedDelegation} messages={delegationMessages} requestsByID={requestsByID} me={currentMe} selectedChannel={selectedChannel} slashOptions={slashOptions} genericAliasOptions={genericAliasOptions} messageHistory={delegationMessageHistory} disabledReason={disabledReason} activeAIRequest={activeAIRequest} onClose={() => setSelectedDelegationSeed(null)} onSendMessage={submitMessage} onCancelRequest={requestID => cancelRequest({
              variables: {
                request_id: requestID
              }
            })} onEdit={beginEdit} onDelete={messageID => deleteMessage({
              variables: {
                message_id: messageID
              }
            })} onRetry={requestID => retryRequest({
              variables: {
                request_id: requestID
              }
            })} onRefreshSpecial={refreshChatSpecialMessage} onReviewSpecial={reviewChatSpecialMessage} onSubmitInputResponse={handleInputResponseAction} onViewToolOutput={openToolOutput} refreshingSpecialMessageID={refreshingSpecialMessageID} submittingInputResponseID={submittingInputResponseID} editingID={editingID} editText={editText} setEditText={setEditText} saveEdit={saveEdit} cancelEdit={() => {
              setEditingID(null);
              setEditText("");
            }} hasOlderMessages={hasOlderMessages} loadingOlderMessages={loadingOlderMessages} onLoadOlderMessages={loadOlderMessages} />}
                        </Box>
                    </Split>
                </MythicPanel>
            </ChatLayout>
            {pagePresentation && createOpen && <ChatCreateDialog open={createOpen} onClose={() => {
      setCreateOpen(false);
      setCreateInitialChannel(null);
    }} onCreate={onCreateChannel} chatContainers={chatContainers} currentUser={currentUser} operationBot={operationBot} initialChannel={createInitialChannel} />}
            {pagePresentation && editChannelOpen && <ChatEditChannelDialog open={editChannelOpen} channel={selectedChannel} chatContainers={chatContainers} onClose={() => setEditChannelOpen(false)} onSave={saveChannelDetails} currentUser={currentUser} operationBot={operationBot} />}
            {systemMessageOpen && <ChatSystemMessageDialog open={systemMessageOpen} selectedChannel={selectedChannel} isMythicAdmin={isMythicAdmin} onClose={() => setSystemMessageOpen(false)} onSend={submitSystemMessage} />}
            {pagePresentation && archiveTarget && <MythicConfirmDialog open={Boolean(archiveTarget)} title="Archive Channel?" dialogText={`Archive ${channelDisplayName(archiveTarget)}? This hides the channel from the default chat list until archived channels are shown.`} acceptText="Archive" acceptColor="warning" onClose={() => setArchiveTarget(null)} onSubmit={confirmArchiveChannel} />}
            {metadataClickTarget && <MythicConfirmDialog open={Boolean(metadataClickTarget)} title="Run Chat Action?" dialogText={metadataClickTarget.clickConfirmationText || `Run ${metadataClickTarget.click}?`} acceptText="Run" acceptColor="info" onClose={() => setMetadataClickTarget(null)} onSubmit={confirmMetadataChipClick} />}
            {pagePresentation && searchOpen && <ChatSearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} onSearch={runChatSearch} searchText={searchText} setSearchText={setSearchText} searchQuery={searchQuery} results={searchData?.chatSearch?.results || []} loading={searchLoading} hasSearched={searchQuery !== ""} onSelectResult={selectSearchResult} viewUTCTime={currentMe?.user?.view_utc_time} />}
            {inputResponseTarget && <Dialog open={Boolean(inputResponseTarget)} onClose={() => {
      setInputResponseTarget(null);
      setInputResponseText("");
    }} maxWidth="sm" fullWidth>
                    <DialogTitle>Respond To Input Request</DialogTitle>
                    <DialogContent className={chatClasses("mythic-chat-dialog-content")} sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1.75,
        pt: "20px !important",
        px: 3
      }}>
                        <TextField autoFocus fullWidth multiline minRows={4} size="small" label="Response" value={inputResponseText} onChange={e => setInputResponseText(e.target.value)} />

                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => {
          setInputResponseTarget(null);
          setInputResponseText("");
        }}>Cancel</Button>
                        <Button variant="contained" disabled={inputResponseText.trim() === "" || submittingInputResponseID === inputResponseTarget?.id} onClick={() => submitInputResponseAction(inputResponseTarget, "respond", inputResponseText.trim())}>

                            Send
                        </Button>
                    </DialogActions>
                </Dialog>}
            {toolOutputTarget && <Dialog open={Boolean(toolOutputTarget)} onClose={closeToolOutput} maxWidth="lg" fullWidth PaperProps={{
      sx: {
        height: "82vh",
        maxHeight: "82vh"
      }
    }}>

                <DialogTitle sx={{
        px: 1.5,
        py: 1
      }}>Tool Output</DialogTitle>
                    <DialogContent className={chatClasses("mythic-chat-dialog-content")} sx={{
        display: "flex",
        flex: "1 1 auto",
        flexDirection: "column",
        minHeight: 0,
        overflow: "hidden",
        p: "0 !important"
      }}>

                        {toolOutputState.loading ? <Typography variant="body2" color="text.secondary" sx={{
          p: 2
        }}>Loading output...</Typography> : toolOutputState.error ? <Typography variant="body2" color="error" sx={{
          p: 2
        }}>{toolOutputState.error.message}</Typography> : <Box sx={{
          display: "flex",
          flex: "1 1 auto",
          minHeight: 0,
          minWidth: 0
        }}>
                                <React.Suspense fallback={<Typography sx={{
            p: 2
          }} color="text.secondary">Loading output viewer...</Typography>}>
                                    <LazyResponseDisplayPlaintext plaintext={toolOutputState.plaintext} initial_render_mode="plaintext" initial_show_options={true} toolbarTitle="Tool output" autoFormat={false} expand={true} readOnly={true} enableCredentialCreation={false} />

                                </React.Suspense>
                            </Box>}
                    </DialogContent>
                <DialogActions sx={{
        px: 1.5,
        py: 1
      }}>
                        <Button onClick={closeToolOutput}>Close</Button>
                    </DialogActions>
                </Dialog>}
            {reviewMessage && reviewSnapshot && <MythicDialog fullWidth={true} maxWidth="md" open={Boolean(reviewMessage)} onClose={() => {
      refreshChatSpecialMessage(reviewMessage).catch(() => {});
      setReviewMessage(null);
    }} innerDialog={<React.Suspense fallback={<Typography sx={{
      p: 3
    }} color="text.secondary">Loading event review...</Typography>}>
                            <LazyEventStepUserInteractionDialog onClose={() => {
        refreshChatSpecialMessage(reviewMessage).catch(() => {});
        setReviewMessage(null);
      }} onResolved={() => refreshChatSpecialMessage(reviewMessage)} selectedEventGroupInstance={reviewSnapshot.eventgroupinstance_id} selectedStep={{
        id: reviewSnapshot.eventstepinstance_id
      }} />

                        </React.Suspense>} />}
        </MythicPageBody>;
}
