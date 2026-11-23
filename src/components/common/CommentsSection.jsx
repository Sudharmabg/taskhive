import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { ChatAlt2Icon, TrashIcon, ReplyIcon } from '@heroicons/react/outline';
import apiService from '../../services/api';
import { formatDateTime } from './StoryHistory';
import Button from './Button';

const AVATAR_COLORS = [
  'bg-blue-600',
  'bg-emerald-600',
  'bg-purple-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-indigo-600',
  'bg-teal-600',
  'bg-cyan-600',
];

const getInitials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getAvatarColor = (name) => {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const countTotalComments = (items) => {
  if (!Array.isArray(items)) return 0;
  return items.reduce((acc, c) => acc + 1 + (c.replies ? countTotalComments(c.replies) : 0), 0);
};

/**
 * Comments section for Tasks, Epics, Bugs, and Ideas.
 * Provides threaded discussions, author deletion, and live updates.
 */
const CommentsSection = ({
  storyId,
  ideaId,
  title = 'Comments',
  compact = false,
  onCountChange,
}) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const targetId = storyId || ideaId;
  const isIdea = Boolean(ideaId);

  const loadComments = useCallback(async () => {
    if (!targetId) {
      setComments([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = isIdea
        ? await apiService.getIdeaComments(ideaId)
        : await apiService.getStoryComments(storyId);
      const list = Array.isArray(data) ? data : [];
      setComments(list);
      if (onCountChange) {
        onCountChange(countTotalComments(list));
      }
    } catch (err) {
      setError(err.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [targetId, isIdea, storyId, ideaId, onCountChange]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const totalCount = useMemo(() => countTotalComments(comments), [comments]);

  const handleAddComment = async (e) => {
    if (e) e.preventDefault();
    const text = newCommentText.trim();
    if (!text || submitting) return;

    setSubmitting(true);
    setActionError('');
    try {
      const newComment = isIdea
        ? await apiService.addIdeaComment(ideaId, { content: text })
        : await apiService.addStoryComment(storyId, { content: text });

      setComments((prev) => [...prev, newComment]);
      setNewCommentText('');
      if (onCountChange) {
        onCountChange(totalCount + 1);
      }
    } catch (err) {
      setActionError(err.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddReply = async (parentCommentId) => {
    const text = replyText.trim();
    if (!text || submittingReply) return;

    setSubmittingReply(true);
    setActionError('');
    try {
      const savedReply = isIdea
        ? await apiService.addIdeaComment(ideaId, { content: text, parentId: parentCommentId })
        : await apiService.addStoryComment(storyId, { content: text, parentId: parentCommentId });

      setComments((prev) =>
        prev.map((c) => {
          if (c.id === parentCommentId) {
            return {
              ...c,
              replies: [...(c.replies || []), savedReply],
            };
          }
          return c;
        })
      );
      setReplyText('');
      setReplyingToId(null);
      if (onCountChange) {
        onCountChange(totalCount + 1);
      }
    } catch (err) {
      setActionError(err.message || 'Failed to post reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDelete = async (commentId, parentId = null) => {
    if (!window.confirm('Delete this comment? This cannot be undone.')) return;

    setDeletingId(commentId);
    setActionError('');
    try {
      if (isIdea) {
        await apiService.deleteIdeaComment(ideaId, commentId);
      } else {
        await apiService.deleteStoryComment(storyId, commentId);
      }

      setComments((prev) => {
        if (!parentId) {
          return prev.filter((c) => c.id !== commentId);
        }
        return prev.map((c) => {
          if (c.id === parentId) {
            return {
              ...c,
              replies: (c.replies || []).filter((r) => r.id !== commentId),
            };
          }
          return c;
        });
      });

      // Reload comments to ensure exact count with cascade
      loadComments();
    } catch (err) {
      setActionError(err.message || 'Failed to delete comment');
    } finally {
      setDeletingId(null);
    }
  };

  const currentUser = apiService.getCurrentUser();

  const renderComment = (c, isReply = false, parentId = null) => {
    const isMine = c.isMine || c.userId === currentUser.id;
    const canDelete = isMine || currentUser.role === 'admin';
    const isDeleting = deletingId === c.id;

    return (
      <div
        key={c.id}
        className={`group transition-colors rounded-lg p-3 ${
          isReply ? 'bg-gray-750 bg-opacity-50 ml-6 mt-2 border-l-2 border-yellow-500/50 pl-3' : 'bg-gray-700/60 border border-gray-600/70'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm ${getAvatarColor(
                c.userName
              )}`}
              title={c.userName}
            >
              {getInitials(c.userName)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-semibold text-white truncate">{c.userName || 'Unknown'}</span>
                {isMine && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-yellow-400 text-black">
                    You
                  </span>
                )}
                <span className="text-xs text-gray-400">· {formatDateTime(c.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 opacity-90 group-hover:opacity-100 transition-opacity flex-shrink-0">
            {!isReply && (
              <button
                type="button"
                onClick={() => {
                  if (replyingToId === c.id) {
                    setReplyingToId(null);
                    setReplyText('');
                  } else {
                    setReplyingToId(c.id);
                    setReplyText('');
                  }
                }}
                className="inline-flex items-center text-xs text-gray-400 hover:text-yellow-400 transition-colors"
                title="Reply to comment"
              >
                <ReplyIcon className="h-3.5 w-3.5 mr-1" />
                Reply
              </button>
            )}

            {canDelete && (
              <button
                type="button"
                onClick={() => handleDelete(c.id, parentId)}
                disabled={isDeleting}
                className="inline-flex items-center text-xs text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
                title="Delete comment"
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Comment Content */}
        <div className="mt-2 text-sm text-gray-200 whitespace-pre-wrap break-words leading-relaxed pl-9">
          {c.content}
        </div>

        {/* Inline Reply Form */}
        {replyingToId === c.id && (
          <div className="mt-3 pl-9">
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-2.5">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    handleAddReply(c.id);
                  }
                }}
                placeholder={`Reply to ${c.userName}... (Ctrl+Enter to post)`}
                rows={2}
                className="w-full bg-transparent text-sm text-white placeholder-gray-400 focus:outline-none resize-none"
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-gray-700">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setReplyingToId(null);
                    setReplyText('');
                  }}
                  className="text-xs py-1 px-2.5"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleAddReply(c.id)}
                  disabled={!replyText.trim() || submittingReply}
                  className="text-xs py-1 px-3"
                >
                  {submittingReply ? 'Posting...' : 'Reply'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Nested Replies */}
        {c.replies && c.replies.length > 0 && (
          <div className="mt-2 space-y-2">
            {c.replies.map((reply) => renderComment(reply, true, c.id))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${compact ? 'text-sm' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChatAlt2Icon className="h-5 w-5" style={{ color: '#ffc44d' }} />
          <h3 className="text-sm font-medium text-white">{title}</h3>
          <span
            className="px-2 py-0.5 rounded-full text-xs font-semibold text-black"
            style={{ backgroundColor: '#ffc44d' }}
          >
            {totalCount}
          </span>
        </div>
      </div>

      {actionError && (
        <div className="p-2.5 bg-red-900/40 border border-red-700 rounded-lg text-xs text-red-200">
          {actionError}
        </div>
      )}

      {/* New Comment Input Box */}
      <div className="bg-gray-700 border border-gray-600 rounded-lg p-3">
        <textarea
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              handleAddComment();
            }
          }}
          placeholder="Add a comment... (press Ctrl+Enter to post)"
          rows={compact ? 2 : 3}
          maxLength={5000}
          className="w-full bg-transparent text-sm text-white placeholder-gray-400 focus:outline-none resize-none"
        />
        <div className="flex items-center justify-between pt-2 border-t border-gray-600/70 mt-2">
          <span className="text-[11px] text-gray-400">Ctrl + Enter to send</span>
          <Button
            size="sm"
            variant="primary"
            onClick={handleAddComment}
            disabled={!newCommentText.trim() || submitting}
            className="text-xs font-medium py-1 px-3"
          >
            {submitting ? 'Posting...' : 'Comment'}
          </Button>
        </div>
      </div>

      {/* Comment List */}
      {loading ? (
        <div className="py-6 text-center text-xs text-gray-400">Loading comments...</div>
      ) : error ? (
        <div className="py-4 text-center text-xs text-red-400">{error}</div>
      ) : comments.length === 0 ? (
        <div className="bg-gray-700/40 border border-gray-600/50 rounded-lg p-6 text-center">
          <ChatAlt2Icon className="h-8 w-8 mx-auto mb-2 text-gray-500" />
          <p className="text-sm text-gray-300 font-medium">No comments yet</p>
          <p className="text-xs text-gray-400 mt-1">Start the conversation by adding a comment above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => renderComment(comment))}
        </div>
      )}
    </div>
  );
};

export default CommentsSection;
