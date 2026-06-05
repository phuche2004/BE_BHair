import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { shopApi } from '../../api/shop.api';
import { useAuthStore } from '../../store/useAuthStore';
import { Shop } from '../../types';
import { SAMPLE_IMAGES } from '../../utils/format';

export default function MyShopsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const res = await shopApi.getMyShops();
        setShops(res.data || res.metadata || res || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchShops();
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div className="brand">B_Hair</div>
          <div className="brand-divider" />
          <div className="page-title">Tiệm của tôi</div>
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
              const image = shop.images?.[0] || shop.images1?.[0] || SAMPLE_IMAGES[0];
              return (
                <div 
                  key={shop._id} 
                  className="card" 
                  onClick={() => {
                    // Cập nhật store nếu cần, rồi chuyển hướng
                    navigate(`/manager/appointments`);
                  }} 
                  style={{ cursor: 'pointer', border: '1px solid var(--border)' }}
                >
                  <div className="shop-card-img-wrap" style={{ aspectRatio: '16/8' }}>
                    <img src={image} alt={shop.name} className="shop-card-img" style={{ aspectRatio: '16/8' }} />
                  </div>
                  <div style={{ padding: '12px 16px' }}>
                    <div className="shop-card-name">{shop.name}</div>
                    <div className="shop-card-address">📍 {shop.address}</div>
                    <div style={{ marginTop: 8, fontSize: 13, color: 'var(--color-secondary)', fontWeight: 600 }}>
                      Quản lý lịch hẹn →
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
