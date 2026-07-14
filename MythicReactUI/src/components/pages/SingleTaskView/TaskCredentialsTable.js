import TableCell from '@mui/material/TableCell';
import React, { useEffect } from 'react';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { MythicStyledTooltip } from '../../MythicComponents/MythicStyledTooltip';
import { copyStringToClipboard } from '../../utilities/Clipboard';

import {snackActions} from '../../utilities/Snackbar';
import {MythicPageHeaderChip, MythicSectionHeader} from "../../MythicComponents/MythicPageHeader";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {MythicStatusChip} from "../../MythicComponents/MythicStatusChip";
import {SingleTaskMetadataSection} from "./SingleTaskLayout";
import {MythicCluster} from "../../MythicComponents/MythicLayout";
import {MythicActionButton} from "../../MythicComponents/MythicContent";

export function TaskCredentialsTable(props){
   const [credentials, setCredentials] = React.useState([]);

   useEffect( () => {
    const condensed = props.tasks.reduce( (prev, tsk) => {
        const creds = tsk.credentials.map( c => {return {...c, display_id: tsk.display_id}});
      return [...prev, ...creds];
    }, []);
    setCredentials(condensed);
   }, [props.tasks]);
   if(credentials.length === 0){
     return null
   }
   const credentialCountLabel = credentials.length === 1 ? "1 credential" : `${credentials.length} credentials`;
  return (
    <SingleTaskMetadataSection>
        <MythicSectionHeader
            dense
            title="Credentials"
            subtitle="Credentials captured by the selected task set."
            actions={<MythicPageHeaderChip label={credentialCountLabel} />}
        />
        <TableContainer className="mythicElement mythic-single-task-table-wrap mythic-surface-raised mythic-overflow-auto">
          <Table className="mythic-single-task-table" size="small">
                <TableHead>
                    <TableRow>
                        <TableCell style={{width: "4.5rem"}}>Task</TableCell>
                        <TableCell style={{width: "9rem"}}>Type</TableCell>
                        <TableCell>Realm</TableCell>
                        <TableCell>Account</TableCell>
                        <TableCell>Credentials</TableCell>
                        <TableCell>Comment</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                  {credentials.map( (cred) => (
                    <CredentialTableRow cred={cred} key={"cred" + cred.id} />
                  ))}
                </TableBody>
            </Table>
          </TableContainer>
    </SingleTaskMetadataSection>
  );
}

const CredentialTableRow = ({cred}) => {
  const maxDisplayLength = 200;
  const displayCred = cred.credential_text.length > maxDisplayLength ? cred.credential_text.slice(0, maxDisplayLength) + "..." : cred.credential_text;
  const onCopyToClipboard = (data) => {
    let result = copyStringToClipboard(data);
    if(result){
      snackActions.success("Copied text!");
    }else{
      snackActions.error("Failed to copy text");
    }
}
  return (
    <TableRow key={"cred" + cred.id} hover>
      <TableCell>{cred.display_id}</TableCell>
      <TableCell>
        <MythicStatusChip label={cred.type} status="neutral" showIcon={false} />
      </TableCell>
      <TableCell className="mythic-single-task-cell-break mythic-break-anywhere mythic-pre-wrap">{cred.realm}</TableCell>
      <TableCell className="mythic-single-task-cell-break mythic-break-anywhere mythic-pre-wrap">{cred.account}</TableCell>
      <TableCell>
        {cred.credential_text.length > 64 ? 
          (
              <MythicCluster component="div" gap="sm" align="start" wrap={false} className="mythic-single-task-credential-cell">
                  <MythicStyledTooltip title={"Copy to clipboard"}>
                      <MythicActionButton iconOnly tone="info"  onClick={() => onCopyToClipboard(cred.credential_text)} size="small">
                          <ContentCopyIcon fontSize="small" />
                      </MythicActionButton>
                  </MythicStyledTooltip>
                  <Typography className="mythic-single-task-credential-text mythic-break-anywhere mythic-min-width-0" variant="body2">{displayCred}</Typography>
              </MythicCluster>
          )
          :
          (
              <React.Fragment>
                  <Typography className="mythic-single-task-credential-text mythic-break-anywhere mythic-min-width-0" variant="body2">{displayCred}</Typography>
              </React.Fragment>   
          )}
        </TableCell>
      <TableCell className="mythic-single-task-cell-break mythic-break-anywhere mythic-pre-wrap">{cred.comment}</TableCell>
    </TableRow>
  )
}
