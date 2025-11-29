import React, { useState, useEffect } from 'react';
import Button from '../../components/common/Button';
import { BarChartTeams } from '../../components/charts/BarChartTeams';
import { DownloadIcon, ExclamationCircleIcon } from '@heroicons/react/outline';
import { useStories } from '../../hooks/useStories';
import apiService from '../../services/api';



const BarChart = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  return (
    <div className="h-64 flex items-end justify-center space-x-8 p-4">
      {data.map((item, index) => (
        <div key={index} className="flex flex-col items-center space-y-2">
          <div className="text-sm font-semibold text-white">{item.value}</div>
          <div 
            className="w-16 rounded-t transition-all duration-500"
            style={{ 
              height: `${(item.value / maxValue) * 180}px`,
              backgroundColor: item.color 
            }}
          />
          <div className="text-xs text-gray-300 text-center">{item.label}</div>
        </div>
      ))}
    </div>
  );
};

const LineChart = ({ data }) => {
  return (
    <div className="h-64 flex items-end justify-between p-4">
      {data.map((point, index) => (
        <div key={index} className="flex flex-col items-center space-y-2">
          <div className="text-xs text-gray-300">{point.value}%</div>
          <div 
            className="w-8 rounded-t transition-all duration-500"
            style={{ 
              height: `${point.value * 2}px`,
              backgroundColor: '#ffc44d'
            }}
          />
          <div className="text-xs text-gray-400">W{index + 1}</div>
        </div>
      ))}
    </div>
  );
};



/**
 * Analytics page component
 * Displays charts and metrics with filtering options
 */
const Analytics = () => {
  const { stories, loading: storiesLoading, error: storiesError } = useStories();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    dateRange: 'last30days',
    team: 'all',
    priority: 'all'
  });

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const teamsData = await apiService.getTeams();
      setTeams(teamsData);
    } catch (err) {
      console.error('Failed to fetch teams:', err);
      setError('Failed to load teams data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate analytics from real data
  const analytics = React.useMemo(() => {
    if (!stories.length) return null;

    const priorityCounts = {
      Critical: stories.filter(s => s.priority === 'Critical').length,
      High: stories.filter(s => s.priority === 'High').length,
      Medium: stories.filter(s => s.priority === 'Medium').length,
      Low: stories.filter(s => s.priority === 'Low').length
    };

    const statusCounts = {
      Completed: stories.filter(s => s.status === 'Completed').length,
      'In Progress': stories.filter(s => s.status === 'In Progress').length,
      Pending: stories.filter(s => s.status === 'Pending').length,
      Overdue: stories.filter(s => s.status === 'Overdue').length
    };

    const totalStories = stories.length;
    const completedStories = statusCounts.Completed;
    const completionRate = totalStories > 0 ? Math.round((completedStories / totalStories) * 100) : 0;

    return {
      priorityCounts,
      statusCounts,
      totalStories,
      completionRate
    };
  }, [stories]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleExport = () => {
    if (!analytics) {
      alert('No data available to export');
      return;
    }
    
    const exportData = {
      totalStories: analytics.totalStories,
      completionRate: analytics.completionRate,
      priorityBreakdown: analytics.priorityCounts,
      statusBreakdown: analytics.statusCounts,
      exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  if (loading || storiesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading analytics...</div>
      </div>
    );
  }

  if (error || storiesError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ExclamationCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Failed to Load Analytics</h3>
          <p className="text-gray-400 mb-4">{error || storiesError}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!analytics || analytics.totalStories === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-white mb-2">No Data Available</h3>
          <p className="text-gray-400">Create some stories to see analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-gray-300">Track your team's productivity and performance</p>
        </div>
        <Button
          variant="outline"
          onClick={handleExport}
          className="flex items-center"
        >
          <DownloadIcon className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Date Range</label>
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': '#ffc44d' }}
            >
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="last90days">Last 90 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Team</label>
            <select
              value={filters.team}
              onChange={(e) => handleFilterChange('team', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': '#ffc44d' }}
            >
              <option value="all">All Teams</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': '#ffc44d' }}
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks by Priority Chart */}
        <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Stories by Priority</h3>
          <div className="h-64 p-4 flex items-center justify-center">
            <div className="relative">
              <svg width="160" height="160" className="transform -rotate-90">
                {(() => {
                  const { Critical, High, Medium, Low } = analytics.priorityCounts;
                  const total = analytics.totalStories;
                  const circumference = 2 * Math.PI * 70;
                  
                  const criticalPercent = total > 0 ? (Critical / total) : 0;
                  const highPercent = total > 0 ? (High / total) : 0;
                  const mediumPercent = total > 0 ? (Medium / total) : 0;
                  const lowPercent = total > 0 ? (Low / total) : 0;
                  
                  let offset = 0;
                  
                  return (
                    <>
                      <circle cx="80" cy="80" r="70" fill="none" stroke="#ef4444" strokeWidth="20" 
                        strokeDasharray={`${criticalPercent * circumference} ${circumference}`} 
                        strokeDashoffset={offset} />
                      <circle cx="80" cy="80" r="70" fill="none" stroke="#f97316" strokeWidth="20" 
                        strokeDasharray={`${highPercent * circumference} ${circumference}`} 
                        strokeDashoffset={offset -= criticalPercent * circumference} />
                      <circle cx="80" cy="80" r="70" fill="none" stroke="#ffc44d" strokeWidth="20" 
                        strokeDasharray={`${mediumPercent * circumference} ${circumference}`} 
                        strokeDashoffset={offset -= highPercent * circumference} />
                      <circle cx="80" cy="80" r="70" fill="none" stroke="#22c55e" strokeWidth="20" 
                        strokeDasharray={`${lowPercent * circumference} ${circumference}`} 
                        strokeDashoffset={offset -= mediumPercent * circumference} />
                    </>
                  );
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-2xl font-bold text-white">{analytics.totalStories}</div>
                <div className="text-sm text-gray-300">Total</div>
              </div>
            </div>
            <div className="ml-8 space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-white text-sm">Critical: {analytics.priorityCounts.Critical} ({analytics.totalStories > 0 ? Math.round((analytics.priorityCounts.Critical / analytics.totalStories) * 100) : 0}%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-white text-sm">High: {analytics.priorityCounts.High} ({analytics.totalStories > 0 ? Math.round((analytics.priorityCounts.High / analytics.totalStories) * 100) : 0}%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ffc44d' }} />
                <span className="text-white text-sm">Medium: {analytics.priorityCounts.Medium} ({analytics.totalStories > 0 ? Math.round((analytics.priorityCounts.Medium / analytics.totalStories) * 100) : 0}%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-white text-sm">Low: {analytics.priorityCounts.Low} ({analytics.totalStories > 0 ? Math.round((analytics.priorityCounts.Low / analytics.totalStories) * 100) : 0}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks by Team Chart */}
        <div>
          <BarChartTeams />
        </div>


      </div>

      {/* Summary Stats */}
      <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Summary Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: '#ffc44d' }}>{analytics.completionRate}%</p>
            <p className="text-sm text-gray-300">Completion Rate</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">{analytics.statusCounts.Completed}</p>
            <p className="text-sm text-gray-300">Completed Stories</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">{analytics.statusCounts['In Progress']}</p>
            <p className="text-sm text-gray-300">In Progress</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-400">{teams.length}</p>
            <p className="text-sm text-gray-300">Active Teams</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;