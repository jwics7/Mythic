import {useMythicTokens} from '../../themes/MythicThemeProvider';
import React from 'react';
import Chip from '@mui/material/Chip';


export const getTagReadableTextColor = (theme, color) => {
  if(!color){
    return theme.palette.text.primary;
  }
  try {
    return theme.palette.getContrastText(color);
  } catch (error) {
    return theme.palette.text.primary;
  }
}

export const TagTypeChip = ({tagtype, label, sx={}, ...props}) => {
  const theme = useMythicTokens();
  const color = tagtype?.color || "";
  const textColor = getTagReadableTextColor(theme, color);
  return (
    <Chip
        label={label || tagtype?.name || "Tag"}
        size="small"
        sx={{
          backgroundColor: color || "transparent",
          border: "1px solid",
          borderColor: color ? "rgba(0,0,0,0.16)" : theme.table?.borderSoft || theme.color.application.border,
          color: textColor,
          fontWeight: 800,
          maxWidth: "100%",
          "& .MuiChip-label": {
            color: "inherit",
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
          },
          ...sx,
        }}
        {...props}
    />
  );
}
