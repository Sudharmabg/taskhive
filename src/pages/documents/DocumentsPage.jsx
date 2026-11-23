import React, { useEffect, useMemo, useState } from 'react';
import {
  DocumentTextIcon, DownloadIcon, PencilIcon, PlusIcon, TagIcon, TrashIcon, XIcon,
} from '@heroicons/react/outline';
import Button from '../../components/common/Button';
import apiService from '../../services/api';
import { formatDateTime } from '../../components/common/StoryHistory';
import { formatFileSize } from '../../components/common/AttachmentsSection';
import DocumentEditorModal from './DocumentEditorModal';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 30;

const fieldClass = 'w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent';
const ring = { '--tw-ring-color': '#ffc44d' };

/** Same rules as the backend: lower case, single spaces, no leading #. */
const normalizeTag = (raw) => raw.trim().replace(/\s+/g, ' ').replace(/^#\s*/, '').toLowerCase();

const stripExtension = (name) => {
  const dot = name.lastIndexOf('.');
  return (dot > 0 ? name.slice(0, dot) : name).slice(0, 150);
};

/**
 * Chip-style tag entry. Enter or comma adds a tag, Backspace on an empty field removes the last one.
 * Suggests tags already used in the company.
 */
const TagInput = ({ id, tags, onChange, suggestions = [] }) => {
  const [draft, setDraft] = useState('');
  const [hint, setHint] = useState('');

  const add = (raw) => {
    const parts = raw.split(',').map(normalizeTag).filter(Boolean);
    if (!parts.length) return;
    const next = [...tags];
    for (const tag of parts) {
      if (tag.length > MAX_TAG_LENGTH) { setHint(`Tags can be at most ${MAX_TAG_LENGTH} characters`); return; }
      if (!/^[\p{L}\p{N} ._-]+$/u.test(tag)) { setHint('Use letters, numbers, spaces, dots, dashes or underscores'); return; }
      if (!next.includes(tag)) next.push(tag);
    }
    if (next.length > MAX_TAGS) { setHint(`A document can have at most ${MAX_TAGS} tags`); return; }
    setHint('');
    onChange(next);
    setDraft('');
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(draft);
    } else if (e.key === 'Backspace' && !draft && tags.length) {
      onChange(tags.slice(0, -1));
    }
  };

  const unused = suggestions.filter(s => !tags.includes(s));

  return (
    <div>
      <div
        className="flex flex-wrap items-center gap-2 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-lg focus-within:ring-2"
        style={ring}
      >
        {tags.map(tag => (
          <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-black" style={{ backgroundColor: '#ffc44d' }}>
            {tag}
            <button type="button" onClick={() => onChange(tags.filter(t => t !== tag))} className="ml-1 hover:opacity-70" aria-label={`Remove tag ${tag}`}>
              <XIcon className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          type="text"
          value={draft}
          list={`${id}-suggestions`}
          onChange={(e) => {
            // Picking a suggestion from the datalist fills the whole value at once
            const value = e.target.value;
            if (value.endsWith(',')) add(value); else setDraft(value);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => draft.trim() && add(draft)}
          placeholder={tags.length ? '' : 'e.g. policy, onboarding, invoice'}
          className="flex-1 min-w-[8rem] bg-transparent text-white placeholder-gray-400 text-sm py-0.5 focus:outline-none"
        />
        <datalist id={`${id}-suggestions`}>
          {unused.map(s => <option key={s} value={s} />)}
        </datalist>
      </div>
      <p className={`text-xs mt-1 ${hint ? 'text-red-400' : 'text-gray-400'}`}>
        {hint || 'Press Enter or comma to add a tag'}
      </p>
    </div>
  );
};

/**
 * Company document library: create rich-text documents, tag them, and find them again by tag or search.
 */
const DocumentsPage = () => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [mineOnly, setMineOnly] = useState(false);
  const [sort, setSort] = useState('new');
  const [activeDocForEditor, setActiveDocForEditor] = useState(null);

  const openDocEditor = async (doc) => {
    try {
      const full = await apiService.getDocument(doc.id);
      setActiveDocForEditor(full);
    } catch {
      setActiveDocForEditor(doc);
    }
  };

  useEffect(() => {
    let cancelled = false;
    apiService.getDocuments()
      .then(data => { if (!cancelled) setDocs(Array.isArray(data) ? data : []); })
      .catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Tag counts across all documents, most used first
  const tagCounts = useMemo(() => {
    const counts = new Map();
    docs.forEach(d => (d.tags || []).forEach(t => counts.set(t, (counts.get(t) || 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [docs]);
  const tagSuggestions = useMemo(() => tagCounts.map(([t]) => t), [tagCounts]);

  // Drop selected tags that no document uses any more (after an edit or delete)
  useEffect(() => {
    setSelectedTags(sel => sel.filter(t => tagSuggestions.includes(t)));
  }, [tagSuggestions]);

  const visible = useMemo(() => {
    const words = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const list = docs.filter(d =>
      (!mineOnly || d.mine) &&
      selectedTags.every(t => (d.tags || []).includes(t)) &&
      words.every(w => `${d.title} ${d.description || ''} ${d.fileName} ${d.uploadedByName || ''} ${(d.tags || []).join(' ')}`
        .toLowerCase().includes(w))
    );
    const sorted = [...list];
    if (sort === 'title') sorted.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === 'size') sorted.sort((a, b) => b.fileSize - a.fileSize);
    else sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return sorted;
  }, [docs, search, selectedTags, mineOnly, sort]);

  const toggleTag = (tag) => setSelectedTags(sel => (sel.includes(tag) ? sel.filter(t => t !== tag) : [...sel, tag]));

  const run = async (doc, action) => {
    setBusyId(doc.id);
    setActionError('');
    try {
      await action();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const download = (doc) => run(doc, () => apiService.downloadDocument(doc));

  const remove = (doc) => {
    if (!window.confirm(`Delete "${doc.title}"? The file will be removed for everyone. This can't be undone.`)) return;
    run(doc, async () => {
      await apiService.deleteDocument(doc.id);
      setDocs(list => list.filter(d => d.id !== doc.id));
    });
  };

  const filtersActive = search.trim() || selectedTags.length || mineOnly;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Documents</h1>
          <p className="text-gray-300">Create, edit, collaborate, and share documents with your team</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={() => setActiveDocForEditor({ title: '', content: '<p>Start typing your document here...</p>', tags: [] })}
            className="flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            New document
          </Button>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, file name, uploader or tag..."
            aria-label="Search documents"
            className={`${fieldClass} md:col-span-2`}
            style={ring}
          />
          <select value={sort} onChange={(e) => setSort(e.target.value)} className={fieldClass} style={ring} aria-label="Sort">
            <option value="new">Newest first</option>
            <option value="title">Title A–Z</option>
            <option value="size">Largest first</option>
          </select>
          <label className="flex items-center text-sm text-gray-300 cursor-pointer">
            <input type="checkbox" checked={mineOnly} onChange={(e) => setMineOnly(e.target.checked)} className="mr-2 rounded" />
            Uploaded by me
          </label>
        </div>
        {tagCounts.length > 0 && (
          <div className="px-4 pb-4 flex flex-wrap items-center gap-2" aria-label="Filter by tag">
            <TagIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
            {tagCounts.map(([tag, count]) => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  aria-pressed={active}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    active ? 'text-black' : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                  }`}
                  style={active ? { backgroundColor: '#ffc44d' } : {}}
                >
                  {tag} <span className="opacity-70">({count})</span>
                </button>
              );
            })}
            {selectedTags.length > 0 && (
              <button type="button" onClick={() => setSelectedTags([])} className="text-xs text-gray-400 hover:text-white hover:underline">
                Clear tags
              </button>
            )}
          </div>
        )}
      </div>

      {actionError && <p className="text-sm text-red-400" role="alert">{actionError}</p>}

      {loading ? (
        <div className="text-center py-12 text-gray-300">Loading documents...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-400">Error: {error}</div>
      ) : visible.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 border border-gray-700 rounded-lg">
          <DocumentTextIcon className="h-10 w-10 mx-auto mb-3" style={{ color: '#ffc44d' }} />
          <p className="text-gray-300">
            {filtersActive ? 'No documents match these filters.' : 'No documents yet. Create the first one.'}
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400">
            Showing {visible.length} of {docs.length} document{docs.length === 1 ? '' : 's'}
            {selectedTags.length > 0 && ` tagged ${selectedTags.join(' + ')}`}
          </p>
          <ul className="space-y-3">
            {visible.map(doc => (
              <li key={doc.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex gap-4">
                <div className="p-2 rounded-lg h-fit flex-shrink-0" style={{ backgroundColor: '#ffc44d20' }}>
                  <DocumentTextIcon className="h-6 w-6" style={{ color: '#ffc44d' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3
                        onClick={() => openDocEditor(doc)}
                        className="text-base font-semibold text-white break-words cursor-pointer hover:underline hover:text-amber-300 transition-colors"
                        title="Click to open and edit document"
                      >
                        {doc.title}
                      </h3>
                      {doc.fileName ? (
                        <p className="text-xs text-gray-400 truncate" title={doc.fileName}>
                          {doc.title ? `${doc.title}.docx` : doc.fileName} {doc.fileSize ? `· ${formatFileSize(doc.fileSize)}` : ''}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400">
                          {doc.title ? `${doc.title}.docx` : 'Document.docx'}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm flex-shrink-0">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => openDocEditor(doc)}
                        className="text-xs font-semibold"
                      >
                        <PencilIcon className="h-3.5 w-3.5 mr-1.5" /> Open & Edit
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => download(doc)}
                        disabled={busyId === doc.id}
                        className="text-xs"
                      >
                        <DownloadIcon className="h-3.5 w-3.5 mr-1.5" /> Download
                      </Button>
                      {doc.canManage && (
                        <button
                          type="button"
                          onClick={() => remove(doc)}
                          disabled={busyId === doc.id}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-700 transition-colors disabled:opacity-50"
                          title="Delete document"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {doc.description && (
                    <p className="text-sm text-gray-300 mt-2 whitespace-pre-line break-words">{doc.description}</p>
                  )}

                  {doc.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {doc.tags.map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          title={selectedTags.includes(tag) ? `Stop filtering by ${tag}` : `Show documents tagged ${tag}`}
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            selectedTags.includes(tag) ? 'text-black' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                          style={selectedTags.includes(tag) ? { backgroundColor: '#ffc44d' } : {}}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  )}

                  {(() => {
                    const currentUser = apiService.getCurrentUser() || {};
                    const currentUserName = currentUser.name || '';
                    const isCreator = doc.mine || (currentUserName && doc.uploadedByName === currentUserName);
                    const isEditor = currentUserName && doc.updatedByName === currentUserName;

                    const creatorLabel = isCreator ? 'you' : (doc.uploadedByName || 'Unknown');
                    const editorLabel = isEditor ? 'you' : doc.updatedByName;

                    return (
                      <p className="text-xs text-gray-400 mt-2">
                        Created by {creatorLabel} · {formatDateTime(doc.createdAt)}
                        {doc.updatedByName && ` · Edited by ${editorLabel}${doc.updatedAt ? ` · ${formatDateTime(doc.updatedAt)}` : ''}`}
                      </p>
                    );
                  })()}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {activeDocForEditor && (
        <DocumentEditorModal
          doc={activeDocForEditor}
          tagSuggestions={tagSuggestions}
          onClose={() => setActiveDocForEditor(null)}
          onSaved={(saved) => {
            setDocs(list => {
              const exists = list.some(d => d.id === saved.id);
              return exists ? list.map(d => (d.id === saved.id ? saved : d)) : [saved, ...list];
            });
            setActiveDocForEditor(saved);
          }}
        />
      )}
    </div>
  );
};

export default DocumentsPage;
