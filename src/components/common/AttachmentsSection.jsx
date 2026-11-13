import React, { useEffect, useRef, useState } from 'react';
import { PaperClipIcon, DownloadIcon, TrashIcon, XIcon } from '@heroicons/react/outline';
import apiService from '../../services/api';

export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10 MB, matches backend limit

export const formatFileSize = (bytes) => {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Attachments section for Epics, Tasks and Bugs.
 *
 * - storyId: when set, already-uploaded attachments are loaded and listed
 * - editable: allows picking new files and deleting existing ones
 * - pendingFiles / onPendingFilesChange: files chosen but not yet uploaded
 *   (they are uploaded after the story is saved)
 */
const AttachmentsSection = ({ storyId, editable = false, pendingFiles = [], onPendingFilesChange }) => {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!storyId) {
      setAttachments([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    apiService
      .getAttachments(storyId)
      .then(data => { if (!cancelled) setAttachments(Array.isArray(data) ? data : []); })
      .catch(err => { if (!cancelled) setError(`Failed to load attachments: ${err.message}`); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [storyId]);

  const addFiles = (fileList) => {
    const files = Array.from(fileList || []);
    const tooLarge = files.filter(f => f.size > MAX_ATTACHMENT_SIZE);
    const accepted = files.filter(f => f.size <= MAX_ATTACHMENT_SIZE);
    setError(tooLarge.length
      ? `Skipped (over 10 MB): ${tooLarge.map(f => f.name).join(', ')}`
      : '');
    if (accepted.length && onPendingFilesChange) {
      onPendingFilesChange([...pendingFiles, ...accepted]);
    }
  };

  const removePending = (index) => {
    onPendingFilesChange && onPendingFilesChange(pendingFiles.filter((_, i) => i !== index));
  };

  const handleDownload = async (attachment) => {
    try {
      await apiService.downloadAttachment(attachment);
    } catch (err) {
      setError(`Download failed: ${err.message}`);
    }
  };

  const handleDelete = async (attachment) => {
    if (!window.confirm(`Delete attachment "${attachment.fileName}"?`)) return;
    try {
      await apiService.deleteAttachment(attachment.id);
      setAttachments(prev => prev.filter(a => a.id !== attachment.id));
    } catch (err) {
      setError(`Delete failed: ${err.message}`);
    }
  };

  const hasAny = attachments.length > 0 || pendingFiles.length > 0;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">
        Attachments
      </label>

      {editable && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            addFiles(e.dataTransfer.files);
          }}
          className={`flex items-center justify-center px-3 py-4 mb-2 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            isDragging ? 'border-yellow-400 bg-gray-600' : 'border-gray-600 bg-gray-700 hover:border-gray-500'
          }`}
        >
          <PaperClipIcon className="h-5 w-5 text-gray-400 mr-2" />
          <span className="text-sm text-gray-300">
            Drop files here or <span style={{ color: '#ffc44d' }}>browse</span>
            <span className="text-gray-500"> (max 10 MB each)</span>
          </span>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>
      )}

      {error && <p className="mb-2 text-sm text-red-400">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-400">Loading attachments...</p>
      ) : !hasAny ? (
        !editable && (
          <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
            <p className="text-gray-400 text-sm">No attachments.</p>
          </div>
        )
      ) : (
        <ul className="divide-y divide-gray-600 border border-gray-600 rounded-lg bg-gray-700">
          {attachments.map(a => (
            <li key={`saved-${a.id}`} className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center min-w-0">
                <PaperClipIcon className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                <button
                  type="button"
                  onClick={() => handleDownload(a)}
                  className="text-sm text-white truncate hover:underline text-left"
                  title={`Download ${a.fileName}`}
                >
                  {a.fileName}
                </button>
                <span className="ml-2 text-xs text-gray-400 flex-shrink-0">{formatFileSize(a.fileSize)}</span>
              </div>
              <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownload(a)}
                  className="text-gray-400 hover:text-white"
                  aria-label={`Download ${a.fileName}`}
                >
                  <DownloadIcon className="h-4 w-4" />
                </button>
                {editable && (
                  <button
                    type="button"
                    onClick={() => handleDelete(a)}
                    className="text-gray-400 hover:text-red-400"
                    aria-label={`Delete ${a.fileName}`}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
          {pendingFiles.map((file, index) => (
            <li key={`pending-${index}-${file.name}`} className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center min-w-0">
                <PaperClipIcon className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-300 truncate">{file.name}</span>
                <span className="ml-2 text-xs text-gray-400 flex-shrink-0">{formatFileSize(file.size)}</span>
                <span className="ml-2 text-xs px-1.5 py-0.5 rounded text-black flex-shrink-0" style={{ backgroundColor: '#ffc44d' }}>
                  New
                </span>
              </div>
              <button
                type="button"
                onClick={() => removePending(index)}
                className="ml-2 text-gray-400 hover:text-red-400 flex-shrink-0"
                aria-label={`Remove ${file.name}`}
              >
                <XIcon className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AttachmentsSection;
