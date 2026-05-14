import { motion } from 'framer-motion';

import { previewNote } from '../../../scheduleConfig.js';
import { STATUS_META } from '../constants.js';

export default function EventCard({ event, onEdit, onNoteHoverStart, onNoteHoverEnd }) {
  const statusMeta = STATUS_META[event.slotType];
  const isAllDayStatus = Boolean(statusMeta);
  const className = statusMeta?.className || 'sf-event-card--time';
  const editableProps = event.canEdit
    ? {
        role: 'button',
        tabIndex: 0,
        'aria-label': 'Edit schedule slot',
        onClick: () => onEdit(event),
        onKeyDown: (keyboardEvent) => {
          if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
            keyboardEvent.preventDefault();
            onEdit(event);
          }
        },
      }
    : {};

  return (
    <motion.article
      whileHover={{ y: -1 }}
      className={`sf-event-card ${className} ${event.canEdit ? 'sf-event-card--editable' : ''}`}
      onMouseEnter={(mouseEvent) => {
        if (event.note) {
          onNoteHoverStart(event.note, mouseEvent.currentTarget.getBoundingClientRect());
        }
      }}
      onMouseLeave={() => {
        if (event.note) {
          onNoteHoverEnd();
        }
      }}
      {...editableProps}
    >
      <span className="sf-event-main">{isAllDayStatus ? statusMeta.label : event.timeRange}</span>
      {event.note ? <span className="sf-event-note">{previewNote(event.note)}</span> : null}
    </motion.article>
  );
}
