import React from "react";
import TableRow from "@mui/material/TableRow";
import styles from "./MythicDataTable.module.css";

export const MythicDataTableRow = React.forwardRef(function MythicDataTableRow(
    {state, className = "", ...props},
    ref,
) {
    return (
        <TableRow
            {...props}
            ref={ref}
            hover
            data-state={state}
            className={`${styles.row} ${className}`.trim()}
        />
    );
});
