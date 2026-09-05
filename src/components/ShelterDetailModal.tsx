import React, { useState } from 'react';
import { 
  X, Navigation, MapPin, Clock, Phone, Snowflake, 
  Droplets, Wind, Wifi, BatteryCharging, Accessibility, 
  Users, HeartPulse, ChevronLeft, ChevronRight, CheckCircle2,
  Share2, ShieldAlert
} from 'lucide-react';
import { Shelter } from '../types';
import { formatDistance, getTierInfo } from '../utils/geoUtils';

interface ShelterDetailModalProps {
  shelter: Shelter | null;
  outdoorTemp: number;
  onClose: () => void;
  onStartNavigation: (shelter: Shelter) => void;
}

export const ShelterDetailModal: React.FC<ShelterDetailModalProps> = ({
  shelter,
  outdoorTemp,
  onClose,
  onStartNavigation,
}) => {
  if (!shelter) return null;

  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const tier = shelter.tier || 'red';
  const tierInfo = getTierInfo(tier);
  const tempDiff = (outdoorTemp - shelter.indoorTemp).toFixed(1);

  const nextPhoto = () => {
    setActivePhotoIdx((prev) => (prev + 1) % shelter.photos.length);
  };

  const prevPhoto = () => {
    setActivePhotoIdx((prev) => (prev - 1 + shelter.photos.length) % shelter.photos.length);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `[무더위쉼터] ${shelter.name}`,
        text: `폭염 대피 쉼터: ${shelter.name} (${shelter.detailLocation}), 실내 ${shelter.indoorTemp}°C 쾌적!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${shelter.name} - ${shelter.address}`);
      alert('쉼터 위치 정보가 클립보드에 복사되었습니다.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Modal Container */}
      <div 
        className="relative w-full max-w-xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Header Controls (Close & Share) */}
        <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
          <button
            onClick={handleShare}
            className="p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 shadow-lg backdrop-blur-md transition active:scale-95"
            title="쉼터 정보 공유하기"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-slate-900/80 hover:bg-rose-900/50 text-slate-200 hover:text-rose-400 border border-slate-700 shadow-lg backdrop-blur-md transition active:scale-95"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="overflow-y-auto overflow-x-hidden flex-1 scrollbar-thin scrollbar-thumb-slate-700">
          
          {/* Main Photo Gallery */}
          <div className="relative h-64 sm:h-72 w-full bg-slate-950 overflow-hidden select-none">
            <img
              src={shelter.photos[activePhotoIdx]}
              alt={`${shelter.name} 사진 ${activePhotoIdx + 1}`}
              className="w-full h-full object-cover transition-opacity duration-300"
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/40" />

            {/* Photo Gallery Navigation Arrows */}
            {shelter.photos.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur border border-white/20 transition active:scale-90"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur border border-white/20 transition active:scale-90"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Photo Dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/50 backdrop-blur px-2.5 py-1 rounded-full border border-white/10">
                  {shelter.photos.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActivePhotoIdx(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        i === activePhotoIdx ? 'w-5 bg-sky-400' : 'w-1.5 bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Tier & Distance Pill Badges on Photo */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-2 items-center">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-lg border border-white/30 ${tierInfo.badgeBg} ${tierInfo.badgeText}`}>
                <span>{tierInfo.iconEmoji}</span>
                <span>{tierInfo.label}</span>
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-900/90 text-sky-300 border border-sky-400/40 shadow-lg backdrop-blur">
                <MapPin className="w-3.5 h-3.5" />
                <span>{shelter.distance ? formatDistance(shelter.distance) : ''} (도보 {shelter.walkMinutes}분)</span>
              </span>
            </div>

            {/* Indoor Temperature Highlight Pill on Photo */}
            <div className="absolute bottom-3 right-3 bg-sky-950/90 border border-sky-400/50 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-xl flex items-center gap-2">
              <div className="p-1 rounded-lg bg-sky-500/20 text-sky-400">
                <Snowflake className="w-4 h-4 animate-spin-slow" />
              </div>
              <div className="text-right">
                <div className="text-[10px] text-sky-300 font-semibold">실내 쾌적온도</div>
                <div className="text-sm font-extrabold text-white">{shelter.indoorTemp}°C</div>
              </div>
            </div>
          </div>

          {/* Details Content Container */}
          <div className="p-4 sm:p-6 space-y-5">
            
            {/* Title & Category Header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-800 text-sky-300 border border-slate-700">
                  {shelter.category}
                </span>
                {shelter.weekendOpen && (
                  <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    주말 개방
                  </span>
                )}
                {shelter.specialNote && (
                  <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 truncate max-w-[200px]">
                    {shelter.specialNote}
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {shelter.name}
              </h2>
              <p className="text-sm text-slate-300 mt-1 flex items-center gap-1.5 font-medium">
                <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
                <span>{shelter.detailLocation}</span>
                <span className="text-slate-500 text-xs">({shelter.address})</span>
              </p>
            </div>

            {/* Temperature Comparison Visual Card */}
            <div className="grid grid-cols-3 gap-2 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-center">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <div className="text-[11px] font-semibold text-rose-300">현재 바깥 폭염</div>
                <div className="text-lg font-black text-rose-400 mt-0.5">{outdoorTemp}°C</div>
                <div className="text-[10px] text-slate-400">폭염경보 단계</div>
              </div>

              <div className="p-2 rounded-xl bg-sky-500/15 border border-sky-500/30 flex flex-col justify-center">
                <div className="text-[11px] font-semibold text-sky-300">실내 쉼터</div>
                <div className="text-lg font-black text-sky-300 mt-0.5">{shelter.indoorTemp}°C</div>
                <div className="text-[10px] text-sky-200">에어컨 풀가동</div>
              </div>

              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col justify-center">
                <div className="text-[11px] font-semibold text-emerald-300">체감 쿨링 효과</div>
                <div className="text-lg font-black text-emerald-400 mt-0.5">-{tempDiff}°C</div>
                <div className="text-[10px] text-emerald-200 font-medium">즉시 땀식힘</div>
              </div>
            </div>

            {/* Operational Info (Hours & Phone) */}
            <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/70 space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium">
                  <Clock className="w-4 h-4 text-sky-400" />
                  <span>운영 시간</span>
                </div>
                <span className="font-bold text-white bg-slate-700 px-2 py-0.5 rounded-lg">
                  {shelter.operatingHours}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium">
                  <Users className="w-4 h-4 text-sky-400" />
                  <span>수용 정원</span>
                </div>
                <span className="font-bold text-white">
                  동시 최대 약 {shelter.capacity}명 (좌석 {shelter.amenities.seats}석)
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium">
                  <Phone className="w-4 h-4 text-sky-400" />
                  <span>시설 문의</span>
                </div>
                <a 
                  href={`tel:${shelter.tel}`}
                  className="font-bold text-sky-400 hover:text-sky-300 underline flex items-center gap-1"
                >
                  {shelter.tel}
                </a>
              </div>
            </div>

            {/* Shelter Cooling Amenities Grid */}
            <div>
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2.5">
                쉼터 편의시설 및 구비 품목
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                
                {/* AC */}
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200">
                  <Snowflake className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="font-medium">강력 에어컨</span>
                </div>

                {/* Water */}
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200">
                  <Droplets className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="font-medium">무료 정수기/냉수</span>
                </div>

                {/* Fan Gift */}
                <div className={`flex items-center gap-2 p-2.5 rounded-xl border ${
                  shelter.amenities.fanGift 
                    ? 'bg-slate-800/80 border-slate-700 text-slate-200' 
                    : 'bg-slate-900/40 border-slate-800/60 text-slate-500 opacity-60'
                }`}>
                  <Wind className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="font-medium">부채/쿨링용품</span>
                </div>

                {/* Smartphone Charging */}
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200">
                  <BatteryCharging className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="font-medium">스마트폰 충전</span>
                </div>

                {/* Free Wi-Fi */}
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200">
                  <Wifi className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="font-medium">공공 Wi-Fi</span>
                </div>

                {/* Wheelchair Accessible */}
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200">
                  <Accessibility className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="font-medium">무장애 경사로</span>
                </div>

                {/* First Aid Kit */}
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200">
                  <HeartPulse className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="font-medium">비상 구급함</span>
                </div>

                {/* Comfortable Seats */}
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200">
                  <Users className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-medium">{shelter.amenities.seats}석 휴게의자</span>
                </div>

              </div>
            </div>

            {/* Heatwave Walking Tip Box */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">폭염 이동 안전 팁: </span>
                도보 이동 시 양산이나 모자를 착용하시고, 도로변 직사광선보다 건물 그늘진 보행로를 이용하세요.
              </div>
            </div>

          </div>
        </div>

        {/* Sticky Footer: Big "안내시작 (Start Navigation)" Button */}
        <div className="p-4 bg-slate-950/95 border-t border-slate-800/90 flex items-center gap-3">
          <button
            onClick={onClose}
            className="py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition active:scale-95"
          >
            닫기
          </button>

          <button
            onClick={() => onStartNavigation(shelter)}
            className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-500 to-blue-600 hover:from-blue-500 hover:to-sky-400 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-xl shadow-sky-500/25 active:scale-98 transition group"
          >
            <Navigation className="w-5 h-5 text-white group-hover:rotate-12 transition-transform animate-pulse" />
            <span>안내시작 (도보 길안내)</span>
            <span className="text-xs font-normal text-sky-100 bg-sky-700/50 px-2 py-0.5 rounded-full ml-1">
              약 {shelter.walkMinutes}분
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
