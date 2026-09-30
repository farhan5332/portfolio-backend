import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { api } from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { useContentForm } from '../hooks/useContentForm.js';
import ContentForm from '../components/ContentForm.jsx';
import { Badge, Button, ConfirmDialog, PageLoader } from '../components/ui.jsx';

// Create + edit page for any collection (projects, blogs, skills...)
export default function ResourceEditPage({ resource }) {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const toast = useToast();
  const form = useContentForm(resource);
  const { reset } = form;

  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(!isNew);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isNew) {
      setDoc(null);
      reset(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api
      .get(`${resource.path}/${id}`)
      .then((res) => {
        if (cancelled) return;
        setDoc(res.data);
        reset(res.data);
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error(err.message);
        navigate(`/${resource.key}`, { replace: true });
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id, isNew, resource, reset, navigate, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const saved = await form.submit(async (body) => {
        const res = isNew ? await api.post(resource.path, body) : await api.put(`${resource.path}/${id}`, body);
        return res.data;
      });
      toast.success(`${resource.singular} ${isNew ? 'created' : 'saved'}`);
      setDoc(saved);
      form.reset(saved);
      if (isNew) navigate(`/${resource.key}/${saved._id}`, { replace: true });
    } catch (err) {
      toast.error(err.details?.length ? 'Please fix the highlighted fields' : err.message);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`${resource.path}/${id}`);
      toast.success(`${resource.singular} deleted`);
      navigate(`/${resource.key}`);
    } catch (err) {
      toast.error(err.message);
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (loading) return <PageLoader />;

  const title = isNew ? `New ${resource.singular.toLowerCase()}` : doc?.[resource.titleField] || resource.singular;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="sticky top-0 z-20 -mx-4 mb-6 border-b border-slate-200 bg-slate-50/90 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <Link to={`/${resource.key}`} className="text-sm text-slate-500 hover:text-slate-700">
              ← {resource.label}
            </Link>
            <div className="flex items-center gap-2">
              <h1 className="truncate text-xl font-semibold text-slate-900">{title}</h1>
              {form.dirty && <Badge color="yellow">Unsaved</Badge>}
            </div>
            {doc?.slug && <p className="truncate text-xs text-slate-500">/{resource.key}/{doc.slug}</p>}
          </div>
          <div className="flex shrink-0 gap-2">
            {!isNew && (
              <Button variant="secondary" className="text-red-600" onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            )}
            <Button type="submit" loading={form.saving} disabled={!isNew && !form.dirty}>
              {isNew ? `Create ${resource.singular.toLowerCase()}` : 'Save changes'}
            </Button>
          </div>
        </div>
      </div>

      <ContentForm resource={resource} values={form.values} errors={form.errors} onChange={form.setField} />

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete ${resource.singular.toLowerCase()}?`}
        message={`"${title}" will be permanently deleted. This cannot be undone.`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </form>
  );
}
