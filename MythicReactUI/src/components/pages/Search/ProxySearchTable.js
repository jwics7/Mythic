import React, { useEffect } from 'react';
import {Link} from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Moment from 'react-moment';
import {MythicConfirmDialog} from '../../MythicComponents/MythicConfirmDialog';
import { gql, useMutation } from '@apollo/client';
import {snackActions} from '../../utilities/Snackbar';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import {getStringSize} from '../Callbacks/ResponseDisplayTable';
import {MythicStyledTooltip} from "../../MythicComponents/MythicStyledTooltip";
import {adjustOutput} from "../Eventing/EventGroupInstancesTable";
import SpeedIcon from '@mui/icons-material/Speed';
import {MythicStatusChip} from "../../MythicComponents/MythicStatusChip";
import {MythicStack, MythicCluster} from "../../MythicComponents/MythicLayout";
import {MythicCodeSurface, MythicActionButton, MythicMetadataItem, MythicMetadataValue, MythicText} from "../../MythicComponents/MythicContent";

const toggleProxy = gql`
mutation ToggleProxyMutation($callbackport_id: Int!, $action: String!){
    toggleProxy(callbackport_id: $callbackport_id, action: $action){
        status
        error
    }
}
`;
const testProxyMutation = gql`
mutation TestProxyMutation($callbackport_id: Int!){
    testProxy(callbackport_id: $callbackport_id){
        status
        error
    }
}
`;

export function ProxySearchTable(props){
    const [callbacks, setCallbacks] = React.useState([]);
    useEffect( () => {
        setCallbacks([...props.callbacks]);
    }, [props.callbacks]);

    const onEditDeleted = ({id, deleted}) => {
        const updates = callbacks.map( (cred) => {
            if(cred.id === id){
                return {...cred, deleted: deleted}
            }else{
                return {...cred}
            }
        });
        setCallbacks(updates);
    }

    return (
        <TableContainer className="mythicElement" style={{overflowY: "auto", flexGrow: 1, marginTop: "5px"}}>
            <Table stickyHeader size="small" style={{tableLayout: "fixed"}}>
                <TableHead>
                    <TableRow>
                        <TableCell style={{width: "8rem"}}>State</TableCell>
                        <TableCell >User@Host</TableCell>
                        <TableCell style={{width: "9rem"}}>Task Info</TableCell>
                        <TableCell style={{width: "7rem"}}>Bound Port</TableCell>
                        <TableCell >Remote Connection</TableCell>
                        <TableCell style={{width: "9rem"}}>
                            <MythicStyledTooltip title={"Rx is bytes Mythic received from the agent. Tx is bytes Mythic sent to the agent"} >
                                Total Rx/Tx
                            </MythicStyledTooltip>
                        </TableCell>
                        <TableCell style={{width: "7rem"}}>Proxy Type</TableCell>
                        <TableCell style={{width: "9rem"}}>Last Updated</TableCell>
                        <TableCell style={{width: "4rem"}}></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>

                {callbacks.map( (op) => (
                    (props.showDeleted || !op.deleted) &&
                    <ProxySearchTableRow
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

function ProxySearchTableRow(props){
    const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);
    const confirmDialogText = "This does not issue any start/stop command to the agent. This only opens/closes ports that Mythic controls. For rpfwd, this will not open/close that port on the remote host - you need to issue a task to your agent to do that.";
    const [updateDeleted] = useMutation(toggleProxy, {
        onCompleted: (data) => {
            if (data.toggleProxy.status === "success"){
                if(props.deleted){
                    snackActions.success("Started proxy on that Port");
                    props.onEditDeleted({id: props.id, deleted: false});
                } else {
                    snackActions.success("Stopped proxy on that Port");
                    props.onEditDeleted({id: props.id, deleted: true});
                }
            } else {
                snackActions.error(data.toggleProxy.error);
            }
        },
        onError: (data) => {
            snackActions.error("Operation not allowed");
        }
    });
    const [testProxy] = useMutation(testProxyMutation, {
        onCompleted: (data) => {
            if (data.testProxy.status === "success"){
                snackActions.success("Initiating connection test");
            } else {
                snackActions.error(data.testProxy.error);
            }
        },
        onError: (data) => {
            snackActions.error("Operation not allowed");
        }
    });
    const onAcceptDelete = () => {
        let action = "start";
        if(props.deleted){
            action = "start";
        } else {
            action = "stop";
        }
        updateDeleted({variables: {callbackport_id: props.id, action: action}})
    }
    const onTestProxy = () => {
        testProxy({variables: {callbackport_id: props.id}});
    }
    return (
        <React.Fragment>
            <TableRow hover>
                {openDeleteDialog &&
                    <MythicConfirmDialog onClose={() => {setOpenDeleteDialog(false);}} onSubmit={onAcceptDelete}
                                         open={openDeleteDialog} acceptText={props.deleted ? "Restart Proxy" : "Stop Proxy"}
                                         acceptColor={props.deleted ? "success" : "error"}
                                         dialogText={confirmDialogText}
                    />
                }
                <TableCell>
                    <MythicCluster component="div" gap="xs" align="center" wrap={false} className="mythic-search-result-action-row">
                        {props.deleted ? (
                            <MythicStyledTooltip title="Start Proxy Port on Mythic Server">
                                <MythicActionButton iconOnly tone="success"

                                    size="small"
                                    onClick={()=>{setOpenDeleteDialog(true);}}
                                >
                                    <RestoreFromTrashIcon fontSize="small" />
                                </MythicActionButton>
                            </MythicStyledTooltip>
                        ) :
                            (<MythicStyledTooltip title="Stop Proxy Port on Mythic Server">
                                <MythicActionButton iconOnly tone="error"

                                    size="small"
                                    onClick={()=>{setOpenDeleteDialog(true);}}
                                >
                                    <DeleteIcon fontSize="small" />
                                </MythicActionButton>
                            </MythicStyledTooltip>
                            )}
                        <MythicStatusChip size="compact" label={props.deleted ? "Stopped" : "Running"} status={props.deleted ? "disabled" : "active"} />
                    </MythicCluster>
                </TableCell>
                <TableCell>
                    <MythicStack component="div" gap="none" className="mythic-search-result-stack">
                        <MythicText component="div" preset="value" className="mythic-search-result-primary">{props.callback.user}@{props.callback.host}</MythicText>
                        {props.callback.description &&
                            <MythicMetadataValue component="div" size="caption" tone="secondary" className="mythic-search-result-secondary">{props.callback.description}</MythicMetadataValue>
                        }
                    </MythicStack>
                </TableCell>
                <TableCell>
                    <MythicCluster component="div" gap="xs" inline className="mythic-search-result-link-row">
                        <Link color="textPrimary" underline="always" target="_blank"
                            href={"/new/callbacks/" + props.callback.display_id}>
                                C-{props.callback.display_id}
                        </Link>
                        <MythicMetadataValue component="span" size="caption" tone="secondary" className="mythic-search-result-secondary">/</MythicMetadataValue>
                        <Link color="textPrimary" underline="always" target="_blank"
                              href={"/new/task/" + props.task.display_id}>
                            T-{props.task.display_id}
                        </Link>
                    </MythicCluster>
                </TableCell>
                <TableCell>
                    <MythicCodeSurface component="span" density="compact" overflow="visible" tone="snippet">{props.local_port}</MythicCodeSurface>
                </TableCell>
                <TableCell>
                    <MythicStack component="div" gap="none" className="mythic-search-result-stack">
                    {props.remote_port !== 0 &&
                        <MythicText component="div" preset="value" className="mythic-search-result-primary">{props.remote_ip}:{props.remote_port}</MythicText>
                    }
                    {props.remote_port === 0 &&
                        <MythicMetadataValue component="div" size="caption" tone="secondary" className="mythic-search-result-secondary">No remote endpoint</MythicMetadataValue>
                    }
                    {props.username !== "" &&
                        <MythicStack component="div" gap="none" className="mythic-search-result-stack">
                            <MythicMetadataItem className="mythic-search-result-inline" density="compact" layout="inline" label="Auth">{props.username}</MythicMetadataItem>
                            <MythicMetadataItem className="mythic-search-result-inline" density="compact" layout="inline" label="Password">{props.password}</MythicMetadataItem>
                        </MythicStack>
                    }
                    </MythicStack>
                </TableCell>
                <TableCell>
                    <MythicStack component="div" gap="none" className="mythic-search-result-stack">
                        <MythicCluster component="span" gap="xs" inline wrap={false} className="mythic-search-result-metric mythic-border mythic-border-radius">
                            <MythicStyledTooltip title={"Rx is bytes Mythic received from the agent"}>
                                <span className="mythic-search-result-metric-label mythic-font-size-xs mythic-font-weight-strong mythic-text-secondary">Rx</span>
                            </MythicStyledTooltip>
                            <MythicMetadataValue component="span" className="mythic-search-result-value">{getStringSize({cellData: {"plaintext": String(props.bytes_received)}})}</MythicMetadataValue>
                        </MythicCluster>
                        <MythicCluster component="span" gap="xs" inline wrap={false} className="mythic-search-result-metric mythic-border mythic-border-radius">
                            <MythicStyledTooltip title={"Tx is bytes Mythic sent to the agent"}>
                                <span className="mythic-search-result-metric-label mythic-font-size-xs mythic-font-weight-strong mythic-text-secondary">Tx</span>
                            </MythicStyledTooltip>
                            <MythicMetadataValue component="span" className="mythic-search-result-value">{getStringSize({cellData: {"plaintext": String(props.bytes_sent)}})}</MythicMetadataValue>
                        </MythicCluster>
                    </MythicStack>
                </TableCell>
                <TableCell>
                    <MythicStatusChip size="compact" label={props.port_type} status="neutral" />
                </TableCell>
                <TableCell>
                    <Moment filter={(newTime) => adjustOutput(props, newTime)} interval={1000}
                            parse={"YYYY-MM-DDTHH:mm:ss.SSSSSSZ"}
                            withTitle
                            titleFormat={"YYYY-MM-DD HH:mm:ss"}
                            fromNow ago
                    >
                        {props.updated_at + "Z"}
                    </Moment>
                </TableCell>
                <TableCell>
                    {props.remote_port !== 0 &&
                        <MythicStyledTooltip title={"Test Remote Connection"} >
                            <MythicActionButton iconOnly tone="success"

                                size="small"
                                onClick={onTestProxy}
                            >
                                <SpeedIcon fontSize="small" />
                            </MythicActionButton>
                        </MythicStyledTooltip>
                    }
                </TableCell>
            </TableRow>
        </React.Fragment>
    )
}
