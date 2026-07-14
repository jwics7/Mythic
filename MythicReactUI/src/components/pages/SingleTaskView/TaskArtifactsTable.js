import TableCell from '@mui/material/TableCell';
import React, { useEffect } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import {MythicPageHeaderChip, MythicSectionHeader} from "../../MythicComponents/MythicPageHeader";
import {SingleTaskMetadataSection} from "./SingleTaskLayout";

export function TaskArtifactsTable(props){
   const [artifacts, setArtifacts] = React.useState([]);

   useEffect( () => {
    const condensed = props.tasks.reduce( (prev, tsk) => {
        const arts = tsk.taskartifacts.map(c => {return {...c, display_id: tsk.display_id}});
      return [...prev, ...arts];
    }, []);
    condensed.sort((a,b) => (a.task_id > b.task_id) ? 1 : ((b.task_id > a.task_id) ? -1 : 0));
    setArtifacts(condensed);
   }, [props.tasks]);
   if(artifacts.length === 0){
     return null
   }
   const artifactCountLabel = artifacts.length === 1 ? "1 artifact" : `${artifacts.length} artifacts`;
  return (
    <SingleTaskMetadataSection>
        <MythicSectionHeader
            dense
            title="Artifact Tasks"
            subtitle="Artifacts created while these tasks executed."
            actions={<MythicPageHeaderChip label={artifactCountLabel} />}
        />
        <TableContainer className="mythicElement mythic-single-task-table-wrap mythic-surface-raised mythic-overflow-auto">
          <Table className="mythic-single-task-table" size="small">
                <TableHead>
                    <TableRow>
                        <TableCell style={{width: "6rem"}}>Task ID</TableCell>
                        <TableCell style={{width: "12rem"}}>Artifact Type</TableCell>
                        <TableCell style={{width: "12rem"}}>Host</TableCell>
                        <TableCell>Artifact</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                  {artifacts.map( (artifact) => (
                    <TableRow key={"artifact" + artifact.id} hover>
                      <TableCell>{artifact.display_id}</TableCell>
                      <TableCell>{artifact.base_artifact}</TableCell>
                      <TableCell className="mythic-single-task-cell-break mythic-break-anywhere mythic-pre-wrap">{artifact.host}</TableCell>
                      <TableCell className="mythic-single-task-cell-break mythic-break-anywhere mythic-pre-wrap">{artifact.artifact_text}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
            </Table>
          </TableContainer>
    </SingleTaskMetadataSection>
  );
}
