import TableCell from '@mui/material/TableCell';
import React from 'react';
import {Typography, Link} from '@mui/material';
import TableRow from '@mui/material/TableRow';
import DeleteIcon from '@mui/icons-material/Delete';
import Switch from '@mui/material/Switch';
import {toLocalTime} from "../../utilities/Time";
import {MythicStatusChip} from "../../MythicComponents/MythicStatusChip";
import {MythicCluster} from "../../MythicComponents/MythicLayout";
import {MythicActionButton} from "../../MythicComponents/MythicContent";

export function APITokenRow(props){
    return (
        <>
            <TableRow hover >
                <TableCell>
                    {props.deleted ? null : (
                        <MythicActionButton iconOnly tone="error"  size="small" onClick={() => {props.onDeleteAPIToken(props.id)}}>
                            <DeleteIcon fontSize="small" />
                        </MythicActionButton>
                    )}
                </TableCell>
                <TableCell>
                    <MythicCluster gap="sm" align="center" wrap={false} className="mythic-state-toggle-cell">
                        <Switch
                            color="success"
                            disabled={props.deleted}
                            checked={props.active}
                            onChange={() => {props.onToggleActive(props.id, !props.active)}}
                            inputProps={{ 'aria-label': 'Toggle API token active state' }}
                            name="active"
                            size="small"
                        />
                        <MythicStatusChip
                            label={props.deleted ? "Deleted" : props.active ? "Active" : "Disabled"}
                            status={props.deleted ? "error" : props.active ? "active" : "disabled"}
                        />
                    </MythicCluster>
                </TableCell>
                <TableCell>
                    <Typography>
                        {props.created_by_operator?.username}
                    </Typography>
                    {props.creation_time &&
                        <Typography color="textSecondary" style={{fontSize: "0.75rem"}}>
                            Created at: {toLocalTime(props.creation_time, props.me?.user?.view_utc_time)}
                        </Typography>
                    }
                </TableCell>
                <TableCell>
                    {(props.scopes || []).join(", ")}
                </TableCell>
                <TableCell>{props.token_type}</TableCell>
                <TableCell>{props.name}</TableCell>
                <TableCell>
                    {props.eventstepinstance &&
                    <>
                        <Typography>
                            {props.eventstepinstance?.eventgroupinstance?.eventgroup?.name}{" / "}
                            <Link target={"_blank"} color="textPrimary" underline="always"
                                href={'/new/eventing?eventgroup=' +
                                props?.eventstepinstance?.eventgroupinstance?.eventgroup?.id +
                                "&eventgroupinstance=" + props?.eventstepinstance?.eventgroupinstance?.id
                            }>
                            { props.eventstepinstance?.eventstep?.name}{" (" + props?.eventstepinstance?.eventgroupinstance?.id + ")"}
                        </Link>
                        </Typography>
                    </>
                    }
                </TableCell>

            </TableRow>
        </>

        )
}
