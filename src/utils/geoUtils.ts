import { Shelter, ShelterTier, UserLocation, RouteData, RouteStep, RouteDirectionType } from '../types';

/**
 * Reverse geocodes lat/lng into a human-readable Korean address using OpenStreetMap Nominatim API
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=ko`,
      {
        headers: {
          'Accept-Language': 'ko',
        },
      }
    );
    if (!res.ok) throw new Error('Geocoding network error');
    const data = await res.json();
    if (data && data.display_name) {
      // Clean up Korean address components
      const addr = data.address;
      if (addr) {
        const province = addr.province || addr.city || addr.state || '';
        const borough = addr.borough || addr.district || addr.county || addr.suburb || '';
        const road = addr.road || addr.quarter || addr.neighbourhood || '';
        const houseNumber = addr.house_number || '';
        const building = addr.amenity || addr.building || '';

        const parts = [province, borough, road, houseNumber, building].filter(Boolean);
        if (parts.length >= 2) {
          return parts.join(' ');
        }
      }
      return data.display_name.split(',').slice(0, 3).join(', ');
    }
  } catch (err) {
    console.warn('Reverse geocoding error:', err);
  }
  return `위도 ${lat.toFixed(4)}, 경도 ${lng.toFixed(4)}`;
}

/**
 * Searches Korean locations/addresses by text query
 */
export async function searchKoreanAddress(query: string): Promise<Array<{ address: string; lat: number; lng: number }>> {
  if (!query || query.trim().length < 2) return [];
  const trimmed = query.trim();

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&countrycodes=kr&limit=8&accept-language=ko`,
      {
        headers: {
          'Accept-Language': 'ko',
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item: any) => ({
          address: item.display_name.split(',').slice(0, 3).join(', ') || item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        }));
      }
    }
  } catch (err) {
    console.warn('Address search error:', err);
  }
  return [];
}

/**
 * Calculates distance between two GPS coordinates using the Haversine formula (returns meters)
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radius of Earth in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Formats distance into Korean friendly format (e.g., 180m, 1.2km)
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Estimates walking time in minutes based on 70 meters/minute (approx 4.2 km/h in summer heat)
 */
export function estimateWalkMinutes(meters: number): number {
  return Math.max(1, Math.ceil(meters / 70));
}

/**
 * Enriches shelters with distance from user location, assigns tiers (Blue -> Yellow -> Red)
 * Blue: closest (~top 30% or <400m)
 * Yellow: medium (~30-70% or 400m-800m)
 * Red: farther (>800m)
 */
export function enrichAndSortShelters(
  shelters: Shelter[],
  userLocation: UserLocation
): Shelter[] {
  const withDistance = shelters.map((shelter) => {
    const distance = calculateDistanceMeters(
      userLocation.lat,
      userLocation.lng,
      shelter.lat,
      shelter.lng
    );
    const walkMinutes = estimateWalkMinutes(distance);
    const calorieBurn = Math.round(walkMinutes * 3.8);
    const stepsCount = Math.round(distance * 1.35);

    return {
      ...shelter,
      distance,
      walkMinutes,
      calorieBurn,
      stepsCount,
    };
  });

  // Sort by ascending distance
  withDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));

  // Assign tiers proportionally (at least 2-3 in blue, 3-4 in yellow, rest in red)
  const total = withDistance.length;
  const blueCount = Math.max(1, Math.ceil(total * 0.35));
  const yellowCount = Math.max(1, Math.ceil(total * 0.35));

  return withDistance.map((s, index) => {
    let tier: ShelterTier = 'red';
    if (index < blueCount || (s.distance && s.distance < 380)) {
      tier = 'blue';
    } else if (index < blueCount + yellowCount || (s.distance && s.distance < 850)) {
      tier = 'yellow';
    } else {
      tier = 'red';
    }

    return {
      ...s,
      tier,
    };
  });
}

/**
 * Returns Korean tier description & color details
 */
export function getTierInfo(tier: ShelterTier) {
  switch (tier) {
    case 'blue':
      return {
        label: '가장 가까움 (1순위)',
        color: '#2563eb', // Blue-600
        bgLight: 'bg-blue-500/15',
        border: 'border-blue-500/40',
        text: 'text-blue-400',
        badgeBg: 'bg-blue-600',
        badgeText: 'text-white',
        pulseClass: 'bg-blue-500',
        iconEmoji: '🔵',
        status: '도보 1~4분 내 신속 피신 가능',
      };
    case 'yellow':
      return {
        label: '중간 거리 (2순위)',
        color: '#eab308', // Yellow-500
        bgLight: 'bg-amber-500/15',
        border: 'border-amber-500/40',
        text: 'text-amber-400',
        badgeBg: 'bg-amber-500',
        badgeText: 'text-slate-900',
        pulseClass: 'bg-amber-400',
        iconEmoji: '🟡',
        status: '도보 5~9분 거리 (양산/모자 착용 권장)',
      };
    case 'red':
      return {
        label: '다소 먼 거리 (3순위)',
        color: '#ef4444', // Red-500
        bgLight: 'bg-rose-500/15',
        border: 'border-rose-500/40',
        text: 'text-rose-400',
        badgeBg: 'bg-rose-600',
        badgeText: 'text-white',
        pulseClass: 'bg-rose-500',
        iconEmoji: '🔴',
        status: '도보 10분 이상 (그늘길 이동 및 수분 섭취)',
      };
  }
}

/**
 * Generates realistic Turn-by-Turn navigation route coordinates and instructions
 */
export function generateRouteData(
  startLat: number,
  startLng: number,
  shelter: Shelter
): RouteData {
  const endLat = shelter.lat;
  const endLng = shelter.lng;
  const totalDist = calculateDistanceMeters(startLat, startLng, endLat, endLng);
  const totalMins = estimateWalkMinutes(totalDist);

  // Generate intermediate waypoint nodes that simulate Korean street grid
  const dLat = endLat - startLat;
  const dLng = endLng - startLng;

  // We create 4~6 segmented waypoint nodes
  const p1: [number, number] = [startLat, startLng];
  const p2: [number, number] = [startLat + dLat * 0.25, startLng + dLng * 0.05];
  const p3: [number, number] = [startLat + dLat * 0.45, startLng + dLng * 0.55];
  const p4: [number, number] = [startLat + dLat * 0.75, startLng + dLng * 0.65];
  const p5: [number, number] = [startLat + dLat * 0.90, startLng + dLng * 0.95];
  const p6: [number, number] = [endLat, endLng];

  const polylineCoordinates: [number, number][] = [p1, p2, p3, p4, p5, p6];

  // Distances between segments
  const dist1 = calculateDistanceMeters(p1[0], p1[1], p2[0], p2[1]);
  const dist2 = calculateDistanceMeters(p2[0], p2[1], p3[0], p3[1]);
  const dist3 = calculateDistanceMeters(p3[0], p3[1], p4[0], p4[1]);
  const dist4 = calculateDistanceMeters(p4[0], p4[1], p5[0], p5[1]);
  const dist5 = calculateDistanceMeters(p5[0], p5[1], p6[0], p6[1]);

  const steps: RouteStep[] = [
    {
      id: 1,
      instruction: '현위치에서 그늘진 보도를 따라 80m 직진하세요.',
      distance: dist1 || 80,
      direction: 'straight',
      landmark: '출발 지점',
      coord: p1,
    },
    {
      id: 2,
      instruction: '사거리에서 우측 그늘막 방향으로 우회전하세요.',
      distance: dist2 || 120,
      direction: 'turn-right',
      landmark: '스마트 그늘막 사거리',
      coord: p2,
    },
    {
      id: 3,
      instruction: '보행자 횡단보도를 건넌 후 좌측 보도로 진입하세요.',
      distance: dist3 || 90,
      direction: 'crosswalk',
      landmark: '안심 횡단보도',
      coord: p3,
    },
    {
      id: 4,
      instruction: '약 140m 직진 후 완만한 경사로를 따라 이동하세요.',
      distance: dist4 || 140,
      direction: 'straight',
      landmark: '가로수 그늘길',
      coord: p4,
    },
    {
      id: 5,
      instruction: `${shelter.name} 정문 입구(${shelter.detailLocation || '1층 로비'})로 진입하세요.`,
      distance: dist5 || 40,
      direction: 'arrive',
      landmark: shelter.name,
      coord: p5,
    },
  ];

  return {
    steps,
    polylineCoordinates,
    totalDistance: totalDist,
    totalMinutes: totalMins,
  };
}

/**
 * Text-to-Speech voice guidance in Korean
 */
export function speakGuide(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel(); // Stop prior speeches
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Ignore speech failure
  }
}
