import TableCell from '@mui/material/TableCell';
import React, { useEffect } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import {b64DecodeUnicode} from '../Callbacks/ResponseDisplay';
import {MythicPageHeaderChip, MythicSectionHeader} from "../../MythicComponents/MythicPageHeader";
import {MythicStatusChip} from "../../MythicComponents/MythicStatusChip";
import {FileDownloadLinkWithAuth} from "../../utilities/FileDownloadWithAuth";
import {SingleTaskMetadataSection} from "./SingleTaskLayout";
import {MythicStack} from "../../MythicComponents/MythicLayout";


export function TaskFilesTable(props){
   const [files, setFiles] = React.useState([]);

   useEffect( () => {
    const condensed = props.tasks.reduce( (prev, tsk) => {
        const fls = tsk.filemeta.map(c => {return {...c, display_id: tsk.display_id}});
      return [...prev, ...fls];
    }, []);
    setFiles(condensed);
    condensed.sort((a,b) => (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0));
   }, [props.tasks]);
   if(files.length === 0){
     return null
   }
   const fileCountLabel = files.length === 1 ? "1 file" : `${files.length} files`;
  return (
    <SingleTaskMetadataSection>
        <MythicSectionHeader
            dense
            title="Files / Screenshots"
            subtitle="Files, payloads, downloads, uploads, and screenshots associated with these tasks."
            actions={<MythicPageHeaderChip label={fileCountLabel} />}
        />
        <TableContainer className="mythicElement mythic-single-task-table-wrap mythic-surface-raised mythic-overflow-auto">
          <Table className="mythic-single-task-table mythic-single-task-files-table" size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>Filename</TableCell>
                        <TableCell style={{width: "8rem"}}>Type</TableCell>
                        <TableCell>Remote Path</TableCell>
                        <TableCell>Comment</TableCell>
                        <TableCell>Hashes</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                  {files.map( (file) => (
                    <TableRow key={"file" + file.id} hover>
                      <TableCell className="mythic-single-task-cell-break mythic-break-anywhere mythic-pre-wrap">
                        {!file.deleted && file.complete ? (
                          <FileDownloadLinkWithAuth className="mythic-single-task-table-link mythic-font-weight-bold" href={"/direct/download/" + file.agent_file_id}>{b64DecodeUnicode(file.filename_text)}</FileDownloadLinkWithAuth>
                        ) : ( 
                          !file.complete ? (
                            b64DecodeUnicode(file.filename_text) +  " (" + file.chunks_received + "/" + file.total_chunks + ")"
                          ) : (b64DecodeUnicode(file.filename_text))
                         )}
                        </TableCell>
                      <TableCell>
                        <TaskFileTypeChip file={file} />
                      </TableCell>
                      <TableCell className="mythic-single-task-cell-break mythic-break-anywhere mythic-pre-wrap">{b64DecodeUnicode(file.full_remote_path_text) === "" ? ("") : (file.host + "\n" + b64DecodeUnicode(file.full_remote_path_text)) }</TableCell>
                      <TableCell className="mythic-single-task-cell-break mythic-break-anywhere mythic-pre-wrap">{file.comment}</TableCell>
                      <TableCell>
                        <MythicStack component="div" gap="xs" className="mythic-single-task-hash-list mythic-break-anywhere mythic-monospace mythic-font-size-caption">
                          <span>MD5: {file.md5}</span>
                          <span>SHA1: {file.sha1}</span>
                        </MythicStack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
            </Table>
          </TableContainer>
    </SingleTaskMetadataSection>
  );
}

const TaskFileTypeChip = ({file}) => {
  if(file.deleted){
    return <MythicStatusChip label="Deleted" status="deleted" />;
  }
  if(!file.complete){
    return <MythicStatusChip label="In progress" status="building" />;
  }
  if(file.is_screenshot){
    return <MythicStatusChip label="Screenshot" status="info" showIcon={false} />;
  }
  if(file.is_payload){
    return <MythicStatusChip label="Payload" status="warning" showIcon={false} />;
  }
  if(file.is_download_from_agent){
    return <MythicStatusChip label="Download" status="success" showIcon={false} />;
  }
  return <MythicStatusChip label="Upload" status="neutral" showIcon={false} />;
}
