import TableCell from '@mui/material/TableCell';
import React from 'react';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import {useMutation, gql} from '@apollo/client';
import {snackActions} from '../../utilities/Snackbar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faFolderOpen} from '@fortawesome/free-solid-svg-icons';
import {MythicConfirmDialog} from '../../MythicComponents/MythicConfirmDialog';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreFromTrashOutlinedIcon from '@mui/icons-material/RestoreFromTrashOutlined';
import TableRow from '@mui/material/TableRow';
import {MythicStyledTooltip} from "../../MythicComponents/MythicStyledTooltip";
import {MythicDialog} from "../../MythicComponents/MythicDialog";
import {C2ProfileListFilesDialog} from "./C2ProfileListFilesDialog";
import {InstalledServiceContainerStatus} from "./InstalledServiceStatus";
import {
    InstalledServiceDefinitionList,
    InstalledServiceDetailRow,
    InstalledServiceDetailSection,
    InstalledServiceDetailToggle,
    InstalledServiceIdentity,
    InstalledServiceListValue
} from "./InstalledServiceTableComponents";
import {MythicStack, MythicCluster, MythicTruncatedText} from "../../MythicComponents/MythicLayout";
import {MythicActionButton} from "../../MythicComponents/MythicContent";

const toggleDeleteStatus = gql`
mutation toggleCustomBrowserDeleteStatus($custombrowser_id: Int!, $deleted: Boolean!){
  update_custombrowser_by_pk(pk_columns: {id: $custombrowser_id}, _set: {deleted: $deleted}) {
    id
  }
}
`;

export function CustomBrowserRow({service, showDeleted}) {
  const [openListFilesDialog, setOpenListFilesDialog] = React.useState(false);
  const [openDelete, setOpenDeleteDialog] = React.useState(false);
  const [openDetails, setOpenDetails] = React.useState(false);
  const [updateDeleted] = useMutation(toggleDeleteStatus, {
      onCompleted: data => {
      },
      onError: error => {
          if(service.deleted){
              snackActions.error("Failed to restore browser");
          } else {
              snackActions.error("Failed to mark browser as deleted");
          }
      }
    });
  const onAcceptDelete = () => {
      updateDeleted({variables: {custombrowser_id: service.id, deleted: !service.deleted}})
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
                <FontAwesomeIcon icon={faFolderOpen} style={{width: "60px", height: "60px"}} />
            </TableCell>
            <TableCell>
                <InstalledServiceIdentity
                    name={service.name}
                    typeLabel={service.type}
                    deleted={service.deleted}
                    status={<InstalledServiceContainerStatus isOnline={service.container_running} />}
                />
            </TableCell>
            <TableCell>
                <MythicStack component="div" gap="sm" className="mythic-installed-service-browser-metadata">
                    {service.author &&
                        <MythicTruncatedText component="div" className="mythic-installed-service-browser-author mythic-font-size-small mythic-text-primary" title={service.author}>
                            {service.author}
                        </MythicTruncatedText>
                    }
                    <MythicCluster component="div" gap="none" className="mythic-installed-service-browser-metrics">
                        {service.semver &&
                            <MythicCluster component="span" gap="xs" inline wrap={false} className="mythic-installed-service-browser-metric">
                                <span>Version</span>
                                <InstalledServiceListValue value={[service.semver]} limit={1} />
                            </MythicCluster>
                        }
                        <MythicCluster component="span" gap="xs" inline wrap={false} className="mythic-installed-service-browser-metric">
                            <span>Export</span>
                            <strong>{service.export_function === "" ? "False" : "True"}</strong>
                        </MythicCluster>
                        <MythicCluster component="span" gap="xs" inline wrap={false} className="mythic-installed-service-browser-metric">
                            <span>Row actions</span>
                            <strong>{(service.row_actions || []).length}</strong>
                        </MythicCluster>
                        <MythicCluster component="span" gap="xs" inline wrap={false} className="mythic-installed-service-browser-metric">
                            <span>Columns</span>
                            <strong>{(service.columns || []).length}</strong>
                        </MythicCluster>
                        <MythicCluster component="span" gap="xs" inline wrap={false} className="mythic-installed-service-browser-metric">
                            <span>Inputs</span>
                            <strong>{(service.extra_table_inputs || []).length}</strong>
                        </MythicCluster>
                    </MythicCluster>
                    {service.description &&
                        <div className="mythic-installed-service-description mythic-min-width-0 mythic-text-secondary" title={service.description}>
                            <span>Description</span>
                            <p className="mythic-overflow-hidden">{service.description}</p>
                        </div>
                    }
                </MythicStack>
            </TableCell>
            <TableCell>
                <MythicCluster component="div" gap="xs" align="center">
                    <MythicStyledTooltip title={service.container_running ? "View Files" : "Unable to view files because container is offline"}>
                        <MythicActionButton iconOnly tone="info"

                            disabled={!service.container_running}
                            onClick={()=>{setOpenListFilesDialog(true);}}
                            size="small">
                            <AttachFileIcon fontSize="small" />
                        </MythicActionButton>
                    </MythicStyledTooltip>
                    <InstalledServiceDetailToggle open={openDetails} onClick={() => setOpenDetails((current) => !current)} />
                </MythicCluster>
            </TableCell>
        </TableRow>
        <InstalledServiceDetailRow open={openDetails} colSpan={5}>
            <InstalledServiceDetailSection title="Custom row actions" count={(service.row_actions || []).length}>
                <InstalledServiceDefinitionList
                    items={(service.row_actions || []).map((action) => ({
                        title: action.name,
                        subtitle: action.ui_feature,
                    }))}
                    emptyText="No custom row actions."
                />
            </InstalledServiceDetailSection>
            <InstalledServiceDetailSection title="Display columns" count={(service.columns || []).length}>
                <InstalledServiceDefinitionList
                    items={(service.columns || []).map((column) => ({
                        title: column.name,
                        subtitle: column.key,
                    }))}
                    emptyText="No display columns."
                />
            </InstalledServiceDetailSection>
            <InstalledServiceDetailSection title="Extra task inputs" count={(service.extra_table_inputs || []).length}>
                <InstalledServiceDefinitionList
                    items={(service.extra_table_inputs || []).map((input) => ({
                        title: input.display_name,
                        subtitle: input.name,
                        description: input.description,
                    }))}
                    emptyText="No extra task inputs."
                />
            </InstalledServiceDetailSection>
        </InstalledServiceDetailRow>
            {openListFilesDialog &&
                <MythicDialog fullWidth={true} maxWidth="md" open={openListFilesDialog}
                              onClose={()=>{setOpenListFilesDialog(false);}}
                              innerDialog={<C2ProfileListFilesDialog container_name={service.name} {...service} onClose={()=>{setOpenListFilesDialog(false);}} />}
                />
            }
        </>

  );
}
