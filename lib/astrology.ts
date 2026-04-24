
export interface BirthChartInfo {
  sun: string;
  moon: string;
  ascendant: string;
  elements: {
    fire: number;
    earth: number;
    air: number;
    water: number;
  };
  summary: string;
}

const ZODIAC_SIGNS = [
  "aries", "touro", "gemeos", "cancer", "leao", "virgem",
  "libra", "escorpiao", "sagitario", "capricornio", "aquario", "peixes"
];

const ELEMENTS: Record<string, "fire" | "earth" | "air" | "water"> = {
  aries: "fire", leao: "fire", sagitario: "fire",
  touro: "earth", virgem: "earth", capricornio: "earth",
  gemeos: "air", libra: "air", aquario: "air",
  cancer: "water", escorpiao: "water", peixes: "water"
};

export function calculateBirthChart(birthDate: Date, birthTime?: string, birthPlace?: string): BirthChartInfo {
  // Simplified calculation for demonstration
  // In a real app, this would use a library like 'astronomy-engine' or a dedicated API
  
  const day = birthDate.getUTCDate();
  const month = birthDate.getUTCMonth() + 1;
  const year = birthDate.getUTCFullYear();
  
  // Sun Sign calculation (Simplified)
  let sunSign = "";
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) sunSign = "aries";
  else if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) sunSign = "touro";
  else if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) sunSign = "gemeos";
  else if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) sunSign = "cancer";
  else if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) sunSign = "leao";
  else if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) sunSign = "virgem";
  else if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) sunSign = "libra";
  else if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) sunSign = "escorpiao";
  else if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) sunSign = "sagitario";
  else if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) sunSign = "capricornio";
  else if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) sunSign = "aquario";
  else sunSign = "peixes";

  // Pseudo-calculation for Moon and Ascendant based on date and time
  const dayOfYear = Math.floor((birthDate.getTime() - new Date(year, 0, 0).getTime()) / 86400000);

  // Parse time safely
  let hour = 12;
  let minute = 0;
  if (birthTime && birthTime.includes(":")) {
    const parts = birthTime.split(":");
    const h = parseInt(parts[0].trim());
    const m = parseInt(parts[1].trim());
    if (!isNaN(h)) hour = h;
    if (!isNaN(m)) minute = m;
  }
  const timeHash = hour * 60 + minute;

  const moonSign = ZODIAC_SIGNS[Math.floor((dayOfYear + timeHash / 100) / 28) % 12];
  const ascendant = ZODIAC_SIGNS[Math.floor(timeHash / 120) % 12];

  // Calculate elements balance
  const fireCount = [sunSign, moonSign, ascendant].filter(s => ELEMENTS[s] === "fire").length;
  const earthCount = [sunSign, moonSign, ascendant].filter(s => ELEMENTS[s] === "earth").length;
  const airCount = [sunSign, moonSign, ascendant].filter(s => ELEMENTS[s] === "air").length;
  const waterCount = [sunSign, moonSign, ascendant].filter(s => ELEMENTS[s] === "water").length;

  const total = 3;
  const fire = Math.round((fireCount / total) * 100);
  const earth = Math.round((earthCount / total) * 100);
  const air = Math.round((airCount / total) * 100);
  const water = Math.round((waterCount / total) * 100);

  return {
    sun: sunSign,
    moon: moonSign,
    ascendant: ascendant,
    elements: { fire, earth, air, water },
    summary: `Você tem o Sol em ${sunSign}, Lua em ${moonSign} e Ascendente em ${ascendant}.`
  };
}
