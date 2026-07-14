import TableCell from '@mui/material/TableCell';
import React from 'react';
import Collapse from '@mui/material/Collapse';
import TableRow from '@mui/material/TableRow';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import {MythicStatusChip} from "../../MythicComponents/MythicStatusChip";
import {MythicStyledTooltip} from "../../MythicComponents/MythicStyledTooltip";
import {MythicStack, MythicCluster, MythicGrid, MythicTruncatedText} from "../../MythicComponents/MythicLayout";
import {MythicActionButton, MythicPanel} from "../../MythicComponents/MythicContent";

const normalizeValueList = (value) => {
    if(Array.isArray(value)){
        return value.filter((entry) => entry !== undefined && entry !== null && `${entry}`.length > 0);
    }
    if(value === undefined || value === null || value === ""){return []}
    return [`${value}`];
};

const hasValue = (value) => normalizeValueList(value).length > 0;

export const getInstalledServiceListTitle = (value) => normalizeValueList(value).join(", ");

export function InstalledServiceIdentity({name, typeLabel, status, deleted}) {
    return (
        <MythicStack component="div" gap="xs" align="start" className="mythic-installed-service-identity">
            <MythicCluster component="div" gap="sm" className="mythic-installed-service-name-row">
                <span className="mythic-installed-service-name mythic-font-weight-heavy mythic-break-anywhere mythic-line-height-snug mythic-text-primary">{name}</span>
                {typeLabel &&
                    <MythicStatusChip label={typeLabel} status={deleted ? "deleted" : "neutral"} showIcon={deleted} />
                }
            </MythicCluster>
            {status}
        </MythicStack>
    );
}

export function InstalledServiceListValue({value, limit = 4}) {
    const values = normalizeValueList(value);
    if(values.length === 0){
        return <span className="mythic-installed-service-empty-value mythic-font-size-small mythic-font-weight-semibold mythic-text-secondary">Not set</span>;
    }
    const visibleValues = values.slice(0, limit);
    const hiddenCount = values.length - visibleValues.length;
    return (
        <MythicCluster component="span" gap="xs" className="mythic-installed-service-chip-list" title={getInstalledServiceListTitle(values)}>
            {visibleValues.map((entry, index) => (
                <MythicTruncatedText component="span" className="mythic-installed-service-chip mythic-surface-subtle mythic-font-weight-strong mythic-line-height-tight mythic-font-size-caption mythic-border-radius mythic-border mythic-inline-flex mythic-text-primary" key={`${entry}-${index}`}>{entry}</MythicTruncatedText>
            ))}
            {hiddenCount > 0 &&
                <MythicTruncatedText component="span" className="mythic-installed-service-chip mythic-surface-subtle mythic-font-weight-strong mythic-line-height-tight mythic-font-size-caption mythic-installed-service-chip-more mythic-border-radius mythic-border mythic-inline-flex mythic-text-primary mythic-text-secondary">+{hiddenCount}</MythicTruncatedText>
            }
        </MythicCluster>
    );
}

export function InstalledServiceMetadataSummary({items = [], description}) {
    const visibleItems = items.filter((item) => hasValue(item.value) || item.render);
    const renderValue = (item) => {
        if(item.render){
            return (
                <span className="mythic-installed-service-metadata-custom-value mythic-min-width-0">
                    {item.render}
                </span>
            );
        }
        if(item.chip){
            return <InstalledServiceListValue value={[item.value]} limit={1} />;
        }
        if(Array.isArray(item.value)){
            return <InstalledServiceListValue value={item.value} limit={item.limit} />;
        }
        return (
            <span className={item.code ? "mythic-installed-service-metadata-code mythic-truncate mythic-surface-subtle mythic-nowrap mythic-line-height-snug mythic-monospace mythic-font-size-caption mythic-max-width-full mythic-border-radius mythic-border mythic-overflow-hidden mythic-text-primary" : "mythic-installed-service-metadata-value mythic-line-height-snug mythic-font-size-small mythic-truncate mythic-text-primary mythic-full-width"} title={`${item.value}`}>
                {`${item.value}`}
            </span>
        );
    };
    return (
        <MythicStack component="div" gap="sm" className="mythic-column-stack">
            {visibleItems.length > 0 &&
                <MythicGrid component="div" gap="none" columns="custom" className="mythic-installed-service-metadata-grid mythic-min-width-0">
                    {visibleItems.map((item) => (
                        <div className="mythic-installed-service-metadata-item" key={item.label}>
                            <MythicTruncatedText component="span" className="mythic-installed-service-metadata-label mythic-font-size-xs mythic-font-weight-strong mythic-line-height-tight mythic-text-secondary">{item.label}</MythicTruncatedText>
                            {renderValue(item)}
                        </div>
                    ))}
                </MythicGrid>
            }
            {description &&
                <div className="mythic-installed-service-description mythic-min-width-0 mythic-text-secondary" title={description}>
                    <span>Description</span>
                    <p className="mythic-overflow-hidden">{description}</p>
                </div>
            }
        </MythicStack>
    );
}

export function InstalledServiceDetailToggle({open, onClick, label = "details"}) {
    return (
        <MythicStyledTooltip title={open ? `Hide ${label}` : `Show ${label}`}>
            <MythicActionButton iconOnly tone="info"
                aria-label={open ? `hide ${label}` : `show ${label}`}
                aria-expanded={open}

                onClick={onClick}
                size="small"
            >
                {open ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
            </MythicActionButton>
        </MythicStyledTooltip>
    );
}

export function InstalledServiceDetailRow({open, colSpan, children}) {
    return (
        <TableRow className="mythic-installed-service-detail-row">
            <TableCell className="mythic-installed-service-detail-cell" colSpan={colSpan}>
                <Collapse in={open} timeout="auto" unmountOnExit>
                    <MythicGrid component="div" gap="md" columns="custom" className="mythic-installed-service-detail-panel mythic-surface-subtle mythic-divider-top">
                        {children}
                    </MythicGrid>
                </Collapse>
            </TableCell>
        </TableRow>
    );
}

export function InstalledServiceDetailSection({title, count, children}) {
    return (
        <MythicPanel component="div" density="flush" tone="surface" overflow="hidden" radius="md" className="mythic-installed-service-detail-section">
            <MythicCluster component="div" gap="none" align="center" justify="between" wrap={false} className="mythic-installed-service-detail-section-header mythic-divider-bottom mythic-font-size-small mythic-font-weight-heavy mythic-letter-spacing-reset">
                <span>{title}</span>
                {count !== undefined &&
                    <MythicStatusChip label={`${count}`} status={count > 0 ? "info" : "neutral"} showIcon={false} />
                }
            </MythicCluster>
            <div className="mythic-installed-service-detail-section-body">
                {children}
            </div>
        </MythicPanel>
    );
}

export function InstalledServiceDetailList({items = []}) {
    const visibleItems = items.filter((item) => hasValue(item.value));
    if(visibleItems.length === 0){
        return <div className="mythic-installed-service-empty-value mythic-font-size-small mythic-font-weight-semibold mythic-text-secondary">No additional details.</div>;
    }
    return (
        <MythicGrid component="div" gap="none" columns="custom" className="mythic-installed-service-detail-list">
            {visibleItems.map((item) => (
                <MythicStack component="div" gap="none" className="mythic-installed-service-detail-list-item" key={item.label}>
                    <span className="mythic-installed-service-detail-label mythic-font-size-xs mythic-font-weight-strong mythic-line-height-tight mythic-text-secondary">{item.label}</span>
                    {Array.isArray(item.value) ?
                        <InstalledServiceListValue value={item.value} limit={item.limit || 12} /> :
                        <span className={item.code ? "mythic-installed-service-metadata-code mythic-truncate mythic-surface-subtle mythic-nowrap mythic-line-height-snug mythic-monospace mythic-font-size-caption mythic-max-width-full mythic-border-radius mythic-border mythic-overflow-hidden mythic-text-primary" : "mythic-installed-service-detail-value mythic-line-height-snug mythic-font-size-small mythic-truncate mythic-text-primary mythic-full-width"}>{`${item.value}`}</span>
                    }
                </MythicStack>
            ))}
        </MythicGrid>
    );
}

export function InstalledServiceDefinitionList({items = [], emptyText = "No entries."}) {
    if(items.length === 0){
        return <div className="mythic-installed-service-empty-value mythic-font-size-small mythic-font-weight-semibold mythic-text-secondary">{emptyText}</div>;
    }
    return (
        <MythicStack component="div" gap="sm" className="mythic-installed-service-definition-list">
            {items.map((item, index) => (
                <MythicCluster component="div" gap="md" align="center" justify="between" wrap={false} className="mythic-installed-service-definition-row mythic-surface-subtle mythic-border-radius mythic-border" key={`${item.title || item.label || "item"}-${index}`}>
                    <MythicStack component="div" gap="none" className="mythic-installed-service-definition-main">
                        <span className="mythic-installed-service-definition-title mythic-break-anywhere mythic-line-height-snug mythic-font-size-small mythic-font-weight-extra-bold mythic-text-primary">{item.title || item.label}</span>
                        {item.subtitle &&
                            <span className="mythic-installed-service-definition-subtitle mythic-break-anywhere mythic-font-size-caption mythic-font-weight-semibold mythic-line-height-normal mythic-pre-wrap mythic-text-secondary">{item.subtitle}</span>
                        }
                        {item.description &&
                            <span className="mythic-installed-service-definition-description mythic-break-anywhere mythic-font-size-caption mythic-font-weight-semibold mythic-line-height-normal mythic-pre-wrap mythic-text-secondary">{item.description}</span>
                        }
                    </MythicStack>
                    {item.action &&
                        <MythicCluster component="div" gap="none" align="center" wrap={false} className="mythic-installed-service-definition-action mythic-flex-fixed">{item.action}</MythicCluster>
                    }
                </MythicCluster>
            ))}
        </MythicStack>
    );
}
