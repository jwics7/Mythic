import React, { useEffect } from 'react';
import {Typography, Link} from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { MythicDialog, MythicModifyStringDialog, MythicViewJSONAsTableDialog } from '../../MythicComponents/MythicDialog';
import {DownloadHistoryDialog} from '../Callbacks/DownloadHistoryDialog';
import HistoryIcon from '@mui/icons-material/History';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import { gql, useMutation } from '@apollo/client';
import {snackActions} from '../../utilities/Snackbar';
import EditIcon from '@mui/icons-material/Edit';
import { MythicStyledTooltip } from '../../MythicComponents/MythicStyledTooltip';
import {TagsDisplay, ViewEditTags} from '../../MythicComponents/MythicTag';
import {MythicActionButton} from "../../MythicComponents/MythicContent";

const updateFileComment = gql`
mutation updateCommentMutation($mythictree_id: Int!, $comment: String!){
    update_mythictree_by_pk(pk_columns: {id: $mythictree_id}, _set: {comment: $comment}) {
        comment
        id
    }
}
`;

export function FileBrowserTable(props){
    const [files, setFiles] = React.useState([]);
    useEffect( () => {
        setFiles([...props.files]);
    }, [props.files]);
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
        <TableContainer className="mythicElement" >
            <Table stickyHeader size="small" style={{"tableLayout": "fixed", "maxWidth": "100%", "overflow": "scroll"}}>
                <TableHead>
                    <TableRow>
                        <TableCell >Host / Path</TableCell>
                        <TableCell style={{width: "15rem"}}>Comment</TableCell>
                        <TableCell style={{width: "10rem"}}>Tags</TableCell>
                        <TableCell style={{width: "5rem"}}>Metadata</TableCell>
                        <TableCell style={{width: "6rem"}}>Downloads</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>

                {files.map( (op) => (
                    <FileBrowserTableRow
                        key={"file" + op.id}
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
function FileBrowserTableRow(props){
    const me = props.me;
    const [viewPermissionsDialogOpen, setViewPermissionsDialogOpen] = React.useState(false);
    const [fileHistoryDialogOpen, setFileHistoryDialogOpen] = React.useState(false);
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
                {fileHistoryDialogOpen && <MythicDialog fullWidth={true} maxWidth="md" open={fileHistoryDialogOpen}
                    onClose={()=>{setFileHistoryDialogOpen(false);}}
                    innerDialog={<DownloadHistoryDialog title="Download History" value={props.filemeta} onClose={()=>{setFileHistoryDialogOpen(false);}} />}
                />
                }
                {editCommentDialogOpen && <MythicDialog fullWidth={true} maxWidth="md" open={editCommentDialogOpen}
                    onClose={()=>{setEditCommentDialogOpen(false);}}
                    innerDialog={<MythicModifyStringDialog title="Edit File Browser Comment" onSubmit={onSubmitUpdatedComment} value={props.comment} onClose={()=>{setEditCommentDialogOpen(false);}} />}
                />
                }
                <TableCell>
                    <Typography variant="body2">{props.host}</Typography>
                    <Typography variant="body2" style={{textDecoration: props.deleted ? "strike-through" : ""}}>{props.full_path_text}</Typography>
                    {props.callback ? (
                        <>
                            {props.callback?.mythictree_groups.length > 0 ? (
                                <Typography variant="body2">
                                    <b>Groups: </b>{props?.callback.mythictree_groups.join(", ")}
                                </Typography>
                            ) : null}
                            <Typography variant="body2" style={{display: "inline-block", whiteSpace: "pre"}}>
                                <b>Callback: </b>
                                <Link color="textPrimary" underline="always" target="_blank"
                                      href={"/new/callbacks/" + props.callback.display_id}>
                                    {props.callback.display_id}
                                </Link>
                                {"  "}
                            </Typography>
                        </>
                        )
                    : null}
                    <Typography variant="body2" style={{display: "inline-block"}}>
                        <b>Task: </b>
                        <Link color="textPrimary" underline="always" target="_blank"
                                            href={"/new/task/" + props.task?.display_id}>
                            {props.task?.display_id}
                        </Link>
                    </Typography>



                </TableCell>
                <TableCell>
                    <MythicActionButton iconOnly tone="info" emphasis="always"

                        onClick={() => setEditCommentDialogOpen(true)}
                        size="small"
                    >
                        <EditIcon fontSize="small" />
                    </MythicActionButton>
                    <Typography variant="body2" style={{display: "inline-block"}}>{props.comment}</Typography>
                    </TableCell>
                <TableCell>
                    <ViewEditTags target_object={"mythictree_id"} target_object_id={props.id} me={me} />
                    <TagsDisplay tags={props.tags} />
                </TableCell>
                <TableCell>
                    <MythicStyledTooltip title="View permissions data">
                        <MythicActionButton iconOnly tone="info" emphasis="always"

                            size="small"
                            onClick={() => setViewPermissionsDialogOpen(true)}
                        >
                            <PlaylistAddCheckIcon fontSize="small" />
                        </MythicActionButton>
                    </MythicStyledTooltip>
                </TableCell>
                <TableCell>
                    {props.filemeta.length > 0 ? (
                        <MythicStyledTooltip title="View Download History and Download Files">
                            <MythicActionButton iconOnly tone="info" emphasis="always"

                                size="small"
                                onClick={() => setFileHistoryDialogOpen(true)}
                            >
                                <HistoryIcon fontSize="small" />
                            </MythicActionButton>
                        </MythicStyledTooltip>
                    ): (null)}
                </TableCell>
            </TableRow>
        </React.Fragment>
    )
}
