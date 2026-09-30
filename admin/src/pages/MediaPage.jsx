import { useEffect, useState } from 'react';
import { api, assetUrl } from '../lib/api.js';
import { formatDate } from '../lib/form.js';
import { useToast } from '../context/ToastContext.jsx';
import { formatBytes, MediaThumb, Pager, UploadButton, useMediaList } from '../components/media.jsx';
import { Button, ConfirmDialog, EmptyState, Field, Modal, PageHeader, Spinner } from '../components/ui.jsx';

const TABS = [
  { value: 'image', label: 'Images' },
  { value: 'document', label: 'Documents' },
];

export default function MediaPage() {
  const toast = useToast();
  const [kind, setKind] = useState('image');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { items, meta, loading, reload } = useMediaList({ kind, q: search, page });

  const [selected, setSelected] = useState(null);
  const [alt, setAlt] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(q);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const open = (media) => {
    setSelected(media);
    setAlt(media.alt ?? '');
  };

  const saveAlt = async () => {
    setSaving(true);
    try {
      await api.put(`/media/${selected._id}`, { alt });
      toast.success('Alt text saved');
      setSelected(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await api.delete(`/media/${selected._id}`);
      toast.success('File deleted');
      setConfirmDelete(false);
      setSelected(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(new URL(assetUrl(selected.url), window.location.origin).href);
      toast.success('URL copied');
    } catch {
      toast.error('Could not copy. Select the URL and copy it manually.');
    }
  };

  return (
    <>
      <PageHeader
        title="Media library"
        description="Images and documents used across your site. Max 5 MB per image, 10 MB per PDF."
        actions={
          <UploadButton kind={kind} variant="primary" onUploaded={() => reload()}>
            Upload {kind === 'image' ? 'images' : 'PDF'}
          </UploadButton>
        }
      />

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-3 sm:flex-row sm:items-center">
          <div className="flex rounded-lg bg-slate-100 p-1">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setKind(tab.value);
                  setPage(1);
                }}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${kind === tab.value ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <input
            type="search"
            className="input sm:max-w-xs"
            placeholder="Search by file name or alt text..."
            aria-label="Search media"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="p-4">
          {loading ? (
            <div className="flex justify-center py-16 text-indigo-600">
              <Spinner />
            </div>
          ) : items.length === 0 ? (
            <EmptyState title="No files here yet" description="Upload files with the button above." />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
              {items.map((media) => (
                <button
                  key={media._id}
                  type="button"
                  onClick={() => open(media)}
                  className="group overflow-hidden rounded-lg border border-slate-200 bg-white text-left transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                >
                  <MediaThumb media={media} className="aspect-square w-full" />
                  <div className="px-2.5 py-2">
                    <p className="truncate text-xs font-medium text-slate-700">{media.originalName}</p>
                    <p className="text-xs text-slate-400">{formatBytes(media.size)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {meta?.totalPages > 1 && (
          <div className="border-t border-slate-200 p-3">
            <Pager meta={meta} onPage={setPage} />
          </div>
        )}
      </div>

      <Modal
        open={Boolean(selected) && !confirmDelete}
        onClose={() => setSelected(null)}
        title="File details"
        size="lg"
        footer={
          <>
            <Button variant="secondary" className="mr-auto text-red-600" onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
            <Button variant="secondary" onClick={() => setSelected(null)}>
              Close
            </Button>
            <Button loading={saving} onClick={saveAlt} disabled={alt === (selected?.alt ?? '')}>
              Save
            </Button>
          </>
        }
      >
        {selected && (
          <div className="grid gap-5 sm:grid-cols-2">
            {selected.kind === 'image' ? (
              <img src={assetUrl(selected.url)} alt={selected.alt} className="w-full rounded-lg bg-slate-100 object-contain" />
            ) : (
              <a
                href={assetUrl(selected.url)}
                target="_blank"
                rel="noreferrer"
                className="flex aspect-square items-center justify-center rounded-lg bg-slate-100 font-semibold text-slate-500 hover:text-indigo-600"
              >
                Open PDF ↗
              </a>
            )}
            <div className="space-y-4 text-sm">
              <dl className="space-y-2">
                {[
                  ['File name', selected.originalName],
                  ['Type', selected.mimeType],
                  ['Size', formatBytes(selected.size)],
                  ['Uploaded', formatDate(selected.createdAt)],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4">
                    <dt className="text-slate-500">{label}</dt>
                    <dd className="truncate text-right font-medium text-slate-800">{value}</dd>
                  </div>
                ))}
              </dl>
              <Field label="URL">
                <div className="flex gap-2">
                  <input className="input" readOnly value={selected.url} onFocus={(e) => e.target.select()} />
                  <Button variant="secondary" onClick={copyUrl}>
                    Copy
                  </Button>
                </div>
              </Field>
              {selected.kind === 'image' && (
                <Field label="Alt text" htmlFor="media-alt" hint="Describes the image for screen readers and search engines.">
                  <input id="media-alt" className="input" maxLength={200} value={alt} onChange={(e) => setAlt(e.target.value)} />
                </Field>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete file?"
        message="The file will be removed from the server. Any page still using it will show a broken image."
        loading={deleting}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
