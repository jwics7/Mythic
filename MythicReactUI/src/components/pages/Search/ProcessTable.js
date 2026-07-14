import React, { useEffect } from 'react';
import {Link} from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { MythicDialog, MythicModifyStringDialog, MythicViewJSONAsTableDialog } from '../../MythicComponents/MythicDialog';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import { gql, useMutation } from '@apollo/client';
import {snackActions} from '../../utilities/Snackbar';
import EditIcon from '@mui/icons-material/Edit';
import {TagsDisplay, ViewEditTags} from '../../MythicComponents/MythicTag';
import { MythicStyledTooltip } from '../../MythicComponents/MythicStyledTooltip';
import {MythicStatusChip} from "../../MythicComponents/MythicStatusChip";
import {MythicStack, MythicCluster} from "../../MythicComponents/MythicLayout";
import {MythicActionButton, MythicMetadataItem, MythicMetadataValue, MythicMetadataLabel} from "../../MythicComponents/MythicContent";

const singleLineCellStyle = {
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
};

const updateFileComment = gql`
mutation updateCommentMutation($mythictree_id: Int!, $comment: String!){
    update_mythictree_by_pk(pk_columns: {id: $mythictree_id}, _set: {comment: $comment}) {
        comment
        id
    }
}
`;

export function ProcessTable(props){
    const [files, setFiles] = React.useState([]);
    useEffect( () => {
        setFiles([...props.processes]);
    }, [props.processes]);
    const onEditComment = ({id, comment}) => {
        const updates = files.map( (file) => {
            if(file.id === id){
                return {...file, comment}
            }else{
                return {...file}
            }
        });
        setFiles(updates);
    }
    return (
        <TableContainer className="mythicElement" style={{height: "100%", overflowY: "auto"}} >
            <Table stickyHeader size="small" style={{"tableLayout": "fixed", "maxWidth": "100%", "overflow": "scroll"}}>
                <TableHead>
                    <TableRow>
                        <TableCell style={{width: "5rem"}}>Metadata</TableCell>
                        <TableCell style={{width: "6rem"}}> PID </TableCell>
                        <TableCell >Info</TableCell>
                        <TableCell >Name</TableCell>
                        <TableCell style={{width: "15rem"}}>Comment</TableCell>
                        <TableCell style={{width: "10rem"}}>Tags</TableCell>

                    </TableRow>
                </TableHead>
                <TableBody>

                {files.map( (op) => (
                    <ProcessTableRow
                        key={"process" + op.id}
                        me={props.me}
                        onEditComment={onEditComment}
                        {...op}
                    />
                ))}
                </TableBody>
            </Table>
        </TableContainer>
    )
}
function ProcessTableRow(props){
    const me = props.me;
    const [viewPermissionsDialogOpen, setViewPermissionsDialogOpen] = React.useState(false);
    const [editCommentDialogOpen, setEditCommentDialogOpen] = React.useState(false);
    const [updateComment] = useMutation(updateFileComment, {
        onCompleted: (data) => {
            snackActions.success("updated comment");
            props.onEditComment(data.update_mythictree_by_pk)
        }
    });
    const onSubmitUpdatedComment = (comment) => {
        updateComment({variables: {mythictree_id: props.id, comment: comment}})
    }
    return (
        <React.Fragment>
            <TableRow hover>
                {viewPermissionsDialogOpen && <MythicDialog fullWidth={true} maxWidth="md" open={viewPermissionsDialogOpen}
                    onClose={()=>{setViewPermissionsDialogOpen(false);}}
                    innerDialog={<MythicViewJSONAsTableDialog title="View Permissions Data" leftColumn="Permission" rightColumn="Value" value={props.metadata} onClose={()=>{setViewPermissionsDialogOpen(false);}} />}
                    />
                }
                {editCommentDialogOpen && <MythicDialog fullWidth={true} maxWidth="md" open={editCommentDialogOpen}
                    onClose={()=>{setEditCommentDialogOpen(false);}}
                    innerDialog={<MythicModifyStringDialog title="Edit File Browser Comment" onSubmit={onSubmitUpdatedComment} value={props.comment} onClose={()=>{setEditCommentDialogOpen(false);}} />}
                />
                }
                <TableCell>
                    <MythicStyledTooltip title="View permissions data">
                        <MythicActionButton iconOnly tone="info"

                            size="small"
                            onClick={() => setViewPermissionsDialogOpen(true)}
                        >
                            <PlaylistAddCheckIcon fontSize="small" />
                        </MythicActionButton>
                    </MythicStyledTooltip>
                </TableCell>
                <TableCell>
                    <MythicMetadataValue component="div"
                        className="mythic-search-result-value"
                        style={{...singleLineCellStyle, textDecoration: props.deleted ? "line-through" : ""}}
                        title={props.full_path_text}
                    >
                        {props.full_path_text}
                    </MythicMetadataValue>
                </TableCell>
                <TableCell>
                    <MythicStack component="div" gap="none" className="mythic-search-result-stack">
                        <MythicMetadataItem className="mythic-search-result-inline" density="compact" layout="inline" label="Host">{props.host}</MythicMetadataItem>
                        {props.callback ? (
                            <MythicCluster component="div" gap="xs" inline className="mythic-search-result-link-row">
                                <MythicMetadataLabel component="span" size="xs" className="mythic-search-result-label">Callback</MythicMetadataLabel>
                                <Link color="textPrimary" underline="always" target="_blank"
                                      href={"/new/callbacks/" + props.callback.display_id}>
                                    C-{props.callback.display_id}
                                </Link>
                                {props.task ? (
                                    <>
                                        <MythicMetadataValue component="span" size="caption" tone="secondary" className="mythic-search-result-secondary">/</MythicMetadataValue>
                                        <Link color="textPrimary" underline="always" target="_blank"
                                              href={"/new/task/" + props.task.display_id}>
                                            T-{props.task.display_id}
                                        </Link>
                                    </>
                                ) : null}
                            </MythicCluster>
                        ) : null}
                        {props.callback?.mythictree_groups.length > 0 ? (
                            <MythicMetadataValue component="div" size="caption" tone="secondary" className="mythic-search-result-secondary">
                                Groups: {props?.callback.mythictree_groups.join(", ")}
                            </MythicMetadataValue>
                        ) : null}
                    </MythicStack>
                </TableCell>

                <TableCell>
                    <MythicStack component="div" gap="none" className="mythic-search-result-stack">
                        <MythicMetadataValue component="div" className="mythic-search-result-value" style={singleLineCellStyle} title={props.name_text}>
                            {props.name_text}
                        </MythicMetadataValue>
                        {props.deleted &&
                            <MythicStatusChip size="compact" label="Deleted" status="disabled" />
                        }
                    </MythicStack>
                </TableCell>
                <TableCell>
                    <MythicCluster component="div" gap="xs" align="center" wrap={false} className="mythic-search-result-action-row">
                        <MythicActionButton iconOnly tone="info"

                            onClick={() => setEditCommentDialogOpen(true)}
                            size="small"
                        >
                            <EditIcon fontSize="small" />
                        </MythicActionButton>
                        <MythicMetadataValue component="span" size="caption" tone="secondary" className="mythic-search-result-secondary">{props.comment || "No comment"}</MythicMetadataValue>
                    </MythicCluster>
                    </TableCell>
                <TableCell>
                    <ViewEditTags target_object={"mythictree_id"} target_object_id={props.id} me={me} />
                    <TagsDisplay tags={props.tags} />
                </TableCell>

            </TableRow>
        </React.Fragment>
    )
}
