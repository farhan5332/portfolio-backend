import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { resources } from '../resources.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useContentForm } from '../hooks/useContentForm.js';
import ContentForm from '../components/ContentForm.jsx';
import { Badge, Button, PageLoader } from '../components/ui.jsx';

const resource = resources.about;

// About is a single document: GET /about, PUT /about (creates it the first time).
export default function AboutPage() {
  const toast = useToast();
  const form = useContentForm(resource);
  const { reset } = form;
  const [loading, setLoading] = useState(true);
  const [exists, setExists] = useState(true);

  useEffect(() => {
    api
      .get('/about')
      .then((res) => reset(res.data))
      .catch((err) => {
        if (err.status === 404) setExists(false);
        else toast.error(err.message);
      })
      .finally(() => setLoading(false));
  }, [reset, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const saved = await form.submit(async (body) => (await api.put('/about', body)).data);
      form.reset(saved);
      setExists(true);
      toast.success('About info saved');
    } catch (err) {
      toast.error(err.details?.length ? 'Please fix the highlighted fields' : err.message);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="sticky top-0 z-20 -mx-4 mb-6 border-b border-slate-200 bg-slate-50/90 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-slate-900">About</h1>
              {form.dirty && <Badge color="yellow">Unsaved</Badge>}
            </div>
            <p className="text-sm text-slate-500">{resource.description}</p>
          </div>
          <Button type="submit" loading={form.saving} disabled={exists && !form.dirty}>
            {exists ? 'Save changes' : 'Create About info'}
          </Button>
        </div>
      </div>

      {!exists && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Your About info hasn&apos;t been set up yet. Fill in at least your name and save.
        </div>
      )}

      <ContentForm resource={resource} values={form.values} errors={form.errors} onChange={form.setField} />
    </form>
  );
}
