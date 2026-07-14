import React from 'react';
import { gql, useLazyQuery, useMutation } from '@apollo/client';
import {snackActions} from '../../utilities/Snackbar';
import Button from '@mui/material/Button';
import {toLocalTime} from "../../utilities/Time";
import NotificationsActiveTwoToneIcon from '@mui/icons-material/NotificationsActiveTwoTone';
import NotificationsOffTwoToneIcon from '@mui/icons-material/NotificationsOffTwoTone';
import {MythicStyledTooltip} from "../../MythicComponents/MythicStyledTooltip";
import InfoTwoToneIcon from '@mui/icons-material/InfoTwoTone';
import {MythicDialog, MythicViewJSONAsTableDialog} from '../../MythicComponents/MythicDialog';
import {
    EventStepInstanceRenderFlowWithProvider,
    EventStepRenderDialog,
    EventStepRenderFlowWithProvider
} from "./EventStepRender";
import OpenInNewTwoToneIcon from '@mui/icons-material/OpenInNewTwoTone';
import ContentCopyTwoToneIcon from '@mui/icons-material/ContentCopyTwoTone';
import {EventGroupInstances} from "./EventGroupInstances";
import DeleteIcon from '@mui/icons-material/Delete';
import {MythicConfirmDialog} from '../../MythicComponents/MythicConfirmDialog';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import PlayCircleFilledTwoToneIcon from '@mui/icons-material/PlayCircleFilledTwoTone';
import RuleTwoToneIcon from '@mui/icons-material/RuleTwoTone';
import ChecklistRtlTwoToneIcon from '@mui/icons-material/ChecklistRtlTwoTone';
import {EventGroupTableRunAsDialog} from "./EventApprovalDialog";
import AttachFileIcon from '@mui/icons-material/AttachFile';
import Badge from '@mui/material/Badge';
import {EventFileManageDialog} from "./EventFileManageDialog";
import SpellcheckIcon from '@mui/icons-material/Spellcheck';
import {EventTriggerKeywordDialog} from "./EventTriggerKeywordDialog";
import LayersTwoToneIcon from '@mui/icons-material/LayersTwoTone';
import {EventGroupConsumingContainersDialog} from "./EventGroupConsumingContainersDialog";
import CalendarMonthTwoToneIcon from '@mui/icons-material/CalendarMonthTwoTone';
import EditNoteTwoToneIcon from '@mui/icons-material/EditNoteTwoTone';
import {MythicPageHeader, MythicPageHeaderChip} from "../../MythicComponents/MythicPageHeader";
import {MythicStatusChip} from "../../MythicComponents/MythicStatusChip";
import {CreateEventingStepper, getWizardPayloadFromWorkflow} from "./CreateEventingStepper";
import {MythicStack, MythicCluster, MythicGrid} from "../../MythicComponents/MythicLayout";
import {MythicActionButton, MythicPanel, MythicText} from "../../MythicComponents/MythicContent";

const updateDeleteStatusMutation = gql(`
mutation updateDeleteStatusMutation($eventgroup_id: Int!, $deleted: Boolean!) {
  eventingTriggerUpdate(eventgroup_id: $eventgroup_id, deleted: $deleted) {
    deleted
  }
}
`)
const updateActiveStatusMutation = gql(`
mutation updateActiveStatusMutation($eventgroup_id: Int!, $active: Boolean!) {
  eventingTriggerUpdate(eventgroup_id: $eventgroup_id, active: $active) {
    active
  }
}
`)
const eventingTriggerManualMutation = gql(`
mutation eventingManualTrigger($eventgroup_id: Int!){
    eventingTriggerManual(eventgroup_id: $eventgroup_id){
        status
        error
    }
}
`)
const getExportWorkflow = gql(`
query exportWorkflow($eventgroup_id: Int!, $include_steps: Boolean!, $output_format: String!) {
  eventingExportWorkflow(eventgroup_id: $eventgroup_id, include_steps: $include_steps, output_format: $output_format) {
    status
    error
    workflow
  }
}
`)
export function EventGroupTable({selectedEventGroup, me, showInstances, showGraph, height}) {
    const [openEventStepRender, setOpenEventStepRender] = React.useState(false);
    const [openEnvView, setOpenEnvView] = React.useState(false);
    const [openTriggerDataView, setOpenTriggerDataView] = React.useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);
    const [openActiveDialog, setOpenActiveDialog] = React.useState(false);
    const [openApprovalDialog, setOpenApprovalDialog] = React.useState(false);
    const [openStepperDialog, setOpenStepperDialog] = React.useState(false);
    const [stepperMode, setStepperMode] = React.useState("edit");
    const [stepperInitialPayload, setStepperInitialPayload] = React.useState(null);
    const [updateDeleteMutation] = useMutation(updateDeleteStatusMutation, {
     onCompleted: (data) => {
     },
     onError: (data) => {
        console.log(data);
     }
 })
    const [updateActiveMutation] = useMutation(updateActiveStatusMutation, {
        onCompleted: (data) => {
        },
        onError: (data) => {
            console.log(data);
        }
    })
    const [triggerManually] = useMutation(eventingTriggerManualMutation, {
        onCompleted: (data) => {
            if(data.eventingTriggerManual.status === "success"){
                snackActions.info("Successfully sent trigger message");
            } else {
                snackActions.error(data.eventingTriggerManual.error);
            }
        },
        onError: (data) => {

        }
    })
    const [getExportedWorkflow] = useLazyQuery(getExportWorkflow, {
        fetchPolicy: "no-cache",
        onCompleted: (data) => {
            if(data.eventingExportWorkflow.status === "success"){
                try{
                    const workflow = JSON.parse(data.eventingExportWorkflow.workflow);
                    setStepperInitialPayload(getWizardPayloadFromWorkflow(workflow));
                    setOpenStepperDialog(true);
                }catch(error){
                    snackActions.error("Failed to parse exported workflow");
                    console.log(error);
                }
            } else {
                snackActions.error(data.eventingExportWorkflow.error);
            }
        },
        onError: (data) => {
            console.log(data);
            snackActions.error("Failed to export workflow");
        }
    });
    const [selectedInstanceID, setSelectedInstanceID] = React.useState(0);
    const [openFileManageView, setOpenFileManageView] = React.useState(false);
    const [openTriggerKeyword, setOpenTriggerKeyword] = React.useState(false);
    const [consumingContainersErrors, setConsumingContainersErrors] = React.useState(0);
    const [openConsumingContainerDialog, setOpenConsumingContainerDialog] = React.useState(false);
    const foundQueryInstanceRef = React.useRef(0);
    React.useEffect( () => {
        if(selectedEventGroup?.id > 0){
            let consumingContainersErrors = 0;
            selectedEventGroup?.eventgroupconsumingcontainers?.forEach( c => {
                if(c?.consuming_container === null){
                    consumingContainersErrors += 1;
                }else {
                    if(!c?.consuming_container?.container_running){
                        consumingContainersErrors += 1;
                    }
                    if(!c?.all_functions_available){
                        consumingContainersErrors += 1;
                    }
                }
            });
            setConsumingContainersErrors(consumingContainersErrors);
        } else {
            setConsumingContainersErrors(0);
            setOpenConsumingContainerDialog(false);
        }
        if(foundQueryInstanceRef.current === 0 || foundQueryInstanceRef.current !== selectedEventGroup.id){
            setSelectedInstanceID(0);
        }
    }, [selectedEventGroup])
     const onAcceptActive = () => {
         updateActiveMutation({variables: {eventgroup_id: selectedEventGroup.id, active: !selectedEventGroup.active}});
     }
     const onAcceptDelete = () => {
        updateDeleteMutation({variables: {eventgroup_id: selectedEventGroup.id, deleted: !selectedEventGroup.deleted}});
     }
     const onTriggerManual = () => {
         triggerManually({variables: {eventgroup_id: selectedEventGroup.id}});
     }
     const openWorkflowStepper = (mode) => {
         setStepperMode(mode);
         getExportedWorkflow({variables: {
             eventgroup_id: selectedEventGroup.id,
             include_steps: true,
             output_format: "json",
         }});
     }
 return (
     <MythicStack component="div" gap="sm" scroll className="mythic-eventing-detail mythic-full-height" style={{height: height || "100%"}}>

         {selectedEventGroup.id === 0 &&
             <MythicPageHeader
                 dense
                 title="All Eventing Runs"
                 subtitle="Review recent workflow executions across all registered event groups."
             />
         }
         {selectedEventGroup.id !== 0 &&
             <>
                 {openDeleteDialog &&
                     <MythicConfirmDialog onClose={() => {
                         setOpenDeleteDialog(false);
                     }} onSubmit={onAcceptDelete} open={openDeleteDialog}/>
                 }
                 {openActiveDialog &&
                     <MythicConfirmDialog onClose={() => {
                         setOpenActiveDialog(false);
                     }} onSubmit={onAcceptActive} open={openActiveDialog}
                                          acceptText={"Disable"}
                     />
                 }
                 <EventGroupWorkflowOverview
                     consumingContainersErrors={consumingContainersErrors}
                     me={me}
                     onClone={() => openWorkflowStepper("duplicate")}
                     onDelete={() => setOpenDeleteDialog(true)}
                     onDisable={() => setOpenActiveDialog(true)}
                     onEdit={() => openWorkflowStepper("edit")}
                     onEnable={onAcceptActive}
                     onManageFiles={() => setOpenFileManageView(true)}
                     onOpenApproval={() => setOpenApprovalDialog(true)}
                     onOpenContainers={() => setOpenConsumingContainerDialog(true)}
                     onOpenEnvironment={() => setOpenEnvView(true)}
                     onOpenGraph={() => setOpenEventStepRender(true)}
                     onOpenKeywordTrigger={() => setOpenTriggerKeyword(true)}
                     onOpenTriggerData={() => setOpenTriggerDataView(true)}
                     onRestore={onAcceptDelete}
                     onTriggerManual={onTriggerManual}
                     selectedEventGroup={selectedEventGroup}
                 />
             </>
         }
         {showGraph && <RenderSteps selectedInstanceID={selectedInstanceID} selectedEventGroup={selectedEventGroup} />}
         {showInstances && <EventGroupInstances setSelectedInstance={setSelectedInstanceID}
                              selectedInstanceID={selectedInstanceID}
                              foundQueryInstanceRef={foundQueryInstanceRef}
                              selectedEventGroup={selectedEventGroup} me={me}/>}
         {openEventStepRender &&
             <MythicDialog fullWidth={true} maxWidth="xl" open={openEventStepRender}
                           onClose={() => {
                               setOpenEventStepRender(false);
                           }}
                           innerDialog={<EventStepRenderDialog onClose={() => {
                               setOpenEventStepRender(false);
                           }} selectedEventGroup={selectedEventGroup}/>}
             />
         }
         {openApprovalDialog &&
             <MythicDialog fullWidth={true} maxWidth="md" open={openApprovalDialog}
                           onClose={() => {
                               setOpenApprovalDialog(false);
                           }}
                           innerDialog={<EventGroupTableRunAsDialog onClose={() => {
                               setOpenApprovalDialog(false);
                           }} eventgroupapprovals={selectedEventGroup.eventgroupapprovals}
                           me={me} selectedEventGroup={selectedEventGroup} />}
             />
         }
         {openEnvView && <MythicDialog fullWidth={true} maxWidth="lg" open={openEnvView}
                                       onClose={() => {
                                           setOpenEnvView(false);
                                       }}
                                       innerDialog={<MythicViewJSONAsTableDialog
                                           title="View Global Environment Settings" leftColumn="Env Key"
                                           rightColumn="Env Value" value={selectedEventGroup.environment}
                                           onClose={() => {
                                               setOpenEnvView(false);
                                           }}/>}
         />
         }
         {openTriggerDataView && <MythicDialog fullWidth={true} maxWidth="lg" open={openTriggerDataView}
                                       onClose={() => {
                                           setOpenTriggerDataView(false);
                                       }}
                                       innerDialog={<MythicViewJSONAsTableDialog
                                           title="View Trigger context"
                                           leftColumn="Context Key" rightColumn="Context Value"
                                           value={selectedEventGroup.trigger_data}
                                           onClose={() => {
                                               setOpenTriggerDataView(false);
                                           }}/>}
         />
         }
         {openFileManageView &&
             <MythicDialog fullWidth={true} maxWidth="lg" open={openFileManageView}
                           onClose={() => {
                               setOpenFileManageView(false);
                           }}
                           innerDialog={<EventFileManageDialog onClose={() => {
                               setOpenFileManageView(false);
                           }} me={me} selectedEventGroup={selectedEventGroup} />}
             />
         }
         {openTriggerKeyword &&
             <MythicDialog fullWidth={true} maxWidth="lg" open={openTriggerKeyword}
                           onClose={() => {
                               setOpenTriggerKeyword(false);
                           }}
                           innerDialog={<EventTriggerKeywordDialog onClose={() => {
                               setOpenTriggerKeyword(false);
                           }} me={me} selectedEventGroup={selectedEventGroup} />}
             />
         }
         {openConsumingContainerDialog &&
             <MythicDialog fullWidth={true} maxWidth="lg" open={openConsumingContainerDialog}
                           onClose={() => {
                               setOpenConsumingContainerDialog(false);
                           }}
                           innerDialog={<EventGroupConsumingContainersDialog onClose={() => {
                               setOpenConsumingContainerDialog(false);
                           }} selectedEventGroup={selectedEventGroup} />}
             />
         }
         {openStepperDialog &&
             <MythicDialog fullWidth={true} maxWidth="xl" open={openStepperDialog}
                           onClose={() => {
                               setOpenStepperDialog(false);
                           }}
                           innerDialog={<CreateEventingStepper
                               mode={stepperMode}
                               initialPayload={stepperInitialPayload}
                               onClose={() => {
                                   setOpenStepperDialog(false);
                               }}
                               selectedEventGroup={selectedEventGroup}
                               sourceEventGroupFiles={selectedEventGroup?.filemeta || []}
                           />}
             />
         }
     </MythicStack>
 )
}

function EventGroupWorkflowOverview({
    consumingContainersErrors,
    me,
    onClone,
    onDelete,
    onDisable,
    onEdit,
    onEnable,
    onManageFiles,
    onOpenApproval,
    onOpenContainers,
    onOpenEnvironment,
    onOpenGraph,
    onOpenKeywordTrigger,
    onOpenTriggerData,
    onRestore,
    onTriggerManual,
    selectedEventGroup,
}) {
    const keywords = selectedEventGroup?.keywords || [];
    const visibleKeywords = keywords.slice(0, 6);
    const hiddenKeywordCount = Math.max(keywords.length - visibleKeywords.length, 0);
    const fileCount = selectedEventGroup?.filemeta?.length || 0;
    const consumingContainers = selectedEventGroup?.eventgroupconsumingcontainers || [];
    const hasTriggerData = hasWorkflowDetailValue(selectedEventGroup?.trigger_data);
    const hasEnvironment = hasWorkflowDetailValue(selectedEventGroup?.environment);
    const isApproved = Boolean(selectedEventGroup?.approved_to_run);
    const createdBy = selectedEventGroup?.operator?.username || "unknown";
    const createdAt = toLocalTime(selectedEventGroup?.created_at, me?.user?.view_utc_time);

    return (
        <MythicGrid component="div" gap="md" columns="custom" className="mythic-eventing-workflow-overview mythic-border-radius mythic-border mythic-min-width-0 mythic-full-width mythic-overflow-hidden mythic-surface-raised mythic-flex-fixed mythic-text-primary">
            <MythicCluster component="div" gap="md" align="start" justify="between" wrap={false} className="mythic-eventing-workflow-overview-header mythic-divider-bottom mythic-grid-span-full">
                <MythicStack component="div" gap="xs" className="mythic-eventing-workflow-overview-title-block mythic-flex-fill">
                    <MythicCluster component="div" gap="sm" className="mythic-eventing-workflow-overview-title-row">
                        <span className="mythic-eventing-workflow-overview-title mythic-letter-spacing-reset mythic-break-anywhere mythic-font-weight-extra-bold mythic-min-width-0 mythic-text-primary">{selectedEventGroup?.name}</span>
                        <MythicPageHeaderChip
                            icon={selectedEventGroup?.active ? <NotificationsActiveTwoToneIcon /> : <NotificationsOffTwoToneIcon />}
                            label={selectedEventGroup?.active ? "Enabled" : "Disabled"}
                            status={selectedEventGroup?.active ? "enabled" : "disabled"}
                        />
                        {selectedEventGroup?.deleted && <MythicPageHeaderChip label="Deleted" status="error" />}
                    </MythicCluster>
                    {selectedEventGroup?.description &&
                        <div className="mythic-eventing-workflow-overview-description mythic-font-size-small mythic-break-anywhere mythic-font-weight-semibold mythic-line-height-normal mythic-min-width-0 mythic-text-secondary">{selectedEventGroup.description}</div>
                    }
                </MythicStack>
                <MythicCluster component="div" gap="sm" align="center" justify="end" fill className="mythic-eventing-workflow-overview-header-actions mythic-max-width-full">
                    {selectedEventGroup?.deleted ? (
                        <MythicActionButton tone="success"  variant="outlined" size="small" startIcon={<RestoreFromTrashIcon fontSize="small" />} onClick={onRestore}>
                            Restore
                        </MythicActionButton>
                    ) : (
                        <MythicActionButton tone="error"  variant="outlined" size="small" startIcon={<DeleteIcon fontSize="small" />} onClick={onDelete}>
                            Delete
                        </MythicActionButton>
                    )}
                    {selectedEventGroup?.active ? (
                        <MythicActionButton tone="warning"  variant="outlined" size="small" startIcon={<NotificationsActiveTwoToneIcon fontSize="small" />} onClick={onDisable}>
                            Disable
                        </MythicActionButton>
                    ) : (
                        <MythicActionButton tone="success"  variant="outlined" size="small" startIcon={<NotificationsOffTwoToneIcon fontSize="small" />} onClick={onEnable}>
                            Enable
                        </MythicActionButton>
                    )}
                </MythicCluster>
            </MythicCluster>
            <MythicStack component="div" gap="none" className="mythic-eventing-workflow-overview-section mythic-eventing-workflow-overview-primary">
                <MythicStack component="div" gap="none" className="mythic-eventing-workflow-overview-field">
                    <MythicText component="span" preset="eyebrow" className="mythic-eventing-workflow-overview-label">Created by</MythicText>
                    <span className="mythic-eventing-workflow-overview-value mythic-font-size-body-small mythic-break-anywhere mythic-line-height-snug mythic-font-weight-extra-bold mythic-min-width-0 mythic-text-primary">{createdBy}</span>
                    <span className="mythic-eventing-workflow-overview-subvalue mythic-break-anywhere mythic-font-weight-semibold mythic-font-size-small mythic-min-width-0 mythic-text-secondary">{createdAt}</span>
                </MythicStack>
                <MythicStack component="div" gap="none" className="mythic-eventing-workflow-overview-field">
                    <MythicText component="span" preset="eyebrow" className="mythic-eventing-workflow-overview-label">Trigger behavior</MythicText>
                    <MythicCluster component="div" gap="xs" className="mythic-eventing-workflow-chip-row">
                        <MythicStatusChip size="compact" label={selectedEventGroup?.trigger || "unknown"} status="info" />
                    </MythicCluster>
                    {selectedEventGroup?.trigger === "cron" &&
                        <MythicCluster component="span" gap="xs" inline wrap={false} className="mythic-eventing-workflow-overview-subvalue mythic-break-anywhere mythic-font-weight-semibold mythic-font-size-small mythic-eventing-workflow-overview-icon-line mythic-text-secondary">
                            <CalendarMonthTwoToneIcon fontSize="small" />
                            {toLocalTime(selectedEventGroup?.next_scheduled_run, me?.user?.view_utc_time)}
                        </MythicCluster>
                    }
                </MythicStack>
            </MythicStack>

            <MythicStack component="div" gap="none" className="mythic-eventing-workflow-overview-section">
                <MythicStack component="div" gap="none" className="mythic-eventing-workflow-overview-field">
                    <MythicText component="span" preset="eyebrow" className="mythic-eventing-workflow-overview-label">Keywords</MythicText>
                    <MythicCluster component="div" gap="xs" className="mythic-eventing-workflow-chip-row">
                        {keywords.length === 0 ? (
                            <MythicStatusChip size="compact" label="No keywords" status="neutral" />
                        ) : (
                            <>
                                {visibleKeywords.map((keyword, index) => (
                                    <MythicCluster component="span" gap="none" inline wrap={false} className="mythic-eventing-workflow-keyword-chip mythic-truncate mythic-surface-subtle mythic-nowrap mythic-font-size-xs mythic-font-weight-strong mythic-border mythic-overflow-hidden mythic-border-radius-pill mythic-text-primary" key={`${keyword}-${index}`}>{keyword}</MythicCluster>
                                ))}
                                {hiddenKeywordCount > 0 &&
                                    <MythicStyledTooltip title={keywords.join(", ")}>
                                        <MythicCluster component="span" gap="none" inline wrap={false} className="mythic-eventing-workflow-keyword-chip mythic-truncate mythic-surface-subtle mythic-nowrap mythic-font-size-xs mythic-font-weight-strong mythic-eventing-workflow-keyword-more mythic-border mythic-overflow-hidden mythic-border-radius-pill mythic-text-primary mythic-text-secondary">+{hiddenKeywordCount} more</MythicCluster>
                                    </MythicStyledTooltip>
                                }
                            </>
                        )}
                    </MythicCluster>
                </MythicStack>
                <MythicStack component="div" gap="none" className="mythic-eventing-workflow-overview-field">
                    <MythicText component="span" preset="eyebrow" className="mythic-eventing-workflow-overview-label">Run context</MythicText>
                    <MythicCluster component="div" gap="xs" className="mythic-eventing-workflow-chip-row">
                        <MythicStatusChip size="compact" label={selectedEventGroup?.run_as || "unknown"} status="neutral" />
                        <Button
                            className={`mythic-eventing-workflow-approval-button mythic-font-size-caption mythic-font-weight-extra-bold mythic-eventing-workflow-approval-${isApproved ? "approved" : "needs-approval"}`.trim()}
                            size="small"
                            startIcon={isApproved ? <ChecklistRtlTwoToneIcon fontSize="small" /> : <RuleTwoToneIcon fontSize="small" />}
                            onClick={onOpenApproval}
                        >
                            {isApproved ? "Approved" : "Needs approval"}
                        </Button>
                    </MythicCluster>
                </MythicStack>
            </MythicStack>

            <MythicStack component="div" gap="md" className="mythic-eventing-workflow-overview-section mythic-eventing-workflow-overview-actions">
                <MythicStack component="div" gap="none" className="mythic-eventing-workflow-action-group">
                    <MythicText component="span" preset="eyebrow" className="mythic-eventing-workflow-overview-label">Attached details</MythicText>
                    <MythicCluster component="div" gap="xs" className="mythic-eventing-workflow-button-row">
                        <MythicActionButton tone="info"

                            disabled={!hasTriggerData}
                            size="small"
                            startIcon={<InfoTwoToneIcon fontSize="small" />}
                            onClick={onOpenTriggerData}
                        >
                            Trigger data
                        </MythicActionButton>
                        <MythicActionButton tone="info"

                            disabled={!hasEnvironment}
                            size="small"
                            startIcon={<InfoTwoToneIcon fontSize="small" />}
                            onClick={onOpenEnvironment}
                        >
                            Environment
                        </MythicActionButton>
                        <MythicActionButton tone="info"

                            size="small"
                            startIcon={
                                <Badge badgeContent={fileCount} color="secondary">
                                    <AttachFileIcon fontSize="small" />
                                </Badge>
                            }
                            onClick={onManageFiles}
                        >
                            Files
                        </MythicActionButton>
                        {consumingContainers.length > 0 &&
                            <MythicActionButton
                                tone={consumingContainersErrors > 0 ? "error" : "info"}
                                size="small"
                                startIcon={
                                    <Badge badgeContent={consumingContainersErrors} color="error">
                                        <LayersTwoToneIcon fontSize="small" />
                                    </Badge>
                                }
                                onClick={onOpenContainers}
                            >
                                Containers
                            </MythicActionButton>
                        }
                    </MythicCluster>
                </MythicStack>
                <MythicStack component="div" gap="none" className="mythic-eventing-workflow-action-group">
                    <MythicText component="span" preset="eyebrow" className="mythic-eventing-workflow-overview-label">Workflow actions</MythicText>
                    <MythicCluster component="div" gap="xs" className="mythic-eventing-workflow-button-row">
                        {selectedEventGroup?.trigger === "manual" &&
                            <MythicActionButton tone="success"

                                size="small"
                                startIcon={<PlayCircleFilledTwoToneIcon fontSize="small" />}
                                onClick={onTriggerManual}
                            >
                                Run now
                            </MythicActionButton>
                        }
                        {keywords.length > 0 &&
                            <MythicActionButton tone="success"

                                size="small"
                                startIcon={<SpellcheckIcon fontSize="small" />}
                                onClick={onOpenKeywordTrigger}
                            >
                                Keyword run
                            </MythicActionButton>
                        }
                        <MythicStyledTooltip title="Edit workflow metadata, settings, and steps">
                            <MythicActionButton tone="info"

                                size="small"
                                startIcon={<EditNoteTwoToneIcon fontSize="small" />}
                                onClick={onEdit}
                            >
                                Edit details
                            </MythicActionButton>
                        </MythicStyledTooltip>
                        <MythicStyledTooltip title="Large graph view">
                            <MythicActionButton tone="info"

                                size="small"
                                startIcon={<OpenInNewTwoToneIcon fontSize="small" />}
                                onClick={onOpenGraph}
                            >
                                Open graph
                            </MythicActionButton>
                        </MythicStyledTooltip>
                        <MythicStyledTooltip title="Create a new workflow using this workflow as the starting point">
                            <MythicActionButton tone="success"

                                size="small"
                                startIcon={<ContentCopyTwoToneIcon fontSize="small" />}
                                onClick={onClone}
                            >
                                Duplicate workflow
                            </MythicActionButton>
                        </MythicStyledTooltip>
                    </MythicCluster>
                </MythicStack>
            </MythicStack>
        </MythicGrid>
    );
}

function hasWorkflowDetailValue(value) {
    if(value === null || value === undefined){
        return false;
    }
    if(typeof value === "string"){
        return value.trim().length > 0;
    }
    if(Array.isArray(value)){
        return value.length > 0;
    }
    if(typeof value === "object"){
        return Object.keys(value).length > 0;
    }
    return Boolean(value);
}

function RenderSteps({selectedEventGroup, selectedInstanceID}){
    const getRenderer = () => {
        if(selectedInstanceID > 0){
            return <EventStepInstanceRenderFlowWithProvider selectedEventGroupInstance={selectedInstanceID} />
        }
        if(selectedEventGroup.id > 0){
            return <EventStepRenderFlowWithProvider selectedEventGroup={selectedEventGroup} />
        }
        return null
    }

    return (
        <MythicPanel component="div" density="flush" tone="inherit" overflow="hidden" radius="md" className="mythic-eventing-graph-panel">
            {getRenderer()}
        </MythicPanel>
    )
}
