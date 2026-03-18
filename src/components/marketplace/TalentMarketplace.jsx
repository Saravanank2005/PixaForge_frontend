import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import UserAvatar from '../common/UserAvatar';

const TalentMarketplace = () => {
  const { isClient } = useAuth();
  const [designers, setDesigners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchDesigners = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/designers');
        const allDesigners = Array.isArray(response.data) ? response.data : [];

        const ranked = [...allDesigners]
          .sort((a, b) => {
            const ratingDiff = Number(b?.averageRating || 0) - Number(a?.averageRating || 0);
            if (ratingDiff !== 0) return ratingDiff;

            const aPortfolio = Array.isArray(a?.portfolio) ? a.portfolio.length : 0;
            const bPortfolio = Array.isArray(b?.portfolio) ? b.portfolio.length : 0;
            return bPortfolio - aPortfolio;
          });

        setDesigners(ranked);
      } catch (err) {
        console.error('Error fetching marketplace designers:', err);
        setError('Unable to load freelancers right now.');
      } finally {
        setLoading(false);
      }
    };

    if (isClient) {
      fetchDesigners();
    }
  }, [isClient]);

  const filteredDesigners = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return designers;

    return designers.filter((designer) => {
      const name = getDesignerDisplayName(designer).toLowerCase();
      const headline = String(designer?.professionalHeadline || '').toLowerCase();
      const skills = Array.isArray(designer?.skills)
        ? designer.skills.map((skill) => String(skill?.name || '').toLowerCase()).join(' ')
        : '';

      return name.includes(query) || headline.includes(query) || skills.includes(query);
    });
  }, [designers, search]);

  if (!isClient) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-fuchsia-700 bg-fuchsia-100 mb-3">
          Talent Marketplace
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Freelancers Open For Work</h1>
        <p className="text-sm text-gray-600 mt-1">Discover available designers, review their work, and visit profiles instantly.</p>
      </div>

      <div className="glass p-5 rounded-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, skill, or specialty"
            className="w-full md:w-96 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
          <Link to="/app/designers" className="btn btn-primary text-sm w-fit">Open Advanced Search</Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton h-40 rounded-lg"></div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : filteredDesigners.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-4 bg-gray-50 text-sm text-gray-600">
            No freelancers matched your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredDesigners.map((designer) => {
              const displayName = getDesignerDisplayName(designer);
              const skills = Array.isArray(designer?.skills) ? designer.skills.slice(0, 3) : [];
              const works = Array.isArray(designer?.portfolio) ? designer.portfolio.length : 0;

              return (
                <div key={designer?._id || designer?.email || displayName} className="card hover-shadow-pop">
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar user={designer} sizeClass="w-11 h-11" className="shadow-sm flex-shrink-0" textClass="text-sm font-semibold" />
                        <div className="min-w-0">
                          <h3 className="font-semibold truncate">{displayName}</h3>
                          <p className="text-xs text-gray-500 truncate">{designer?.professionalHeadline || 'Freelance Designer'}</p>
                        </div>
                      </div>
                      {isRecentlyActive(designer?.lastActive) && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Open for Work</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span>Rating: {designer?.averageRating ? Number(designer.averageRating).toFixed(1) : 'New'}</span>
                      <span>{works} works</span>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {skills.length > 0 ? (
                        skills.map((skill) => (
                          <span key={`${designer?._id}-${skill?.name}`} className="px-2 py-0.5 text-[11px] rounded-full bg-gray-100 text-gray-700">
                            {skill?.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">No skills listed yet</span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Link to={`/app/designers/${designer?._id}?tab=portfolio`} className="flex-1 inline-flex items-center justify-center px-3 py-2 rounded-md text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100">
                        See Works
                      </Link>
                      <Link to={`/app/designers/${designer?._id}`} className="flex-1 inline-flex items-center justify-center px-3 py-2 rounded-md text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700">
                        Visit Profile
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const isRecentlyActive = (lastActive) => {
  if (!lastActive) return false;
  const days = (Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24);
  return days <= 10;
};

const getDesignerDisplayName = (designer) =>
  designer?.name || designer?.username || designer?.fullName || 'Designer';

export default TalentMarketplace;
