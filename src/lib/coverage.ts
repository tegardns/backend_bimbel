import {
  COVERAGE_CONFIG,
  COVERAGE_DISTRICTS,
  type CoverageLevel,
} from "../config/coverage";

export type CoverageResult = {
  district: string;
  level: CoverageLevel;
  available: boolean;
  status: "available" | "unavailable" | "coming_soon" | "not_found";
  message: string;
  radiusKm: number;
  distanceKm: number | null;
};

function normalizeText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function getDistrictOptions() {
  return [...COVERAGE_DISTRICTS]
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .map((district) => ({
      name: district.name,
      distanceKm: district.distanceKm,
      available: district.distanceKm <= COVERAGE_CONFIG.radiusKm,
    }));
}

export function getDistrictByName(name: string) {
  const normalized = normalizeText(name);

  return COVERAGE_DISTRICTS.find(
    (district) => normalizeText(district.name) === normalized,
  );
}

export function evaluateCoverage(
  districtName: string,
  level: CoverageLevel,
): CoverageResult {
  if (level === "SMA") {
    return {
      district: districtName,
      level,
      available: false,
      status: "coming_soon",
      message: "SMA coming soon",
      radiusKm: COVERAGE_CONFIG.radiusKm,
      distanceKm: null,
    };
  }

  const district = getDistrictByName(districtName);

  if (!district) {
    return {
      district: districtName,
      level,
      available: false,
      status: "not_found",
      message: "Wilayah tidak ditemukan",
      radiusKm: COVERAGE_CONFIG.radiusKm,
      distanceKm: null,
    };
  }

  const available = district.distanceKm <= COVERAGE_CONFIG.radiusKm;

  return {
    district: district.name,
    level,
    available,
    status: available ? "available" : "unavailable",
    message: available ? "Les Privat Tersedia" : "Les Privat Belum Tersedia",
    radiusKm: COVERAGE_CONFIG.radiusKm,
    distanceKm: district.distanceKm,
  };
}

export function normalizeWaNumber(input: string) {
  const digits = input.replace(/\D/g, "");

  if (!digits) return "";

  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;

  return digits;
}
