
import styles from "./MythicPageBody.module.css";
import {MythicStack} from "./MythicLayout";

export const MythicPageBody = ({children, className = "", ...props}) => {
    return (
        <MythicStack {...props} className={`${styles.root}${className ? ` ${className}` : ""}`} fill gap="sm">
            {children}
        </MythicStack>
    )
}
