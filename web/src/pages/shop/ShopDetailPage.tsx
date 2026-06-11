import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { shopApi } from '../../api/shop.api';
import { useTranslation } from '../../hooks/useTranslation';
import { Shop, Service, Barber, Review } from '../../types';
import { formatCurrency, SAMPLE_IMAGES } from '../../utils/format';

export default function ShopDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [shop, setShop] = useState<Shop | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const media = useMemo(() => {
    if (!shop) return [{ type: 'image', url: SAMPLE_IMAGES[0] }];
    const items: { type: 'image' | 'video'; url: string }[] = [];
    if (shop.images1?.length) shop.images1.forEach((u: string) => items.push({ type: 'image', url: u }));
    if (shop.images2?.length) shop.images2.forEach((u: string) => items.push({ type: 'image', url: u }));
    if (shop.images3?.length) shop.images3.forEach((u: string) => items.push({ type: 'image', url: u }));
    if (shop.videos?.length) shop.videos.forEach((u: string) => items.push({ type: 'video', url: u }));

    if (items.length === 0 && shop.image) items.push({ type: 'image', url: shop.image });
    if (items.length === 0 && shop.images?.[0]) items.push({ type: 'image', url: shop.images[0] });
    if (items.length === 0) items.push({ type: 'image', url: SAMPLE_IMAGES[0] });

    return items;
  }, [shop]);

  useEffect(() => {
    if (!id) return;
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [shopRes, svcRes] = await Promise.all([
          shopApi.getShopDetails(id),
          shopApi.getShopServices(id),
        ]);
        setShop(shopRes.data || shopRes.metadata || shopRes);
        setServices(Array.isArray(svcRes) ? svcRes : (svcRes.data || svcRes.metadata || []));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  if (loading) {
    return (
      <div className="page">
        <div className="skeleton" style={{ width: '100%', height: 240 }} />
        <div className="section" style={{ paddingTop: 20 }}>
          <div className="skeleton" style={{ width: '60%', height: 32, marginBottom: 12 }} />
          <div className="skeleton" style={{ width: '80%', height: 20, marginBottom: 24 }} />
          <div className="skeleton" style={{ width: '100%', height: 80, marginBottom: 12 }} />
          <div className="skeleton" style={{ width: '100%', height: 80 }} />
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="page">
        <div className="page-header"><button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← {t('common.back')}</button></div>
        <div className="empty-state">
          <div className="empty-icon-bg">🏬</div>
          <div className="empty-title">Không tìm thấy tiệm</div>
        </div>
      </div>
    );
  }

  const rating = shop.rating ?? shop.averageRating;
  const revCount = shop.reviewCount ?? 0;

  const openMaps = () => {
    const coords = shop.location?.coordinates;
    if (coords && coords.length >= 2) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords[1]},${coords[0]}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.name + ' ' + shop.address)}`, '_blank');
    }
  };

  return (
    <div className="page" style={{ paddingBottom: 100, position: 'relative' }}>
      {/* Hero Image */}
      <div style={{ position: 'relative', width: '100%' }} className="hero-img-wrap">
        <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 10 }}>
          <button 
            onClick={() => navigate(-1)}
            style={{ width: 40, height: 40, borderRadius: 20, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', color: '#000' }}
          >
            ←
          </button>
        </div>
        {media[activeIndex]?.type === 'video' ? (
          <video 
            src={media[activeIndex].url} 
            controls 
            autoPlay 
            muted 
            loop 
            className="shop-card-img" 
            style={{ width: '100%', objectFit: 'contain', height: 360, backgroundColor: '#000', display: 'block' }} 
          />
        ) : (
          <img src={media[activeIndex]?.url} alt={shop.name} className="shop-card-img" style={{ width: '100%', objectFit: 'cover', height: 360, backgroundColor: '#000' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 40%, rgba(0,0,0,0.7) 100%)', pointerEvents: 'none' }} />
        {rating && (
          <div className="rating-badge" style={{ top: 16, right: 16 }}>
            <span className="star">★</span> {Number(rating).toFixed(1)} ({revCount})
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {media.length > 1 && (
        <div className="section" style={{ paddingTop: 16, paddingBottom: 0 }}>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
            {media.map((item, idx) => (
              <div 
                key={idx} 
                onClick={() => setActiveIndex(idx)}
                style={{ 
                  flexShrink: 0, 
                  width: 72, 
                  height: 72, 
                  borderRadius: 12, 
                  overflow: 'hidden',
                  border: activeIndex === idx ? '2px solid var(--color-primary)' : '2px solid transparent',
                  cursor: 'pointer',
                  position: 'relative',
                  backgroundColor: 'var(--surface-alt)'
                }}
              >
                {item.type === 'video' ? (
                  <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <img src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                {item.type === 'video' && (
                  <div style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', borderRadius: 4, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 10, color: '#fff' }}>▶</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="section" style={{ paddingTop: 20, paddingBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-headline)', color: 'var(--color-primary)', marginBottom: 8 }}>
          {shop.name}
        </h1>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>
          <span>📍</span> <span>{shop.address}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>
          <span>📞</span> <a href={`tel:${shop.phone}`} style={{ color: 'var(--color-secondary)' }}>{shop.phone}</a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
          <span>🕐</span> <span>{shop.openTime} - {shop.closeTime}</span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => window.open(`tel:${shop.phone}`)}>
            📞 {t('shop.call')}
          </button>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={openMaps}>
            🗺 {t('shop.directions')}
          </button>
        </div>

        {/* Services */}
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>{t('shop.services')}</h2>
        {services.length === 0 ? (
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 32 }}>{t('common.noData')}</div>
        ) : (
          <div style={{ marginBottom: 32 }}>
            {services.map(svc => (
              <div key={svc._id} className="service-item" style={{ cursor: 'default' }}>
                {svc.coverImg ? (
                  <img src={svc.coverImg} alt={svc.name} style={{ width: 60, height: 60, borderRadius: 10, objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 60, height: 60, borderRadius: 10, background: 'var(--surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>✂️</div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-primary)' }}>{svc.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{svc.duration} {t('shop.mins')}</div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-secondary)' }}>
                  {formatCurrency(svc.price)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Staff - Tạm thời ẩn vì Backend chưa có API */}
        {/* Reviews - Tạm thời ẩn vì Backend chưa có API */}
      </div>

      {/* Floating Book Button */}
      <div style={{ position: 'sticky', bottom: 0, padding: '16px 20px', background: 'var(--surface)', borderTop: '1px solid var(--border)', zIndex: 100, marginLeft: -24, marginRight: -24 }}>
        <button className="btn btn-primary btn-full btn-lg" onClick={() => navigate(`/booking/${shop._id}`)}>
          {t('shop.bookNow')}
        </button>
      </div>
    </div>
  );
}
