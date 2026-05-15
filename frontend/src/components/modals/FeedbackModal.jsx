import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bug, CircleHelp, Lightbulb, MessageSquareText, Send } from 'lucide-react';

import { submitFeedback } from '../../api.js';

const MESSAGE_LIMIT = 2000;

const FEEDBACK_TYPES = [
  {
    value: 'bug',
    title: 'BUG',
    description: 'Something is broken',
    icon: Bug,
  },
  {
    value: 'feature',
    title: 'FEATURE',
    description: 'Request an improvement',
    icon: Lightbulb,
  },
  {
    value: 'feedback',
    title: 'FEEDBACK',
    description: 'Share general feedback',
    icon: MessageSquareText,
  },
  {
    value: 'other',
    title: 'OTHER',
    description: 'Anything else',
    icon: CircleHelp,
  },
];

export default function FeedbackModal({ onClose }) {
  const [feedbackType, setFeedbackType] = useState('bug');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSent, setIsSent] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSent) {
      onClose();
      return;
    }

    setIsSaving(true);
    setErrors({});
    try {
      await submitFeedback({
        type: feedbackType,
        message,
        pageUrl: window.location.href,
      });
      setIsSent(true);
      setMessage('');
    } catch (error) {
      setErrors(error.payload?.errors || { __all__: [error.message] });
    } finally {
      setIsSaving(false);
    }
  }

  const messageLength = Array.from(message).length;

  return (
    <motion.div
      className="feedback-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <motion.form
        className="feedback-modal"
        initial={{ opacity: 0, y: 24, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.94 }}
        transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
        onSubmit={handleSubmit}
      >
        <div className="feedback-modal-glow" aria-hidden="true" />

        <header className="feedback-header">
          <p>TEAM EXPERIENCE</p>
          <h2>FEEDBACK</h2>
          <span>Report a bug, request a feature, or share what should be improved.</span>
        </header>

        {errors.__all__ ? <div className="feedback-error">{errors.__all__.join(', ')}</div> : null}

        {isSent ? (
          <section className="feedback-success" aria-live="polite">
            <MessageSquareText size={46} strokeWidth={1.8} />
            <h3>Feedback sent</h3>
            <p>Thanks. Your message is saved and will be reviewed in the admin panel.</p>
          </section>
        ) : (
          <>
            <div className="feedback-types" role="radiogroup" aria-label="Feedback type">
              {FEEDBACK_TYPES.map((type) => {
                const Icon = type.icon;
                const isActive = feedbackType === type.value;
                return (
                  <button
                    className={`feedback-type ${isActive ? 'feedback-type--active' : ''}`}
                    key={type.value}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    onClick={() => setFeedbackType(type.value)}
                  >
                    <Icon size={32} strokeWidth={1.8} />
                    <strong>{type.title}</strong>
                    <span>{type.description}</span>
                  </button>
                );
              })}
            </div>
            {errors.type ? <div className="feedback-field-error">{errors.type.join(', ')}</div> : null}

            <label className="feedback-message">
              <span>Describe your feedback</span>
              <strong>{messageLength}/{MESSAGE_LIMIT}</strong>
              <textarea
                maxLength={MESSAGE_LIMIT}
                placeholder="What happened? What would you like to change?"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
            </label>
            {errors.message ? <div className="feedback-field-error">{errors.message.join(', ')}</div> : null}
            {errors.pageUrl ? <div className="feedback-field-error">{errors.pageUrl.join(', ')}</div> : null}
          </>
        )}

        <footer className="feedback-actions">
          <button className="feedback-cancel" type="button" disabled={isSaving} onClick={onClose}>
            {isSent ? 'Close' : 'Cancel'}
          </button>
          <button className="feedback-send" type="submit" disabled={isSaving}>
            {isSent ? (
              'Done'
            ) : (
              <>
                <Send size={18} />
                {isSaving ? 'Sending...' : 'Send'}
              </>
            )}
          </button>
        </footer>
      </motion.form>
    </motion.div>
  );
}
