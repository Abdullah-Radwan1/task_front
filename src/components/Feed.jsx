import  { useState, useEffect, useRef } from 'react';
import {
  Image,
  Send,
  Trash2,
  Edit3,
  X,
  FileText,
  Calendar,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const POSTS_PER_PAGE = 5;

export default function Feed({ user, apiBaseUrl }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);

  // Post creation form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Post editing state
  const [editingPost, setEditingPost] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // ── Fetch a page of posts ──────────────────────────────────────────────────
  const fetchPosts = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${apiBaseUrl}/posts?page=${page}&limit=${POSTS_PER_PAGE}`,
        { credentials: 'include' }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch posts');

      setPosts(data.data || []);
      if (data.pagination) {
        setCurrentPage(data.pagination.page);
        setTotalPages(data.pagination.totalPages || 1);
        setTotalPosts(data.pagination.total || 0);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(1);
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    fetchPosts(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Image helpers ──────────────────────────────────────────────────────────
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImagePreview = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Create post — refresh page 1 so new post is visible ───────────────────
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    setCreateLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    if (imageFile) formData.append('image', imageFile);

    try {
      const response = await fetch(`${apiBaseUrl}/posts`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create post');

      setTitle('');
      setContent('');
      removeImagePreview();
      fetchPosts(1); // go back to page 1 to see the new post
    } catch (err) {
      setError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  // ── Delete post — go back a page if current page becomes empty ────────────
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      const response = await fetch(`${apiBaseUrl}/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to delete post');

      const remainingOnPage = posts.length - 1;
      const targetPage =
        remainingOnPage === 0 && currentPage > 1 ? currentPage - 1 : currentPage;
      fetchPosts(targetPage);
    } catch (err) {
      alert(err.message);
    }
  };

  // ── Edit helpers ───────────────────────────────────────────────────────────
  const startEditing = (post) => {
    setEditingPost(post);
    setEditTitle(post.title);
    setEditContent(post.content);
  };

  const handleUpdatePost = async (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editContent.trim()) {
      alert('Title and content cannot be empty');
      return;
    }

    setEditLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/posts/${editingPost._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: editTitle, content: editContent }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update post');

      setPosts((prev) =>
        prev.map((p) => (p._id === editingPost._id ? data.data : p))
      );
      setEditingPost(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  // ── Date helper ────────────────────────────────────────────────────────────
  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // ── Pagination pill renderer ───────────────────────────────────────────────
  const renderPagePills = () => {
    const pills = [];
    for (let page = 1; page <= totalPages; page++) {
      const isActive = page === currentPage;
      const nearCurrent = Math.abs(page - currentPage) <= 1;
      const isEdge = page === 1 || page === totalPages;

      if (!nearCurrent && !isEdge) {
        // Ellipsis slots
        if (page === 2 && currentPage > 3) {
          pills.push(
            <span key="el-start" style={{ color: 'var(--color-text-secondary)', padding: '0 4px' }}>…</span>
          );
        } else if (page === totalPages - 1 && currentPage < totalPages - 2) {
          pills.push(
            <span key="el-end" style={{ color: 'var(--color-text-secondary)', padding: '0 4px' }}>…</span>
          );
        }
        continue;
      }

      pills.push(
        <button
          key={page}
          onClick={() => handlePageChange(page)}
          className={isActive ? 'btn btn-primary' : 'btn btn-secondary'}
          style={{ width: '38px', padding: '8px 0', fontWeight: isActive ? '700' : '400' }}
        >
          {page}
        </button>
      );
    }
    return pills;
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="feed-container">

      {/* Create Post Card */}
      <form onSubmit={handleCreatePost} className="create-post-card">
        <h2 className="create-post-title">Create a Post</h2>

        <input
          type="text"
          placeholder="Title of your post..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="post-input-title"
          disabled={createLoading}
        />

        <textarea
          placeholder={`What's on your mind, ${user.name}?`}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="post-textarea"
          disabled={createLoading}
        />

        {imagePreview && (
          <div className="preview-container">
            <img src={imagePreview} alt="Upload Preview" className="preview-image" />
            <button type="button" className="remove-preview-btn" onClick={removeImagePreview} title="Remove image">
              <X size={16} />
            </button>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              ref={fileInputRef}
              style={{ display: 'none' }}
              id="post-image-file"
            />
            <label
              htmlFor="post-image-file"
              className="btn btn-secondary"
              style={{ padding: '8px 16px', fontSize: '0.85rem', width: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Image size={16} style={{ color: '#10b981' }} />
              <span>Add Image</span>
            </label>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: 'auto', padding: '8px 20px', fontSize: '0.85rem' }}
            disabled={createLoading}
          >
            {createLoading ? (
              <div className="spinner" style={{ width: '16px', height: '16px' }} />
            ) : (
              <><span>Post</span><Send size={14} /></>
            )}
          </button>
        </div>
      </form>

      {/* Error Banner */}
      {error && (
        <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Spinner */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="spinner" style={{ width: '32px', height: '32px', borderTopColor: '#3b82f6' }} />
        </div>
      )}

      {/* Empty State */}
      {!loading && posts.length === 0 && (
        <div className="post-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
          <FileText size={48} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
          <h3>No posts yet</h3>
          <p style={{ fontSize: '0.9rem', marginTop: '4px' }}>Be the first to share something with the circle!</p>
        </div>
      )}

      {/* Posts List */}
      {!loading && posts.map((post) => {
        const isAuthor = post.author && (post.author._id === user.id || post.author === user.id);
        return (
          <article key={post._id} className="post-card">
            {/* Header */}
            <div className="post-header">
              <div className="post-meta-info">
                <div className="user-avatar" style={{ fontSize: '0.85rem', width: '32px', height: '32px' }}>
                  {post.author?.name ? post.author.name[0].toUpperCase() : '?'}
                </div>
                <div className="post-author-details">
                  <span className="post-author-name">{post.author?.name || 'Anonymous User'}</span>
                  <span className="post-time" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} />
                    {formatDate(post.createdAt)}
                  </span>
                </div>
              </div>

              {isAuthor && (
                <div className="post-actions-menu">
                  <button onClick={() => startEditing(post)} className="btn-icon" title="Edit Post" style={{ width: '28px', height: '28px' }}>
                    <Edit3 size={15} />
                  </button>
                  <button onClick={() => handleDeletePost(post._id)} className="btn-icon" title="Delete Post" style={{ width: '28px', height: '28px', color: 'var(--color-danger)' }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="post-title-content">
              <h3 className="post-title">{post.title}</h3>
              <p className="post-content">{post.content}</p>
            </div>

            {/* Media */}
            {post.image && (
              <div className="post-media">
                <img
                  src={`${apiBaseUrl}/uploads/posts/${post.image}`}
                  alt={post.title}
                  className="post-media-image"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            )}
          </article>
        );
      })}

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '24px 0',
          flexWrap: 'wrap',
        }}>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="btn btn-secondary"
            style={{ width: 'auto', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <ChevronLeft size={16} /> Prev
          </button>

          {renderPagePills()}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="btn btn-secondary"
            style={{ width: 'auto', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Post Count Footer */}
      {!loading && totalPosts > 0 && (
        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-secondary)', paddingBottom: '16px' }}>
          Page {currentPage} of {totalPages} &middot; {totalPosts} post{totalPosts !== 1 ? 's' : ''} total
        </p>
      )}

      {/* Edit Post Modal */}
      {editingPost && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Edit Post</h3>
              <button className="btn-icon" onClick={() => setEditingPost(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdatePost} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Post Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="post-input-title"
                  disabled={editLoading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Post Content</label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="post-textarea"
                  style={{ minHeight: '120px' }}
                  disabled={editLoading}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setEditingPost(null)} className="btn btn-secondary" style={{ flex: 1 }} disabled={editLoading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={editLoading}>
                  {editLoading ? <div className="spinner" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
