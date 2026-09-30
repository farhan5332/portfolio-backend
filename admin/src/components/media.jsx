import { useCallback, useEffect, useRef, useState } from 'react';
import { api, assetUrl, toQuery } from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { Button, EmptyState, Modal, Spinner } from './ui.jsx';

export const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const ACCEPT = {
  image: 'image/jpeg,image/png,image/webp,image/gif,image/avif',
  document: 'application/pdf',
};

// Button that opens the file chooser and uploads straight away.
export function UploadButton({ kind = 'image', onUploaded, variant = 'secondary', size = 'md', children = 'Upload' }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const toast = useToast();

  const handleFiles = async (files) => {
    setUploading(true);
    try {
      for (const file of files) {
        const res = await api.upload(kind, file);
        onUploaded?.(res.data);
      }
      toast.success(files.length > 1 ? `${files.length} files uploaded` : 'File uploaded');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT[kind]}
        multiple={kind === 'image'}
        className="hidden"
        onChange={(e) => e.target.files.length && handleFiles([...e.target.files])}
      />
      <Button variant={variant} size={size} loading={uploading} onClick={() => inputRef.current?.click()}>
        {children}
      </Button>
    </>
  );
}

// Loads one page of the media library.
export function useMediaList({ kind, q, page, limit = 24 }) {
  const [state, setState] = useState({ items: [], meta: null, loading: true });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const res = await api.get(`/media${toQuery({ kind, q, page, limit })}`);
      setState({ items: res.data, meta: res.meta, loading: false });
    } catch {
      setState({ items: [], meta: null, loading: false });
    }
  }, [kind, q, page, limit]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}

export function MediaThumb({ media, className = '' }) {
  if (media.kind === 'document') {
    return (
      <div className={`flex items-center justify-center bg-slate-100 text-xs font-semibold text-slate-500 ${className}`}>
        PDF
      </div>
    );
  }
  return (
    <img
      src={assetUrl(media.url)}
      alt={media.alt || media.originalName}
      loading="lazy"
      className={`bg-slate-100 object-cover ${className}`}
    />
  );
}

export function Pager({ meta, onPage }) {
  if (!meta || meta.totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-2 text-sm text-slate-600">
      <span>
        Page {meta.page} of {meta.totalPages} · {meta.total} items
      </span>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>
          Previous
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPage(meta.page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

// Modal to choose an existing file from the library (or upload a new one).
export function MediaPicker({ open, onClose, onSelect, kind = 'image' }) {
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { items, meta, loading, reload } = useMediaList({ kind, q: search, page, limit: 18 });

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(q);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const choose = (media) => {
    onSelect(media);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={kind === 'image' ? 'Choose an image' : 'Choose a file'}
      footer={<Pager meta={meta} onPage={setPage} />}
    >
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input
          className="input"
          placeholder="Search by file name or alt text..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <UploadButton
          kind={kind}
          variant="primary"
          onUploaded={(media) => {
            if (kind === 'document') return choose(media);
            reload();
          }}
        >
          Upload new
        </UploadButton>
      </div>

      {loading ? (
        <div className="flex justify-center py-12 text-indigo-600">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <EmptyState title="No files yet" description="Upload one to get started." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {items.map((media) => (
            <button
              key={media._id}
              type="button"
              onClick={() => choose(media)}
              className="group overflow-hidden rounded-lg border border-slate-200 text-left hover:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            >
              <MediaThumb media={media} className="aspect-square w-full" />
              <p className="truncate px-2 py-1.5 text-xs text-slate-600 group-hover:text-indigo-700">
                {media.originalName}
              </p>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
