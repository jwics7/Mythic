import React from "react";
import {MythicStack} from "../../MythicComponents/MythicLayout";

// The metadata tables share one placement contract. Individual tables own only
// their column/content behavior; spacing and width remain consistent here.
export const SingleTaskMetadataSection = ({children, className, ...props}) => (
    <MythicStack
        {...props}
        className={`mythic-full-width ${className || ""}`.trim()}
        data-mythic-component="single-task-metadata-section"
        gap="sm"
    >
        {children}
    </MythicStack>
);
