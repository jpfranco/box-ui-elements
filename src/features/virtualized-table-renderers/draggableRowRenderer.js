// @flow
import * as React from 'react';
import classNames from 'classnames';
import { Draggable } from 'react-beautiful-dnd';
import { defaultRowRenderer } from 'react-virtualized/dist/es/Table/index';

import type { DraggableProvided, DraggableStateSnapshot } from 'react-beautiful-dnd/src';
import type { RowRendererParams } from './flowTypes';

import Portal from '../../components/portal';

const draggableRowRenderer = (params: RowRendererParams) => {
    const { index, key, rowData } = params;
    const defaultRow = defaultRowRenderer(params);
    // Keys are auto-generated by the virtualized table based on
    // the row index. We give preference to id when available since
    // the index changes (and thus also the key) when the rows are re-ordered
    const draggableId = rowData.id || key;

    return (
        <Draggable draggableId={draggableId} index={index} key={draggableId}>
            {(draggableProvided: DraggableProvided, draggableSnapshot: DraggableStateSnapshot) => {
                const { isDragging } = draggableSnapshot;
                const { draggableProps, dragHandleProps, innerRef } = draggableProvided;
                const { style: draggableStyle } = draggableProps;
                const { className: defaultRowClassName, style: defaultRowStyle } = defaultRow.props;

                const className = classNames(defaultRowClassName, {
                    'is-dragging': isDragging,
                });

                // Extend row with draggable properties
                const extendedRow = React.cloneElement(defaultRow, {
                    ...draggableProps,
                    ...dragHandleProps,
                    ref: innerRef,
                    className,
                    // Both virtualized Table and Draggable set inline styles on
                    // elements. Styles from Draggable should take precedence
                    style: {
                        ...defaultRowStyle,
                        ...draggableStyle,
                    },
                });

                // Use portal when dragging so that row is on top of other elements
                // and not hidden by default VirtualizedTable styles. Portal needs to
                // have table class names in order for scoped styles to take effect
                if (isDragging) {
                    return (
                        <Portal className="bdl-VirtualizedTable bdl-DraggableVirtualizedTable">{extendedRow}</Portal>
                    );
                }
                return extendedRow;
            }}
        </Draggable>
    );
};

export default draggableRowRenderer;
