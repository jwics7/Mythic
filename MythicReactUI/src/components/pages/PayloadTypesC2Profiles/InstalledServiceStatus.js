import React from 'react';
import {MythicCluster, MythicTruncatedText} from "../../MythicComponents/MythicLayout";

const getServiceStatusTone = (isOnline, fallbackTone = "success") => isOnline ? fallbackTone : "error";

const InstalledServiceStatusSummary = ({label, tone, details = []}) => (
    <div className={`mythic-service-status-summary mythic-align-start mythic-stack mythic-service-status-summary-${tone}`.trim()}>
        <MythicCluster component="div" gap="sm" align="center" wrap={false} className="mythic-service-status-primary mythic-font-size-body-small mythic-font-weight-extra-bold mythic-line-height-snug mythic-text-primary">
            <span className="mythic-service-status-dot mythic-border-radius-pill mythic-flex-fixed" />
            <MythicTruncatedText component="span" className="mythic-service-status-primary-label">{label}</MythicTruncatedText>
        </MythicCluster>
        {details.length > 0 &&
            <MythicCluster component="div" gap="none" className="mythic-service-status-details mythic-font-size-caption mythic-font-weight-semibold mythic-text-secondary">
                {details.map((detail) => (
                    <span
                        className={`mythic-service-status-detail mythic-inline-cluster mythic-min-width-0 mythic-service-status-detail-${detail.tone || "neutral"}`.trim()}
                        key={`${detail.label}-${detail.value}`}
                    >
                        <span className="mythic-service-status-mini-dot mythic-border-radius-pill mythic-flex-fixed" />
                        <span className="mythic-service-status-detail-label mythic-text-secondary">{detail.label}</span>
                        <span className="mythic-service-status-detail-value mythic-font-weight-strong mythic-text-primary">{detail.value}</span>
                    </span>
                ))}
            </MythicCluster>
        }
    </div>
);

export const InstalledServiceContainerStatus = ({isOnline}) => (
    <InstalledServiceStatusSummary
        label={isOnline ? "Container online" : "Container offline"}
        tone={isOnline ? "success" : "error"}
    />
);

const getC2ProfileStatusSummary = (service) => {
    if(!service.container_running){
        return {label: "Container offline", tone: "error"};
    }
    if(service.is_p2p){
        return {label: "Container online", tone: "success"};
    }
    if(service.running){
        return {label: "Accepting connections", tone: "success"};
    }
    return {label: "Server stopped", tone: "warning"};
}

const getC2ProfileStatusDetails = (service) => {
    if(service.is_p2p){
        return [];
    }
    if(!service.container_running){
        return [{label: "Server", value: "unavailable", tone: "neutral"}];
    }
    return [{label: "Container", value: "online", tone: getServiceStatusTone(service.container_running, "neutral")}];
}

export const C2ProfileStatusSummary = ({service}) => {
    const summary = getC2ProfileStatusSummary(service);
    return (
        <InstalledServiceStatusSummary
            label={summary.label}
            tone={summary.tone}
            details={getC2ProfileStatusDetails(service)}
        />
    )
}
