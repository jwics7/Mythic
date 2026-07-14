import React from 'react';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import {MythicDraggablePortal, reorder} from "../../MythicComponents/MythicDraggableList";
import {
    Draggable,
    DragDropContext,
    Droppable,
} from "@hello-pangea/dnd";
import DragHandleIcon from '@mui/icons-material/DragHandle';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
    MythicDialogBody,
    MythicDialogButton,
    MythicDialogFooter,
    MythicDialogSection,
} from "../../MythicComponents/MythicDialogLayout";
import {MythicCluster, MythicStack, MythicTruncatedText} from "../../MythicComponents/MythicLayout";
import {MythicActionButton} from "../../MythicComponents/MythicContent";

export function CallbacksTableColumnsReorderDialog({initialItems, onSubmit, onClose, onReset, visible, hidden}) {
    const [items, setItems] = React.useState(initialItems);
    const onDragEnd = ({ destination, source }) => {
        // dropped outside the list
        if (!destination) return;
        const newItems = reorder(items, source.index, destination.index);
        setItems(newItems);
    };
    React.useEffect( () => {
        setItems((currentItems) => currentItems.map( c => {
            if(visible.includes(c.name)){
                return {...c, visible: true};
            }
            return {...c, visible: false};
        }));
    }, [visible, hidden]);
    const onToggleVisibility = (i) => {
        const newItems = items.map( (c, index) => {
            if(index === i){
                return {...c, visible: !c.visible};
            }
            return {...c};
        });
        setItems(newItems);
    }
    const onFinish = () => {
        onSubmit(items);
    }

  return (
    <React.Fragment>
        <DialogTitle id="form-dialog-title">Column Layout</DialogTitle>
        <DialogContent dividers={true} sx={{p: 0, overflow: "hidden"}}>
            <MythicDialogBody sx={{height: "min(70vh, 42rem)", p: 1}}>
                <MythicDialogSection
                    title="Columns"
                    sx={{display: "flex", flexDirection: "column", flex: "1 1 auto", minHeight: 0}}
                >
                    <DraggableList items={items} onToggleVisibility={onToggleVisibility} onDragEnd={onDragEnd} />
                </MythicDialogSection>
            </MythicDialogBody>
        </DialogContent>
        <MythicDialogFooter>
          <MythicDialogButton onClick={onClose}>
            Close
          </MythicDialogButton>
            <MythicDialogButton onClick={onReset} intent="warning">
                Reset
            </MythicDialogButton>
          <MythicDialogButton onClick={onFinish} intent="primary">
            Save
          </MythicDialogButton>
        </MythicDialogFooter>
  </React.Fragment>
  );
}

export const DraggableList = ({ items, onDragEnd, onToggleVisibility }) => {
    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="callback-table-column-list">
                {(provided) => (
                    <MythicStack component="div" gap="sm" scroll className="mythic-reorder-list mythic-flex-fill" ref={provided.innerRef} {...provided.droppableProps}>
                        {items.map((item, index) => (
                            <DraggableListItem onToggleVisibility={onToggleVisibility} item={item} index={index} key={item.key} />
                        ))}
                        {provided.placeholder}
                    </MythicStack>
                )}
            </Droppable>
        </DragDropContext>
    );
};
export const DraggableListItem = ({ item, index, onToggleVisibility }) => {
    return (
        <Draggable draggableId={item.key} index={index}>
            {(provided, snapshot) => {
                const row = (
                    <div
                        ref={provided.innerRef}
                        className={`mythic-reorder-row mythic-gap-sm mythic-flex mythic-min-width-0 mythic-align-center mythic-surface-raised mythic-border mythic-border-radius mythic-text-primary mythic-flex-fixed mythic-full-width${snapshot.isDragging ? " mythic-reorder-row-dragging" : ""}${item.visible ? "" : " mythic-reorder-row-disabled"}`}
                        {...provided.draggableProps}
                    >
                        <MythicCluster component="span" gap="none" justify="center" inline wrap={false} className="mythic-reorder-drag-handle mythic-border mythic-border-radius mythic-text-secondary" {...provided.dragHandleProps}>
                            <DragHandleIcon fontSize="small" />
                        </MythicCluster>
                        <MythicCluster component="div" gap="sm" align="center" wrap={false} fill className="mythic-reorder-row-main">
                            <MythicTruncatedText component="span" className="mythic-reorder-row-title mythic-font-size-small mythic-font-weight-strong mythic-line-height-snug">{item.name}</MythicTruncatedText>
                        </MythicCluster>
                        <MythicCluster component="div" gap="xs" align="center" wrap={false} className="mythic-reorder-row-actions mythic-flex-fixed">
                            <MythicActionButton iconOnly tone={item.visible ? "error" : "info"}
                                aria-label={item.visible ? `Hide ${item.name}` : `Show ${item.name}`}
                                size="small"
                                onClick={() => onToggleVisibility(index)}
                            >
                                {item.visible ? (
                                    <VisibilityIcon fontSize="small" />
                                ) : (
                                    <VisibilityOffIcon fontSize="small" />
                                )}
                            </MythicActionButton>
                        </MythicCluster>
                    </div>
                );
                return (
                    <MythicDraggablePortal isDragging={snapshot.isDragging}>
                        {row}
                    </MythicDraggablePortal>
                );
            }}
        </Draggable>
    );
};
