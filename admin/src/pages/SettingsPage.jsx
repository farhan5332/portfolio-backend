import { useState } from 'react';
import { request } from '../lib/api.js';
import { formatDate } from '../lib/form.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Button, Field, PageHeader } from '../components/ui.jsx';

export default function SettingsPage() {
  const { user, updateSession } = useAuth();
  const toast = useToast();
  const [values, setValues] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (name) => (e) => setValues((v) => ({ ...v, [name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (values.newPassword !== values.confirm) {
      setErrors({ confirm: 'Passwords do not match' });
      return;
    }
    setSaving(true);
    setErrors({});
    try {
      const res = await request('/auth/change-password', {
        method: 'PUT',
        body: { currentPassword: values.currentPassword, newPassword: values.newPassword },
      });
      updateSession(res.data);
      setValues({ currentPassword: '', newPassword: '', confirm: '' });
      toast.success('Password changed. Other devices have been signed out.');
    } catch (err) {
      setErrors(err.fieldErrors ?? {});
      if (!err.details?.length) toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Settings" description="Your account." />

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card p-6">
          <h2 className="mb-4 font-semibold text-slate-900">Account</h2>
          <dl className="space-y-3 text-sm">
            {[
              ['Name', user?.name],
              ['Email', user?.email],
              ['Role', user?.role],
              ['Last login', formatDate(user?.lastLoginAt, { dateStyle: 'medium', timeStyle: 'short' })],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-slate-500">{label}</dt>
                <dd className="font-medium break-all text-slate-800">{value || '—'}</dd>
              </div>
            ))}
          </dl>
        </section>

        <form onSubmit={handleSubmit} className="card space-y-5 p-6 lg:col-span-2" noValidate>
          <h2 className="font-semibold text-slate-900">Change password</h2>
          <Field label="Current password" htmlFor="currentPassword" error={errors.currentPassword}>
            <input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              className={`input ${errors.currentPassword ? 'input-error' : ''}`}
              value={values.currentPassword}
              onChange={set('currentPassword')}
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="New password"
              htmlFor="newPassword"
              error={errors.newPassword}
              hint="At least 8 characters, with a letter and a number."
            >
              <input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                className={`input ${errors.newPassword ? 'input-error' : ''}`}
                value={values.newPassword}
                onChange={set('newPassword')}
              />
            </Field>
            <Field label="Confirm new password" htmlFor="confirm" error={errors.confirm}>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                className={`input ${errors.confirm ? 'input-error' : ''}`}
                value={values.confirm}
                onChange={set('confirm')}
              />
            </Field>
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              loading={saving}
              disabled={!values.currentPassword || !values.newPassword || !values.confirm}
            >
              Change password
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
