import { useState, useEffect } from 'react';

interface GeolocationState {
  lat: number | null;
  long: number | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation(auto = false) {
  const [state, setState] = useState<GeolocationState>({
    lat: null,
    long: null,
    error: null,
    loading: false,
  });

  const getLocation = () => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: 'Geolocation not supported', loading: false }));
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          lat: pos.coords.latitude,
          long: pos.coords.longitude,
          error: null,
          loading: false,
        });
      },
      (err) => {
        setState((s) => ({ ...s, error: err.message, loading: false }));
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  useEffect(() => {
    if (auto) getLocation();
  }, [auto]);

  return { ...state, getLocation };
}
