import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { api, toQuery } from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { Pager } from '../components/media.jsx';
import { Button, ConfirmDialog, EmptyState, PageHeader, Spinner } from '../components/ui.jsx';

// Table of items for any collection, with search, status filter, reorder and delete.
export default function ResourceListPage({ resource }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page')) || 1;
  const q = params.get('q') ?? '';
  const status = params.get('status') ?? '';

  const [search, setSearch] = useState(q);
  const [state, setState] = useState({ items: [], meta: null, loading: true });
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [reordering, setReordering] = useState(false);

  // Reorderable content is listed by "order" so the arrows match what the site shows.
  // A big page size keeps everything on one page, which makes reordering predictable.
  const canReorder = resource.reorderable && !q && !status;
  const limit = resource.reorderable ? 100 : 20;

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
      const sort = resource.reorderable ? 'order' : undefined;
      const res = await api.get(`${resource.path}${toQuery({ page, limit, q, status, sort })}`);
      setState({ items: res.data, meta: res.meta, loading: false });
    } catch (err) {
      toast.error(err.message);
      setState({ items: [], meta: null, loading: false });
    }
  }, [resource, page, limit, q, status, toast]);

  useEffect(() => {
    load();
  }, [load]);

  // Debounced search
  useEffect(() => {
    if (search === q) return;
    const t = setTimeout(() => updateParams({ q: search.trim(), page: '' }), 350);
    return () => clearTimeout(t);
  }, [search, q, updateParams]);

  const moveItem = async (from, to) => {
    const items = [...state.items];
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
    setState((s) => ({ ...s, items })); // update the screen immediately

    setReordering(true);
    try {
      await api.put(`${resource.path}/reorder`, { items: items.map((item, i) => ({ id: item._id, order: i })) });
      setState((s) => ({ ...s, items: s.items.map((item, i) => ({ ...item, order: i })) }));
    } catch (err) {
      toast.error(err.message);
      load();
    } finally {
      setReordering(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`${resource.path}/${toDelete._id}`);
      toast.success(`${resource.singular} deleted`);
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const { items, meta, loading } = state;
  const filtered = Boolean(q || status);

  return (
    <>
      <PageHeader
        title={resource.label}
        description={resource.description}
        actions={
          <Button onClick={() => navigate(`/${resource.key}/new`)}>+ New {resource.singular.toLowerCase()}</Button>
        }
      />

      <div className="card overflow-hidden">
        {(resource.searchable || resource.statusFilter) && (
          <div className="flex flex-col gap-2 border-b border-slate-200 p-3 sm:flex-row">
            {resource.searchable && (
              <input
                type="search"
                className="input sm:max-w-xs"
                placeholder={`Search ${resource.label.toLowerCase()}...`}
                aria-label="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            )}
            {resource.statusFilter && (
              <select
                className="input sm:w-44"
                aria-label="Filter by status"
                value={status}
                onChange={(e) => updateParams({ status: e.target.value, page: '' })}
              >
                <option value="">All statuses</option>
                <option value="published">Published</option>
                <option value="draft">Drafts</option>
              </select>
            )}
            {reordering && (
              <span className="flex items-center gap-2 text-xs text-slate-500 sm:ml-auto">
                <Spinner className="size-3.5" /> Saving order...
              </span>
            )}
          </div>
        )}

        {loading && !items.length ? (
          <div className="flex justify-center py-16 text-indigo-600">
            <Spinner />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title={filtered ? 'Nothing matches your filters' : `No ${resource.label.toLowerCase()} yet`}
            description={filtered ? 'Try a different search.' : `Create your first ${resource.singular.toLowerCase()}.`}
            action={
              !filtered && (
                <Button onClick={() => navigate(`/${resource.key}/new`)}>+ New {resource.singular.toLowerCase()}</Button>
              )
            }
          />
        ) : (
          <div className={`overflow-x-auto ${loading ? 'opacity-60' : ''}`}>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium tracking-wide text-slate-500 uppercase">
                <tr>
                  {canReorder && <th className="w-20 px-4 py-3">Order</th>}
                  {resource.columns.map((col) => (
                    <th key={col.label} className="px-4 py-3 whitespace-nowrap">
                      {col.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, i) => (
                  <tr key={item._id} className="hover:bg-slate-50">
                    {canReorder && (
                      <td className="px-4 py-3">
                        <div className="flex gap-0.5">
                          <Button size="sm" variant="ghost" disabled={i === 0 || reordering} onClick={() => moveItem(i, i - 1)} aria-label="Move up">
                            ↑
                          </Button>
                          <Button size="sm" variant="ghost" disabled={i === items.length - 1 || reordering} onClick={() => moveItem(i, i + 1)} aria-label="Move down">
                            ↓
                          </Button>
                        </div>
                      </td>
                    )}
                    {resource.columns.map((col, cIdx) => (
                      <td key={col.label} className="max-w-xs px-4 py-3 text-slate-600">
                        {cIdx === 0 ? (
                          <Link to={`/${resource.key}/${item._id}`} className="block hover:text-indigo-700">
                            {col.render(item)}
                          </Link>
                        ) : (
                          col.render(item)
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/${resource.key}/${item._id}`)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => setToDelete(item)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta?.totalPages > 1 && (
          <div className="border-t border-slate-200 p-3">
            <Pager meta={meta} onPage={(p) => updateParams({ page: p > 1 ? p : '' })} />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={`Delete ${resource.singular.toLowerCase()}?`}
        message={`"${toDelete?.[resource.titleField] ?? ''}" will be permanently deleted. This cannot be undone.`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
