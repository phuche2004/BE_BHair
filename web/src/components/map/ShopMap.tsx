import React, { useCallback, useState } from 'react';
import { GoogleMap, Marker, InfoWindow, useLoadScript } from '@react-google-maps/api';
import { Shop } from '../../types';
import { useNavigate } from 'react-router-dom';

const containerStyle = {
  width: '100%',
  height: '100%'
};

interface Props {
  shops: Shop[];
  userLat?: number | null;
  userLong?: number | null;
  highlightedId?: string | null;
}

const libraries: any[] = ["places"];

export function ShopMapWrapper(props: Props) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  if (loadError) return <div style={{ padding: 20, textAlign: 'center' }}>Lỗi tải bản đồ Google Maps</div>;
  if (!isLoaded) return <div className="spinner-wrap"><div className="spinner" /></div>;

  return <ShopMapInner {...props} />;
}

// Ensure the old export name "ShopMap" is used by consumers
export const ShopMap = ShopMapWrapper;

function ShopMapInner({ shops, userLat, userLong, highlightedId }: Props) {
  const navigate = useNavigate();
  const defaultCenter = { lat: 10.7769, lng: 106.7009 }; // HCM City
  const center = userLat && userLong ? { lat: userLat, lng: userLong } : defaultCenter;

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  // When user location changes, fly to it
  React.useEffect(() => {
    if (map && userLat && userLong) {
      map.panTo({ lat: userLat, lng: userLong });
    }
  }, [userLat, userLong, map]);

  const openGoogleMaps = (shop: Shop) => {
    const coords = shop.location?.coordinates;
    if (coords && coords.length >= 2) {
      const lat = coords[1];
      const lon = coords[0];
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=driving`,
        '_blank'
      );
    } else {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.name + ' ' + shop.address)}`,
        '_blank'
      );
    }
  };

  const createMarkerIcon = (isHighlighted: boolean) => {
    return {
      path: 'M0-48c-9.8 0-17.7 7.8-17.7 17.4 0 15.5 17.7 30.6 17.7 30.6s17.7-15.4 17.7-30.6c0-9.6-7.9-17.4-17.7-17.4z',
      fillColor: isHighlighted ? '#c9a876' : '#1a1a1a',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 0.8,
    };
  };

  const userMarkerIcon = {
    path: 0, // google.maps.SymbolPath.CIRCLE
    fillColor: '#4285F4',
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2,
    scale: 8,
  };

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={13}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{
        mapTypeControl: false,
        streetViewControl: false,
      }}
    >
      {userLat && userLong && (
        <Marker
          position={{ lat: userLat, lng: userLong }}
          icon={userMarkerIcon}
          title="Vị trí của bạn"
        />
      )}

      {shops.map((shop) => {
        const coords = shop.location?.coordinates;
        if (!coords || coords.length < 2) return null;
        const lat = coords[1];
        const lon = coords[0];

        return (
          <Marker
            key={shop._id}
            position={{ lat, lng: lon }}
            icon={createMarkerIcon(shop._id === highlightedId)}
            onClick={() => setSelectedShop(shop)}
          />
        );
      })}

      {selectedShop && (
        <InfoWindow
          position={{
            lat: selectedShop.location!.coordinates[1],
            lng: selectedShop.location!.coordinates[0]
          }}
          onCloseClick={() => setSelectedShop(null)}
        >
          <div className="map-popup" style={{ margin: 0, padding: 0 }}>
            <div className="map-popup-name" style={{ fontWeight: 'bold', fontSize: 14 }}>{selectedShop.name}</div>
            <div className="map-popup-addr" style={{ fontSize: 12, marginTop: 4 }}>
              {selectedShop.address}
              {selectedShop.rating || selectedShop.averageRating ? ` · ⭐ ${Number(selectedShop.rating || selectedShop.averageRating).toFixed(1)}` : ''}
            </div>
            <div className="map-popup-addr" style={{ fontSize: 12, marginTop: 2 }}>
              {selectedShop.openTime} – {selectedShop.closeTime}
            </div>
            <div className="map-popup-actions" style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate(`/shop/${selectedShop._id}`)}
                style={{ padding: '4px 8px', fontSize: 12 }}
              >
                Chi tiết
              </button>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => openGoogleMaps(selectedShop)}
                style={{ padding: '4px 8px', fontSize: 12 }}
              >
                🗺 Chỉ đường
              </button>
            </div>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}
