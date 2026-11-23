import React, { useEffect, useMemo, useState } from 'react';
import { ChatAlt2Icon, ChevronUpIcon, LightBulbIcon, PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/outline';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import CommentsSection from '../../components/common/CommentsSection';
import apiService from '../../services/api';
import { formatDateTime } from '../../components/common/StoryHistory';

export const IDEA_CATEGORIES = [
  { value: 'PRODUCT', label: 'Product' },
  { value: 'PROCESS', label: 'Process' },
  { value: 'TECHNICAL', label: 'Technical' },
  { value: 'CULTURE', label: 'Culture' },
  { value: 'OTHER', label: 'Other' },
];

export const IDEA_STATUSES = [
  { value: 'NEW', label: 'New', style: 'bg-gray-600 text-gray-100' },
  { value: 'UNDER_REVIEW', label: 'Under review', style: 'bg-blue-700 text-blue-100' },
  { value: 'PLANNED', label: 'Planned', style: 'bg-purple-700 text-purple-100' },
  { value: 'IMPLEMENTED', label: 'Implemented', style: 'bg-green-700 text-green-100' },
  { value: 'DECLINED', label: 'Declined', style: 'bg-red-800 text-red-100' },
];

const statusInfo = (value) => IDEA_STATUSES.find(s => s.value === value) || IDEA_STATUSES[0];
const categoryLabel = (value) => (IDEA_CATEGORIES.find(c => c.value === value) || {}).label || value;

const fieldClass = 'w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent';
const ring = { '--tw-ring-color': '#ffc44d' };

/** Create or edit an idea. */
const IdeaFormModal = ({ idea, onClose, onSaved }) => {
  const [form, setForm] = useState({
    title: idea?.title || '',
    description: idea?.description || '',
    category: idea?.category || 'PRODUCT',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Give your idea a title');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const saved = idea ? await apiService.updateIdea(idea.id, form) : await apiService.createIdea(form);
      onSaved(saved);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={idea ? 'Edit idea' : 'Share an idea'} size="lg">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input
          label="Title"
          name="title"
          value={form.title}
          maxLength={150}
          onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="A short summary of the idea"
          required
          autoFocus
        />
        <div>
          <label htmlFor="idea-category" className="block text-sm font-medium text-gray-300 mb-1">Category</label>
          <select
            id="idea-category"
            value={form.category}
            onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
            className={fieldClass}
            style={ring}
          >
            {IDEA_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="idea-description" className="block text-sm font-medium text-gray-300 mb-1">Details</label>
          <textarea
            id="idea-description"
            rows={6}
            maxLength={5000}
            value={form.description}
            onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
            className={fieldClass}
            style={ring}
            placeholder="What problem does it solve? How might it work?"
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving...' : idea ? 'Save changes' : 'Post idea'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

/** Admin sets the review status and an optional reply to the author. */
const IdeaStatusModal = ({ idea, onClose, onSaved }) => {
  const [status, setStatus] = useState(idea.status);
  const [note, setNote] = useState(idea.adminNote || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      onSaved(await apiService.setIdeaStatus(idea.id, status, note));
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Update status" size="sm">
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-gray-300 truncate" title={idea.title}>{idea.title}</p>
        <div>
          <label htmlFor="idea-status" className="block text-sm font-medium text-gray-300 mb-1">Status</label>
          <select id="idea-status" value={status} onChange={(e) => setStatus(e.target.value)} className={fieldClass} style={ring}>
            {IDEA_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="idea-note" className="block text-sm font-medium text-gray-300 mb-1">Reply to the author (optional)</label>
          <textarea
            id="idea-note"
            rows={3}
            maxLength={500}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={fieldClass}
            style={ring}
            placeholder={status === 'DECLINED' ? 'Why it is not going ahead' : 'Next steps, timeline...'}
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </div>
      </form>
    </Modal>
  );
};

const IdeaCard = ({ idea, isAdmin, busy, onVote, onEdit, onDelete, onStatus }) => {
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(idea.commentCount || 0);
  const status = statusInfo(idea.status);
  const long = (idea.description || '').length > 280;

  return (
    <li className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex gap-4">
      {/* Vote */}
      <button
        type="button"
        onClick={() => onVote(idea)}
        disabled={idea.mine || busy}
        title={idea.mine ? "You can't vote for your own idea" : idea.votedByMe ? 'Remove your vote' : 'Upvote'}
        aria-pressed={idea.votedByMe}
        aria-label={`${idea.votedByMe ? 'Remove vote from' : 'Upvote'} ${idea.title}, ${idea.voteCount} votes`}
        className={`flex flex-col items-center justify-center w-14 h-16 flex-shrink-0 rounded-lg border transition-colors disabled:cursor-not-allowed ${
          idea.votedByMe ? 'border-transparent text-black' : 'border-gray-600 text-gray-300 hover:border-gray-400 hover:text-white disabled:hover:border-gray-600 disabled:hover:text-gray-300'
        }`}
        style={idea.votedByMe ? { backgroundColor: '#ffc44d' } : {}}
      >
        <ChevronUpIcon className="h-5 w-5" />
        <span className="text-sm font-bold">{idea.voteCount}</span>
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-white break-words">{idea.title}</h3>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.style}`}>{status.label}</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">{categoryLabel(idea.category)}</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {idea.mine ? 'You' : idea.authorName} · {formatDateTime(idea.createdAt)}
        </p>

        {idea.description && (
          <div className="mt-2">
            <p className="text-sm text-gray-300 whitespace-pre-line break-words">
              {!expanded && long ? `${idea.description.slice(0, 280)}…` : idea.description}
            </p>
            {long && (
              <button type="button" onClick={() => setExpanded(x => !x)} className="text-xs mt-1 hover:underline" style={{ color: '#ffc44d' }}>
                {expanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        )}

        {idea.adminNote && (
          <div className="mt-3 border-l-2 pl-3 text-sm" style={{ borderColor: '#ffc44d' }}>
            <span className="text-gray-400">{idea.statusChangedByName || 'Admin'} replied: </span>
            <span className="text-gray-200 whitespace-pre-line break-words">{idea.adminNote}</span>
          </div>
        )}

        {/* Actions row: Comments toggle + Status / Edit / Delete */}
        <div className="flex flex-wrap items-center gap-3 mt-3 text-sm">
          <button
            type="button"
            onClick={() => setShowComments(s => !s)}
            className={`inline-flex items-center text-sm font-medium transition-colors ${
              showComments ? 'text-yellow-400' : 'text-gray-300 hover:text-white'
            }`}
            title="Comments and discussions on this idea"
          >
            <ChatAlt2Icon className="h-4 w-4 mr-1.5" />
            Comments {commentCount > 0 ? `(${commentCount})` : ''}
          </button>

          {isAdmin && (
            <button type="button" onClick={() => onStatus(idea)} className="font-medium hover:underline" style={{ color: '#ffc44d' }}>
              Update status
            </button>
          )}
          {idea.canEdit && (
            <button type="button" onClick={() => onEdit(idea)} className="inline-flex items-center text-gray-300 hover:text-white">
              <PencilIcon className="h-4 w-4 mr-1" /> Edit
            </button>
          )}
          {idea.canDelete && (
            <button type="button" onClick={() => onDelete(idea)} disabled={busy} className="inline-flex items-center text-gray-300 hover:text-red-400 disabled:opacity-50">
              <TrashIcon className="h-4 w-4 mr-1" /> Delete
            </button>
          )}
        </div>

        {/* Expandable Comments Section */}
        {showComments && (
          <div className="mt-4 pt-3 border-t border-gray-700">
            <CommentsSection
              ideaId={idea.id}
              compact
              onCountChange={setCommentCount}
            />
          </div>
        )}
      </div>
    </li>
  );
};

/**
 * Idea board: anyone can post ideas and upvote others'; admins move them through review.
 */
const IdeasPage = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('top');
  const [search, setSearch] = useState('');
  const [mineOnly, setMineOnly] = useState(false);
  const [editing, setEditing] = useState(null); // null | 'new' | idea
  const [statusEditing, setStatusEditing] = useState(null);

  useEffect(() => {
    let cancelled = false;
    apiService.getIdeas()
      .then(data => { if (!cancelled) setIdeas(Array.isArray(data) ? data : []); })
      .catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const replace = (updated) => setIdeas(list => {
    const exists = list.some(i => i.id === updated.id);
    return exists ? list.map(i => (i.id === updated.id ? updated : i)) : [updated, ...list];
  });

  const counts = useMemo(() => {
    const c = { ALL: ideas.length };
    IDEA_STATUSES.forEach(s => { c[s.value] = 0; });
    ideas.forEach(i => { c[i.status] = (c[i.status] || 0) + 1; });
    return c;
  }, [ideas]);

  const visible = useMemo(() => {
    const words = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const list = ideas.filter(i =>
      (statusFilter === 'ALL' || i.status === statusFilter) &&
      (!category || i.category === category) &&
      (!mineOnly || i.mine) &&
      words.every(w => `${i.title} ${i.description || ''} ${i.authorName || ''}`.toLowerCase().includes(w))
    );
    return [...list].sort((a, b) => (sort === 'top' && b.voteCount !== a.voteCount)
      ? b.voteCount - a.voteCount
      : new Date(b.createdAt) - new Date(a.createdAt));
  }, [ideas, statusFilter, category, mineOnly, search, sort]);

  const run = async (idea, action) => {
    setBusyId(idea.id);
    setActionError('');
    try {
      await action();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const vote = (idea) => run(idea, async () => replace(await apiService.toggleIdeaVote(idea.id)));

  const remove = (idea) => {
    if (!window.confirm(`Delete "${idea.title}"? Its votes will be removed too. This can't be undone.`)) return;
    run(idea, async () => {
      await apiService.deleteIdea(idea.id);
      setIdeas(list => list.filter(i => i.id !== idea.id));
    });
  };

  const filtersActive = statusFilter !== 'ALL' || category || mineOnly || search.trim();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Ideas</h1>
          <p className="text-gray-300">Suggest improvements and vote for the ones you want to see</p>
        </div>
        <Button variant="primary" onClick={() => setEditing('new')} className="flex items-center">
          <PlusIcon className="h-4 w-4 mr-2" />
          Share an idea
        </Button>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="p-4 border-b border-gray-700 flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
          {[{ value: 'ALL', label: 'All' }, ...IDEA_STATUSES].map(s => (
            <button
              key={s.value}
              type="button"
              role="tab"
              aria-selected={statusFilter === s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === s.value ? 'text-black' : 'text-gray-300 bg-gray-700 hover:bg-gray-600 hover:text-white'
              }`}
              style={statusFilter === s.value ? { backgroundColor: '#ffc44d' } : {}}
            >
              {s.label} <span className="opacity-70">({counts[s.value] || 0})</span>
            </button>
          ))}
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ideas..."
            aria-label="Search ideas"
            className={`${fieldClass} md:col-span-2`}
            style={ring}
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={fieldClass} style={ring} aria-label="Category">
            <option value="">All categories</option>
            {IDEA_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <div className="flex items-center justify-between gap-3">
            <select value={sort} onChange={(e) => setSort(e.target.value)} className={fieldClass} style={ring} aria-label="Sort">
              <option value="top">Most votes</option>
              <option value="new">Newest</option>
            </select>
            <label className="flex items-center text-sm text-gray-300 whitespace-nowrap cursor-pointer">
              <input type="checkbox" checked={mineOnly} onChange={(e) => setMineOnly(e.target.checked)} className="mr-2 rounded" />
              Mine
            </label>
          </div>
        </div>
      </div>

      {actionError && <p className="text-sm text-red-400" role="alert">{actionError}</p>}

      {loading ? (
        <div className="text-center py-12 text-gray-300">Loading ideas...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-400">Error: {error}</div>
      ) : visible.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 border border-gray-700 rounded-lg">
          <LightBulbIcon className="h-10 w-10 mx-auto mb-3" style={{ color: '#ffc44d' }} />
          <p className="text-gray-300">
            {filtersActive ? 'No ideas match these filters.' : 'No ideas yet. Be the first to share one.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map(idea => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              isAdmin={isAdmin}
              busy={busyId === idea.id}
              onVote={vote}
              onEdit={setEditing}
              onDelete={remove}
              onStatus={setStatusEditing}
            />
          ))}
        </ul>
      )}

      {editing && (
        <IdeaFormModal
          idea={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(saved) => { replace(saved); setEditing(null); }}
        />
      )}
      {statusEditing && (
        <IdeaStatusModal
          idea={statusEditing}
          onClose={() => setStatusEditing(null)}
          onSaved={(saved) => { replace(saved); setStatusEditing(null); }}
        />
      )}
    </div>
  );
};

export default IdeasPage;
