import React from "react";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import logo from "../../../assets/mythic-red.png";
import styles from "./LoginLayout.module.css";

const joinClasses = (...values) => values.filter(Boolean).join(" ");

export const AuthFormStack = ({className, ...props}) => (
    <Stack className={joinClasses(styles.formStack, className)} {...props} />
);

export const AuthMethodNote = ({className, ...props}) => (
    <div className={joinClasses(styles.methodNote, className)} {...props} />
);

export const AuthMenuPaper = ({className, ...props}) => (
    <Paper className={joinClasses(styles.menuPaper, className)} {...props} />
);

export function LoginLayout({children, footer}) {
    return (
        <main className={`${styles.root} mythic-align-center mythic-flex mythic-min-width-0 mythic-overflow-auto mythic-full-width`}>
            <div className={`${styles.shell} mythic-min-width-0 mythic-full-width`}>
                <Paper className={`${styles.panel} mythic-stack mythic-min-height-0 mythic-overflow-hidden`} elevation={0}>
                    <div className={`${styles.logoStage} mythic-divider-bottom mythic-justify-center mythic-relative mythic-align-center mythic-flex mythic-overflow-hidden`}>
                        <img src={logo} alt="Mythic logo" />
                    </div>
                    <div className={`${styles.formBody} mythic-justify-center mythic-stack mythic-flex-fill mythic-min-height-0`}>{children}</div>
                    {footer}
                </Paper>
            </div>
        </main>
    );
}
