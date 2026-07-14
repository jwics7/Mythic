import React from 'react';
import Typography from '@mui/material/Typography';
import {FileDownloadLinkWithAuth} from "../utilities/FileDownloadWithAuth";
import styles from './MythicSnackDownload.module.css';

export const MythicSnackDownload = (props) => {
    return (
        <div className={`${styles.root} mythic-min-width-0`}>
            <Typography variant="subtitle2" className="mythic-font-weight-bold">
                {props.title}
            </Typography>
                <React.Fragment>
                    <Typography gutterBottom>File ready for download</Typography>
                    <FileDownloadLinkWithAuth color="textPrimary" download={true} href={"/direct/download/" + props.file_id} target="_blank">
                        Download here
                    </FileDownloadLinkWithAuth>
                </React.Fragment>
        </div>
    );
};
