import TableCell from '@mui/material/TableCell';
import React from 'react';
import TableRow from '@mui/material/TableRow';
import DeleteIcon from '@mui/icons-material/Delete';
import { MythicDialog } from '../../MythicComponents/MythicDialog';
import {MythicConfirmDialog} from '../../MythicComponents/MythicConfirmDialog';
import { MythicStyledTooltip } from '../../MythicComponents/MythicStyledTooltip';
import {NewTagtypesDialog} from './NewTagtypesDialog';
import EditIcon from '@mui/icons-material/Edit';
import {TagTypeChip} from "../../MythicComponents/MythicTagChip";
import {MythicActionButton} from "../../MythicComponents/MythicContent";


export function TagtypesTableRow(props){
    const [openUpdate, setOpenUpdateDialog] = React.useState(false);
    const [openDelete, setOpenDeleteDialog] = React.useState(false);

    const onAcceptDelete = () => {
        props.onDeleteTagtype(props.id);
        setOpenDeleteDialog(false);
    }

    return (
      
        <React.Fragment>
            <TableRow key={"payload" + props.id} hover>
                <TableCell>

                  <MythicStyledTooltip title={"Delete the tag type and all associated tags"}>
                    <MythicActionButton iconOnly tone="error"  size="small" onClick={()=>{setOpenDeleteDialog(true);}}><DeleteIcon fontSize="small" /></MythicActionButton>
                  </MythicStyledTooltip>
                  
                  {openDelete && 
                    <MythicConfirmDialog onClose={() => {setOpenDeleteDialog(false);}} onSubmit={onAcceptDelete} open={openDelete}/>
                  }
                  
                </TableCell>
                <TableCell>
                    <MythicActionButton iconOnly tone="info"  size="small" onClick={()=>{setOpenUpdateDialog(true);}}>
                        <EditIcon fontSize="small" />
                    </MythicActionButton>
                  {openUpdate && 
                    <MythicDialog fullWidth={true} maxWidth="md" open={openUpdate}
                      onClose={()=>{setOpenUpdateDialog(false);}} 
                      innerDialog={<NewTagtypesDialog onClose={()=>{setOpenUpdateDialog(false);}} onSubmit={props.onUpdateTagtype} currentTag={props}/>}
                  />}
                </TableCell>
                <TableCell>
                    {props.tags_aggregate.aggregate.count}
                </TableCell>
                <TableCell>
                  <TagTypeChip tagtype={props} />
                </TableCell>
                <TableCell>
                  {props.description}
                </TableCell>
            </TableRow>
        </React.Fragment>
    )
}
