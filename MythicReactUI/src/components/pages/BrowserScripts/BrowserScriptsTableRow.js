import TableCell from '@mui/material/TableCell';
import React from 'react';

import { Switch } from '@mui/material';
import TableRow from '@mui/material/TableRow';
import { MythicDialog } from '../../MythicComponents/MythicDialog';
import {EditScriptDialog} from './EditScriptDialog';
import EditIcon from '@mui/icons-material/Edit';
import {MythicStyledTooltip} from "../../MythicComponents/MythicStyledTooltip";
import {MythicAgentSVGIcon} from "../../MythicComponents/MythicAgentSVGIcon";
import {MythicStatusChip} from "../../MythicComponents/MythicStatusChip";
import {MythicCluster, MythicStack, MythicTruncatedText} from "../../MythicComponents/MythicLayout";
import {MythicActionButton} from "../../MythicComponents/MythicContent";

export function BrowserScriptsTableRow(props){
    const [openEdit, setOpenEdit] = React.useState(false);
    const onSubmitEdit = ({script, command_id, payload_type_id}) => {
        props.onSubmitEdit({browserscript_id: props.id, script, command_id, payload_type_id});
    }
    const onRevert = () => {
        props.onRevert({browserscript_id: props.id, script: props.container_version});
    }
    const onToggleActive = () => {
        props.onToggleActive({browserscript_id: props.id, active: !props.active});
    }
    return (
        <React.Fragment>
            <TableRow className={props.active ? "" : "mythic-browser-script-row-disabled"} key={"payload" + props.id} hover>
                <TableCell>
                    <MythicCluster gap="sm" align="center" wrap={false} className="mythic-browser-script-script-cell">
                        <MythicStyledTooltip title={props.payloadtype.name}>
                            <MythicCluster gap="none" justify="center" inline wrap={false} className="mythic-browser-script-payload-icon mythic-surface-subtle mythic-border-radius mythic-flex-fixed mythic-border">
                                <MythicAgentSVGIcon payload_type={props.payloadtype.name} style={{width: "32px", height: "32px"}} />
                            </MythicCluster>
                        </MythicStyledTooltip>
                        <MythicStack gap="none" className="mythic-browser-script-script-copy">
                            <MythicTruncatedText component="div" className="mythic-browser-script-command-name mythic-font-size-body-small mythic-font-weight-strong mythic-line-height-snug mythic-text-primary">{props.command.cmd}</MythicTruncatedText>
                            <MythicTruncatedText component="div" className="mythic-browser-script-payload-name mythic-font-size-caption mythic-font-weight-semibold mythic-line-height-snug mythic-text-secondary">{props.payloadtype.name}</MythicTruncatedText>
                        </MythicStack>
                    </MythicCluster>
                </TableCell>
                <TableCell>{props.author}</TableCell>
                <TableCell>
                    <MythicCluster gap="sm" align="center" wrap={false} className="mythic-browser-script-active-cell">
                        <Switch
                            checked={props.active}
                            onChange={onToggleActive}
                            color="success"
                            inputProps={{ 'aria-label': 'Toggle browser script active state', "track": "white" }}
                            name="Active"
                            size="small"
                          />
                        <MythicStatusChip label={props.active ? "Active" : "Disabled"} status={props.active ? "active" : "disabled"} />
                    </MythicCluster>
                </TableCell>
                <TableCell>
                    <MythicStatusChip label={props.user_modified ? "User modified" : "Container default"} status={props.user_modified ? "warning" : "neutral"} />
                </TableCell>
                <TableCell align="center">
                    <MythicCluster gap="xs" align="center" justify="center" wrap={false} className="mythic-browser-script-actions">
                        <MythicActionButton iconOnly tone="info"  size="small" onClick={()=>{setOpenEdit(true);}}>
                            <EditIcon fontSize="small" />
                        </MythicActionButton>
                    </MythicCluster>
                </TableCell>
                <TableCell className="mythic-browser-script-spacer-cell mythic-min-width-0" />

                {openEdit &&
                    <MythicDialog fullWidth={true} maxWidth="xl" open={openEdit} 
                        onClose={()=>{setOpenEdit(false);}} 
                        innerDialog={
                            <EditScriptDialog me={props.me} onClose={()=>{setOpenEdit(false);}} payload_type_id={props.payloadtype.id} command_id={props.command.id}
                                script={props.script} onSubmitEdit={onSubmitEdit} onRevert={onRevert} author={props.author}/>
                        } />
                    }
            </TableRow>
        </React.Fragment>
        )
}
