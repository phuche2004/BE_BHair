import React, { useState, useEffect, useRef } from 'react';
import axiosInstance, { API_URL } from '../../api';

// --- Icons (Inline SVG) ---
const FolderIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="#F6C23E" stroke="#d4a32a" strokeWidth="1">
    <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
  </svg>
);
const FileIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="#a0aec0">
    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
  </svg>
);
const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);
const MoreIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="5" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="12" cy="19" r="2" />
  </svg>
);

export default function CloudStoragePage() {
  const [items, setItems] = useState<any[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [actionMenu, setActionMenu] = useState<{ id: string, x: number, y: number, item: any } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const baseUrl = API_URL.replace(/\/api\/v1\/?$/, '');

  const fetchFiles = async (path = '') => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get('/local-media', { params: { path } });
      if (res.data.success) {
        setItems(res.data.data);
        setCurrentPath(res.data.currentPath || '');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles(currentPath);
  }, [currentPath]);

  // --- Handlers ---
  const handleItemClick = (item: any) => {
    if (item.isDir) {
      setCurrentPath(item.relativePath);
    } else {
      setPreviewFile(item);
    }
  };

  const handleGoBack = () => {
    if (!currentPath) return;
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    setCurrentPath(parts.join('/'));
  };

  const handleBreadcrumb = (index: number) => {
    const parts = currentPath.split('/').filter(Boolean);
    const target = parts.slice(0, index + 1).join('/');
    setCurrentPath(target);
  };

  const handleCreateFolder = async () => {
    const name = window.prompt('Enter folder name:');
    if (!name) return;
    try {
      await axiosInstance.post('/local-media/folder', { path: currentPath, name });
      fetchFiles(currentPath);
    } catch (err: any) {
      alert('Error creating folder: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const formData = new FormData();
    for (let i = 0; i < e.target.files.length; i++) {
      formData.append('media', e.target.files[i]);
    }

    try {
      setLoading(true);
      await axiosInstance.post(`/local-media/upload?path=${encodeURIComponent(currentPath)}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchFiles(currentPath);
    } catch (err: any) {
      alert('Upload error: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // --- Actions ---
  const closeActionMenu = () => setActionMenu(null);

  const handleDelete = async (item: any) => {
    closeActionMenu();
    if (!window.confirm(`Are you sure you want to delete ${item.filename}?`)) return;
    try {
      await axiosInstance.delete('/local-media', { data: { path: item.relativePath } });
      fetchFiles(currentPath);
    } catch (err: any) {
      alert('Error deleting: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleRename = async (item: any) => {
    closeActionMenu();
    const newName = window.prompt(`Rename ${item.filename} to:`, item.filename);
    if (!newName || newName === item.filename) return;
    try {
      await axiosInstance.put('/local-media/rename', { path: item.relativePath, newName });
      fetchFiles(currentPath);
    } catch (err: any) {
      alert('Error renaming: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDownload = (item: any) => {
    closeActionMenu();
    window.location.href = item.downloadUrl;
  };

  // --- Render ---
  const breadcrumbs = currentPath.split('/').filter(Boolean);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      {/* Header / Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ margin: 0 }}>My Cloud Storage</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={handleCreateFolder}
            style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
          >
            + New Folder
          </button>
          <button 
            onClick={handleUploadClick}
            style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#0066ff', color: '#fff', cursor: 'pointer' }}
          >
            Upload Files
          </button>
          <input 
            type="file" 
            multiple 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
          />
        </div>
      </div>

      {/* Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', padding: '12px', background: '#f8f9fa', borderRadius: '8px', gap: '8px' }}>
        {currentPath !== '' && (
          <button onClick={handleGoBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <BackIcon />
          </button>
        )}
        <span onClick={() => setCurrentPath('')} style={{ cursor: 'pointer', fontWeight: currentPath === '' ? 'bold' : 'normal', color: '#0066ff' }}>
          Home
        </span>
        {breadcrumbs.map((part, index) => (
          <React.Fragment key={index}>
            <span style={{ color: '#888' }}>/</span>
            <span 
              onClick={() => handleBreadcrumb(index)}
              style={{ cursor: 'pointer', fontWeight: index === breadcrumbs.length - 1 ? 'bold' : 'normal', color: '#0066ff' }}
            >
              {part}
            </span>
          </React.Fragment>
        ))}
      </div>

      {error && <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}

      {/* File List */}
      {loading && items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
          gap: '20px' 
        }}>
          {items.map((item, i) => {
            const isVideo = item.filename.match(/\.(mp4|webm|ogg|mov)$/i);
            const isImage = item.filename.match(/\.(jpg|jpeg|png|gif|webp)$/i);
            
            return (
              <div 
                key={i} 
                style={{ 
                  border: '1px solid #eaeaea', 
                  borderRadius: '8px', 
                  padding: '12px', 
                  position: 'relative',
                  background: '#fff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  transition: 'transform 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
              >
                {/* Action button */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    setActionMenu({ id: item.filename, x: rect.left, y: rect.bottom, item });
                  }}
                  style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#666', zIndex: 2 }}
                >
                  <MoreIcon />
                </button>

                {/* Content */}
                <div onClick={() => handleItemClick(item)} style={{ textAlign: 'center', paddingTop: '10px' }}>
                  {item.isDir ? (
                    <FolderIcon />
                  ) : isImage ? (
                    <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={`${baseUrl}${item.url}`} alt={item.filename} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} loading="lazy" />
                    </div>
                  ) : isVideo ? (
                    <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', borderRadius: '4px' }}>
                      <video src={`${baseUrl}${item.url}`} style={{ maxWidth: '100%', maxHeight: '100%' }} />
                    </div>
                  ) : (
                    <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileIcon />
                    </div>
                  )}

                  <div style={{ marginTop: '12px', fontSize: '14px', fontWeight: '500', color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.filename}
                  </div>
                  {!item.isDir && (
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                      {(item.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {items.length === 0 && !loading && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: '#888' }}>
              This folder is empty.
            </div>
          )}
        </div>
      )}

      {/* Action Menu (Context Menu) */}
      {actionMenu && (
        <>
          <div 
            onClick={closeActionMenu}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }}
          />
          <div style={{ 
            position: 'fixed', 
            top: actionMenu.y + 'px', 
            left: actionMenu.x - 100 + 'px', 
            background: '#fff', 
            border: '1px solid #ddd', 
            borderRadius: '6px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 100,
            padding: '4px 0',
            minWidth: '120px'
          }}>
            <div onClick={() => handleRename(actionMenu.item)} style={{ padding: '8px 16px', cursor: 'pointer', fontSize: '14px' }}>Rename</div>
            {!actionMenu.item.isDir && (
              <div onClick={() => handleDownload(actionMenu.item)} style={{ padding: '8px 16px', cursor: 'pointer', fontSize: '14px' }}>Download</div>
            )}
            <div onClick={() => handleDelete(actionMenu.item)} style={{ padding: '8px 16px', cursor: 'pointer', fontSize: '14px', color: 'red' }}>Delete</div>
          </div>
        </>
      )}

      {/* Preview Modal */}
      {previewFile && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.9)', zIndex: 1000,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center'
          }}
          onClick={() => setPreviewFile(null)}
        >
          <div style={{ position: 'absolute', top: '20px', right: '30px', color: '#fff', fontSize: '30px', cursor: 'pointer' }}>&times;</div>
          
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {previewFile.filename.match(/\.(mp4|webm|ogg|mov)$/i) ? (
              <video src={`${baseUrl}${previewFile.url}`} controls autoPlay style={{ maxWidth: '100%', maxHeight: '100%', outline: 'none' }} />
            ) : previewFile.filename.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
              <img src={`${baseUrl}${previewFile.url}`} alt={previewFile.filename} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            ) : (
              <div style={{ color: '#fff' }}>Preview not available for this file type.</div>
            )}
          </div>
          
          <div style={{ color: '#fff', marginTop: '20px', fontSize: '18px', textAlign: 'center' }}>
            {previewFile.filename}
            <div style={{ fontSize: '14px', color: '#bbb', marginTop: '8px' }}>
              {(previewFile.size / 1024 / 1024).toFixed(2)} MB &nbsp;
              <a href={previewFile.downloadUrl} style={{ color: '#0066ff', textDecoration: 'none', marginLeft: '10px' }} onClick={(e) => e.stopPropagation()}>Download</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
