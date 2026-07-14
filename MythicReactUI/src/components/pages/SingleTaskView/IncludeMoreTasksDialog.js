import React, {useState, useEffect} from 'react';

import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MythicTextField from '../../MythicComponents/MythicTextField';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import {MythicStack, MythicCluster, MythicGrid} from "../../MythicComponents/MythicLayout";
import {MythicActionButton, MythicPanel, MythicText} from "../../MythicComponents/MythicContent";

export function IncludeMoreTasksDialog(props) {
    const [taskSelected, setTaskSelected] = useState(0);
    const [taskOptions, setTaskOptions] = useState([]);
    const [beforeCount, setBeforeCount] = useState(10);
    const [afterCount, setAfterCount] = useState(10);
    const [searchTerm, setSearchTerm] = useState("all");
    const [operator, setOperator] = useState("");
    const searchOptions = [
        {"type": "all", "text": "All Callbacks"},
        {"type": "callback", "text": "This Callback"},
        {"type": "operator", "text": "All callbacks but limited by operator"}
    ];
    const onRequestSubmit = () => {
        props.submitFetchTasks({
            taskSelected,
            beforeCount: parseInt(beforeCount),
            afterCount: parseInt(afterCount),
            search: searchTerm === "operator" ? operator : searchTerm
        });
        props.onClose();
    }
    const handleChange = (event) => {
        setSearchTerm(event.target.value);
      };
    const handleTaskChange = (event) => {
        setTaskSelected(event.target.value);
    };
    useEffect( () => {
        setTaskOptions(props.taskOptions);
        if(props.taskOptions.length > 0){
            setTaskSelected(props.taskOptions[0]);
        }
    }, [props.taskOptions])
  return (
    <React.Fragment>
        <DialogTitle id="form-dialog-title">Add More Tasks to View</DialogTitle>
        <MythicStack component={DialogContent} gap="md" className="mythic-dialog-body mythic-full-width" dividers={true}>
            <MythicPanel component="div" density="flush" tone="muted" overflow="visible" radius="md" className="mythic-dialog-section">
                <MythicCluster component="div" gap="md" align="start" justify="between" wrap={false} className="mythic-dialog-section-header">
                    <div>
                        <MythicText component="div" preset="section-title" className="mythic-dialog-section-title">Task window</MythicText>
                        <Typography className="mythic-dialog-section-description mythic-font-size-small mythic-line-height-normal mythic-text-secondary">Choose the anchor task and how many nearby tasks to pull into this view.</Typography>
                    </div>
                </MythicCluster>
                <FormControl className="mythic-single-task-dialog-control" fullWidth size="small">
                  <InputLabel id="single-task-around-task-label">View More Tasks Around Task</InputLabel>
                  <Select
                    label="View More Tasks Around Task"
                    labelId="single-task-around-task-label"
                    id="single-task-around-task-select"
                    value={taskSelected}
                    onChange={handleTaskChange}
                  >
                    {taskOptions.map( (opt) => (
                        <MenuItem value={opt} key={"selectiontask:" + opt}>{opt}</MenuItem>
                    ) )}
                  </Select>
                </FormControl>
                <MythicGrid component="div" gap="md" columns="custom" className="mythic-single-task-dialog-grid mythic-align-start mythic-min-width-0">
                    <MythicTextField type="number" value={beforeCount} onChange={(name, value, error)=>setBeforeCount(value)} name={"Number of tasks before"} marginBottom="0px" />
                    <MythicTextField type="number" value={afterCount} onChange={(name, value, error)=>setAfterCount(value)} name={"Number of tasks after"} marginBottom="0px" />
                </MythicGrid>
            </MythicPanel>
            <MythicPanel component="div" density="flush" tone="muted" overflow="visible" radius="md" className="mythic-dialog-section">
                <MythicCluster component="div" gap="md" align="start" justify="between" wrap={false} className="mythic-dialog-section-header">
                    <div>
                        <MythicText component="div" preset="section-title" className="mythic-dialog-section-title">Search scope</MythicText>
                        <Typography className="mythic-dialog-section-description mythic-font-size-small mythic-line-height-normal mythic-text-secondary">Limit the neighboring task search to this callback, all callbacks, or an operator.</Typography>
                    </div>
                </MythicCluster>
                <FormControl className="mythic-single-task-dialog-control" fullWidth size="small">
                  <InputLabel id="single-task-search-type-label">Search Type</InputLabel>
                  <Select
                    label="Search Type"
                    labelId="single-task-search-type-label"
                    id="single-task-search-type-select"
                    value={searchTerm}
                    onChange={handleChange}
                  >
                    {searchOptions.map( (opt) => (
                        <MenuItem value={opt.type} key={"selectiontype:" + opt.type}>{opt.text}</MenuItem>
                    ) )}
                  </Select>
                </FormControl>
                {searchTerm === 'operator' ? (
                    <MythicTextField multiline={false} onChange={(name, value, error)=>{setOperator(value)}} value={operator} name={"Operator Username"} marginBottom="0px" />
                ) : null}
            </MythicPanel>
        </MythicStack>
        <DialogActions>
          <MythicActionButton tone="neutral"  onClick={props.onClose} variant="contained">
            Close
          </MythicActionButton>
          <MythicActionButton tone="success"  disabled={taskOptions.length === 0} onClick={onRequestSubmit} variant="contained" color="success">Fetch Tasks</MythicActionButton>
        </DialogActions>
  </React.Fragment>
  );
}
