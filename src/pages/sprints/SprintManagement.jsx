import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, CalendarIcon } from '@heroicons/react/outline';
import Button from '../../components/common/Button';
import AddSprintModal from '../../components/modals/AddSprintModal';
import { useSprints } from '../../hooks/useSprints';

const SprintManagement = () => {
  const navigate = useNavigate();
  const { sprints, loading, error, createSprint } = useSprints();
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAddSprint = async (sprintData) => {
    try {
      await createSprint(sprintData);
      setShowAddModal(false);
    } catch (err) {
      console.error('Failed to create sprint:', err);
    }
  };

  const handleViewSprint = (sprint) => {
    navigate(`/app/sprints/${sprint.id}`);
  };

  const getStatusColor = (status) => {
    const colors = {
      'Active': 'bg-green-100 text-green-800',
      'Planning': 'bg-blue-100 text-blue-800',
      'Completed': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Sprint Management</h1>
          <p className="text-gray-400 mt-2">Create and manage development sprints</p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Create Sprint</span>
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-300">Loading sprints...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-400">Error: {error}</div>
      ) : sprints.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No sprints found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sprints.map((sprint) => (
          <div key={sprint.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-white">{sprint.name}</h3>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(sprint.status)}`}>
                {sprint.status}
              </span>
            </div>
            
            <div className="space-y-3 mb-4">
              <div className="flex items-center text-sm text-gray-300">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {sprint.startDate} - {sprint.endDate}
              </div>
              
              <div className="text-sm text-gray-300">
                Stories: {sprint.stories?.length || 0}
              </div>
              
              <div>
                <div className="flex justify-between text-sm text-gray-300 mb-1">
                  <span>Progress</span>
                  <span>{sprint.progress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ width: `${sprint.progress}%`, backgroundColor: '#ffc44d' }}
                  ></div>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => handleViewSprint(sprint)}
              className="w-full text-black font-semibold py-2 px-4 rounded-lg transition-colors hover:opacity-90"
              style={{ backgroundColor: '#ffc44d' }}
            >
              View Details
            </button>
          </div>
          ))}
        </div>
      )}

      <AddSprintModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddSprint}
      />
    </div>
  );
};

export default SprintManagement;