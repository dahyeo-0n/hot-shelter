import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Shelter, UserLocation, NavigationState } from '../types';
import { formatDistance, getTierInfo } from '../utils/geoUtils';

interface MapComponentProps {
  shelters: Shelter[];
  userLocation: UserLocation;
  selectedShelter: Shelter | null;
  onSelectShelter: (shelter: Shelter) => void;
  navigationState: NavigationState;
  polylineCoords?: [number, number][];
  onSetLocation?: (loc: UserLocation) => void;
  onRefreshGps?: () => void;
  isGpsLoading?: boolean;
  isLiveTracking?: boolean;
  onToggleLiveTracking?: () => void;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  shelters,
  userLocation,
  selectedShelter,
  onSelectShelter,
  navigationState,
  polylineCoords = [],
  onSetLocation,
  onRefreshGps,
  isGpsLoading = false,
  isLiveTracking = true,
  onToggleLiveTracking,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const sheltersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const routeGlowRef = useRef<L.Polyline | null>(null);

  const onSetLocationRef = useRef(onSetLocation);
  onSetLocationRef.current = onSetLocation;
  const navActiveRef = useRef(navigationState.isActive);
  navActiveRef.current = navigationState.isActive;

  // Auto follow mode state (centers map on user position as they move)
  const [autoFollow, setAutoFollow] = useState<boolean>(true);
  const [showLocationToast, setShowLocationToast] = useState<boolean>(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [userLocation.lat, userLocation.lng],
      zoom: 16,
      zoomControl: false,
    });

    // Add Zoom Control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Primary High Reliability Voyager Tiles
    const primaryTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Error recovery for tiles: fallback to standard OSM if tiles fail
    primaryTiles.on('tileerror', () => {
      console.warn('Primary tile error, ensuring backup OSM tiles');
    });

    // Disable auto-follow when user manually drags map
    map.on('dragstart', () => {
      setAutoFollow(false);
    });

    // Map click handler to set location
    map.on('click', async (e: L.LeafletMouseEvent) => {
      if (navActiveRef.current) return;
      const { lat, lng } = e.latlng;
      
      const popup = L.popup()
        .setLatLng([lat, lng])
        .setContent(`
          <div class="p-2.5 text-slate-100 bg-slate-900 rounded-xl border border-sky-500/40 text-center">
            <div class="text-xs font-bold text-sky-400 mb-1">📍 선택한 지점</div>
            <div class="text-[11px] text-slate-300 mb-2">이곳을 나의 현위치로 지정할까요?</div>
            <button id="set-here-btn" style="background:#0284c7; color:#fff; padding:4px 12px; border-radius:8px; font-weight:bold; font-size:11px; cursor:pointer;">
              여기를 내 위치로 설정
            </button>
          </div>
        `)
        .openOn(map);

      setTimeout(() => {
        const btn = document.getElementById('set-here-btn');
        if (btn) {
          btn.onclick = async () => {
            map.closePopup();
            if (onSetLocationRef.current) {
              onSetLocationRef.current({
                lat,
                lng,
                addressName: `선택한 위치 (위도 ${lat.toFixed(4)}, 경도 ${lng.toFixed(4)})`,
                isGps: false,
              });
            }
          };
        }
      }, 50);
    });

    const sheltersLayer = L.layerGroup().addTo(map);
    sheltersLayerRef.current = sheltersLayer;
    mapInstanceRef.current = map;

    // Resize observer ensures map renders properly without gray spots on any screen change/tab switch
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    // Delayed size invalidations to ensure full layout stabilization
    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (resizeObserver) resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Ensure map redraws when visibility/container changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      const timer = setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [navigationState.isActive]);

  // Current walking / user coordinate
  const currentCoord: [number, number] = navigationState.isActive && navigationState.userCurrentCoord
    ? navigationState.userCurrentCoord
    : [userLocation.lat, userLocation.lng];

  // Update or Create Live Moving User Marker (smoothly follows movement)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
          <!-- Animated Radar Ping -->
          <div class="absolute w-12 h-12 rounded-full bg-sky-400/25 animate-ping"></div>
          <div class="absolute w-8 h-8 rounded-full bg-sky-500/35"></div>
          
          <!-- Core Dot & Walking Pin -->
          <div class="w-6 h-6 rounded-full bg-gradient-to-tr from-sky-600 to-blue-500 border-2 border-white shadow-xl flex items-center justify-center text-xs text-white font-black z-10">
            ${navigationState.isActive ? '🚶' : '📍'}
          </div>

          <!-- Live Moving Label -->
          <div class="absolute -top-7 whitespace-nowrap bg-slate-900/95 text-sky-300 text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-full border border-sky-400/50 shadow-lg flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
            <span>${navigationState.isActive ? '실시간 이동 중' : '나의 현위치'}</span>
          </div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker(currentCoord, { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
    } else {
      userMarkerRef.current.setLatLng(currentCoord);
      userMarkerRef.current.setIcon(userIcon);
    }

    // If autoFollow is enabled, smoothly pan the map to the moving user
    if (autoFollow) {
      map.panTo(currentCoord, { animate: true, duration: 0.5 });
    }
  }, [currentCoord[0], currentCoord[1], navigationState.isActive, autoFollow]);

  // Update Shelter Markers (Only when shelters or selectedShelter change)
  useEffect(() => {
    if (!mapInstanceRef.current || !sheltersLayerRef.current) return;
    const group = sheltersLayerRef.current;
    group.clearLayers();

    shelters.forEach((shelter) => {
      const tier = shelter.tier || 'red';
      const tierInfo = getTierInfo(tier);
      const isSelected = selectedShelter?.id === shelter.id;
      const isTarget = navigationState.targetShelter?.id === shelter.id;

      let badgeBg = 'bg-blue-600';
      let pinColor = '#2563eb';
      let rankText = '1순위';
      let ringGlow = 'ring-4 ring-blue-500/40 animate-pulse';

      if (tier === 'yellow') {
        badgeBg = 'bg-amber-500';
        pinColor = '#eab308';
        rankText = '2순위';
        ringGlow = 'ring-2 ring-amber-400/30';
      } else if (tier === 'red') {
        badgeBg = 'bg-rose-600';
        pinColor = '#ef4444';
        rankText = '3순위';
        ringGlow = 'ring-2 ring-rose-500/30';
      }

      const shelterIcon = L.divIcon({
        className: 'custom-shelter-marker',
        html: `
          <div class="relative flex flex-col items-center cursor-pointer transition-transform hover:scale-115 ${isSelected || isTarget ? 'scale-120 z-50' : 'z-20'}">
            <!-- Rank & Distance Badge -->
            <div class="mb-1 flex items-center gap-1 px-2 py-0.5 rounded-full ${badgeBg} text-white font-extrabold text-[10px] shadow-lg whitespace-nowrap border border-white/30">
              <span>${rankText}</span>
              <span>·</span>
              <span>${shelter.distance ? formatDistance(shelter.distance) : ''}</span>
            </div>

            <!-- Pin Body -->
            <div class="relative w-8 h-8 rounded-2xl flex items-center justify-center shadow-xl border-2 border-white text-white font-black text-sm ${ringGlow}" style="background-color: ${pinColor}">
              <span class="drop-shadow">❄️</span>
            </div>

            <!-- Little arrow at bottom of pin -->
            <div class="w-2 h-2 rotate-45 -mt-1 border-r-2 border-b-2 border-white" style="background-color: ${pinColor}"></div>

            <!-- Shelter Name Tooltip label -->
            <div class="mt-0.5 px-1.5 py-0.2 rounded bg-slate-900/90 text-white text-[10px] font-semibold border border-slate-700 shadow max-w-[100px] truncate text-center">
              ${shelter.name.split(' ')[0]}
            </div>
          </div>
        `,
        iconSize: [36, 54],
        iconAnchor: [18, 48],
        popupAnchor: [0, -48],
      });

      const marker = L.marker([shelter.lat, shelter.lng], { icon: shelterIcon });

      const popupHtml = `
        <div class="w-64 p-0 overflow-hidden rounded-2xl bg-slate-900 text-slate-100 border border-slate-700 shadow-2xl">
          <div class="relative h-28 w-full overflow-hidden bg-slate-800">
            <img src="${shelter.photos[0]}" alt="${shelter.name}" class="w-full h-full object-cover" />
            <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
            <div class="absolute top-2 left-2 px-2 py-0.5 rounded-full ${badgeBg} text-white font-black text-[11px] shadow">
              ${tierInfo.iconEmoji} ${tierInfo.label.split(' ')[0]}
            </div>
            <div class="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-sky-900/90 text-sky-200 border border-sky-400/40 text-[11px] font-bold">
              ❄️ 실내 ${shelter.indoorTemp}°C
            </div>
            <div class="absolute bottom-1.5 left-2 right-2 text-white font-bold text-sm truncate">
              ${shelter.name}
            </div>
          </div>

          <div class="p-3 space-y-2">
            <div class="flex items-center justify-between text-xs text-slate-300">
              <span class="text-slate-400">거리 / 도보시간:</span>
              <span class="font-bold text-white text-sm text-sky-300">
                ${shelter.distance ? formatDistance(shelter.distance) : ''} · 도보 약 ${shelter.walkMinutes}분
              </span>
            </div>

            <div class="text-[11px] text-slate-400 line-clamp-1">
              📍 ${shelter.detailLocation}
            </div>

            <div class="pt-1 flex gap-2">
              <button 
                id="popup-btn-detail-${shelter.id}"
                class="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md active:scale-95 transition cursor-pointer"
              >
                <span>사진보기 & 안내시작</span> 🚀
              </button>
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        maxWidth: 280,
        className: 'shelter-custom-popup',
      });

      marker.on('click', () => {
        onSelectShelter(shelter);
      });

      marker.on('popupopen', () => {
        const btnDetail = document.getElementById(`popup-btn-detail-${shelter.id}`);
        if (btnDetail) {
          btnDetail.onclick = () => {
            onSelectShelter(shelter);
          };
        }
      });

      marker.addTo(group);
    });
  }, [shelters, selectedShelter, navigationState.targetShelter]);

  // Route Polyline & Bounds handling in Navigation Mode
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Clean old lines
    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }
    if (routeGlowRef.current) {
      map.removeLayer(routeGlowRef.current);
      routeGlowRef.current = null;
    }

    if (navigationState.isActive && polylineCoords.length > 0) {
      // Add a solid under-glow line
      const glow = L.polyline(polylineCoords, {
        color: '#0284c7',
        weight: 10,
        opacity: 0.4,
        lineCap: 'round',
      }).addTo(map);

      // Create vivid glowing route line
      const polyline = L.polyline(polylineCoords, {
        color: '#38bdf8',
        weight: 6,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      routePolylineRef.current = polyline;
      routeGlowRef.current = glow;

      // Fit bounds to show entire route initially
      const bounds = L.latLngBounds(polylineCoords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 });
    }
  }, [navigationState.isActive, polylineCoords]);

  // Handle Map Re-center button and enable auto-follow + GPS refresh
  const handleRecenter = () => {
    if (onRefreshGps) {
      onRefreshGps();
    }
    setAutoFollow(true);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(currentCoord, 17, { duration: 0.8 });
    }
    setShowLocationToast(true);
    setTimeout(() => setShowLocationToast(false), 2500);
  };

  return (
    <div className="relative w-full h-full min-h-[380px] rounded-2xl overflow-hidden shadow-xl border border-slate-800 bg-slate-950">
      {/* Map Element Container */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[380px]" />

      {/* Floating Control: Real-time Live Walk Tracking & Auto-follow status */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
        <button
          onClick={() => {
            setAutoFollow(!autoFollow);
            if (!autoFollow && mapInstanceRef.current) {
              mapInstanceRef.current.panTo(currentCoord, { animate: true });
            }
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xl backdrop-blur-md border transition flex items-center gap-1.5 cursor-pointer ${
            autoFollow
              ? 'bg-sky-500/25 border-sky-400 text-sky-200 ring-2 ring-sky-500/30'
              : 'bg-slate-900/90 border-slate-700 text-slate-400 hover:text-white'
          }`}
          title={autoFollow ? '위치 자동 추적 중 (지도 따라가기 켜짐)' : '위치 자동 추적 일시정지됨'}
        >
          <span className={`w-2 h-2 rounded-full ${autoFollow ? 'bg-sky-400 animate-ping' : 'bg-slate-500'}`}></span>
          <span>{autoFollow ? '🚶 실시간 위치 추적 중' : '✋ 위치 고정 (수동 조작)'}</span>
        </button>
      </div>

      {/* Toast Notification when moving to current location */}
      {showLocationToast && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 text-sky-300 border border-sky-500/50 px-3.5 py-1.5 rounded-full text-xs font-black shadow-2xl backdrop-blur flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2">
          <span>📍</span>
          <span>현위치로 지도를 이동했습니다!</span>
        </div>
      )}

      {/* Prominent Current Location Floating Action Button (현위치 버튼) */}
      <button
        onClick={handleRecenter}
        disabled={isGpsLoading}
        title="현위치 버튼: 현재 내 위치로 지도 이동 및 GPS 갱신"
        className="absolute bottom-4 left-4 z-20 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white border border-sky-300/40 shadow-2xl flex items-center gap-2 text-xs font-black transition active:scale-95 cursor-pointer disabled:opacity-75"
      >
        <span className={`text-base ${isGpsLoading ? 'animate-spin' : ''}`}>📍</span>
        <span>{isGpsLoading ? '현위치 찾는 중...' : '현위치'}</span>
      </button>
    </div>
  );
};
