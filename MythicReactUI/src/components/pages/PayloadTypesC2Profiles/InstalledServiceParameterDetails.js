import React from 'react';
import {MythicStatusChip} from "../../MythicComponents/MythicStatusChip";
import {MythicCluster, MythicGrid} from "../../MythicComponents/MythicLayout";
import {MythicPanel, MythicText} from "../../MythicComponents/MythicContent";

export const formatParameterValue = (value, emptyValue = "Not set") => {
    if (value === undefined || value === null || value === "") {
        return emptyValue;
    }
    if (typeof value === "boolean") {
        return value ? "Yes" : "No";
    }
    if (Array.isArray(value)) {
        return value.length > 0 ? value.join(", ") : emptyValue;
    }
    if (typeof value === "object") {
        return Object.keys(value).length > 0 ? JSON.stringify(value, null, 2) : emptyValue;
    }
    return `${value}`;
};

export function ParameterMetadataItem({label, value, code = false, emptyValue = "Not set"}) {
    return (
        <div className="mythic-metadata-item mythic-min-width-0 mythic-border mythic-border-radius">
            <span className="mythic-metadata-label mythic-block mythic-font-size-xs mythic-font-weight-extra-bold mythic-line-height-tight mythic-uppercase mythic-text-secondary">{label}</span>
            <span className={code ? "mythic-metadata-code mythic-monospace mythic-block mythic-font-size-small mythic-line-height-normal mythic-break-anywhere mythic-pre-wrap mythic-min-width-0 mythic-text-primary" : "mythic-metadata-value mythic-block mythic-font-size-small mythic-line-height-normal mythic-break-anywhere mythic-pre-wrap mythic-min-width-0 mythic-text-primary"}>
                {formatParameterValue(value, emptyValue)}
            </span>
        </div>
    );
}

export function ParameterCodeBlock({children}) {
    return (
        <code className="mythic-code-block mythic-block mythic-monospace mythic-font-size-small mythic-border mythic-border-radius mythic-text-primary mythic-overflow-auto">
            {formatParameterValue(children)}
        </code>
    );
}

export function BuildParameterList({parameters}) {
    if (parameters.length === 0) {
        return (
            <MythicPanel component="div" density="flush" tone="raised" overflow="visible" radius="md" className="mythic-parameter-card">
                <MythicText component="div" preset="large-title" className="mythic-parameter-title">No build parameters</MythicText>
                <MythicText component="div" preset="secondary-copy" className="mythic-parameter-description">This service does not define build-time parameters.</MythicText>
            </MythicPanel>
        );
    }
    return (
        <MythicGrid component="div" gap="md" columns="custom" className="mythic-parameter-list mythic-min-width-0">
            {parameters.map((param) => (
                <MythicPanel component="div" density="flush" tone="raised" overflow="visible" radius="md" className="mythic-parameter-card" key={"buildprop" + param.id}>
                    <MythicCluster component="div" gap="md" align="start" justify="between" wrap={false} className="mythic-parameter-card-header">
                        <div>
                            <MythicText component="div" preset="large-title" className="mythic-parameter-title">{param.name}</MythicText>
                            <MythicText component="div" preset="secondary-copy" className="mythic-parameter-description">
                                {param.description || "No description provided."}
                            </MythicText>
                        </div>
                        <MythicCluster component="div" gap="xs" className="mythic-status-stack">
                            <MythicStatusChip label={param.parameter_type} status="neutral" showIcon={false} />
                            {param.required &&
                                <MythicStatusChip label="Required" status="warning" />
                            }
                            {param.randomize &&
                                <MythicStatusChip label="Randomized" status="info" />
                            }
                        </MythicCluster>
                    </MythicCluster>
                    <MythicGrid component="div" gap="sm" columns="custom" className="mythic-metadata-grid mythic-min-width-0">
                        <ParameterMetadataItem label="Scripting / Building Name" value={param.name} code />
                        <ParameterMetadataItem label="Default Value" value={param.default_value} code />
                        <ParameterMetadataItem label="Required" value={param.required} />
                        <ParameterMetadataItem label="Verifier Regex" value={param.verifier_regex} code />
                        {(param.choices || "").length > 0 &&
                            <ParameterMetadataItem label="Parameter Options" value={param.choices} code />
                        }
                        {param.randomize &&
                            <ParameterMetadataItem label="Format String" value={param.format_string} code />
                        }
                    </MythicGrid>
                </MythicPanel>
            ))}
        </MythicGrid>
    );
}
