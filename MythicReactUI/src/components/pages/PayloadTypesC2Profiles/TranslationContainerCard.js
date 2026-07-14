import TableCell from '@mui/material/TableCell';
import React from 'react';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import { faLanguage } from '@fortawesome/free-solid-svg-icons';
import {useMutation, gql} from '@apollo/client';
import {snackActions} from '../../utilities/Snackbar';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import {MythicConfirmDialog} from '../../MythicComponents/MythicConfirmDialog';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreFromTrashOutlinedIcon from '@mui/icons-material/RestoreFromTrashOutlined';
import TableRow from '@mui/material/TableRow';
import {MythicStyledTooltip} from "../../MythicComponents/MythicStyledTooltip";
import {MythicDialog} from "../../MythicComponents/MythicDialog";
import {C2ProfileListFilesDialog} from "./C2ProfileListFilesDialog";
import {InstalledServiceContainerStatus} from "./InstalledServiceStatus";
import {
    InstalledServiceIdentity,
    InstalledServiceMetadataSummary
} from "./InstalledServiceTableComponents";
import {MythicCluster} from "../../MythicComponents/MythicLayout";
import {MythicActionButton} from "../../MythicComponents/MythicContent";

const toggleDeleteStatus = gql`
mutation toggleC2ProfileDeleteStatus($translationcontainer_id: Int!, $deleted: Boolean!){
  update_translationcontainer_by_pk(pk_columns: {id: $translationcontainer_id}, _set: {deleted: $deleted}) {
    id
  }
}
`;

export function TranslationContainerRow({service, showDeleted}) {
  const [openListFilesDialog, setOpenListFilesDialog] = React.useState(false);
  const [openDelete, setOpenDeleteDialog] = React.useState(false);
  const [updateDeleted] = useMutation(toggleDeleteStatus, {
      onCompleted: data => {
      },
      onError: error => {
          if(service.deleted){
              snackActions.error("Failed to restore translation profile");
          } else {
              snackActions.error("Failed to mark translation profile as deleted");
          }
      }
    });
    const onAcceptDelete = () => {
      updateDeleted({variables: {translationcontainer_id: service.id, deleted: !service.deleted}})
      setOpenDeleteDialog(false);
    }
    if(service.deleted && !showDeleted){
        return null;
    }
    const supportedAgents = (service.payloadtypes || []).filter(pt => !pt.deleted).map((pt) => pt.name);
  return (
    <>
        <TableRow hover>
            <TableCell>
                {service.deleted ? (
                    <MythicActionButton iconOnly tone="success" emphasis="always"  size="small" onClick={()=>{setOpenDeleteDialog(true);}}><RestoreFromTrashOutlinedIcon fontSize="small" /></MythicActionButton>
                ) : (
                    <MythicActionButton iconOnly tone="error"  size="small" onClick={()=>{setOpenDeleteDialog(true);}}><DeleteIcon fontSize="small" /></MythicActionButton>
                )}
                {openDelete &&
                    <MythicConfirmDialog onClose={() => {setOpenDeleteDialog(false);}} onSubmit={onAcceptDelete}
                                         open={openDelete}
                                         acceptText={service.deleted ? "Restore" : "Remove"}
                                         acceptColor={service.deleted ? "success": "error"} />
                }
            </TableCell>
            <TableCell>
                <FontAwesomeIcon icon={faLanguage} style={{width: "80px", height: "80px"}} />
            </TableCell>
            <TableCell>
                <InstalledServiceIdentity
                    name={service.name}
                    typeLabel="Translation"
                    deleted={service.deleted}
                    status={<InstalledServiceContainerStatus isOnline={service.container_running} />}
                />
            </TableCell>
            <TableCell>
                <InstalledServiceMetadataSummary
                    items={[
                        {label: "Author", value: service.author},
                        {label: "Version", value: service.semver, chip: true},
                        {label: "Supported Agents", value: supportedAgents},
                    ]}
                    description={service.description}
                />
            </TableCell>
            <TableCell>
                <MythicCluster component="div" gap="xs" align="center">
                <MythicStyledTooltip title={"Documentation"}>
                    <MythicActionButton iconOnly tone="info"

                        href={"/docs/c2-profiles/" + service.name.toLowerCase()}
                        target="_blank"
                        size="small">
                        <MenuBookIcon fontSize="small" />
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
            {openListFilesDialog &&
                <MythicDialog fullWidth={true} maxWidth="md" open={openListFilesDialog}
                              onClose={()=>{setOpenListFilesDialog(false);}}
                              innerDialog={<C2ProfileListFilesDialog container_name={service.name} {...service} onClose={()=>{setOpenListFilesDialog(false);}} />}
                />
            }
        </>

  );
}
