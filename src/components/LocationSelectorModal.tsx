import React, { useState } from 'react';
import { X, MapPin, Navigation, Compass, Check, Search, Loader2, Building, ArrowRight } from 'lucide-react';
import { UserLocation } from '../types';
import { PRESET_LOCATIONS } from '../data/sheltersData';
import { searchKoreanAddress } from '../utils/geoUtils';

interface LocationSelectorModalProps {
  currentLocation: UserLocation;
  onSelectLocation: (loc: UserLocation) => void;
  onRequestGps: () => void;
  isGpsLoading: boolean;
  onClose: () => void;
}

export const LocationSelectorModal: React.FC<LocationSelectorModalProps> = ({
  currentLocation,
  onSelectLocation,
  onRequestGps,
  isGpsLoading,
  onClose,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ address: string; lat: number; lng: number }>>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchInput.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    try {
      const results = await searchKoreanAddress(searchInput.trim());
      if (results.length > 0) {
        setSearchResults(results);
      } else {
        setSearchResults([]);
        setSearchError(`'${searchInput}' 검색 결과를 찾을 수 없습니다. 시·군·구·동 이름을 입력해보세요.`);
      }
    } catch {
      setSearchError('주소 검색 중 오류가 발생했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleDirectCustomDong = () => {
    if (!searchInput.trim()) return;
    // Set custom dong with approximate fallback center or user choice
    onSelectLocation({
      lat: currentLocation.lat,
      lng: currentLocation.lng,
      addressName: `${searchInput.trim()} (직접 설정한 위치)`,
      isGps: false,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">현위치 검색 및 변경</h2>
              <p className="text-xs text-slate-400">거주하시는 동네나 건물명을 직접 검색하세요</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto text-xs text-slate-300">
          
          {/* Current selected location indicator */}
          <div className="p-3 rounded-2xl bg-sky-950/40 border border-sky-500/30 flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-[11px] text-sky-300 font-bold">현재 설정된 기준 위치:</div>
              <div className="text-sm font-black text-white">{currentLocation.addressName}</div>
            </div>
          </div>

          {/* GPS Auto Acquisition Button */}
          <button
            onClick={() => {
              onRequestGps();
              onClose();
            }}
            disabled={isGpsLoading}
            className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Navigation className={`w-4 h-4 ${isGpsLoading ? 'animate-spin' : ''}`} />
            <span>실제 스마트폰 / PC GPS 위치 즉시 수신</span>
          </button>

          {/* Direct Address / Neighborhood Search */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
              내 동네 / 도로명 / 건물 검색하기
            </label>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="예: 해운대구, 분당동, 역삼역, 유성구, 제주시..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
              <button
                type="submit"
                disabled={isSearching || !searchInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shrink-0"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : '검색'}
              </button>
            </form>

            {/* Search Results list */}
            {searchResults.length > 0 && (
              <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto bg-slate-950 p-2 rounded-2xl border border-sky-500/40">
                <div className="text-[10px] text-sky-400 font-bold px-2 py-1">검색 결과 (선택 시 해당 위치로 즉시 이동):</div>
                {searchResults.map((res, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onSelectLocation({
                        lat: res.lat,
                        lng: res.lng,
                        addressName: res.address,
                        isGps: false,
                      });
                      onClose();
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-900 hover:bg-sky-900/50 border border-slate-800 hover:border-sky-500 text-left flex items-center justify-between text-xs text-white transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span className="truncate">{res.address}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {searchError && (
              <div className="text-xs text-amber-400 bg-amber-950/40 border border-amber-800/60 p-2.5 rounded-xl flex items-center justify-between">
                <span>{searchError}</span>
                <button
                  type="button"
                  onClick={handleDirectCustomDong}
                  className="ml-2 px-2.5 py-1 rounded-lg bg-amber-700 hover:bg-amber-600 text-white font-bold text-[11px] shrink-0"
                >
                  명칭 그대로 적용
                </button>
              </div>
            )}
          </div>

          {/* Preset Regions in Korea */}
          <div className="pt-2 border-t border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              전국 주요 거점 빠른 선택
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_LOCATIONS.map((loc) => {
                const isSelected =
                  Math.abs(loc.lat - currentLocation.lat) < 0.0001 &&
                  Math.abs(loc.lng - currentLocation.lng) < 0.0001;

                return (
                  <button
                    key={loc.addressName}
                    onClick={() => {
                      onSelectLocation(loc);
                      onClose();
                    }}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                      isSelected
                        ? 'bg-sky-500/15 border-sky-500/60 text-white font-bold'
                        : 'bg-slate-950/70 border-slate-800 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Building className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-sky-400' : 'text-slate-500'}`} />
                      <div className="truncate">
                        <div className="font-bold text-xs truncate">{loc.addressName.split('(')[0].trim()}</div>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="p-1 rounded-full bg-sky-500 text-white shrink-0 ml-1">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
};
