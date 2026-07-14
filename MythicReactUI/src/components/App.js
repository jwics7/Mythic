import { LoggedInRoute } from './utilities/LoggedInRoute';
import React, {createContext} from 'react';
import {Button, Typography} from '@mui/material';
import { useReactiveVar } from '@apollo/client';
import {FailedRefresh, mePreferences, meState} from '../cache';
import { Tooltip } from 'react-tooltip';
import {useLazyQuery, gql } from '@apollo/client';
//background-color: #282c34;
import { Route, Routes } from 'react-router-dom';
import { useInterval } from './utilities/Time';
import { JWTTimeLeft, isJWTValid } from '../index';
import { RefreshTokenDialog } from './RefreshTokenDialog';
import { MythicDialog } from './MythicComponents/MythicDialogBase';
import { ToastContainer } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import {snackActions} from "./utilities/Snackbar";
import {TopAppBarVertical} from "./TopAppBarVertical";
import {MythicLoadingState} from "./MythicComponents/MythicStateDisplay";
import { library } from '@fortawesome/fontawesome-svg-core';
import {hasMythicConnectionError, mythicConnectionState} from "./utilities/MythicConnection";
import {MythicThemeProvider, useMythicColorMode} from "../themes/MythicThemeProvider";
import {ChatDirectoryProvider} from "./Chat/ChatDirectoryContext";
import styles from "./App.module.css";
import {MythicCluster} from "./MythicComponents/MythicLayout";

const lazyNamed = (importer, exportName) => React.lazy(() =>
    importer().then((module) => ({default: module[exportName]}))
);

const LoginForm = lazyNamed(() => import('./pages/Login/LoginForm'), 'LoginForm');
const InviteForm = lazyNamed(() => import('./pages/Login/InviteForm'), 'InviteForm');
const Settings = lazyNamed(() => import('./pages/Settings/Settings'), 'Settings');
const PayloadTypesC2Profiles = lazyNamed(() => import('./pages/PayloadTypesC2Profiles/PayloadTypesC2Profiles'), 'PayloadTypesC2Profiles');
const CreatePayload = lazyNamed(() => import('./pages/CreatePayload/CreatePayload'), 'CreatePayload');
const CreatePayloadWrapper = lazyNamed(() => import('./pages/CreateWrapper/CreatePayload'), 'CreatePayloadWrapper');
const EventFeed = lazyNamed(() => import('./pages/EventFeed/EventFeed'), 'EventFeed');
const Operations = lazyNamed(() => import('./pages/Operations/Operations'), 'Operations');
const BrowserScripts = lazyNamed(() => import('./pages/BrowserScripts/BrowserScripts'), 'BrowserScripts');
const Payloads = lazyNamed(() => import('./pages/Payloads/Payloads'), 'Payloads');
const ExpandedCallback = lazyNamed(() => import('./pages/ExpandedCallback/ExpandedCallback'), 'ExpandedCallback');
const Home = lazyNamed(() => import('./pages/Home/Home'), 'Home');
const Callbacks = lazyNamed(() => import('./pages/Callbacks/Callbacks'), 'Callbacks');
const Search = lazyNamed(() => import('./pages/Search/Search'), 'Search');
const SingleTaskView = lazyNamed(() => import('./pages/SingleTaskView/SingleTaskView'), 'SingleTaskView');
const Reporting = lazyNamed(() => import('./pages/Reporting/Reporting'), 'Reporting');
const MitreAttack = lazyNamed(() => import('./pages/MITRE_ATTACK/MitreAttack'), 'MitreAttack');
const Tags = lazyNamed(() => import('./pages/Tags/Tags'), 'Tags');
const Eventing = lazyNamed(() => import('./pages/Eventing/Eventing'), 'Eventing');
const Chat = lazyNamed(() => import('./Chat/ChatPage'), 'ChatPage');
const Jupyter = lazyNamed(() => import('./pages/Jupyter/Jupyter'), 'Jupyter');
const Hasura = lazyNamed(() => import('./pages/Hasura/Hasura'), 'Hasura');

let fontAwesomeCatalogPromise = null;
const loadFontAwesomeCatalog = () => {
    if(!fontAwesomeCatalogPromise){
        fontAwesomeCatalogPromise = import('@fortawesome/free-solid-svg-icons').then((icons) => {
            const iconList = Object.keys(icons)
                .filter((key) => key !== "fas" && key !== "prefix")
                .map((icon) => icons[icon]);
            library.add(...iconList);
        });
    }
    return fontAwesomeCatalogPromise;
};

export const MeContext = createContext({});
export const userSettingsQuery = gql`
query getUserSettings {
    getOperatorPreferences {
        status
        error
        preferences
    }
}
`;

const ThemeAwareToastContainer = () => {
    const {mode} = useMythicColorMode();
    return (
        <ToastContainer limit={2} autoClose={3000}
                        theme={mode}
                        hideProgressBar
                        newestOnTop
                        stacked={false}
                        className={`${styles.toastContainer} mythic-justify-center mythic-max-width-full mythic-flex mythic-flex-column mythic-wrap`}
                        pauseOnFocusLoss={false}
        />
    );
};

const ThemeAwareNavigation = ({me}) => {
    const {mode, toggleMode} = useMythicColorMode();
    return <TopAppBarVertical me={me} toggleTheme={toggleMode} themeMode={mode} />;
};

export function App(props) {
    const [, setFontAwesomeCatalogReady] = React.useState(false);
    React.useEffect(() => {
        let mounted = true;
        loadFontAwesomeCatalog().then(() => {
            if(mounted){
                setFontAwesomeCatalogReady(true);
            }
        }).catch((error) => console.error("Failed to load Font Awesome icon catalog", error));
        return () => {mounted = false;};
    }, []);
    const me = useReactiveVar(meState);
    const connectionState = useReactiveVar(mythicConnectionState);
    const preferences = useReactiveVar(mePreferences);
    const [loadingPreference, setLoadingPreferences] = React.useState(true);
    const mountedRef = React.useRef(true);
    const [openRefreshDialog, setOpenRefreshDialog] = React.useState(false);
    const [getUserPreferences] = useLazyQuery(userSettingsQuery, {
        fetchPolicy: "no-cache",
        onCompleted: (data) => {
            //console.log("got preferences", data.getOperatorPreferences.preferences)
            if(data.getOperatorPreferences.status === "success"){
                if(data.getOperatorPreferences.preferences !== null){
                    mePreferences({...preferences, ...data.getOperatorPreferences.preferences});
                }
            } else {
                snackActions.error(`Failed to get user preferences:\n${data.getOperatorPreferences.error}`);
            }
            setLoadingPreferences(false);
        },
        onError: (error) => {
            console.log(error);
            snackActions.error(error.message);
            setLoadingPreferences(false);
        }
    })
    useInterval( () => {
        // interval should run every 10 minutes (600000 milliseconds) to check JWT status
        let millisecondsLeft = JWTTimeLeft();
        // if we have 30min left of our token, prompt the user to extend. 30 min is 1,800,000 milliseconds
        //console.log("jwt time left: ", millisecondsLeft)
        if(millisecondsLeft <= 1800000 && !openRefreshDialog && me.loggedIn){
            if(isJWTValid()){
                setOpenRefreshDialog(true);
            }else{
                FailedRefresh();
            }
        }
    }, 600000, mountedRef, mountedRef);
    React.useEffect( () => {
        if(me.loggedIn){
            setLoadingPreferences(true);
            getUserPreferences();
        } else {
            setLoadingPreferences(false);
        }
    }, [me.loggedIn])
    if(loadingPreference){
        // make sure we've loaded preferences before loading actual app content
        return (
            <MythicThemeProvider appearance={preferences?.appearance}>
                <MythicCluster component="div" gap="none" wrap={false} align="stretch" className="mythic-relative mythic-full-height mythic-full-width">
                    <MythicLoadingState compact title="Loading Preferences" description="Fetching user preferences." />
                </MythicCluster>
            </MythicThemeProvider>
        )
    }
    return (
        <MythicThemeProvider appearance={preferences?.appearance}>
                <MeContext.Provider value={me}>
                <ChatDirectoryProvider me={me}>
                    <Tooltip id={"my-tooltip"} className={`${styles.tooltip} mythic-pre-wrap`}/>
                    <ThemeAwareToastContainer />
                    <div className={`${styles.root} mythic-max-width-full mythic-flex mythic-full-height mythic-full-width`}>
                        {openRefreshDialog &&
                            <MythicDialog fullWidth={true} maxWidth="sm" open={openRefreshDialog}
                                          onClose={()=>{setOpenRefreshDialog(false);}}
                                          innerDialog={<RefreshTokenDialog
                                              onClose={()=>{setOpenRefreshDialog(false);}} />}
                            />
                        }
                        {me.loggedIn && me.user !== undefined && me.user !== null &&
                            <ThemeAwareNavigation me={me} />
                        }
                        <div className={`${styles.main} mythic-flex mythic-flex-column mythic-overflow-hidden`}>
                            <div className={me.loggedIn ? styles.navigationAccent : styles.navigationAccentHidden}/>
                            {me.loggedIn && me?.user?.current_operation_banner_text !== "" &&
                                <Typography className={`${styles.operationBanner} mythic-font-size-caption mythic-font-weight-medium mythic-full-width`} style={{
                                    "--mythic-operation-banner": me?.user?.current_operation_banner_color,
                                }}>
                                    {me?.user?.current_operation_banner_text}
                                </Typography>
                            }
                            {hasMythicConnectionError(connectionState) &&
                                <div role="alert" className={`${styles.connectionAlert} mythic-justify-center mythic-align-center mythic-flex mythic-wrap mythic-full-width`}>
                                    <Typography component="span" className={`${styles.connectionAlertText} mythic-font-size-caption mythic-font-weight-medium`}>
                                        {navigator.onLine === false
                                            ? "Your browser is offline. Reconnect to the network, then reload Mythic."
                                            : window.location.protocol === "https:"
                                                ? "Connection to Mythic was lost. Check the server or network. If this deployment uses a self-signed certificate, Chrome may require approval again."
                                                : "Connection to Mythic was lost. Check the server or network, then reload Mythic."}
                                    </Typography>
                                    <Button color="inherit" size="small" variant="outlined"
                                            onClick={() => window.location.reload()}
                                            className={`${styles.reloadButton} mythic-font-weight-bold`}>
                                        Reload Mythic
                                    </Button>
                                </div>
                            }
                            <div className={`${styles.content} mythic-flex mythic-flex-column mythic-overflow-hidden`}>
                                <React.Suspense fallback={<div className="mythic-full-height mythic-full-width" />}>
                                    <Routes>
                                        <Route path='/new/login' element={<LoginForm me={me}/>}/>
                                        <Route path='/new/invite' element={<InviteForm me={me}/>}/>
                                        <Route path='/' element={<LoggedInRoute me={me}><Home me={me}/></LoggedInRoute>}/>
                                        <Route exact path='/new'
                                               element={<LoggedInRoute me={me}><Home me={me}/></LoggedInRoute>}/>
                                        <Route exact path='/new/settings'
                                               element={<LoggedInRoute me={me}><Settings me={me}/></LoggedInRoute>}/>
                                        <Route exact path='/new/payloadtypes'
                                               element={<LoggedInRoute me={me}><PayloadTypesC2Profiles
                                                   me={me}/></LoggedInRoute>}/>
                                        <Route exact path='/new/eventfeed'
                                               element={<LoggedInRoute me={me}><EventFeed me={me}/></LoggedInRoute>}/>
                                        <Route exact path='/new/createpayload'
                                               element={<LoggedInRoute me={me}><CreatePayload me={me}/></LoggedInRoute>}/>
                                        <Route exact path='/new/createwrapper'
                                               element={<LoggedInRoute me={me}><CreatePayloadWrapper
                                                   me={me}/></LoggedInRoute>}/>
                                        <Route exact path='/new/payloads'
                                               element={<LoggedInRoute me={me}><Payloads me={me}/></LoggedInRoute>}/>
                                        <Route exact path='/new/c2profiles'
                                               element={<LoggedInRoute me={me}><PayloadTypesC2Profiles
                                                   me={me}/></LoggedInRoute>}/>
                                        <Route exact path='/new/services/'
                                               element={<LoggedInRoute me={me}><PayloadTypesC2Profiles
                                                   me={me}/></LoggedInRoute>}/>
                                        <Route exact path='/new/callbacks'
                                               element={<LoggedInRoute me={me}><Callbacks me={me}/></LoggedInRoute>}/>
                                        <Route path='/new/search'
                                               element={<LoggedInRoute me={me}><Search history={props.history}
                                                                                       me={me}/></LoggedInRoute>}/>
                                        <Route exact path='/new/browserscripts'
                                               element={<LoggedInRoute me={me}><BrowserScripts me={me}/></LoggedInRoute>}/>
                                        <Route exact path='/new/task/:taskId'
                                               element={<LoggedInRoute me={me}><SingleTaskView me={me}/></LoggedInRoute>}/>
                                        <Route exact path='/new/tasks/by_range'
                                               element={<LoggedInRoute me={me}><SingleTaskView me={me}/></LoggedInRoute>}/>
                                        <Route exact path='/new/operations'
                                               element={<LoggedInRoute me={me}><Operations me={me}/></LoggedInRoute>}/>
                                        <Route exact path='/new/callbacks/:callbackDisplayId'
                                               element={<LoggedInRoute me={me}><ExpandedCallback
                                                   me={me}/></LoggedInRoute>}/>
                                        <Route exact path='/new/reporting'
                                               element={<LoggedInRoute me={me}><Reporting me={me}/></LoggedInRoute>}/>
                                        <Route exact path='/new/mitre'
                                               element={<LoggedInRoute me={me}><MitreAttack me={me}/></LoggedInRoute>}/>
                                        <Route exact path='/new/tagtypes'
                                               element={<LoggedInRoute me={me}><Tags me={me}/></LoggedInRoute>}/>
                                        <Route exact path='/new/eventing'
                                               element={<LoggedInRoute me={me}><Eventing me={me}/></LoggedInRoute>}/>
                                        <Route exact path='/new/chat'
                                               element={<LoggedInRoute me={me}><Chat me={me}/></LoggedInRoute>}/>
                                        <Route exact path='/new/jupyter' element={<LoggedInRoute me={me}><Jupyter/></LoggedInRoute>}/>
                                        <Route exact path='/new/hasura' element={<LoggedInRoute me={me}><Hasura/></LoggedInRoute>}/>
                                    </Routes>
                                </React.Suspense>
                            </div>
                        </div>
                    </div>
                </ChatDirectoryProvider>
                </MeContext.Provider>
        </MythicThemeProvider>
    );
}
