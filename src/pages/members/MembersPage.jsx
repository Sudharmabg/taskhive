import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PencilIcon, UserAddIcon, UsersIcon } from '@heroicons/react/outline';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import JobRoleField, { jobRoleLabel } from '../../components/common/JobRoleField';
import AddTeamMemberModal from '../../components/modals/AddTeamMemberModal';
import apiService from '../../services/api';

const fieldClass = 'w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent';
const ring = { '--tw-ring-color': '#ffc44d' };
const thClass = 'px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider';

/** Admin edit of a member's profile and team. */
const EditMemberModal = ({ member, teams, onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: member.name || '',
    email: member.email || '',
    designation: member.designation || '',
    jobRole: member.jobRole || '',
    teamId: member.teamId ?? '',
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = 'Name is required';
    else if (form.name.includes(',')) next.name = "Name can't contain a comma";
    if (!form.email.trim()) next.email = 'Email is required';
    if (!form.jobRole.trim()) next.jobRole = 'Please select or type a job role';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    setError('');
    try {
      await apiService.updateUser(member.id, {
        name: form.name.trim(),
        email: form.email.trim(),
        designation: form.designation.trim(),
        jobRole: form.jobRole.trim(),
        teamId: form.teamId === '' ? null : Number(form.teamId),
      });
      onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const renamed = form.name.trim() && form.name.trim() !== member.name;

  return (
    <Modal isOpen onClose={onClose} title={`Edit ${member.name}`} size="md">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input label="Full Name" name="name" value={form.name} maxLength={100} onChange={(e) => set('name', e.target.value)} error={errors.name} required />
            {renamed && <p className="mt-1 text-xs text-gray-400">Their name is updated on every story they're assigned to.</p>}
          </div>
          <Input label="Email" name="email" type="email" value={form.email} maxLength={100} onChange={(e) => set('email', e.target.value)} error={errors.email} required />
          <Input label="Designation" name="designation" value={form.designation} maxLength={100} onChange={(e) => set('designation', e.target.value)} />
          <JobRoleField id="edit-member-job-role" value={form.jobRole} onChange={(v) => set('jobRole', v)} error={errors.jobRole} />
        </div>
        <div>
          <label htmlFor="edit-member-team" className="block text-sm font-medium text-gray-300 mb-1">Team</label>
          <select id="edit-member-team" value={form.teamId} onChange={(e) => set('teamId', e.target.value)} className={fieldClass} style={ring}>
            <option value="">No team</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <p className="mt-1 text-xs text-gray-400">Members see the stories of their own team.</p>
        </div>
        <p className="text-xs text-gray-400">Employee ID {member.employeeId || '—'} can't be changed.</p>
        {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</Button>
        </div>
      </form>
    </Modal>
  );
};

/**
 * Member list. Everyone can see their team's members; admins see the whole company
 * and are the only ones who can add or edit members.
 */
const MembersPage = () => {
  const [members, setMembers] = useState([]);
  const [canEdit, setCanEdit] = useState(false);
  const [myTeamId, setMyTeamId] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await apiService.getMemberDirectory();
      setMembers(data.members || []);
      setCanEdit(Boolean(data.canEdit));
      setMyTeamId(data.myTeamId ?? null);
      if (data.canEdit) {
        const t = await apiService.getTeams();
        setTeams(Array.isArray(t) ? t : []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => {
    const words = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return members.filter(m =>
      (!teamFilter || (teamFilter === 'none' ? m.teamId == null : String(m.teamId) === teamFilter)) &&
      words.every(w => `${m.name} ${m.email} ${m.employeeId || ''} ${m.designation || ''} ${jobRoleLabel(m.jobRole)} ${m.teamName || ''}`
        .toLowerCase().includes(w))
    );
  }, [members, search, teamFilter]);

  const myTeamName = members.find(m => m.isMe)?.teamName;

  const addMember = async (data) => {
    try {
      await apiService.createUser(data);
      setAdding(false);
      setNotice(`${data.name} was added. Share their password with them so they can sign in.`);
      await load();
    } catch (err) {
      setNotice('');
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Members</h1>
          <p className="text-gray-300">
            {canEdit
              ? 'Everyone in your company. Only admins can add or edit members.'
              : myTeamId
                ? `Members of your team${myTeamName ? `, ${myTeamName}` : ''}`
                : "You're not in a team yet. Ask an admin to add you to one."}
          </p>
        </div>
        {canEdit && (
          <Button variant="primary" onClick={() => setAdding(true)} className="flex items-center">
            <UserAddIcon className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        )}
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, ID, role..."
          aria-label="Search members"
          className={`${fieldClass} ${canEdit ? 'md:col-span-2' : 'md:col-span-3'}`}
          style={ring}
        />
        {canEdit && (
          <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} className={fieldClass} style={ring} aria-label="Filter by team">
            <option value="">All teams</option>
            {teams.map(t => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
            <option value="none">No team</option>
          </select>
        )}
      </div>

      {notice && <p className="text-sm text-green-400" role="status">{notice}</p>}

      {loading ? (
        <div className="text-center py-12 text-gray-300">Loading members...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-400">Error: {error}</div>
      ) : visible.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 border border-gray-700 rounded-lg">
          <UsersIcon className="h-10 w-10 mx-auto mb-3" style={{ color: '#ffc44d' }} />
          <p className="text-gray-300">{members.length ? 'No members match these filters.' : 'No members yet.'}</p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className={thClass}>Name</th>
                <th className={thClass}>Employee ID</th>
                <th className={thClass}>Designation</th>
                <th className={thClass}>Job Role</th>
                <th className={thClass}>Team</th>
                {canEdit && <th className={thClass}><span className="sr-only">Actions</span></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {visible.map(m => (
                <tr key={m.id} className="hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                      {m.name}
                      {m.isMe && <span className="text-xs text-gray-400">(you)</span>}
                      {m.role === 'ADMIN' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase text-black" style={{ backgroundColor: '#ffc44d' }}>Admin</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">{m.email}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-200 whitespace-nowrap">{m.employeeId || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-200">{m.designation || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-200 whitespace-nowrap">{jobRoleLabel(m.jobRole)}</td>
                  <td className="px-4 py-3 text-sm text-gray-200 whitespace-nowrap">{m.teamName || <span className="text-gray-500">No team</span>}</td>
                  {canEdit && (
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={() => setEditing(m)} className="inline-flex items-center text-sm text-gray-300 hover:text-white" aria-label={`Edit ${m.name}`}>
                        <PencilIcon className="h-4 w-4 mr-1" /> Edit
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <EditMemberModal
          member={editing}
          teams={teams}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            setNotice('');
            await load();
          }}
        />
      )}
      {adding && (
        <AddTeamMemberModal isOpen onClose={() => setAdding(false)} onSubmit={addMember} teams={teams} />
      )}
    </div>
  );
};

export default MembersPage;
