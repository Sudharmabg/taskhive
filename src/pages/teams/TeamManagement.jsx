import React, { useState, useEffect } from 'react';
import Button from '../../components/common/Button';
import TeamCard from '../../components/common/TeamCard';
import AddTeamModal from '../../components/modals/AddTeamModal';
import AddTeamMemberModal from '../../components/modals/AddTeamMemberModal';
import SuccessModal from '../../components/modals/SuccessModal';
import ConfirmationModal from '../../components/modals/ConfirmationModal';
import apiService from '../../services/api';
import { PlusIcon, UserAddIcon } from '@heroicons/react/outline';

/**
 * Team Management page component
 * Handles team listing and CRUD operations
 */
const TeamManagement = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [deletingTeam, setDeletingTeam] = useState(null);
  
  useEffect(() => {
    fetchTeams();
  }, []);
  
  const fetchTeams = async () => {
    try {
      setLoading(true);
      const data = await apiService.getTeams();
      setTeams(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeam = async (teamData) => {
    try {
      const newTeam = await apiService.createTeam(teamData);
      
      // If team has members, assign them to the team
      if (teamData.members && teamData.members.length > 0) {
        await apiService.updateTeamMembers(newTeam.id, teamData.members);
      }
      
      // Refresh teams to show updated data
      await fetchTeams();
      setShowAddModal(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditTeam = (teamId) => {
    const team = teams.find(t => t.id === teamId);
    setEditingTeam(team);
    setShowAddModal(true);
  };

  const handleUpdateTeam = async (teamData) => {
    try {
      // Update team basic info (name, description)
      await apiService.updateTeam(editingTeam.id, {
        name: teamData.name,
        description: teamData.description
      });
      
      // Update team member assignments
      await apiService.updateTeamMembers(editingTeam.id, teamData.members);
      
      // Refresh teams to show updated data
      await fetchTeams();
      
      setShowAddModal(false);
      setEditingTeam(null);
    } catch (err) {
      setError(err.message);
      console.error('Failed to update team:', err);
    }
  };

  const handleDeleteTeam = (teamId) => {
    const team = teams.find(t => t.id === teamId);
    setDeletingTeam(team);
    setShowDeleteModal(true);
  };

  const confirmDeleteTeam = async () => {
    try {
      await apiService.deleteTeam(deletingTeam.id);
      setTeams(teams.filter(team => team.id !== deletingTeam.id));
      setDeletingTeam(null);
    } catch (err) {
      setError(err.message);
      console.error('Failed to delete team:', err);
    }
  };

  const handleAddMember = async (memberData) => {
    try {
      await apiService.createUser(memberData);
      setShowAddMemberModal(false);
      setShowSuccessModal(true);
      // Refresh teams to show updated member count
      fetchTeams();
    } catch (err) {
      setError(err.message);
      console.error('Failed to add member:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Team Management</h1>
          <p className="text-gray-300">Manage your teams and members</p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="primary"
            onClick={() => setShowAddModal(true)}
            className="flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Team
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowAddMemberModal(true)}
            className="flex items-center"
          >
            <UserAddIcon className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </div>
      </div>

      {/* Teams Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-300">Loading teams...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-400">Error: {error}</div>
      ) : teams.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No teams found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              onEdit={() => handleEditTeam(team.id)}
              onDelete={() => handleDeleteTeam(team.id)}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Team Modal */}
      {showAddModal && (
        <AddTeamModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setEditingTeam(null);
          }}
          onSubmit={editingTeam ? handleUpdateTeam : handleAddTeam}
          team={editingTeam}
        />
      )}

      {/* Add Team Member Modal */}
      {showAddMemberModal && (
        <AddTeamMemberModal
          isOpen={showAddMemberModal}
          onClose={() => setShowAddMemberModal(false)}
          onSubmit={handleAddMember}
          teams={teams}
        />
      )}

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Member Added Successfully"
        message="Sent an email with login details to the new member"
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingTeam(null);
        }}
        onConfirm={confirmDeleteTeam}
        title="Delete Team"
        message={`Are you sure you want to delete "${deletingTeam?.name}"? This will remove all team members from the team. This action cannot be undone.`}
        confirmText="Delete Team"
        variant="danger"
      />
    </div>
  );
};

export default TeamManagement;