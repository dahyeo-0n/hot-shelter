import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, MapPin, Navigation, Snowflake, Droplets, 
  Wind, ShieldAlert, Sparkles, RefreshCw, Layers, 
  CloudRain, Sun, Cloud, Thermometer, ArrowRight, Eye, List, Map
} from 'lucide-react';
import { 
  Shelter, ShelterCategory, ShelterTier, UserLocation, 
  NavigationState, WeatherInfo, RouteData 
} from './types';
import { PRESET_LOCATIONS, getSheltersForLocation } from './data/sheltersData';
import { enrichAndSortShelters, generateRouteData, formatDistance, getTierInfo, reverseGeocode } from './utils/geoUtils';
import { Navbar } from './components/Navbar';
import { MapComponent } from './components/MapComponent';
import { ShelterCard } from './components/ShelterCard';
import { ShelterDetailModal } from './components/ShelterDetailModal';
import { NavigationOverlay } from './components/NavigationOverlay';
import { HeatwaveInfoModal } from './components/HeatwaveInfoModal';
import { LocationSelectorModal } from './components/LocationSelectorModal';

export default function App() {
  // Current User Location State (Default: City center preset)
  const [userLocation, setUserLocation] = useState<UserLocation>(PRESET_LOCATIONS[0]);
  const [isGpsLoading, setIsGpsLoading] = useState<boolean>(false);

  // Weather & Temperature State (Supports min/max temp, rain, snow, sunny)
  const [weatherInfo, setWeatherInfo] = useState<WeatherInfo>({
    condition: 'sunny',
    conditionLabel: '맑음/폭염',
    currentTemp: 34.2,
    minTemp: 23.5,
    maxTemp: 35.8,
    feelsLikeTemp: 36.8,
    precipitationProbability: 10,
    humidity: 78,
    uvIndex: '위험',
    alertLevel: '폭염경보',
    advisoryText: '낮 시간대 야외활동을 자제하고 가까운 파란색 무더위 쉼터를 이용하세요.',
    hydrationGoalMl: 2000,
  });

  // Mobile View Switcher ('map' vs 'list') to eliminate heavy mobile scrolling
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map');

  // UI State: Selected Shelter (triggers photo & details modal)
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);

  // UI Modals
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ShelterCategory>('전체');
  const [selectedTierFilter, setSelectedTierFilter] = useState<'all' | ShelterTier>('all');

  // Navigation State
  const [navigationState, setNavigationState] = useState<NavigationState>({
    isActive: false,
    targetShelter: null,
    currentStepIndex: 0,
    remainingDistance: 0,
    remainingTime: 0,
    userCurrentCoord: [PRESET_LOCATIONS[0].lat, PRESET_LOCATIONS[0].lng],
    isSimulating: false,
    soundEnabled: true,
    hasArrived: false,
    walkingProgress: 0,
  });

  const [routeData, setRouteData] = useState<RouteData | null>(null);

  // Real-time GPS Live Watching (Tracks user position automatically as they walk in real life)
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setUserLocation((prev) => ({
          ...prev,
          lat: latitude,
          lng: longitude,
          isGps: true,
          accuracy: Math.round(accuracy),
          timestamp: Date.now(),
        }));

        setNavigationState((prev) => {
          if (prev.isActive && !prev.isSimulating) {
            return {
              ...prev,
              userCurrentCoord: [latitude, longitude],
            };
          }
          return prev;
        });
      },
      (err) => {
        console.warn('GPS continuous watch notice:', err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 12000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Compute raw shelters dynamically anchored at userLocation
  const rawShelters = useMemo(() => {
    let baseDistrict = '우리동네';
    const addr = userLocation.addressName;
    
    const matches = addr.match(/([가-힣]+(?:구|시|군|동|읍|면|로|길))/g);
    if (matches && matches.length > 0) {
      const specific = matches.reverse().find(m => !['대한민국', '특별시', '광역시'].includes(m));
      if (specific) {
        baseDistrict = specific.replace(/(?:특별시|광역시|특별자치도|특별자치시)/g, '').trim();
      }
    } else if (addr.includes('강남')) baseDistrict = '강남';
    else if (addr.includes('광화문') || addr.includes('종로') || addr.includes('중구')) baseDistrict = '광화문';
    else if (addr.includes('홍대') || addr.includes('마포')) baseDistrict = '홍대';
    else if (addr.includes('여의도')) baseDistrict = '여의도';
    else if (addr.includes('잠실') || addr.includes('송파')) baseDistrict = '잠실';
    else if (addr.includes('부산')) baseDistrict = '부산';
    else if (addr.includes('대구')) baseDistrict = '대구';
    else if (addr.includes('대전')) baseDistrict = '대전';
    else if (addr.includes('광주')) baseDistrict = '광주';
    else if (addr.includes('인천')) baseDistrict = '인천';
    else if (addr.includes('수원')) baseDistrict = '수원';
    else if (addr.includes('제주')) baseDistrict = '제주';

    return getSheltersForLocation(userLocation.lat, userLocation.lng, baseDistrict);
  }, [userLocation.lat, userLocation.lng, userLocation.addressName]);

  // Compute Enriched & Sorted Shelters (Ranked Blue -> Yellow -> Red)
  const enrichedShelters = useMemo(() => {
    return enrichAndSortShelters(rawShelters, userLocation);
  }, [rawShelters, userLocation]);

  // Filtered Shelters based on Search and Filters
  const filteredShelters = useMemo(() => {
    return enrichedShelters.filter((shelter) => {
      if (selectedCategory !== '전체' && shelter.category !== selectedCategory) {
        return false;
      }
      if (selectedTierFilter !== 'all' && shelter.tier !== selectedTierFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = shelter.name.toLowerCase().includes(query);
        const matchAddress = shelter.address.toLowerCase().includes(query);
        const matchDetail = shelter.detailLocation.toLowerCase().includes(query);
        return matchName || matchAddress || matchDetail;
      }
      return true;
    });
  }, [enrichedShelters, selectedCategory, selectedTierFilter, searchQuery]);

  // Tier Counts for Tabs
  const tierCounts = useMemo(() => {
    const blue = enrichedShelters.filter((s) => s.tier === 'blue').length;
    const yellow = enrichedShelters.filter((s) => s.tier === 'yellow').length;
    const red = enrichedShelters.filter((s) => s.tier === 'red').length;
    return { blue, yellow, red, total: enrichedShelters.length };
  }, [enrichedShelters]);

  // GPS Manual Refresh Handler
  const fetchRealGpsLocation = async (isInitial = false) => {
    if (!navigator.geolocation) {
      if (!isInitial) alert('사용자의 기기 또는 브라우저에서 GPS 기능을 지원하지 않습니다.');
      return;
    }

    if (!isInitial) setIsGpsLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        let resolvedAddress = `내 실제 GPS 위치 (위도 ${latitude.toFixed(4)}, 경도 ${longitude.toFixed(4)})`;
        try {
          const realAddr = await reverseGeocode(latitude, longitude);
          if (realAddr && !realAddr.startsWith('위도')) {
            resolvedAddress = `실제 현위치: ${realAddr}`;
          }
        } catch {
          // fallback
        }

        setUserLocation({
          lat: latitude,
          lng: longitude,
          addressName: resolvedAddress,
          isGps: true,
          accuracy: Math.round(accuracy),
          timestamp: Date.now(),
        });
        setIsGpsLoading(false);
      },
      (error) => {
        console.warn('Geolocation error:', error);
        setIsGpsLoading(false);
        if (!isInitial) {
          if (error.code === error.PERMISSION_DENIED) {
            alert('위치 정보 접근 권한이 허용되지 않았습니다. 상단 [위치변경]에서 동네를 검색해주세요.');
          } else {
            alert('GPS 신호를 수신할 수 없어 기본 위치로 유지됩니다.');
          }
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleRequestGps = () => {
    fetchRealGpsLocation(false);
  };

  useEffect(() => {
    fetchRealGpsLocation(true);
  }, []);

  // Handler: Start Navigation
  const handleStartNavigation = (shelter: Shelter) => {
    setSelectedShelter(null);
    const startLat = userLocation.lat;
    const startLng = userLocation.lng;
    const route = generateRouteData(startLat, startLng, shelter);

    setRouteData(route);
    setNavigationState({
      isActive: true,
      targetShelter: shelter,
      currentStepIndex: 0,
      remainingDistance: route.totalDistance,
      remainingTime: route.totalMinutes,
      userCurrentCoord: [startLat, startLng],
      isSimulating: true,
      soundEnabled: true,
      hasArrived: false,
      walkingProgress: 0,
    });
  };

  // Handler: Exit Navigation
  const handleExitNavigation = () => {
    setNavigationState((prev) => ({
      ...prev,
      isActive: false,
      targetShelter: null,
      isSimulating: false,
      hasArrived: false,
      walkingProgress: 0,
      userCurrentCoord: [userLocation.lat, userLocation.lng],
    }));
    setRouteData(null);
  };

  const closestShelter = enrichedShelters[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Navbar: Clean & Compact */}
      <Navbar
        userLocation={userLocation}
        weatherInfo={weatherInfo}
        onOpenLocationModal={() => setIsLocationModalOpen(true)}
        onOpenWeatherModal={() => setIsWeatherModalOpen(true)}
        onRefreshGps={handleRequestGps}
        isGpsLoading={isGpsLoading}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto p-2 sm:p-4 gap-2 sm:gap-2.5">
        
        {/* Closest Shelter Quick Action Strip */}
        {!navigationState.isActive && closestShelter && (
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-sm shadow shrink-0 text-white font-bold">
                ❄️
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] text-sky-400 font-bold">
                  <span>가장 가까운 쉼터 추천</span>
                  <span className="bg-blue-600/40 text-blue-300 px-1.5 py-0.2 rounded text-[10px]">
                    도보 {closestShelter.walkMinutes}분
                  </span>
                </div>
                <div className="font-extrabold text-white text-xs sm:text-sm truncate">
                  {closestShelter.name} ({closestShelter.distance ? formatDistance(closestShelter.distance) : ''} · 실내 {closestShelter.indoorTemp}°C)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto w-full sm:w-auto">
              <button
                onClick={() => setSelectedShelter(closestShelter)}
                className="flex-1 sm:flex-none py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-200 text-xs font-bold border border-slate-700 transition cursor-pointer"
              >
                사진보기
              </button>
              <button
                onClick={() => handleStartNavigation(closestShelter)}
                className="flex-1 sm:flex-none py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white text-xs font-black shadow flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>바로 길안내</span>
              </button>
            </div>
          </div>
        )}

        {/* Single Unified Distance Rank Filter Bar (🔵 1순위 · 🟡 2순위 · 🔴 3순위) & Search */}
        {!navigationState.isActive && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            
            {/* The ONLY Distance Rank Tabs in the app */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
              <button
                onClick={() => setSelectedTierFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedTierFilter === 'all'
                    ? 'bg-slate-800 text-white border border-slate-600 shadow'
                    : 'bg-slate-900/90 text-slate-400 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                전체 ({tierCounts.total})
              </button>

              <button
                onClick={() => setSelectedTierFilter('blue')}
                className={`px-3 py-1.5 rounded-xl font-black whitespace-nowrap flex items-center gap-1.5 transition cursor-pointer ${
                  selectedTierFilter === 'blue'
                    ? 'bg-blue-600 text-white border border-blue-400 shadow'
                    : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30'
                }`}
              >
                <span>🔵 1순위 파랑 ({tierCounts.blue})</span>
              </button>

              <button
                onClick={() => setSelectedTierFilter('yellow')}
                className={`px-3 py-1.5 rounded-xl font-black whitespace-nowrap flex items-center gap-1.5 transition cursor-pointer ${
                  selectedTierFilter === 'yellow'
                    ? 'bg-amber-500 text-slate-950 border border-amber-300 shadow'
                    : 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30'
                }`}
              >
                <span>🟡 2순위 노랑 ({tierCounts.yellow})</span>
              </button>

              <button
                onClick={() => setSelectedTierFilter('red')}
                className={`px-3 py-1.5 rounded-xl font-black whitespace-nowrap flex items-center gap-1.5 transition cursor-pointer ${
                  selectedTierFilter === 'red'
                    ? 'bg-rose-600 text-white border border-rose-400 shadow'
                    : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30'
                }`}
              >
                <span>🔴 3순위 빨강 ({tierCounts.red})</span>
              </button>
            </div>

            {/* Right: Search & Mobile View Switcher */}
            <div className="flex items-center gap-2">
              
              {/* Mobile View Switcher Tabs */}
              <div className="lg:hidden flex rounded-xl bg-slate-900 border border-slate-800 p-0.5">
                <button
                  onClick={() => setMobileView('map')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                    mobileView === 'map' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Map className="w-3.5 h-3.5" />
                  <span>지도</span>
                </button>
                <button
                  onClick={() => setMobileView('list')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                    mobileView === 'list' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>목록 ({filteredShelters.length})</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="쉼터 이름, 건물 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

            </div>

          </div>
        )}

        {/* Primary Workspace: Interactive Map & Shelters Directory */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-3 min-h-[440px]">
          
          {/* Map Column (Ensured to render everywhere seamlessly) */}
          <div className={`relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl transition-all duration-200 ${
            navigationState.isActive
              ? 'lg:col-span-12 h-[75vh]'
              : mobileView === 'map' 
                ? 'lg:col-span-7 h-[60vh] lg:h-full min-h-[380px]' 
                : 'hidden lg:block lg:col-span-7 h-[420px] lg:h-full'
          }`}>
            
            <MapComponent
              shelters={filteredShelters}
              userLocation={userLocation}
              selectedShelter={selectedShelter}
              onSelectShelter={(shelter) => setSelectedShelter(shelter)}
              navigationState={navigationState}
              polylineCoords={routeData?.polylineCoordinates}
              onSetLocation={(newLoc) => setUserLocation(newLoc)}
              onRefreshGps={handleRequestGps}
              isGpsLoading={isGpsLoading}
            />

            {/* Navigation Overlay (Shown when "안내시작" is active) */}
            {navigationState.isActive && (
              <NavigationOverlay
                navigationState={navigationState}
                routeData={routeData}
                userLocation={userLocation}
                outdoorTemp={weatherInfo.currentTemp}
                onUpdateNavState={setNavigationState}
                onExitNavigation={handleExitNavigation}
              />
            )}

            {/* Mobile Floating Marker Info Card */}
            {!navigationState.isActive && selectedShelter && mobileView === 'map' && (
              <div className="lg:hidden absolute bottom-3 left-3 right-3 z-[400] bg-slate-900/95 backdrop-blur-md border border-sky-500/50 rounded-2xl p-3 shadow-2xl flex items-center justify-between gap-2.5 animate-in slide-in-from-bottom-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold">
                    <span className={selectedShelter.tier === 'blue' ? 'text-sky-400' : selectedShelter.tier === 'yellow' ? 'text-amber-400' : 'text-rose-400'}>
                      {selectedShelter.tier === 'blue' ? '🔵 1순위' : selectedShelter.tier === 'yellow' ? '🟡 2순위' : '🔴 3순위'}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-white font-bold">{selectedShelter.category}</span>
                  </div>
                  <div className="font-black text-white text-xs sm:text-sm truncate mt-0.5">
                    {selectedShelter.name}
                  </div>
                  <div className="text-[11px] text-slate-300 truncate">
                    도보 {selectedShelter.walkMinutes}분 ({selectedShelter.distance ? formatDistance(selectedShelter.distance) : ''}) · 실내 {selectedShelter.indoorTemp}°C
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleStartNavigation(selectedShelter)}
                    className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center gap-1 shadow cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>안내시작</span>
                  </button>
                  <button
                    onClick={() => setSelectedShelter(null)}
                    className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Shelters Directory List Column */}
          {!navigationState.isActive && (
            <div className={`flex flex-col bg-slate-950/70 rounded-3xl border border-slate-800/80 p-2.5 sm:p-3.5 overflow-hidden transition-all duration-200 ${
              mobileView === 'list'
                ? 'lg:col-span-5 h-[65vh] lg:h-full'
                : 'hidden lg:flex lg:col-span-5 h-[500px] lg:h-full'
            }`}>
              
              {/* Category Pills Header */}
              <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-1.5 border-b border-slate-800 scrollbar-none">
                {(['전체', '주민센터', '시중은행', '노인복지관', '공공도서관', '지하철역'] as ShelterCategory[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-sky-600 text-white shadow'
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* List Header Status */}
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2 px-1">
                <span>
                  쉼터 <strong className="text-white">{filteredShelters.length}</strong>곳 (가까운 순)
                </span>
                <span className="text-[11px] text-sky-400 font-semibold">
                  카드 클릭 시 상세 사진 확인
                </span>
              </div>

              {/* Scrollable Cards Container */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                {filteredShelters.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                    <div className="text-2xl">🔍</div>
                    <p className="text-xs font-bold text-slate-300">검색 조건에 맞는 쉼터가 없습니다.</p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('전체');
                        setSelectedTierFilter('all');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 text-sky-300 text-xs font-semibold hover:bg-slate-700 transition cursor-pointer"
                    >
                      필터 초기화
                    </button>
                  </div>
                ) : (
                  filteredShelters.map((shelter) => (
                    <ShelterCard
                      key={shelter.id}
                      shelter={shelter}
                      isSelected={selectedShelter?.id === shelter.id}
                      onSelect={(s) => setSelectedShelter(s)}
                      onStartNavigation={(s) => handleStartNavigation(s)}
                    />
                  ))
                )}
              </div>

            </div>
          )}

        </div>

      </main>

      {/* Footer Info Strip */}
      <footer className="bg-slate-900/90 border-t border-slate-800 px-3 py-2 text-[11px] text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-sky-400 font-bold">무더위 쉼터 안전망</span>
            <span>·</span>
            <span className="truncate">공공기관 및 은행 에어컨 쉼터 무료 개방</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => setIsWeatherModalOpen(true)}
              className="hover:text-rose-300 transition underline cursor-pointer"
            >
              날씨·안전수칙
            </button>
            <span>·</span>
            <a href="tel:119" className="text-rose-400 font-bold">119</a>
          </div>
        </div>
      </footer>

      {/* Shelter Photo & Detailed Information Modal */}
      {selectedShelter && (
        <ShelterDetailModal
          shelter={selectedShelter}
          outdoorTemp={weatherInfo.currentTemp}
          onClose={() => setSelectedShelter(null)}
          onStartNavigation={handleStartNavigation}
        />
      )}

      {/* Weather & Advisory Modal */}
      {isWeatherModalOpen && (
        <HeatwaveInfoModal
          weatherInfo={weatherInfo}
          onUpdateWeather={(newWeather) => setWeatherInfo(newWeather)}
          onClose={() => setIsWeatherModalOpen(false)}
        />
      )}

      {/* Location Switcher Modal */}
      {isLocationModalOpen && (
        <LocationSelectorModal
          currentLocation={userLocation}
          onSelectLocation={(loc) => setUserLocation(loc)}
          onRequestGps={handleRequestGps}
          isGpsLoading={isGpsLoading}
          onClose={() => setIsLocationModalOpen(false)}
        />
      )}

    </div>
  );
}
