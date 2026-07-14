import React from 'react';
import {useMythicTokens} from '../../../themes/MythicThemeProvider';
import { LineChart } from '@mui/x-charts/LineChart';
import Slider from '@mui/material/Slider';
import { PieChart, pieArcLabelClasses } from '@mui/x-charts/PieChart';
import { axisClasses } from '@mui/x-charts/ChartsAxis';
import {Gauge} from '@mui/x-charts/Gauge';
import Table from '@mui/material/Table';
import TableContainer from '@mui/material/TableContainer';
import { BarChart } from '@mui/x-charts/BarChart';
import {MythicStyledTooltip} from "../../MythicComponents/MythicStyledTooltip";
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Paper from "@mui/material/Paper";
import {MythicEmptyState} from "../../MythicComponents/MythicStateDisplay";
import {MythicStack, MythicCluster} from "../../MythicComponents/MythicLayout";
import {MythicPanel} from "../../MythicComponents/MythicContent";

export const getDashboardColors = (theme) => [
    theme.palette.info.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.secondary.main,
    theme.palette.primary.main,
    ...Array.from({length: 10}, (_, index) => theme.color.chart[`series${index + 1}`]),
];

const DashboardCard = ({
    actions,
    bodyClassName = "",
    children,
    className = "",
    editing,
    removeElement,
    size = "standard",
    title,
    width = "100%",
}) => {
    return (
        <MythicPanel
            component={Paper}
            data-mythic-component="dashboard-card"
            density="flush"
            elevation={0}
            layout="stack"
            overflow="hidden"
            tone="raised"
            className={`mythic-dashboard-card mythic-relative mythic-full-width mythic-dashboard-card-${size} ${className}`.trim()}
            style={{width}}
        >
            {(title || actions || editing) &&
                <MythicCluster component="div" gap="md" align="center" justify="between" wrap={false} className="mythic-dashboard-card-header mythic-relative mythic-flex-fixed mythic-overflow-hidden">
                    <div className="mythic-dashboard-card-title mythic-letter-spacing-reset mythic-line-height-tight mythic-font-size-body-small mythic-font-weight-extra-bold mythic-text-primary mythic-min-width-0">
                        {title}
                    </div>
                    {(editing || actions) &&
                        <MythicCluster component="div" gap="xs" align="center" justify="end" className="mythic-dashboard-card-actions mythic-flex-fixed">
                            {actions}
                            {editing &&
                                <MythicStyledTooltip title={"Remove element"}>
                                    <IconButton
                                        className="mythic-dashboard-icon-button mythic-dashboard-icon-button-hover-danger mythic-border mythic-border-radius mythic-text-primary"
                                        onClick={removeElement}
                                        size="small"
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </MythicStyledTooltip>
                            }
                        </MythicCluster>
                    }
                </MythicCluster>
            }
            <div className={`mythic-dashboard-card-body mythic-stack mythic-flex-fill mythic-min-height-0 mythic-overflow-hidden ${bodyClassName}`.trim()}>
                {children}
            </div>
        </MythicPanel>
    );
};

const DashboardChartSurface = ({align = "stretch", children, kind, justify}) => (
    <MythicPanel
        component="div"
        data-mythic-component="dashboard-chart-surface"
        density="flush"
        fill
        layout="cluster"
        overflow="hidden"
        tone="subtle"
        className={`mythic-dashboard-chart-canvas mythic-dashboard-chart-canvas-${kind} mythic-full-width mythic-nowrap ${align === "center" ? "mythic-align-center" : "mythic-align-stretch"}${justify === "center" ? " mythic-justify-center" : ""}`}
    >
        {children}
    </MythicPanel>
);

export const DashboardEmptyCard = ({action, children, editing, removeElement, title, width = "100%"}) => (
    <DashboardCard
        bodyClassName="mythic-dashboard-card-body-empty"
        editing={editing}
        removeElement={removeElement}
        title={title}
        width={width}
    >
        <MythicStack component="div" gap="md" align="center" className="mythic-dashboard-empty-state mythic-justify-center mythic-font-size-small mythic-border-radius mythic-text-secondary mythic-flex-fill mythic-min-height-0">
            <div className="mythic-dashboard-empty-copy">
                {children}
            </div>
            {action &&
                <MythicCluster component="div" gap="none" align="center" justify="center" wrap={false} className="mythic-dashboard-empty-action">
                    {action}
                </MythicCluster>
            }
        </MythicStack>
    </DashboardCard>
);

const DashboardNoDataState = ({
    action,
    title = "No data yet",
    description = "This dashboard element will populate when matching operation activity exists.",
}) => (
    <MythicEmptyState
        action={action}
        compact
        title={title}
        description={description}
        minHeight={0}
        sx={{flex: "1 1 auto", height: "100%", minHeight: 0, p: 0}}
    />
);

export const PieChartCard = ({
                          data, width = "100%", additionalStyles, innerElement,
                                 margin = {
        left: 8,
        right: 8,
        top: 8,
        bottom: 8,
    }, colors,
                                 onClick, title = "", editing, removeElement, customizeElement
                      }) => {
    const [showLegend, setShowLegend] = React.useState(true);
    const toggleLegend = () => {
        setShowLegend(!showLegend);
    }
    const theme = useMythicTokens();
    const chartData = Array.isArray(data) ? data : [];
    const hasChartData = chartData.length > 0;
    return (
        <DashboardCard
            actions={
                <>
                    {customizeElement}
                    <MythicStyledTooltip title={showLegend ? "Hide Legend" : "Show Legend"}>
                        <IconButton className="mythic-dashboard-icon-button mythic-dashboard-icon-button-hover-info mythic-border mythic-border-radius mythic-text-primary" onClick={toggleLegend} size="small">
                            {showLegend ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                        </IconButton>
                    </MythicStyledTooltip>
                </>
            }
            bodyClassName="mythic-dashboard-chart-body"
            editing={editing}
            removeElement={removeElement}
            title={title}
            width={width}
        >
            {hasChartData ? (
                <DashboardChartSurface align="center" justify="center" kind="pie">
                    <PieChart
                        skipAnimation={true}
                        series={[
                            {
                                data: chartData,
                                highlightScope: {fade: 'global', highlighted: 'item'},
                                faded: {innerRadius: 0, additionalRadius: -10, color: 'gray'},
                                paddingAngle: 1,
                                cornerRadius: 4,
                                innerRadius: 0,
                                ...additionalStyles
                            },
                        ]}
                        height={210}
                        margin={margin}
                        sx={{
                            [`& .${pieArcLabelClasses.root}`]: {
                                fill: 'white',
                                fontWeight: 'bold',
                            },
                        }}
                        colors={colors || getDashboardColors(theme)}
                        onItemClick={onClick}
                        hideLegend={!showLegend}
                        slotProps={{
                            legend: {
                                direction: "vertical",
                                sx: {
                                    gap: "5px",
                                    ['.MuiChartsLegend-series']: {
                                        gap: '8px',
                                    },
                                    [`.MuiChartsLegend-mark`]: {
                                        height: 10,
                                        rx: 2,
                                        width: 10,
                                    },
                                    [`.MuiChartsLegend-label`]: {
                                        fontSize: 11,
                                        fontWeight: 650,
                                    },
                                }
                            }
                        }}>
                        {innerElement}
                    </PieChart>
                </DashboardChartSurface>
            ) : (
                <DashboardChartSurface kind="empty">
                    <DashboardNoDataState />
                </DashboardChartSurface>
            )}
        </DashboardCard>
    );
}
export const GaugeCard = ({data, width = "100%", title = "", editing, removeElement, customizeElement }) => {
    const theme = useMythicTokens();
    const online = data?.online || 0;
    const total = data?.total || 0;
    const percentOnline = total > 0 ? Math.round((online / total) * 100) : 0;
    const statusLevel = total === 0 ? "neutral" : percentOnline > 85 ? "success" : percentOnline > 50 ? "warning" : "danger";
    const statusLabel = total === 0 ? "No services" : percentOnline > 85 ? "Healthy" : percentOnline > 50 ? "Degraded" : "Attention";
    const getFillColor = () => {
        if(total === 0){return theme.palette.text.disabled}
        let ratio = online / total;
        if( ratio > 0.85){
            return theme.palette.success.main;
        }else if(ratio > 0.5){
            return theme.palette.warning.main;
        } else {
            return theme.palette.error.main;
        }
    }
    return (
        <DashboardCard
            actions={customizeElement}
            bodyClassName="mythic-dashboard-kpi-body"
            editing={editing}
            removeElement={removeElement}
            size="metric"
            title={title}
            width={width}
        >
            <MythicCluster component="div" gap="md" align="center" justify="between" wrap={false} className="mythic-dashboard-service-kpi mythic-surface-subtle mythic-fill mythic-border-radius mythic-border mythic-overflow-hidden">
                <MythicStack component="div" gap="none" className="mythic-dashboard-kpi-main mythic-justify-center mythic-flex-fill mythic-min-height-0">
                    <MythicCluster component="div" gap="sm" align="center" justify="between" wrap={false} className="mythic-dashboard-kpi-status-row">
                        <span className={`mythic-dashboard-kpi-chip mythic-truncate mythic-max-width-full mythic-font-weight-heavy mythic-line-height-compact mythic-nowrap mythic-font-size-xs mythic-inline-cluster mythic-flex-fixed mythic-overflow-hidden mythic-border-radius-pill mythic-dashboard-kpi-chip-${statusLevel}`}>
                            {statusLabel}
                        </span>
                        <span className="mythic-dashboard-kpi-percent mythic-font-weight-heavy mythic-line-height-compact mythic-font-size-caption mythic-text-secondary mythic-flex-fixed">{percentOnline}%</span>
                    </MythicCluster>
                    <MythicCluster component="div" gap="xs" wrap={false} align="stretch" className="mythic-dashboard-kpi-value-row">
                        <span className="mythic-dashboard-kpi-value mythic-letter-spacing-reset mythic-text-primary">{online}</span>
                        <span className="mythic-dashboard-kpi-total mythic-line-height-compact mythic-font-weight-strong mythic-text-secondary">/ {total}</span>
                    </MythicCluster>
                    <div className="mythic-dashboard-kpi-label mythic-font-size-small mythic-letter-spacing-reset mythic-font-weight-strong mythic-line-height-snug mythic-text-secondary">
                        Services online
                    </div>
                </MythicStack>
                <MythicCluster component="div" gap="none" align="center" justify="center" wrap={false} className="mythic-dashboard-kpi-gauge">
                    <Gauge
                        height={112}
                        width={112}
                        skipAnimation={true}
                        valueMax={total > 0 ? total : 100}
                        value={online}
                        innerRadius={"72%"}
                        cornerRadius="20%"
                        text={() => `${percentOnline}%`}
                        sx={() => ({
                            [`& .MuiGauge-valueText > text > tspan`]: {
                                fontSize: 18,
                                fontWeight: 850,
                            },
                            [`.MuiGauge-valueArc`]: {
                                fill: getFillColor(),
                            },
                        })}
                    >
                    </Gauge>
                </MythicCluster>
            </MythicCluster>
        </DashboardCard>
    );
}
export const CallbackDataCard = ({mainTitle, primaryValue, totalValue, primaryLabel, secondaryValue, secondaryLabel,
                                 statusLabel = "Tracking", statusLevel = "info", onClick, width="100%",
                                 actions, editing, removeElement}) => {
    const handleKeyDown = (event) => {
        if(!onClick){
            return;
        }
        if(event.key === "Enter" || event.key === " "){
            event.preventDefault();
            onClick();
        }
    };
    return (
        <DashboardCard
            actions={actions}
            bodyClassName="mythic-dashboard-kpi-body"
            editing={editing}
            removeElement={removeElement}
            size="metric"
            title={mainTitle}
            width={width}
        >
            <MythicStyledTooltip title={"Go to Active Callbacks"}>
                <MythicStack component="div" gap="md"
                    className="mythic-dashboard-callback-kpi mythic-surface-subtle mythic-clickable mythic-justify-between mythic-border-radius mythic-border mythic-flex-fill mythic-min-height-0 mythic-overflow-hidden"
                    onClick={onClick}
                    onKeyDown={handleKeyDown}
                    role={onClick ? "button" : undefined}
                    tabIndex={onClick ? 0 : undefined}
                >
                    <MythicStack component="div" gap="none" className="mythic-dashboard-kpi-main mythic-justify-center mythic-flex-fill mythic-min-height-0">
                        <MythicCluster component="div" gap="sm" align="center" justify="between" wrap={false} className="mythic-dashboard-kpi-status-row">
                            <span className={`mythic-dashboard-kpi-chip mythic-truncate mythic-max-width-full mythic-font-weight-heavy mythic-line-height-compact mythic-nowrap mythic-font-size-xs mythic-inline-cluster mythic-flex-fixed mythic-overflow-hidden mythic-border-radius-pill mythic-dashboard-kpi-chip-${statusLevel}`}>
                                {statusLabel}
                            </span>
                        </MythicCluster>
                        <MythicCluster component="div" gap="xs" wrap={false} align="stretch" className="mythic-dashboard-kpi-value-row">
                            <span className="mythic-dashboard-kpi-value mythic-letter-spacing-reset mythic-text-primary">{primaryValue}</span>
                            <span className="mythic-dashboard-kpi-total mythic-line-height-compact mythic-font-weight-strong mythic-text-secondary">/ {totalValue}</span>
                        </MythicCluster>
                        <div className="mythic-dashboard-kpi-label mythic-font-size-small mythic-letter-spacing-reset mythic-font-weight-strong mythic-line-height-snug mythic-text-secondary">
                            {primaryLabel}
                        </div>
                    </MythicStack>
                    <MythicCluster component="div" gap="sm" align="center" wrap={false} className="mythic-dashboard-kpi-secondary-panel mythic-surface-subtle mythic-border-radius mythic-border">
                        <span className="mythic-dashboard-kpi-secondary-value mythic-line-height-compact mythic-flex-fixed mythic-text-primary">{secondaryValue}</span>
                        <span className="mythic-dashboard-kpi-secondary-label mythic-font-size-caption mythic-break-anywhere mythic-line-height-snug mythic-font-weight-bold mythic-text-secondary mythic-min-width-0">{secondaryLabel}</span>
                    </MythicCluster>
                </MythicStack>
            </MythicStyledTooltip>
        </DashboardCard>
    )
}
export const TableDataCard = ({
    title,
    width = "100%",
    tableHead,
    tableBody,
    editing,
    removeElement,
    customizeElement,
    empty = false,
    emptyTitle,
    emptyDescription,
    emptyAction,
    summary = true,
    tableClassName = "",
}) => {
    const tableClasses = [
        "mythic-dashboard-table",
        "mythic-full-width",
        summary ? "mythic-dashboard-summary-table" : "",
        tableClassName,
    ].filter(Boolean).join(" ");
    return (
        <DashboardCard
            actions={customizeElement}
            bodyClassName="mythic-dashboard-table-body"
            editing={editing}
            removeElement={removeElement}
            size="table"
            title={title}
            width={width}
        >
            {empty ? (
                <MythicCluster component={TableContainer} gap="none" wrap={false} align="stretch" className="mythic-dashboard-table-container mythic-dashboard-empty-container mythicElement mythic-fill mythic-full-width mythic-full-height mythic-overflow-auto mythic-overflow-hidden">
                    <DashboardNoDataState title={emptyTitle} description={emptyDescription} action={emptyAction} />
                </MythicCluster>
            ) : (
                <TableContainer className="mythic-dashboard-table-container mythicElement mythic-fill mythic-full-width mythic-full-height mythic-overflow-auto">
                    <Table className={tableClasses} stickyHeader size="small">
                        {tableHead}
                        {tableBody}
                    </Table>
                </TableContainer>
            )}
        </DashboardCard>
    )
}
export const LineTimeChartCard = ({data, additionalStyles}) => {
    const [value, setValue] = React.useState([0, 0]);
    const [range, setRange] = React.useState([0, 0]);
    React.useEffect( () => {

        if(data.length > 0){
            setValue([0, data.length-1])
            setRange([0, data.length-1])
        }

    }, [data]);
    const minDistance = 1;
    const handleChange = (event, newValue, activeThumb) => {
        if (!Array.isArray(newValue)) {
            return;
        }

        if (newValue[1] - newValue[0] < minDistance) {
            if (activeThumb === 0) {
                const clamped = Math.min(newValue[0], 100 - minDistance);
                setValue([clamped, clamped + minDistance]);
            } else {
                const clamped = Math.max(newValue[1], minDistance);
                setValue([clamped - minDistance, clamped]);
            }
        } else {
            setValue(newValue);
        }
    };
    return (
        <DashboardCard bodyClassName="mythic-dashboard-chart-body" title="Tasks Issued per Day" size="wide">
            <DashboardChartSurface justify="center" kind="line">
                <LineChart
                    xAxis={[
                        {
                            dataKey: 'x',
                            scaleType: "time",
                            min: data[value[0]]?.x || 0,
                            max: data[value[1]]?.x || 0,
                            id: 'bottomAxis',
                            labelStyle: {
                                fontSize: 10,
                            },
                            tickLabelStyle: {
                                angle: 0,
                                fontSize: 10,
                            },

                        },
                    ]}
                    series={[
                        {
                            dataKey: 'y',
                            label: "mythic_admin",
                            showMark: ({index}) => index % 2 === 0,
                        }
                    ]}
                    sx={{
                        [`.${axisClasses.left} .${axisClasses.label}`]: {
                            transform: 'translate(-25px, 0)',
                        },
                        [`.${axisClasses.right} .${axisClasses.label}`]: {
                            transform: 'translate(30px, 0)',
                        },
                    }}
                    margin={{ top: 18, right: 20, bottom: 28, left: 42 }}
                    dataset={data}
                    height={186}
                    {...additionalStyles}
                ></LineChart>
            </DashboardChartSurface>
            <MythicCluster component="div" gap="none" align="center" justify="center" wrap={false} className="mythic-dashboard-chart-slider-row mythic-surface-subtle mythic-border-radius mythic-border mythic-flex-fixed">
                <Slider
                    value={value}
                    onChange={handleChange}
                    valueLabelDisplay="auto"
                    min={range[0]}
                    max={range[1]}
                    className="mythic-dashboard-slider"
                />
            </MythicCluster>
        </DashboardCard>

    )
}
export const LineTimeMultiChartCard = ({data, additionalStyles, colors, view_utc_time, editing, removeElement, customizeElement}) => {
    const theme = useMythicTokens();
    const [value, setValue] = React.useState([0, 0]);
    const [range, setRange] = React.useState([0, 0]);
    const hasChartData = (data?.x?.length || 0) > 0 && (data?.y?.length || 0) > 0;
    React.useEffect( () => {

        if(data.x.length > 0){
            setValue([data.x.length - 8 > 0 ? data.x.length - 8 : 0, data.x.length-1])
            setRange([0, data.x.length-1])
        }

    }, [data]);
    const minDistance = 1;
    const [showLegend, setShowLegend] = React.useState(true);
    const toggleLegend = () => {
        setShowLegend(!showLegend);
    }
    const handleChange = (event, newValue, activeThumb) => {
        if (!Array.isArray(newValue)) {
            return;
        }

        if (newValue[1] - newValue[0] < minDistance) {
            if (activeThumb === 0) {
                const clamped = Math.min(newValue[0], 100 - minDistance);
                setValue([Math.max(0, clamped), Math.min(clamped + minDistance, data.x.length > 0 ? data.x.length -1 : 0)]);
            } else {
                const clamped = Math.max(newValue[1], minDistance);
                setValue([Math.max(0, clamped - minDistance), Math.min(clamped, data.x.length > 0 ? data.x.length -1 : 0)]);
            }
        } else {
            setValue(newValue);
        }
    };
    const sliderDate = (sliderVal, view_utc_time) => {
        if(view_utc_time){
            try {
                return data.x?.[sliderVal]?.toISOString()?.substr(0, 10);
            }catch(error){
                console.log("sliderDate utc error", error, sliderVal, data.x)
                return String(sliderVal);
            }
        }
        try {
            return data.x?.[sliderVal]?.toDateString();
        }catch(error){
            console.log("sliderDate error", error, sliderVal, data.x)
            return String(sliderVal);
        }
    }
    return (
        <DashboardCard
            actions={
                <>
                    {customizeElement}
                    <MythicStyledTooltip title={showLegend ? "Hide Legend" : "Show Legend"}>
                        <IconButton className="mythic-dashboard-icon-button mythic-dashboard-icon-button-hover-info mythic-border mythic-border-radius mythic-text-primary" onClick={toggleLegend} size="small">
                            {showLegend ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                        </IconButton>
                    </MythicStyledTooltip>
                </>
            }
            bodyClassName="mythic-dashboard-chart-body"
            editing={editing}
            removeElement={removeElement}
            size="wide"
            title={`Activity per Day ${view_utc_time ? "(UTC)" : `(${Intl?.DateTimeFormat()?.resolvedOptions()?.timeZone})`}`}
        >
            {hasChartData ? (
                <>
                    <DashboardChartSurface justify="center" kind="line">
                        <LineChart
                            colors={colors || getDashboardColors(theme)}
                            hideLegend={!showLegend}
                            xAxis={[
                                {
                                    data: data.x,
                                    scaleType: "time",
                                    min: data?.x?.[value[0]] || 0,
                                    max: data?.x?.[value[1]] || 0,
                                    id: 'bottomAxis',
                                    tickMinStep: 86400000,
                                    labelStyle: {
                                        fontSize: 10,
                                    },
                                    tickLabelStyle: {
                                        angle: 0,
                                        fontSize: 10,
                                    },
                                },
                            ]}
                            yAxis={[
                                {id: "taskAxis", scaleType: "linear", label: "Tasks Issued"},
                                {id: "callbackAxis", scaleType: "linear", label: "Active Callbacks", position: "right"}
                            ]}
                            series={data.y}
                            sx={{
                                [`.${axisClasses.left} .${axisClasses.label}`]: {
                                    fontSize: 10,
                                },
                                [`.${axisClasses.right} .${axisClasses.label}`]: {
                                    fontSize: 10,
                                },
                            }}
                            margin={{ top: 18, right: 46, bottom: 30, left: 48 }}
                            height={186}
                            {...additionalStyles}
                        ></LineChart>
                    </DashboardChartSurface>
                    <MythicCluster component="div" gap="none" align="center" justify="center" wrap={false} className="mythic-dashboard-chart-slider-row mythic-surface-subtle mythic-border-radius mythic-border mythic-flex-fixed">
                        <Slider
                            value={value}
                            onChange={handleChange}
                            size={"small"}
                            valueLabelDisplay={"auto"}
                            valueLabelFormat={sliderVal => sliderDate(sliderVal, view_utc_time)}
                            min={range[0]}
                            max={range[1]}
                            className="mythic-dashboard-slider"
                        />
                    </MythicCluster>
                </>
            ) : (
                <DashboardChartSurface kind="empty">
                    <DashboardNoDataState
                        title="No activity yet"
                        description="Task and callback activity will appear here once the operation has timeline data."
                    />
                </DashboardChartSurface>
            )}
        </DashboardCard>

    )
}
export const StackedBarChartCard = ({data, labels, title, width="100%", hidden, colors, margin={
    right: 10,
    top: 40,
    bottom: 10,
}}) => {
    const theme = useMythicTokens();
    return (
        <DashboardCard title={title} width={width}>
            <BarChart
                xAxis={[{
                    scaleType: "band",
                    data: labels,
                    tickLabelInterval: (value, index) => false
                }]}
                margin={margin}
                layout={"vertical"}
                series={data}
                height={200}
                colors={colors || getDashboardColors(theme)}
                hideLegend={hidden}
                slotProps={{
                    legend: {

                        padding: 15,
                        direction: "horizontal",

                        position: {
                            vertical: "top",
                            horizontal: "end"
                        }
                    }
                }} />
        </DashboardCard>
    );
}
