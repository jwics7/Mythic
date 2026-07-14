import React from 'react';
import {Chip, Link, Typography} from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { MythicDialog } from '../../MythicComponents/MythicDialog';
import {MythicConfirmDialog} from '../../MythicComponents/MythicConfirmDialog';
import { gql, useMutation } from '@apollo/client';
import {snackActions} from '../../utilities/Snackbar';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import { MythicStyledTooltip } from '../../MythicComponents/MythicStyledTooltip';
import { copyStringToClipboard } from '../../utilities/Clipboard';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faCopy} from '@fortawesome/free-solid-svg-icons';
import {TagsDisplay, ViewEditTags} from '../../MythicComponents/MythicTag';
import Split from 'react-split';
import {CredentialTableNewCredentialDialog} from './CredentialTableNewCredentialDialog';
import {
    compactMetadataValue,
    CredentialDetail,
    CredentialInspectorSection,
    CredentialMetadataPair,
    getCredentialValidityChips,
    parseCredentialMetadata,
} from './CredentialDisplayComponents';
import {
    CredentialKerberosDisplay,
    credentialKerberosIdentityKeys,
    credentialKerberosMetadataKeys,
} from './CredentialKerberosDisplay';
import {
    CredentialJWTDisplay,
    credentialJWTIdentityKeys,
    credentialJWTMetadataKeys,
} from './CredentialJWTDisplay';
import {MythicCluster, MythicStack, MythicGrid, MythicTruncatedText} from "../../MythicComponents/MythicLayout";
import {MythicActionButton, MythicPanel} from "../../MythicComponents/MythicContent";

export {compactMetadataValue, getCredentialValidityChips, parseCredentialMetadata} from './CredentialDisplayComponents';

export const credentialSearchDataFragment = gql`
fragment credentialSearchData on credential{
    account
    comment
    credential_text
    id
    realm
    type
    subtype
    metadata
    credential_identity
    custom_display
    task {
        display_id
        id
        callback {
            id
            host
            display_id
            mythictree_groups
        }
    }
    timestamp
    deleted
    operator {
        username
    }
    tags {
        tagtype {
            name
            color
            id
        }
        id
    }
}
`;

export const getCredentialSourceLabel = (credential) => {
    if(credential?.task){
        return `C-${credential.task.callback?.display_id || "?"} / T-${credential.task.display_id || "?"}`;
    }
    return credential?.operator?.username || "manual";
}

const credentialSearchSplitStorageKey = "credentialSearchSplitSizes";
const defaultCredentialSearchSplitSizes = [60, 40];

const getStoredCredentialSearchSplitSizes = () => {
    try {
        const storedValue = localStorage.getItem(credentialSearchSplitStorageKey);
        const parsedValue = JSON.parse(storedValue);
        if(Array.isArray(parsedValue) &&
            parsedValue.length === 2 &&
            parsedValue.every((value) => Number.isFinite(value) && value > 10 && value < 90)){
            return parsedValue;
        }
    } catch(error) {
        console.log("failed to parse credential search split sizes");
    }
    return defaultCredentialSearchSplitSizes;
}

const metadataSystemKeys = new Set([
    "not_before", "expires_at", "renew_until", "parsed_at", "parser",
    "parser_warnings", "validity"
]);

const credentialParserDisplays = {
    kerberos: {
        Display: CredentialKerberosDisplay,
        metadataKeys: credentialKerberosMetadataKeys,
        identityKeys: credentialKerberosIdentityKeys,
    },
    jwt: {
        Display: CredentialJWTDisplay,
        metadataKeys: credentialJWTMetadataKeys,
        identityKeys: credentialJWTIdentityKeys,
    },
};

const getCredentialParserDisplay = (parserName) => {
    return credentialParserDisplays[String(parserName || "").toLowerCase().trim()];
}

export const updateCredentialDeleted = gql`
mutation updateCredentialDeletedMutation($credential_id: Int!, $deleted: Boolean!){
    updateCredential(input: {credential_id: $credential_id, deleted: $deleted}) {
        status
        error
        id
        account
        realm
        credential_text
        comment
        credential_type
        credential_subtype
        metadata
        credential_identity
        custom_display
        deleted
        operator_username
    }
}
`;

export const updateCredentialMutation = gql`
mutation updateCredentialMutation($input: updateCredentialInput!){
    updateCredential(input: $input) {
        status
        error
        id
        account
        realm
        credential_text
        comment
        credential_type
        credential_subtype
        metadata
        credential_identity
        custom_display
        deleted
        operator_username
    }
}
`;

export const normalizeCredentialUpdateOutput = (updatedCredential) => ({
    id: updatedCredential.id,
    account: updatedCredential.account,
    realm: updatedCredential.realm,
    credential_text: updatedCredential.credential_text,
    comment: updatedCredential.comment,
    type: updatedCredential.credential_type,
    subtype: updatedCredential.credential_subtype,
    metadata: updatedCredential.metadata,
    credential_identity: updatedCredential.credential_identity,
    custom_display: updatedCredential.custom_display,
    deleted: updatedCredential.deleted,
    operator: {username: updatedCredential.operator_username},
});

export function CredentialTable(props){
    const [credentials, setCredentials] = React.useState([]);
    const [selectedCredentialID, setSelectedCredentialID] = React.useState(null);
    const [credentialSearchSplitSizes, setCredentialSearchSplitSizes] = React.useState(getStoredCredentialSearchSplitSizes);

    React.useEffect( () => {
        const nextCredentials = [...props.credentials];
        setCredentials(nextCredentials);
        setSelectedCredentialID((currentSelectedID) => {
            if(nextCredentials.length === 0){
                return null;
            }
            if(currentSelectedID !== null && nextCredentials.some((credential) => credential.id === currentSelectedID)){
                return currentSelectedID;
            }
            return nextCredentials[0].id;
        });
    }, [props.credentials]);

    const updateCredentialInState = (id, updates) => {
        setCredentials((currentCredentials) => currentCredentials.map((cred) => {
            if(cred.id === id){
                return {...cred, ...updates};
            }
            return {...cred};
        }));
    }
    const onEditCredential = (updatedCredential) => {
        updateCredentialInState(updatedCredential.id, updatedCredential);
    }
    const onCredentialSearchSplitDragEnd = React.useCallback((sizes) => {
        setCredentialSearchSplitSizes(sizes);
        localStorage.setItem(credentialSearchSplitStorageKey, JSON.stringify(sizes));
    }, []);
    const selectedCredential = credentials.find((credential) => credential.id === selectedCredentialID) || null;

    return (
        <MythicCluster component={Split} gap="none" wrap={false} align="stretch"
            direction="horizontal"
            className="mythic-credential-search mythic-fill mythic-overflow-hidden mythic-full-height"
            sizes={credentialSearchSplitSizes}
            minSize={[420, 360]}
            gutterSize={8}
            snapOffset={0}
            onDragEnd={onCredentialSearchSplitDragEnd}>
            <MythicPanel component="div" density="flush" tone="muted" overflow="hidden" radius="md" className="mythic-credential-search-results mythic-min-height-0 mythic-full-height">
                <TableContainer className="mythic-credential-search-table-wrap mythic-full-height mythic-overflow-auto">
                    <Table stickyHeader size="small" className="mythic-credential-search-table mythic-full-width">
                        <TableHead>
                            <TableRow>
                                <TableCell style={{width: "5rem"}}>ID</TableCell>
                                <TableCell>Account / Realm</TableCell>
                                <TableCell style={{maxWidth: "7rem"}}>Type</TableCell>
                                <TableCell style={{maxWidth: "10rem"}}>Validity</TableCell>
                                <TableCell style={{maxWidth: "9rem"}}>Source</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {credentials.map((credential) => (
                                <CredentialSearchRow
                                    key={"cred" + credential.id}
                                    credential={credential}
                                    selected={selectedCredentialID === credential.id}
                                    onSelect={() => {
                                        setSelectedCredentialID(credential.id);
                                        if(props.onSelectCredential){
                                            props.onSelectCredential(credential);
                                        }
                                    }}
                                />
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </MythicPanel>
            <CredentialInspector
                credential={selectedCredential}
                me={props.me}
                onEditCredential={onEditCredential}
                readOnly={props.readOnly}
            />
        </MythicCluster>
    )
}

export function CredentialSearchRow({credential, selected, onSelect}){
    const parsedMetadata = parseCredentialMetadata(credential.metadata);
    const parsedIdentity = parseCredentialMetadata(credential.credential_identity);
    const validityChips = getCredentialValidityChips(credential.metadata);
    const sourceLabel = getCredentialSourceLabel(credential);
    const hasComment = (credential.comment || "").trim().length > 0;
    const hasMetadata = Object.keys(parsedMetadata).length > 0;
    const hasIdentity = Object.keys(parsedIdentity).length > 0;
    const accountRealm = `${credential.account || "-"}${credential.realm ? `@${credential.realm}` : ""}`;
    const primaryLabel = credential.custom_display || credential.account || "-";
    const secondaryLabel = credential.custom_display ? accountRealm : (credential.realm || "-");

    return (
        <TableRow
            hover
            selected={selected}
            className={`mythic-credential-search-row mythic-clickable ${selected ? "mythic-credential-search-row-selected" : ""}`}
            onClick={onSelect}>
            <TableCell className="mythic-overflow-hidden">
                <MythicCluster component="div" gap="xs" className="mythic-credential-search-id-cell">
                    <span className="mythic-credential-search-id mythic-font-size-small mythic-monospace mythic-font-weight-heavy mythic-text-primary">#{credential.id}</span>
                    {credential.deleted &&
                        <Chip size="small" color="warning" variant="outlined" label="deleted" className="mythic-credential-search-mini-chip mythic-max-width-full" />
                    }
                </MythicCluster>
            </TableCell>
            <TableCell className="mythic-overflow-hidden">
                <MythicGrid component="div" gap="none" columns="custom" className="mythic-credential-search-primary-cell mythic-min-width-0">
                    <MythicTruncatedText component="span" className="mythic-text-primary mythic-font-weight-extra-bold" title={primaryLabel}>{primaryLabel}</MythicTruncatedText>
                    <MythicTruncatedText component="span" className="mythic-text-secondary" title={secondaryLabel}>{secondaryLabel}</MythicTruncatedText>
                    <MythicCluster component="span" gap="xs" align="center" className="mythic-credential-search-row-flags">
                        {hasComment && <Chip size="small" variant="outlined" label="comment" className="mythic-credential-search-mini-chip mythic-max-width-full" />}
                        {hasMetadata && <Chip size="small" variant="outlined" label="metadata" className="mythic-credential-search-mini-chip mythic-max-width-full mythic-credential-search-metadata-chip" />}
                        {hasIdentity && <Chip size="small" variant="outlined" label="identity" className="mythic-credential-search-mini-chip mythic-max-width-full mythic-credential-search-identity-chip" />}
                    </MythicCluster>
                </MythicGrid>
            </TableCell>
            <TableCell className="mythic-overflow-hidden">
                <Chip size="small" variant="outlined" label={credential.type || "unknown"} className="mythic-credential-search-type-chip mythic-max-width-full" />
                {credential.subtype !== "" &&
                    <Chip size="small" variant="outlined" label={credential.subtype} className="mythic-credential-search-type-chip mythic-max-width-full" />
                }
            </TableCell>
            <TableCell className="mythic-overflow-hidden">
                <MythicCluster component="div" gap="xs" className="mythic-credential-search-chip-list">
                    {validityChips.length > 0 ? (
                        validityChips.slice(0, 2).map((chip) => (
                            <Chip key={chip.label} size="small" color={chip.color} variant="outlined" label={chip.label} className="mythic-credential-search-mini-chip mythic-max-width-full" />
                        ))
                    ) : (
                        <span className="mythic-credential-search-muted mythic-font-size-caption mythic-text-secondary">-</span>
                    )}
                </MythicCluster>
            </TableCell>
            <TableCell className="mythic-overflow-hidden">
                <MythicTruncatedText component="span" className="mythic-credential-search-source mythic-font-size-caption mythic-block mythic-text-secondary" title={sourceLabel}>{sourceLabel}</MythicTruncatedText>
            </TableCell>
        </TableRow>
    )
}

export function CredentialInspector(props){
    const credential = props.credential;
    const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);
    const [editCredentialDialogOpen, setEditCredentialDialogOpen] = React.useState(false);

    const [updateCredential] = useMutation(updateCredentialMutation, {
        onCompleted: (data) => {
            if(data.updateCredential.status === "success"){
                snackActions.success("updated credential");
                if(props.onEditCredential){ props.onEditCredential(normalizeCredentialUpdateOutput(data.updateCredential)); }
            }else{
                snackActions.error(data.updateCredential.error);
            }
        },
        onError: () => {
            snackActions.error("failed to update credential");
        }
    });
    const [updateDeleted] = useMutation(updateCredentialDeleted, {
        onCompleted: (data) => {
            if(data.updateCredential.status === "success"){
                snackActions.success("updated deleted status");
                if(props.onEditCredential){ props.onEditCredential(normalizeCredentialUpdateOutput(data.updateCredential)); }
            }else{
                snackActions.error(data.updateCredential.error);
            }
        },
        onError: () => {
            snackActions.error("failed to update credential");
        }
    });

    React.useEffect(() => {
        setOpenDeleteDialog(false);
        setEditCredentialDialogOpen(false);
    }, [credential?.id]);

    if(credential === null){
        return (
            <MythicStack component="aside" gap="sm" align="center" className="mythic-credential-search-inspector mythic-credential-search-inspector-empty mythic-justify-center mythic-border mythic-overflow-hidden mythic-min-height-0 mythic-full-height mythic-border-radius mythic-surface-muted mythic-text-secondary">
                <VpnKeyIcon fontSize="small" />
                <Typography variant="body2">No credential selected</Typography>
            </MythicStack>
        )
    }

    const parsedMetadata = parseCredentialMetadata(credential.metadata);
    const validity = parsedMetadata.validity || {};
    const validityChips = getCredentialValidityChips(credential.metadata);
    const parsedIdentity = parseCredentialMetadata(credential.credential_identity);
    const parserDisplayConfig = getCredentialParserDisplay(parsedMetadata.parser);
    const ParserDisplay = parserDisplayConfig?.Display;
    const parserMetadataKeys = parserDisplayConfig?.metadataKeys || new Set();
    const parserIdentityKeys = parserDisplayConfig?.identityKeys || new Set();
    const warningValues = Array.isArray(parsedMetadata.parser_warnings) ? parsedMetadata.parser_warnings : [];
    const parserMetadataEntries = [];
    if(parsedMetadata.parser){
        parserMetadataEntries.push(["parser", parsedMetadata.parser]);
    }
    const showParserMetadataSection = !ParserDisplay && (parserMetadataEntries.length > 0 || validityChips.length > 0 || warningValues.length > 0);
    const pureMetadataEntries = Object.entries(parsedMetadata)
        .filter(([key, value]) => !metadataSystemKeys.has(key) && !parserMetadataKeys.has(key) && value !== undefined && value !== null);
    const pureMetadata = Object.fromEntries(pureMetadataEntries);
    const pureIdentityEntries = Object.entries(parsedIdentity)
        .filter(([key, value]) => !parserIdentityKeys.has(key) && value !== undefined && value !== null);
    const pureIdentity = Object.fromEntries(pureIdentityEntries);

    const onCopyToClipboard = (data) => {
        let result = copyStringToClipboard(data);
        if(result){
            snackActions.success("Copied text!");
        }else{
            snackActions.error("Failed to copy text");
        }
    }
    const onSubmitUpdatedCredential = ({type, subtype, account, realm, comment, credential: credentialValue, metadata, custom_display}) => {
        updateCredential({variables: {
            input: {
                credential_id: credential.id,
                credential_type: type,
                credential_subtype: subtype,
                account,
                realm,
                comment,
                credential: credentialValue,
                metadata,
                custom_display,
            }
        }})
    }
    const onAcceptDelete = () => {
        updateDeleted({variables: {credential_id: credential.id, deleted: !credential.deleted}})
    }

    return (
        <MythicStack component="aside" gap="none" className="mythic-credential-search-inspector mythic-border mythic-overflow-hidden mythic-min-height-0 mythic-full-height mythic-border-radius mythic-surface-muted">
            {openDeleteDialog &&
                <MythicConfirmDialog onClose={() => {setOpenDeleteDialog(false);}} onSubmit={onAcceptDelete} open={openDeleteDialog} acceptText={credential.deleted ? "Restore" : "Remove" }/>
            }
            {editCredentialDialogOpen &&
                <MythicDialog fullWidth={true} maxWidth="md" open={editCredentialDialogOpen}
                    onClose={()=>{setEditCredentialDialogOpen(false);}}
                    innerDialog={<CredentialTableNewCredentialDialog title="Edit Credential" submitText="Update" initialValues={credential} onSubmit={onSubmitUpdatedCredential} onClose={()=>{setEditCredentialDialogOpen(false);}} />}
                />
            }
            <MythicCluster component="div" gap="md" align="start" justify="between" wrap={false} className="mythic-credential-search-inspector-header mythic-divider-bottom">
                <MythicCluster component="div" gap="xs" fill className="mythic-credential-search-inspector-title mythic-font-weight-heavy mythic-font-size-body mythic-text-primary">
                    <VpnKeyIcon fontSize="small" />
                    <MythicTruncatedText component="span"  title={`Credential ${credential.id}`}>Credential {credential.id}</MythicTruncatedText>
                    <Chip size="small" variant="outlined" label={"type: " + credential.type} className="mythic-credential-search-mini-chip mythic-max-width-full" />
                    {credential.subtype !== "" &&
                        <Chip size="small" variant="outlined" label={"subtype: " + credential.subtype} className="mythic-credential-search-mini-chip mythic-max-width-full" />
                    }
                    {credential.deleted &&
                        <Chip size="small" color="warning" variant="outlined" label="deleted" className="mythic-credential-search-mini-chip mythic-max-width-full" />
                    }
                </MythicCluster>
                {!props.readOnly &&
                <MythicCluster component="div" gap="xs" align="center" justify="end" className="mythic-credential-search-inspector-actions mythic-flex-fixed">
                    <MythicActionButton tone="neutral"  size="small" variant="outlined"
                        startIcon={<EditIcon fontSize="small" />}
                        onClick={() => setEditCredentialDialogOpen(true)} >Edit</MythicActionButton>
                    {credential.deleted ? (
                        <MythicStyledTooltip title="Restore Credential for use in Tasking">
                            <MythicActionButton iconOnly tone="success" emphasis="always"  size="small" onClick={()=>{setOpenDeleteDialog(true);}}><RestoreFromTrashIcon fontSize="small" /></MythicActionButton>
                        </MythicStyledTooltip>
                    ) : (
                        <MythicStyledTooltip title="Delete Credential so it can't be used in Tasking">
                            <MythicActionButton iconOnly tone="error"  size="small" onClick={()=>{setOpenDeleteDialog(true);}}><DeleteIcon fontSize="small" /></MythicActionButton>
                        </MythicStyledTooltip>
                    )}
                </MythicCluster>
                }
            </MythicCluster>
            <MythicStack component="div" gap="sm" scroll className="mythic-credential-search-inspector-body mythic-flex-fill">
                <CredentialInspectorSection title="Credential Fields">
                    <CredentialDetail label="Account" value={credential.account} emphasis />
                    <CredentialDetail
                        label="Tasking ID"
                        value={credential.id}
                        code
                        action={
                            <MythicStyledTooltip title={"Copy credential ID for tasking"}>
                                <MythicActionButton iconOnly tone="info" emphasis="always" className="mythic-credential-search-field-action mythic-flex-fixed" onClick={() => onCopyToClipboard(String(credential.id))} size="small">
                                    <FontAwesomeIcon icon={faCopy}/>
                                </MythicActionButton>
                            </MythicStyledTooltip>
                        }
                    />
                    <CredentialDetail label="Realm" value={credential.realm} emphasis />
                    <CredentialDetail label="Custom Display" value={credential.custom_display} wide />
                </CredentialInspectorSection>
                {ParserDisplay &&
                    <ParserDisplay
                        credential={credential}
                        metadata={parsedMetadata}
                        identity={parsedIdentity}
                        validity={validity}
                        validityChips={validityChips}
                    />
                }
                {showParserMetadataSection &&
                    <CredentialInspectorSection title="Parser Metadata" >
                        {parserMetadataEntries.map(([key, value]) => (
                            <Chip key={key} size="small" variant="outlined" label={`${key}: ${value}`} />
                        ))}
                        {validityChips.map((chip) => (
                            <Chip key={chip.label} size="small" color={chip.color} variant="outlined" label={chip.label} />
                        ))}
                        {warningValues.length > 0 &&
                            <MythicCluster component="div" gap="xs" align="stretch" className="mythic-credential-search-warning-list mythic-grid-span-full">
                                {warningValues.map((warning, index) => (
                                    <Chip key={`warning-${index}`} size="small" color="warning" variant="outlined" label={compactMetadataValue(warning)} className="mythic-credential-search-warning-chip mythic-max-width-full" />
                                ))}
                            </MythicCluster>
                        }
                    </CredentialInspectorSection>
                }
                {pureMetadataEntries.length > 0 &&
                    <CredentialInspectorSection
                        title="Metadata"
                        tone="metadata"
                        actions={
                            <MythicStyledTooltip title={"Copy metadata JSON"}>
                                <MythicActionButton iconOnly tone="info" emphasis="always"  onClick={() => onCopyToClipboard(JSON.stringify(pureMetadata, null, 2))} size="small">
                                    <FontAwesomeIcon icon={faCopy}/>
                                </MythicActionButton>
                            </MythicStyledTooltip>
                        }>
                        <MythicGrid component="div" gap="xs" columns="custom" className="mythic-credential-search-metadata-grid mythic-grid-span-full mythic-credential-search-metadata-grid-metadata mythic-min-width-0">
                            {pureMetadataEntries.map(([key, value]) => (
                                <CredentialMetadataPair key={key} name={key} value={value}  />
                            ))}
                        </MythicGrid>
                    </CredentialInspectorSection>
                }
                {pureIdentityEntries.length > 0 &&
                    <CredentialInspectorSection
                        title="Parsed Identity"
                        tone="identity"
                        actions={
                            <MythicStyledTooltip title={"Copy identity JSON"}>
                                <MythicActionButton iconOnly tone="info" emphasis="always"  onClick={() => onCopyToClipboard(JSON.stringify(pureIdentity, null, 2))} size="small">
                                    <FontAwesomeIcon icon={faCopy}/>
                                </MythicActionButton>
                            </MythicStyledTooltip>
                        }>
                        <MythicGrid component="div" gap="xs" columns="custom" className="mythic-credential-search-metadata-grid mythic-grid-span-full mythic-credential-search-metadata-grid-identity mythic-min-width-0">
                            {pureIdentityEntries.map(([key, value]) => (
                                <CredentialMetadataPair key={key} name={key} value={value} tone="identity" />
                            ))}
                        </MythicGrid>
                    </CredentialInspectorSection>
                }

                <CredentialInspectorSection title="Source">
                    {credential.task ? (
                        <>
                            <CredentialDetail
                                label="Task"
                                wide
                                value={
                                    <span>
                                        <Link color="textPrimary" underline="always" target="_blank" href={"/new/callbacks/" + credential.task.callback?.display_id}>C-{credential.task.callback?.display_id || "?"}</Link>
                                        {" / "}
                                        <Link color="textPrimary" underline="always" target="_blank" href={"/new/task/" + credential.task.display_id}>T-{credential.task.display_id || "?"}</Link>
                                    </span>
                                }
                            />
                            <CredentialDetail label="Host" value={credential.task.callback?.host} />
                            <CredentialDetail label="Groups" value={(credential.task.callback?.mythictree_groups || []).join(", ")} wide />
                        </>
                    ) : (
                        <CredentialDetail label="Operator" value={credential.operator?.username} />
                    )}
                </CredentialInspectorSection>
                <CredentialInspectorSection title="Credential">
                    <MythicGrid component="div" gap="xs" columns="custom" className="mythic-credential-search-secret-row mythic-align-start mythic-grid-span-full mythic-min-width-0">
                        <MythicPanel component="div" density="flush" tone="surface" overflow="auto" radius="md" className="mythic-credential-search-secret mythic-monospace mythic-font-size-caption mythic-line-height-normal mythic-pre-wrap mythic-credential-search-secret-emphasis mythic-font-size-body-small mythic-font-weight-strong mythic-text-primary" title={credential.credential_text || ""}>
                            {credential.credential_text || "-"}
                        </MythicPanel>
                        <MythicStyledTooltip title={"Copy credential value"}>
                            <MythicActionButton iconOnly tone="info" emphasis="always" className="mythic-credential-search-secret-copy mythic-flex-fixed" onClick={() => onCopyToClipboard(credential.credential_text || "")} size="small">
                                <FontAwesomeIcon icon={faCopy}/>
                            </MythicActionButton>
                        </MythicStyledTooltip>
                    </MythicGrid>
                </CredentialInspectorSection>
                <CredentialInspectorSection title="Comment">
                    <MythicPanel component="div" density="flush" tone="surface" overflow="auto" radius="md" className="mythic-credential-search-comment mythic-text-secondary mythic-grid-span-full mythic-font-size-caption mythic-line-height-normal mythic-pre-wrap mythic-text-primary">
                        {(credential.comment || "").trim().length > 0 ? credential.comment : "No comment."}
                    </MythicPanel>
                </CredentialInspectorSection>
                <CredentialInspectorSection title="Tags">
                    <MythicCluster component="div" gap="xs" align="center" wrap={false} className="mythic-credential-search-tags mythic-grid-span-full mythic-border mythic-surface mythic-overflow-hidden mythic-border-radius">
                        <ViewEditTags
                            target_object={"credential_id"}
                            target_object_id={credential?.id || 0}
                            me={props.me}/>
                        <TagsDisplay tags={credential.tags || []}/>
                    </MythicCluster>
                </CredentialInspectorSection>
            </MythicStack>
        </MythicStack>
    )
}
