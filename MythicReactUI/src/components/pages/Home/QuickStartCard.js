import React from 'react';
import clsx from 'clsx';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Collapse from '@mui/material/Collapse';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Link } from '@mui/material';
import styles from './QuickStartCard.module.css';

export function QuickStartCard() {

  const [expanded, setExpanded] = React.useState(false);
  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  return (
    <Card className="mythic-full-width" elevation={5}>
      <CardHeader
        avatar={
          <Avatar className={styles.avatar}>
            
          </Avatar>
        }
        title="Mythic Quick Start Guide"
        subheader="Expand this section to learn how to: Generate a Payload, Download the Payload, Get To Callbacks"
        style={{paddingBottom: 0, marginBottom: 0}}
      />
      <CardActions styl={{padding: 0, margin: 0}}>
        <IconButton
          className={clsx(styles.expand, {
            [styles.expandOpen]: expanded,
          })}
          onClick={handleExpandClick}
          aria-expanded={expanded}
          aria-label="show more"
          size="large">
          <ExpandMoreIcon />
        </IconButton>
      </CardActions>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent style={{margin: 0, paddingTop: 0}}>
          <ol>
            <li>
              Create a payload at <Link color="textPrimary" underline="always" target="_blank" href={"/new/createpayload"}>Create -> Create Payload</Link>
              <ul>
                <li>Select Desired OS</li>
                <li>Select Payload Type and Supply Build Parameters</li>
                <li>Select Commands You Want Stamped Into The Agent</li>
                <li>Select C2 Profiles and Fill Out Parameters</li>
                <li>Name Your Payload</li>
                <li>Provide a Description</li>
                <li>Build Your Payload</li>
              </ul>
            </li>
            <li>Download Your Payload at <Link color="textPrimary" underline="always" target="_blank" href={"/new/payloads"}>Operational Data -> Payloads</Link></li>
            <li>Run Your payload
              <ul>
                <li>For More Information About Your Agent, Check Out The <Link color="textPrimary" underline="always" target="_blank" href={"/docs/agents"}>Internal Documentation</Link></li>
              </ul>
            </li>
            <li>Interact With Your Agent At <Link color="textPrimary" underline="always" target="_blank" href={"/new/callbacks"}>Active Callbacks</Link></li>
          </ol>
        </CardContent>
      </Collapse>
    </Card>
  );
}
