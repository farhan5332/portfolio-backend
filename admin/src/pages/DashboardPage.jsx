import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { api } from '../lib/api.js';
import { formatDate } from '../lib/form.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Badge, PageHeader, PageLoader } from '../components/ui.jsx';

function StatCard({ to, label, value, detail }) {
  return (
    <Link to={to} className="card group p-5 transition-shadow hover:shadow-md">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900 tabular-nums group-hover:text-indigo-700">{value}</p>
      {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
    </Link>
  );
}

function RecentList({ title, to, items }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        <Link to={to} className="text-sm text-indigo-600 hover:underline">
          View all
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-slate-500">Nothing here yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((item) => (
            <li key={item._id}>
              <Link to={`${to}/${item._id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50">
                <span className="truncate text-sm font-medium text-slate-800">{item.title}</span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className="hidden text-xs text-slate-400 sm:inline">{formatDate(item.updatedAt)}</span>
                  <Badge color={item.status === 'published' ? 'green' : 'yellow'}>{item.status}</Badge>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/stats')
      .then((res) => setStats(res.data))
      .catch((err) => setError(err.message));
  }, []);

  const firstName = user?.name?.split(' ')[0] ?? '';

  return (
    <>
      <PageHeader title={`Welcome back${firstName ? `, ${firstName}` : ''} 👋`} description="Here's what's on your site right now." />

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {!stats && !error && <PageLoader />}

      {stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              to="/projects"
              label="Projects"
              value={stats.counts.projects.total}
              detail={`${stats.counts.projects.published} published · ${stats.counts.projects.draft} draft`}
            />
            <StatCard
              to="/blogs"
              label="Blog posts"
              value={stats.counts.blogs.total}
              detail={`${stats.counts.blogs.published} published · ${stats.counts.blogs.draft} draft`}
            />
            <StatCard to="/skills" label="Skills" value={stats.counts.skills} />
            <StatCard to="/experience" label="Experience" value={stats.counts.experience} />
            <StatCard to="/testimonials" label="Testimonials" value={stats.counts.testimonials} />
            <StatCard to="/services" label="Services" value={stats.counts.services} />
            <StatCard to="/media" label="Media files" value={stats.counts.media ?? 0} />
            <StatCard
              to="/messages"
              label="Messages"
              value={stats.counts.messages?.total ?? 0}
              detail={`${stats.counts.messages?.unread ?? 0} unread`}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <RecentList title="Recent projects" to="/projects" items={stats.recent.projects} />
            <RecentList title="Recent posts" to="/blogs" items={stats.recent.blogs} />
          </div>
        </div>
      )}
    </>
  );
}
