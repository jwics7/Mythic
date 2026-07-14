import React from 'react';
import { Link } from 'react-router-dom';
import { useReactiveVar } from '@apollo/client';
import { meState } from '../../../cache';
import {MythicActionButton, MythicPanel} from "../../MythicComponents/MythicContent";

/*
    Takes in props for Boolean of first/last
    Takes in props for canceled
    Takes in props for finished
*/
export function CreatePayloadNavigationButtons(props){
    const me = useReactiveVar(meState);
    const disabledButtons = (me?.user?.current_operation_id || 0) > 0 ? false : true;
    return (
        <MythicPanel component="div" density="flush" gap="sm" layout="cluster" tone="muted" className="mythic-table-toolbar mythic-create-flow-footer mythic-align-stretch mythic-wrap mythic-full-width mythic-flex-fixed">
            <MythicActionButton tone="neutral"

                disabled={props.first}
                variant="contained"
                onClick={props.canceled}
              >
                Back
              </MythicActionButton>
              <MythicActionButton
                tone={props.last ? "success" : "info"}
                variant="contained"
                onClick={props.finished}
                disabled={props.disableNext || disabledButtons}
              >
                  {props.last ? props.showExtraOptions ? 'Create Payload Again' : 'Create Payload' : 'Next'}
              </MythicActionButton>
              {props.last && props.showExtraOptions &&
              <React.Fragment>
                <MythicActionButton tone="warning"

                  variant="contained"
                  onClick={props.startOver}
                >
                  Start Over
                </MythicActionButton>
              {props.showExtraOptions &&
                <MythicActionButton tone="info"

                  variant="contained"
                  component={Link}
                  to={"/new/createpayload"}
                >
                  Go To Create Another Base Payload
                </MythicActionButton>
              }
              </React.Fragment>

              }
        </MythicPanel>
    );
}
