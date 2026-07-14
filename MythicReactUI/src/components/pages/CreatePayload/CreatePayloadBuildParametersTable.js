import React from 'react';
import Collapse from '@mui/material/Collapse';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {CreatePayloadParameter} from './CreatePayloadParameter';
import {GetGroupedParameters} from "./Step1SelectOS";
import {MythicStack, MythicCluster} from "../../MythicComponents/MythicLayout";

const CreatePayloadBuildParameterGroup = ({group, children}) => {
    const [collapsed, setCollapsed] = React.useState(false);
    const hasHeader = group.name !== '' && group.name !== undefined;
    const toggleCollapsed = () => setCollapsed((current) => !current);

    return (
        <MythicStack component="section" gap="sm" className="mythic-create-parameter-group mythic-column-stack">
            {hasHeader &&
                <MythicCluster component="div" gap="xs" align="center" wrap={false}
                    aria-expanded={!collapsed}
                    className="mythic-create-parameter-group-header mythic-font-weight-extra-bold mythic-font-size-small mythic-line-height-snug mythic-create-parameter-group-header-collapsible mythic-clickable mythic-border-radius mythic-border"
                    onClick={toggleCollapsed}
                    onKeyDown={(event) => {
                        if(event.key === "Enter" || event.key === " "){
                            event.preventDefault();
                            toggleCollapsed();
                        }
                    }}
                    role="button"
                    tabIndex={0}
                >
                    {collapsed ?
                        <ChevronRightIcon className="mythic-create-parameter-group-header-icon mythic-flex-fixed" fontSize="small" /> :
                        <ExpandMoreIcon className="mythic-create-parameter-group-header-icon mythic-flex-fixed" fontSize="small" />
                    }
                    <span className="mythic-create-parameter-group-header-title mythic-break-anywhere mythic-min-width-0">{group.name}</span>
                </MythicCluster>
            }
            {hasHeader ? (
                <Collapse in={!collapsed} timeout="auto">
                    <MythicStack component="div" gap="sm" className="mythic-column-stack">
                        {children}
                    </MythicStack>
                </Collapse>
            ) : (
                <MythicStack component="div" gap="sm" className="mythic-column-stack">
                    {children}
                </MythicStack>
            )}
        </MythicStack>
    );
};

export function CreatePayloadBuildParametersTable(props){
    const buildParameters = GetGroupedParameters({
        buildParameters: props.buildParameters,
        os: props.os,
        c2_name: props.c2_name,
    });
    const getOtherParameters = () => {
        return buildParameters.reduce((prev, cur) => {
            const nestedParameters = cur.parameters.reduce((prev2, cur2) => {
                return {...prev2, [cur2.name]: cur2.value}
            }, {});
            return {...prev, ...nestedParameters};
        }, {});
    }
    return (
        <MythicStack component="div" gap="md" scroll className="mythic-create-parameter-scroll mythic-full-width mythic-full-height">
            {buildParameters.map(b => (
                b.parameters.length > 0 &&
                <CreatePayloadBuildParameterGroup group={b} key={b?.name || 'undefined'}>
                    {b.parameters.map( (op) => (
                        <CreatePayloadParameter
                            displayMode="card"
                            selected_os={props.os}
                            key={"buildparamtablerow" + op.id}
                            payload_type={props.payload_type}
                            c2_profile_name={props.c2_name}
                            instance_name={props.instance_name}
                            returnAllDictValues={props.returnAllDictValues}
                            onChange={props.onChange}
                            getOtherParameters={getOtherParameters}
                            {...op}
                        />
                    ))}
                </CreatePayloadBuildParameterGroup>
            ))}
        </MythicStack>

    );
}
