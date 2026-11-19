import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CloudUploadIcon, DocumentTextIcon, DownloadIcon, PencilIcon, TagIcon, TrashIcon, XIcon,
} from '@heroicons/react/outline';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import apiService from '../../services/api';
import { formatDateTime } from '../../components/common/StoryHistory';
import { formatFileSize } from '../../components/common/AttachmentsSection';

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

/** Upload one or more files; every file becomes its own document with the same tags. */
const UploadModal = ({ tagSuggestions, onClose, onUploaded }) => {
  const [files, setFiles] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState([]);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(null); // { done, total }
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const pick = (list) => {
    const chosen = Array.from(list || []);
    const tooBig = chosen.filter(f => f.size > MAX_FILE_SIZE);
    if (tooBig.length) {
      setError(`${tooBig.map(f => f.name).join(', ')} ${tooBig.length > 1 ? 'are' : 'is'} over the 10 MB limit`);
    } else {
      setError('');
    }
    const ok = chosen.filter(f => f.size <= MAX_FILE_SIZE);
    setFiles(ok);
    if (ok.length === 1 && !title) setTitle(stripExtension(ok[0].name));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!files.length) { setError('Choose a file to upload'); return; }
    const single = files.length === 1;
    if (single && !title.trim()) { setError('Give the document a title'); return; }

    setError('');
    setProgress({ done: 0, total: files.length });
    const uploaded = [];
    const failed = [];
    for (const file of files) {
      try {
        uploaded.push(await apiService.uploadDocument(file, {
          title: single ? title.trim() : stripExtension(file.name),
          description: description.trim(),
          tags,
        }));
      } catch (err) {
        failed.push(`${file.name}: ${err.message}`);
      }
      setProgress(p => ({ ...p, done: p.done + 1 }));
    }
    if (uploaded.length) onUploaded(uploaded);
    if (failed.length) {
      setError(`Some files were not uploaded. ${failed.join('; ')}`);
      setFiles(files.filter(f => failed.some(msg => msg.startsWith(`${f.name}:`))));
      setProgress(null);
    } else {
      onClose();
    }
  };

  const busy = progress !== null;

  return (
    <Modal isOpen onClose={busy ? () => {} : onClose} title="Upload documents" size="lg">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files); }}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${dragging ? 'bg-gray-700' : 'border-gray-600'}`}
          style={dragging ? { borderColor: '#ffc44d' } : {}}
        >
          <CloudUploadIcon className="h-10 w-10 mx-auto text-gray-400" />
          <p className="mt-2 text-sm text-gray-300">
            Drag files here or{' '}
            <button type="button" onClick={() => inputRef.current?.click()} className="font-medium hover:underline" style={{ color: '#ffc44d' }}>
              browse
            </button>
          </p>
          <p className="text-xs text-gray-400 mt-1">Up to 10 MB per file</p>
          <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => { pick(e.target.files); e.target.value = ''; }} />
        </div>

        {files.length > 0 && (
          <ul className="text-sm text-gray-300 space-y-1">
            {files.map(f => (
              <li key={`${f.name}-${f.size}`} className="flex items-center justify-between gap-2">
                <span className="truncate" title={f.name}>{f.name}</span>
                <span className="flex items-center gap-2 text-gray-400 flex-shrink-0">
                  {formatFileSize(f.size)}
                  {!busy && (
                    <button type="button" onClick={() => setFiles(list => list.filter(x => x !== f))} aria-label={`Remove ${f.name}`} className="hover:text-white">
                      <XIcon className="h-4 w-4" />
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}

        {files.length <= 1 ? (
          <Input
            label="Title"
            name="title"
            value={title}
            maxLength={150}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Defaults to the file name"
            required
          />
        ) : (
          <p className="text-xs text-gray-400">Each file is saved as its own document, titled after its file name.</p>
        )}

        <div>
          <label htmlFor="doc-description" className="block text-sm font-medium text-gray-300 mb-1">Description (optional)</label>
          <textarea
            id="doc-description"
            rows={3}
            maxLength={1000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={fieldClass}
            style={ring}
            placeholder="What is this document for?"
          />
        </div>

        <div>
          <label htmlFor="doc-tags" className="block text-sm font-medium text-gray-300 mb-1">Tags</label>
          <TagInput id="doc-tags" tags={tags} onChange={setTags} suggestions={tagSuggestions} />
        </div>

        {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={busy || !files.length}>
            {busy ? `Uploading ${Math.min(progress.done + 1, progress.total)} of ${progress.total}...`
              : files.length > 1 ? `Upload ${files.length} files` : 'Upload'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

/** Edit title, description and tags of an existing document. */
const EditModal = ({ doc, tagSuggestions, onClose, onSaved }) => {
  const [title, setTitle] = useState(doc.title);
  const [description, setDescription] = useState(doc.description || '');
  const [tags, setTags] = useState(doc.tags || []);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { setError('Give the document a title'); return; }
    setSaving(true);
    setError('');
    try {
      onSaved(await apiService.updateDocument(doc.id, { title: title.trim(), description: description.trim(), tags }));
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Edit document" size="lg">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <p className="text-xs text-gray-400 truncate" title={doc.fileName}>File: {doc.fileName}</p>
        <Input label="Title" name="title" value={title} maxLength={150} onChange={(e) => setTitle(e.target.value)} required autoFocus />
        <div>
          <label htmlFor="doc-edit-description" className="block text-sm font-medium text-gray-300 mb-1">Description</label>
          <textarea
            id="doc-edit-description"
            rows={3}
            maxLength={1000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={fieldClass}
            style={ring}
          />
        </div>
        <div>
          <label htmlFor="doc-edit-tags" className="block text-sm font-medium text-gray-300 mb-1">Tags</label>
          <TagInput id="doc-edit-tags" tags={tags} onChange={setTags} suggestions={tagSuggestions} />
        </div>
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
 * Company document library: upload files, tag them, and find them again by tag or search.
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
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(null);

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
          <p className="text-gray-300">Share files with your company and tag them so they are easy to find</p>
        </div>
        <Button variant="primary" onClick={() => setUploading(true)} className="flex items-center">
          <CloudUploadIcon className="h-4 w-4 mr-2" />
          Upload document
        </Button>
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
            {filtersActive ? 'No documents match these filters.' : 'No documents yet. Upload the first one.'}
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
                      <h3 className="text-base font-semibold text-white break-words">{doc.title}</h3>
                      <p className="text-xs text-gray-400 truncate" title={doc.fileName}>
                        {doc.fileName} · {formatFileSize(doc.fileSize)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-sm flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => download(doc)}
                        disabled={busyId === doc.id}
                        className="inline-flex items-center font-medium hover:underline disabled:opacity-50"
                        style={{ color: '#ffc44d' }}
                      >
                        <DownloadIcon className="h-4 w-4 mr-1" /> Download
                      </button>
                      {doc.canManage && (
                        <>
                          <button type="button" onClick={() => setEditing(doc)} className="inline-flex items-center text-gray-300 hover:text-white">
                            <PencilIcon className="h-4 w-4 mr-1" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(doc)}
                            disabled={busyId === doc.id}
                            className="inline-flex items-center text-gray-300 hover:text-red-400 disabled:opacity-50"
                          >
                            <TrashIcon className="h-4 w-4 mr-1" /> Delete
                          </button>
                        </>
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

                  <p className="text-xs text-gray-400 mt-2">
                    Uploaded by {doc.mine ? 'you' : doc.uploadedByName || 'Unknown'} · {formatDateTime(doc.createdAt)}
                    {doc.updatedByName && ` · Edited by ${doc.updatedByName}`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {uploading && (
        <UploadModal
          tagSuggestions={tagSuggestions}
          onClose={() => setUploading(false)}
          onUploaded={(added) => setDocs(list => [...added, ...list])}
        />
      )}
      {editing && (
        <EditModal
          doc={editing}
          tagSuggestions={tagSuggestions}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setDocs(list => list.map(d => (d.id === saved.id ? saved : d)));
            setEditing(null);
          }}
        />
      )}
    </div>
  );
};

export default DocumentsPage;
