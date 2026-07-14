import {useMythicTheme} from '../../themes/MythicThemeProvider';
import DialogTitle from '@mui/material/DialogTitle';



export const MythicDraggableDialogTitle = ({children}) => {
    const theme = useMythicTheme();
    return (
        <DialogTitle id="mythic-draggable-title" style={{
            cursor: 'move',
            width: "100%",
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
        }}>
            {children}
        </DialogTitle>
    )
}
