import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Navigation, X, Volume2, VolumeX, Play, Pause, FastForward,
  CornerUpRight, CornerUpLeft, ArrowUp, Footprints, ShieldAlert,
  Snowflake, CheckCircle, Droplets, MapPin, Sparkles
} from 'lucide-react';
import { NavigationState, RouteData, Shelter, UserLocation } from '../types';
import { formatDistance, speakGuide } from '../utils/geoUtils';

interface NavigationOverlayProps {
  navigationState: NavigationState;
  routeData: RouteData | null;
  userLocation: UserLocation;
  outdoorTemp: number;
  onUpdateNavState: React.Dispatch<React.SetStateAction<NavigationState>>;
  onExitNavigation: () => void;
}

export const NavigationOverlay: React.FC<NavigationOverlayProps> = ({
  navigationState,
  routeData,
  userLocation,
  outdoorTemp,
  onUpdateNavState,
  onExitNavigation,
}) => {
  const { targetShelter, currentStepIndex, isSimulating, soundEnabled, hasArrived, walkingProgress } = navigationState;
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [showStepList, setShowStepList] = useState(false);

  if (!targetShelter || !routeData) return null;

  const currentStep = routeData.steps[currentStepIndex] || routeData.steps[0];
  const totalSteps = routeData.steps.length;

  // Trigger Korean voice announcement whenever step changes or when sound is turned on
  useEffect(() => {
    if (soundEnabled && currentStep) {
      speakGuide(currentStep.instruction);
    }
  }, [currentStepIndex, soundEnabled]);

  // Handle Arrival Confetti
  useEffect(() => {
    if (hasArrived) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#38bdf8', '#60a5fa', '#34d399', '#fef08a'],
        });
      } catch {}
      if (soundEnabled) {
        speakGuide(`목적지인 ${targetShelter.name}에 도착했습니다. 시원한 실내에서 충분히 휴식하세요.`);
      }
    }
  }, [hasArrived]);

  // Simulation Timer loop (interpolates coordinates along polyline and updates steps)
  useEffect(() => {
    if (!isSimulating || hasArrived) return;

    const interval = setInterval(() => {
      onUpdateNavState((prev) => {
        const nextProgress = prev.walkingProgress + (1.5 * simSpeed);
        
        if (nextProgress >= 100) {
          return {
            ...prev,
            walkingProgress: 100,
            hasArrived: true,
            isSimulating: false,
            currentStepIndex: totalSteps - 1,
            remainingDistance: 0,
            remainingTime: 0,
            userCurrentCoord: [targetShelter.lat, targetShelter.lng],
          };
        }

        // Calculate which polyline point matches progress
        const coords = routeData.polylineCoordinates;
        const totalPoints = coords.length;
        const pointIndex = Math.min(
          totalPoints - 1,
          Math.floor((nextProgress / 100) * (totalPoints - 1))
        );
        const currentCoord = coords[pointIndex];

        // Step index matching
        const stepIdx = Math.min(
          totalSteps - 1,
          Math.floor((nextProgress / 100) * totalSteps)
        );

        const remDist = Math.max(0, Math.round(routeData.totalDistance * (1 - nextProgress / 100)));
        const remTime = Math.max(1, Math.ceil(remDist / 70));

        return {
          ...prev,
          walkingProgress: nextProgress,
          currentStepIndex: stepIdx,
          remainingDistance: remDist,
          remainingTime: remTime,
          userCurrentCoord: currentCoord,
        };
      });
    }, 400);

    return () => clearInterval(interval);
  }, [isSimulating, hasArrived, simSpeed, totalSteps, routeData, targetShelter]);

  // Toggle Simulation Play/Pause
  const toggleSimulation = () => {
    onUpdateNavState((prev) => ({
      ...prev,
      isSimulating: !prev.isSimulating,
    }));
  };

  // Toggle Voice Sound
  const toggleSound = () => {
    onUpdateNavState((prev) => {
      const nextSound = !prev.soundEnabled;
      if (nextSound && currentStep) {
        speakGuide(currentStep.instruction);
      }
      return {
        ...prev,
        soundEnabled: nextSound,
      };
    });
  };

  // Get Direction Icon
  const getDirectionIcon = (dir: string) => {
    switch (dir) {
      case 'turn-right':
      case 'slight-right':
        return <CornerUpRight className="w-8 h-8 text-amber-400" />;
      case 'turn-left':
      case 'slight-left':
        return <CornerUpLeft className="w-8 h-8 text-sky-400" />;
      case 'crosswalk':
        return <Footprints className="w-8 h-8 text-emerald-400" />;
      case 'arrive':
        return <Snowflake className="w-8 h-8 text-sky-300 animate-spin-slow" />;
      default:
        return <ArrowUp className="w-8 h-8 text-blue-400" />;
    }
  };

  return (
    <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-3 sm:p-4">
      
      {/* Top HUD Banner: Turn-by-Turn Maneuver Bar */}
      <div className="pointer-events-auto w-full max-w-2xl mx-auto bg-slate-900/95 backdrop-blur-xl border border-sky-500/40 rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-300">
        
        {/* Next Maneuver Main Header */}
        <div className="p-3.5 sm:p-4 flex items-center gap-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
          
          {/* Large Directional Maneuver Icon */}
          <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-700 flex items-center justify-center shadow-inner shrink-0">
            {getDirectionIcon(currentStep.direction)}
          </div>

          {/* Turn Instruction Text & Distance */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-sky-400 bg-sky-500/20 px-2 py-0.5 rounded-full">
                {currentStep.distance ? `${currentStep.distance}m 앞` : '진행'}
              </span>
              {currentStep.landmark && (
                <span className="text-xs text-slate-400 truncate">
                  📍 {currentStep.landmark}
                </span>
              )}
            </div>
            
            <p className="text-sm sm:text-base font-extrabold text-white mt-1 leading-snug">
              {currentStep.instruction}
            </p>
          </div>

          {/* Right Action Icons (TTS Voice & Close) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={toggleSound}
              title={soundEnabled ? '음성 안내 끄기' : '음성 안내 켜기'}
              className={`p-2.5 rounded-xl border transition cursor-pointer ${
                soundEnabled
                  ? 'bg-sky-600/30 border-sky-500/50 text-sky-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={onExitNavigation}
              title="길안내 종료"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-900/50 border border-slate-700 text-slate-300 hover:text-rose-400 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar & Heatwave Tip Ticker */}
        <div className="bg-slate-950 px-4 py-2 border-t border-slate-800/80 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-[11px] text-slate-400 font-semibold shrink-0">
              도보 진행률 {Math.round(walkingProgress)}%
            </span>
            <div className="h-2 flex-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-blue-500 transition-all duration-300 rounded-full"
                style={{ width: `${walkingProgress}%` }}
              />
            </div>
          </div>

          <div className="text-[11px] text-amber-300 font-medium shrink-0 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>야외 {outdoorTemp}°C · 그늘길 유지</span>
          </div>
        </div>
      </div>

      {/* Arrival Dialog (When reaching destination) */}
      {hasArrived && (
        <div className="pointer-events-auto w-full max-w-lg mx-auto my-auto bg-slate-900/98 backdrop-blur-2xl border-2 border-sky-400 rounded-3xl p-5 sm:p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-3xl bg-sky-500/20 border-2 border-sky-400 flex items-center justify-center mx-auto text-3xl shadow-lg shadow-sky-500/30">
            ❄️
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-extrabold mb-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>무더위 쉼터 도착 완료!</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              {targetShelter.name}
            </h3>
            <p className="text-xs text-sky-300 mt-1 font-medium">
              📍 {targetShelter.detailLocation}
            </p>
          </div>

          {/* Shelter Cooling Reward Box */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-left text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5 font-bold text-white">
                <Snowflake className="w-4 h-4 text-sky-400" /> 실내 냉방 온도
              </span>
              <span className="text-sm font-extrabold text-sky-300">
                {targetShelter.indoorTemp}°C (쾌적)
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-sky-400" /> 무료 음용수
              </span>
              <span className="font-semibold text-emerald-400">정수기 및 냉수 이용 가능</span>
            </div>

            <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
              * 에어컨 바람을 직접 맞지 말고, 10분 이상 앉아 땀을 충분히 식힌 후 수분을 섭취하세요.
            </div>
          </div>

          {/* Exit Navigation Button */}
          <button
            onClick={onExitNavigation}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 text-white font-black text-sm shadow-xl active:scale-95 transition"
          >
            안내 종료하고 쉼터 이용하기
          </button>
        </div>
      )}

      {/* Bottom Floating Navigation Controller Card */}
      {!hasArrived && (
        <div className="pointer-events-auto w-full max-w-2xl mx-auto bg-slate-900/95 backdrop-blur-xl border border-slate-700/90 rounded-3xl p-4 shadow-2xl space-y-3 animate-in slide-in-from-bottom-4 duration-300">
          
          {/* Target Shelter Info & ETA */}
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white">
                  목적지
                </span>
                <h3 className="font-extrabold text-white text-base truncate">
                  {targetShelter.name}
                </h3>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {targetShelter.detailLocation}
              </p>
            </div>

            {/* Remaining Distance & ETA */}
            <div className="text-right shrink-0 pl-3">
              <div className="text-lg font-black text-sky-400">
                {formatDistance(navigationState.remainingDistance)}
              </div>
              <div className="text-xs text-slate-300 font-semibold">
                도보 약 {navigationState.remainingTime}분 남음
              </div>
            </div>
          </div>

          {/* Simulation & Navigation Controls Bar */}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
            
            {/* Simulation Walk Button */}
            <button
              onClick={toggleSimulation}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer ${
                isSimulating
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                  : 'bg-sky-600 hover:bg-sky-500 text-white shadow-md'
              }`}
            >
              {isSimulating ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>도보 시뮬레이션 일시정지</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>실시간 걸어가기 시뮬레이션</span>
                </>
              )}
            </button>

            {/* Speed Controller */}
            {isSimulating && (
              <button
                onClick={() => setSimSpeed((prev) => (prev === 1 ? 2 : prev === 2 ? 4 : 1))}
                className="px-2.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sky-400 font-extrabold text-xs flex items-center gap-1 hover:bg-slate-700 transition"
                title="모의보행 배속 변경"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>{simSpeed}x</span>
              </button>
            )}

            {/* Step list toggle */}
            <button
              onClick={() => setShowStepList(!showStepList)}
              className="px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition"
            >
              전체경로 ({currentStepIndex + 1}/{totalSteps})
            </button>

            {/* Exit Nav Button */}
            <button
              onClick={onExitNavigation}
              className="px-3 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold transition"
            >
              종료
            </button>
          </div>

          {/* Collapsible Steps list drawer */}
          {showStepList && (
            <div className="max-h-48 overflow-y-auto space-y-1.5 pt-2 border-t border-slate-800 scrollbar-thin scrollbar-thumb-slate-700">
              {routeData.steps.map((step, idx) => {
                const isCurrent = idx === currentStepIndex;
                const isDone = idx < currentStepIndex;
                return (
                  <div
                    key={step.id}
                    className={`p-2 rounded-xl text-xs flex items-center gap-2.5 transition ${
                      isCurrent
                        ? 'bg-sky-500/20 border border-sky-500/40 text-sky-200 font-bold'
                        : isDone
                        ? 'bg-slate-950/40 text-slate-500 line-through'
                        : 'bg-slate-950/70 text-slate-300'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <span className="flex-1">{step.instruction}</span>
                    <span className="text-[11px] text-slate-400 shrink-0">{step.distance}m</span>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

    </div>
  );
};
