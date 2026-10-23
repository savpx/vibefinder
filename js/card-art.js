// VibeFinder — кинематографичные монохромные сцены для 14 вайбов.
//
// ИДЕЯ: карточка — это маленький кадр со своей глубиной, а не плоская фигура.
// Каждая сцена собрана из слоёв (даль → средний план → близкий), у каждого слоя
// своя скорость дрейфа (параллакс), свой тон серого и своя резкость. Свет задаётся
// радиальными/линейными градиентами, объём — мягким размытием дальних слоёв,
// материал — тонкой текстурой (feTurbulence) в минимальной дозе.
//
// ПАЛИТРА строго монохромная: от #040506 (бездна) до #f2f5f7 (блик).
// Никаких фиолетовых/синих/циановых оттенков — вся разница между вайбами
// строится на сюжете, свете, композиции и характере движения.
//
// Технологии: инлайновый SVG (локально, без внешних файлов), CSS — только для
// автономных анимаций слоёв (см. css/style.css, раздел «Кинематографичные сцены»).
// Анимации включаются сами, без hover; при prefers-reduced-motion сцены
// остаются полностью статичными и завершёнными.

// Единая серая шкала: индексируем по «высоте света».
// Строго нейтральная шкала: R = G = B, ноль цветного подтона.
// Проверено: max(R,G,B) − min(R,G,B) = 0 для каждого значения.
const G = {
  void: '#050505',
  abyss: '#090909',
  deep: '#0e0e0e',
  charcoal: '#161616',
  slate: '#1e1e1e',
  stone: '#2b2b2b',
  ash: '#3c3c3c',
  gray: '#575757',
  silver: '#7e7e7e',
  mist: '#a4a4a4',
  light: '#c8c8c8',
  pale: '#e4e4e4',
  white: '#f4f4f4',
};

// Общие defs: градиенты неба/света, фильтры дымки и глубины резкости.
function defs(uid) {
  return (
    '<defs>' +
    // Небо: «свет из глубины» — верх заметно светлее низа, иначе маленькая
    // карточка читается как чёрный прямоугольник. Горизонт задаёт композицию.
    `<linearGradient id="s${uid}" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${G.stone}"/>` +
    `<stop offset="0.42" stop-color="${G.slate}"/>` +
    `<stop offset="0.78" stop-color="${G.deep}"/>` +
    `<stop offset="1" stop-color="${G.void}"/>` +
    '</linearGradient>' +
    // Источник света: мягкий спад от центра.
    `<radialGradient id="l${uid}" cx="0.5" cy="0.5" r="0.5">` +
    `<stop offset="0" stop-color="${G.white}" stop-opacity="0.95"/>` +
    `<stop offset="0.35" stop-color="${G.light}" stop-opacity="0.5"/>` +
    `<stop offset="0.7" stop-color="${G.silver}" stop-opacity="0.16"/>` +
    `<stop offset="1" stop-color="${G.silver}" stop-opacity="0"/>` +
    '</radialGradient>' +
    // Блик на поверхности (сфера/капля/камень).
    `<radialGradient id="h${uid}" cx="0.34" cy="0.28" r="0.75">` +
    `<stop offset="0" stop-color="${G.pale}" stop-opacity="0.92"/>` +
    `<stop offset="0.5" stop-color="${G.silver}" stop-opacity="0.32"/>` +
    `<stop offset="1" stop-color="${G.charcoal}" stop-opacity="0"/>` +
    '</radialGradient>' +
    // Вертикальный спад для силуэтов (тень сверху вниз).
    `<linearGradient id="v${uid}" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${G.stone}"/>` +
    `<stop offset="1" stop-color="${G.void}"/>` +
    '</linearGradient>' +
    // Мягкая дымка (дальний план).
    `<filter id="f${uid}" x="-25%" y="-25%" width="150%" height="150%">` +
    '<feGaussianBlur stdDeviation="6"/></filter>' +
    // Глубина резкости (средний план).
    `<filter id="d${uid}" x="-15%" y="-15%" width="130%" height="130%">` +
    '<feGaussianBlur stdDeviation="2.4"/></filter>' +
    // Микротекстура материала: зерно, переведённое в серый.
    `<filter id="g${uid}" x="0" y="0" width="100%" height="100%">` +
    '<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7"/>' +
    '<feColorMatrix type="saturate" values="0"/>' +
    '</filter>' +
    '</defs>'
  );
}

// Детерминированный псевдослучайный шум (без Math.random — стабильный кадр).
const rnd = (i, m) => ((i * 9301 + 49297) % 233280) / 233280 * m;

// Звёздное поле для трёх планов глубины.
function stars(uid, count, maxY, far) {
  let out = '';
  for (let i = 0; i < count; i += 1) {
    const x = rnd(i + 1, 318) + 1;
    const y = rnd(i + 7, maxY) + 2;
    const near = i % 7 === 0;
    const r = far ? (near ? 0.9 : 0.5) : (near ? 1.5 : 0.8);
    const o = far ? 0.28 + rnd(i + 3, 30) / 100 : 0.45 + rnd(i + 3, 45) / 100;
    out += `<circle class="tw${i % 5}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${far ? G.mist : G.pale}" opacity="${o.toFixed(2)}"/>`;
  }
  return out;
}

// Окна здания: часть горит, часть нет — окна дают масштаб и «жизнь».
function windows(x, y, w, h, cols, rows, gx, gy, uid) {
  let out = '';
  let n = 0;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (rnd(n * 13 + x, 100) < 34) { n += 1; continue; } // тёмное окно
      const lit = rnd(n * 17 + y, 100);
      n += 1;
      const wx = x + c * gx;
      const wy = y + r * gy;
      if (wx + w > x + cols * gx || wy + h > y + rows * gy) continue;
      out += `<rect class="win${n % 6}" x="${wx.toFixed(1)}" y="${wy.toFixed(1)}" width="${w}" height="${h}" fill="${lit > 55 ? G.light : G.ash}" opacity="${(0.35 + lit / 220).toFixed(2)}"/>`;
    }
  }
  return out;
}

const SCENES = {
  // --- 1. cosmos: бездна, три плана звёзд, планета с терминатором и кольцами ---
  cosmos: (u) => `
    <rect width="320" height="180" fill="url(#s${u})"/>
    <g class="d-fog" filter="url(#f${u})">
      <ellipse cx="246" cy="46" rx="92" ry="52" fill="${G.stone}" opacity="0.5"/>
      <ellipse cx="62" cy="132" rx="86" ry="46" fill="${G.slate}" opacity="0.42"/>
    </g>
    <g class="d-far">${stars(u, 40, 150, true)}</g>
    <g class="d-mid">
      <ellipse cx="196" cy="74" rx="46" ry="30" fill="none" stroke="${G.gray}" stroke-width="1" opacity="0.5" transform="rotate(-16 196 74)"/>
      <circle cx="196" cy="74" r="27" fill="url(#h${u})"/>
      <circle cx="196" cy="74" r="27" fill="none" stroke="${G.mist}" stroke-width="0.7" opacity="0.55"/>
      <path d="M196 47 a27 27 0 0 0 0 54 a20 27 0 0 1 0 -54 Z" fill="${G.void}" opacity="0.42"/>
    </g>
    <g class="d-near">${stars(u, 16, 176, false)}</g>
  `,

  // --- 2. solar: диск солнца, слоистые лучи, дымка облаков, дрейф ---
  solar: (u) => `
    <rect width="320" height="180" fill="url(#s${u})"/>
    <g class="d-fog" filter="url(#f${u})">
      <ellipse cx="160" cy="118" rx="150" ry="70" fill="${G.stone}" opacity="0.55"/>
    </g>
    <g class="d-far spin">
      ${Array.from({ length: 16 }, (_, i) => {
        const a = (i * 22.5 * Math.PI) / 180;
        const r1 = 44; const r2 = 104;
        return `<line x1="${(160 + Math.cos(a) * r1).toFixed(1)}" y1="${(116 + Math.sin(a) * 34).toFixed(1)}" x2="${(160 + Math.cos(a) * r2).toFixed(1)}" y2="${(116 + Math.sin(a) * 82).toFixed(1)}" stroke="${G.silver}" stroke-width="2.4" stroke-linecap="round" opacity="0.16"/>`;
      }).join('')}
    </g>
    <circle cx="160" cy="112" r="96" fill="url(#l${u})" opacity="0.85"/>
    <g class="d-mid">
      <circle cx="160" cy="112" r="34" fill="${G.pale}"/>
      <circle cx="160" cy="112" r="34" fill="url(#h${u})"/>
    </g>
    <g class="d-near haze-drift">
      <ellipse cx="70" cy="132" rx="66" ry="9" fill="${G.slate}" opacity="0.6" filter="url(#d${u})"/>
      <ellipse cx="250" cy="146" rx="74" ry="10" fill="${G.charcoal}" opacity="0.75" filter="url(#d${u})"/>
    </g>
  `,

  // --- 3. neon: ночной город в глубине, живые окна, отражение на мокром асфальте ---
  neon: (u) => `
    <rect width="320" height="180" fill="url(#s${u})"/>
    <g class="d-far" filter="url(#f${u})">
      <rect x="10" y="52" width="58" height="128" fill="${G.slate}"/>
      <rect x="88" y="38" width="70" height="142" fill="${G.stone}"/>
      <rect x="176" y="60" width="62" height="120" fill="${G.slate}"/>
      <rect x="252" y="46" width="58" height="134" fill="${G.stone}"/>
    </g>
    <g class="d-mid">
      <rect x="30" y="86" width="54" height="94" fill="url(#v${u})"/>
      ${windows(38, 96, 6, 8, 4, 7, 12, 13, u)}
      <rect x="200" y="70" width="60" height="110" fill="url(#v${u})"/>
      ${windows(208, 80, 6, 8, 4, 8, 13, 13, u)}
    </g>
    <g class="d-near">
      <rect x="120" y="104" width="72" height="76" fill="${G.void}"/>
      <rect x="128" y="120" width="10" height="4" fill="${G.light}" opacity="0.5"/>
      <rect x="128" y="132" width="24" height="3" fill="${G.silver}" opacity="0.4"/>
    </g>
    <g class="haze-drift">
      <ellipse cx="160" cy="128" rx="140" ry="14" fill="${G.ash}" opacity="0.28" filter="url(#d${u})"/>
    </g>
    <g class="d-reflect">
      <rect x="0" y="150" width="320" height="30" fill="${G.abyss}"/>
      <rect x="38" y="152" width="38" height="26" fill="${G.slate}" opacity="0.28" filter="url(#d${u})"/>
      <rect x="204" y="152" width="42" height="26" fill="${G.slate}" opacity="0.24" filter="url(#d${u})"/>
    </g>
  `,

  // --- 4. forest: три плана деревьев, туман между ярусами, свет сквозь листву ---
  forest: (u) => {
    const tree = (x, s, fill, o) =>
      `<path d="M${x} ${168 - s} l${-s * 0.36} ${s * 0.66} h${s * 0.72} Z" fill="${fill}" opacity="${o}"/>` +
      `<path d="M${x} ${172 - s} l${-s * 0.28} ${s * 0.5} h${s * 0.56} Z" fill="${fill}" opacity="${o}"/>` +
      `<rect x="${x - 1.6}" y="${168 - s * 0.2}" width="3.2" height="${s * 0.28}" fill="${fill}" opacity="${o}"/>`;
    return `
    <rect width="320" height="180" fill="url(#s${u})"/>
    <ellipse cx="150" cy="40" rx="146" ry="76" fill="url(#l${u})" opacity="0.85"/>
    <g class="d-far" filter="url(#f${u})">
      <rect x="0" y="0" width="320" height="120" fill="${G.slate}" opacity="0.55"/>
      ${tree(26, 96, G.ash, 0.9)}${tree(74, 108, G.ash, 0.9)}${tree(150, 92, G.ash, 0.85)}
      ${tree(224, 104, G.ash, 0.9)}${tree(288, 98, G.ash, 0.9)}
    </g>
    <g class="d-fog fog-a">
      <ellipse cx="160" cy="126" rx="170" ry="22" fill="${G.mist}" opacity="0.16" filter="url(#f${u})"/>
    </g>
    <g class="d-mid">
      ${tree(118, 132, G.stone, 0.95)}${tree(206, 124, G.stone, 0.95)}
      <path d="M0 150 q60 -12 130 -2 t190 4 V180 H0 Z" fill="${G.charcoal}"/>
    </g>
    <g class="d-near sway-a">
      <path d="M-8 -6 q54 30 116 12" fill="none" stroke="${G.void}" stroke-width="5" opacity="0.9"/>
      <path d="M-6 4 q40 22 92 10" fill="none" stroke="${G.abyss}" stroke-width="3.4" opacity="0.85"/>
      <path d="M300 -8 q-48 34 -110 16" fill="none" stroke="${G.void}" stroke-width="4.6" opacity="0.9"/>
      <g filter="url(#d${u})">
        <ellipse cx="34" cy="20" rx="26" ry="12" fill="${G.abyss}" opacity="0.9"/>
        <ellipse cx="272" cy="26" rx="22" ry="10" fill="${G.abyss}" opacity="0.85"/>
      </g>
    </g>
    <rect class="d-ground" x="0" y="158" width="320" height="22" fill="${G.void}"/>
    `;
  },

  // --- 5. night: месяц с ореолом, силуэт улицы, фонарь, туман, отражение ---
  night: (u) => `
    <rect width="320" height="180" fill="url(#s${u})"/>
    <g class="d-far">${stars(u, 34, 120, true)}</g>
    <circle class="haze-pulse" cx="72" cy="46" r="52" fill="url(#l${u})" opacity="0.6"/>
    <g class="d-mid">
      <circle cx="72" cy="46" r="17" fill="${G.pale}"/>
      <circle cx="65" cy="42" r="17" fill="${G.deep}" opacity="0.92"/>
    </g>
    <g class="d-far" filter="url(#f${u})">
      <rect x="120" y="70" width="46" height="110" fill="${G.slate}"/>
      <rect x="180" y="56" width="52" height="124" fill="${G.stone}"/>
      <rect x="246" y="78" width="44" height="102" fill="${G.slate}"/>
    </g>
    <g class="d-mid">
      <rect x="140" y="92" width="46" height="88" fill="url(#v${u})"/>
      ${windows(146, 100, 5, 7, 3, 7, 12, 12, u)}
      <rect x="222" y="84" width="50" height="96" fill="url(#v${u})"/>
      ${windows(228, 92, 5, 7, 3, 8, 12, 11, u)}
    </g>
    <g class="d-near">
      <rect x="106" y="120" width="4" height="60" fill="${G.void}"/>
      <circle class="haze-pulse" cx="108" cy="116" r="18" fill="url(#l${u})" opacity="0.5"/>
      <circle cx="108" cy="116" r="4.4" fill="${G.pale}"/>
    </g>
    <g class="fog-b">
      <ellipse cx="160" cy="140" rx="180" ry="16" fill="${G.ash}" opacity="0.3" filter="url(#f${u})"/>
    </g>
    <rect x="0" y="162" width="320" height="18" fill="${G.void}"/>
    <g class="d-reflect">
      <ellipse cx="108" cy="168" rx="16" ry="5" fill="${G.silver}" opacity="0.2" filter="url(#d${u})"/>
    </g>
  `,

  // --- 6. melancholic: дождь на стекле — боке, струи, капли, глубина ---
  melancholic: (u) => `
    <rect width="320" height="180" fill="url(#s${u})"/>
    <g class="d-far bokeh" filter="url(#f${u})">
      <circle cx="66" cy="60" r="20" fill="${G.silver}" opacity="0.24"/>
      <circle cx="152" cy="44" r="26" fill="${G.gray}" opacity="0.2"/>
      <circle cx="250" cy="70" r="22" fill="${G.silver}" opacity="0.22"/>
      <circle cx="204" cy="112" r="18" fill="${G.gray}" opacity="0.18"/>
    </g>
    <g class="haze-drift">
      <ellipse cx="160" cy="96" rx="170" ry="70" fill="${G.stone}" opacity="0.22" filter="url(#f${u})"/>
    </g>
    <g class="d-near rain-a">
      ${Array.from({ length: 14 }, (_, i) => {
        const x = rnd(i + 2, 314) + 3;
        const y = rnd(i + 11, 60) - 40;
        const h = 16 + rnd(i + 5, 26);
        return `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x - 3).toFixed(1)}" y2="${(y + h).toFixed(1)}" stroke="${G.mist}" stroke-width="1" opacity="0.42" stroke-linecap="round"/>`;
      }).join('')}
    </g>
    <g class="d-near">
      <g class="bead-a"><ellipse cx="94" cy="72" rx="2.4" ry="3.4" fill="${G.pale}" opacity="0.7"/><ellipse cx="94" cy="76" rx="1.8" ry="8" fill="${G.mist}" opacity="0.35"/></g>
      <g class="bead-b"><ellipse cx="178" cy="118" rx="2.8" ry="3.8" fill="${G.pale}" opacity="0.72"/><ellipse cx="178" cy="122" rx="1.9" ry="9" fill="${G.mist}" opacity="0.32"/></g>
      <g class="bead-c"><ellipse cx="252" cy="58" rx="2.2" ry="3.2" fill="${G.pale}" opacity="0.66"/><ellipse cx="252" cy="62" rx="1.7" ry="7" fill="${G.mist}" opacity="0.3"/></g>
      <circle cx="52" cy="130" r="2.2" fill="${G.pale}" opacity="0.55"/>
      <circle cx="290" cy="100" r="2" fill="${G.pale}" opacity="0.5"/>
    </g>
  `,

  // --- 7. zen: гладь воды, расходящиеся круги, камень с тенью и отражением ---
  zen: (u) => `
    <rect width="320" height="180" fill="url(#s${u})"/>
    <g class="d-far" filter="url(#f${u})">
      <ellipse cx="160" cy="30" rx="150" ry="46" fill="${G.stone}" opacity="0.8"/>
      <rect x="0" y="0" width="320" height="100" fill="${G.slate}" opacity="0.5"/>
    </g>
    <g class="d-far" filter="url(#f${u})">
      <ellipse cx="52" cy="34" rx="90" ry="30" fill="${G.gray}" opacity="0.3"/>
      <ellipse cx="268" cy="26" rx="84" ry="26" fill="${G.gray}" opacity="0.26"/>
    </g>
    <rect x="0" y="100" width="320" height="80" fill="${G.deep}"/>
    <rect x="0" y="100" width="320" height="26" fill="${G.charcoal}" opacity="0.85"/>
    <g class="d-mid ripple-a"><ellipse cx="158" cy="118" rx="58" ry="18" fill="none" stroke="${G.light}" stroke-width="1.3" opacity="0.6"/></g>
    <g class="d-mid ripple-b"><ellipse cx="158" cy="120" rx="88" ry="27" fill="none" stroke="${G.mist}" stroke-width="1.1" opacity="0.45"/></g>
    <g class="d-far ripple-c"><ellipse cx="158" cy="122" rx="122" ry="37" fill="none" stroke="${G.silver}" stroke-width="1" opacity="0.34"/></g>
    <g class="d-near">
      <ellipse cx="158" cy="118" rx="26" ry="10" fill="${G.void}" opacity="0.55"/>
      <ellipse cx="158" cy="112" rx="24" ry="10" fill="${G.slate}"/>
      <ellipse cx="158" cy="108" rx="24" ry="9" fill="${G.stone}"/>
      <ellipse cx="152" cy="105" rx="9" ry="4" fill="${G.light}" opacity="0.4"/>
    </g>
    <g class="mist-a" filter="url(#f${u})">
      <ellipse cx="160" cy="90" rx="150" ry="14" fill="${G.mist}" opacity="0.12"/>
    </g>
    <g class="d-reflect">
      <ellipse cx="158" cy="136" rx="20" ry="7" fill="${G.silver}" opacity="0.16" filter="url(#d${u})"/>
    </g>
  `,

  // --- 8. chaotic: дробление на грани, разные планы, штормовой фон, вспышки ---
  chaotic: (u) => {
    let shards = '';
    for (let i = 0; i < 22; i += 1) {
      const x = rnd(i + 4, 300) + 6;
      const y = rnd(i + 9, 150) + 6;
      const w = 10 + rnd(i + 2, 26);
      const h = 6 + rnd(i + 6, 18);
      const rot = rnd(i + 3, 360).toFixed(0);
      const tone = [G.charcoal, G.slate, G.stone, G.ash, G.gray][i % 5];
      const near = i % 4 === 0;
      shards += `<rect class="shard${i % 5}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${tone}" opacity="${near ? 0.9 : 0.55}" transform="rotate(${rot} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
    }
    return `
    <rect width="320" height="180" fill="url(#s${u})"/>
    <g class="d-far" filter="url(#f${u})">
      <path d="M-10 180 L64 30 L126 180 Z" fill="${G.slate}" opacity="0.7"/>
      <path d="M198 180 L262 24 L332 180 Z" fill="${G.stone}" opacity="0.65"/>
    </g>
    <g class="haze-drift">
      <ellipse cx="160" cy="80" rx="160" ry="60" fill="${G.charcoal}" opacity="0.4" filter="url(#f${u})"/>
    </g>
    <g class="d-mid burst-a">${shards}</g>
    <g class="d-near">
      <path d="M0 152 L52 96 L104 152 Z" fill="${G.void}" opacity="0.9"/>
      <path d="M216 156 L276 92 L336 156 Z" fill="${G.void}" opacity="0.9"/>
      <line class="streak" x1="20" y1="120" x2="120" y2="86" stroke="${G.mist}" stroke-width="0.9" opacity="0.4"/>
      <line class="streak2" x1="210" y1="132" x2="304" y2="104" stroke="${G.silver}" stroke-width="0.8" opacity="0.35"/>
    </g>
  `;
  },

  // --- 9. happy: сферы с мягким бликом на разных планах, нити, искры ---
  happy: (u) => {
    const ball = (x, y, r, cls, o) =>
      `<g class="${cls}"><ellipse cx="${x}" cy="${y}" rx="${r}" ry="${(r * 1.12).toFixed(1)}" fill="${G.stone}" opacity="${o}"/>` +
      `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${(r * 1.12).toFixed(1)}" fill="url(#h${u})"/>` +
      `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${(r * 1.12).toFixed(1)}" fill="none" stroke="${G.mist}" stroke-width="0.6" opacity="0.4"/>` +
      `<path d="M${x} ${(y + r * 1.12).toFixed(1)} q3 12 0 24" stroke="${G.silver}" stroke-width="0.6" fill="none" opacity="0.35"/></g>`;
    return `
    <rect width="320" height="180" fill="url(#s${u})"/>
    <circle cx="248" cy="42" r="62" fill="url(#l${u})" opacity="0.5"/>
    <g class="d-far">${ball(58, 116, 15, 'b-far', 0.9)}${ball(238, 128, 13, 'b-far-b', 0.9)}</g>
    <g class="d-mid">${ball(126, 104, 18, 'b-mid', 0.95)}</g>
    <g class="d-near">${ball(206, 88, 22, 'b-near', 1)}</g>
    <g class="d-far sparkle">
      <circle class="tw1" cx="86" cy="46" r="1.8" fill="${G.pale}" opacity="0.8"/>
      <circle class="tw3" cx="176" cy="34" r="1.4" fill="${G.pale}" opacity="0.7"/>
      <circle class="tw2" cx="286" cy="78" r="1.6" fill="${G.pale}" opacity="0.75"/>
    </g>
  `;
  },

  // --- 10. mysterious: арка, объёмный луч света, туман, пыль ---
  mysterious: (u) => `
    <rect width="320" height="180" fill="url(#s${u})"/>
    <g class="d-far" filter="url(#f${u})">
      <path d="M104 168 V74 a56 56 0 0 1 112 0 V168 Z" fill="${G.slate}" opacity="0.7"/>
    </g>
    <g class="beam">
      <path d="M148 76 L172 76 L206 180 L114 180 Z" fill="url(#l${u})" opacity="0.3"/>
    </g>
    <g class="d-mid">
      <path d="M116 168 V78 a44 44 0 0 1 88 0 V168 Z" fill="${G.void}"/>
      <path d="M116 168 V78 a44 44 0 0 1 88 0 V168" fill="none" stroke="${G.gray}" stroke-width="1.1" opacity="0.6"/>
      <rect x="150" y="126" width="9" height="20" rx="3" fill="${G.light}" opacity="0.75"/>
      <circle cx="176" cy="136" r="3.2" fill="${G.pale}" opacity="0.85"/>
    </g>
    <g class="fog-a" filter="url(#f${u})">
      <ellipse cx="160" cy="156" rx="170" ry="20" fill="${G.mist}" opacity="0.16"/>
    </g>
    <g class="d-near dust">
      <circle class="tw1" cx="132" cy="120" r="1.1" fill="${G.pale}" opacity="0.6"/>
      <circle class="tw4" cx="188" cy="102" r="1.3" fill="${G.pale}" opacity="0.55"/>
      <circle class="tw2" cx="150" cy="146" r="1" fill="${G.pale}" opacity="0.5"/>
    </g>
  `,

  // --- 11. creative: широкие мазки, кляксы, зерно бумаги, глубина ---
  creative: (u) => `
    <rect width="320" height="180" fill="url(#s${u})"/>
    <g class="d-far" filter="url(#f${u})">
      <path d="M14 120 q52 -58 116 -24 t122 -28" fill="none" stroke="${G.slate}" stroke-width="16" stroke-linecap="round" opacity="0.7"/>
    </g>
    <g class="d-mid">
      <path class="stroke-a" d="M20 104 q46 -50 104 -20 t118 -22" fill="none" stroke="${G.gray}" stroke-width="10" stroke-linecap="round" opacity="0.55"/>
      <path class="stroke-b" d="M26 142 q52 -34 108 -12 t116 -18" fill="none" stroke="${G.silver}" stroke-width="7" stroke-linecap="round" opacity="0.45"/>
    </g>
    <g class="d-near">
      <path class="stroke-c" d="M46 76 q40 -26 84 -6" fill="none" stroke="${G.pale}" stroke-width="3.4" stroke-linecap="round" opacity="0.5"/>
      <circle cx="92" cy="58" r="3.2" fill="${G.light}" opacity="0.7"/>
      <circle cx="112" cy="66" r="1.8" fill="${G.light}" opacity="0.6"/>
      <circle cx="76" cy="70" r="1.4" fill="${G.light}" opacity="0.5"/>
      <circle cx="238" cy="130" r="2.6" fill="${G.light}" opacity="0.6"/>
      <circle cx="256" cy="122" r="1.5" fill="${G.light}" opacity="0.5"/>
    </g>
    <rect class="grain" width="320" height="180" filter="url(#g${u})" opacity="0.05"/>
  `,

  // --- 12. nature: ярусы листвы с прожилками, свет сквозь крону, мох ---
  nature: (u) => {
    const leaf = (x, y, s, rot, tone, o, cls) =>
      `<g class="${cls || ''}" opacity="${o}" transform="rotate(${rot} ${x} ${y})">` +
      `<path d="M${x} ${y} q${s * 0.5} -${s * 0.62} ${s} 0 q-${s * 0.5} ${s * 0.62} -${s} 0 Z" fill="${tone}"/>` +
      `<line x1="${x + 2}" y1="${y}" x2="${x + s - 2}" y2="${y}" stroke="${G.void}" stroke-width="0.7" opacity="0.45"/>` +
      `<line x1="${x + s * 0.34}" y1="${y}" x2="${x + s * 0.42}" y2="${y - s * 0.2}" stroke="${G.void}" stroke-width="0.5" opacity="0.3"/>` +
      `<line x1="${x + s * 0.54}" y1="${y}" x2="${x + s * 0.62}" y2="${y + s * 0.18}" stroke="${G.void}" stroke-width="0.5" opacity="0.3"/></g>`;
    return `
    <rect width="320" height="180" fill="url(#s${u})"/>
    <circle cx="96" cy="34" r="106" fill="url(#l${u})" opacity="0.95"/>
    <g class="d-far" filter="url(#f${u})">
      <rect x="0" y="0" width="320" height="112" fill="${G.slate}" opacity="0.65"/>
      ${leaf(18, 40, 34, -14, G.ash, 0.95)}${leaf(120, 24, 30, 12, G.ash, 0.9)}${leaf(232, 36, 32, -10, G.ash, 0.92)}
      <path d="M-6 6 q70 20 150 6 t180 10" fill="none" stroke="${G.gray}" stroke-width="4" opacity="0.85"/>
    </g>
    <g class="d-mid sway-a">
      ${leaf(52, 52, 40, 16, G.stone, 1)}${leaf(158, 44, 36, -18, G.stone, 1)}${leaf(266, 58, 34, 14, G.stone, 0.97)}
      <path d="M60 48 q40 -22 84 -8" fill="none" stroke="${G.gray}" stroke-width="2.4" opacity="0.75"/>
    </g>
    <g class="d-fog fog-b">
      <ellipse cx="160" cy="132" rx="170" ry="24" fill="${G.mist}" opacity="0.2" filter="url(#f${u})"/>
    </g>
    <g class="d-near sway-b">
      ${leaf(96, 116, 52, -10, G.charcoal, 1, 'leaf-near')}${leaf(226, 108, 46, 18, G.charcoal, 0.98, 'leaf-near')}
      <path d="M-8 172 q70 -16 150 -4 t182 6 V182 H-8 Z" fill="${G.void}"/>
      <g opacity="0.7">
        <path d="M36 168 l6 -22 l6 22 Z" fill="${G.charcoal}"/>
        <path d="M126 174 l5 -18 l5 18 Z" fill="${G.slate}"/>
        <path d="M244 170 l6 -21 l6 21 Z" fill="${G.charcoal}"/>
      </g>
    </g>
    <rect class="grain" width="320" height="180" filter="url(#g${u})" opacity="0.045"/>
  `;
  },

  // --- 13. retro: пиксельный закат с полосами, сетка-перспектива, сканлайны ---
  retro: (u) => {
    let grid = '';
    for (let i = 0; i <= 12; i += 1) {
      const x = i * 27;
      grid += `<line x1="${x}" y1="112" x2="${(160 + (x - 160) * 1.7).toFixed(0)}" y2="180" stroke="${G.ash}" stroke-width="0.8" opacity="0.35"/>`;
    }
    for (let j = 0; j < 6; j += 1) {
      grid += `<line x1="0" y1="${112 + j * 12}" x2="320" y2="${112 + j * 12}" stroke="${G.ash}" stroke-width="0.8" opacity="0.3"/>`;
    }
    let band = '';
    for (let i = 0; i < 7; i += 1) {
      band += `<rect x="${118 + i * 3}" y="${70 + i * 6}" width="${84 - i * 6}" height="${3 + (i % 2)}" fill="${[G.pale, G.light, G.mist, G.silver, G.gray, G.ash, G.slate][i]}"/>`;
    }
    return `
    <rect width="320" height="180" fill="url(#s${u})"/>
    <g class="d-far">
      <circle cx="160" cy="76" r="52" fill="url(#l${u})" opacity="0.6"/>
      <circle cx="160" cy="76" r="30" fill="${G.pale}" opacity="0.85"/>
      <g class="sunbands">${band}</g>
    </g>
    <g class="d-mid">
      <path d="M-6 112 L44 84 L96 112 Z" fill="${G.charcoal}"/>
      <path d="M224 112 L276 82 L326 112 Z" fill="${G.charcoal}"/>
    </g>
    <rect x="0" y="112" width="320" height="68" fill="${G.void}"/>
    <g class="d-near grid-drift">${grid}</g>
    <g class="scan">
      <rect class="scanline" x="0" y="0" width="320" height="2.4" fill="${G.pale}" opacity="0.06"/>
    </g>
    <rect class="grain" width="320" height="180" filter="url(#g${u})" opacity="0.06"/>
  `;
  },

  // --- 14. cozy: торшер, световое пятно, окно, силуэты мебели, пыль ---
  cozy: (u) => `
    <rect width="320" height="180" fill="url(#s${u})"/>
    <g class="d-far">
      <circle cx="104" cy="78" r="66" fill="url(#l${u})" opacity="0.7"/>
    </g>
    <g class="d-mid">
      <rect x="96" y="22" width="15" height="26" rx="5" fill="${G.charcoal}"/>
      <path d="M64 92 q40 -46 80 0 Z" fill="${G.stone}"/>
      <path d="M68 92 q36 -42 72 0" fill="none" stroke="${G.mist}" stroke-width="0.8" opacity="0.4"/>
      <rect x="100" y="52" width="7" height="92" fill="${G.charcoal}"/>
      <circle class="light-breathe" cx="104" cy="86" r="7" fill="${G.pale}"/>
    </g>
    <g class="d-far" filter="url(#f${u})">
      <rect x="212" y="30" width="74" height="62" fill="${G.slate}" opacity="0.85"/>
      <rect x="212" y="30" width="74" height="62" fill="url(#l${u})" opacity="0.35"/>
      <line x1="249" y1="30" x2="249" y2="92" stroke="${G.void}" stroke-width="2.4"/>
      <line x1="212" y1="61" x2="286" y2="61" stroke="${G.void}" stroke-width="2.4"/>
    </g>
    <g class="d-near">
      <path d="M-6 132 q60 -12 120 -2 t212 4 V182 H-6 Z" fill="${G.deep}"/>
      <path d="M-6 150 q80 -10 160 0 t170 2 V182 H-6 Z" fill="${G.void}"/>
      <ellipse cx="196" cy="150" rx="52" ry="16" fill="${G.charcoal}" opacity="0.9"/>
      <ellipse cx="196" cy="146" rx="48" ry="13" fill="${G.slate}"/>
      <ellipse cx="186" cy="143" rx="20" ry="5" fill="${G.stone}" opacity="0.7"/>
      <rect x="34" y="120" width="30" height="40" rx="4" fill="${G.abyss}" opacity="0.9"/>
    </g>
    <g class="d-far dust">
      <circle class="tw1" cx="120" cy="104" r="1.1" fill="${G.pale}" opacity="0.6"/>
      <circle class="tw3" cx="138" cy="126" r="1.3" fill="${G.pale}" opacity="0.5"/>
      <circle class="tw2" cx="86" cy="118" r="1" fill="${G.pale}" opacity="0.45"/>
    </g>
    <rect class="vign" width="320" height="180" fill="url(#l${u})" opacity="0"/>
  `,
};

const SVG_OPEN =
  '<svg class="art-svg" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">';

export function cardArtSVG(key) {
  const build = SCENES[key];
  if (!build) return '';
  const uid = key.replace(/[^a-z]/g, '');
  return `${SVG_OPEN}${defs(uid)}${build(uid)}</svg>`;
}

export function hasCardArt(key) {
  return Boolean(SCENES[key]);
}
