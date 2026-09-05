import React from 'react';
import { X, Flame, ShieldAlert, Droplets, Sun, Phone, CloudRain, Snowflake, Cloud, CloudLightning, Thermometer, Wind, Check } from 'lucide-react';
import { WeatherInfo, WeatherConditionType } from '../types';

interface WeatherInfoModalProps {
  weatherInfo: WeatherInfo;
  onUpdateWeather?: (weather: WeatherInfo) => void;
  onClose: () => void;
}

export const HeatwaveInfoModal: React.FC<WeatherInfoModalProps> = ({
  weatherInfo,
  onUpdateWeather,
  onClose,
}) => {
  // Preset weather condition simulator options
  const weatherPresets: Array<{
    type: WeatherConditionType;
    label: string;
    icon: string;
    temp: number;
    minTemp: number;
    maxTemp: number;
    feelsLike: number;
    humidity: number;
    prob: number;
    precipAmount?: string;
    alert: '폭염경보' | '폭염주의보' | '호우주의보' | '대설주의보' | '기상특보없음';
    advisory: string;
  }> = [
    {
      type: 'sunny',
      label: '맑음 (폭염특보)',
      icon: '☀️',
      temp: 34.2,
      minTemp: 23.5,
      maxTemp: 35.8,
      feelsLike: 36.8,
      humidity: 78,
      prob: 10,
      alert: '폭염경보',
      advisory: '낮 12시~17시 실외활동을 자제하고 가까운 파란색 무더위 쉼터로 이동하세요.',
    },
    {
      type: 'rain',
      label: '비 (호우주의보)',
      icon: '🌧️',
      temp: 25.4,
      minTemp: 22.0,
      maxTemp: 26.5,
      feelsLike: 27.2,
      humidity: 95,
      prob: 90,
      precipAmount: '시간당 25mm 강수',
      alert: '호우주의보',
      advisory: '갑작스러운 폭우 시 침수 우려 지역을 피하고 안전한 공공 쉼터 건물로 대피하세요.',
    },
    {
      type: 'shower',
      label: '소나기 (국지성)',
      icon: '🌦️',
      temp: 28.5,
      minTemp: 23.0,
      maxTemp: 31.0,
      feelsLike: 30.5,
      humidity: 85,
      prob: 70,
      precipAmount: '소나기 10~40mm',
      alert: '폭염주의보',
      advisory: '대기 불안정으로 인한 기습 소나기에 유의하시고 쉼터에서 비를 피하세요.',
    },
    {
      type: 'snow',
      label: '눈 (대설주의보)',
      icon: '❄️',
      temp: -2.5,
      minTemp: -7.0,
      maxTemp: 0.5,
      feelsLike: -6.8,
      humidity: 65,
      prob: 85,
      precipAmount: '적설량 5~8cm',
      alert: '대설주의보',
      advisory: '도로 및 보도 빙판길 낙상사고에 유의하시고 온열 개방 쉼터를 이용하세요.',
    },
    {
      type: 'cloudy',
      label: '구름많음 / 흐림',
      icon: '⛅',
      temp: 29.0,
      minTemp: 22.5,
      maxTemp: 30.5,
      feelsLike: 30.2,
      humidity: 70,
      prob: 30,
      alert: '기상특보없음',
      advisory: '자외선 차단에 유의하시고 쾌적한 쉼터에서 휴식을 취하세요.',
    },
  ];

  const handleSelectPreset = (preset: typeof weatherPresets[0]) => {
    if (onUpdateWeather) {
      onUpdateWeather({
        condition: preset.type,
        conditionLabel: preset.label.split(' ')[0],
        currentTemp: preset.temp,
        minTemp: preset.minTemp,
        maxTemp: preset.maxTemp,
        feelsLikeTemp: preset.feelsLike,
        humidity: preset.humidity,
        precipitationProbability: preset.prob,
        precipitationAmount: preset.precipAmount,
        uvIndex: preset.type === 'sunny' ? '위험' : '보통',
        alertLevel: preset.alert,
        advisoryText: preset.advisory,
        hydrationGoalMl: preset.type === 'sunny' ? 2000 : 1500,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      
      <div 
        className="relative w-full max-w-lg max-h-[88vh] bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xl">
              {weatherInfo.condition === 'rain' || weatherInfo.condition === 'shower' ? '🌧️' : weatherInfo.condition === 'snow' ? '❄️' : weatherInfo.condition === 'cloudy' ? '⛅' : '☀️'}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>실시간 기상 및 대피 수칙</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-600 text-white font-extrabold">
                  {weatherInfo.alertLevel}
                </span>
              </h2>
              <p className="text-xs text-sky-300">
                현재 {weatherInfo.currentTemp}°C · 최저 {weatherInfo.minTemp}°C / 최고 {weatherInfo.maxTemp}°C
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-4 text-xs sm:text-sm text-slate-300 scrollbar-thin scrollbar-thumb-slate-700">
          
          {/* Temperature & Weather Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            
            <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                <Thermometer className="w-3 h-3 text-sky-400" />
                <span>오늘 기온 범위</span>
              </div>
              <div className="text-sm font-black text-white mt-1">
                <span className="text-sky-300">{weatherInfo.minTemp}°</span> ~ <span className="text-rose-300">{weatherInfo.maxTemp}°</span>
              </div>
              <div className="text-[10px] text-slate-400">최저 / 최고 기온</div>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="text-[11px] text-slate-400">체감온도</div>
              <div className="text-sm font-black text-amber-400 mt-1">{weatherInfo.feelsLikeTemp}°C</div>
              <div className="text-[10px] text-slate-400">습도 {weatherInfo.humidity}%</div>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="text-[11px] text-slate-400">
                {weatherInfo.condition === 'snow' ? '강설/적설' : '강수확률'}
              </div>
              <div className="text-sm font-black text-sky-400 mt-1">{weatherInfo.precipitationProbability}%</div>
              <div className="text-[10px] text-sky-300 truncate">
                {weatherInfo.precipitationAmount || (weatherInfo.precipitationProbability > 50 ? '우산·우비 필요' : '강수 없음')}
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="text-[11px] text-slate-400">자외선 지수</div>
              <div className="text-sm font-black text-rose-400 mt-1">{weatherInfo.uvIndex}</div>
              <div className="text-[10px] text-rose-300">
                {weatherInfo.condition === 'sunny' ? '양산·선글라스' : '보통 수준'}
              </div>
            </div>

          </div>

          {/* Quick Weather Condition Simulation Switcher (비/눈/폭염/흐림 선택) */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="text-[11px] font-bold text-slate-300 mb-2 flex items-center justify-between">
              <span>🌦️ 기상 상태 빠른 변경/확인</span>
              <span className="text-[10px] text-sky-400">터치 시 즉시 상태 반영</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {weatherPresets.map((preset) => {
                const isSelected = weatherInfo.condition === preset.type;
                return (
                  <button
                    key={preset.type}
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-2 rounded-xl text-left border flex items-center justify-between transition cursor-pointer ${
                      isSelected
                        ? 'bg-sky-500/20 border-sky-400 text-white font-bold'
                        : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-base">{preset.icon}</span>
                      <div className="truncate">
                        <div className="text-xs truncate">{preset.label.split(' ')[0]}</div>
                        <div className="text-[10px] text-slate-400">{preset.temp}°C</div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Safety & Shelter Guidelines */}
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>기상 상황별 안심 쉼터 대피 수칙</span>
            </h3>

            <div className="space-y-2">
              {weatherInfo.condition === 'rain' || weatherInfo.condition === 'shower' ? (
                <div className="p-3 rounded-2xl bg-sky-950/40 border border-sky-500/30 space-y-1">
                  <div className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                    <CloudRain className="w-4 h-4 text-sky-400" />
                    <span>호우 및 비 피해 예방</span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    지하도나 저지대 침수 구역 통행을 피하고, 비가 그칠 때까지 가까운 <strong>주민센터, 도서관, 은행 쉼터</strong> 실내에서 안전하게 대기하세요.
                  </p>
                </div>
              ) : weatherInfo.condition === 'snow' ? (
                <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 space-y-1">
                  <div className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                    <Snowflake className="w-4 h-4 text-cyan-300" />
                    <span>대설 및 한파 안전 수칙</span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    빙판길 보행 시 주머니에 손을 넣지 마시고 미끄럼 방지 신발을 착용하세요. 체온 유지를 위해 <strong>한파 쉼터</strong>의 난방 휴게존을 이용하세요.
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/30 space-y-1">
                  <div className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>폭염 온열질환 3대 수칙 (물 · 그늘 · 휴식)</span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    갈증이 나지 않아도 규칙적으로 물을 마시고, 낮 시간대 실외 활동을 줄이고 <strong>가장 가까운 파란색 1순위 무더위 쉼터</strong>에서 에어컨 냉방 휴식을 취하세요.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Emergency contacts */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between gap-2">
            <div className="text-xs">
              <span className="font-bold text-white">🚨 응급구조 및 기상 상담</span>
              <div className="text-[11px] text-slate-400">온열질환·침수 사고 긴급 출동</div>
            </div>
            <div className="flex gap-2">
              <a href="tel:119" className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1 shadow">
                <Phone className="w-3 h-3" />
                <span>119 신고</span>
              </a>
              <a href="tel:131" className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold text-xs border border-slate-700">
                131 기상콜
              </a>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs active:scale-95 transition cursor-pointer"
          >
            확인 및 쉼터 지도로 돌아가기
          </button>
        </div>

      </div>
    </div>
  );
};

