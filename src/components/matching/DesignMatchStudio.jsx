import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import UserAvatar from '../common/UserAvatar';

const DesignMatchStudio = () => {
  const { isClient } = useAuth();
  const [controls, setControls] = useState({
    budgetMultiplier: 1,
    radiusKm: 50,
    qualityBias: 0.6
  });
  const [brief, setBrief] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMatches = async () => {
      if (!isClient) return;

      try {
        setLoading(true);
        setError('');
        const response = await api.get('/api/designers/matches/recommendations', {
          params: {
            budgetMultiplier: controls.budgetMultiplier,
            radiusKm: controls.radiusKm,
            qualityBias: controls.qualityBias
          }
        });

        setBrief(response.data?.brief || null);
        setMatches(Array.isArray(response.data?.matches) ? response.data.matches : []);
      } catch (err) {
        console.error('Error fetching design matches:', err);
        setError('Unable to calculate designer matches right now.');
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [isClient, controls.budgetMultiplier, controls.radiusKm, controls.qualityBias]);

  if (!isClient) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-cyan-700 bg-cyan-100 mb-3">
          Design Match Studio
        </div>
        <h1 className="text-2xl font-bold text-gray-900">AI-Powered Designer Match</h1>
        <p className="text-sm text-gray-600 mt-1">
          {brief?.title ? `Using brief: ${brief.title}` : 'Tune your priorities and get the best-fit designers instantly.'}
        </p>
      </div>

      <div className="glass p-6 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Budget What-If ({Math.round(controls.budgetMultiplier * 100)}%)</label>
            <input
              type="range"
              min="0.6"
              max="1.8"
              step="0.1"
              value={controls.budgetMultiplier}
              onChange={(e) => setControls((prev) => ({ ...prev, budgetMultiplier: Number(e.target.value) }))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Search Radius ({controls.radiusKm} km)</label>
            <input
              type="range"
              min="10"
              max="200"
              step="10"
              value={controls.radiusKm}
              onChange={(e) => setControls((prev) => ({ ...prev, radiusKm: Number(e.target.value) }))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Priority ({controls.qualityBias >= 0.5 ? 'Quality' : 'Cost'})</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={controls.qualityBias}
              onChange={(e) => setControls((prev) => ({ ...prev, qualityBias: Number(e.target.value) }))}
              className="w-full"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-36 rounded-lg"></div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : matches.length === 0 ? (
          <p className="text-sm text-gray-500">No recommendations yet. Create a project brief to unlock smarter matches.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.map((item) => (
              <Link key={item.designerId} to={`/app/designers/${item.designerId}`} className="card hover-shadow-pop">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar user={{ username: item?.name, avatarUrl: item?.avatarUrl }} sizeClass="w-10 h-10" className="shadow-sm" textClass="text-sm font-semibold" />
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate">{item.name}</h3>
                        <p className="text-xs text-gray-500 truncate">{item.headline || item.username}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-cyan-700">{item.score}/100</div>
                      <div className="text-[11px] text-gray-500">Match</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {(item.reasons || []).map((reason) => (
                      <span key={reason} className="px-2 py-0.5 text-[11px] rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
                        {reason}
                      </span>
                    ))}
                  </div>

                  <div className="text-xs text-gray-500 grid grid-cols-2 gap-2">
                    <span>Rating: {item.averageRating ? item.averageRating.toFixed(1) : 'N/A'}</span>
                    <span>{typeof item.distanceKm === 'number' ? `${item.distanceKm} km` : 'Distance N/A'}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DesignMatchStudio;
