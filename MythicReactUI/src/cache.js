import { makeVar } from '@apollo/client';
import {restartWebsockets} from "./index";
import {snackActions} from "./components/utilities/Snackbar";
import {appearanceDefaults} from "./themes/appearance";

export const meState = makeVar({loggedIn:false, user: null, access_token: null, refresh_token: null});
export const alertCount = makeVar(0);
export const taskTimestampDisplayFieldOptions = [
    {
        name: "timestamp",
        display: "Latest Timestamp for anything task related"
    },
    {
        name: "status_timestamp_preprocessing",
        display: "When Operator Submitted Task"
    },
    {
        name: "status_timestamp_processing",
        display: "When Agent Picked up Task",
    }
]
export const taskingDisplayFieldOptions = [
    {
        name: "timestamp",
        display: "Timestamp",
        description: "Show the configured task timestamp."
    },
    {
        name: "task",
        display: "Task number",
        description: "Show the T-number link for each task."
    },
    {
        name: "username",
        display: "Username",
        description: "Show the operator that issued the task."
    },
    {
        name: "callback",
        display: "Callback number",
        description: "Show the C-number link for the task callback."
    },
    {
        name: "host",
        display: "Host",
        description: "Show the callback host."
    },
    {
        name: "ip",
        display: "IP address",
        description: "Show the callback primary IP."
    },
    {
        name: "groups",
        display: "Callback groups",
        description: "Show the callback's tree groups."
    },
    {
        name: "payload_type",
        display: "Payload type",
        description: "Show the task payload type."
    },
];
export const defaultTaskingDisplayFields = ["timestamp", "task", "username", "callback", "payload_type"];
export const normalizeTaskingDisplayFields = (fields) => {
    if(!Array.isArray(fields)){
        return [...defaultTaskingDisplayFields];
    }
    const validFieldNames = taskingDisplayFieldOptions.map((option) => option.name);
    return fields.reduce( (prev, fieldName) => {
        if(validFieldNames.includes(fieldName) && !prev.includes(fieldName)){
            return [...prev, fieldName];
        }
        return prev;
    }, []);
}
export const taskingContextFieldsOptions = ["impersonation_context", "cwd", "user", "host", "ip", "pid", "process_short_name", "extra_info", "architecture"].sort();
export const defaultShortcuts = [
    "ActiveCallbacks", "Payloads", "PayloadTypesAndC2",
    "Operations", "SearchFiles", "SearchProxies",
    "CreatePayload", "Eventing", "Chat",
].sort();
export const operatorSettingDefaults =  {
    appearance: appearanceDefaults,
    navBarOpen: false,
    showMedia: true,
    showOPSECBypassUsername: false,
    taskingDisplayFields: defaultTaskingDisplayFields,
    useDisplayParamsForCLIHistory: true,
    interactType: "interactSplit",
    taskTimestampDisplayField: "timestamp",
    callbacks_table_columns: ["Interact", "Host", "Domain", "User", "Description", "Last Checkin", "Agent",  "IP", "PID"],
    callbacks_table_filters: {},
    autoTaskLsOnEmptyDirectories: false,
    hideBrowserTasking: false,
    hideTaskingContext: false,
    taskingContextFields: ["impersonation_context", "cwd"],
    "experiment-responseStreamLimit": 200,
    chatSelectedChannelID: 0,
    sideShortcuts: defaultShortcuts,
}

export const mePreferences = makeVar(operatorSettingDefaults);


export const successfulLogin = (data) => {
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    let now = new Date();
    let serverNow = new Date(data.user.current_utc_time);
    const difference = (serverNow.getTime() - now.getTime());
    let me = {...data.user};
    me.server_skew = difference;
    me.login_time = now;
    meState({
        loggedIn: true,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        user: {
            ...me
        }
    });
    localStorage.setItem("user", JSON.stringify(me));
    restartWebsockets();
}
export const successfulRefresh = (data) => {
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    let now = new Date();
    let serverNow = new Date(data.user.current_utc_time);
    const difference = (serverNow.getTime() - now.getTime()) ;
    let me = {...meState().user, ...(data.user || {})};
    me.server_skew = difference;
    me.login_time = now;
    meState({
        loggedIn: true,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        user: {
            ...me
        }
    });
    localStorage.setItem("user", JSON.stringify(me));
}
export const FailedRefresh = (restart_websockets) =>{
    console.log("failed refresh");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    // retrieve all cookies
    let Cookies = document.cookie.split(';');
    // set past expiry to all cookies
    for (let i = 0; i < Cookies.length; i++) {
        document.cookie = Cookies[i] + "=; expires="+ new Date(0).toUTCString();
    }
    meState({
        loggedIn: false,
        access_token: null,
        refresh_token: null,
        user: null
    });
    mePreferences(operatorSettingDefaults);
    snackActions.clearAll();
    if(restart_websockets){
        restartWebsockets();
    }

}
