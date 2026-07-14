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
import {MythicStack, MythicCluster} from "../../MythicComponents/MythicLayout";
import {MythicCodeSurface, MythicActionButton, MythicMetadataItem, MythicMetadataLabel, MythicMetadataValue, MythicText} from "../../MythicComponents/MythicContent";

const singleLineCellStyle = {
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
};

const formatMetadataValue = (value) => {
    if(value === null || value === undefined){
        return "";
    }
    if(typeof value === "object"){
        return JSON.stringify(value);
    }
    return String(value);
};

const updateFileComment = gql`
mutation updateCommentMutation($mythictree_id: Int!, $comment: String!){
    update_mythictree_by_pk(pk_columns: {id: $mythictree_id}, _set: {comment: $comment}) {
        comment
        id
    }
}
`;

export function CustomBrowserTable({rows, columns=[], me}){
    const [entries, setEntries] = React.useState([]);
    useEffect( () => {
        setEntries([...rows]);
    }, [rows]);
    const onEditComment = ({id, comment}) => {
        const updates = entries.map( (file) => {
            if(file.id === id){
                return {...file, comment}
            }else{
                return {...file}
            }
        });
        setEntries(updates);
    }
    const metadataColumnWidth = columns.length > 0 ? "12rem" : undefined;
    const tableMinWidth = `${48 + (columns.length * 12)}rem`;
    return (
        <TableContainer className="mythicElement" style={{height: "100%", overflow: "auto"}} >
            <Table stickyHeader size="small" style={{tableLayout: "fixed", minWidth: tableMinWidth}}>
                <TableHead>
                    <TableRow>
                        <TableCell style={{width: "24rem"}}>Entry</TableCell>
                        {columns.map((column, index) => (
                            <TableCell key={index} style={{width: metadataColumnWidth}}>{column.name}</TableCell>
                        ))}
                        <TableCell style={{width: "16rem"}}>Comment</TableCell>
                        <TableCell style={{width: "8rem"}}>Tags</TableCell>

                    </TableRow>
                </TableHead>
                <TableBody>
                {entries.map( (op) => (
                    <CustomBrowserTableRow
                        key={"browser" + op.id}
                        me={me}
                        onEditComment={onEditComment}
                        columns={columns}
                        {...op}
                    />
                ))}
                </TableBody>
            </Table>
        </TableContainer>
    )
}
function CustomBrowserTableRow(props){
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
                    innerDialog={<MythicViewJSONAsTableDialog title="View Metadata" leftColumn="Name" rightColumn="Value" value={props.metadata} onClose={()=>{setViewPermissionsDialogOpen(false);}} />}
                    />
                }
                {editCommentDialogOpen && <MythicDialog fullWidth={true} maxWidth="md" open={editCommentDialogOpen}
                    onClose={()=>{setEditCommentDialogOpen(false);}}
                    innerDialog={<MythicModifyStringDialog title="Edit Browser Comment" onSubmit={onSubmitUpdatedComment} value={props.comment} onClose={()=>{setEditCommentDialogOpen(false);}} />}
                />
                }
                <TableCell>
                    <MythicStack component="div" gap="sm" className="mythic-search-result-stack mythic-search-result-stack-spacious">
                        <MythicCluster component="div" gap="xs" align="center" wrap={false} className="mythic-search-result-action-row">
                            <MythicStyledTooltip title="View metadata">
                                <MythicActionButton iconOnly tone="info"

                                    size="small"
                                    onClick={() => setViewPermissionsDialogOpen(true)}
                                >
                                    <PlaylistAddCheckIcon fontSize="small" />
                                </MythicActionButton>
                            </MythicStyledTooltip>
                            <MythicText component="span" preset="value"
                                className="mythic-search-result-primary"
                                style={{...singleLineCellStyle, textDecoration: props.deleted ? "line-through" : ""}}
                                title={props.name_text || props.full_path_text}
                            >
                                {props.name_text || props.full_path_text}
                            </MythicText>
                        </MythicCluster>
                        <MythicMetadataItem className="mythic-search-result-inline" density="compact" layout="inline" label="Host">{props.host}</MythicMetadataItem>
                        {props.full_path_text && props.full_path_text !== props.name_text ? (
                            <MythicCodeSurface className="mythic-search-result-code-compact" component="div" density="compact" overflow="hidden" tone="snippet" title={props.full_path_text}>
                                {props.full_path_text}
                            </MythicCodeSurface>
                        ) : null}
                        {props.callback ? (
                            <MythicCluster component="div" gap="xs" inline className="mythic-search-result-link-row">
                                <MythicMetadataLabel component="span" size="xs" className="mythic-search-result-label">Callback</MythicMetadataLabel>
                                <Link color="textPrimary" underline="always" target="_blank"
                                      href={"/new/callbacks/" + props.callback.display_id}>
                                    C-{props.callback.display_id}
                                </Link>
                                {props.task ? (
                                    <React.Fragment>
                                        <MythicMetadataValue component="span" size="caption" tone="secondary" className="mythic-search-result-secondary">/</MythicMetadataValue>
                                        <MythicMetadataLabel component="span" size="xs" className="mythic-search-result-label">Task</MythicMetadataLabel>
                                        <Link color="textPrimary" underline="always" target="_blank"
                                              href={"/new/task/" + props.task.display_id}>
                                            T-{props.task.display_id}
                                        </Link>
                                    </React.Fragment>
                                ) : null}
                            </MythicCluster>
                        ) : null}
                        {props.callback?.mythictree_groups?.length > 0 ? (
                            <MythicMetadataValue component="div" size="caption" tone="secondary" className="mythic-search-result-secondary">
                                Groups: {props.callback.mythictree_groups.join(", ")}
                            </MythicMetadataValue>
                        ) : null}
                    </MythicStack>

                </TableCell>
                {props.columns.map((column, index) => (
                    <TableCell key={index}>
                        <MythicMetadataValue component="div"
                            className="mythic-search-result-value"
                            style={singleLineCellStyle}
                            title={formatMetadataValue(props.metadata?.[column.key])}
                        >
                            {formatMetadataValue(props.metadata?.[column.key]) || <MythicMetadataValue component="span" size="caption" tone="secondary" className="mythic-search-result-secondary">None</MythicMetadataValue>}
                        </MythicMetadataValue>
                    </TableCell>
                ))}
                <TableCell>
                    <MythicCluster component="div" gap="xs" align="center" wrap={false} className="mythic-search-result-action-row">
                        <MythicStyledTooltip title="Edit comment">
                            <MythicActionButton iconOnly tone="info"

                                onClick={() => setEditCommentDialogOpen(true)}
                                size="small"
                            >
                                <EditIcon fontSize="small" />
                            </MythicActionButton>
                        </MythicStyledTooltip>
                        <MythicMetadataValue component="span" size="caption" tone="secondary" className="mythic-search-result-secondary" style={singleLineCellStyle} title={props.comment}>
                            {props.comment || "No comment"}
                        </MythicMetadataValue>
                    </MythicCluster>
                </TableCell>
                <TableCell>
                    <MythicCluster component="div" gap="xs" align="center" wrap={false} className="mythic-tag-cell mythic-overflow-hidden">
                        <ViewEditTags target_object={"mythictree_id"} target_object_id={props.id} me={me} />
                        <MythicCluster component="div" gap="xs" align="center" wrap={false} fill className="mythic-tag-list mythic-tag-list-truncate mythic-overflow-hidden">
                            <TagsDisplay tags={props.tags} />
                        </MythicCluster>
                    </MythicCluster>
                </TableCell>

            </TableRow>
        </React.Fragment>
    )
}
