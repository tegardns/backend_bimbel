// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// if (!API_BASE_URL) {
//   throw new Error("VITE_API_BASE_URL belum diset");
// }

// export async function apiGet<T>(path: string): Promise<T> {
//   const response = await fetch(`${API_BASE_URL}${path}`);

//   const data = await response.json();

//   if (!response.ok) {
//     throw new Error(data?.message || "Request gagal");
//   }

//   return data as T;
// }
