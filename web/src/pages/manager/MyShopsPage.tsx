import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { shopApi } from '../../api/shop.api';
import { useAuthStore } from '../../store/useAuthStore';
import { useGeolocation } from '../../hooks/useGeolocation';
import { Shop } from '../../types';

export default function MyShopsPage() {
  const navigate = useNavigate();
  const { user, token, login } = useAuthStore();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal create shop state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'BOTH'>('BOTH');
  const [lat, setLat] = useState('');
  const [long, setLong] = useState('');
  const [images1Files, setImages1Files] = useState<FileList | null>(null);
  const [images2Files, setImages2Files] = useState<FileList | null>(null);
  const [images3Files, setImages3Files] = useState<FileList | null>(null);
  const [videosFiles, setVideosFiles] = useState<FileList | null>(null);
  const [images1Previews, setImages1Previews] = useState<string[]>([]);
  const [images2Previews, setImages2Previews] = useState<string[]>([]);
  const [images3Previews, setImages3Previews] = useState<string[]>([]);
  const [videosPreviews, setVideosPreviews] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // Modal edit shop state
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editGender, setEditGender] = useState<'MALE' | 'FEMALE' | 'BOTH'>('BOTH');
  const [editLat, setEditLat] = useState('');
  const [editLong, setEditLong] = useState('');
  const [editImages1Files, setEditImages1Files] = useState<FileList | null>(null);
  const [editImages2Files, setEditImages2Files] = useState<FileList | null>(null);
  const [editImages3Files, setEditImages3Files] = useState<FileList | null>(null);
  const [editVideosFiles, setEditVideosFiles] = useState<FileList | null>(null);
  const [editImages1Previews, setEditImages1Previews] = useState<string[]>([]);
  const [editImages2Previews, setEditImages2Previews] = useState<string[]>([]);
  const [editImages3Previews, setEditImages3Previews] = useState<string[]>([]);
  const [editVideosPreviews, setEditVideosPreviews] = useState<string[]>([]);
  const [deleteUrls, setDeleteUrls] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const { lat: geoLat, long: geoLong, loading: geoLoading, error: geoError, getLocation } = useGeolocation();

  // Create geolocation auto fill
  useEffect(() => {
    if (geoLat !== null) {
      if (editingShop) {
        setEditLat(geoLat.toString());
      } else {
        setLat(geoLat.toString());
      }
    }
    if (geoLong !== null) {
      if (editingShop) {
        setEditLong(geoLong.toString());
      } else {
        setLong(geoLong.toString());
      }
    }
  }, [geoLat, geoLong, editingShop]);

  useEffect(() => {
    if (!showCreateModal) {
      images1Previews.forEach(url => URL.revokeObjectURL(url));
      images2Previews.forEach(url => URL.revokeObjectURL(url));
      images3Previews.forEach(url => URL.revokeObjectURL(url));
      videosPreviews.forEach(url => URL.revokeObjectURL(url));
      
      setImages1Files(null);
      setImages2Files(null);
      setImages3Files(null);
      setVideosFiles(null);
      
      setImages1Previews([]);
      setImages2Previews([]);
      setImages3Previews([]);
      setVideosPreviews([]);
    }
  }, [showCreateModal]);

  useEffect(() => {
    if (!editingShop) {
      editImages1Previews.forEach(url => URL.revokeObjectURL(url));
      editImages2Previews.forEach(url => URL.revokeObjectURL(url));
      editImages3Previews.forEach(url => URL.revokeObjectURL(url));
      editVideosPreviews.forEach(url => URL.revokeObjectURL(url));
      
      setEditImages1Files(null);
      setEditImages2Files(null);
      setEditImages3Files(null);
      setEditVideosFiles(null);
      
      setEditImages1Previews([]);
      setEditImages2Previews([]);
      setEditImages3Previews([]);
      setEditVideosPreviews([]);
    }
  }, [editingShop]);

  const handleFileChange = (
    files: FileList | null,
    oldPreviews: string[],
    setFiles: (f: FileList | null) => void,
    setPreviews: (p: string[]) => void
  ) => {
    oldPreviews.forEach(url => URL.revokeObjectURL(url));
    setFiles(files);
    if (!files) {
      setPreviews([]);
      return;
    }
    const urls = Array.from(files).map(file => URL.createObjectURL(file));
    setPreviews(urls);
  };

  const clearFileInput = (
    setFiles: (f: FileList | null) => void,
    previews: string[],
    setPreviews: (p: string[]) => void
  ) => {
    previews.forEach(url => URL.revokeObjectURL(url));
    setFiles(null);
    setPreviews([]);
  };

  const fetchShops = async () => {
    try {
      setLoading(true);
      const res = await shopApi.getMyShops();
      setShops(res.data || res.metadata || res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  const handleOpenEditModal = (shop: Shop) => {
    setEditingShop(shop);
    setEditName(shop.name);
    setEditAddress(shop.address);
    setEditPhone(shop.phone || '');
    setEditGender(shop.gender || 'BOTH');
    
    const coords = shop.location?.coordinates;
    if (coords && coords.length === 2) {
      setEditLong(coords[0].toString());
      setEditLat(coords[1].toString());
    } else {
      setEditLong('');
      setEditLat('');
    }
    
    setEditImages1Files(null);
    setEditImages2Files(null);
    setEditImages3Files(null);
    setEditVideosFiles(null);
    setDeleteUrls([]);
    setEditError('');
  };

  const toggleDeleteUrl = (url: string) => {
    setDeleteUrls(prev => 
      prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
    );
  };

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !address.trim() || !phone.trim()) {
      setError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    setCreating(true);
    try {
      const parsedLat = parseFloat(lat) || 0;
      const parsedLong = parseFloat(long) || 0;
      
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('address', address.trim());
      formData.append('phone', phone.trim());
      formData.append('gender', gender);
      formData.append('coordinates', JSON.stringify([parsedLong, parsedLat]));

      if (images1Files) {
        for (let i = 0; i < images1Files.length; i++) {
          formData.append('images1', images1Files[i]);
        }
      }
      if (images2Files) {
        for (let i = 0; i < images2Files.length; i++) {
          formData.append('images2', images2Files[i]);
        }
      }
      if (images3Files) {
        for (let i = 0; i < images3Files.length; i++) {
          formData.append('images3', images3Files[i]);
        }
      }
      if (videosFiles) {
        for (let i = 0; i < videosFiles.length; i++) {
          formData.append('videos', videosFiles[i]);
        }
      }

      await shopApi.createShop(formData);
      
      // Reset form
      setName('');
      setAddress('');
      setPhone('');
      setGender('BOTH');
      setLat('');
      setLong('');
      setImages1Files(null);
      setImages2Files(null);
      setImages3Files(null);
      setVideosFiles(null);
      setShowCreateModal(false);

      // Refresh list
      await fetchShops();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Không thể tạo tiệm. Vui lòng thử lại.');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');

    if (!editingShop) return;
    if (!editName.trim() || !editAddress.trim() || !editPhone.trim()) {
      setEditError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    setSaving(true);
    try {
      const parsedLat = parseFloat(editLat) || 0;
      const parsedLong = parseFloat(editLong) || 0;
      
      const formData = new FormData();
      formData.append('name', editName.trim());
      formData.append('address', editAddress.trim());
      formData.append('phone', editPhone.trim());
      formData.append('gender', editGender);
      formData.append('coordinates', JSON.stringify([parsedLong, parsedLat]));

      if (deleteUrls.length > 0) {
        formData.append('deleteUrls', JSON.stringify(deleteUrls));
      }

      if (editImages1Files) {
        for (let i = 0; i < editImages1Files.length; i++) {
          formData.append('images1', editImages1Files[i]);
        }
      }
      if (editImages2Files) {
        for (let i = 0; i < editImages2Files.length; i++) {
          formData.append('images2', editImages2Files[i]);
        }
      }
      if (editImages3Files) {
        for (let i = 0; i < editImages3Files.length; i++) {
          formData.append('images3', editImages3Files[i]);
        }
      }
      if (editVideosFiles) {
        for (let i = 0; i < editVideosFiles.length; i++) {
          formData.append('videos', editVideosFiles[i]);
        }
      }

      await shopApi.updateShop(editingShop.id || editingShop._id!, formData);
      setEditingShop(null);
      await fetchShops();
    } catch (err: any) {
      console.error(err);
      setEditError(err.response?.data?.message || err.message || 'Không thể cập nhật tiệm. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div className="brand">B_Hair</div>
            <div className="brand-divider" />
            <div className="page-title">Tiệm của tôi</div>
          </div>
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => setShowCreateModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span>➕</span> Tạo tiệm mới
          </button>
        </div>
      </div>

      <div className="section" style={{ paddingTop: 16 }}>
        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : shops.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon-bg">🏬</div>
            <div className="empty-title">Bạn chưa có tiệm nào</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {shops.map(shop => {
              const image = shop.images?.[0] || shop.images1?.[0];
              return (
                <div 
                  key={shop.id} 
                  className="card" 
                  style={{ border: '1px solid var(--border)', position: 'relative' }}
                >
                  {/* Edit Shop Icon */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditModal(shop);
                    }}
                    style={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      zIndex: 5,
                      background: 'rgba(255,255,255,0.9)',
                      backdropFilter: 'blur(4px)',
                      border: 'none',
                      borderRadius: '50%',
                      width: 38,
                      height: 38,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}
                    title="Chỉnh sửa tiệm"
                  >
                    ✏️
                  </button>

                  <div
                    onClick={() => {
                      if (user && token) {
                        login({ ...user, shopId: shop.id || shop._id }, token);
                      }
                      handleOpenEditModal(shop);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {image ? (
                      <div className="shop-card-img-wrap" style={{ aspectRatio: '16/8' }}>
                        <img src={image} alt={shop.name} className="shop-card-img" style={{ aspectRatio: '16/8' }} />
                      </div>
                    ) : (
                      <div style={{
                        aspectRatio: '16/8',
                        background: 'linear-gradient(135deg, var(--surface-alt) 0%, var(--border) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 32,
                        borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0'
                      }}>
                        🏬
                      </div>
                    )}
                    <div style={{ padding: '12px 16px' }}>
                      <div className="shop-card-name">{shop.name}</div>
                      <div className="shop-card-address">📍 {shop.address}</div>
                      <div style={{ marginTop: 8, fontSize: 13, color: 'var(--color-secondary)', fontWeight: 600 }}>
                        Quản lý tiệm →
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal tạo tiệm mới */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90dvh', overflowY: 'auto' }}>
            <div className="modal-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontFamily: 'var(--font-headline)' }}>Tạo tiệm mới</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ fontSize: 20, color: 'var(--text-muted)' }}>✕</button>
            </div>

            <form onSubmit={handleCreateShop}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Tên tiệm */}
                <div className="input-group">
                  <label className="input-label">Tên tiệm *</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Nhập tên tiệm cắt tóc"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                {/* Địa chỉ */}
                <div className="input-group">
                  <label className="input-label">Địa chỉ *</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Nhập địa chỉ chi tiết"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>

                {/* Số điện thoại */}
                <div className="input-group">
                  <label className="input-label">Số điện thoại *</label>
                  <input
                    type="tel"
                    className="input"
                    placeholder="Nhập số điện thoại của tiệm"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>

                {/* Giới tính */}
                <div className="input-group">
                  <label className="input-label">Đối tượng phục vụ</label>
                  <div className="segment">
                    <button
                      type="button"
                      className={`segment-btn${gender === 'BOTH' ? ' active' : ''}`}
                      onClick={() => setGender('BOTH')}
                    >
                      Cả hai
                    </button>
                    <button
                      type="button"
                      className={`segment-btn${gender === 'MALE' ? ' active' : ''}`}
                      onClick={() => setGender('MALE')}
                    >
                      Nam
                    </button>
                    <button
                      type="button"
                      className={`segment-btn${gender === 'FEMALE' ? ' active' : ''}`}
                      onClick={() => setGender('FEMALE')}
                    >
                      Nữ
                    </button>
                  </div>
                </div>

                {/* Tọa độ */}
                <div style={{ display: 'flex', gap: 12 }}>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label className="input-label">Kinh độ (Long)</label>
                    <input
                      type="number"
                      step="any"
                      className="input"
                      placeholder="0.0"
                      value={long}
                      onChange={(e) => setLong(e.target.value)}
                    />
                  </div>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label className="input-label">Vĩ độ (Lat)</label>
                    <input
                      type="number"
                      step="any"
                      className="input"
                      placeholder="0.0"
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={getLocation}
                  disabled={geoLoading}
                  style={{ fontSize: 13, padding: '10px 14px' }}
                >
                  📍 {geoLoading ? 'Đang lấy vị trí...' : 'Lấy tọa độ hiện tại'}
                </button>
                
                {geoError && (
                  <div style={{ fontSize: 12, color: 'var(--error)' }}>
                    Lỗi GPS: {geoError}
                  </div>
                )}

                {/* File Uploads */}
                <div className="input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="input-label">Ảnh bìa (images1)</label>
                    {images1Previews.length > 0 && (
                      <button
                        type="button"
                        onClick={() => clearFileInput(setImages1Files, images1Previews, setImages1Previews)}
                        style={{ fontSize: 12, color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        Xóa chọn
                      </button>
                    )}
                  </div>
                  <label className="file-upload-dropzone">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e.target.files, images1Previews, setImages1Files, setImages1Previews)}
                      style={{ display: 'none' }}
                    />
                    <div className="dropzone-content">
                      <span className="dropzone-text">Chọn ảnh bìa</span>
                      <span className="dropzone-subtext">Hỗ trợ JPG, PNG, WEBP</span>
                    </div>
                  </label>
                  {images1Previews.length > 0 && (
                    <div className="preview-grid">
                      {images1Previews.map((url, idx) => (
                        <div key={idx} className="preview-item">
                          <img src={url} className="preview-media" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="input-label">Ảnh giới thiệu / Album ảnh (images2)</label>
                    {images2Previews.length > 0 && (
                      <button
                        type="button"
                        onClick={() => clearFileInput(setImages2Files, images2Previews, setImages2Previews)}
                        style={{ fontSize: 12, color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        Xóa chọn
                      </button>
                    )}
                  </div>
                  <label className="file-upload-dropzone">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleFileChange(e.target.files, images2Previews, setImages2Files, setImages2Previews)}
                      style={{ display: 'none' }}
                    />
                    <div className="dropzone-content">
                      <span className="dropzone-text">Chọn ảnh album giới thiệu</span>
                      <span className="dropzone-subtext">Hỗ trợ nhiều ảnh</span>
                    </div>
                  </label>
                  {images2Previews.length > 0 && (
                    <div className="preview-grid">
                      {images2Previews.map((url, idx) => (
                        <div key={idx} className="preview-item">
                          <img src={url} className="preview-media" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="input-label">Video giới thiệu</label>
                    {videosPreviews.length > 0 && (
                      <button
                        type="button"
                        onClick={() => clearFileInput(setVideosFiles, videosPreviews, setVideosPreviews)}
                        style={{ fontSize: 12, color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        Xóa chọn
                      </button>
                    )}
                  </div>
                  <label className="file-upload-dropzone">
                    <input
                      type="file"
                      accept="video/*"
                      multiple
                      onChange={(e) => handleFileChange(e.target.files, videosPreviews, setVideosFiles, setVideosPreviews)}
                      style={{ display: 'none' }}
                    />
                    <div className="dropzone-content">
                      <span className="dropzone-text">Chọn video giới thiệu</span>
                      <span className="dropzone-subtext">Hỗ trợ nhiều video MP4, WEBM</span>
                    </div>
                  </label>
                  {videosPreviews.length > 0 && (
                    <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(46, 204, 113, 0.1)', border: '1px dashed rgba(46, 204, 113, 0.3)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: '#2ecc71', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>✔️</span> Đã chọn {videosPreviews.length} video giới thiệu thành công.
                    </div>
                  )}
                </div>

                {/* Báo lỗi */}
                {error && (
                  <div style={{ padding: '10px 14px', background: 'rgba(192,57,43,0.1)', color: 'var(--error)', borderRadius: 'var(--radius-md)', fontSize: 13 }}>
                    ⚠️ {error}
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setShowCreateModal(false)}
                    style={{ flex: 1 }}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={creating}
                    style={{ flex: 1 }}
                  >
                    {creating ? 'Đang tạo...' : 'Tạo tiệm'}
                  </button>
                </div>

              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal chỉnh sửa tiệm */}
      {editingShop && (
        <div className="modal-overlay" onClick={() => setEditingShop(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90dvh', overflowY: 'auto' }}>
            <div className="modal-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontFamily: 'var(--font-headline)' }}>Chỉnh sửa tiệm</h3>
              <button onClick={() => setEditingShop(null)} style={{ fontSize: 20, color: 'var(--text-muted)' }}>✕</button>
            </div>

            <form onSubmit={handleUpdateShop}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Tên tiệm */}
                <div className="input-group">
                  <label className="input-label">Tên tiệm *</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Nhập tên tiệm cắt tóc"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>

                {/* Địa chỉ */}
                <div className="input-group">
                  <label className="input-label">Địa chỉ *</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Nhập địa chỉ chi tiết"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    required
                  />
                </div>

                {/* Số điện thoại */}
                <div className="input-group">
                  <label className="input-label">Số điện thoại *</label>
                  <input
                    type="tel"
                    className="input"
                    placeholder="Nhập số điện thoại của tiệm"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    required
                  />
                </div>

                {/* Giới tính */}
                <div className="input-group">
                  <label className="input-label">Đối tượng phục vụ</label>
                  <div className="segment">
                    <button
                      type="button"
                      className={`segment-btn${editGender === 'BOTH' ? ' active' : ''}`}
                      onClick={() => setEditGender('BOTH')}
                    >
                      Cả hai
                    </button>
                    <button
                      type="button"
                      className={`segment-btn${editGender === 'MALE' ? ' active' : ''}`}
                      onClick={() => setEditGender('MALE')}
                    >
                      Nam
                    </button>
                    <button
                      type="button"
                      className={`segment-btn${editGender === 'FEMALE' ? ' active' : ''}`}
                      onClick={() => setEditGender('FEMALE')}
                    >
                      Nữ
                    </button>
                  </div>
                </div>

                {/* Tọa độ */}
                <div style={{ display: 'flex', gap: 12 }}>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label className="input-label">Kinh độ (Long)</label>
                    <input
                      type="number"
                      step="any"
                      className="input"
                      placeholder="0.0"
                      value={editLong}
                      onChange={(e) => setEditLong(e.target.value)}
                    />
                  </div>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label className="input-label">Vĩ độ (Lat)</label>
                    <input
                      type="number"
                      step="any"
                      className="input"
                      placeholder="0.0"
                      value={editLat}
                      onChange={(e) => setEditLat(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={getLocation}
                  disabled={geoLoading}
                  style={{ fontSize: 13, padding: '10px 14px' }}
                >
                  📍 {geoLoading ? 'Đang lấy vị trí...' : 'Lấy tọa độ hiện tại'}
                </button>
                
                {geoError && (
                  <div style={{ fontSize: 12, color: 'var(--error)' }}>
                    Lỗi GPS: {geoError}
                  </div>
                )}

                {/* Existing media list */}
                {((editingShop.images1?.length || 0) + 
                  (editingShop.images2?.length || 0) + 
                  (editingShop.images3?.length || 0) + 
                  (editingShop.videos?.length || 0)) > 0 && (
                  <div className="input-group">
                    <label className="input-label">Ảnh/Video hiện tại (Nhấp 🗑️ để đánh dấu xóa)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                      {editingShop.images1?.map((url: string) => {
                        const isDeleted = deleteUrls.includes(url);
                        return (
                          <div key={url} style={{ position: 'relative', aspectRatio: '1', opacity: isDeleted ? 0.3 : 1 }}>
                            <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                            <button
                              type="button"
                              onClick={() => toggleDeleteUrl(url)}
                              style={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                background: isDeleted ? 'var(--color-primary)' : 'var(--error)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '50%',
                                width: 28,
                                height: 28,
                                fontSize: 13,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                              }}
                            >
                              {isDeleted ? '↺' : '🗑️'}
                            </button>
                          </div>
                        );
                      })}
                      {editingShop.images2?.map((url: string) => {
                        const isDeleted = deleteUrls.includes(url);
                        return (
                          <div key={url} style={{ position: 'relative', aspectRatio: '1', opacity: isDeleted ? 0.3 : 1 }}>
                            <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                            <button
                              type="button"
                              onClick={() => toggleDeleteUrl(url)}
                              style={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                background: isDeleted ? 'var(--color-primary)' : 'var(--error)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '50%',
                                width: 28,
                                height: 28,
                                fontSize: 13,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                              }}
                            >
                              {isDeleted ? '↺' : '🗑️'}
                            </button>
                          </div>
                        );
                      })}
                      {editingShop.images3?.map((url: string) => {
                        const isDeleted = deleteUrls.includes(url);
                        return (
                          <div key={url} style={{ position: 'relative', aspectRatio: '1', opacity: isDeleted ? 0.3 : 1 }}>
                            <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                            <button
                              type="button"
                              onClick={() => toggleDeleteUrl(url)}
                              style={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                background: isDeleted ? 'var(--color-primary)' : 'var(--error)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '50%',
                                width: 28,
                                height: 28,
                                fontSize: 13,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                              }}
                            >
                              {isDeleted ? '↺' : '🗑️'}
                            </button>
                          </div>
                        );
                      })}
                      {editingShop.videos?.map((url: string) => {
                        const isDeleted = deleteUrls.includes(url);
                        return (
                          <div key={url} style={{ position: 'relative', aspectRatio: '1', opacity: isDeleted ? 0.3 : 1 }}>
                            <video src={url} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                            <button
                              type="button"
                              onClick={() => toggleDeleteUrl(url)}
                              style={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                background: isDeleted ? 'var(--color-primary)' : 'var(--error)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '50%',
                                width: 28,
                                height: 28,
                                fontSize: 13,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                              }}
                            >
                              {isDeleted ? '↺' : '🗑️'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Upload new media files */}
                <div className="input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="input-label">Thêm ảnh bìa mới (images1)</label>
                    {editImages1Previews.length > 0 && (
                      <button
                        type="button"
                        onClick={() => clearFileInput(setEditImages1Files, editImages1Previews, setEditImages1Previews)}
                        style={{ fontSize: 12, color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        Xóa chọn
                      </button>
                    )}
                  </div>
                  <label className="file-upload-dropzone">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e.target.files, editImages1Previews, setEditImages1Files, setEditImages1Previews)}
                      style={{ display: 'none' }}
                    />
                    <div className="dropzone-content">
                      <span className="dropzone-text">Chọn ảnh bìa mới</span>
                      <span className="dropzone-subtext">Hỗ trợ JPG, PNG, WEBP</span>
                    </div>
                  </label>
                  {editImages1Previews.length > 0 && (
                    <div className="preview-grid">
                      {editImages1Previews.map((url, idx) => (
                        <div key={idx} className="preview-item">
                          <img src={url} className="preview-media" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="input-label">Thêm ảnh giới thiệu / Album ảnh mới (images2)</label>
                    {editImages2Previews.length > 0 && (
                      <button
                        type="button"
                        onClick={() => clearFileInput(setEditImages2Files, editImages2Previews, setEditImages2Previews)}
                        style={{ fontSize: 12, color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        Xóa chọn
                      </button>
                    )}
                  </div>
                  <label className="file-upload-dropzone">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleFileChange(e.target.files, editImages2Previews, setEditImages2Files, setEditImages2Previews)}
                      style={{ display: 'none' }}
                    />
                    <div className="dropzone-content">
                      <span className="dropzone-text">Chọn ảnh album giới thiệu mới</span>
                      <span className="dropzone-subtext">Hỗ trợ nhiều ảnh</span>
                    </div>
                  </label>
                  {editImages2Previews.length > 0 && (
                    <div className="preview-grid">
                      {editImages2Previews.map((url, idx) => (
                        <div key={idx} className="preview-item">
                          <img src={url} className="preview-media" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="input-label">Thêm video giới thiệu mới</label>
                    {editVideosPreviews.length > 0 && (
                      <button
                        type="button"
                        onClick={() => clearFileInput(setEditVideosFiles, editVideosPreviews, setEditVideosPreviews)}
                        style={{ fontSize: 12, color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        Xóa chọn
                      </button>
                    )}
                  </div>
                  <label className="file-upload-dropzone">
                    <input
                      type="file"
                      accept="video/*"
                      multiple
                      onChange={(e) => handleFileChange(e.target.files, editVideosPreviews, setEditVideosFiles, setEditVideosPreviews)}
                      style={{ display: 'none' }}
                    />
                    <div className="dropzone-content">
                      <span className="dropzone-text">Chọn video giới thiệu mới</span>
                      <span className="dropzone-subtext">Hỗ trợ nhiều video MP4, WEBM</span>
                    </div>
                  </label>
                  {editVideosPreviews.length > 0 && (
                    <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(46, 204, 113, 0.1)', border: '1px dashed rgba(46, 204, 113, 0.3)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: '#2ecc71', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>✔️</span> Đã chọn {editVideosPreviews.length} video giới thiệu mới thành công.
                    </div>
                  )}
                </div>



                {/* Báo lỗi */}
                {editError && (
                  <div style={{ padding: '10px 14px', background: 'rgba(192,57,43,0.1)', color: 'var(--error)', borderRadius: 'var(--radius-md)', fontSize: 13 }}>
                    ⚠️ {editError}
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setEditingShop(null)}
                    style={{ flex: 1 }}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                    style={{ flex: 1 }}
                  >
                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>

              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
