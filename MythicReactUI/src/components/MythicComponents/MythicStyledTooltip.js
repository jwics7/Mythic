import {useMythicTokens} from '../../themes/MythicThemeProvider';
import React from 'react';


export function MythicStyledTooltip({ children, title, enterDelay, tooltipStyle}){
    const theme = useMythicTokens();
    return (
        <span className="mythic-inline-flex mythic-align-center mythic-min-width-0 mythic-flex-fixed" style={tooltipStyle}
              data-tooltip-id={"my-tooltip"}
              data-tooltip-content={title}
              data-tooltip-variant={theme.palette.mode === 'dark' ? 'light' : 'dark'}
              data-tooltip-delay-show={enterDelay ? enterDelay : 750}
        >
            {children}
        </span>

)
}
