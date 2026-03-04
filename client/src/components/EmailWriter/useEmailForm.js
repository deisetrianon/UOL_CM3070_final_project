import { useState, useCallback } from 'react';

export function useEmailForm(initialTo = '', initialSubject = '', initialBody = '') {
  const [to, setTo] = useState(initialTo);
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [error, setError] = useState(null);

  const validate = useCallback(() => {
    if (!to.trim() || !subject.trim() || !body.trim()) {
      setError('Please fill in all required fields (To, Subject, Body)');
      return false;
    }
    setError(null);
    return true;
  }, [to, subject, body]);

  const getFormData = useCallback(() => {
    return {
      to: to.trim(),
      subject: subject.trim(),
      body: body.trim(),
      cc: cc.trim() || undefined,
      bcc: bcc.trim() || undefined
    };
  }, [to, subject, body, cc, bcc]);

  const reset = useCallback(() => {
    setTo(initialTo);
    setCc('');
    setBcc('');
    setSubject(initialSubject);
    setBody(initialBody);
    setShowCcBcc(false);
    setError(null);
  }, [initialTo, initialSubject, initialBody]);

  return {
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
    reset,
  };
}
