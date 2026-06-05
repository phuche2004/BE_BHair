import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { shopApi } from '../../api/shop.api';
import { useAuthStore } from '../../store/useAuthStore';
import { useTranslation } from '../../hooks/useTranslation';
import { Shop } from '../../types';
import { SAMPLE_IMAGES } from '../../utils/format';

export default function HomePage() {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'MANAGER' || user?.role === 'ADMIN') {
      navigate('/manager/appointments', { replace: true });
    } else if (user?.role === 'STAFF') {
      navigate('/staff/appointments', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const data = await shopApi.getAllShops();
        setShops(data.data || data);
      } catch (error) {
        console.error('Failed to fetch shops', error);
      } finally {
        setLoading(false);
      }
    };
    fetchShops();
  }, []);

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div className="brand">B_Hair</div>
          <div className="brand-divider" />
          <div className="page-title">{t('tabs.home')}</div>
        </div>
      </div>

      <div className="section" style={{ paddingTop: 16 }}>
        {/* Greeting */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            {t('home.welcome')} {user?.fullName || t('auth.customer')}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-headline)' }}>
            {t('home.findCut')}
          </div>
        </div>

        {/* Search Bar */}
        <div 
          className="search-bar" 
          style={{ marginBottom: 24, cursor: 'text' }}
          onClick={() => navigate('/search')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--outline)' }}>
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <span style={{ color: 'var(--outline)', fontSize: 14 }}>{t('home.searchPlaceholder')}</span>
        </div>

        {/* Shops */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{t('home.featuredShops')}</h2>
          <button onClick={() => navigate('/search')} style={{ color: 'var(--color-secondary)', fontSize: 13, fontWeight: 600 }}>
            {t('home.viewAll')}
          </button>
        </div>

        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : shops.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon-bg">💈</div>
            <div className="empty-title">{t('common.noData')}</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {shops.map(shop => {
              const image = shop.images?.[0] || shop.images1?.[0] || SAMPLE_IMAGES[0];
              const rating = shop.rating ?? shop.averageRating;

              return (
                <div key={shop._id} className="card" onClick={() => navigate(`/shop/${shop._id}`)} style={{ cursor: 'pointer' }}>
                  <div className="shop-card-img-wrap">
                    <img src={image} alt={shop.name} className="shop-card-img" />
                    {rating && (
                      <div className="rating-badge">
                        <span className="star">★</span> {Number(rating).toFixed(1)}
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '12px 16px' }}>
                    <div className="shop-card-name">{shop.name}</div>
                    <div className="shop-card-address">📍 {shop.address}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                      <div className="shop-card-hours">
                        <span style={{ color: 'var(--success)', fontWeight: 600 }}>{t('home.open')}</span>
                        {' · '}{shop.openTime} - {shop.closeTime}
                      </div>
                      <button className="btn btn-primary btn-sm">{t('home.book')}</button>
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
