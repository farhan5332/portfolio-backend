import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { api, toQuery } from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { Pager } from '../components/media.jsx';
import { Badge, Button, ConfirmDialog, EmptyState, Modal, PageHeader, Spinner } from '../components/ui.jsx';

const formatDateTime = (value) =>
  new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

// Inbox for messages sent through the site's contact form.
export default function MessagesPage() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page')) || 1;
  const q = params.get('q') ?? '';
  const read = params.get('read') ?? '';

  const [search, setSearch] = useState(q);
  const [state, setState] = useState({ items: [], meta: null, loading: true });
  const [open, setOpen] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const updateParams = useCallback(
    (patch) => {
      const next = new URLSearchParams(params);
      for (const [k, v] of Object.entries(patch)) (v ? next.set(k, String(v)) : next.delete(k));
      setParams(next, { replace: true });
    },
    [params, setParams]
  );

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const res = await api.get(`/contact${toQuery({ page, q, read })}`);
      setState({ items: res.data, meta: res.meta, loading: false });
    } catch (err) {
      toast.error(err.message);
      setState({ items: [], meta: null, loading: false });
    }
  }, [page, q, read, toast]);

  useEffect(() => {
    load();
  }, [load]);

  // Debounced search
  useEffect(() => {
    if (search === q) return;
    const t = setTimeout(() => updateParams({ q: search.trim(), page: '' }), 350);
    return () => clearTimeout(t);
  }, [search, q, updateParams]);

  const setRead = async (message, value) => {
    try {
      const res = await api.put(`/contact/${message._id}`, { read: value });
      setState((s) => ({ ...s, items: s.items.map((m) => (m._id === message._id ? res.data : m)) }));
      setOpen((current) => (current?._id === message._id ? res.data : current));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const openMessage = (message) => {
    setOpen(message);
    if (!message.read) setRead(message, true);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/contact/${toDelete._id}`);
      toast.success('Message deleted');
      setToDelete(null);
      setOpen(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const { items, meta, loading } = state;
  const filtered = Boolean(q || read);

  return (
    <>
      <PageHeader title="Messages" description="Sent through the contact form on your site." />

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-slate-200 p-3 sm:flex-row">
          <input
            type="search"
            className="input sm:max-w-xs"
            placeholder="Search messages..."
            aria-label="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="input sm:w-44"
            aria-label="Filter by read status"
            value={read}
            onChange={(e) => updateParams({ read: e.target.value, page: '' })}
          >
            <option value="">All messages</option>
            <option value="false">Unread</option>
            <option value="true">Read</option>
          </select>
        </div>

        {loading && !items.length ? (
          <div className="flex justify-center py-16 text-indigo-600">
            <Spinner />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title={filtered ? 'Nothing matches your filters' : 'No messages yet'}
            description={filtered ? 'Try a different search.' : 'Messages from your contact form will show up here.'}
          />
        ) : (
          <ul className={`divide-y divide-slate-100 ${loading ? 'opacity-60' : ''}`}>
            {items.map((m) => (
              <li key={m._id}>
                <button
                  type="button"
                  onClick={() => openMessage(m)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50"
                >
                  <span
                    className={`mt-1.5 size-2 shrink-0 rounded-full ${m.read ? 'bg-transparent' : 'bg-indigo-500'}`}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className={`truncate text-sm ${m.read ? 'text-slate-700' : 'font-semibold text-slate-900'}`}>
                        {m.name} <span className="font-normal text-slate-400">· {m.email}</span>
                      </span>
                      <span className="shrink-0 text-xs text-slate-400">{formatDateTime(m.createdAt)}</span>
                    </span>
                    <span className={`block truncate text-sm ${m.read ? 'text-slate-600' : 'font-medium text-slate-800'}`}>
                      {m.subject || '(no subject)'}
                    </span>
                    <span className="block truncate text-sm text-slate-500">{m.message}</span>
                  </span>
                  {!m.read && <span className="sr-only">Unread</span>}
                </button>
              </li>
            ))}
          </ul>
        )}

        {meta?.totalPages > 1 && (
          <div className="border-t border-slate-200 p-3">
            <Pager meta={meta} onPage={(p) => updateParams({ page: p > 1 ? p : '' })} />
          </div>
        )}
      </div>

      <Modal
        open={Boolean(open)}
        onClose={() => setOpen(null)}
        title={open?.subject || '(no subject)'}
        size="lg"
        footer={
          open && (
            <>
              <Button variant="ghost" className="mr-auto text-red-600 hover:bg-red-50" onClick={() => setToDelete(open)}>
                Delete
              </Button>
              <Button variant="secondary" onClick={() => setRead(open, !open.read)}>
                Mark as {open.read ? 'unread' : 'read'}
              </Button>
              <a
                href={`mailto:${open.email}?subject=${encodeURIComponent(`Re: ${open.subject || 'Your message'}`)}`}
                className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-indigo-700"
              >
                Reply by email
              </a>
            </>
          )
        }
      >
        {open && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="font-medium text-slate-900">{open.name}</span>
              <a href={`mailto:${open.email}`} className="text-indigo-600 hover:underline">
                {open.email}
              </a>
              <span className="text-slate-400">{formatDateTime(open.createdAt)}</span>
              {!open.emailSent && <Badge color="yellow">Not emailed</Badge>}
            </div>
            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap text-slate-700">{open.message}</p>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete message?"
        message={`The message from "${toDelete?.name ?? ''}" will be permanently deleted. This cannot be undone.`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
