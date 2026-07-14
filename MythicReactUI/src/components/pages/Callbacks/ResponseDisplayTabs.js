import React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import {a11yProps} from "../../MythicComponents/MythicTabPanel";
import {ResponseDisplayBrowserScriptComponent} from "./ResponseDisplay";
import {MythicStack, MythicTruncatedText} from "../../MythicComponents/MythicLayout";

function ResponseDisplayTabsLabel(props) {
    const { label, index, ...other } =
        props;
    return (
        <Tab
            label={
                <MythicTruncatedText component="span" className="mythic-response-tab-label mythic-block">
                    {label}
                </MythicTruncatedText>
            }
            className="mythic-response-tab mythic-font-size-small mythic-font-weight-strong mythic-line-height-tight mythic-min-width-0 mythic-flex-fixed mythic-overflow-hidden mythic-border mythic-border-radius mythic-text-secondary"
            title={typeof label === "string" ? label : undefined}
            wrapped={false}
            {...a11yProps(index)}
            {...other}
        />
    );
}
function ResponseDisplayTabsPanel(props) {
    const { children, value, index,  ...other } =
        props;
    const style =
        props.style === undefined
            ? {
                display: value === index ? "flex" : "none",
            }
            : props.style;
    return (
        <div
            role='tabpanel'
            hidden={value !== index}
            id={`scrollable-auto-tabpanel-${index}`}
            aria-labelledby={`scrollable-auto-tab-${index}`}
            className="mythic-response-tabs-panel mythic-max-width-full mythic-fill mythic-flex-column mythic-full-width mythic-overflow-auto"
            style={style}
            {...other}>
            {<React.Fragment>{children}</React.Fragment>}
        </div>
    );
}
export function ResponseDisplayTabs({ tabs, task, expand, displayType, output }) {
    const [value, setValue] = React.useState(0);
    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <MythicStack component="div" gap="none" className="mythic-response-tabs mythic-max-width-full mythic-border-radius mythic-full-width mythic-overflow-hidden mythic-min-height-0 mythic-surface-raised mythic-border mythic-flex-fill" style={{height: expand ? "100%" : "400px"}}>
            <div className="mythic-response-tabs-bar mythic-divider-bottom mythic-min-width-0 mythic-flex-fixed mythic-overflow-hidden mythic-surface-muted">
                <Tabs
                    value={value}
                    variant="scrollable"
                    scrollButtons="auto"
                    allowScrollButtonsMobile
                    onChange={handleChange}
                    indicatorColor="primary"
                    textColor="inherit"
                    className="mythic-response-tabs-list"
                    TabIndicatorProps={{style: {
                        display: "none",
                    }}}
                    aria-label='browser script response tabs'>
                    {tabs.map((tab, index) =>  (
                        <ResponseDisplayTabsLabel
                            key={'tablabel' + task.id + index}
                            index={index}
                            label={tab.title}
                        />
                    ))}
                </Tabs>
            </div>
            {tabs.map((tab, index) => (
                <ResponseDisplayTabsPanel
                    key={'tabpanel' + task.id + index}
                    value={value}
                    index={index}>
                    <ResponseDisplayBrowserScriptComponent
                        task={task} expand={expand} displayType={displayType} output={output}
                        browserScriptData={tab.content}
                    />
                </ResponseDisplayTabsPanel>

            ))}
        </MythicStack>
    );
}
