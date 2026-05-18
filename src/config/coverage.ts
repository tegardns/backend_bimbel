export type CoverageCity = "Purbalingga" | "Purwokerto";
export type CoverageLevel = "Calistung" | "SD" | "SMP" | "SMA";

export type CoverageDistrict = {
  name: string;
  distanceKm: number;
};

export const COVERAGE_CITIES: Record<
  CoverageCity,
  {
    label: string;
    anchor: {
      lat: number;
      lng: number;
    };
    districts: CoverageDistrict[];
  }
> = {
  Purbalingga: {
    label: "Purbalingga",
    anchor: {
      lat: -7.3800556,
      lng: 109.3683611,
    },
    districts: [
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
    ],
  },

  Purwokerto: {
    label: "Purwokerto",
    anchor: {
      lat: -7.40361,
      lng: 109.24639,
    },
    districts: [
      { name: "Purwokerto Utara", distanceKm: 2.1 },
      { name: "Purwokerto Timur", distanceKm: 1.5 },
      { name: "Purwokerto Selatan", distanceKm: 3.8 },
      { name: "Purwokerto Barat", distanceKm: 4.2 },
      { name: "Baturraden", distanceKm: 8.2 },
      { name: "Sumbang", distanceKm: 7.5 },
      { name: "Karanglewas", distanceKm: 6.1 },
      { name: "Patikraja", distanceKm: 9.4 },
      { name: "Sokaraja", distanceKm: 5.5 },
      { name: "Kedungbanteng", distanceKm: 7.2 },
    ],
  },
};

export function getDistrictsByCity(city: CoverageCity) {
  return [...COVERAGE_CITIES[city].districts].sort(
    (a, b) => a.distanceKm - b.distanceKm,
  );
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

export function getDistrictByCityAndName(city: CoverageCity, name: string) {
  const normalizedName = normalizeText(name);

  return COVERAGE_CITIES[city].districts.find(
    (district) => normalizeText(district.name) === normalizedName,
  );
}

export function evaluateCoverage(params: {
  city: CoverageCity;
  district: string;
  level: CoverageLevel;
  radiusKm: number;
}) {
  const { city, district, level, radiusKm } = params;

  if (level === "SMA") {
    return {
      city,
      district,
      level,
      available: false,
      status: "coming_soon" as const,
      message: "SMA coming soon",
      radiusKm,
      distanceKm: null,
    };
  }

  const districtData = getDistrictByCityAndName(city, district);

  if (!districtData) {
    return {
      city,
      district,
      level,
      available: false,
      status: "not_found" as const,
      message: "Wilayah tidak ditemukan",
      radiusKm,
      distanceKm: null,
    };
  }

  const available = districtData.distanceKm <= radiusKm;

  return {
    city,
    district: districtData.name,
    level,
    available,
    status: available ? ("available" as const) : ("unavailable" as const),
    message: available ? "Les Privat Tersedia" : "Les Privat Belum Tersedia",
    radiusKm,
    distanceKm: districtData.distanceKm,
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
