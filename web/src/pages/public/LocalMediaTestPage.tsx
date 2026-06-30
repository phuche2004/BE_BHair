import React, { useState, useEffect } from 'react';

export default function LocalMediaTestPage() {
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = async () => {
    try {
      const response = await fetch('/api/v1/local-media');
      const result = await response.json();
      if (result.success) {
        setFiles(result.data);
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploading(true);
    setError(null);
    
    const formData = new FormData();
    for (let i = 0; i < e.target.files.length; i++) {
      formData.append('files', e.target.files[i]);
    }

    try {
      const response = await fetch('/api/v1/local-media/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (result.success) {
        fetchFiles(); // refresh list
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = ''; // clear input
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1>Local Media Test (Termux)</h1>
      
      <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h3>Upload Files</h3>
        <input 
          type="file" 
          multiple 
          onChange={handleUpload} 
          disabled={uploading}
          accept="image/*,video/*"
        />
        {uploading && <p>Uploading...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
        {files.map((file, index) => {
          const isVideo = file.filename.match(/\.(mp4|webm|ogg)$/i);
          return (
            <div key={index} style={{ border: '1px solid #eee', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
              {isVideo ? (
                <video 
                  src={file.url} 
                  controls 
                  style={{ width: '100%', height: '150px', objectFit: 'contain', backgroundColor: '#000' }}
                />
              ) : (
                <img 
                  src={file.url} 
                  alt={file.filename} 
                  style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                  loading="lazy"
                />
              )}
              <div style={{ marginTop: '10px', fontSize: '12px', wordBreak: 'break-all' }}>
                {file.filename}
              </div>
              <div style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </div>
              <a 
                href={file.downloadUrl} 
                style={{
                  display: 'inline-block',
                  marginTop: '10px',
                  padding: '5px 10px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              >
                Download
              </a>
            </div>
          );
        })}
        {files.length === 0 && !uploading && <p>No files found.</p>}
      </div>
    </div>
  );
}
