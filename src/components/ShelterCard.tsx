import React from 'react';
import { 
  Navigation, MapPin, Snowflake, Clock, Droplets, 
  Wind, BatteryCharging, ChevronRight, Eye 
} from 'lucide-react';
import { Shelter } from '../types';
import { formatDistance, getTierInfo } from '../utils/geoUtils';

interface ShelterCardProps {
  shelter: Shelter;
  isSelected: boolean;
  onSelect: (shelter: Shelter) => void;
  onStartNavigation: (shelter: Shelter) => void;
}

export const ShelterCard: React.FC<ShelterCardProps> = ({
  shelter,
  isSelected,
  onSelect,
  onStartNavigation,
}) => {
  const tier = shelter.tier || 'red';
  const tierInfo = getTierInfo(tier);

  return (
    <div
      onClick={() => onSelect(shelter)}
      className={`group relative bg-slate-900/90 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden shadow-lg hover:shadow-2xl hover:border-sky-500/50 ${
        isSelected
          ? 'border-sky-400 ring-2 ring-sky-400/30 bg-slate-850'
          : 'border-slate-800 hover:bg-slate-850'
      }`}
    >
      {/* Left Tier Color Accent Strip */}
      <div 
        className="absolute top-0 bottom-0 left-0 w-1.5"
        style={{ backgroundColor: tierInfo.color }}
      />

      <div className="p-3.5 sm:p-4 pl-4 sm:pl-5 flex flex-col sm:flex-row gap-3.5">
        
        {/* Shelter Thumbnail Photo with Badges */}
        <div className="relative w-full sm:w-32 h-28 sm:h-28 rounded-xl overflow-hidden bg-slate-800 shrink-0">
          <img
            src={shelter.photos[0]}
            alt={shelter.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

          {/* Tier Badge on top of image */}
          <div className={`absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[10px] font-black shadow ${tierInfo.badgeBg} ${tierInfo.badgeText} flex items-center gap-1`}>
            <span>{tierInfo.iconEmoji}</span>
            <span>{tierInfo.label.split(' ')[0]}</span>
          </div>

          {/* Indoor Cool Temp Badge */}
          <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between text-[10px] font-bold text-white bg-slate-900/80 backdrop-blur px-1.5 py-0.5 rounded-md border border-slate-700">
            <span className="flex items-center gap-0.5 text-sky-300">
              <Snowflake className="w-3 h-3 text-sky-400" />
              {shelter.indoorTemp}°C
            </span>
            <span className="text-slate-400 text-[9px]">냉방중</span>
          </div>
        </div>

        {/* Shelter Information Info Box */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          
          <div>
            {/* Top row: Category & Distance */}
            <div className="flex items-center justify-between gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-sky-300 border border-slate-700">
                {shelter.category}
              </span>

              <div className="flex items-center gap-1.5 font-extrabold text-sm text-sky-400">
                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                <span>{shelter.distance ? formatDistance(shelter.distance) : ''}</span>
                <span className="text-xs text-slate-400 font-normal">
                  (도보 {shelter.walkMinutes}분)
                </span>
              </div>
            </div>

            {/* Shelter Title */}
            <h3 className="font-extrabold text-white text-base mt-1.5 truncate group-hover:text-sky-300 transition-colors">
              {shelter.name}
            </h3>

            {/* Detail Location / Floor */}
            <p className="text-xs text-slate-400 truncate mt-0.5 flex items-center gap-1">
              <span>📍 {shelter.detailLocation}</span>
            </p>
          </div>

          {/* Amenities & Operating Hours preview */}
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap text-xs">
            
            {/* Amenity Icons */}
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <span className="flex items-center gap-0.5 bg-slate-800 px-1.5 py-0.5 rounded" title="무료 정수기">
                <Droplets className="w-3 h-3 text-sky-400" /> 냉수
              </span>
              {shelter.amenities.fanGift && (
                <span className="flex items-center gap-0.5 bg-slate-800 px-1.5 py-0.5 rounded" title="부채 제공">
                  <Wind className="w-3 h-3 text-amber-400" /> 부채
                </span>
              )}
              {shelter.amenities.charge && (
                <span className="flex items-center gap-0.5 bg-slate-800 px-1.5 py-0.5 rounded" title="스마트폰 충전">
                  <BatteryCharging className="w-3 h-3 text-emerald-400" /> 충전
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(shelter);
                }}
                className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1 transition"
              >
                <Eye className="w-3 h-3 text-sky-400" />
                <span>사진보기</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStartNavigation(shelter);
                }}
                className="px-3 py-1 rounded-xl bg-blue-600 hover:bg-sky-500 text-white text-xs font-extrabold flex items-center gap-1 shadow-md active:scale-95 transition"
              >
                <Navigation className="w-3 h-3" />
                <span>안내시작</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
