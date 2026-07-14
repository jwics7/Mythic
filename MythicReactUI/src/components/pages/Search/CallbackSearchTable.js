import React, { useEffect } from 'react';
import {Typography, Link} from '@mui/material';
import { MythicDialog } from '../../MythicComponents/MythicDialog';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import {MythicConfirmDialog} from '../../MythicComponents/MythicConfirmDialog';
import {  useMutation } from '@apollo/client';
import {snackActions} from '../../utilities/Snackbar';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {toggleHideCallbackMutations} from '../Callbacks/CallbackMutations';
import { MythicStyledTooltip } from '../../MythicComponents/MythicStyledTooltip';
import {DetailedCallbackTable} from '../Callbacks/DetailedCallbackTable';
import InfoIconOutline from '@mui/icons-material/InfoOutlined';
import {MythicAgentSVGIcon} from "../../MythicComponents/MythicAgentSVGIcon";
import {CallbacksTableLastCheckinCell} from "../Callbacks/CallbacksTableRow";
import {MythicStatusChip} from "../../MythicComponents/MythicStatusChip";
import {MythicCluster} from "../../MythicComponents/MythicLayout";
import {MythicActionButton} from "../../MythicComponents/MythicContent";



export function CallbackSearchTable(props){
    const [callbacks, setCallbacks] = React.useState([]);
    useEffect( () => {
        setCallbacks([...props.callbacks]);
    }, [props.callbacks]);

    const onEditDeleted = ({id, active}) => {
        const updates = callbacks.map( (cred) => {
            if(cred.id === id){
                return {...cred, active}
            }else{
                return {...cred}
            }
        });
        setCallbacks(updates);
    }

    return (
        <TableContainer className="mythicElement" style={{height: "100%", overflowY: "auto"}}>
            <Table stickyHeader size="small" style={{"maxWidth": "100%", "overflow": "auto", tableLayout: "fixed"}}>
                <TableHead>
                    <TableRow>
                        <TableCell style={{width: "3rem"}}>View</TableCell>
                        <TableCell style={{width: "11rem"}}>Status</TableCell>
                        <TableCell >User</TableCell>
                        <TableCell >Domain</TableCell>
                        <TableCell >Host</TableCell>
                        <TableCell> PID</TableCell>
                        <TableCell >Last Checkin</TableCell>
                        <TableCell >Description</TableCell>
                        <TableCell >IP</TableCell>
                        <TableCell style={{width: "5rem"}}>ID</TableCell>
                        <TableCell style={{width: "60px"}}>Agent</TableCell>
                        <TableCell style={{width: "3rem"}}></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                
                {callbacks.map( (op) => (
                    <CallbackSearchTableRow
                        key={"cred" + op.id}
                        onEditDeleted={onEditDeleted}
                        {...op}
                    />
                ))}
                </TableBody>
            </Table>
        </TableContainer>
    )
}

function CallbackSearchTableRow(props){
    const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);
    const [openMetaDialog, setOpenMetaDialog] = React.useState(false);
    const [updateDeleted] = useMutation(toggleHideCallbackMutations, {
        onCompleted: (data) => {
            snackActions.success("Updated active status");
            props.onEditDeleted({id: props.id, active: !props.active});
        },
        onError: (data) => {
            snackActions.error("Operation not allowed");
        }
    });
    const ips = JSON.parse(props.ip);
    const onAcceptDelete = () => {
        updateDeleted({variables: {callback_display_id: props.display_id, active: !props.active}})
    }
    return (
        <React.Fragment>
            <TableRow hover style={{backgroundColor: props.color}}>
                {openDeleteDialog &&
                    <MythicConfirmDialog onClose={() => {setOpenDeleteDialog(false);}} onSubmit={onAcceptDelete} open={openDeleteDialog} acceptText={props.active ? "Hide" : "Restore" }/>
                }
                <TableCell>{!props.active ? (
                    <MythicStyledTooltip title="Restore Callback for Tasking">
                        <MythicActionButton iconOnly tone="error" emphasis="always"  size="small" onClick={()=>{setOpenDeleteDialog(true);}}><VisibilityOffIcon fontSize="small" /></MythicActionButton>
                    </MythicStyledTooltip>
                ) : (
                    <MythicStyledTooltip title="Hide Callback so it can't be used in Tasking">
                        <MythicActionButton iconOnly tone="success" emphasis="always"  size="small" onClick={()=>{setOpenDeleteDialog(true);}}><VisibilityIcon fontSize="small" /></MythicActionButton>
                    </MythicStyledTooltip>
                )} </TableCell>
                <TableCell>
                    <MythicCluster component="div" gap="xs" className="mythic-status-stack">
                        <MythicStatusChip
                            label={props.active ? "Active" : "Inactive"}
                            status={props.active ? "active" : "inactive"}
                        />
                        {props.locked &&
                            <MythicStatusChip label="Locked" status="locked" />
                        }
                    </MythicCluster>
                </TableCell>
                <TableCell>
                    <Typography variant="body2">{props.user}</Typography>
                </TableCell>
                <TableCell >
                    <Typography variant="body2">{props.domain}</Typography>
                </TableCell>
                <TableCell>{props.host}</TableCell>
                <TableCell>{props.pid}</TableCell>
                <TableCell style={{whiteSpace: "pre"}}>
                    <CallbacksTableLastCheckinCell rowData={{...props}} ></CallbacksTableLastCheckinCell>
                </TableCell>
                <TableCell >
                    <Typography variant="body2" style={{display: "inline-block"}}>{props.description}</Typography>
                </TableCell>
                <TableCell style={{whiteSpace: "pre"}}>
                    {ips.slice(0,1).join("\n")}
                    {ips.length > 1 ? "\n..." : null}
                </TableCell>
                <TableCell>
                <Link color="textPrimary" underline="always" target="_blank"
                        href={"/new/callbacks/" + props.display_id}>
                            C-{props.display_id}
                    </Link>
                </TableCell>
                <TableCell>
                <MythicStyledTooltip title={props.payload.payloadtype.name}>
                    <MythicAgentSVGIcon payload_type={props.payload.payloadtype.name} style={{width: "35px", height: "35px"}} />
                </MythicStyledTooltip>
                </TableCell>
                <TableCell>
                    <MythicStyledTooltip title="View callback details">
                        <MythicActionButton iconOnly tone="info" emphasis="always"  size="small" onClick={() => setOpenMetaDialog(true)}>
                            <InfoIconOutline fontSize="small" />
                        </MythicActionButton>
                    </MythicStyledTooltip>
                    {openMetaDialog && 
                        <MythicDialog fullWidth={true} maxWidth="lg" open={openMetaDialog}
                            onClose={()=>{setOpenMetaDialog(false);}} 
                            innerDialog={<DetailedCallbackTable onClose={()=>{setOpenMetaDialog(false);}} callback_id={props.id} />}
                        />
                    }
                </TableCell>
            </TableRow>
        </React.Fragment>
    )
}
