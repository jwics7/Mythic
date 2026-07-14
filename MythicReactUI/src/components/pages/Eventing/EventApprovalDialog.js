import React from 'react';

import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import {useMutation, gql} from '@apollo/client';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import {toLocalTime} from "../../utilities/Time";
import CheckCircleTwoToneIcon from '@mui/icons-material/CheckCircleTwoTone';
import CancelTwoToneIcon from '@mui/icons-material/CancelTwoTone';
import {snackActions} from "../../utilities/Snackbar";
import {MythicStatusChip} from "../../MythicComponents/MythicStatusChip";
import {MythicTableEmptyState} from "../../MythicComponents/MythicStateDisplay";
import {MythicCluster} from "../../MythicComponents/MythicLayout";
import {MythicActionButton} from "../../MythicComponents/MythicContent";

const updateApprovalStatusMutation = gql`
mutation updateApprovalStatus($eventgroupapproval_id: Int!, $approved: Boolean!) {
  updateEventGroupApproval(eventgroupapproval_id: $eventgroupapproval_id, approved: $approved) {
    status
    error
  }
}
`;

export function EventGroupTableRunAsDialog({eventgroupapprovals, me, onClose, selectedEventGroup}) {
    const [UpdateApprovalStatusMutation] = useMutation(updateApprovalStatusMutation, {
        onCompleted: (data) => {
            if(data.updateEventGroupApproval.status === "success"){
                snackActions.success("Updated approval");
            } else {
                snackActions.error(data.updateEventGroupApproval.error);
            }

        },
        onError: (data) => {
            console.log(data);
            snackActions.error("Failed to update");
        }
    });
    const onApprovalClick = ({id, approved}) => {
        UpdateApprovalStatusMutation({variables: {eventgroupapproval_id: id, approved}})
    }
    const getRunAsHelp = (run_as) => {
        switch(run_as){
            case "bot":
                return "These actions run under a 'bot' account rather than as a normal operator account.";
            case "self":
                return "These actions run under the context of the operator that created the workflow";
            case "trigger":
                return "These actions run under the context of the operator that triggered the workflow";
            default:
                return "These actions run under the context of the identified operator";
        }
    }
    return (
        <React.Fragment>
            <DialogTitle id="form-dialog-title">Approve or Deny Event Workflow Execution Per Operator</DialogTitle>
            <DialogContent dividers={true} style={{maxHeight: "calc(70vh)"}}>
                <DialogContentText>
                    Individual users must approve workflows to run under their account and operation leads must approve bot workflows.<br/>
                    <b>Run as: </b>{selectedEventGroup.run_as} <br/>
                    {getRunAsHelp(selectedEventGroup.run_as)}
                </DialogContentText>
                <TableContainer className="mythicElement">
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Operator</TableCell>
                            <TableCell style={{width: "20rem"}}>Approval Status</TableCell>
                            <TableCell style={{width: "15rem"}}>Last Updated</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {eventgroupapprovals.length === 0 ? (
                            <MythicTableEmptyState
                                colSpan={3}
                                compact
                                title="No approvals needed"
                                description="This workflow does not have pending operator approvals."
                            />
                        ) : (
                            eventgroupapprovals.map( e => (
                                <TableRow key={e.id}>
                                    <TableCell>{e.operator.username}</TableCell>
                                    <TableCell>
                                        {e.approved ? (
                                            <MythicCluster component="div" gap="xs" align="center">
                                                <MythicStatusChip label="Approved" status="success" icon={<CheckCircleTwoToneIcon />} />
                                                <MythicActionButton tone="warning"  disabled={e.operator.id !== me?.user?.id} variant={"contained"}
                                                        startIcon={<CancelTwoToneIcon fontSize="small" />}
                                                        onClick={() => onApprovalClick({id: e.id, approved: false})}>
                                                    Deny
                                                </MythicActionButton>
                                            </MythicCluster>

                                        ) : e.created_at === e.updated_at ? (
                                            <MythicCluster component="div" gap="xs" align="center">
                                                <MythicActionButton tone="success"  disabled={e.operator.id !== me?.user?.id}
                                                        variant={"contained"}
                                                        startIcon={<CheckCircleTwoToneIcon fontSize="small" />}
                                                        onClick={() => onApprovalClick({id: e.id, approved: true})}>
                                                    Approve
                                                </MythicActionButton>
                                                <MythicActionButton tone="warning"  disabled={e.operator.id !== me?.user?.id} variant={"contained"}
                                                        startIcon={<CancelTwoToneIcon fontSize="small" />}
                                                        onClick={() => onApprovalClick({id: e.id, approved: false})}>
                                                    Deny
                                                </MythicActionButton>
                                            </MythicCluster>
                                        ) : (
                                            <MythicCluster component="div" gap="xs" align="center">
                                                <MythicActionButton tone="success"  variant={"contained"}
                                                        disabled={e.operator.id !== me?.user?.id}
                                                        startIcon={<CheckCircleTwoToneIcon fontSize="small" />}
                                                        onClick={() => onApprovalClick({id: e.id, approved: true})}>
                                                    Approve
                                                </MythicActionButton>
                                                <MythicStatusChip label="Denied" status="warning" icon={<CancelTwoToneIcon />} />

                                            </MythicCluster>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {e.created_at !== e.updated_at ? (
                                            toLocalTime(e?.updated_at, me?.user?.view_utc_time)
                                        ) : null}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                </TableContainer>

            </DialogContent>
            <DialogActions>
                <MythicActionButton tone="neutral"  onClick={onClose} variant="contained">
                    Close
                </MythicActionButton>
            </DialogActions>
        </React.Fragment>
    );
}
