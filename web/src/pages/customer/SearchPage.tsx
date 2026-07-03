import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { shopApi } from '../../api/shop.api';
import { Shop } from '../../types';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useTranslation } from '../../hooks/useTranslation';
import { SAMPLE_IMAGES } from '../../utils/format';
import { ShopMap } from '../../components/map/ShopMap';

/* ─── Filter chip definitions ─────────────────────────── */
const SERVICE_FILTERS = ['Cắt tóc', 'Uốn', 'Nhuộm'] as const;
const NEAR_ME_FILTER = 'Gần tôi';

type ServiceFilter = (typeof SERVICE_FILTERS)[number];

/* ─── Helpers ─────────────────────────────────────────── */
function getShopImage(shop: Shop): string {
  const imgs = shop.images ?? shop.images1 ?? [];
  return imgs[0] || SAMPLE_IMAGES[0];
}

function getRating(shop: Shop): number | null {
  const r = shop.rating ?? shop.averageRating;
  return r != null ? Number(r) : null;
}

/* ─── Shop list card ──────────────────────────────────── */
interface ShopCardProps {
  shop: Shop;
  onClick: () => void;
}

function ShopListCard({ shop, onClick }: ShopCardProps) {
  const rating = getRating(shop);

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        gap: 14,
        padding: '14px 0',
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer',
        alignItems: 'flex-start',
      }}
    >
      {/* Image */}
      <div
        className="shop-card-img-wrap"
        style={{ width: 90, height: 68, flexShrink: 0, borderRadius: 'var(--radius-md)' }}
      >
        <img
          src={getShopImage(shop)}
          alt={shop.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: 'var(--radius-md)',
            aspectRatio: 'unset',
          }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = SAMPLE_IMAGES[0];
          }}
        />
        {rating !== null && (
          <div className="rating-badge" style={{ top: 6, right: 6, fontSize: 11, padding: '3px 6px' }}>
            <span className="star">★</span>
            {rating.toFixed(1)}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="shop-card-name" style={{ fontSize: 15 }}>
          {shop.name}
        </div>
        <div className="shop-card-address" style={{ marginTop: 3 }}>
          📍 {shop.address}
        </div>
        <div className="shop-card-hours" style={{ marginTop: 4 }}>
          🕐 {shop.openTime} – {shop.closeTime}
        </div>
      </div>

      {/* Chevron */}
      <div style={{ color: 'var(--outline)', fontSize: 18, alignSelf: 'center', flexShrink: 0 }}>›</div>
    </div>
  );
}

/* ─── Main SearchPage ─────────────────────────────────── */
export default function SearchPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { lat, long, loading: geoLoading, getLocation } = useGeolocation(true);

  /* State */
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [displayedShops, setDisplayedShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Derived */
  const hasKeyword = debouncedKeyword.trim().length > 0;
  const nearMeActive = activeFilters.has(NEAR_ME_FILTER);

  /* ── Load ALL shops once on mount ─────────────────── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await shopApi.getAllShops();
        if (!cancelled) {
          const shops: Shop[] = Array.isArray(data) ? data : data?.data ?? data?.shops ?? [];
          setAllShops(shops);
          setDisplayedShops(shops);
        }
      } catch (err) {
        console.error('Failed to load shops:', err);
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* ── Debounce keyword input ───────────────────────── */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, 500);
    return () => clearTimeout(timer);
  }, [keyword]);

  /* ── Fetch based on keyword / nearby ─────────────── */
  const fetchShops = useCallback(async () => {
    if (!hasKeyword && !nearMeActive) {
      // Reset to all shops
      setDisplayedShops(allShops);
      return;
    }

    setLoading(true);
    try {
      let data: unknown;

      if (nearMeActive && lat && long) {
        data = await shopApi.getNearbyShops(lat, long, 5);
      } else if (hasKeyword) {
        data = await shopApi.searchShops(debouncedKeyword);
      } else {
        data = await shopApi.getAllShops();
      }

      const shops: Shop[] = Array.isArray(data)
        ? data
        : (data as Record<string, unknown>)?.data
        ? ((data as Record<string, unknown>).data as Shop[])
        : (data as Record<string, unknown>)?.shops
        ? ((data as Record<string, unknown>).shops as Shop[])
        : [];

      setDisplayedShops(shops);
    } catch (err) {
      console.error('Search failed:', err);
      setDisplayedShops([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedKeyword, hasKeyword, nearMeActive, lat, long, allShops]);

  useEffect(() => {
    if (!initialLoading) {
      fetchShops();
    }
  }, [fetchShops, initialLoading]);

  /* ── Service chip filtering (client-side on allShops) */
  const filteredByService = useCallback((): Shop[] => {
    const serviceChips = SERVICE_FILTERS.filter((f) => activeFilters.has(f));
    if (serviceChips.length === 0) return displayedShops;

    return displayedShops.filter((shop) => {
      const name = shop.name.toLowerCase();
      return serviceChips.some((chip) => name.includes(chip.toLowerCase()));
    });
  }, [displayedShops, activeFilters]);

  const visibleShops = filteredByService();

  /* ── Toggle chip ─────────────────────────────────── */
  const toggleFilter = (filter: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(filter)) {
        next.delete(filter);
      } else {
        next.add(filter);
        // Trigger geolocation if "Gần tôi"
        if (filter === NEAR_ME_FILTER && !lat) {
          getLocation();
        }
      }
      return next;
    });
  };

  /* ── When user toggles "Gần tôi" and we get location */
  useEffect(() => {
    if (nearMeActive && lat && long && !initialLoading) {
      fetchShops();
    }
  }, [lat, long, nearMeActive]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── Render ──────────────────────────────────────── */
  return (
    <div
      className="page"
      style={{
        display: 'flex',
        flexDirection: 'column',
        /* When map is visible, we need full height so flex children can stretch */
        ...(hasKeyword ? {} : { height: '100dvh', overflowY: 'hidden' }),
      }}
    >
      {/* ── Sticky header ──────────────────────────── */}
      <div className="page-header" style={{ flexShrink: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          <span className="brand">B_Hair</span>
          <div className="brand-divider" />
          <span className="page-title">{t('search.title')}</span>
        </div>
      </div>

      {/* ── Search bar + chips ──────────────────────── */}
      <div className="section" style={{ flexShrink: 0, paddingTop: 8, paddingBottom: 4 }}>
        {/* Search input */}
        <div className="search-bar" style={{ marginBottom: 8 }}>
          <span style={{ color: 'var(--outline)', fontSize: 18, display: 'flex', alignItems: 'center' }}>
            🔍
          </span>
          <input
            ref={inputRef}
            type="text"
            placeholder={t('home.searchPlaceholder')}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          {keyword.length > 0 && (
            <button
              onClick={() => {
                setKeyword('');
                setDebouncedKeyword('');
                inputRef.current?.focus();
              }}
              style={{
                color: 'var(--outline)',
                fontSize: 18,
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
              }}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div className="filter-row" style={{ paddingTop: 4, paddingBottom: 8 }}>
          {/* Service chips */}
          {SERVICE_FILTERS.map((filter) => (
            <button
              key={filter}
              className={`chip${activeFilters.has(filter) ? ' active' : ''}`}
              onClick={() => toggleFilter(filter)}
            >
              {filter === 'Cắt tóc' && <span>✂️</span>}
              {filter === 'Uốn' && <span>💈</span>}
              {filter === 'Nhuộm' && <span>🎨</span>}
              {filter}
            </button>
          ))}

          {/* "Gần tôi" chip */}
          <button
            className={`chip${nearMeActive ? ' active' : ''}`}
            onClick={() => toggleFilter(NEAR_ME_FILTER)}
            disabled={geoLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 5 }}
          >
            {geoLoading ? (
              <>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    border: '2px solid currentColor',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.7s linear infinite',
                  }}
                />
                Đang lấy vị trí...
              </>
            ) : (
              <>
                <span>📍</span>
                {t('search.nearMe')}
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Content area ───────────────────────────── */}
      {initialLoading ? (
        /* Initial spinner */
        <div className="spinner-wrap" style={{ flex: 1 }}>
          <div className="spinner" />
        </div>
      ) : hasKeyword ? (
        /* ── Keyword mode: scrollable shop list ─── */
        <div
          className="section"
          style={{ flex: 1, overflowY: 'auto', paddingTop: 0 }}
        >
          {loading ? (
            <div className="spinner-wrap">
              <div className="spinner" />
            </div>
          ) : visibleShops.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon-bg">✂️</div>
              <div className="empty-title">Không tìm thấy tiệm nào</div>
              <div className="empty-sub">
                Thử tìm kiếm với từ khóa khác hoặc điều chỉnh bộ lọc.
              </div>
            </div>
          ) : (
            <>
              <p
                style={{
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  paddingTop: 4,
                  paddingBottom: 2,
                  fontWeight: 600,
                }}
              >
                {visibleShops.length} kết quả
              </p>
              {visibleShops.map((shop) => (
                <ShopListCard
                  key={shop.id}
                  shop={shop}
                  onClick={() => navigate(`/shop/${shop.id}`)}
                />
              ))}
              <div style={{ height: 24 }} />
            </>
          )}
        </div>
      ) : (
        /* ── No keyword: show Leaflet map ─────────── */
        <div
          className="section"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            paddingTop: 0,
            paddingBottom: 12,
            minHeight: 0,
          }}
        >
          {loading && (
            <div
              style={{
                position: 'absolute',
                top: 8,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 30,
                background: 'var(--surface)',
                borderRadius: 99,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-muted)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 12,
                  height: 12,
                  border: '2px solid var(--color-secondary)',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.7s linear infinite',
                }}
              />
              Đang tải...
            </div>
          )}
          <div
            style={{
              width: '100%',
              flex: 1,
              minHeight: 340,
              borderRadius: 18,
              overflow: 'hidden',
              border: '1px solid var(--border)',
            }}
          >
            <ShopMap
              shops={allShops}
              userLat={lat}
              userLong={long}
              onRequestLocation={getLocation}
            />
          </div>
        </div>
      )}
    </div>
  );
}
