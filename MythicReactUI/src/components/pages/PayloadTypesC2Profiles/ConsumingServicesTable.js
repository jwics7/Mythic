import TableCell from '@mui/material/TableCell';
import React from 'react';
import TableRow from '@mui/material/TableRow';
import PublicIcon from '@mui/icons-material/Public';

import {gql, useMutation} from '@apollo/client';
import {snackActions} from '../../utilities/Snackbar';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import {MythicStyledTooltip} from "../../MythicComponents/MythicStyledTooltip";
import {MythicChatContainerIcon} from "../../MythicComponents/MythicChatContainerIcon";
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreFromTrashOutlinedIcon from '@mui/icons-material/RestoreFromTrashOutlined';
import {MythicConfirmDialog} from "../../MythicComponents/MythicConfirmDialog";
import PermIdentityTwoToneIcon from '@mui/icons-material/PermIdentityTwoTone';
import {MythicDialog} from "../../MythicComponents/MythicDialog";
import AttachFileIcon from '@mui/icons-material/AttachFile';
import {ConsumingServicesGetIDPMetadataDialog} from "./ConsumingServicesGetIDPMetadataDialog";
import {C2ProfileListFilesDialog} from "./C2ProfileListFilesDialog";
import {InstalledServiceContainerStatus} from "./InstalledServiceStatus";
import {
    InstalledServiceDefinitionList,
    InstalledServiceDetailRow,
    InstalledServiceDetailSection,
    InstalledServiceDetailToggle,
    InstalledServiceIdentity,
    InstalledServiceMetadataSummary
} from "./InstalledServiceTableComponents";
import {MythicAgentSVGIcon} from "../../MythicComponents/MythicAgentSVGIcon";
import {MythicCluster, MythicTruncatedText} from "../../MythicComponents/MythicLayout";
import {MythicActionButton} from "../../MythicComponents/MythicContent";

const testWebhookMutation = gql`
mutation testWebhookWorks($service_type: String!){
    consumingServicesTestWebhook(service_type: $service_type){
        status
        error
    }
}
`;
const testLogMutation = gql`
mutation testWebhookWorks($service_type: String!){
    consumingServicesTestLog(service_type: $service_type){
        status
        error
    }
}
`;
const toggleDeleteStatus = gql`
mutation toggleConsumingContainerDeleteStatus($id: Int!, $deleted: Boolean!){
  update_consuming_container_by_pk(pk_columns: {id: $id}, _set: {deleted: $deleted}) {
    id
  }
}
`;
const webhook_events = ["new_alert","new_callback","new_custom","new_feedback", "new_startup"];
const logging_events = ["new_artifact","new_callback", "new_credential","new_file", "new_keylog",  "new_payload", "new_response", "new_task"];

export const ConsumingServicesTableRow = ({service, showDeleted}) => {
    const openListFilesInformation = React.useRef("");
    const [testWebhook] = useMutation(testWebhookMutation, {
        onCompleted: data => {
            if (data.consumingServicesTestWebhook.status === "success") {
                snackActions.success("Successfully sent test message to service");
            } else {
                console.log(data.consumingServicesTestWebhook.error)
                snackActions.error("No webhook listening")
            }

        },
        onError: error => {

        }
    });
    const issueTestWebhook = (service_type) => {
        testWebhook({variables: {service_type: service_type}});
    }
    const [testLog] = useMutation(testLogMutation, {
        onCompleted: data => {
            if (data.consumingServicesTestLog.status === "success") {
                snackActions.success("Successfully sent test message to service");
            } else {
                snackActions.error("No logger listening")
                console.log(data.consumingServicesTestLog.error)
            }

        },
        onError: error => {

        }
    });
    const issueTestLog = (service_type) => {
        testLog({variables: {service_type: service_type}});
    }
    const [openIDPMetadata, setOpenIDPMetadata] = React.useState(false);
    const [openDetails, setOpenDetails] = React.useState(false);
    const IDPMetadataRef = React.useRef({"container": "", "idp": ""});
    const [openListFilesDialog, setOpenListFilesDialog] = React.useState(false);
    const [openDelete, setOpenDeleteDialog] = React.useState(false);
    const deletingContainer = React.useRef({});
    const getIDPMetadata = (container, idp) => {
        IDPMetadataRef.current = {"container": container, "idp": idp};
        setOpenIDPMetadata(true);
    }
    const [updateDeleted] = useMutation(toggleDeleteStatus, {
        onCompleted: data => {
            snackActions.success("Successfully updated");
        },
        onError: error => {
            console.log(error);
            snackActions.error("Failed to update: " + error.message);
        }
    });
    const onAcceptDelete = () => {
        updateDeleted({variables: {id: deletingContainer.current.id, deleted: !deletingContainer.current.deleted}})
        setOpenDeleteDialog(false);
    }
    const adjustingDelete = (service) => {
        deletingContainer.current = service;
        setOpenDeleteDialog(true);
    }
    const [localData, setLocalData] = React.useState({...service, subscriptions: []});
    const onOpenListFilesDialog = (container) => {
        openListFilesInformation.current = container;
        setOpenListFilesDialog(true);
    }
    React.useEffect(() => {
        switch(service.type){
            case "webhook":
            case "logging":
                setLocalData({...service});
                break;
            case "eventing":
                try{
                    const newSubs = service.subscriptions.map( s => {
                        try{
                            return JSON.parse(s);
                        }catch(error){
                            console.log(error);
                            return {name: "", description: s};
                        }
                    });
                    setLocalData({...service, subscriptions: newSubs});
                }catch(error){

                }
                break;
            case "auth":
            case "chat":
                try{
                    const newSubs = service.subscriptions.map( s => {
                        try{
                            return JSON.parse(s);
                        }catch(error){
                            console.log(error);
                            return {name: s, type: ""};
                        }
                    });
                    setLocalData({...service, subscriptions: newSubs});
                }catch(error){

                }
                break;
            default:
        }
    }, [service]);
    const renderDeleteButton = (w) => (
        <MythicStyledTooltip title={w.deleted ? "Restore service" : "Remove service"}>
            <MythicActionButton iconOnly
                tone={w.deleted ? "success" : "error"}
                emphasis={w.deleted ? "always" : "hover"}
                onClick={() => adjustingDelete(w)}
                size="small"
            >
                {w.deleted ? <RestoreFromTrashOutlinedIcon fontSize="small" /> : <DeleteIcon fontSize="small" />}
            </MythicActionButton>
        </MythicStyledTooltip>
    );
    const renderFileButton = (w) => (
        <MythicStyledTooltip title={w.container_running ? "View Files" : "Unable to view files since container is offline"}>
            <MythicActionButton iconOnly tone="info"

                disabled={!w.container_running}
                onClick={()=>{onOpenListFilesDialog(w.name);}}
                size="small"
            >
                <AttachFileIcon fontSize="small" />
            </MythicActionButton>
        </MythicStyledTooltip>
    );
    const renderSubscriptionTestButtons = (w, events, icon, onClick, prefix) => (
        events.map(s => (
            <MythicStyledTooltip title={`${prefix} ${s}`} key={`${w.id}-${prefix}-${s}`}>
                <MythicActionButton iconOnly tone="info"

                    disabled={!getSubscriptionNames(w).includes(s) || !w.container_running}
                    onClick={() => onClick(s)}
                    size="small">
                    {icon}
                </MythicActionButton>
            </MythicStyledTooltip>
        ))
    );
    const getSubscriptionNames = (w) => {
        if(!Array.isArray(w.subscriptions)){return []}
        return w.subscriptions.map((subscription) => subscription?.name || subscription).filter(Boolean);
    };
    const renderIdentityProviderMetadata = (w) => {
        const subscriptions = Array.isArray(w.subscriptions) ? w.subscriptions : [];
        if(subscriptions.length === 0){
            return <span className="mythic-installed-service-empty-value mythic-font-size-small mythic-font-weight-semibold mythic-text-secondary">Not set</span>;
        }
        return (
            <MythicCluster component="span" gap="xs" className="mythic-installed-service-action-chip-list">
                {subscriptions.map((subscription) => {
                    const providerName = subscription?.name || subscription;
                    return (
                        <MythicStyledTooltip title={w.container_running ? "Fetch container metadata" : "Container is offline"} key={`${w.name}-${providerName}`}>
                            <MythicCluster component="button" gap="xs" inline wrap={false}
                                className="mythic-installed-service-action-chip mythic-surface-subtle mythic-line-height-tight mythic-clickable mythic-font-size-caption mythic-font-weight-bold mythic-border-radius mythic-border mythic-overflow-hidden mythic-text-primary"
                                disabled={!w.container_running}
                                onClick={() => getIDPMetadata(w.name, providerName)}
                                type="button"
                            >
                                <MythicTruncatedText component="span" >{providerName}</MythicTruncatedText>
                                <PermIdentityTwoToneIcon fontSize="small" />
                            </MythicCluster>
                        </MythicStyledTooltip>
                    );
                })}
            </MythicCluster>
        );
    };
    const renderBaseRow = ({w, typeLabel, metadataItems, actions, hasDetails = false}) => (
        (showDeleted || !w.deleted) &&
        <TableRow key={w.id} hover>
            <TableCell>
                {renderDeleteButton(w)}
            </TableCell>
            <TableCell style={{display: "inline-flex"}}>
                <MythicAgentSVGIcon payload_type={w.name} style={{width: "80px", padding: "5px", objectFit: "unset"}} />
                <InstalledServiceIdentity
                    name={w.name}
                    typeLabel={typeLabel}
                    deleted={w.deleted}
                    status={<InstalledServiceContainerStatus isOnline={w.container_running} />}
                />
            </TableCell>
            <TableCell>
                <InstalledServiceMetadataSummary
                    items={metadataItems}
                    description={w.description}
                />
            </TableCell>
            <TableCell>
                <MythicCluster component="div" gap="sm" align="center" className="mythic-service-actions">
                    {renderFileButton(w)}
                    {actions}
                    {hasDetails &&
                        <InstalledServiceDetailToggle open={openDetails} onClick={() => setOpenDetails((current) => !current)} />
                    }
                </MythicCluster>
            </TableCell>
        </TableRow>
    );
    const getTableRow = (w) => {
        switch(service.type){
            case "webhook":
                return renderBaseRow({
                    w,
                    typeLabel: "Webhook",
                    metadataItems: [
                        {label: "Type", value: w.type},
                        {label: "Version", value: w.semver, chip: true},
                        {label: "Subscriptions", value: getSubscriptionNames(w)},
                    ],
                    actions: renderSubscriptionTestButtons(w, webhook_events, <PublicIcon fontSize="small" />, issueTestWebhook, "test webhook"),
                });
            case "logging":
                return renderBaseRow({
                    w,
                    typeLabel: "Logger",
                    metadataItems: [
                        {label: "Type", value: w.type},
                        {label: "Version", value: w.semver, chip: true},
                        {label: "Subscriptions", value: getSubscriptionNames(w)},
                    ],
                    actions: renderSubscriptionTestButtons(w, logging_events, <SyncAltIcon fontSize="small" />, issueTestLog, "test logging"),
                });
            case "eventing":
                return renderBaseRow({
                    w,
                    typeLabel: "Eventing",
                    metadataItems: [
                        {label: "Type", value: w.type},
                        {label: "Version", value: w.semver, chip: true},
                        {label: "Functions", value: getSubscriptionNames(w)},
                    ],
                    hasDetails: true,
                });
            case "auth":
                return renderBaseRow({
                    w,
                    typeLabel: "Auth",
                    metadataItems: [
                        {label: "Type", value: w.type},
                        {label: "Version", value: w.semver, chip: true},
                        {label: "Identity Providers", value: getSubscriptionNames(w), render: renderIdentityProviderMetadata(w)},
                    ],
                });
            case "chat":
                return renderBaseRow({
                    w,
                    typeLabel: "Chat",
                    metadataItems: [
                        {label: "Type", value: w.type},
                        {label: "Version", value: w.semver, chip: true},
                        {label: "Models", value: getSubscriptionNames(w)},
                    ],
                    hasDetails: true,
                });
            default:
                return null;
        }
    }
    const getDetailContent = (w) => {
        switch(service.type){
            case "eventing":
                return (
                    <InstalledServiceDetailSection title="Eventing functions" count={(w.subscriptions || []).length}>
                        <InstalledServiceDefinitionList
                            items={(w.subscriptions || []).map((subscription) => ({
                                title: subscription.name,
                                description: subscription.description,
                            }))}
                            emptyText="No eventing functions registered."
                        />
                    </InstalledServiceDetailSection>
                );
            case "auth":
                return null;
            case "chat":
                return (
                    <InstalledServiceDetailSection title="Chat models" count={(w.subscriptions || []).length}>
                        <InstalledServiceDefinitionList
                            items={(w.subscriptions || []).map((subscription) => ({
                                title: subscription.name || subscription,
                                description: subscription.description || subscription.type || "",
                            }))}
                            emptyText="No chat models registered."
                        />
                    </InstalledServiceDetailSection>
                );
            default:
                return null;
        }
    };
    if(localData.deleted && !showDeleted){
        return null;
    }
    const detailContent = getDetailContent(localData);
    return (
        <>
            {getTableRow(localData)}
            {detailContent &&
                <InstalledServiceDetailRow open={openDetails} colSpan={4}>
                    {detailContent}
                </InstalledServiceDetailRow>
            }
            {openDelete &&
                <MythicConfirmDialog onClose={() => { setOpenDeleteDialog(false); }}
                                     onSubmit={onAcceptDelete}
                                     open={openDelete}
                                     acceptText={deletingContainer.current.deleted ? "Restore" : "Remove"}
                                     acceptColor={deletingContainer.current.deleted ? "success" : "error"}/>
            }
            {openListFilesDialog &&
                <MythicDialog fullWidth={true} maxWidth="md" open={openListFilesDialog}
                              onClose={()=>{setOpenListFilesDialog(false);}}
                              innerDialog={<C2ProfileListFilesDialog container_name={openListFilesInformation.current}
                                                                     onClose={()=>{setOpenListFilesDialog(false);}} />}
                />
            }
            {openIDPMetadata &&
                <MythicDialog fullWidth={true} maxWidth="lg" open={openIDPMetadata}
                              onClose={()=>{setOpenIDPMetadata(false);}}
                              innerDialog={<ConsumingServicesGetIDPMetadataDialog
                                  container={IDPMetadataRef.current.container}
                                  idp={IDPMetadataRef.current.idp}
                                  onClose={()=>{setOpenIDPMetadata(false);}} />}
                />
            }
        </>

    )
}
