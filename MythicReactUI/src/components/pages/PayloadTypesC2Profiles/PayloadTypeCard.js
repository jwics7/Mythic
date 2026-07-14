import TableCell from '@mui/material/TableCell';
import React from 'react';
import { MythicDialog } from '../../MythicComponents/MythicDialog';
import {PayloadTypeBuildDialog} from './PayloadTypeBuildDialog';
import {MythicConfirmDialog} from '../../MythicComponents/MythicConfirmDialog';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreFromTrashOutlinedIcon from '@mui/icons-material/RestoreFromTrashOutlined';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import TuneIcon from '@mui/icons-material/Tune';
import SaveIcon from '@mui/icons-material/Save';
import TableRow from '@mui/material/TableRow';
import {gql, useMutation} from '@apollo/client';
import { snackActions } from '../../utilities/Snackbar';
import {MythicStyledTooltip} from "../../MythicComponents/MythicStyledTooltip";
import TerminalIcon from '@mui/icons-material/Terminal';
import {PayloadTypeCommandDialog} from "./PayloadTypeCommandsDialog";
import {MythicAgentSVGIcon} from "../../MythicComponents/MythicAgentSVGIcon";
import {C2ProfileListFilesDialog} from "./C2ProfileListFilesDialog";
import AttachFileIcon from '@mui/icons-material/AttachFile';
import {InstalledServiceContainerStatus} from "./InstalledServiceStatus";
import {
    InstalledServiceIdentity,
    InstalledServiceMetadataSummary
} from "./InstalledServiceTableComponents";
import {PayloadTypeBuildParameterInstancesDialog} from "./SavedParameterInstancesDialog";
import {MythicCluster} from "../../MythicComponents/MythicLayout";
import {MythicActionButton} from "../../MythicComponents/MythicContent";

const toggleDeleteStatus = gql`
mutation togglePayloadTypeDeleteStatus($payloadtype_id: Int!, $deleted: Boolean!){
  update_payloadtype_by_pk(pk_columns: {id: $payloadtype_id}, _set: {deleted: $deleted}) {
    id
  }
}
`;

export function PayloadTypeRow({service, showDeleted}){
    const [openBuildingDialog, setOpenBuildingDialog] = React.useState(false);
    const [openBuildParameterInstancesDialog, setOpenBuildParameterInstancesDialog] = React.useState(false);
    const [openDelete, setOpenDeleteDialog] = React.useState(false);
    const [updateDeleted] = useMutation(toggleDeleteStatus, {
        onCompleted: data => {
        },
        onError: error => {
            if(service.deleted){
                snackActions.error("Failed to restore payload type");
            } else {
                snackActions.error("Failed to mark payloadtype as deleted");
            }

        }
    });
    const [openCommandsDialog, setOpenCommandsDialog] = React.useState(false);
    const [openListFilesDialog, setOpenListFilesDialog] = React.useState(false);
    const typeLabel = service.wrapper ? "Wrapper" : service.agent_type === "agent" ? "Agent" : service.agent_type === "service" ? "3rd Party Service" : "Command Augmentation";
    const wrapperRuleCount = service.wrapper_payload_requirements?.length || 0;
    const supportedOS = React.useMemo(() => service.supported_os || [], [service.supported_os]);
    const onAcceptDelete = () => {
        updateDeleted({variables: {payloadtype_id: service.id, deleted: !service.deleted}})
        setOpenDeleteDialog(false);
    }
    if(service.deleted && !showDeleted){
        return null;
    }
    return (
        <>
            <TableRow hover>
                <TableCell>
                    {service.deleted ? (
                        <MythicActionButton iconOnly tone="success" emphasis="always"  size="small" onClick={()=>{setOpenDeleteDialog(true);}} >
                            <RestoreFromTrashOutlinedIcon fontSize="small" />
                        </MythicActionButton>
                    ) : (
                        <MythicActionButton iconOnly tone="error"  size="small" onClick={()=>{setOpenDeleteDialog(true);}} >
                            <DeleteIcon fontSize="small" />
                        </MythicActionButton>
                    )}
                </TableCell>
                <TableCell>
                    <MythicAgentSVGIcon payload_type={service.name} style={{width: "80px", padding: "5px", objectFit: "unset"}} />
                </TableCell>
                <TableCell>
                    <InstalledServiceIdentity
                        name={service.name}
                        typeLabel={typeLabel}
                        deleted={service.deleted}
                        status={<InstalledServiceContainerStatus isOnline={service.container_running} />}
                    />
                </TableCell>
                <TableCell>
                    <InstalledServiceMetadataSummary
                        items={[
                            {label: "Author", value: service.author},
                            {label: "Version", value: service.semver, chip: true},
                            {label: "Supported OS", value: supportedOS},
                            {label: "Wrapper rules", value: service.wrapper ? `${wrapperRuleCount} configured` : undefined},
                        ]}
                        description={service.note}
                    />
                </TableCell>
                <TableCell>
                    <MythicCluster component="div" gap="xs" align="center">
                    <MythicStyledTooltip title={"Documentation"}>
                        <MythicActionButton iconOnly tone="info"

                            href={service.wrapper ? "/docs/wrappers/" + service.name : "/docs/agents/" + service.name}
                            target="_blank"
                            size="small">
                            <MenuBookIcon fontSize="small" />
                        </MythicActionButton>
                    </MythicStyledTooltip>
                    <MythicStyledTooltip title={"Build Parameters"}>
                        <MythicActionButton iconOnly tone="info"

                            onClick={()=>{setOpenBuildingDialog(true);}}
                            size="small">
                            <TuneIcon fontSize="small" />
                        </MythicActionButton>
                    </MythicStyledTooltip>
                    <MythicStyledTooltip title={"Save/Edit Build Parameter Instances"}>
                        <MythicActionButton iconOnly tone="info"

                            onClick={()=>{setOpenBuildParameterInstancesDialog(true);}}
                            size="small">
                            <SaveIcon fontSize="small" />
                        </MythicActionButton>
                    </MythicStyledTooltip>
                    <MythicStyledTooltip title={"Commands"}>
                        <MythicActionButton iconOnly tone="info"

                            onClick={()=>{setOpenCommandsDialog(true)}}
                            size="small">
                            <TerminalIcon fontSize="small" />
                        </MythicActionButton>
                    </MythicStyledTooltip>
                    <MythicStyledTooltip title={service.container_running ? "View Files" : "Unable to view files because container is offline"}>
                        <MythicActionButton iconOnly tone="info"

                            disabled={!service.container_running}
                            onClick={()=>{setOpenListFilesDialog(true);}}
                            size="small">
                            <AttachFileIcon fontSize="small" />
                        </MythicActionButton>
                    </MythicStyledTooltip>
                    </MythicCluster>
                </TableCell>
            </TableRow>
            {openDelete &&
                <MythicConfirmDialog onClose={() => {setOpenDeleteDialog(false);}} onSubmit={onAcceptDelete}
                                     open={openDelete}
                                     acceptText={service.deleted ? "Restore" : "Remove"}
                                     acceptColor={service.deleted ? "success": "error"} />
            }
            {openBuildingDialog &&
                <MythicDialog fullWidth={true} maxWidth="lg" open={openBuildingDialog}
                              onClose={()=>{setOpenBuildingDialog(false);}}
                              innerDialog={<PayloadTypeBuildDialog {...service} onClose={()=>{setOpenBuildingDialog(false);}}
                                                                   payload_name={service.name} />}
                />}
            {openBuildParameterInstancesDialog &&
                <MythicDialog fullWidth={true} maxWidth="xl" open={openBuildParameterInstancesDialog}
                              onClose={()=>{setOpenBuildParameterInstancesDialog(false);}}
                              innerDialog={<PayloadTypeBuildParameterInstancesDialog {...service}
                                  onClose={()=>{setOpenBuildParameterInstancesDialog(false);}} />}
                />}
            {openCommandsDialog &&
                <MythicDialog fullWidth={true} maxWidth="lg" open={openCommandsDialog}
                              onClose={()=>{setOpenCommandsDialog(false);}}
                              innerDialog={<PayloadTypeCommandDialog service={service} onClose={()=>{setOpenCommandsDialog(false);}}
                                                                   payload_name={service.name} />}
                />}
            {openListFilesDialog &&
                <MythicDialog fullWidth={true} maxWidth="md" open={openListFilesDialog}
                              onClose={()=>{setOpenListFilesDialog(false);}}
                              innerDialog={<C2ProfileListFilesDialog container_name={service.name} {...service} onClose={()=>{setOpenListFilesDialog(false);}} />}
                />
            }
        </>

    );
}
