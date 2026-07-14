import TableCell from '@mui/material/TableCell';
import React from 'react';
import {gql, useQuery, useReactiveVar} from '@apollo/client';


import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import InfoIconOutline from '@mui/icons-material/InfoOutlined';
import {Backdrop} from '@mui/material';
import {CreatePayloadNavigationButtons} from './CreatePayloadNavigationButtons';
import {snackActions} from '../../utilities/Snackbar';
import {meState} from '../../../cache';
import {DetailedPayloadTable} from '../Payloads/DetailedPayloadTable';
import {MythicDialog} from '../../MythicComponents/MythicDialog';
import {toLocalTime} from '../../utilities/Time';
import {b64DecodeUnicode} from '../Callbacks/ResponseDisplay';
import {MythicAgentSVGIcon} from '../../MythicComponents/MythicAgentSVGIcon';
import {PayloadsTableRowBuildStatus} from '../Payloads/PayloadsTableRowBuildStatus';
import {PayloadsTableRowBuildProgress} from '../Payloads/PayloadsTableRowBuildProgress';
import {MythicLoadingState, MythicTableEmptyState} from '../../MythicComponents/MythicStateDisplay';
import {MythicTablePagination} from '../../MythicComponents/MythicTablePagination';
import {GetGroupedParameters} from '../CreatePayload/BuildParameterUtils';
import {MythicPanel, MythicActionButton, MythicMetadataItem, MythicSectionHeading, MythicSectionDescription} from '../../MythicComponents/MythicContent';
import {MythicStack, MythicCluster, MythicGrid} from "../../MythicComponents/MythicLayout";

const PAGE_SIZE = 25;
const WRAPPER_CONDITION_PARAMETER_TYPES = new Set([
    'String',
    'Boolean',
    'ChooseOne',
    'ChooseOneCustom',
    'Date',
    'Number',
]);

const GET_WRAPPABLE_PAYLOADS = gql`
query getWrappablePayloads(
  $wrapperPayloadTypeID: Int!
  $buildParameters: [WrapperBuildParameterInput!]!
  $limit: Int!
  $offset: Int!
) {
  getWrappablePayloads(
    wrapper_payload_type_id: $wrapperPayloadTypeID
    build_parameters: $buildParameters
    limit: $limit
    offset: $offset
  ) {
    status
    error
    total_count
    limit
    offset
    payloads {
      payload {
        id
        description
        uuid
        creation_time
        build_phase
        build_metadata
        os
        payloadtype {
          name
        }
        payload_build_steps(order_by: {step_number: asc}) {
          step_name
          step_number
          step_success
          step_skip
          start_time
          end_time
          step_stdout
          step_stderr
          id
        }
        filemetum {
          agent_file_id
          filename_text
          id
        }
      }
    }
  }
}
`;

export function Step3SelectPayload(props){
    const [page, setPage] = React.useState(1);
    const buildParameters = React.useMemo(() => {
        return GetGroupedParameters({
            buildParameters: props.buildOptions.parameters,
            os: props.buildOptions.os,
            c2_name: undefined,
        }).flatMap(group => group.parameters)
            .filter(parameter => WRAPPER_CONDITION_PARAMETER_TYPES.has(parameter.parameter_type))
            .map(parameter => ({name: parameter.name, value: parameter.value}));
    }, [props.buildOptions.parameters, props.buildOptions.os]);
    const requirementsKey = React.useMemo(() => JSON.stringify({
        payloadTypeID: props.buildOptions.payload_type_id,
        buildParameters,
    }), [buildParameters, props.buildOptions.payload_type_id]);

    React.useEffect(() => {
        setPage(1);
    }, [requirementsKey]);

    const {data, loading, error} = useQuery(GET_WRAPPABLE_PAYLOADS, {
        fetchPolicy: 'network-only',
        notifyOnNetworkStatusChange: true,
        variables: {
            wrapperPayloadTypeID: props.buildOptions.payload_type_id,
            buildParameters,
            limit: PAGE_SIZE,
            offset: (page - 1) * PAGE_SIZE,
        },
    });
    const result = data?.getWrappablePayloads;
    const totalCount = result?.total_count || 0;
    const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    const payloadOptions = React.useMemo(() => {
        return (result?.payloads || [])
            .map(reference => reference.payload)
            .filter(payload => payload !== null)
            .map(payload => ({...payload, name: payload.payloadtype.name}));
    }, [result?.payloads]);

    React.useEffect(() => {
        if(page > pageCount){
            setPage(pageCount);
        }
    }, [page, pageCount]);
    React.useEffect(() => {
        if(error){
            snackActions.error(error.message);
        }else if(result?.status === 'error'){
            snackActions.error(result.error || 'Failed to fetch compatible payloads');
        }
    }, [error, result?.error, result?.status]);

    const finished = (selectedPayload) => {
        if(selectedPayload.uuid === undefined){
            snackActions.error("Can't continue without selecting a payload");
            return;
        }
        props.finished(selectedPayload.uuid);
    };

    return (
        <MythicStack component="div" gap="md" className="mythic-create-flow-shell mythic-min-height-0 mythic-full-height">
            <MythicStack component="div" gap="md" className="mythic-create-flow-content mythic-flex-fill mythic-overflow-hidden mythic-min-height-0">
                <MythicGrid component="div" gap="md" columns="custom" className="mythic-create-selection-grid mythic-flex-fixed mythic-min-width-0">
                    <MythicPanel data-mythic-component="create-section" layout="stack" gap="md" tone="muted" overflow="hidden">
                        <MythicCluster component="div" gap="md" align="start" wrap={false} className="mythic-create-agent-summary">
                            <MythicCluster component="div" gap="none" align="center" justify="center" wrap={false} className="mythic-create-agent-icon mythic-border-radius mythic-border">
                                <MythicAgentSVGIcon payload_type={props.buildOptions.payload_type} style={{width: '100%', height: '100%', objectFit: 'contain'}} />
                            </MythicCluster>
                            <MythicStack component="div" gap="sm" className="mythic-create-meta-list">
                                <MythicMetadataItem label="Operating system">{props.buildOptions.os}</MythicMetadataItem>
                                <MythicMetadataItem label="Description">{props.buildOptions.description}</MythicMetadataItem>
                            </MythicStack>
                        </MythicCluster>
                    </MythicPanel>
                    <MythicPanel data-mythic-component="create-section" layout="stack" gap="md" tone="muted" overflow="hidden">
                        <MythicCluster component="div" gap="md" align="start" justify="between" wrap={false} className="mythic-create-section-header">
                            <div>
                                <MythicSectionHeading component="div" className="mythic-create-section-title">
                                    Select payload to include
                                </MythicSectionHeading>
                                <MythicSectionDescription component="div" className="mythic-create-section-description">
                                    Pick the existing payload that this wrapper should embed.
                                </MythicSectionDescription>
                            </div>
                        </MythicCluster>
                    </MythicPanel>
                </MythicGrid>

                <MythicPanel data-mythic-component="create-section" layout="stack" gap="md" tone="muted" overflow="hidden" fill>
                    <MythicCluster component="div" gap="md" align="start" justify="between" wrap={false} className="mythic-create-section-header">
                        <div>
                            <MythicSectionHeading component="div" className="mythic-create-section-title">
                                Compatible payloads
                            </MythicSectionHeading>
                            <MythicSectionDescription component="div" className="mythic-create-section-description">
                                Results match every requirement in an active wrapper rule.
                            </MythicSectionDescription>
                        </div>
                    </MythicCluster>
                    <div style={{display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0, overflow: 'hidden', position: 'relative'}}>
                        {loading &&
                            <Backdrop open style={{zIndex: 2000, position: 'absolute'}}>
                                <MythicLoadingState compact title="Loading payloads" description="Fetching compatible payloads." sx={{color: 'inherit'}} />
                            </Backdrop>
                        }
                        {!loading && result?.status === 'success' &&
                            <PayloadSelect
                                payloadOptions={payloadOptions}
                                totalCount={totalCount}
                                page={page}
                                pageCount={pageCount}
                                showMetadata
                                onChangePage={(event, nextPage) => setPage(nextPage)}
                                finished={finished}
                            />
                        }
                    </div>
                </MythicPanel>
            </MythicStack>

            <div className="mythic-create-flow-footer mythic-flex-fixed">
                <CreatePayloadNavigationButtons disableNext first={props.first} last={props.last}
                                                canceled={props.canceled} finished={finished}/>
                <br/><br/>
            </div>
        </MythicStack>
    );
}

export function PayloadSelect(props) {
    const payloadOptions = Array.isArray(props.payloadOptions) ? props.payloadOptions : [];
    const serverPaginated = props.totalCount !== undefined;
    const [localPage, setLocalPage] = React.useState(1);
    const localPageCount = Math.max(1, Math.ceil(payloadOptions.length / PAGE_SIZE));
    const visiblePayloads = serverPaginated ? payloadOptions : payloadOptions.slice((localPage - 1) * PAGE_SIZE, localPage * PAGE_SIZE);
    const page = serverPaginated ? props.page : localPage;
    const pageCount = serverPaginated ? props.pageCount : localPageCount;
    const totalCount = serverPaginated ? props.totalCount : payloadOptions.length;
    const onChangePage = serverPaginated ? props.onChangePage : (event, nextPage) => setLocalPage(nextPage);
    const columnCount = props.showMetadata ? 9 : 6;

    React.useEffect(() => {
        setLocalPage(1);
    }, [payloadOptions]);

    return (
        <div style={{display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0}}>
            <TableContainer className="mythicElement mythic-fixed-row-table-wrap" style={{flex: '1 1 auto', minHeight: 0, overflowY: 'auto'}}>
                <Table stickyHeader size="small" style={{tableLayout: 'fixed', height: 'auto', maxWidth: '100%'}}>
                    <TableHead>
                        <TableRow>
                            <TableCell style={{width: '6rem'}}>Select</TableCell>
                            <TableCell style={{width: '15rem'}}>Timestamp</TableCell>
                            <TableCell>File</TableCell>
                            {props.showMetadata && <TableCell>OS</TableCell>}
                            {props.showMetadata && <TableCell>Architecture</TableCell>}
                            {props.showMetadata && <TableCell>Format</TableCell>}
                            <TableCell>Status</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell style={{width: '5rem'}}>Details</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {payloadOptions.length === 0 ? (
                            <MythicTableEmptyState
                                colSpan={columnCount}
                                compact
                                title="No compatible payloads"
                                description="Build a payload with matching metadata or adjust the wrapper configuration."
                                minHeight={180}
                            />
                        ) : visiblePayloads.map(payload => (
                            <PayloadsTableRow onSelected={props.finished} key={`payload${payload.id}`} payload={payload} showMetadata={props.showMetadata}/>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            {pageCount > 1 &&
                <MythicTablePagination
                    count={pageCount}
                    id="create-payload-select-pagination"
                    onChange={onChangePage}
                    page={page}
                    summary={`Total Results: ${totalCount}`}
                />
            }
        </div>
    );
}

export function PayloadsTableRow(props){
    const [openDetailedView, setOpenDetailedView] = React.useState(false);
    const me = useReactiveVar(meState);
    const metadata = props.payload.build_metadata || {};
    const onSelected = () => props.onSelected(props.payload);

    return (
        <React.Fragment>
            <TableRow key={`payload${props.payload.uuid}`} hover onClick={onSelected} style={{cursor: 'pointer'}}>
                <TableCell>
                    <MythicActionButton tone="info"  size="small" onClick={(event) => {event.stopPropagation(); onSelected();}} variant="contained">Select</MythicActionButton>
                </TableCell>
                <TableCell>{toLocalTime(props.payload.creation_time, me.user.view_utc_time)}</TableCell>
                <TableCell>{b64DecodeUnicode(props.payload.filemetum.filename_text)}</TableCell>
                {props.showMetadata && <TableCell>{metadata.os || props.payload.os || '—'}</TableCell>}
                {props.showMetadata && <TableCell>{metadata.architecture || '—'}</TableCell>}
                {props.showMetadata && <TableCell>{metadata.format || '—'}</TableCell>}
                <TableCell>
                    <MythicCluster component="div" gap="xs" className="mythic-payload-progress-cell">
                        <PayloadsTableRowBuildStatus {...props.payload} />
                        <PayloadsTableRowBuildProgress {...props.payload} />
                    </MythicCluster>
                </TableCell>
                <TableCell>{props.payload.description}</TableCell>
                <TableCell>
                    <MythicActionButton iconOnly tone="info"  size="small" onClick={(event) => {event.stopPropagation(); setOpenDetailedView(true);}}>
                        <InfoIconOutline fontSize="small" />
                    </MythicActionButton>
                </TableCell>
            </TableRow>
            {openDetailedView ? (
                <TableRow style={{display: 'none'}}>
                    <TableCell colSpan={props.showMetadata ? 9 : 6}>
                        <MythicDialog fullWidth maxWidth="md" open={openDetailedView} me={me}
                                      onClose={() => setOpenDetailedView(false)}
                                      innerDialog={<DetailedPayloadTable {...props.payload} me={me} payload_id={props.payload.id} onClose={() => setOpenDetailedView(false)} />}
                        />
                    </TableCell>
                </TableRow>
            ) : null}
        </React.Fragment>
    );
}
