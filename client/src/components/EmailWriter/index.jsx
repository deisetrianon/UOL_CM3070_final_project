import { useState } from 'react';
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
  const [to, setTo] = useState(initialTo);
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const handleSend = async () => {
    if (!to.trim() || !subject.trim() || !body.trim()) {
      setError('Please fill in all required fields (To, Subject, Body)');
      return;
    }

    setSending(true);
    setError(null);

    try {
      await onSend({
        to: to.trim(),
        subject: subject.trim(),
        body: body.trim(),
        cc: cc.trim() || undefined,
        bcc: bcc.trim() || undefined
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to send email');
      setSending(false);
    }
  };

  return (
    <div className="email-writer-overlay" onClick={onClose}>
      <div className="email-writer" onClick={(e) => e.stopPropagation()}>
        <div className="writer-header">
          <h2>{isReply ? (replyAll ? 'Reply All' : 'Reply') : 'Write Email'}</h2>
          <button className="close-btn" onClick={onClose} title="Close">
            ✕
          </button>
        </div>
        <div className="writer-body">
          {error && (
            <div className="writer-error">
              {error}
            </div>
          )}
          <div className="writer-field">
            <label>To <span className="required">*</span></label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              required
              disabled={sending || isReply}
            />
          </div>
          <div className="writer-field">
            <label>Subject <span className="required">*</span></label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              required
              disabled={sending}
            />
          </div>
          {!showCcBcc && (
            <button
              className="show-cc-bcc-btn"
              onClick={() => setShowCcBcc(true)}
              type="button"
            >
              Cc / Bcc
            </button>
          )}
          {showCcBcc && (
            <>
              <div className="writer-field">
                <label>Cc</label>
                <input
                  type="email"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="cc@example.com"
                  disabled={sending}
                />
              </div>

              <div className="writer-field">
                <label>Bcc</label>
                <input
                  type="email"
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  placeholder="bcc@example.com"
                  disabled={sending}
                />
              </div>
            </>
          )}
          <div className="writer-field">
            <label>Body <span className="required">*</span></label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message here..."
              rows={12}
              required
              disabled={sending}
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
