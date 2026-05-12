export const COVERAGE_CONFIG = {
  wirasana: {
    lat: -7.3800556,
    lng: 109.3683611,
  },
  radiusKm: 5,
  availableLevels: ["Calistung", "SD", "SMP"] as const,
  comingSoonLevels: ["SMA"] as const,
} as const;

export const COVERAGE_DISTRICTS = [
  { name: "Purbalingga", distanceKm: 0.5 },
  { name: "Kalimanah", distanceKm: 3.2 },
  { name: "Padamara", distanceKm: 4.1 },
  { name: "Bojongsari", distanceKm: 4.8 },
  { name: "Kutasari", distanceKm: 4.9 },
  { name: "Mrebet", distanceKm: 8.5 },
  { name: "Bukateja", distanceKm: 10.2 },
  { name: "Kaligondang", distanceKm: 7.4 },
  { name: "Kejobong", distanceKm: 15.6 },
  { name: "Kemangkon", distanceKm: 12.1 },
  { name: "Kertanegara", distanceKm: 18.3 },
  { name: "Karanganyar", distanceKm: 20.1 },
  { name: "Karangmoncol", distanceKm: 24.5 },
  { name: "Karangreja", distanceKm: 28.0 },
  { name: "Karangjambu", distanceKm: 32.0 },
  { name: "Bobotsari", distanceKm: 14.2 },
  { name: "Pengadegan", distanceKm: 16.5 },
  { name: "Rembang", distanceKm: 26.0 },
] as const;

export type CoverageDistrict = (typeof COVERAGE_DISTRICTS)[number];
export type CoverageLevel =
  | (typeof COVERAGE_CONFIG.availableLevels)[number]
  | "SMA";
