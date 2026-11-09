// Real moon phase + which way it tilts, for roughly where you are. The short Meeus formulas, good enough for a moon this size.
// no internet + no asking for your location, it guesses roughly where you are off your timezone
window.os = window.os || {};

(function () {
    const rad = Math.PI / 180, deg = 180 / Math.PI;
    const sin = x => Math.sin(x * rad), cos = x => Math.cos(x * rad), wrap = x => ((x % 360) + 360) % 360;

    const ZONES = {
        'Australia/Sydney': [-33.87, 151.21], 'Australia/Melbourne': [-37.81, 144.96], 'Australia/Brisbane': [-27.47, 153.03], 'Australia/Adelaide': [-34.93, 138.6],
        'Australia/Perth': [-31.95, 115.86], 'Australia/Hobart': [-42.88, 147.33], 'Australia/Darwin': [-12.46, 130.84], 'Australia/Canberra': [-35.28, 149.13],
        'Australia/Lord_Howe': [-31.55, 159.08], 'Australia/Broken_Hill': [-31.95, 141.45], 'Australia/Lindeman': [-20.45, 149.04], 'Australia/Eucla': [-31.68, 128.88],
        'Pacific/Auckland': [-36.85, 174.76], 'Pacific/Chatham': [-43.95, -176.55], 'Pacific/Fiji': [-18.14, 178.44], 'Pacific/Tongatapu': [-21.14, -175.2],
        'Pacific/Port_Moresby': [-9.44, 147.18], 'Pacific/Noumea': [-22.28, 166.46], 'Pacific/Honolulu': [21.31, -157.86], 'Pacific/Guam': [13.44, 144.79],
        'Asia/Tokyo': [35.68, 139.69], 'Asia/Seoul': [37.57, 126.98], 'Asia/Shanghai': [31.23, 121.47], 'Asia/Hong_Kong': [22.32, 114.17], 'Asia/Taipei': [25.03, 121.57],
        'Asia/Manila': [14.6, 120.98], 'Asia/Singapore': [1.35, 103.82], 'Asia/Kuala_Lumpur': [3.14, 101.69], 'Asia/Jakarta': [-6.21, 106.85], 'Asia/Makassar': [-5.15, 119.43],
        'Asia/Bangkok': [13.76, 100.5], 'Asia/Ho_Chi_Minh': [10.82, 106.63], 'Asia/Kolkata': [22.57, 88.36], 'Asia/Calcutta': [22.57, 88.36], 'Asia/Karachi': [24.86, 67.0],
        'Asia/Dhaka': [23.81, 90.41], 'Asia/Kathmandu': [27.72, 85.32], 'Asia/Dubai': [25.2, 55.27], 'Asia/Riyadh': [24.71, 46.68], 'Asia/Tehran': [35.69, 51.39],
        'Asia/Jerusalem': [31.77, 35.21], 'Asia/Almaty': [43.24, 76.89], 'Asia/Tashkent': [41.3, 69.24], 'Asia/Yekaterinburg': [56.84, 60.6], 'Asia/Vladivostok': [43.12, 131.89],
        'Europe/London': [51.51, -0.13], 'Europe/Dublin': [53.35, -6.26], 'Europe/Lisbon': [38.72, -9.14], 'Europe/Madrid': [40.42, -3.7], 'Europe/Paris': [48.86, 2.35],
        'Europe/Brussels': [50.85, 4.35], 'Europe/Amsterdam': [52.37, 4.9], 'Europe/Berlin': [52.52, 13.4], 'Europe/Rome': [41.9, 12.5], 'Europe/Zurich': [47.38, 8.54],
        'Europe/Vienna': [48.21, 16.37], 'Europe/Prague': [50.08, 14.44], 'Europe/Warsaw': [52.23, 21.01], 'Europe/Stockholm': [59.33, 18.07], 'Europe/Oslo': [59.91, 10.75],
        'Europe/Copenhagen': [55.68, 12.57], 'Europe/Helsinki': [60.17, 24.94], 'Europe/Athens': [37.98, 23.73], 'Europe/Istanbul': [41.01, 28.98], 'Europe/Kiev': [50.45, 30.52],
        'Europe/Kyiv': [50.45, 30.52], 'Europe/Moscow': [55.76, 37.62], 'Europe/Bucharest': [44.43, 26.1], 'Europe/Budapest': [47.5, 19.04], 'Atlantic/Reykjavik': [64.15, -21.94],
        'Africa/Cairo': [30.04, 31.24], 'Africa/Lagos': [6.52, 3.38], 'Africa/Nairobi': [-1.29, 36.82], 'Africa/Johannesburg': [-26.2, 28.05], 'Africa/Casablanca': [33.57, -7.59],
        'Africa/Accra': [5.6, -0.19], 'Africa/Addis_Ababa': [9.03, 38.74], 'Africa/Dar_es_Salaam': [-6.79, 39.21], 'Africa/Luanda': [-8.84, 13.23], 'Africa/Windhoek': [-22.56, 17.07],
        'Africa/Maputo': [-25.97, 32.57], 'Africa/Harare': [-17.83, 31.05], 'Indian/Mauritius': [-20.16, 57.5], 'Indian/Reunion': [-20.88, 55.45],
        'America/New_York': [40.71, -74.01], 'America/Toronto': [43.65, -79.38], 'America/Chicago': [41.88, -87.63], 'America/Denver': [39.74, -104.99], 'America/Phoenix': [33.45, -112.07],
        'America/Los_Angeles': [34.05, -118.24], 'America/Vancouver': [49.28, -123.12], 'America/Anchorage': [61.22, -149.9], 'America/Halifax': [44.65, -63.58], 'America/St_Johns': [47.56, -52.71],
        'America/Mexico_City': [19.43, -99.13], 'America/Bogota': [4.71, -74.07], 'America/Lima': [-12.05, -77.04], 'America/Caracas': [10.48, -66.9], 'America/La_Paz': [-16.5, -68.15],
        'America/Santiago': [-33.45, -70.67], 'America/Argentina/Buenos_Aires': [-34.6, -58.38], 'America/Buenos_Aires': [-34.6, -58.38], 'America/Sao_Paulo': [-23.55, -46.63],
        'America/Montevideo': [-34.9, -56.16], 'America/Asuncion': [-25.26, -57.58], 'America/Havana': [23.11, -82.37], 'America/Puerto_Rico': [18.47, -66.11]
    };
    // not in the list? guess off the clock + the name
    const SOUTH = /^(Australia|Antarctica)\/|^America\/Argentina|Pacific\/(Auckland|Chatham|Fiji|Tongatapu|Apia|Noumea|Efate|Port_Moresby|Tahiti|Rarotonga)|Africa\/(Johannesburg|Maputo|Harare|Lusaka|Windhoek|Gaborone|Maseru|Mbabane|Blantyre|Lubumbashi)|Indian\/|America\/(Sao_Paulo|Santiago|Montevideo|Asuncion|La_Paz|Lima|Bahia|Recife|Fortaleza|Belem|Manaus|Cuiaba|Campo_Grande|Porto_Velho|Rio_Branco|Maceio|Araguaina|Punta_Arenas)/;
    function where() {
        let tz = '';
        try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
        if (ZONES[tz]) return { lat: ZONES[tz][0], lon: ZONES[tz][1], tz };
        let lon = -new Date().getTimezoneOffset() / 4;
        return { lat: SOUTH.test(tz) ? -30 : 40, lon, tz, guess: true };
    }

    // the maths. close enough for a moon this size
    function pos(ms) {
        let d = ms / 86400000 + 2440587.5 - 2451545.0, T = d / 36525;
        let Ls = 280.46646 + 36000.76983 * T, Ms = 357.52911 + 35999.05029 * T;
        let ls = Ls + (1.914602 - 0.004817 * T) * sin(Ms) + 0.019993 * sin(2 * Ms) + 0.000289 * sin(3 * Ms);
        let L = 218.3164477 + 481267.88123421 * T, D = 297.8501921 + 445267.1114034 * T, M = 357.5291092 + 35999.0502909 * T;
        let Mm = 134.9633964 + 477198.8675055 * T, F = 93.272095 + 483202.0175233 * T;
        let lm = L + 6.288774 * sin(Mm) + 1.274027 * sin(2 * D - Mm) + 0.658314 * sin(2 * D) + 0.213618 * sin(2 * Mm) - 0.185116 * sin(M)
            - 0.114332 * sin(2 * F) + 0.058793 * sin(2 * D - 2 * Mm) + 0.057066 * sin(2 * D - M - Mm) + 0.053322 * sin(2 * D + Mm)
            + 0.045758 * sin(2 * D - M) - 0.040923 * sin(M - Mm) - 0.03472 * sin(D) - 0.030383 * sin(M + Mm);
        let bm = 5.128122 * sin(F) + 0.280602 * sin(Mm + F) + 0.277693 * sin(Mm - F) + 0.173237 * sin(2 * D - F) + 0.055413 * sin(2 * D - Mm + F) + 0.046271 * sin(2 * D - Mm - F);
        let dist = 385000.56 - 20905.355 * cos(Mm) - 3699.111 * cos(2 * D - Mm) - 2955.968 * cos(2 * D) - 569.925 * cos(2 * Mm);
        // 0 = full, 180 = new
        let i = 180 - D - 6.289 * sin(Mm) + 2.1 * sin(M) - 1.274 * sin(2 * D - Mm) - 0.658 * sin(2 * D) - 0.214 * sin(2 * Mm) - 0.11 * sin(D);
        let eps = 23.439291 - 0.0130042 * T;
        const eq = (l, b) => ({ ra: wrap(Math.atan2(sin(l) * cos(eps) - Math.tan(b * rad) * sin(eps), cos(l)) * deg), dec: Math.asin(sin(b) * cos(eps) + cos(b) * sin(eps) * sin(l)) * deg });
        i = wrap(i); if (i > 180) i = 360 - i;
        return { d, T, elong: wrap(lm - ls), i, moon: eq(lm, bm), sun: eq(ls, 0), dist };
    }
    function sky(p, lat, lon) {
        let lst = wrap(280.46061837 + 360.98564736629 * p.d + 0.000387933 * p.T * p.T + lon), H = wrap(lst - p.moon.ra);
        let alt = Math.asin(sin(lat) * sin(p.moon.dec) + cos(lat) * cos(p.moon.dec) * cos(H)) * deg;
        alt -= Math.asin(6378.14 / p.dist) * deg * cos(alt);
        let s = p.sun, m = p.moon;
        let chi = Math.atan2(cos(s.dec) * sin(s.ra - m.ra), sin(s.dec) * cos(m.dec) - cos(s.dec) * sin(m.dec) * cos(s.ra - m.ra)) * deg;
        let q = Math.atan2(sin(H), Math.tan(lat * rad) * cos(m.dec) - sin(m.dec) * cos(H)) * deg;
        return { alt, tilt: chi - q };
    }

    let cache = null;
    os.moon = function () {
        let now = Date.now();
        if (cache && now - cache.at < 60000) return cache;
        let w = where(), p = pos(now), s = sky(p, w.lat, w.lon), H0 = -0.833;
        let up = s.alt >= H0, top = { alt: -99, t: now };
        if (!up) for (let k = 1; k <= 48; k++) { let t = now + k * 1800000, a = sky(pos(t), w.lat, w.lon).alt; if (a > top.alt) top = { alt: a, t }; }
        // if its down, show it the way itll sit when its highest tonight, not upside down under your feet
        let tilt = up ? s.tilt : sky(pos(top.t), w.lat, w.lon).tilt;
        let lit = (1 + cos(p.i)) / 2, e = p.elong;
        let phase = e < 11 || e > 349 ? 0 : e < 79 ? 1 : e < 101 ? 2 : e < 169 ? 3 : e < 191 ? 4 : e < 259 ? 5 : e < 281 ? 6 : 7;
        cache = { at: now, lit, phase, waxing: e < 180, age: e / 360, angle: p.i, tilt, dx: -sin(tilt), dy: cos(tilt), up, alt: s.alt, where: w };
        return cache;
    };
})();
