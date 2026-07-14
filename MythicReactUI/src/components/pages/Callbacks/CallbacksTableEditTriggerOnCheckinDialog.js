import React, {useEffect} from 'react';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import NotificationsActiveTwoToneIcon from '@mui/icons-material/NotificationsActiveTwoTone';
import MythicTextField from "../../MythicComponents/MythicTextField";
import {
    MythicDialogBody,
    MythicDialogButton,
    MythicDialogFooter,
    MythicDialogSection,
    MythicForm,
    MythicFormField
} from "../../MythicComponents/MythicDialogLayout";
import {MythicCluster, MythicGrid} from "../../MythicComponents/MythicLayout";
import {MythicPanel} from "../../MythicComponents/MythicContent";

const CallbackTriggerRule = ({children}) => (
    <MythicPanel component="div" density="flush" tone="inherit" className="mythic-callback-trigger-rule mythic-font-size-small mythic-text-secondary">
        {children}
    </MythicPanel>
);

export function CallbacksTableEditTriggerOnCheckinDialog(props) {
    const [comment, setComment] = React.useState(0);
    const onChange = (name, value, error) => {
        if(isNaN(parseInt(value))){
            setComment(0);
        } else {
            setComment(parseInt(value));
        }
    }
    useEffect( () => {
        setComment(props.trigger_on_checkin_after_time);
    }, [props.trigger_on_checkin_after_time]);
    const onSubmit = () => {
        props.onSubmit(comment);
    }
  return (
    <React.Fragment>
        <DialogTitle id="form-dialog-title">Callback check-in alert</DialogTitle>
        <DialogContent dividers={true}>
            <MythicDialogBody>
                <MythicCluster component="div" gap="md" align="start" wrap={false} className="mythic-callback-trigger-summary mythic-border-radius mythic-border mythic-surface-muted">
                    <span className={`mythic-callback-trigger-summary-icon mythic-justify-center mythic-inline-cluster mythic-border-radius mythic-border mythic-text-secondary mythic-flex-fixed ${comment > 0 ? "mythic-callback-trigger-summary-icon-active mythic-text-warning" : ""}`}>
                        <NotificationsActiveTwoToneIcon fontSize="small" />
                    </span>
                    <div className="mythic-callback-trigger-summary-copy mythic-min-width-0">
                        <Typography className="mythic-callback-trigger-summary-title mythic-text-primary mythic-font-size-body mythic-font-weight-extra-bold mythic-line-height-snug">
                            {comment > 0 ? `Alert after ${comment} minute${comment === 1 ? "" : "s"} without a check-in` : "Alerting disabled"}
                        </Typography>
                        <Typography className="mythic-callback-trigger-summary-description mythic-text-secondary mythic-font-size-small">
                            This setting only triggers when the callback checks in after crossing the configured threshold.
                        </Typography>
                    </div>
                </MythicCluster>
                <MythicDialogSection
                    title="Threshold"
                    description="Set how many minutes this callback can remain silent before its next check-in can trigger eventing."
                >
                    <MythicForm>
                        <MythicFormField
                            label="Minutes without a check-in"
                            description="Use 0 to disable this alert for the callback."
                        >
                            <div className="mythic-form-field-control mythic-min-width-0 mythic-full-width">
                                <MythicTextField
                                    autoFocus={true}
                                    onChange={onChange}
                                    type="number"
                                    value={comment}
                                    onEnter={onSubmit}
                                    name="Trigger threshold"
                                    showLabel={false}
                                    marginTop="0"
                                    marginBottom="0"
                                    InputProps={{inputProps: {min: 0}}}
                                />
                            </div>
                        </MythicFormField>
                    </MythicForm>
                </MythicDialogSection>
                <MythicDialogSection title="Eventing behavior">
                    <MythicGrid component="div" gap="sm" columns="custom" className="mythic-callback-trigger-rule-list">
                        <CallbackTriggerRule>
                            Trigger name: <strong className="mythic-text-primary">callback_checkin</strong>
                        </CallbackTriggerRule>
                        <CallbackTriggerRule>
                            Matching workflow filters still apply, including payload type and supported OS restrictions.
                        </CallbackTriggerRule>
                        <CallbackTriggerRule>
                            If no matching workflow exists, no workflow will run.
                        </CallbackTriggerRule>
                    </MythicGrid>
                </MythicDialogSection>
            </MythicDialogBody>
        </DialogContent>
        <MythicDialogFooter>
          <MythicDialogButton onClick={props.onClose}>
            Close
          </MythicDialogButton>
            {props.onSubmit &&
                <MythicDialogButton onClick={onSubmit} intent="primary">
                    Save Threshold
                </MythicDialogButton>
            }
        </MythicDialogFooter>
    </React.Fragment>
  );
}
