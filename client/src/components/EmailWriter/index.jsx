import { useState } from 'react';
import { useEmailForm } from './useEmailForm';
import './EmailWriter.css';

function EmailWriter({ 
  onClose, 
  onSend, 
  initialTo = '', 
  initialSubject = '', 
  initialBody = '',
  isReply = false,
  replyAll = false
}) {
  const [sending, setSending] = useState(false);
  const {
    to,
    cc,
    bcc,
    subject,
    body,
    showCcBcc,
    error,
    setTo,
    setCc,
    setBcc,
    setSubject,
    setBody,
    setShowCcBcc,
    setError,
    validate,
    getFormData,
  } = useEmailForm(initialTo, initialSubject, initialBody);

  const handleSend = async () => {
    if (!validate()) {
      return;
    }

    setSending(true);
    setError(null);

    try {
      await onSend(getFormData());
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to send email');
      setSending(false);
    }
  };

  return (
    <div 
      className="email-writer-overlay" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-writer-title"
    >
      <div className="email-writer" onClick={(e) => e.stopPropagation()} role="document">
        <div className="writer-header">
          <h2 id="email-writer-title">{isReply ? (replyAll ? 'Reply All' : 'Reply') : 'Write Email'}</h2>
          <button className="close-btn" onClick={onClose} title="Close" aria-label="Close email composer">
            <span aria-hidden="true">✕</span>
          </button>
        </div>
        <div className="writer-body">
          {error && (
            <div className="writer-error" role="alert" aria-live="assertive">
              {error}
            </div>
          )}
          <div className="writer-field">
            <label htmlFor="email-to">To <span className="required" aria-label="required">*</span></label>
            <input
              id="email-to"
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              required
              disabled={sending || isReply}
              aria-required="true"
              aria-invalid={error && !to.trim() ? 'true' : 'false'}
            />
          </div>
          <div className="writer-field">
            <label htmlFor="email-subject">Subject <span className="required" aria-label="required">*</span></label>
            <input
              id="email-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              required
              disabled={sending}
              aria-required="true"
              aria-invalid={error && !subject.trim() ? 'true' : 'false'}
            />
          </div>
          {!showCcBcc && (
            <button
              className="show-cc-bcc-btn"
              onClick={() => setShowCcBcc(true)}
              type="button"
              aria-label="Show Cc and Bcc fields"
            >
              Cc / Bcc
            </button>
          )}
          {showCcBcc && (
            <>
              <div className="writer-field">
                <label htmlFor="email-cc">Cc</label>
                <input
                  id="email-cc"
                  type="email"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="cc@example.com"
                  disabled={sending}
                  aria-label="Carbon copy recipients"
                />
              </div>

              <div className="writer-field">
                <label htmlFor="email-bcc">Bcc</label>
                <input
                  id="email-bcc"
                  type="email"
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  placeholder="bcc@example.com"
                  disabled={sending}
                  aria-label="Blind carbon copy recipients"
                />
              </div>
            </>
          )}
          <div className="writer-field">
            <label htmlFor="email-body">Body <span className="required" aria-label="required">*</span></label>
            <textarea
              id="email-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message here..."
              rows={12}
              required
              disabled={sending}
              aria-required="true"
              aria-invalid={error && !body.trim() ? 'true' : 'false'}
            />
          </div>
        </div>
        <div className="writer-footer">
          <button
            className="cancel-btn"
            onClick={onClose}
            disabled={sending}
          >
            Cancel
          </button>
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={sending || !to.trim() || !subject.trim() || !body.trim()}
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmailWriter;
