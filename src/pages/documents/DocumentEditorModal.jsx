import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChatAlt2Icon, CheckCircleIcon, DocumentTextIcon, DownloadIcon,
  ReplyIcon, TrashIcon, XIcon,
} from '@heroicons/react/outline';
import Button from '../../components/common/Button';
import apiService from '../../services/api';
import { formatDateTime } from '../../components/common/StoryHistory';
import { formatFileSize } from '../../components/common/AttachmentsSection';

const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 30;

const normalizeTag = (raw) => raw.trim().replace(/\s+/g, ' ').replace(/^#\s*/, '').toLowerCase();

const TagInput = ({ id, tags, onChange, suggestions = [] }) => {
  const [draft, setDraft] = useState('');
  const [hint, setHint] = useState('');

  const add = (raw) => {
    const parts = raw.split(',').map(normalizeTag).filter(Boolean);
    if (!parts.length) return;
    const next = [...tags];
    for (const tag of parts) {
      if (tag.length > MAX_TAG_LENGTH) {
        setHint(`Tags can be at most ${MAX_TAG_LENGTH} characters`);
        return;
      }
      if (!/^[\p{L}\p{N} ._-]+$/u.test(tag)) {
        setHint('Use letters, numbers, spaces, dots, dashes or underscores');
        return;
      }
      if (!next.includes(tag)) next.push(tag);
    }
    if (next.length > MAX_TAGS) {
      setHint(`A document can have at most ${MAX_TAGS} tags`);
      return;
    }
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
    <div className="flex-1">
      <div
        className="flex flex-wrap items-center gap-1.5 px-2.5 py-1.5 bg-gray-700/80 border border-gray-600 rounded-lg min-h-[36px] focus-within:ring-2 focus-within:border-transparent"
        style={{ '--tw-ring-color': '#ffc44d' }}
      >
        {tags.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold text-black"
            style={{ backgroundColor: '#ffc44d' }}
          >
            #{tag}
            <button
              type="button"
              onClick={() => onChange(tags.filter(t => t !== tag))}
              className="ml-1 hover:opacity-75 focus:outline-none"
              aria-label={`Remove tag ${tag}`}
            >
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
            const val = e.target.value;
            if (val.endsWith(',')) add(val); else setDraft(val);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => draft.trim() && add(draft)}
          placeholder={tags.length ? '+ tag' : 'e.g. policy, sprint, invoice'}
          className="flex-1 min-w-[6rem] bg-transparent text-white placeholder-gray-400 text-xs py-0.5 focus:outline-none"
        />
        <datalist id={`${id}-suggestions`}>
          {unused.map(s => <option key={s} value={s} />)}
        </datalist>
      </div>
      {hint && <p className="text-[11px] mt-1 text-red-400">{hint}</p>}
    </div>
  );
};

const DocumentEditorModal = ({ doc, tagSuggestions = [], onClose, onSaved }) => {
  const isNew = !doc || !doc.id;
  const [title, setTitle] = useState(doc?.title || '');
  const [description, setDescription] = useState(doc?.description || '');
  const [tags, setTags] = useState(doc?.tags || []);
  const [content, setContent] = useState(doc?.content || '');

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'unsaved' | 'saving'
  const [errorMessage, setErrorMessage] = useState('');

  // Comments state
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentFilter, setCommentFilter] = useState('all'); // 'all' | 'open' | 'resolved'
  const [activeSelectedText, setActiveSelectedText] = useState('');
  const [floatingCommentBtn, setFloatingCommentBtn] = useState(null);
  const [newCommentDraft, setNewCommentDraft] = useState('');
  const [replyDrafts, setReplyDrafts] = useState({});
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [showCommentsSidebar, setShowCommentsSidebar] = useState(true);

  const editorRef = useRef(null);

  // Load comments
  const loadComments = async () => {
    if (isNew || !doc?.id) return;
    setLoadingComments(true);
    try {
      const data = await apiService.getDocumentComments(doc.id);
      setComments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc?.id]);

  useEffect(() => {
    if (editorRef.current) {
      const initialHtml = doc?.content || content || '';
      if (editorRef.current.innerHTML !== initialHtml) {
        editorRef.current.innerHTML = initialHtml;
      }
    }
  }, [doc?.id]);

  // Text selection detection for "+ Comment"
  const handleSelection = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      setFloatingCommentBtn(null);
      return;
    }
    const text = sel.toString().trim();
    if (!text || text.length < 2) {
      setFloatingCommentBtn(null);
      return;
    }

    try {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;
      setFloatingCommentBtn({
        x: Math.min(rect.right + 10, window.innerWidth - 130),
        y: Math.max(rect.top - 12, 60),
        text,
      });
    } catch {
      setFloatingCommentBtn(null);
    }
  };

  const startCommentFromSelection = (text) => {
    setActiveSelectedText(text);
    setShowCommentsSidebar(true);
    setFloatingCommentBtn(null);
    setTimeout(() => {
      const inp = document.getElementById('doc-comment-input');
      if (inp) inp.focus();
    }, 100);
  };

  // Rich text formatting command
  const applyFormat = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
      setSaveStatus('unsaved');
    }
  };

  // Keyboard shortcut Ctrl+S / Cmd+S
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveDocument();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  // Save document
  const saveDocument = async () => {
    if (!title.trim()) {
      setErrorMessage('Please give your document a title');
      return;
    }
    setErrorMessage('');
    setIsSaving(true);
    setSaveStatus('saving');

    const htmlContent = editorRef.current ? editorRef.current.innerHTML : content;

    try {
      let saved;
      if (isNew) {
        saved = await apiService.createDocument({
          title: title.trim(),
          description: description.trim(),
          tags,
          content: htmlContent,
        });
      } else {
        saved = await apiService.updateDocument(doc.id, {
          title: title.trim(),
          description: description.trim(),
          tags,
          content: htmlContent,
        });
      }
      setSaveStatus('saved');
      setIsSaving(false);
      onSaved(saved);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save document');
      setSaveStatus('unsaved');
      setIsSaving(false);
    }
  };

  // Add Comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentDraft.trim() || isNew) return;
    try {
      const newComment = await apiService.addDocumentComment(doc.id, {
        content: newCommentDraft.trim(),
        selectedText: activeSelectedText || null,
        parentId: null,
      });
      setComments(prev => [...prev, newComment]);
      setNewCommentDraft('');
      setActiveSelectedText('');
    } catch (err) {
      alert(err.message || 'Failed to add comment');
    }
  };

  // Add Reply
  const handleAddReply = async (parentCommentId) => {
    const replyText = replyDrafts[parentCommentId];
    if (!replyText || !replyText.trim()) return;
    try {
      const savedReply = await apiService.addDocumentComment(doc.id, {
        content: replyText.trim(),
        parentId: parentCommentId,
      });
      setComments(prev => prev.map(c => {
        if (c.id === parentCommentId) {
          return { ...c, replies: [...(c.replies || []), savedReply] };
        }
        return c;
      }));
      setReplyDrafts(prev => ({ ...prev, [parentCommentId]: '' }));
      setActiveReplyId(null);
    } catch (err) {
      alert(err.message || 'Failed to add reply');
    }
  };

  // Toggle Resolve
  const handleToggleResolve = async (comment) => {
    try {
      const updated = await apiService.resolveDocumentComment(doc.id, comment.id, !comment.resolved);
      setComments(prev => prev.map(c => (c.id === comment.id ? { ...c, resolved: updated.resolved } : c)));
    } catch (err) {
      alert(err.message || 'Failed to update comment status');
    }
  };

  // Delete Comment
  const handleDeleteComment = async (commentId, parentId = null) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await apiService.deleteDocumentComment(doc.id, commentId);
      if (parentId) {
        setComments(prev => prev.map(c => {
          if (c.id === parentId) {
            return { ...c, replies: (c.replies || []).filter(r => r.id !== commentId) };
          }
          return c;
        }));
      } else {
        setComments(prev => prev.filter(c => c.id !== commentId));
      }
    } catch (err) {
      alert(err.message || 'Failed to delete comment');
    }
  };

  // Filtered comments
  const filteredComments = useMemo(() => {
    return comments.filter(c => {
      if (commentFilter === 'open') return !c.resolved;
      if (commentFilter === 'resolved') return c.resolved;
      return true;
    });
  }, [comments, commentFilter]);

  const openCount = useMemo(() => comments.filter(c => !c.resolved).length, [comments]);
  const resolvedCount = useMemo(() => comments.filter(c => c.resolved).length, [comments]);

  return (
    /* Modal Container: Perfectly centered on screen with exact 50% / translate-y positioning */
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Main Modal Window: Absolute center of viewport with exactly equal top, bottom, left, right margins */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-6xl h-[88vh] bg-gray-800 border border-gray-700 rounded-xl shadow-2xl flex flex-col overflow-hidden z-10">

        {/* ── Top Header: Document Details & Actions ── */}
        <header className="px-5 py-3 bg-gray-800 border-b border-gray-700 flex-shrink-0 space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2 rounded-lg bg-amber-400/10 flex-shrink-0">
                <DocumentTextIcon className="w-5 h-5 text-[#ffc44d]" />
              </div>

              <input
                type="text"
                value={title}
                onChange={e => {
                  setTitle(e.target.value);
                  setSaveStatus('unsaved');
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="Document Title (e.g. Teachers Dashboard Documentation)"
                className="text-base sm:text-lg font-bold text-white bg-gray-700/60 hover:bg-gray-700/90 focus:bg-gray-700 px-3 py-1 rounded-lg border border-gray-600 focus:border-[#ffc44d] outline-none w-full max-w-xl transition-all"
              />

              {/* Status Badge */}
              {saveStatus === 'saved' && (
                <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1 flex-shrink-0">
                  <CheckCircleIcon className="w-3.5 h-3.5" /> Saved
                </span>
              )}
              {saveStatus === 'unsaved' && (
                <span className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full flex-shrink-0">
                  ● Unsaved
                </span>
              )}
              {saveStatus === 'saving' && (
                <span className="text-xs text-amber-300 animate-pulse flex-shrink-0">
                  Saving...
                </span>
              )}
              {errorMessage && (
                <span className="text-xs text-red-400 font-medium truncate">{errorMessage}</span>
              )}
            </div>

            {/* Top Right Header Controls */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowCommentsSidebar(!showCommentsSidebar)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  showCommentsSidebar
                    ? 'bg-[#ffc44d] text-black'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                }`}
                title="Toggle Google Docs style comments sidebar"
              >
                <ChatAlt2Icon className="h-4 w-4" />
                <span>Comments</span>
                {comments.length > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${showCommentsSidebar ? 'bg-black text-[#ffc44d]' : 'bg-[#ffc44d] text-black'}`}>
                    {openCount > 0 ? openCount : comments.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-700 transition-colors"
                title="Close (Esc)"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Metadata Row: Description & Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-medium w-20 flex-shrink-0">Description:</span>
              <input
                type="text"
                value={description}
                onChange={e => {
                  setDescription(e.target.value);
                  setSaveStatus('unsaved');
                }}
                placeholder="What is this document for? (optional)"
                className="flex-1 bg-gray-700/60 border border-gray-600 rounded-lg px-2.5 py-1 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#ffc44d] text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-medium w-12 flex-shrink-0">Tags:</span>
              <TagInput
                id="modal-doc-tags"
                tags={tags}
                onChange={t => {
                  setTags(t);
                  setSaveStatus('unsaved');
                }}
                suggestions={tagSuggestions}
              />
            </div>
          </div>
        </header>

        {/* ── Formatting Toolbar (Google Docs Style) ── */}
        <div className="flex items-center gap-1.5 px-5 py-2 bg-gray-750 bg-gray-700/50 border-b border-gray-700 text-gray-300 text-xs flex-wrap flex-shrink-0">
          <select
            onChange={e => applyFormat('formatBlock', e.target.value)}
            defaultValue="<p>"
            className="bg-gray-700 border border-gray-600 text-xs text-white rounded px-2.5 py-1 outline-none"
            style={{ '--tw-ring-color': '#ffc44d' }}
          >
            <option value="<p>">Normal text</option>
            <option value="<h1>">Heading 1</option>
            <option value="<h2>">Heading 2</option>
            <option value="<h3>">Heading 3</option>
            <option value="<blockquote>">Quote</option>
          </select>

          <div className="h-4 w-px bg-gray-600 mx-1" />

          <button
            type="button"
            onClick={() => applyFormat('bold')}
            className="p-1 hover:bg-gray-600 hover:text-white rounded font-bold text-xs w-6 h-6 flex items-center justify-center transition-colors"
            title="Bold"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => applyFormat('italic')}
            className="p-1 hover:bg-gray-600 hover:text-white rounded italic text-xs w-6 h-6 flex items-center justify-center font-serif transition-colors"
            title="Italic"
          >
            I
          </button>
          <button
            type="button"
            onClick={() => applyFormat('underline')}
            className="p-1 hover:bg-gray-600 hover:text-white rounded underline text-xs w-6 h-6 flex items-center justify-center transition-colors"
            title="Underline"
          >
            U
          </button>
          <button
            type="button"
            onClick={() => applyFormat('strikeThrough')}
            className="p-1 hover:bg-gray-600 hover:text-white rounded line-through text-xs w-6 h-6 flex items-center justify-center transition-colors"
            title="Strikethrough"
          >
            S
          </button>

          <div className="h-4 w-px bg-gray-600 mx-1" />

          <button
            type="button"
            onClick={() => applyFormat('insertUnorderedList')}
            className="p-1 hover:bg-gray-600 hover:text-white rounded text-xs w-6 h-6 flex items-center justify-center transition-colors"
            title="Bulleted list"
          >
            •≡
          </button>
          <button
            type="button"
            onClick={() => applyFormat('insertOrderedList')}
            className="p-1 hover:bg-gray-600 hover:text-white rounded text-xs w-6 h-6 flex items-center justify-center transition-colors"
            title="Numbered list"
          >
            1≡
          </button>
          <button
            type="button"
            onClick={() => applyFormat('insertHorizontalRule')}
            className="p-1 hover:bg-gray-600 hover:text-white rounded text-xs w-6 h-6 flex items-center justify-center transition-colors"
            title="Horizontal line"
          >
            ―
          </button>

          <div className="h-4 w-px bg-gray-600 mx-1" />

          <button
            type="button"
            onClick={() => {
              const sel = window.getSelection();
              if (sel && !sel.isCollapsed) {
                startCommentFromSelection(sel.toString().trim());
              } else {
                setShowCommentsSidebar(true);
                const inp = document.getElementById('doc-comment-input');
                if (inp) inp.focus();
              }
            }}
            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-gray-700 hover:bg-gray-600 text-[#ffc44d] rounded transition-colors font-medium ml-1"
            title="Add comment on document selection"
          >
            <ChatAlt2Icon className="h-3.5 w-3.5" />
            <span>+ Add Comment</span>
          </button>
        </div>

        {/* ── Main Body: Side-By-Side (Document Page + Comments Sidebar) ── */}
        <div className="flex-1 flex overflow-hidden bg-gray-900 min-h-0">

          {/* Main Document Canvas: Centered Paper / Notepad View */}
          <div
            className="flex-1 min-w-0 overflow-y-auto overflow-x-auto p-4 sm:p-6 md:p-8 flex justify-center bg-gray-950/90 shadow-inner"
            onMouseUp={handleSelection}
            onKeyUp={handleSelection}
          >
            <div
              id="taskhive-doc-editor"
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={e => {
                setContent(e.currentTarget.innerHTML);
                setSaveStatus('unsaved');
              }}
              className="w-full max-w-[850px] min-h-[900px] p-8 sm:p-12 md:p-16 bg-white text-gray-900 shadow-2xl rounded-sm border border-gray-200 document-paper-sheet outline-none focus:ring-1 focus:ring-[#ffc44d] self-start"
            />

            {/* Floating "+ Comment" Tooltip on highlighted text */}
            {floatingCommentBtn && (
              <div
                style={{
                  position: 'fixed',
                  left: `${floatingCommentBtn.x}px`,
                  top: `${floatingCommentBtn.y}px`,
                  zIndex: 60,
                }}
              >
                <button
                  type="button"
                  onClick={() => startCommentFromSelection(floatingCommentBtn.text)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#ffc44d] text-black text-xs font-bold rounded-full shadow-2xl hover:opacity-90 transition-all transform active:scale-95"
                >
                  <ChatAlt2Icon className="w-3.5 h-3.5" />
                  <span>Comment</span>
                </button>
              </div>
            )}
          </div>

          {/* ── Side-by-Side Comments Sidebar (Google Docs Style) ── */}
          {showCommentsSidebar && (
            <aside className="w-72 sm:w-80 min-w-0 bg-gray-800 border-l border-gray-700 flex flex-col flex-shrink-0 h-full overflow-hidden shadow-xl">
              {/* Sidebar Header: Clean, Subtle Filter */}
              <div className="px-3.5 py-2.5 border-b border-gray-700 flex items-center justify-between flex-shrink-0 bg-gray-800">
                <div className="flex items-center gap-1.5">
                  <ChatAlt2Icon className="w-4 h-4 text-[#ffc44d]" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Comments</span>
                  {openCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#ffc44d] text-black">
                      {openCount}
                    </span>
                  )}
                </div>

                {/* Clean Segmented Filter */}
                <div className="flex items-center bg-gray-900/70 p-0.5 rounded-lg border border-gray-700 text-xs">
                  <button
                    type="button"
                    onClick={() => setCommentFilter('open')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      commentFilter === 'open'
                        ? 'bg-gray-700 text-[#ffc44d] font-semibold shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Open ({openCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCommentFilter('resolved')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      commentFilter === 'resolved'
                        ? 'bg-gray-700 text-green-400 font-semibold shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Resolved ({resolvedCount})
                  </button>
                </div>
              </div>

              {/* Add Comment Box */}
              <div className="p-3 border-b border-gray-700/80 bg-gray-750 bg-gray-800/80 flex-shrink-0">
                {activeSelectedText && (
                  <div className="bg-gray-900 border-l-2 border-[#ffc44d] p-2 text-xs text-gray-200 rounded mb-2 flex items-start justify-between">
                    <span className="italic text-[11px] truncate mr-2">"{activeSelectedText}"</span>
                    <button
                      type="button"
                      onClick={() => setActiveSelectedText('')}
                      className="text-gray-400 hover:text-white flex-shrink-0"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <textarea
                  id="doc-comment-input"
                  rows={2}
                  value={newCommentDraft}
                  onChange={e => setNewCommentDraft(e.target.value)}
                  placeholder={activeSelectedText ? 'Comment on selected text...' : 'Add a comment or feedback...'}
                  className="w-full px-2.5 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-xs text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#ffc44d] resize-none"
                />
                <div className="flex justify-end mt-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleAddComment}
                    disabled={!newCommentDraft.trim() || isNew}
                    className="text-[11px] px-3 py-1 font-semibold"
                  >
                    Post Comment
                  </Button>
                </div>
              </div>

              {/* Comments Scrollable Stream */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {loadingComments ? (
                  <p className="text-gray-400 text-center py-6 text-xs">Loading comments...</p>
                ) : filteredComments.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-xs">
                    <ChatAlt2Icon className="h-8 w-8 mx-auto mb-2 text-gray-500 opacity-60" />
                    <p className="font-medium text-gray-300">No comments yet</p>
                    <p className="text-[11px] text-gray-500 mt-1">Highlight text in document to comment directly.</p>
                  </div>
                ) : (
                  filteredComments.map(c => (
                    <div
                      key={c.id}
                      className={`p-3 rounded-lg border transition-all ${
                        c.resolved
                          ? 'bg-gray-800/40 border-gray-700/60 opacity-60'
                          : 'bg-gray-700/80 border-gray-600 shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-[#ffc44d] text-xs">
                          {c.authorName || 'User'}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {formatDateTime(c.createdAt)}
                        </span>
                      </div>

                      {c.selectedText && (
                        <div className="border-l-2 border-[#ffc44d] bg-gray-900/80 px-2 py-1 text-[11px] text-gray-200 italic mb-2 rounded">
                          "{c.selectedText}"
                        </div>
                      )}

                      <p className="text-gray-100 text-xs leading-relaxed whitespace-pre-wrap">{c.content}</p>

                      {/* Replies */}
                      {c.replies?.length > 0 && (
                        <div className="mt-2.5 pl-2.5 border-l-2 border-gray-600 space-y-2">
                          {c.replies.map(r => (
                            <div key={r.id} className="bg-gray-800/80 p-2 rounded border border-gray-700 text-xs">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-amber-300 text-[11px]">{r.authorName}</span>
                                <span className="text-[10px] text-gray-400">{formatDateTime(r.createdAt)}</span>
                              </div>
                              <p className="text-gray-200 text-[11px]">{r.content}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Comment Actions */}
                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-600/60 text-[11px]">
                        <button
                          type="button"
                          onClick={() => handleToggleResolve(c)}
                          className={`flex items-center gap-1 font-medium transition-colors ${
                            c.resolved ? 'text-green-400 hover:text-green-300' : 'text-gray-400 hover:text-green-400'
                          }`}
                        >
                          <CheckCircleIcon className="h-3.5 w-3.5" />
                          {c.resolved ? 'Resolved' : 'Resolve'}
                        </button>

                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => setActiveReplyId(activeReplyId === c.id ? null : c.id)}
                            className="text-gray-400 hover:text-white flex items-center gap-1"
                          >
                            <ReplyIcon className="h-3 w-3" />
                            Reply
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(c.id)}
                            className="text-gray-400 hover:text-red-400 flex items-center gap-1"
                          >
                            <TrashIcon className="h-3 w-3" />
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Reply Input Box */}
                      {activeReplyId === c.id && (
                        <div className="mt-2 pt-2 border-t border-gray-600 flex gap-1.5">
                          <input
                            type="text"
                            value={replyDrafts[c.id] || ''}
                            onChange={e => setReplyDrafts({ ...replyDrafts, [c.id]: e.target.value })}
                            placeholder="Write a reply..."
                            className="flex-1 px-2.5 py-1 bg-gray-900 border border-gray-600 text-white text-xs rounded focus:outline-none focus:ring-1 focus:ring-[#ffc44d]"
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddReply(c.id);
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={() => handleAddReply(c.id)}
                            className="text-[10px] px-2.5"
                          >
                            Send
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </aside>
          )}
        </div>

        {/* ── Modal Footer ── */}
        <footer className="px-5 py-3 bg-gray-800 border-t border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            {doc?.fileName && (
              <span>
                File: <strong className="text-gray-300">{doc.fileName}</strong> {doc.fileSize ? `(${formatFileSize(doc.fileSize)})` : ''}
              </span>
            )}
            {(() => {
              if (!doc?.updatedByName) return null;
              const currentUser = apiService.getCurrentUser() || {};
              const currentUserName = currentUser.name || '';
              const isEditor = currentUserName && doc.updatedByName === currentUserName;
              const editorLabel = isEditor ? 'you' : doc.updatedByName;
              return (
                <span className="hidden sm:inline">· Last edited by {editorLabel}{doc.updatedAt ? ` · ${formatDateTime(doc.updatedAt)}` : ''}</span>
              );
            })()}
          </div>

          <div className="flex items-center gap-2">
            {!isNew && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => apiService.downloadDocument(doc)}
                className="text-xs"
              >
                <DownloadIcon className="h-4 w-4 mr-1.5" />
                Download
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={saveDocument}
              disabled={isSaving}
              className="text-xs font-semibold px-4"
            >
              {isSaving ? 'Saving...' : 'Save Document'}
            </Button>
          </div>
        </footer>

      </div>
    </div>
  );
};

export default DocumentEditorModal;
