import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import styles from "./MythicDialogLayout.module.css";

const joinClasses = (...classes) => classes.filter(Boolean).join(" ");

export function MythicDialogBody({children, className, compact = false, ...props}) {
    return (
        <Box
            className={joinClasses(styles.body, compact && styles.bodyCompact, className)}
            {...props}
        >
            {children}
        </Box>
    );
}

export function MythicDialogSection({title, description, actions, children, className, ...props}) {
    return (
        <Box component="section" className={joinClasses(styles.section, className)} {...props}>
            {(title || description || actions) &&
                <Box className={`${styles.sectionHeader} mythic-align-start mythic-justify-between mythic-flex mythic-min-width-0`}>
                    <Box className="mythic-min-width-0">
                        {title &&
                            <Typography component="h3" className={`${styles.sectionTitle} mythic-font-size-body-small mythic-font-weight-bold mythic-line-height-snug`}>
                                {title}
                            </Typography>
                        }
                        {description &&
                            <Typography component="div" className={`${styles.sectionDescription} mythic-font-size-small mythic-line-height-normal`}>
                                {description}
                            </Typography>
                        }
                    </Box>
                    {actions &&
                        <Box className={`${styles.sectionActions} mythic-gap-sm mythic-align-center mythic-flex mythic-flex-fixed`}>
                            {actions}
                        </Box>
                    }
                </Box>
            }
            {children}
        </Box>
    );
}

export function MythicDialogGrid({children, className, minWidth = "16rem", style, ...props}) {
    return (
        <Box
            className={joinClasses(styles.grid, className)}
            style={{"--mythic-dialog-grid-min": minWidth, ...style}}
            {...props}
        >
            {children}
        </Box>
    );
}

export function MythicDialogChoiceRow({children, className, ...props}) {
    return (
        <Box className={joinClasses(styles.choiceRow, className)} {...props}>
            {children}
        </Box>
    );
}

export function MythicDialogChoiceDivider({children = "OR", className, ...props}) {
    return (
        <Box component="span" className={joinClasses(styles.choiceDivider, className)} {...props}>
            {children}
        </Box>
    );
}

export function MythicDialogFooter({children, className, ...props}) {
    return (
        <DialogActions className={joinClasses(styles.footer, className)} {...props}>
            {children}
        </DialogActions>
    );
}

export function MythicDialogButton({children, className, intent = "secondary", ...props}) {
    return (
        <Button
            className={joinClasses(styles.button, className)}
            data-intent={intent}
            size="small"
            variant="contained"
            {...props}
        >
            {children}
        </Button>
    );
}

export function MythicForm({children, className, ...props}) {
    return (
        <Box component="form" className={joinClasses(styles.form, className)} {...props}>
            {children}
        </Box>
    );
}

export function MythicFormGrid({children, className, minWidth = "16rem", style, ...props}) {
    return (
        <Box
            className={joinClasses(styles.formGrid, className)}
            style={{"--mythic-form-grid-min": minWidth, ...style}}
            {...props}
        >
            {children}
        </Box>
    );
}

export function MythicFormField({children, className, description, label, required = false, ...props}) {
    return (
        <Box className={joinClasses(styles.formField, className)} {...props}>
            {(label || description) &&
                <Box className="mythic-min-width-0">
                    {label &&
                        <Typography component="label" className={`${styles.fieldLabel} mythic-block mythic-font-size-small mythic-font-weight-strong mythic-line-height-snug`}>
                            {label}{required && <Box component="span" className="mythic-text-error"> *</Box>}
                        </Typography>
                    }
                    {description &&
                        <Typography component="div" className={`${styles.fieldDescription} mythic-font-size-caption mythic-line-height-normal`}>
                            {description}
                        </Typography>
                    }
                </Box>
            }
            <Box className={`${styles.fieldControl} mythic-min-width-0 mythic-full-width`}>
                {children}
            </Box>
        </Box>
    );
}

export function MythicFormNote({children, className, ...props}) {
    return (
        <Box className={joinClasses(styles.formNote, className)} {...props}>
            {children}
        </Box>
    );
}

export function MythicFormSwitchRow({control, label, description, className, ...props}) {
    return (
        <Box className={joinClasses(styles.switchRow, className)} {...props}>
            <Box className="mythic-min-width-0">
                <Typography component="div" className={`${styles.fieldLabel} mythic-block mythic-font-size-small mythic-font-weight-strong mythic-line-height-snug`}>
                    {label}
                </Typography>
                {description &&
                    <Typography component="div" className={`${styles.fieldDescription} mythic-font-size-caption mythic-line-height-normal`}>
                        {description}
                    </Typography>
                }
            </Box>
            <Box className="mythic-flex-fixed">
                {control}
            </Box>
        </Box>
    );
}
