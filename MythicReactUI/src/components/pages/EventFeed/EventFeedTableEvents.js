import React from 'react';
import Typography from '@mui/material/Typography';
import { toLocalTime } from '../../utilities/Time';
import { meState } from '../../../cache';
import {useReactiveVar} from '@apollo/client';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import {EventFeedTableEventsActions} from './EventFeedTableEventsActions';
import {MythicStatusChip} from '../../MythicComponents/MythicStatusChip';
import styles from './EventFeedTableEvents.module.css';
import {MythicCluster} from "../../MythicComponents/MythicLayout";
import {MythicCodeSurface} from "../../MythicComponents/MythicContent";

const GetEventStatusChip = ({message}) => {
    if(message.warning || message.level === "warning"){
        return (
            <MythicStatusChip
                label={message.resolved ? "Resolved" : "Warning"}
                status={message.resolved ? "success" : "error"}
            />
        );
    }
    return (
        <MythicStatusChip
            label={message.level}
            status={message.level === "warning" ? "warning" : "info"}
        />
    );
}
export function EventFeedTableEvents(props){

    const me = useReactiveVar(meState);
    const isWarning = props.warning || props.level === "warning";

    return (
        <ListItem alignItems="flex-start" className={`${styles.root} mythic-full-width`}>
            <ListItemText disableTypography className={`${styles.content} mythic-full-width`}
                primary={
                    <React.Fragment>
                    <Typography
                        component="span"
                        variant="caption"
                        className={styles.inline}
                    >
                        {toLocalTime(props.timestamp, me?.user?.view_utc_time || false)}
                    </Typography>
                      <Typography
                        component="strong"
                        variant="body1"
                        className={styles.inline}
                      >
                        {props.count > 1 ? " ( " + props.count + " )" : ""}
                      </Typography>

                    </React.Fragment>
                }
                secondary={
                <MythicCluster component="div" gap="xs" className="mythic-search-result-inline mythic-search-result-inline-nowrap">
                    <GetEventStatusChip message={props} />
                    <MythicCodeSurface density="compact" overflow="visible" tone="snippet">
                        {props.message}
                    </MythicCodeSurface>
                </MythicCluster>
                }
            />
            <EventFeedTableEventsActions id={props.id} level={props.level} warning={isWarning}
              onUpdateResolution={props.onUpdateResolution}
              onUpdateLevel={props.onUpdateLevel}
              resolved={props.resolved}/>
        </ListItem>
    );
}
