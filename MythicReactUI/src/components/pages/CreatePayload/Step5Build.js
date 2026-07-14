import React, {useEffect} from 'react';
import { gql, useMutation} from '@apollo/client';
import { CreatePayloadNavigationButtons} from './CreatePayloadNavigationButtons';

import {PayloadSubscriptionNotification} from './PayloadSubscriptionNotification';
import MythicTextField from '../../MythicComponents/MythicTextField';
import {snackActions} from '../../utilities/Snackbar';
import {UploadTaskFile} from "../../MythicComponents/MythicFileUpload";
import {getSkewedNow} from "../../utilities/Time";
import {MythicAgentSVGIcon} from "../../MythicComponents/MythicAgentSVGIcon";
import {ConfigurationSummary, GetGroupedParameters} from "./Step1SelectOS";
import MenuBookIcon from '@mui/icons-material/MenuBook';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import {MythicStyledTooltip} from "../../MythicComponents/MythicStyledTooltip";
import {MythicPanel, MythicActionButton, MythicMetadataItem, MythicSectionHeading, MythicSectionDescription} from "../../MythicComponents/MythicContent";
import {MythicStack, MythicCluster, MythicGrid} from "../../MythicComponents/MythicLayout";

const create_payload = gql`
 mutation createPayloadMutation($payload: String!) {
  createPayload(payloadDefinition: $payload) {
    error
    status
    uuid
  }
}
 `;
export function Step5Build(props){
    const [fromNow, setFromNow] = React.useState( (getSkewedNow().toISOString()));
    const [filename, setFilename] = React.useState("");
    const [description, setDescription] = React.useState("");
    const [startSubscription, setStartSubscription] = React.useState(false);
    const [subscriptionID, setSubscriptionID] = React.useState("");
    const [createPayloadMutation] = useMutation(create_payload, {
        update: (cache, {data}) => {
            setSubscriptionID(data.createPayload.uuid);
            if(data.createPayload.status === "success"){
                snackActions.info("Submitted payload to build pipeline", {autoClose: 1000});
                if(!startSubscription){
                    setStartSubscription(true);
                }
            }else{
                snackActions.error(data.createPayload.error);
            }
        },
        onError: () => {
            snackActions.error("Failed to create Payload. Do you have an active operation set?")
        }
    });

    useEffect( () => {
        if(props.buildOptions[1]["file_extension"] !== ""){
            setFilename(props.buildOptions[1]["payload_type"] + "." + props.buildOptions[1]["file_extension"]);
        }else{
            setFilename(props.buildOptions[1]["payload_type"] );
        }
        
    }, [props.buildOptions]);
    const onChangeFilename = (name, value, error) => {
        setFilename(value);
    }
    const onChangeDescription = (name, value, error) => {
        setDescription(value);
    }
    const finished = async () => {
        let buildParameters = [];
        let params = GetGroupedParameters({
            buildParameters: props.buildOptions[1]["parameters"],
            os: props.buildOptions[1].os,
            c2_name: undefined}).reduce( (prev, cur) => {
               return [...prev, ...cur.parameters];
        }, []);
        for(let i = 0; i < params.length; i++){
            let param = params[i];
            if (param.parameter_type === "Dictionary") {
                const newDict = param.value.reduce((prev, cur) => {
                    if (cur.default_show) {
                        return {...prev, [cur.name]: cur.value};
                    }
                    return {...prev}
                }, {});
                buildParameters.push({name: param.name, value: newDict});
            } else if (param.parameter_type === "File") {
                if (typeof param.value === "string") {
                    buildParameters.push({name: param.name, value: param.value});
                }else if(param.value.legacy){
                    buildParameters.push({name: param.name, value: param.value.name});
                } else {
                    const newUUID = await UploadTaskFile(param.value, "Uploaded as build parameter for " + filename);
                    if (newUUID) {
                        if (newUUID !== "Missing file in form") {
                            buildParameters.push({name: param.name, value: newUUID});
                        }
                    } else {
                        snackActions.error("Failed to upload files")
                        return;
                    }
                }
            }else if(param.parameter_type === "FileMultiple"){
                let fileMultipleValues = [];
                for(let j = 0; j < param.value.length; j++){
                    if (typeof param.value[j] === "string") {
                        fileMultipleValues.push(param.value[j]);
                    }else if(param.value[j].legacy){
                        fileMultipleValues.push(param.value[j].name);
                    } else {
                        const newUUID = await UploadTaskFile(param.value[j], "Uploaded as build parameter for " + filename);
                        if (newUUID) {
                            if (newUUID !== "Missing file in form") {
                                fileMultipleValues.push(newUUID);
                            }
                        } else {
                            snackActions.error("Failed to upload files")
                            return;
                        }
                    }
                }
                buildParameters.push({name: param.name, value: fileMultipleValues});
            } else {
                buildParameters.push({name: param.name, value: param.value});
            }
        }
        let c2Profiles = [];
        for(let i = 0; i < props.buildOptions[3]?.c2?.length; i++){
            let instanceParam = {};
            let c2params = GetGroupedParameters({
                buildParameters: props.buildOptions[3].c2[i].c2profileparameters,
                os: props.buildOptions[1].os,
                c2_name: props.buildOptions[3].c2[i].name}).reduce( (prev, cur) => {
                return [...prev, ...cur.parameters];
            }, []);
            for(let j = 0; j < c2params.length; j++){
                let param = c2params[j];
                if(param.parameter_type === "Dictionary"){
                    const newDict = param.value.reduce( (prev, cur) => {
                        if(cur.default_show){
                            return {...prev, [cur.name]: cur.value};
                        }
                        return {...prev}
                    }, {});
                    instanceParam = {...instanceParam, [param.name]: newDict};
                } else if (param.parameter_type === "File") {
                    if (typeof param.value === "string") {
                        instanceParam = {...instanceParam, [param.name]: param.value};
                    } else {
                        const newUUID = await UploadTaskFile(param.value, "Uploaded as c2 parameter for " + filename);
                        if (newUUID) {
                            if (newUUID !== "Missing file in form") {
                                instanceParam = {...instanceParam, [param.name]: newUUID};
                            } else {
                                snackActions.error("Failed to upload files, missing file")
                            }
                        } else {
                            snackActions.error("Failed to upload files")
                            return;
                        }
                    }
                }else if(param.parameter_type === "FileMultiple"){
                    let fileMultipleValues = [];
                    for(let j = 0; j < param.value.length; j++){
                        if (typeof param.value[j] === "string") {
                            fileMultipleValues.push(param.value[j]);
                        } else {
                            const newUUID = await UploadTaskFile(param.value[j], "Uploaded as c2 parameter for " + filename);
                            if (newUUID) {
                                if (newUUID !== "Missing file in form") {
                                    fileMultipleValues.push(newUUID);
                                } else {
                                    snackActions.error("Failed to upload files, missing file")
                                }
                            } else {
                                snackActions.error("Failed to upload files")
                                return;
                            }
                        }
                    }
                    instanceParam = {...instanceParam, [param.name]: fileMultipleValues};
                } else {
                    instanceParam = {...instanceParam, [param.name]: param.value};
                    //return {...prev, [param.name]: param.value}
                }
            }
            c2Profiles.push({
                "c2_profile": props.buildOptions[3].c2[i].name,
                "c2_profile_parameters": instanceParam,
            })

        }
        const finishedPayload = {
            "selected_os": props.buildOptions[1].os,
            "payload_type": props.buildOptions[1].payload_type,
            "filename": filename,
            "description": description,
            "commands": props.buildOptions[2],
            "build_parameters": buildParameters,
            "c2_profiles": c2Profiles
            };
        //console.log("finishedPayload", finishedPayload)
        snackActions.info("Submitted Creation to Mythic...", {autoClose: 1000});
        createPayloadMutation({variables: {payload: JSON.stringify(finishedPayload)}}).catch( (e) => {console.log(e)} );
    }
    const canceled = () => {
        props.canceled();
    }

    return (
        <MythicStack component="div" gap="md" className="mythic-create-flow-shell mythic-min-height-0 mythic-full-height">
            <MythicStack component="div" gap="md" className="mythic-create-flow-content mythic-flex-fill mythic-overflow-hidden mythic-min-height-0">
                <MythicGrid component="div" gap="md" columns="custom" className="mythic-create-selection-grid mythic-flex-fixed mythic-min-width-0">
                    <MythicPanel data-mythic-component="create-section" layout="stack" gap="md" tone="muted" overflow="hidden">
                        <MythicCluster component="div" gap="md" align="start" wrap={false} className="mythic-create-agent-summary">
                            <MythicCluster component="div" gap="none" align="center" justify="center" wrap={false} className="mythic-create-agent-icon mythic-border-radius mythic-border">
                                <MythicAgentSVGIcon payload_type={props.buildOptions[1].payload_type} style={{width: "100%", height: "100%", objectFit: "contain"}} />
                            </MythicCluster>
                            <MythicStack component="div" gap="sm" className="mythic-create-meta-list">
                                <MythicMetadataItem label="Operating system">{props.buildOptions[1].os}</MythicMetadataItem>
                                <MythicMetadataItem label="Description">{props.buildOptions[1].description}</MythicMetadataItem>
                                <MythicStyledTooltip title={"Edit OS / Payload Type"}>
                                    <MythicActionButton iconOnly tone="info"  size="small" onClick={() => props.moveToStep(0)}>
                                        <DriveFileRenameOutlineIcon />
                                    </MythicActionButton>
                                </MythicStyledTooltip>
                            </MythicStack>
                        </MythicCluster>
                    </MythicPanel>
                    <MythicPanel data-mythic-component="create-section" layout="stack" gap="md" tone="muted" overflow="hidden">
                        <MythicCluster component="div" gap="md" align="start" justify="between" wrap={false} className="mythic-create-section-header">
                            <div>
                                <MythicSectionHeading component="div" className="mythic-create-section-title">
                                    Payload name and description
                                </MythicSectionHeading>
                                <MythicSectionDescription component="div" className="mythic-create-section-description">
                                    These values are used for the generated file and operator-facing description.
                                </MythicSectionDescription>
                            </div>
                        </MythicCluster>
                        <MythicStack component="div" gap="md" className="mythic-form mythic-full-width">
                            <MythicTextField onEnter={finished} autoFocus={true} required={false} placeholder={"Filename"}
                                             value={filename} multiline={false} onChange={onChangeFilename} display="inline-block"/>
                            <MythicTextField onEnter={finished} required={false} placeholder={"description"} value={description}
                                             multiline={false} onChange={onChangeDescription} display="inline-block"/>
                        </MythicStack>
                    </MythicPanel>
                </MythicGrid>

                <MythicGrid component="div" gap="md" columns="custom" className="mythic-create-builder-split mythic-create-builder-split-three mythic-flex-fill mythic-overflow-hidden mythic-min-height-0">
                    <MythicPanel data-mythic-component="create-section" layout="stack" gap="md" tone="muted" overflow="auto">
                        <MythicSectionHeading component="div" className="mythic-create-section-title" align="center">
                            Build parameter configuration
                            <MythicStyledTooltip title={"Edit Build Parameters"}>
                                <MythicActionButton iconOnly tone="info"  size="small" onClick={() => props.moveToStep(1)}>
                                    <DriveFileRenameOutlineIcon />
                                </MythicActionButton>
                            </MythicStyledTooltip>
                        </MythicSectionHeading>
                        <ConfigurationSummary buildParameters={props.buildOptions[1].parameters} os={props.buildOptions[1].os} />
                    </MythicPanel>
                    <MythicPanel data-mythic-component="create-section" layout="stack" gap="md" tone="muted" overflow="auto">
                        <MythicSectionHeading component="div" className="mythic-create-section-title" align="center">
                            Command selection
                            <MythicStyledTooltip title={"Edit Commands"}>
                                <MythicActionButton iconOnly tone="info"  size="small" onClick={() => props.moveToStep(2)}>
                                    <DriveFileRenameOutlineIcon />
                                </MythicActionButton>
                            </MythicStyledTooltip>
                        </MythicSectionHeading>
                        {props.buildOptions[2]?.map(c => (
                            <div key={c} style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
                                {c}
                                <MythicActionButton iconOnly tone="info"  size="small" onClick={(e) => e.stopPropagation()}
                                            href={"/docs/agents/" + props.buildOptions[1].payload_type + "/commands/" + c}
                                            style={{marginLeft: "10px", float: "right"}} target="_blank">
                                    <MenuBookIcon fontSize="small"/>
                                </MythicActionButton>
                            </div>
                        ))}

                    </MythicPanel>
                    <MythicPanel data-mythic-component="create-section" layout="stack" gap="md" tone="muted" overflow="auto">
                        <MythicSectionHeading component="div" className="mythic-create-section-title" align="center">
                            C2 configuration
                            <MythicStyledTooltip title={"Edit C2 Parameters"}>
                                <MythicActionButton iconOnly tone="info"  size="small" onClick={() => props.moveToStep(3)}>
                                    <DriveFileRenameOutlineIcon />
                                </MythicActionButton>
                            </MythicStyledTooltip>
                        </MythicSectionHeading>
                        {props.buildOptions[3]?.c2?.map( (c, index) => (
                            <ConfigurationSummary key={c.name + index} buildParameters={c.c2profileparameters}
                                                  os={props.buildOptions[1].os} c2_name={c.name} />
                        ))}
                    </MythicPanel>
                </MythicGrid>
            </MythicStack>

            <div className="mythic-create-flow-footer mythic-flex-fixed">
                <CreatePayloadNavigationButtons
                    first={props.first}
                    last={props.last}
                    canceled={canceled}
                    finished={finished}
                />
                <br/><br/>
            </div>
            {startSubscription &&
                <PayloadSubscriptionNotification me={props.me} subscriptionID={subscriptionID} fromNow={fromNow}/>}
        </MythicStack>

    );
} 
/*
<div style={{display: "flex", flexDirection: "column", height: "100%", width: "100%"}}>
            <Typography variant="h3" align="left" id="selectc2profiles" component="div"
                        style={{"marginLeft": "10px"}}>
                Payload Review
            </Typography>
            <br/>
            <div style={{display: "flex", flexDirection: "column", flexGrow: 1}}>
                <MythicTextField onEnter={finished} autoFocus={true} required={false} placeholder={"Filename"}
                                 value={filename} multiline={false} onChange={onChangeFilename} display="inline-block"/>
                <MythicTextField onEnter={finished} required={false} placeholder={"description"} value={description}
                                 multiline={false} onChange={onChangeDescription} display="inline-block"/>
            </div>
            <CreatePayloadNavigationButtons first={props.first} last={props.last} canceled={canceled}
                                            finished={finished} startOver={props.startOver} showExtraOptions={showExtraOptions}/>
            <br/><br/>
            {startSubscription &&
                <PayloadSubscriptionNotification me={props.me} subscriptionID={subscriptionID} fromNow={fromNow}/>}

        </div>
 */
