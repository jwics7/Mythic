import React from 'react';
import {Chip} from '@mui/material';
import {MythicCluster, MythicGrid, MythicTruncatedText} from "../../MythicComponents/MythicLayout";

export const parseCredentialMetadata = (metadata) => {
    if(metadata === undefined || metadata === null){
        return {};
    }
    if(typeof metadata === "string"){
        try{
            const parsed = JSON.parse(metadata);
            return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
        }catch(error){
            return {};
        }
    }
    return metadata && typeof metadata === "object" && !Array.isArray(metadata) ? metadata : {};
}

export const compactMetadataValue = (value) => {
    if(value === undefined || value === null){
        return "";
    }
    if(typeof value === "object"){
        return JSON.stringify(value);
    }
    return `${value}`;
}

export const isPlainObject = (value) => value && typeof value === "object" && !Array.isArray(value);

export const getNestedMetadataObject = (metadata, key) => {
    const value = metadata?.[key];
    return isPlainObject(value) ? value : {};
}

export const getCredentialValidityChips = (metadata) => {
    const parsedMetadata = parseCredentialMetadata(metadata);
    const validity = parsedMetadata.validity || {};
    const chips = [];
    if(validity.not_yet_valid){
        chips.push({label: "not yet valid", color: "warning"});
    }
    if(validity.expired){
        chips.push({label: "expired", color: "error"});
    }
    if(validity.renew_expired){
        chips.push({label: "renew expired", color: "warning"});
    }
    if(chips.length === 0 && validity.has_lifecycle && validity.valid){
        chips.push({label: "valid", color: "success"});
    }
    return chips;
}

export function CredentialInspectorSection({title, actions, children, tone=""}){
    const sectionClassName = [
        "mythic-credential-search-section",
        "mythic-min-width-0",
        tone ? `mythic-credential-search-section-${tone}` : "",
    ].filter(Boolean).join(" ");
    return (
        <section className={sectionClassName}>
            <MythicCluster component="div" gap="sm" align="center" justify="between" wrap={false} className="mythic-credential-search-section-header mythic-font-weight-heavy mythic-letter-spacing-reset mythic-uppercase mythic-font-size-xs mythic-text-secondary">
                <span>{title}</span>
                {actions && <MythicCluster component="div" gap="xs" align="center" wrap={false} className="mythic-credential-search-section-actions mythic-flex-fixed">{actions}</MythicCluster>}
            </MythicCluster>
            <MythicGrid component="div" gap="xs" columns="custom" className="mythic-credential-search-section-body mythic-min-width-0">
                {children}
            </MythicGrid>
        </section>
    )
}

export function CredentialDetail({label, value, chip, wide=false, code=false, action, emphasis=false, tone=""}){
    const isReactValue = React.isValidElement(value);
    const displayValue = value === undefined || value === null || value === "" ? "-" : value;
    const detailClassName = [
        "mythic-credential-search-detail",
        "mythic-border mythic-border-radius mythic-min-width-0",
        wide ? "mythic-credential-search-detail-wide" : "",
        emphasis ? "mythic-credential-search-detail-emphasis" : "",
        tone ? `mythic-credential-search-detail-${tone}` : "",
    ].filter(Boolean).join(" ");
    return (
        <div className={detailClassName}>
            <MythicTruncatedText component="span" className="mythic-font-size-xs">{label}</MythicTruncatedText>
            <MythicGrid component="div" gap="xs" columns="custom" className="mythic-credential-search-detail-value-row mythic-min-width-0 mythic-align-center">
                <strong className={`mythic-truncate mythic-text-primary ${emphasis ? "mythic-font-weight-heavy" : ""} ${code ? "mythic-credential-search-code mythic-monospace" : ""}`.trim()} title={isReactValue ? undefined : `${displayValue}`}>
                    {displayValue}
                </strong>
                {action && <MythicCluster component="div" gap="none" align="center" wrap={false} className="mythic-credential-search-detail-action mythic-flex-fixed">{action}</MythicCluster>}
            </MythicGrid>
            {chip &&
                <Chip size="small" color={chip.color} variant="outlined" label={chip.label} className="mythic-credential-search-inline-chip mythic-max-width-full" />
            }
        </div>
    )
}

export function CredentialMetadataPair({name, value, tone=""}){
    const pairClassName = [
        "mythic-credential-search-metadata-pair",
        "mythic-border mythic-border-radius mythic-min-width-0",
        tone ? `mythic-credential-search-metadata-pair-${tone}` : "",
    ].filter(Boolean).join(" ");
    return (
        <div className={pairClassName}>
            <MythicTruncatedText component="span" className="mythic-font-size-xs" title={name}>{name}</MythicTruncatedText>
            <MythicTruncatedText component="strong" className="mythic-text-primary" title={compactMetadataValue(value)}>
                <MetadataValue value={value} />
            </MythicTruncatedText>
        </div>
    )
}

export function MetadataValue({value}){
    if(Array.isArray(value)){
        return <Chip size="small" variant="outlined" label={`array[${value.length}]`} className="mythic-credential-search-mini-chip mythic-max-width-full" />
    }
    if(isPlainObject(value)){
        const entries = Object.entries(value);
        return (
            <MythicGrid component="div" gap="none" columns="custom" className="mythic-credential-search-nested-metadata mythic-monospace mythic-min-width-0">
                {entries.map(([key, nestedValue]) => (
                    <div key={key} className="mythic-min-width-0">
                        <MythicTruncatedText component="span" className="mythic-font-size-xs">{key}</MythicTruncatedText>
                        <MythicTruncatedText component="strong" className="mythic-font-size-xs">{compactMetadataValue(nestedValue)}</MythicTruncatedText>
                    </div>
                ))}
            </MythicGrid>
        )
    }
    return <MythicTruncatedText component="span" >{compactMetadataValue(value)}</MythicTruncatedText>
}
