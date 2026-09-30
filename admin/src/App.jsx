import { Link, Navigate, Route, Routes, useLocation } from 'react-router';
import { useAuth } from './context/AuthContext.jsx';
import { collectionResources } from './resources.jsx';
import Layout from './components/Layout.jsx';
import { PageLoader } from './components/ui.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import ResourceListPage from './pages/ResourceListPage.jsx';
import ResourceEditPage from './pages/ResourceEditPage.jsx';
import MediaPage from './pages/MediaPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

function RequireAuth({ children }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <PageLoader />;
  if (status === 'guest') return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

function NotFound() {
  return (
    <div className="py-20 text-center">
      <p className="text-5xl font-bold text-slate-300">404</p>
      <p className="mt-2 text-slate-600">This page doesn&apos;t exist.</p>
      <Link to="/" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
        Back to dashboard
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="about" element={<AboutPage />} />
        {collectionResources.map((r) => (
          <Route key={r.key} path={r.key}>
            {/* key forces a fresh page when switching between content types */}
            <Route index element={<ResourceListPage key={r.key} resource={r} />} />
            <Route path="new" element={<ResourceEditPage key={`${r.key}-new`} resource={r} />} />
            <Route path=":id" element={<ResourceEditPage key={`${r.key}-edit`} resource={r} />} />
          </Route>
        ))}
        <Route path="media" element={<MediaPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
