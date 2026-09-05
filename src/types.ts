export type ShelterTier = 'blue' | 'yellow' | 'red';

export type ShelterCategory = 
  | '전체'
  | '주민센터'
  | '노인복지관'
  | '시중은행'
  | '공공도서관'
  | '지하철역'
  | '구민회관/공공시설';

export interface AmenityInfo {
  ac: boolean; // 에어컨 냉방
  water: boolean; // 무료 정수기/음용수
  fanGift: boolean; // 부채/쿨링용품 무료 제공
  wifi: boolean; // 공공 Wi-Fi
  charge: boolean; // 스마트폰 충전
  wheelchair: boolean; // 휠체어/무장애 경사로
  seats: number; // 좌석 수
  firstAid: boolean; // 구급함/비상약품
}

export interface Shelter {
  id: string;
  name: string;
  category: ShelterCategory;
  address: string;
  detailLocation: string; // e.g. "1층 로비 및 민원실 휴게존"
  lat: number;
  lng: number;
  photos: string[];
  indoorTemp: number; // e.g. 23.8 °C
  operatingHours: string; // e.g. "09:00 ~ 18:00 (주말/공휴일 개방)"
  capacity: number; // e.g. 35명
  tel: string;
  amenities: AmenityInfo;
  is24Hours?: boolean;
  weekendOpen?: boolean;
  specialNote?: string;
  
  // Computed dynamically relative to current user position
  distance?: number; // meters
  tier?: ShelterTier; // 'blue' (가장 가까움), 'yellow' (중간), 'red' (다소 멂)
  walkMinutes?: number;
  calorieBurn?: number;
  stepsCount?: number;
}

export interface UserLocation {
  lat: number;
  lng: number;
  addressName: string;
  isGps: boolean;
  accuracy?: number;
  timestamp?: number;
}

export type RouteDirectionType = 
  | 'straight' 
  | 'turn-left' 
  | 'turn-right' 
  | 'slight-left' 
  | 'slight-right' 
  | 'crosswalk' 
  | 'arrive';

export interface RouteStep {
  id: number;
  instruction: string;
  distance: number; // meters
  direction: RouteDirectionType;
  landmark?: string;
  coord: [number, number]; // [lat, lng]
}

export interface RouteData {
  steps: RouteStep[];
  polylineCoordinates: [number, number][];
  totalDistance: number; // meters
  totalMinutes: number;
}

export interface NavigationState {
  isActive: boolean;
  targetShelter: Shelter | null;
  currentStepIndex: number;
  remainingDistance: number;
  remainingTime: number;
  userCurrentCoord: [number, number];
  isSimulating: boolean;
  soundEnabled: boolean;
  hasArrived: boolean;
  walkingProgress: number; // 0 to 100%
}

export type WeatherConditionType = 'sunny' | 'rain' | 'snow' | 'cloudy' | 'shower' | 'thunder';

export interface WeatherInfo {
  condition: WeatherConditionType;
  conditionLabel: string;
  currentTemp: number; // 현재기온 °C
  minTemp: number; // 최저기온 °C
  maxTemp: number; // 최고기온 °C
  feelsLikeTemp: number; // 체감온도 °C
  precipitationProbability: number; // 강수확률 %
  precipitationAmount?: string; // 강수량 (비/눈 올 때)
  humidity: number; // 습도 %
  uvIndex: '위험' | '매우높음' | '높음' | '보통';
  alertLevel: '폭염경보' | '폭염주의보' | '호우주의보' | '대설주의보' | '기상특보없음';
  advisoryText: string;
  hydrationGoalMl: number;
}

// Backward compatibility alias
export type HeatwaveAlert = WeatherInfo;

