import { useCallback, useEffect, useState } from 'react';
import { groupErrors, toFormValues, toPayload } from '../lib/form.js';

// Shared state for the edit forms: values, per-field errors, dirty flag, and submit.
export function useContentForm(resource) {
  const [values, setValues] = useState(() => toFormValues(resource));
  const [errors, setErrors] = useState({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // Replace the whole form with a document from the API
  const reset = useCallback(
    (doc) => {
      const input = doc && resource.transformIn ? resource.transformIn(doc) : doc;
      setValues(toFormValues(resource, input ?? {}));
      setErrors({});
      setDirty(false);
    },
    [resource]
  );

  const setField = useCallback((name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => (e[name] ? { ...e, [name]: undefined } : e));
    setDirty(true);
  }, []);

  // save(body) should call the API and return the saved document.
  const submit = useCallback(
    async (save) => {
      setSaving(true);
      setErrors({});
      try {
        let body = toPayload(resource, values);
        if (resource.transformOut) body = resource.transformOut(body);
        const saved = await save(body);
        setDirty(false);
        return saved;
      } catch (err) {
        if (err.details?.length) setErrors(groupErrors(err.fieldErrors));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [resource, values]
  );

  // Warn before closing the tab with unsaved changes
  useEffect(() => {
    if (!dirty) return;
    const handler = (e) => e.preventDefault();
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  return { values, errors, dirty, saving, setField, reset, submit };
}
