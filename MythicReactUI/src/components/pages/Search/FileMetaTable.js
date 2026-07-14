import {useMythicTheme} from '../../../themes/MythicThemeProvider';
import React, {useEffect} from 'react';
import {Link, Typography} from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import {snackActions} from '../../utilities/Snackbar';
import {MythicSnackDownload} from '../../MythicComponents/MythicSnackDownload';

import {MythicConfirmDialog} from '../../MythicComponents/MythicConfirmDialog';
import {getSkewedNow, toLocalTime} from '../../utilities/Time';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import ArchiveIcon from '@mui/icons-material/Archive';
import { gql, useMutation } from '@apollo/client';
import { ResponseDisplayScreenshotModal } from '../Callbacks/ResponseDisplayScreenshotModal';
import { MythicDialog, MythicModifyStringDialog } from '../../MythicComponents/MythicDialog';
import EditIcon from '@mui/icons-material/Edit';
import { MythicStyledTooltip } from '../../MythicComponents/MythicStyledTooltip';
import {TagsDisplay, ViewEditTags} from '../../MythicComponents/MythicTag';
import {b64DecodeUnicode} from '../Callbacks/ResponseDisplay';
import Checkbox from '@mui/material/Checkbox';
import {HostFileDialog, HostedFileLocationsTable} from "../Payloads/HostFileDialog";
import PublicIcon from '@mui/icons-material/Public';
import {getStringSize} from '../Callbacks/ResponseDisplayTable';
import {PreviewFileMediaDialog} from "../../MythicComponents/PreviewFileMedia";
import {faPhotoVideo} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {ImageWithAuth} from "../../utilities/ImageWithAuth";
import {FileDownloadLinkWithAuth} from "../../utilities/FileDownloadWithAuth";
import {MythicCluster} from "../../MythicComponents/MythicLayout";
import {MythicActionButton} from "../../MythicComponents/MythicContent";

export const downloadBulkQuery = gql`
mutation downloadBulkMutation($files: [String!]!){
    downloadBulk(files: $files){
        status
        error
        file_id
    }
}
`;
export const updateFileDeleted = gql`
mutation updateFileMutation($file_id: Int, $file_ids: [Int!]){
    deleteFile(file_id: $file_id, file_ids: $file_ids) {
        status
        error
        file_ids
    }
}
`;
const updateFileComment = gql`
mutation updateCommentMutation($file_id: Int!, $comment: String!){
    update_filemeta_by_pk(pk_columns: {id: $file_id}, _set: {comment: $comment}) {
        comment
        id
    }
}
`;
export const previewFileQuery = gql`
mutation previewFile($file_id: String!){
    previewFile(file_id: $file_id){
        status
        error
        contents
        size
        host
        filename
        full_remote_path
    }
}
`;
const updateHostedFileMutation = gql`
mutation updateHostedFileMutation($c2profile_file_host_id: Int!, $host_url: String, $alert_on_download: Boolean, $stop: Boolean, $remove: Boolean) {
  c2UpdateHostedFile(c2profile_file_host_id: $c2profile_file_host_id, host_url: $host_url, alert_on_download: $alert_on_download, stop: $stop, remove: $remove) {
      status
      error
      id
      filemeta_id
      c2_profile_id
      host_url
      hosting_status
      affected_count
  }
}
`;
export const SnackMessage = (props) => {
    return (
        <React.Fragment>
            <Typography variant="subtitle2" >
                    Zip Created! This is available at any time via the "Uploads" page.
            </Typography>
            <FileDownloadLinkWithAuth color="textPrimary" href={"/direct/download/" + props.file_id} >
                Download here
            </FileDownloadLinkWithAuth>

        </React.Fragment>

    );
};
const MythicCallbackGroupsDisplay = ({groups}) => {
    if(!groups){
        return null
    }
    if(groups.length === 0){
        return null
    }
    if(groups.length === 1 && groups[0] === "Default"){
        return null
    }
    return (
        <Typography variant="body2">
            <b>Groups: </b>{groups.join(", ")}
        </Typography>
    )
}
const C2HostedLocationsSummary = ({hostedFiles}) => {
    if(!hostedFiles || hostedFiles.length === 0){
        return null;
    }
    return (
        <Box marginTop={1}>
            <HostedFileLocationsTable hostedFiles={hostedFiles} />
        </Box>
    );
}
export function HostedFileTable(props){
    const [hostedFiles, setHostedFiles] = React.useState([]);
    const [editingHostedFile, setEditingHostedFile] = React.useState(null);
    const pendingAction = React.useRef({id: 0, action: ""});
    React.useEffect(() => {
        setHostedFiles(props.hostedFiles || []);
    }, [props.hostedFiles]);
    const [updateHostedFile] = useMutation(updateHostedFileMutation, {
        onCompleted: (data) => {
            if(data.c2UpdateHostedFile.status === "success"){
                snackActions.success("Updated hosted file state");
                if(pendingAction.current.action === "remove"){
                    setHostedFiles((prev) => prev.filter((hostedFile) => hostedFile.id !== pendingAction.current.id));
                } else {
                    setHostedFiles((prev) => prev.map((hostedFile) => hostedFile.id === pendingAction.current.id ? {
                        ...hostedFile,
                        status: data.c2UpdateHostedFile.hosting_status || hostedFile.status,
                        error: "",
                        host_url: data.c2UpdateHostedFile.host_url || hostedFile.host_url
                    } : hostedFile));
                }
            } else {
                snackActions.error(data.c2UpdateHostedFile.error);
            }
        },
        onError: (data) => {
            snackActions.error(data.message);
        }
    });
    const retryHosting = (hostedFile) => {
        pendingAction.current = {id: hostedFile.id, action: "retry"};
        updateHostedFile({variables: {
            c2profile_file_host_id: hostedFile.id
        }});
    }
    const stopHosting = (hostedFile) => {
        pendingAction.current = {id: hostedFile.id, action: "stop"};
        updateHostedFile({variables: {
            c2profile_file_host_id: hostedFile.id,
            stop: true
        }});
    }
    const removeHosting = (hostedFile) => {
        pendingAction.current = {id: hostedFile.id, action: "remove"};
        updateHostedFile({variables: {
            c2profile_file_host_id: hostedFile.id,
            remove: true
        }});
    }
    const onHostedFileUpdated = (updatedHostedFile, action) => {
        if(updatedHostedFile.status !== "success"){
            return;
        }
        if(action?.action === "remove"){
            setHostedFiles((prev) => prev.filter((hostedFile) => hostedFile.id !== updatedHostedFile.id));
        } else {
            setHostedFiles((prev) => prev.map((hostedFile) => hostedFile.id === updatedHostedFile.id ? {
                ...hostedFile,
                host_url: updatedHostedFile.host_url || hostedFile.host_url,
                alert_on_download: action?.alert_on_download ?? hostedFile.alert_on_download,
                status: updatedHostedFile.hosting_status || hostedFile.status,
                error: ""
            } : hostedFile));
        }
        setEditingHostedFile(null);
    }
    return (
        <React.Fragment>
            {editingHostedFile &&
                <MythicDialog fullWidth={true} maxWidth="md" open={Boolean(editingHostedFile)}
                              onClose={() => setEditingHostedFile(null)}
                              innerDialog={<HostFileDialog
                                  file_uuid={editingHostedFile.filemetum?.agent_file_id}
                                  file_name={editingHostedFile.filemetum?.full_remote_path_text ? b64DecodeUnicode(editingHostedFile.filemetum.full_remote_path_text) : b64DecodeUnicode(editingHostedFile.filemetum?.filename_text || "")}
                                  hostedFile={editingHostedFile}
                                  onUpdated={onHostedFileUpdated}
                                  onClose={() => setEditingHostedFile(null)}
                              />} />
            }
            <HostedFileLocationsTable
                hostedFiles={hostedFiles}
                renderFile={(hostedFile) => (
                    <FileDownloadLinkWithAuth color="textPrimary" underline="always" href={"/direct/download/" + hostedFile.filemetum?.agent_file_id}>
                        {hostedFile.filemetum?.full_remote_path_text ? b64DecodeUnicode(hostedFile.filemetum.full_remote_path_text) : b64DecodeUnicode(hostedFile.filemetum?.filename_text || "")}
                    </FileDownloadLinkWithAuth>
                )}
                onEdit={(hostedFile) => setEditingHostedFile(hostedFile)}
                onRetry={retryHosting}
                onStop={stopHosting}
                onRemove={removeHosting}
            />
        </React.Fragment>
    );
}
export function FileMetaDownloadTable(props){
    const [selected, setSelected] = React.useState({});
    const [files, setFiles] = React.useState([]);
    const [checkAll, setCheckAll] = React.useState(false);
    const [disabled, setDisabled] = React.useState(true);
    const onToggleSelection = (id, checked) => {
        setSelected({...selected, [id]: checked});
    }
    const onToggleCheckAll = () => {
        if(checkAll){
            // it's currently checked and clicked again, untoggle it all
            setCheckAll(false);
            setSelected({});
        } else {
            setCheckAll(true);
            const newSelected = files?.reduce( (prev, cur) => {
                if(!cur.deleted){
                    return {...prev, [cur.id]: true};
                } else {
                    return {...prev}
                }

            }, {}) || {};
            setSelected(newSelected);
        }
    }
    useEffect( () => {
        const initialSelected = props.files?.reduce( (prev, file) => {
            return {...prev, [file.id]: false}
        }, {}) || {};
        const initialFiles = props.files?.reduce( (prev, file) => {
            return [...prev, {...file, filename_text: b64DecodeUnicode(file.filename_text), full_remote_path_text: b64DecodeUnicode(file.full_remote_path_text)}]
        }, []) || [];
        setSelected(initialSelected);
        setFiles(initialFiles);
    }, [props.files]);
    const [downloadBulk] = useMutation(downloadBulkQuery, {
        onCompleted: (data) => {
            snackActions.dismiss();
            if(data.downloadBulk.status === "success"){
                snackActions.success(<SnackMessage
                    file_id={data.downloadBulk.file_id}
                    />, {toastId: data.downloadBulk.file_id, autoClose: false, closeOnClick: false});
            }else{
                snackActions.error(data.downloadBulk.error);
            }
        },
        onError: (data) => {
            console.log(data);
            snackActions.error("Failed to zip up files");
        }
    })
    const onDownloadBulk = () => {
        snackActions.info("Zipping up files...");
        let fileIds = [];
        for(const [key, value] of Object.entries(selected)){
            if(value){
                for(let j = 0; j < props.files.length; j++){
                    if(props.files[j].id === parseInt(key)){
                        fileIds.push(props.files[j].agent_file_id);
                    }
                }
            }
        }
        downloadBulk({variables:{files: fileIds}})
    }
    const [deleteBulk] = useMutation(updateFileDeleted, {
        onCompleted: (data) => {
            snackActions.dismiss();
            if(data.deleteFile.status === "success"){
                onDelete(data.deleteFile);
            }else {
                snackActions.error(data.deleteFile.error);
            }

        },
        onError: (data) => {
            console.log(data);
            snackActions.error("Failed to delete files");
        }
    })
    const onDeleteBulk = () => {
        let fileIds = [];
        for(const [key, value] of Object.entries(selected)){
            if(value){
                for(let j = 0; j < props.files.length; j++){
                    if(props.files[j].id === parseInt(key)){
                        fileIds.push(props.files[j].id);
                    }
                }
            }
        }
        deleteBulk({variables:{file_ids: fileIds}})
    }
    const onDelete = ({file_ids}) => {
        if(!file_ids){
            return;
        }
        const updated = files.reduce( (prev, cur) => {
            if(file_ids.includes(cur.id)){
                return [...prev];
            }
            return [...prev, cur];
        }, []);
        let currentSelected = {...selected};
        file_ids.map(f => {
            currentSelected[f] = false;
        });
        setCheckAll(false);
        setSelected(currentSelected);
        setFiles(updated);
    }
    const onEditComment = ({id, comment}) => {
        const updated = files.map( (file) => {
            if(file.id === id){
                return {...file, comment: comment};
            }else{
                return {...file}
            }
        });
        setFiles(updated);
    }
    useEffect( () => {
        for(const [key, value] of Object.entries(selected)){
            if(value){
                setDisabled(false);
                return
            }
        }
        setDisabled(true);
    }, [selected]);
    return (
        <TableContainer className="mythicElement" style={{display: "flex", flexDirection: "column", height: "100%"}} >
            <MythicCluster component="span" gap="sm" align="center" className="mythic-table-bulk-actions mythic-divider-bottom mythic-full-width">
                <MythicActionButton tone="info" emphasis="always" size="small" onClick={onDownloadBulk}

                        startIcon={<ArchiveIcon fontSize="small" />}
                        variant="outlined"
                        disabled={disabled}
                >
                    Zip & Download Selected
                </MythicActionButton>
                <MythicActionButton tone="error" size="small" onClick={onDeleteBulk}

                        startIcon={<DeleteIcon fontSize="small" />}
                        variant="outlined"
                        disabled={disabled}
                >
                    Delete Selected
                </MythicActionButton>
            </MythicCluster>
            <TableContainer className="mythicElement" style={{height: "100%", overflowY: "auto"}}>
                <Table stickyHeader size="small" style={{"tableLayout": "fixed", "maxWidth": "100%", "overflow": "scroll"}}>
                <TableHead>
                    <TableRow>
                        <TableCell style={{width: "3rem"}}>
                            <Checkbox checked={checkAll} onChange={onToggleCheckAll}
                                      sx={{pl: "3px"}}
                                      inputProps={{ 'aria-label': 'controlled',  }} />
                        </TableCell>
                        <TableCell style={{width: "5rem"}}>Actions</TableCell>
                        <TableCell >File</TableCell>
                        <TableCell style={{width: "15rem"}}>Comment</TableCell>
                        <TableCell style={{width: "7rem"}}>Size</TableCell>
                        <TableCell style={{width: "15rem"}}>Tags</TableCell>
                        <TableCell style={{width: "5rem"}}>More</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>

                {files.map( (op) => (
                    <FileMetaDownloadTableRow
                        me={props.me}
                        key={"file" + op.id}
                        onToggleSelection={onToggleSelection}
                        onEditComment={onEditComment}
                        selected={selected}
                        onDelete={onDelete}
                        {...op}
                    />
                ))}
                </TableBody>
            </Table>
            </TableContainer>
        </TableContainer>
    )
}
function FileMetaDownloadTableRow(props){
    const [openDelete, setOpenDelete] = React.useState(false);
    const [openDetails, setOpenDetails] = React.useState(false);
    const [editCommentDialogOpen, setEditCommentDialogOpen] = React.useState(false);
    const [openPreviewMediaDialog, setOpenPreviewMediaDialog] = React.useState(false);
    const [openHostDialog, setOpenHostDialog] = React.useState(false);
    const me = props.me;
    const [deleteFile] = useMutation(updateFileDeleted, {
        onCompleted: (data) => {
            snackActions.dismiss();
            props.onDelete(data.deleteFile);
        },
        onError: (data) => {
            console.log(data);
            snackActions.error("Failed to delete file");
        }
    });
    const onAcceptDelete = () => {
        deleteFile({variables: {file_id: props.id}})
    }
    const onSelectChanged = (event) => {
        if(event){
            event.preventDefault();
            event.stopPropagation();
        }
        props.onToggleSelection(props.id, event.target.checked);
    }
    const [updateComment] = useMutation(updateFileComment, {
        onCompleted: (data) => {
            snackActions.success("updated comment");
            props.onEditComment(data.update_filemeta_by_pk)
        }
    });
    const onSubmitUpdatedComment = (comment) => {
        updateComment({variables: {file_id: props.id, comment: comment}})
    }
    const onPreviewMedia = (event) => {
        if(event){
            event.preventDefault();
            event.stopPropagation();
        }
        setOpenPreviewMediaDialog(true);
    }
    const expandRow = (event) => {
        if(event.target.localName === "td" || event.target.localName === "p"){
            setOpenDetails(!openDetails);
        }
    }
    const expandRowButton = (event) => {
        setOpenDetails(!openDetails);
    }
    const onOpenCloseComment = (event, open) => {
        if(event){
            event.stopPropagation();
        }

        setEditCommentDialogOpen(open);
    }
    return (
        <React.Fragment>
            <TableRow hover onClick={expandRow}>
                {openDelete &&
                    <MythicConfirmDialog onClose={() => {setOpenDelete(false);}} onSubmit={onAcceptDelete} open={openDelete}/>
                }
                <TableCell>
                    {props.deleted ? null : (
                        <MythicStyledTooltip title="Toggle to download multiple files at once">
                            <Checkbox checked={props.selected[props.id] === undefined ? false : props.selected[props.id]}
                                      onChange={onSelectChanged}
                                      inputProps={{ 'aria-label': 'controlled' }} />
                        </MythicStyledTooltip>
                    )}

                </TableCell>
                <TableCell>
                    {props.deleted || props.size === 0  ? null : (
                        <MythicCluster component="div" gap="xs" align="center" wrap={false}>
                            <MythicStyledTooltip title="Delete file">
                                <MythicActionButton iconOnly tone="error"

                                    size="small"
                                    onClick={()=>{setOpenDelete(true);}}
                                >
                                    <DeleteIcon fontSize="small" />
                                </MythicActionButton>
                            </MythicStyledTooltip>
                            <MythicStyledTooltip title={"Preview Media"}>
                                <MythicActionButton iconOnly tone="neutral"

                                    size="small"
                                    onClick={onPreviewMedia}
                                >
                                    <FontAwesomeIcon icon={faPhotoVideo} />
                                </MythicActionButton>
                            </MythicStyledTooltip>
                            {openPreviewMediaDialog &&
                                <MythicDialog fullWidth={true} maxWidth="xl" open={openPreviewMediaDialog}
                                              onClose={(e)=>{setOpenPreviewMediaDialog(false);}}
                                              innerDialog={<PreviewFileMediaDialog
                                                  agent_file_id={props.agent_file_id}
                                                  filename={props.filename_text}
                                                  onClose={(e)=>{setOpenPreviewMediaDialog(false);}} />}
                                />
                            }
                        </MythicCluster>
                    )}
                </TableCell>
                <TableCell>
                    <Typography variant="body2"><b>Host: </b>{props.host}</Typography>
                    <MythicCallbackGroupsDisplay groups={props?.task?.callback.mythictree_groups} />
                    {props.deleted ? (
                        <Typography variant="body2">{props.full_remote_path_text === "" ? props.filename_text : props.full_remote_path_text}</Typography>
                        ) : (
                        <FileDownloadLinkWithAuth color="textPrimary" underline="always" href={"/direct/download/" + props.agent_file_id}>{props.full_remote_path_text === "" ? props.filename_text : props.full_remote_path_text}</FileDownloadLinkWithAuth>
                        )
                    }
                    {props.complete ? null : (
                            <Typography color="secondary" >{props.chunks_received} / {props.total_chunks} Chunks Received</Typography>
                        )
                    }
                </TableCell>
                <TableCell>{props.comment}<MythicActionButton iconOnly tone="info" emphasis="always"  onClick={(e) => onOpenCloseComment(e, true)} size="small"><EditIcon fontSize="small" /></MythicActionButton>
                    {editCommentDialogOpen &&
                        <MythicDialog fullWidth={true} maxWidth="md" open={editCommentDialogOpen}
                                      onClose={(e)=>{onOpenCloseComment(e, false);}}
                                      innerDialog={<MythicModifyStringDialog title="Edit File Comment" onSubmit={onSubmitUpdatedComment} value={props.comment} onClose={(e)=>{onOpenCloseComment(e, false);}} />}
                        />
                    }

                </TableCell>
                <TableCell>
                    {getStringSize({cellData: {"plaintext": props.size}})}
                </TableCell>
                <TableCell>
                    <ViewEditTags target_object={"filemeta_id"} target_object_id={props.id} me={me} />
                    <TagsDisplay tags={props.tags} />
                </TableCell>
                <TableCell>
                    <MythicActionButton iconOnly tone="neutral"  size="small" aria-label="expand row" onClick={expandRowButton}>
                            {openDetails ? <KeyboardArrowUpIcon className="mythicElement"/> : <KeyboardArrowDownIcon className="mythicElement"/>}
                        </MythicActionButton>
                </TableCell>
            </TableRow>
                {openDetails ? (
                    <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                            <Collapse in={openDetails}>
                                <Box margin={1}>
                                <TableContainer className="mythicElement" elevation={3}>
                                    <Table  size="small" style={{tableLayout:"fixed", "width": "100%", "overflow": "scroll"}}>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell style={{width: "25rem"}}>Identifiers</TableCell>
                                                <TableCell >Operator</TableCell>
                                                <TableCell style={{width: "8rem"}}>Task</TableCell>
                                                <TableCell>Time</TableCell>
                                                <TableCell>Command</TableCell>
                                                <TableCell>Host File</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell >
                                                    <Typography variant="body2">MD5:  {props.md5}</Typography>
                                                    <Typography variant="body2">SHA1: {props.sha1}</Typography>
                                                    <Typography variant="body2">UUID: {props.agent_file_id}</Typography>
                                                </TableCell>
                                                <TableCell ><Typography variant="body2">{props.operator.username}</Typography></TableCell>
                                                <TableCell>
                                                    {props.task === null ? null : (
                                                        <>
                                                            <Link color="textPrimary" underline="always" target="_blank" href={"/new/callbacks/" + props.task.callback.display_id}>C-{props.task.callback.display_id}</Link><br/>
                                                            <Link color="textPrimary" underline="always" target="_blank" href={"/new/task/" + props.task.display_id}>T-{props.task.display_id}</Link>
                                                            <Typography variant="body2">{props.task.comment}</Typography>
                                                        </>

                                                    )}

                                                </TableCell>
                                                <TableCell >
                                                    <Typography variant="body2">{toLocalTime(props.timestamp, me.user.view_utc_time)}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    {props.task === null ? null : (
                                                        <Typography variant="body2">{props.task.command.cmd}</Typography>
                                                    )}

                                                </TableCell>
                                                <TableCell>
                                                    <MythicStyledTooltip title={"Host Payload Through C2"} >
                                                        <MythicActionButton iconOnly tone="info" emphasis="always"

                                                            size="small"
                                                            onClick={()=>{setOpenHostDialog(true);}}
                                                        >
                                                            <PublicIcon fontSize="small" />
                                                        </MythicActionButton>
                                                    </MythicStyledTooltip>
                                                    {openHostDialog &&
                                                        <MythicDialog fullWidth={true} maxWidth="md" open={openHostDialog}
                                                                      onClose={()=>{setOpenHostDialog(false);}}
                                                                      innerDialog={<HostFileDialog file_uuid={props.agent_file_id}
                                                                                                   file_name={props.full_remote_path_text === "" ? props.filename_text : props.full_remote_path_text}
                                                                                                   onClose={()=>{setOpenHostDialog(false);}} />}
                                                        />
                                                    }
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <C2HostedLocationsSummary hostedFiles={props.c2profile_file_hosts} />
                                </Box>
                            </Collapse>
                        </TableCell>
                    </TableRow>
            ) : null }
        </React.Fragment>
    )
}

export function FileMetaUploadTable(props){
    const [selected, setSelected] = React.useState({});
    const [files, setFiles] = React.useState([]);
    const [checkAll, setCheckAll] = React.useState(false);
    const [disabled, setDisabled] = React.useState(true);
    const onToggleSelection = (id, checked) => {
        setSelected({...selected, [id]: checked});
    }
    const onToggleCheckAll = () => {
        if(checkAll){
            // it's currently checked and clicked again, untoggle it all
            setCheckAll(false);
            setSelected({});
        } else {
            setCheckAll(true);
            const newSelected = files?.reduce( (prev, cur) => {
                if(!cur.deleted){
                    return {...prev, [cur.id]: true};
                } else {
                    return {...prev}
                }

            }, {}) || {};
            setSelected(newSelected);
        }
    }
    useEffect( () => {
        const initialSelected = props.files?.reduce( (prev, file) => {
            return {...prev, [file.id]: false}
        }, {})  || [];
        const initialFiles = props.files?.reduce( (prev, file) => {
            if(file.copy_of_file !== undefined && file.copy_of_file !== null){
                file.copy_of_file.filename_text = b64DecodeUnicode(file.copy_of_file.filename_text);
                file.copy_of_file.full_remote_path_text = b64DecodeUnicode(file.copy_of_file.full_remote_path_text)
            }
            return [...prev,
                {...file, filename_text: b64DecodeUnicode(file.filename_text),
                    full_remote_path_text: b64DecodeUnicode(file.full_remote_path_text)}]
        }, []) || [];
        setSelected(initialSelected);
        setFiles(initialFiles);
    }, [props.files]);
    const [downloadBulk] = useMutation(downloadBulkQuery, {
        onCompleted: (data) => {
            snackActions.dismiss();
            if(data.downloadBulk.status === "success"){
                snackActions.success(<MythicSnackDownload title="Download Zip File" file_id={data.downloadBulk.file_id} />, {toastId: data.downloadBulk.file_id, autoClose: false, closeOnClick: false});
            }else{
                snackActions.error(data.error);
            }
        },
        onError: (data) => {
            console.log(data);
            snackActions.error("Failed to zip up files");
        }
    })
    const onDownloadBulk = () => {
        snackActions.info("Zipping up files...");
        let fileIds = [];
        for(const [key, value] of Object.entries(selected)){
            if(value){
                for(let j = 0; j < props.files.length; j++){
                    if(props.files[j].id === parseInt(key)){
                        fileIds.push(props.files[j].agent_file_id);
                    }
                }
            }
        }
        downloadBulk({variables:{files: fileIds}})
    }
    const [deleteBulk] = useMutation(updateFileDeleted, {
        onCompleted: (data) => {
            snackActions.dismiss();
            if(data.deleteFile.status === "success"){
                onDelete(data.deleteFile);
            }else {
                snackActions.error(data.deleteFile.error);
            }

        },
        onError: (data) => {
            console.log(data);
            snackActions.error("Failed to delete files");
        }
    })
    const onDeleteBulk = () => {
        let fileIds = [];
        for(const [key, value] of Object.entries(selected)){
            if(value){
                for(let j = 0; j < props.files.length; j++){
                    if(props.files[j].id === parseInt(key)){
                        fileIds.push(props.files[j].id);
                    }
                }
            }
        }
        deleteBulk({variables:{file_ids: fileIds}})
    }
    const onDelete = ({file_ids}) => {
        if(!file_ids){return}
        const updated = files.reduce( (prev, cur) => {
            if(file_ids.includes(cur.id)){
                return [...prev];
            }
            return [...prev, cur];
        }, []);
        let currentSelected = {...selected};
        file_ids.map(f => {
            currentSelected[f] = false;
        });
        setCheckAll(false);
        setSelected(currentSelected);
        setFiles(updated);
    }
    const onEditComment = ({id, comment}) => {
        const updated = files.map( (file) => {
            if(file.id === id){
                return {...file, comment: comment};
            }else{
                return {...file}
            }
        });
        setFiles(updated);
    }
    useEffect( () => {
        for(const [key, value] of Object.entries(selected)){
            if(value){
                setDisabled(false);
                return
            }
        }
        setDisabled(true);
    }, [selected]);
    return (
        <TableContainer className="mythicElement" style={{display: "flex", flexDirection: "column", height: "100%"}} >
            <MythicCluster component="span" gap="sm" align="center" className="mythic-table-bulk-actions mythic-divider-bottom mythic-full-width">
                <MythicActionButton tone="info" emphasis="always" size="small" onClick={onDownloadBulk}

                        startIcon={<ArchiveIcon fontSize="small" />}
                        variant="outlined"
                        disabled={disabled}
                >
                    Zip & Download Selected
                </MythicActionButton>
                <MythicActionButton tone="error" size="small" onClick={onDeleteBulk}

                        startIcon={<DeleteIcon fontSize="small" />}
                        variant="outlined"
                        disabled={disabled}
                >
                    Delete Selected
                </MythicActionButton>
            </MythicCluster>
            <TableContainer className="mythicElement" style={{height: "100%", overflowY: "auto"}}>
                <Table stickyHeader size="small"
                       style={{"tableLayout": "fixed", "maxWidth": "100%", "overflow": "scroll"}}>
                    <TableHead>
                        <TableRow>
                            <TableCell style={{width: "3rem"}}>
                                <Checkbox checked={checkAll} onChange={onToggleCheckAll}
                                          sx={{pl: "3px"}}
                                          inputProps={{'aria-label': 'controlled'}}/>
                            </TableCell>
                            <TableCell style={{width: "5rem"}}>Actions</TableCell>
                            <TableCell>Source</TableCell>
                            <TableCell>Destination</TableCell>
                            <TableCell style={{width: "15rem"}}>Comment</TableCell>
                            <TableCell style={{width: "7rem"}}>Size</TableCell>
                            <TableCell style={{width: "15rem"}}>Tags</TableCell>
                            <TableCell style={{width: "5rem"}}>More</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>

                        {files.map( (op) => (
                            <FileMetaUploadTableRow
                                me={props.me}
                                key={"file" + op.id}
                                onToggleSelection={onToggleSelection}
                                onEditComment={onEditComment}
                                selected={selected}
                                onDelete={onDelete}
                                {...op}
                            />
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </TableContainer>
    )
}
function FileMetaUploadTableRow(props){
    const theme = useMythicTheme();
    const [openDelete, setOpenDelete] = React.useState(false);
    const [openDetails, setOpenDetails] = React.useState(false);
    const [editCommentDialogOpen, setEditCommentDialogOpen] = React.useState(false);
    const [openPreviewMediaDialog, setOpenPreviewMediaDialog] = React.useState(false);
    const [openHostDialog, setOpenHostDialog] = React.useState(false);
    const me = props.me;
    const [deleteFile] = useMutation(updateFileDeleted, {
        onCompleted: (data) => {
            snackActions.dismiss();
            props.onDelete(data.deleteFile);
        },
        onError: (data) => {
            console.log(data);
            snackActions.error("Failed to delete file");
        }
    })
    const onAcceptDelete = () => {
        deleteFile({variables: {file_id: props.id}})
    }
    const onSelectChanged = (event) => {
        props.onToggleSelection(props.id, event.target.checked);
    }
    const [updateComment] = useMutation(updateFileComment, {
        onCompleted: (data) => {
            snackActions.success("updated comment");
            props.onEditComment(data.update_filemeta_by_pk)
        }
    });
    const onSubmitUpdatedComment = (comment) => {
        updateComment({variables: {file_id: props.id, comment: comment}})
    }
    const onPreviewMedia = (event) => {
        if(event){
            event.preventDefault();
            event.stopPropagation();
        }
        setOpenPreviewMediaDialog(true);
    }
    const expandRow = (event) => {
        if(event.target.nodeName === 'INPUT'){
            return
        }
        if(event.target.localName === "td" || event.target.localName === "p"){
            setOpenDetails(!openDetails);
        }
    }
    const onOpenCloseComment = (event, open) => {
        if(event){
            event.stopPropagation();
        }
        setEditCommentDialogOpen(open);
    }
    const expandRowButton = (event) => {
        setOpenDetails(!openDetails);
    }
    return (
        <React.Fragment>
            <TableRow hover onClick={expandRow}>
                {openDelete && <MythicConfirmDialog onClose={() => {setOpenDelete(false);}} onSubmit={onAcceptDelete} open={openDelete}/>}
                <TableCell>
                    {props.deleted ? null : (
                        <MythicStyledTooltip title="Toggle to download multiple files at once">
                            <Checkbox checked={props.selected[props.id] === undefined ? false : props.selected[props.id]}
                                      onChange={onSelectChanged}
                                      inputProps={{ 'aria-label': 'controlled' }} />
                        </MythicStyledTooltip>
                    )}

                </TableCell>
                <TableCell>
                    {props.deleted ? null : (
                        <MythicCluster component="div" gap="xs" align="center" wrap={false}>
                            <MythicStyledTooltip title="Delete file">
                                <MythicActionButton iconOnly tone="error"

                                    size="small"
                                    onClick={()=>{setOpenDelete(true);}}
                                >
                                    <DeleteIcon fontSize="small" />
                                </MythicActionButton>
                            </MythicStyledTooltip>
                            <MythicStyledTooltip title={"Preview Media"}>
                                <MythicActionButton iconOnly tone="neutral"

                                    size="small"
                                    onClick={onPreviewMedia}
                                >
                                    <FontAwesomeIcon icon={faPhotoVideo} />
                                </MythicActionButton>
                            </MythicStyledTooltip>
                            {openPreviewMediaDialog &&
                                <MythicDialog fullWidth={true} maxWidth="xl" open={openPreviewMediaDialog}
                                              onClose={(e)=>{setOpenPreviewMediaDialog(false);}}
                                              innerDialog={<PreviewFileMediaDialog
                                                  agent_file_id={props.agent_file_id}
                                                  filename={props.filename_text}
                                                  editable={true}
                                                  onClose={(e)=>{setOpenPreviewMediaDialog(false);}} />}
                                />
                            }
                        </MythicCluster>
                    )}
                </TableCell>
                <TableCell>
                    <FileDownloadLinkWithAuth color="textPrimary" underline="always" href={"/direct/download/" + props.agent_file_id}>{props.filename_text}</FileDownloadLinkWithAuth>
                    {props.complete ? null : (
                        <Typography color="secondary" >{props.chunks_received} / {props.total_chunks} Chunks Received</Typography>
                    )
                    }
                </TableCell>
                <TableCell>
                    <Typography variant="body2">
                        {props.host !== "" ? (
                            <><b>Host: </b>{props.host}</>
                        ) : null}
                    </Typography>
                    <MythicCallbackGroupsDisplay groups={props?.task?.callback.mythictree_groups} />
                    {props.deleted ? (<Typography variant="body2">{props.full_remote_path_text}</Typography>) : (
                        props.complete ? (
                            <FileDownloadLinkWithAuth color="textPrimary" underline="always" href={"/direct/download/" +  props.agent_file_id}>{props.full_remote_path_text}</FileDownloadLinkWithAuth>
                        ) : (
                            <React.Fragment>
                                <Typography variant="body2">{props.full_remote_path_text}</Typography> <Typography color="secondary" >{props.chunks_received} / {props.total_chunks} Chunks Received</Typography>
                            </React.Fragment>
                        )
                    )}
                </TableCell>
                <TableCell>
                    {props.comment}<MythicActionButton iconOnly tone="info" emphasis="always"  onClick={(e) => onOpenCloseComment(e, true)} size="small"><EditIcon fontSize="small" /></MythicActionButton>
                    <MythicDialog fullWidth={true} maxWidth="md" open={editCommentDialogOpen}
                        onClose={(e)=>{onOpenCloseComment(e, false)}}
                        innerDialog={<MythicModifyStringDialog title="Edit File Comment" onSubmit={onSubmitUpdatedComment} value={props.comment} onClose={(e)=>{onOpenCloseComment(e, false)}} />}
                    />
                </TableCell>
                <TableCell>
                    {getStringSize({cellData: {"plaintext": props.size}})}
                </TableCell>
                <TableCell>
                    <ViewEditTags target_object={"filemeta_id"} target_object_id={props.id} me={me} />
                    <TagsDisplay tags={props.tags} />
                </TableCell>
                <TableCell>
                    <MythicActionButton iconOnly tone="neutral"  size="small" aria-label="expand row" onClick={expandRowButton}>
                            {openDetails ? <KeyboardArrowUpIcon className="mythicElement"/> : <KeyboardArrowDownIcon className="mythicElement"/>}
                        </MythicActionButton>
                </TableCell>
            </TableRow>
                {openDetails ? (
                    <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                            <Collapse in={openDetails}>
                                <Box margin={1}>
                                <TableContainer className="mythicElement" elevation={3}>
                                    <Table  size="small" style={{"tableLayout": "fixed", "maxWidth": "100%", "overflow": "scroll"}}>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell style={{width: "25rem"}}>Identifiers</TableCell>
                                                <TableCell >Operator</TableCell>
                                                <TableCell style={{width: "8rem"}}>Task</TableCell>
                                                <TableCell>Timestamp</TableCell>
                                                <TableCell>Command</TableCell>
                                                <TableCell>Host File</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell>
                                                    <Typography variant="body2">MD5: {props.md5}</Typography>
                                                    <Typography variant="body2">SHA1: {props.sha1}</Typography>
                                                    <Typography variant="body2">UUID: {props.agent_file_id}</Typography>
                                                </TableCell>
                                                <TableCell><Typography variant="body2">{props.operator.username}</Typography></TableCell>
                                                <TableCell>
                                                    {props.task === null ? null : (
                                                        <>
                                                            <Link color="textPrimary" underline="always" target="_blank" href={"/new/callbacks/" + props.task.callback.display_id}>C-{props.task.callback.display_id}</Link><br/>
                                                            <Link color="textPrimary" underline="always" target="_blank" href={"/new/task/" + props.task.display_id}>T-{props.task.display_id}</Link><br/>
                                                            <Typography variant="body2">{props.task.comment}</Typography>
                                                        </>
                                                    )}

                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">{toLocalTime(props.timestamp, me.user.view_utc_time)}</Typography>

                                                    </TableCell>
                                                <TableCell>
                                                    {props.task === null ? null : (
                                                        <Typography variant="body2">{props.task.command.cmd}</Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <MythicStyledTooltip title={"Host Payload Through C2"} >
                                                        <MythicActionButton iconOnly tone="info" emphasis="always"

                                                            size="small"
                                                            onClick={()=>{setOpenHostDialog(true);}}
                                                        >
                                                            <PublicIcon fontSize="small" />
                                                        </MythicActionButton>
                                                    </MythicStyledTooltip>
                                                    {openHostDialog &&
                                                        <MythicDialog fullWidth={true} maxWidth="md" open={openHostDialog}
                                                                      onClose={()=>{setOpenHostDialog(false);}}
                                                                      innerDialog={<HostFileDialog file_uuid={props.agent_file_id}
                                                                                                   file_name={props.full_remote_path_text === "" ? props.filename_text : props.full_remote_path_text}
                                                                                                   onClose={()=>{setOpenHostDialog(false);}} />}
                                                        />
                                                    }
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                    <C2HostedLocationsSummary hostedFiles={props.c2profile_file_hosts} />
                                    {props.copy_of_file &&
                                        <Box margin={1} style={{border: `2px dashed ${theme.palette.info.main}`}}>
                                            <Typography variant="body2" style={{fontWeight: "600", textAlign: "center"}}>
                                                {props.filename_text + " is a copy of the following file: "}
                                            </Typography>
                                            <TableContainer className="mythicElement" elevation={3}>
                                                <Table  size="small" style={{"tableLayout": "fixed", "maxWidth": "100%", "overflow": "scroll"}}>
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell style={{width: "25rem"}}>Identifiers</TableCell>
                                                            <TableCell>Destination</TableCell>
                                                            <TableCell style={{width: "8rem"}}>Task</TableCell>
                                                            <TableCell>Timestamp</TableCell>
                                                            <TableCell>Command</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        <TableRow>
                                                            <TableCell>
                                                                <Typography variant="body2">MD5: {props.copy_of_file.md5}</Typography>
                                                                <Typography variant="body2">SHA1: {props.copy_of_file.sha1}</Typography>
                                                                <Typography variant="body2">UUID: {props.copy_of_file.agent_file_id}</Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography variant="body2">
                                                                    {props.copy_of_file.host !== "" ? (
                                                                        <><b>Host: </b>{props.copy_of_file.host}</>
                                                                    ) : null}
                                                                </Typography>
                                                                <MythicCallbackGroupsDisplay groups={props.copy_of_file?.task?.callback.mythictree_groups} />
                                                                {props.copy_of_file.deleted ? (<Typography variant="body2">{props.copy_of_file.full_remote_path_text}</Typography>) : (
                                                                    props.copy_of_file.complete ? (
                                                                        <FileDownloadLinkWithAuth color="textPrimary" underline="always" href={"/direct/download/" +  props.copy_of_file.agent_file_id}>{props.copy_of_file.full_remote_path_text}</FileDownloadLinkWithAuth>
                                                                    ) : (
                                                                        <React.Fragment>
                                                                            <Typography variant="body2">{props.copy_of_file.full_remote_path_text}</Typography> <Typography color="secondary" >{props.copy_of_file.chunks_received} / {props.copy_of_file.total_chunks} Chunks Received</Typography>
                                                                        </React.Fragment>
                                                                    )
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                {props.copy_of_file.task === null ? null : (
                                                                    <>
                                                                        <Link color="textPrimary" underline="always" target="_blank" href={"/new/callbacks/" + props.copy_of_file.task.callback.display_id}>C-{props.copy_of_file.task.callback.display_id}</Link><br/>
                                                                        <Link color="textPrimary" underline="always" target="_blank" href={"/new/task/" + props.copy_of_file.task.display_id}>T-{props.copy_of_file.task.display_id}</Link><br/>
                                                                        <Typography variant="body2">{props.copy_of_file.task.comment}</Typography>
                                                                    </>
                                                                )}

                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography variant="body2">{toLocalTime(props.copy_of_file.timestamp, me.user.view_utc_time)}</Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                {props.task === null ? null : (
                                                                    <Typography variant="body2">{props.copy_of_file.task.command.cmd}</Typography>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </Box>
                                    }
                                </Box>
                            </Collapse>
                        </TableCell>
                    </TableRow>
            ) : null }
        </React.Fragment>
    )
}

export function FileMetaScreenshotTable(props){
    const [files, setFiles] = React.useState([]);
    useEffect( () => {
        const initialFiles = props.files?.reduce( (prev, file) => {
            return [...prev, {...file, filename_text: b64DecodeUnicode(file.filename_text), full_remote_path_text: b64DecodeUnicode(file.full_remote_path_text)}]
        }, [])  || [];
        setFiles(initialFiles);
    }, [props.files]);
    const onEditComment = ({id, comment}) => {
        const updated = files?.map( (file) => {
            if(file.id === id){
                return {...file, comment: comment};
            }else{
                return {...file}
            }
        });
        setFiles(updated);
    }
    const onDelete = ({file_ids}) => {
        const updated = files.reduce( (prev, cur) => {
            if(file_ids.includes(cur.id)){
                return [...prev];
            }
            return [...prev, cur];
        }, []);
        setFiles(updated);
    }
    const imageRefs = files.map( f => f.agent_file_id);

    return (
        <TableContainer className="mythicElement">
            <Table stickyHeader size="small" style={{"tableLayout": "fixed", "maxWidth": "100%", "overflow": "scroll"}}>
                <TableHead>
                    <TableRow>
                        <TableCell style={{width: "3rem"}}>Delete</TableCell>
                        <TableCell style={{width: "300px"}}>Thumbnail</TableCell>
                        <TableCell >Filename</TableCell>
                        <TableCell style={{width: "12rem"}}>Time</TableCell>
                        <TableCell >Host</TableCell>
                        <TableCell >Comment</TableCell>
                        <TableCell style={{width: "5rem"}}>Size</TableCell>
                        <TableCell>Tags</TableCell>
                        <TableCell style={{width: "3rem"}}>More</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>

                {files.map( (op, index) => (
                    <FileMetaScreenshotTableRow
                        key={"file" + op.id}
                        onEditComment={onEditComment}
                        {...op}
                        index={index}
                        imageRefs={imageRefs}
                        onDelete={onDelete}
                        me={props.me}
                    />
                ))}
                </TableBody>
            </Table>
        </TableContainer>
    )
}
function FileMetaScreenshotTableRow(props){
    const [openDelete, setOpenDelete] = React.useState(false);
    const [openDetails, setOpenDetails] = React.useState(false);
    const me = props.me;
    const now = (getSkewedNow()).toISOString();
    const [openScreenshot, setOpenScreenshot] = React.useState(false);
    const [editCommentDialogOpen, setEditCommentDialogOpen] = React.useState(false);
    const [updateComment] = useMutation(updateFileComment, {
        onCompleted: (data) => {
            snackActions.success("updated comment");
            props.onEditComment(data.update_filemeta_by_pk)
        }
    });
    const onSubmitUpdatedComment = (comment) => {
        updateComment({variables: {file_id: props.id, comment: comment}})
    }
    const [deleteFile] = useMutation(updateFileDeleted, {
        onCompleted: (data) => {
            snackActions.dismiss();
            props.onDelete(data.deleteFile);
        },
        onError: (data) => {
            console.log(data);
            snackActions.error("Failed to delete file");
        }
    })
    const onAcceptDelete = () => {
        deleteFile({variables: {file_id: props.id}})
    }
    const expandRowButton = (event) => {
        if(event.target.localName === "td" || event.target.localName === "p"){
            setOpenDetails(!openDetails);
        }
        event.stopPropagation();
    }
    return (
        <React.Fragment>
            <TableRow hover onClick={expandRowButton}>
                {openDelete && <MythicConfirmDialog onClose={() => {setOpenDelete(false);}} onSubmit={onAcceptDelete} open={openDelete}/>}
                <TableCell>
                    {props.deleted ? null : (
                        <MythicStyledTooltip title="Delete screenshot">
                            <MythicActionButton iconOnly tone="error"

                                size="small"
                                onClick={()=>{setOpenDelete(true);}}
                            >
                                <DeleteIcon fontSize="small" />
                            </MythicActionButton>
                        </MythicStyledTooltip>
                    )}
                </TableCell>
                <TableCell >
                    <ImageWithAuth src={"/screencaptures/" + props.agent_file_id}
                                   style={{width: "270px", cursor: "pointer"}} />
                    {openScreenshot &&
                        <MythicDialog fullWidth={true} maxWidth="xl" open={openScreenshot}
                            onClose={()=>{setOpenScreenshot(false);}}
                            innerDialog={<ResponseDisplayScreenshotModal images={props.imageRefs} startIndex={props.index} onClose={()=>{setOpenScreenshot(false);}} />} />
                    }
                    {props.chunks_received < props.total_chunks ? (<Typography color="secondary" >{props.chunks_received} / {props.total_chunks} Chunks Received</Typography>) : (null)}
                </TableCell>
                <TableCell><Typography variant="body2">{props.filename_text}</Typography></TableCell>
                <TableCell><Typography variant="body2">{toLocalTime(props.timestamp, me.user.view_utc_time)}</Typography></TableCell>
                <TableCell><Typography variant="body2">{props.host}</Typography></TableCell>
                <TableCell>
                    {props.comment}<MythicActionButton iconOnly tone="info" emphasis="always"  onClick={() => setEditCommentDialogOpen(true)} size="small"><EditIcon fontSize="small" /></MythicActionButton>
                    <MythicDialog fullWidth={true} maxWidth="md" open={editCommentDialogOpen}
                        onClose={()=>{setEditCommentDialogOpen(false);}}
                        innerDialog={<MythicModifyStringDialog title="Edit File Comment" onSubmit={onSubmitUpdatedComment} value={props.comment} onClose={()=>{setEditCommentDialogOpen(false);}} />}
                    />
                </TableCell>
                <TableCell>
                    {getStringSize({cellData: {"plaintext": props.size}})}
                </TableCell>
                <TableCell>
                    <ViewEditTags target_object={"filemeta_id"} target_object_id={props.id} me={me} />
                    <TagsDisplay tags={props.tags} />
                </TableCell>
                <TableCell>
                    <MythicActionButton iconOnly tone="neutral"  size="small" aria-label="expand row" onClick={() => setOpenDetails(!openDetails)}>
                            {openDetails ? <KeyboardArrowUpIcon className="mythicElement"/> : <KeyboardArrowDownIcon className="mythicElement"/>}
                        </MythicActionButton>
                </TableCell>
            </TableRow>
                {openDetails ? (
                    <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
                            <Collapse in={openDetails}>
                                <Box margin={1}>
                                <TableContainer className="mythicElement">
                                    <Table  size="small" style={{"tableLayout": "fixed", "maxWidth": "99%", "overflow": "scroll"}}>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell style={{width: "25rem"}}>Identifiers</TableCell>
                                                <TableCell >Operator</TableCell>
                                                <TableCell style={{width: "8rem"}}>Task</TableCell>
                                                <TableCell>Task Comment</TableCell>
                                                <TableCell>Command</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell>
                                                    <Typography variant="body2">MD5:  {props.md5}</Typography>
                                                    <Typography variant="body2">SHA1: {props.sha1}</Typography>
                                                    <Typography variant="body2">UUID: {props.agent_file_id}</Typography>
                                                </TableCell>
                                                <TableCell><Typography variant="body2">{props.operator.username}</Typography></TableCell>
                                                <TableCell>
                                                    {props.task === null ? null : (
                                                        <>
                                                            <Link color="textPrimary" underline="always" target="_blank" href={"/new/callbacks/" + props.task.callback.display_id}>C-{props.task.callback.display_id}</Link><br/>
                                                            <Link color="textPrimary" underline="always" target="_blank" href={"/new/task/" + props.task.display_id}>T-{props.task.display_id}</Link>
                                                        </>
                                                    )}

                                                </TableCell>
                                                <TableCell>{props.task !== null ? (<Typography variant="body2">{props.task.comment}</Typography>) : (null)}</TableCell>
                                                <TableCell>
                                                    {props.task === null ? null : (
                                                        <Typography variant="body2">{props.task.command.cmd}</Typography>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <C2HostedLocationsSummary hostedFiles={props.c2profile_file_hosts} />
                                </Box>
                            </Collapse>
                        </TableCell>
                    </TableRow>
            ) : null }
        </React.Fragment>
    )
}

export function FileMetaEventingWorkflowsTable(props){
    const [selected, setSelected] = React.useState({});
    const [files, setFiles] = React.useState([]);
    const [checkAll, setCheckAll] = React.useState(false);
    const [disabled, setDisabled] = React.useState(true);
    const onToggleSelection = (id, checked) => {
        setSelected({...selected, [id]: checked});
    }
    const onToggleCheckAll = () => {
        if(checkAll){
            // it's currently checked and clicked again, untoggle it all
            setCheckAll(false);
            setSelected({});
        } else {
            setCheckAll(true);
            const newSelected = files?.reduce( (prev, cur) => {
                if(!cur.deleted){
                    return {...prev, [cur.id]: true};
                } else {
                    return {...prev}
                }

            }, {}) || {};
            setSelected(newSelected);
        }
    }
    useEffect( () => {
        const initialSelected = props.files?.reduce( (prev, file) => {
            return {...prev, [file.id]: false}
        }, {}) || {};
        const initialFiles = props.files?.reduce( (prev, file) => {
            return [...prev, {...file, filename_text: b64DecodeUnicode(file.filename_text), full_remote_path_text: b64DecodeUnicode(file.full_remote_path_text)}]
        }, [])  || [];
        setSelected(initialSelected);
        setFiles(initialFiles);
    }, [props.files]);
    const [downloadBulk] = useMutation(downloadBulkQuery, {
        onCompleted: (data) => {
            snackActions.dismiss();
            if(data.downloadBulk.status === "success"){
                snackActions.success(<MythicSnackDownload title="Download Zip File" file_id={data.downloadBulk.file_id} />, {toastId: data.downloadBulk.file_id, autoClose: false, closeOnClick: false});
            }else{
                snackActions.error(data.downloadBulk.error);
            }
        },
        onError: (data) => {
            console.log(data);
            snackActions.error("Failed to zip up files");
        }
    })
    const onDownloadBulk = () => {
        snackActions.info("Zipping up files...");
        let fileIds = [];
        for(const [key, value] of Object.entries(selected)){
            if(value){
                for(let j = 0; j < props.files.length; j++){
                    if(props.files[j].id === parseInt(key)){
                        fileIds.push(props.files[j].agent_file_id);
                    }
                }
            }
        }
        downloadBulk({variables:{files: fileIds}})
    }
    const [deleteBulk] = useMutation(updateFileDeleted, {
        onCompleted: (data) => {
            snackActions.dismiss();
            if(data.deleteFile.status === "success"){
                onDelete(data.deleteFile);
            }else {
                snackActions.error(data.deleteFile.error);
            }

        },
        onError: (data) => {
            console.log(data);
            snackActions.error("Failed to delete files");
        }
    })
    const onDeleteBulk = () => {
        let fileIds = [];
        for(const [key, value] of Object.entries(selected)){
            if(value){
                for(let j = 0; j < props.files.length; j++){
                    if(props.files[j].id === parseInt(key)){
                        fileIds.push(props.files[j].id);
                    }
                }
            }
        }
        deleteBulk({variables:{file_ids: fileIds}})
    }
    const onDelete = ({file_ids}) => {
        if(!file_ids){return}
        const updated = files.reduce( (prev, cur) => {
            if(file_ids.includes(cur.id)){
                return [...prev];
            }
            return [...prev, cur];
        }, []);
        let currentSelected = {...selected};
        file_ids.map(f => {
            currentSelected[f] = false;
        });
        setCheckAll(false);
        setSelected(currentSelected);
        setFiles(updated);
    }
    const onEditComment = ({id, comment}) => {
        const updated = files.map( (file) => {
            if(file.id === id){
                return {...file, comment: comment};
            }else{
                return {...file}
            }
        });
        setFiles(updated);
    }
    useEffect( () => {
        for(const [key, value] of Object.entries(selected)){
            if(value){
                setDisabled(false);
                return
            }
        }
        setDisabled(true);
    }, [selected]);
    return (
        <TableContainer className="mythicElement" style={{display: "flex", flexDirection: "column", height: "100%"}} >
            <MythicCluster component="span" gap="sm" align="center" className="mythic-table-bulk-actions mythic-divider-bottom mythic-full-width">
                <MythicActionButton tone="info" emphasis="always" size="small" onClick={onDownloadBulk}

                        startIcon={<ArchiveIcon fontSize="small" />}
                        variant="outlined"
                        disabled={disabled}
                >
                    Zip & Download Selected
                </MythicActionButton>
                <MythicActionButton tone="error" size="small" onClick={onDeleteBulk}

                        startIcon={<DeleteIcon fontSize="small" />}
                        variant="outlined"
                        disabled={disabled}
                >
                    Delete Selected
                </MythicActionButton>
            </MythicCluster>
            <TableContainer className="mythicElement" style={{height: "100%", overflowY: "auto"}}>
                <Table stickyHeader size="small"
                       style={{"tableLayout": "fixed", "maxWidth": "100%", "overflow": "scroll"}}>
                    <TableHead>
                        <TableRow>
                            <TableCell style={{width: "3rem"}}>
                                <Checkbox checked={checkAll} onChange={onToggleCheckAll}
                                          sx={{pl: "3px"}}
                                          inputProps={{'aria-label': 'controlled'}}/>
                            </TableCell>
                            <TableCell style={{width: "5rem"}}>Actions</TableCell>
                            <TableCell style={{width: "20rem"}}>Source</TableCell>
                            <TableCell style={{width: "20rem"}}>Workflow</TableCell>
                            <TableCell style={{width: "7rem"}}>Size</TableCell>
                            <TableCell style={{width: "15rem"}}>Tags</TableCell>
                            <TableCell style={{width: "5rem"}}>More</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>

                        {files.map( (op) => (
                            <FileMetaEventingWorkflowsTableRow
                                me={props.me}
                                key={"file" + op.id}
                                onToggleSelection={onToggleSelection}
                                onEditComment={onEditComment}
                                selected={selected}
                                onDelete={onDelete}
                                {...op}
                            />
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </TableContainer>
    )
}
function FileMetaEventingWorkflowsTableRow(props){
    const [openDelete, setOpenDelete] = React.useState(false);
    const [openDetails, setOpenDetails] = React.useState(false);
    const [openPreviewMediaDialog, setOpenPreviewMediaDialog] = React.useState(false);
    const [openHostDialog, setOpenHostDialog] = React.useState(false);
    const me = props.me;
    const [deleteFile] = useMutation(updateFileDeleted, {
        onCompleted: (data) => {
            snackActions.dismiss();
            props.onDelete(data.deleteFile);
        },
        onError: (data) => {
            console.log(data);
            snackActions.error("Failed to delete file");
        }
    })
    const onAcceptDelete = () => {
        deleteFile({variables: {file_id: props.id}})
    }
    const onSelectChanged = (event) => {
        props.onToggleSelection(props.id, event.target.checked);
    }
    const onPreviewMedia = (event) => {
        if(event){
            event.preventDefault();
            event.stopPropagation();
        }
        setOpenPreviewMediaDialog(true);
    }
    const expandRow = (event) => {
        if(event.target.nodeName === 'INPUT'){
            return
        }
        if(event.target.localName === "td" || event.target.localName === "p"){
            setOpenDetails(!openDetails);
        }
    }

    const expandRowButton = (event) => {
        setOpenDetails(!openDetails);
    }
    return (
        <React.Fragment>
            <TableRow hover onClick={expandRow}>
                {openDelete && <MythicConfirmDialog onClose={() => {setOpenDelete(false);}} onSubmit={onAcceptDelete} open={openDelete}/>}
                <TableCell>
                    {props.deleted ? null : (
                        <MythicStyledTooltip title="Toggle to download multiple files at once">
                            <Checkbox checked={props.selected[props.id] === undefined ? false : props.selected[props.id]}
                                      onChange={onSelectChanged}
                                      inputProps={{ 'aria-label': 'controlled' }} />
                        </MythicStyledTooltip>
                    )}

                </TableCell>
                <TableCell>
                    {props.deleted ? null : (
                        <MythicCluster component="div" gap="xs" align="center" wrap={false}>
                            <MythicStyledTooltip title="Delete file">
                                <MythicActionButton iconOnly tone="error"

                                    size="small"
                                    onClick={()=>{setOpenDelete(true);}}
                                >
                                    <DeleteIcon fontSize="small" />
                                </MythicActionButton>
                            </MythicStyledTooltip>
                            <MythicStyledTooltip title={"Preview Media"}>
                                <MythicActionButton iconOnly tone="neutral"

                                    size="small"
                                    onClick={onPreviewMedia}
                                >
                                    <FontAwesomeIcon icon={faPhotoVideo} />
                                </MythicActionButton>
                            </MythicStyledTooltip>
                            {openPreviewMediaDialog &&
                                <MythicDialog fullWidth={true} maxWidth="xl" open={openPreviewMediaDialog}
                                              onClose={(e)=>{setOpenPreviewMediaDialog(false);}}
                                              innerDialog={<PreviewFileMediaDialog
                                                  agent_file_id={props.agent_file_id}
                                                  filename={props.filename_text}
                                                  onClose={(e)=>{setOpenPreviewMediaDialog(false);}} />}
                                />
                            }
                        </MythicCluster>
                    )}
                </TableCell>
                <TableCell>
                    <FileDownloadLinkWithAuth color="textPrimary" underline="always" href={"/direct/download/" + props.agent_file_id}>{props.filename_text}</FileDownloadLinkWithAuth>
                </TableCell>
                <TableCell>
                    <Link color="textPrimary" underline="always" href={"/new/eventing?eventgroup=" +  props.eventgroup?.id}>{props.eventgroup?.name}</Link>
                </TableCell>
                <TableCell>
                    {getStringSize({cellData: {"plaintext": props.size}})}
                </TableCell>
                <TableCell>
                    <ViewEditTags target_object={"filemeta_id"} target_object_id={props.id} me={me} />
                    <TagsDisplay tags={props.tags} />
                </TableCell>
                <TableCell>
                    <MythicActionButton iconOnly tone="neutral"  size="small" aria-label="expand row" onClick={expandRowButton}>
                        {openDetails ? <KeyboardArrowUpIcon className="mythicElement"/> : <KeyboardArrowDownIcon className="mythicElement"/>}
                    </MythicActionButton>
                </TableCell>
            </TableRow>
            {openDetails ? (
                <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                        <Collapse in={openDetails}>
                            <Box margin={1}>
                                <TableContainer className="mythicElement" elevation={3}>
                                    <Table  size="small" style={{"tableLayout": "fixed", "maxWidth": "100%", "overflow": "scroll"}}>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell style={{width: "25rem"}}>Identifiers</TableCell>
                                                <TableCell >Operator</TableCell>
                                                <TableCell>Timestamp</TableCell>
                                                <TableCell>Host File</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell>
                                                    <Typography variant="body2">MD5: {props.md5}</Typography>
                                                    <Typography variant="body2">SHA1: {props.sha1}</Typography>
                                                    <Typography variant="body2">UUID: {props.agent_file_id}</Typography>
                                                </TableCell>
                                                <TableCell><Typography variant="body2">{props.operator.username}</Typography></TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">{toLocalTime(props.timestamp, me.user.view_utc_time)}</Typography>

                                                </TableCell>
                                                <TableCell>
                                                    <MythicStyledTooltip title={"Host Payload Through C2"} >
                                                        <MythicActionButton iconOnly tone="info" emphasis="always"

                                                            size="small"
                                                            onClick={()=>{setOpenHostDialog(true);}}
                                                        >
                                                            <PublicIcon fontSize="small" />
                                                        </MythicActionButton>
                                                    </MythicStyledTooltip>
                                                    {openHostDialog &&
                                                        <MythicDialog fullWidth={true} maxWidth="md" open={openHostDialog}
                                                                      onClose={()=>{setOpenHostDialog(false);}}
                                                                      innerDialog={<HostFileDialog file_uuid={props.agent_file_id}
                                                                                                   file_name={props.full_remote_path_text === "" ? props.filename_text : props.full_remote_path_text}
                                                                                                   onClose={()=>{setOpenHostDialog(false);}} />}
                                                        />
                                                    }
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <C2HostedLocationsSummary hostedFiles={props.c2profile_file_hosts} />
                            </Box>
                        </Collapse>
                    </TableCell>
                </TableRow>
            ) : null }
        </React.Fragment>
    )
}
