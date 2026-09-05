import React from 'react';
import { MapPin, Navigation, RefreshCw, CloudRain, Snowflake, Sun, Cloud, CloudLightning, Search } from 'lucide-react';
import { WeatherInfo, UserLocation } from '../types';

interface NavbarProps {
  userLocation: UserLocation;
  weatherInfo: WeatherInfo;
  onOpenLocationModal: () => void;
  onOpenWeatherModal: () => void;
  onRefreshGps: () => void;
  isGpsLoading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  userLocation,
  weatherInfo,
  onOpenLocationModal,
  onOpenWeatherModal,
  onRefreshGps,
  isGpsLoading,
}) => {
  // Determine weather icon
  const getWeatherIcon = () => {
    switch (weatherInfo.condition) {
      case 'rain':
      case 'shower':
        return <CloudRain className="w-4 h-4 text-sky-400 animate-bounce" />;
      case 'snow':
        return <Snowflake className="w-4 h-4 text-cyan-300 animate-pulse" />;
      case 'cloudy':
        return <Cloud className="w-4 h-4 text-slate-300" />;
      case 'thunder':
        return <CloudLightning className="w-4 h-4 text-amber-400" />;
      case 'sunny':
      default:
        return <Sun className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '12s' }} />;
    }
  };

  const getWeatherBadgeColor = () => {
    switch (weatherInfo.condition) {
      case 'rain':
      case 'shower':
        return 'bg-sky-500/15 border-sky-500/30 text-sky-300 hover:bg-sky-500/25';
      case 'snow':
        return 'bg-cyan-500/15 border-cyan-500/30 text-cyan-200 hover:bg-cyan-500/25';
      default:
        return 'bg-rose-500/15 border-rose-500/30 text-rose-300 hover:bg-rose-500/25';
    }
  };

  return (
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-3 py-2 sm:px-5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        
        {/* Left: App Logo & Title */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-sky-500 to-amber-400 flex items-center justify-center shadow-md text-white font-bold text-base shrink-0">
            ❄️
          </div>
          <div className="min-w-0">
            <h1 className="font-black text-sm sm:text-base text-white tracking-tight truncate">
              무더위 쉼터 길안내
            </h1>
            <div className="text-[11px] text-slate-400 truncate flex items-center gap-1">
              <MapPin className="w-3 h-3 text-sky-400 shrink-0 inline" />
              <span className="truncate">{userLocation.addressName.split('(')[0].trim()}</span>
            </div>
          </div>
        </div>

        {/* Right: Weather Box & Quick Location Action */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* Real-time Weather & Temperature Badge (Shows lowest/highest temp & condition) */}
          <button
            onClick={onOpenWeatherModal}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition cursor-pointer text-left ${getWeatherBadgeColor()}`}
            title="상세 날씨 정보 및 기온 확인하기"
          >
            {getWeatherIcon()}
            <div className="text-xs font-bold leading-tight">
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-white text-xs sm:text-sm">{weatherInfo.currentTemp}°C</span>
                <span className="text-[10px] hidden xs:inline px-1 py-0.2 rounded bg-black/30 font-medium">
                  {weatherInfo.conditionLabel}
                </span>
              </div>
              <div className="text-[10px] opacity-85 text-slate-300 flex items-center gap-1 font-normal">
                <span className="text-sky-300 font-semibold">최저 {weatherInfo.minTemp}°</span>
                <span>/</span>
                <span className="text-rose-300 font-semibold">최고 {weatherInfo.maxTemp}°</span>
              </div>
            </div>
          </button>

          {/* GPS Real-time Current Location Button */}
          <button
            onClick={onRefreshGps}
            disabled={isGpsLoading}
            title="실시간 내 GPS 현위치로 갱신 및 이동"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 border border-slate-700 transition disabled:opacity-50 cursor-pointer font-bold text-xs shadow"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGpsLoading ? 'animate-spin text-sky-400' : ''}`} />
            <span>현위치</span>
          </button>

          {/* Location Change Modal Button */}
          <button
            onClick={onOpenLocationModal}
            className="px-2.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition flex items-center gap-1 shadow cursor-pointer"
          >
            <Search className="w-3 h-3 hidden sm:inline" />
            <span>위치변경</span>
          </button>

        </div>
      </div>
    </header>
  );
};

