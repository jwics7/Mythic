import React, {useRef, useEffect} from 'react';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import Input from '@mui/material/Input';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {MythicCluster} from "./MythicLayout";

export function MythicSelectFromListDialog(props) {
    const [options, setOptions] = React.useState([]);
    const [selected, setSelected] = React.useState('');
    const inputRef = useRef(null); 
    const handleChange = (event) => {
        setSelected(event.target.value);
      };
    const handleSubmit = () => {
        props.onSubmit(selected);
        if(props.dontCloseOnSubmit){
          return;
        }
        props.onClose();
    }
    useEffect( () => {
        //expects options to be an array of dictionaries with a "display" field for what gets presented to the user
        const opts = [...props.options];
        setOptions(opts);
        if(opts.length > 0){
            setSelected(opts[0]);
        }else{
            setSelected("");
        }
    }, [props.options]);
  return (
    <React.Fragment>
        <DialogTitle >{props.title}</DialogTitle>
        <DialogContent dividers={true}>
            <React.Fragment>
                <FormControl style={{width: "100%"}}>
                  <InputLabel ref={inputRef}>Options</InputLabel>
                  <Select
                    labelId="demo-dialog-select-label"
                    id="demo-dialog-select"
                    value={selected}
                    onChange={handleChange}
                    input={<Input style={{width: "100%"}}/>}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {options.map( (opt) => (
                        <MenuItem value={opt} key={opt[props.identifier]}>{opt?.[props.display]}</MenuItem>
                    ) )}
                  </Select>
                </FormControl>
            </React.Fragment>
        </DialogContent>
        <DialogActions>
          <Button onClick={props.onClose} variant="contained" color="primary">
            Close
          </Button>
          <Button onClick={handleSubmit} variant="contained" color="success">
            {props.action}
          </Button>
        </DialogActions>
  </React.Fragment>
  );
}

export function MythicSelectFromRawListDialog(props) {
  const [options, setOptions] = React.useState([]);
  const actionText = props.action || "Select";
  const handleSubmit = (selected) => {
      props.onSubmit(selected);
      props.onClose();
  }
  const handleKeyDown = (event, selected) => {
      if(event.key === "Enter" || event.key === " "){
          event.preventDefault();
          handleSubmit(selected);
      }
  }
  useEffect( () => {
      //expects options to be an array of dictionaries with a "display" field for what gets presented to the user
      const opts = [...props.options];
      setOptions(opts);
  }, [props.options]);
return (
  <React.Fragment>
      <DialogTitle >{props.title}</DialogTitle>
      <DialogContent dividers={true} className="mythic-raw-select-dialog-content mythic-surface">
          {options.length === 0 ? (
              <MythicCluster gap="none" align="center" justify="center" wrap={false} className="mythic-raw-select-empty mythic-text-secondary">
                  <Typography variant="body2">No options available</Typography>
              </MythicCluster>
          ) : (
              <Stack className="mythic-raw-select-list mythic-gap-sm">
                  {options.map( (choice, i) => (
                      <MythicCluster gap="md" align="center" justify="between" wrap={false}
                          key={String(choice) + i}
                          className="mythic-raw-select-row mythic-clickable mythic-border mythic-border-radius mythic-text-primary mythic-full-width"
                          role="button"
                          tabIndex={0}
                          onClick={() => handleSubmit(choice)}
                          onKeyDown={(event) => handleKeyDown(event, choice)}
                      >
                          <Typography className="mythic-raw-select-value mythic-truncate mythic-text-primary mythic-font-size-body-small" title={String(choice)}>
                              {String(choice)}
                          </Typography>
                          <Button className="mythic-dialog-button-info mythic-raw-select-action mythic-flex-fixed" variant="outlined" size="small" tabIndex={-1}>
                              {actionText}
                          </Button>
                      </MythicCluster>
                  ))}
              </Stack>
          )}
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose} variant="contained" color="primary">
          Close
        </Button>
      </DialogActions>
</React.Fragment>
);
}
