/* =====================================================================
   FPS-DATA.JS — data pro odhad snímků za sekundu (PrahaComp.cz)

   Jak se výkon odhaduje (shrnutí, podrobně v dokumentu v projektu):
   - GPU: skóre g[1080,1440,2160] = průměrné FPS ve 2160/1440/1080p ULTRA
     v 11 moderních hrách bez upscalingu (testbed Ryzen 7 9800X3D,
     naměřil Tom's Hardware, hierarchie GPU 2026). Starší karty, které v té
     tabulce nejsou (GTX 10, RX 400/500, RX 5000, RTX 20, …), jsou převedeny
     z o něco starší tabulky téhož testu (8 her, 2022–2024) pomocí poměru
     z karet, které jsou v obou tabulkách (≈ 0,84).
   - CPU: herní skóre procesoru (Windows 10 tabulka Tom's Hardware:
     Core i9-12900K = 100). Chybějící modely jsou dopočítané podle generace
     a jádra (příznak est).
   - Notebookové grafiky: odhad podle vztahů k stolním kartám (příznak est).
   - Hry: základní FPS referenční karty (RTX 4060) v 1080p Ultra, strop
     procesoru, citlivost na kvalitu, nároky na VRAM, podpora DLSS/FSR/RT.
   Všechno je ORIENTAČNÍ odhad, ne měření konkrétního počítače.
   ===================================================================== */
(function (root, factory) {
  var d = factory();
  if (typeof module === 'object' && module.exports) module.exports = d;
  else root.PCFPS_DATA = d;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ------------------------------------------------------------------
     Pomocné: převod ze starší tabulky (8 her, 2022–2024) na novou škálu
     ------------------------------------------------------------------ */
  function fromOld(o1080, o1440, vram) {
    var k = o1080 >= 100 ? 0.90 : 0.84;
    var g1 = o1080 * k;
    var ratio = (o1440 && o1080) ? (o1440 / o1080) : 0.72;
    var g2 = g1 * ratio * 0.92;
    var m4 = vram <= 4 ? 0.28 : vram <= 8 ? 0.40 : vram <= 12 ? 0.50 : 0.58;
    var g4 = g2 * m4;
    return [vram, r1(g1), r1(g2), r1(g4)];
  }
  function r1(x) { return Math.round(x * 10) / 10; }

  /* ------------------------------------------------------------------
     GPU: [id, název, výrobce, architektura, [regexy po normalizaci],
           [[vram, g1080, g1440, g4k], …] (první = výchozí), {volby}]
     Normalizace textu: malá písmena, bez „geforce/nvidia/radeon/amd/intel“,
     mezera mezi písmeny a číslicemi (rtx3060ti → rtx 3060 ti).
     ------------------------------------------------------------------ */
  var G = [];
  function add(id, name, vendor, arch, pats, alts, o) {
    G.push({ id: id, name: name, vendor: vendor, arch: arch, pats: pats, alts: alts, o: o || {} });
  }

  /* ---- NVIDIA GeForce RTX 50 (Blackwell) — naměřeno ---- */
  add('rtx5090', 'RTX 5090', 'nv', 'blackwell', ['rtx 5090'], [[32, 203.8, 167.3, 110.8]], { lap: 'rtx5090-l' });
  add('rtx5080', 'RTX 5080', 'nv', 'blackwell', ['rtx 5080'], [[16, 166.9, 128.3, 77.4]], { lap: 'rtx5080-l' });
  add('rtx5070ti', 'RTX 5070 Ti', 'nv', 'blackwell', ['rtx 5070 ti'], [[16, 155.4, 116.8, 68.6]], { lap: 'rtx5070ti-l' });
  add('rtx5070', 'RTX 5070', 'nv', 'blackwell', ['rtx 5070'], [[12, 132.6, 96.4, 54.3]], { lap: 'rtx5070-l' });
  add('rtx5060ti', 'RTX 5060 Ti', 'nv', 'blackwell', ['rtx 5060 ti'], [[16, 105.2, 73.4, 40.2], [8, 100.4, 68.6, 28.1]]);
  add('rtx5060', 'RTX 5060', 'nv', 'blackwell', ['rtx 5060'], [[8, 88.5, 59.8, 21.8]], { lap: 'rtx5060-l' });
  add('rtx5050', 'RTX 5050', 'nv', 'blackwell', ['rtx 5050'], [[8, 69.3, 45.2, 17.0]], { lap: 'rtx5050-l' });

  /* ---- NVIDIA GeForce RTX 40 (Ada) — naměřeno ---- */
  add('rtx4090', 'RTX 4090', 'nv', 'ada', ['rtx 4090'], [[24, 183.6, 143.4, 89.1]], { lap: 'rtx4090-l' });
  add('rtx4080s', 'RTX 4080 Super', 'nv', 'ada', ['rtx 4080 super'], [[16, 158.9, 118.6, 69.4]]);
  add('rtx4080', 'RTX 4080', 'nv', 'ada', ['rtx 4080'], [[16, 157.3, 117.5, 67.5]], { lap: 'rtx4080-l' });
  add('rtx4070tis', 'RTX 4070 Ti Super', 'nv', 'ada', ['rtx 4070 ti super'], [[16, 141.2, 104.0, 58.5]]);
  add('rtx4070ti', 'RTX 4070 Ti', 'nv', 'ada', ['rtx 4070 ti'], [[12, 135.1, 97.9, 53.9]]);
  add('rtx4070s', 'RTX 4070 Super', 'nv', 'ada', ['rtx 4070 super'], [[12, 126.7, 91.2, 49.2]]);
  add('rtx4070', 'RTX 4070', 'nv', 'ada', ['rtx 4070'], [[12, 111.5, 77.8, 41.3]], { lap: 'rtx4070-l' });
  add('rtx4060ti', 'RTX 4060 Ti', 'nv', 'ada', ['rtx 4060 ti'], [[8, 88.0, 58.9, 23.9], [16, 89.3, 60.5, 31.3]]);
  add('rtx4060', 'RTX 4060', 'nv', 'ada', ['rtx 4060'], [[8, 71.5, 47.6, 17.4]], { lap: 'rtx4060-l' });
  add('rtx4050', 'RTX 4050', 'nv', 'ada', ['rtx 4050'], [[6, 54, 35, 12]], { lap: 'rtx4050-l', est: 1 });

  /* ---- NVIDIA GeForce RTX 30 (Ampere) — naměřeno ---- */
  add('rtx3090ti', 'RTX 3090 Ti', 'nv', 'ampere', ['rtx 3090 ti'], [[24, 131.7, 99.9, 59.3]]);
  add('rtx3090', 'RTX 3090', 'nv', 'ampere', ['rtx 3090'], [[24, 122.9, 91.5, 53.1]]);
  add('rtx3080ti', 'RTX 3080 Ti', 'nv', 'ampere', ['rtx 3080 ti'], [[12, 119.6, 89.1, 51.0]], { lap: 'rtx3080ti-l' });
  add('rtx3080', 'RTX 3080', 'nv', 'ampere', ['rtx 3080'], [[10, 111.6, 82.0, 43.9], [12, 114.0, 84.0, 46.0]], { lap: 'rtx3080-l' });
  add('rtx3070ti', 'RTX 3070 Ti', 'nv', 'ampere', ['rtx 3070 ti'], [[8, 94.6, 66.9, 26.0]], { lap: 'rtx3070ti-l' });
  add('rtx3070', 'RTX 3070', 'nv', 'ampere', ['rtx 3070'], [[8, 87.2, 58.2, 26.2]], { lap: 'rtx3070-l' });
  add('rtx3060ti', 'RTX 3060 Ti', 'nv', 'ampere', ['rtx 3060 ti'], [[8, 74.2, 51.0, 19.4]]);
  add('rtx3060', 'RTX 3060', 'nv', 'ampere', ['rtx 3060'], [[12, 61.5, 41.9, 22.2], [8, 56.5, 38.5, 15.0]], { lap: 'rtx3060-l' });
  add('rtx3050', 'RTX 3050', 'nv', 'ampere', ['rtx 3050'], [[8, 44.6, 29.8, 12.6], [6, 40.0, 26.5, 10.0]], { lap: 'rtx3050-l' });

  /* ---- NVIDIA GeForce RTX 20 / GTX 16 / GTX 10 — ze starší tabulky ---- */
  function addOld(id, name, vendor, arch, pats, o1080, o1440, vram, o) {
    add(id, name, vendor, arch, pats, [fromOld(o1080, o1440, vram)], o);
  }
  addOld('rtx2080ti', 'RTX 2080 Ti', 'nv', 'turing', ['rtx 2080 ti'], 96.3, 75.6, 11);
  addOld('rtx2080s', 'RTX 2080 Super', 'nv', 'turing', ['rtx 2080 super'], 86.0, 66.1, 8);
  addOld('rtx2080', 'RTX 2080', 'nv', 'turing', ['rtx 2080'], 82.5, 63.2, 8);
  addOld('rtx2070s', 'RTX 2070 Super', 'nv', 'turing', ['rtx 2070 super'], 77.4, 58.4, 8);
  addOld('rtx2070', 'RTX 2070', 'nv', 'turing', ['rtx 2070'], 69.8, 51.8, 8);
  addOld('rtx2060s', 'RTX 2060 Super', 'nv', 'turing', ['rtx 2060 super'], 65.5, 48.3, 8);
  addOld('rtx2060', 'RTX 2060', 'nv', 'turing', ['rtx 2060'], 55.5, 40.1, 6);
  addOld('gtx1660ti', 'GTX 1660 Ti', 'nv', 'turing16', ['gtx 1660 ti'], 46.6, 33.3, 6);
  addOld('gtx1660s', 'GTX 1660 Super', 'nv', 'turing16', ['gtx 1660 super'], 46.8, 33.3, 6);
  addOld('gtx1660', 'GTX 1660', 'nv', 'turing16', ['gtx 1660'], 42.6, 30.3, 6);
  addOld('gtx1650s', 'GTX 1650 Super', 'nv', 'turing16', ['gtx 1650 super'], 33.9, 21.2, 4);
  addOld('gtx1650', 'GTX 1650', 'nv', 'turing16', ['gtx 1650'], 27.0, 19.0, 4);
  addOld('gtx1080ti', 'GTX 1080 Ti', 'nv', 'pascal', ['gtx 1080 ti'], 66.4, 50.2, 11);
  addOld('gtx1080', 'GTX 1080', 'nv', 'pascal', ['gtx 1080'], 53.0, 39.4, 8);
  addOld('gtx1070ti', 'GTX 1070 Ti', 'nv', 'pascal', ['gtx 1070 ti'], 51.1, 37.9, 8);
  addOld('gtx1070', 'GTX 1070', 'nv', 'pascal', ['gtx 1070'], 44.7, 33.1, 8);
  add('gtx1060', 'GTX 1060', 'nv', 'pascal', ['gtx 1060'], [fromOld(32.1, 23.0, 6),
    (function () { var a = fromOld(32.1, 23.0, 3); a[1] = r1(a[1] * 0.88); a[2] = r1(a[2] * 0.86); a[3] = r1(a[3] * 0.8); return a; })()]);
  addOld('gtx1050ti', 'GTX 1050 Ti', 'nv', 'pascal', ['gtx 1050 ti'], 19.8, 14.0, 4);
  addOld('gtx980ti', 'GTX 980 Ti', 'nv', 'maxwell', ['gtx 980 ti'], 35.9, 26.6, 6);
  addOld('gtx980', 'GTX 980', 'nv', 'maxwell', ['gtx 980'], 28.9, 20.0, 4);
  addOld('gtx970', 'GTX 970', 'nv', 'maxwell', ['gtx 970'], 26.5, 18.5, 4);

  /* ---- AMD Radeon RX 9000 (RDNA 4) / 7000 (RDNA 3) / 6000 (RDNA 2) — naměřeno ---- */
  add('rx9070xt', 'RX 9070 XT', 'amd', 'rdna4', ['rx 9070 xt'], [[16, 156.6, 116.5, 65.8]]);
  add('rx9070gre', 'RX 9070 GRE', 'amd', 'rdna4', ['rx 9070 gre'], [[12, 120.6, 86.6, 46.3]]);
  add('rx9070', 'RX 9070', 'amd', 'rdna4', ['rx 9070'], [[16, 140.9, 104.0, 57.7]]);
  add('rx9060xt', 'RX 9060 XT', 'amd', 'rdna4', ['rx 9060 xt'], [[16, 98.3, 67.3, 35.2], [8, 93.2, 62.5, 29.7]]);
  add('rx7900xtx', 'RX 7900 XTX', 'amd', 'rdna3', ['rx 7900 xtx'], [[24, 161.5, 122.3, 70.6]]);
  add('rx7900xt', 'RX 7900 XT', 'amd', 'rdna3', ['rx 7900 xt'], [[20, 145.4, 108.0, 59.8]]);
  add('rx7900gre', 'RX 7900 GRE', 'amd', 'rdna3', ['rx 7900 gre'], [[16, 128, 94, 51]], { est: 1 });
  add('rx7800xt', 'RX 7800 XT', 'amd', 'rdna3', ['rx 7800 xt'], [[16, 118.4, 84.7, 45.1]]);
  add('rx7700xt', 'RX 7700 XT', 'amd', 'rdna3', ['rx 7700 xt'], [[12, 102.9, 72.7, 38.0]]);
  add('rx7600xt', 'RX 7600 XT', 'amd', 'rdna3', ['rx 7600 xt'], [[16, 78, 52, 25.5]], { est: 1 });
  add('rx7600', 'RX 7600', 'amd', 'rdna3', ['rx 7600'], [[8, 69.9, 45.4, 18.4]]);
  add('rx6950xt', 'RX 6950 XT', 'amd', 'rdna2', ['rx 6950 xt'], [[16, 123.3, 89.5, 48.3]]);
  add('rx6900xt', 'RX 6900 XT', 'amd', 'rdna2', ['rx 6900 xt'], [[16, 117.1, 83.9, 44.9]]);
  add('rx6800xt', 'RX 6800 XT', 'amd', 'rdna2', ['rx 6800 xt'], [[16, 111.8, 79.6, 42.2]]);
  add('rx6800', 'RX 6800', 'amd', 'rdna2', ['rx 6800'], [[16, 103.1, 71.7, 37.0]], { est: 1 });
  add('rx6750xt', 'RX 6750 XT', 'amd', 'rdna2', ['rx 6750 xt'], [[12, 83.2, 57.6, 29.6]]);
  add('rx6700xt', 'RX 6700 XT', 'amd', 'rdna2', ['rx 6700 xt'], [[12, 79.2, 54.3, 28.0]]);
  addOld('rx6700', 'RX 6700', 'amd', 'rdna2', ['rx 6700'], 86.1, 62.8, 10);
  add('rx6650xt', 'RX 6650 XT', 'amd', 'rdna2', ['rx 6650 xt'], [[8, 64.3, 38.0, 19.0]]);
  add('rx6600xt', 'RX 6600 XT', 'amd', 'rdna2', ['rx 6600 xt'], [[8, 62.7, 40.7, 17.3]]);
  add('rx6600', 'RX 6600', 'amd', 'rdna2', ['rx 6600'], [[8, 51.9, 35.7, 14.5]]);
  addOld('rx6500xt', 'RX 6500 XT', 'amd', 'rdna2', ['rx 6500 xt'], 30.6, 18.0, 4);
  addOld('rx6400', 'RX 6400', 'amd', 'rdna2', ['rx 6400'], 24.1, 16.0, 4);

  /* ---- AMD Radeon RX 5000 (RDNA 1), Vega, RX 400/500 — ze starší tabulky ---- */
  addOld('rx5700xt', 'RX 5700 XT', 'amd', 'rdna1', ['rx 5700 xt'], 73.3, 53.1, 8);
  addOld('rx5700', 'RX 5700', 'amd', 'rdna1', ['rx 5700'], 64.5, 46.7, 8);
  addOld('rx5600xt', 'RX 5600 XT', 'amd', 'rdna1', ['rx 5600 xt'], 57.8, 42.0, 6);
  add('rx5500xt', 'RX 5500 XT', 'amd', 'rdna1', ['rx 5500 xt'], [fromOld(39.7, 28.2, 8), fromOld(33.3, 24.0, 4)]);
  addOld('radeon7', 'Radeon VII', 'amd', 'vega', ['radeon vii', 'radeon 7 '], 69.5, 53.0, 16);
  addOld('vega64', 'RX Vega 64', 'amd', 'vega', ['rx vega 64', 'vega 64'], 56.7, 41.6, 8);
  addOld('vega56', 'RX Vega 56', 'amd', 'vega', ['rx vega 56', 'vega 56'], 50.6, 37.0, 8);
  addOld('rx590', 'RX 590', 'amd', 'polaris', ['rx 590'], 39.3, 29.0, 8);
  add('rx580', 'RX 580', 'amd', 'polaris', ['rx 580'], [fromOld(35.3, 26.0, 8), (function () { var a = fromOld(35.3, 26.0, 4); a[1] = r1(a[1] * 0.96); a[2] = r1(a[2] * 0.94); return a; })()]);
  add('rx570', 'RX 570', 'amd', 'polaris', ['rx 570'], [(function () { var a = fromOld(28.1, 19.9, 8); a[1] = r1(a[1] * 1.04); a[2] = r1(a[2] * 1.04); return a; })(), fromOld(28.1, 19.9, 4)]);
  addOld('rx560', 'RX 560', 'amd', 'polaris', ['rx 560'], 14.7, 10.0, 4);

  /* ---- Intel Arc ---- */
  add('arcb580', 'Arc B580', 'intel', 'arc', ['arc b580'], [[12, 71.5, 50.7, 27.6]]);
  add('arcb570', 'Arc B570', 'intel', 'arc', ['arc b570'], [[10, 63.5, 44.3, 19.6]]);
  addOld('arca770', 'Arc A770', 'intel', 'arc', ['arc a770'], 76.9, 59.8, 16);
  addOld('arca750', 'Arc A750', 'intel', 'arc', ['arc a750'], 70.8, 53.7, 8);
  addOld('arca580', 'Arc A580', 'intel', 'arc', ['arc a580'], 65.1, 48.8, 8);

  /* ---- Notebookové grafiky (ODHAD podle vztahů ke stolním kartám; TGP 80–140 W) ---- */
  function addL(id, name, vendor, arch, pats, vram, a, b, c) {
    add(id, name, vendor, arch, pats, [[vram, a, b, c]], { laptop: 1, est: 1 });
  }
  addL('rtx5090-l', 'RTX 5090 Laptop', 'nv', 'blackwell', ['rtx 5090 (?:laptop|notebook|mobile|max q)'], 24, 146, 112, 68);
  addL('rtx5080-l', 'RTX 5080 Laptop', 'nv', 'blackwell', ['rtx 5080 (?:laptop|notebook|mobile|max q)'], 16, 128, 94, 55);
  addL('rtx5070ti-l', 'RTX 5070 Ti Laptop', 'nv', 'blackwell', ['rtx 5070 ti (?:laptop|notebook|mobile|max q)'], 12, 108, 80, 42);
  addL('rtx5070-l', 'RTX 5070 Laptop', 'nv', 'blackwell', ['rtx 5070 (?:laptop|notebook|mobile|max q)'], 8, 88, 59, 22);
  addL('rtx5060-l', 'RTX 5060 Laptop', 'nv', 'blackwell', ['rtx 5060 (?:laptop|notebook|mobile|max q)'], 8, 80, 53, 19);
  addL('rtx5050-l', 'RTX 5050 Laptop', 'nv', 'blackwell', ['rtx 5050 (?:laptop|notebook|mobile|max q)'], 8, 60, 39, 14);
  addL('rtx4090-l', 'RTX 4090 Laptop', 'nv', 'ada', ['rtx 4090 (?:laptop|notebook|mobile|max q)'], 16, 128, 94, 55);
  addL('rtx4080-l', 'RTX 4080 Laptop', 'nv', 'ada', ['rtx 4080 (?:laptop|notebook|mobile|max q)'], 12, 108, 79, 43);
  addL('rtx4070-l', 'RTX 4070 Laptop', 'nv', 'ada', ['rtx 4070 (?:laptop|notebook|mobile|max q)'], 8, 84, 57, 21);
  addL('rtx4060-l', 'RTX 4060 Laptop', 'nv', 'ada', ['rtx 4060 (?:laptop|notebook|mobile|max q)'], 8, 63, 42, 15);
  addL('rtx4050-l', 'RTX 4050 Laptop', 'nv', 'ada', ['rtx 4050 (?:laptop|notebook|mobile|max q)'], 6, 49, 32, 11);
  addL('rtx3080ti-l', 'RTX 3080 Ti Laptop', 'nv', 'ampere', ['rtx 3080 ti (?:laptop|notebook|mobile|max q)'], 16, 92, 68, 38);
  addL('rtx3080-l', 'RTX 3080 Laptop', 'nv', 'ampere', ['rtx 3080 (?:laptop|notebook|mobile|max q)'], 8, 85, 62, 28);
  addL('rtx3070ti-l', 'RTX 3070 Ti Laptop', 'nv', 'ampere', ['rtx 3070 ti (?:laptop|notebook|mobile|max q)'], 8, 76, 53, 22);
  addL('rtx3070-l', 'RTX 3070 Laptop', 'nv', 'ampere', ['rtx 3070 (?:laptop|notebook|mobile|max q)'], 8, 67, 46, 19);
  addL('rtx3060-l', 'RTX 3060 Laptop', 'nv', 'ampere', ['rtx 3060 (?:laptop|notebook|mobile|max q)'], 6, 53, 36, 15);
  addL('rtx3050ti-l', 'RTX 3050 Ti Laptop', 'nv', 'ampere', ['rtx 3050 ti(?: (?:laptop|notebook|mobile|max q))?'], 4, 36, 24, 9);
  addL('rtx3050-l', 'RTX 3050 Laptop', 'nv', 'ampere', ['rtx 3050 (?:laptop|notebook|mobile|max q)'], 4, 30, 20, 7);
  addL('gtx1660ti-l', 'GTX 1660 Ti Laptop', 'nv', 'turing16', ['gtx 1660 ti (?:laptop|notebook|mobile|max q)'], 6, 33, 22, 8);
  addL('gtx1650-l', 'GTX 1650 Laptop', 'nv', 'turing16', ['gtx 1650 (?:laptop|notebook|mobile|max q)'], 4, 19, 12, 4);
  addL('rx7900m', 'RX 7900M', 'amd', 'rdna3', ['rx 7900 ?m'], 16, 105, 76, 42);
  addL('rx7700s', 'RX 7700S', 'amd', 'rdna3', ['rx 7700 ?s'], 8, 54, 36, 14);
  addL('rx7600mxt', 'RX 7600M XT', 'amd', 'rdna3', ['rx 7600 ?m xt'], 8, 58, 37, 15);
  addL('rx7600s', 'RX 7600S', 'amd', 'rdna3', ['rx 7600 ?s'], 8, 46, 30, 12);
  addL('rx6800m', 'RX 6800M', 'amd', 'rdna2', ['rx 6800 ?m'], 12, 72, 52, 27);
  addL('rx6700m', 'RX 6700M', 'amd', 'rdna2', ['rx 6700 ?m'], 10, 55, 37, 16);
  addL('rx6600m', 'RX 6600M', 'amd', 'rdna2', ['rx 6600 ?m'], 8, 48, 32, 12);

  /* ------------------------------------------------------------------
     CPU: id, název, skóre (Core i9-12900K = 100), jádra, vlákna, est
     ------------------------------------------------------------------ */
  var C = {};
  function cpu(id, name, score, cores, threads, est) {
    C[id] = { id: id, name: name, s: score, c: cores, t: threads, est: !!est };
  }
  /* Intel — naměřeno (Tom's Hardware, W10 tabulka) */
  cpu('i9-12900k', 'Core i9-12900K', 100, 16, 24);
  cpu('i7-12700k', 'Core i7-12700K', 97.7, 12, 20);
  cpu('i5-12600k', 'Core i5-12600K', 90.9, 10, 16);
  cpu('i9-11900k', 'Core i9-11900K', 92.5, 8, 16);
  cpu('i5-11600k', 'Core i5-11600K', 84.1, 6, 12);
  cpu('i5-11400', 'Core i5-11400', 81.0, 6, 12);
  cpu('i9-10900k', 'Core i9-10900K', 85.0, 10, 20);
  cpu('i7-10700k', 'Core i7-10700K', 80.7, 8, 16);
  cpu('i5-10600k', 'Core i5-10600K', 75.4, 6, 12);
  cpu('i9-9900ks', 'Core i9-9900KS', 76.1, 8, 16);
  cpu('i9-9900k', 'Core i9-9900K', 73.4, 8, 16);
  cpu('i7-9700k', 'Core i7-9700K', 73.6, 8, 8);
  cpu('i5-9600k', 'Core i5-9600K', 67.1, 6, 6);
  cpu('i5-9400', 'Core i5-9400', 64.9, 6, 6);
  cpu('i7-8700k', 'Core i7-8700K', 68.5, 6, 12);
  cpu('i7-8700', 'Core i7-8700', 65.6, 6, 12);
  cpu('i5-8600k', 'Core i5-8600K', 65.8, 6, 6);
  cpu('i5-8400', 'Core i5-8400', 64.0, 6, 6);
  cpu('i3-10100', 'Core i3-10100', 61.9, 4, 8);
  cpu('i3-9100', 'Core i3-9100', 52.0, 4, 4);
  cpu('i3-8100', 'Core i3-8100', 48.4, 4, 4);
  /* Intel — dopočítáno (est) */
  cpu('i5-10500', 'Core i5-10500', 73.5, 6, 12, 1);
  cpu('i5-10400', 'Core i5-10400', 71.5, 6, 12, 1);
  cpu('i7-10700', 'Core i7-10700', 78.5, 8, 16, 1);
  cpu('i9-10900', 'Core i9-10900', 83.0, 10, 20, 1);
  cpu('i7-9700', 'Core i7-9700', 71.0, 8, 8, 1);
  cpu('i5-9500', 'Core i5-9500', 65.5, 6, 6, 1);
  cpu('i7-7700k', 'Core i7-7700K', 62.0, 4, 8, 1);
  cpu('i7-7700', 'Core i7-7700', 59.0, 4, 8, 1);
  cpu('i5-7600k', 'Core i5-7600K', 58.0, 4, 4, 1);
  cpu('i5-7500', 'Core i5-7500', 55.0, 4, 4, 1);
  cpu('i5-7400', 'Core i5-7400', 52.0, 4, 4, 1);
  cpu('i7-6700k', 'Core i7-6700K', 60.5, 4, 8, 1);
  cpu('i7-6700', 'Core i7-6700', 57.0, 4, 8, 1);
  cpu('i5-6600k', 'Core i5-6600K', 56.0, 4, 4, 1);
  cpu('i5-6600', 'Core i5-6600', 53.0, 4, 4, 1);
  cpu('i5-6500', 'Core i5-6500', 50.5, 4, 4, 1);
  cpu('i3-6100', 'Core i3-6100', 41.0, 2, 4, 1);
  cpu('i5-12400', 'Core i5-12400', 87.3, 6, 12);
  cpu('i5-12500', 'Core i5-12500', 90.0, 6, 12, 1);
  cpu('i7-12700', 'Core i7-12700', 94.0, 12, 20, 1);
  cpu('i9-12900', 'Core i9-12900', 96.0, 16, 24, 1);
  cpu('i3-12100', 'Core i3-12100', 79.0, 4, 8, 1);
  cpu('i5-13400', 'Core i5-13400', 95.0, 10, 16, 1);
  cpu('i5-13600k', 'Core i5-13600K', 118.0, 14, 20);
  cpu('i7-13700k', 'Core i7-13700K', 126.0, 16, 24);
  cpu('i9-13900k', 'Core i9-13900K', 131.0, 24, 32);
  cpu('i5-14400', 'Core i5-14400', 99.0, 10, 16, 1);
  cpu('i5-14600k', 'Core i5-14600K', 122.0, 14, 20, 1);
  cpu('i7-14700k', 'Core i7-14700K', 130.0, 20, 28, 1);
  cpu('i9-14900k', 'Core i9-14900K', 134.0, 24, 32, 1);
  /* AMD Ryzen — naměřeno */
  cpu('r9-5950x', 'Ryzen 9 5950X', 90.2, 16, 32);
  cpu('r9-5900x', 'Ryzen 9 5900X', 91.0, 12, 24);
  cpu('r7-5800x', 'Ryzen 7 5800X', 86.9, 8, 16);
  cpu('r5-5600x', 'Ryzen 5 5600X', 88.5, 6, 12);
  cpu('r9-3950x', 'Ryzen 9 3950X', 72.6, 16, 32);
  cpu('r9-3900xt', 'Ryzen 9 3900XT', 71.7, 12, 24);
  cpu('r7-3800xt', 'Ryzen 7 3800XT', 71.8, 8, 16);
  cpu('r7-3800x', 'Ryzen 7 3800X', 71.3, 8, 16);
  cpu('r7-3700x', 'Ryzen 7 3700X', 71.4, 8, 16);
  cpu('r5-3600xt', 'Ryzen 5 3600XT', 70.6, 6, 12);
  cpu('r5-3600x', 'Ryzen 5 3600X', 68.4, 6, 12);
  cpu('r5-3600', 'Ryzen 5 3600', 68.6, 6, 12);
  cpu('r3-3300x', 'Ryzen 3 3300X', 67.5, 4, 8);
  cpu('r3-3100', 'Ryzen 3 3100', 57.8, 4, 8);
  cpu('r7-2700x', 'Ryzen 7 2700X', 59.2, 8, 16);
  cpu('r5-2600x', 'Ryzen 5 2600X', 57.6, 6, 12);
  cpu('r5-1600x', 'Ryzen 5 1600X', 50.0, 6, 12);
  /* AMD Ryzen — dopočítáno */
  cpu('r5-2600', 'Ryzen 5 2600', 55.5, 6, 12, 1);
  cpu('r7-2700', 'Ryzen 7 2700', 57.5, 8, 16, 1);
  cpu('r5-1600', 'Ryzen 5 1600', 48.0, 6, 12, 1);
  cpu('r7-1700', 'Ryzen 7 1700', 47.0, 8, 16, 1);
  cpu('r5-3500', 'Ryzen 5 3500', 62.0, 6, 6, 1);
  cpu('r5-5500', 'Ryzen 5 5500', 78.0, 6, 12, 1);
  cpu('r5-5600', 'Ryzen 5 5600', 86.0, 6, 12, 1);
  cpu('r5-5600g', 'Ryzen 5 5600G', 80.0, 6, 12, 1);
  cpu('r7-5700x', 'Ryzen 7 5700X', 91.0, 8, 16);
  cpu('r7-5700g', 'Ryzen 7 5700G', 81.0, 8, 16, 1);
  cpu('r7-5800x3d', 'Ryzen 7 5800X3D', 124.0, 8, 16);
  cpu('r5-7600', 'Ryzen 5 7600', 104.5, 6, 12);
  cpu('r5-7600x', 'Ryzen 5 7600X', 109.6, 6, 12);
  cpu('r7-7700', 'Ryzen 7 7700', 113.0, 8, 16);
  cpu('r7-7700x', 'Ryzen 7 7700X', 114.2, 8, 16);
  cpu('r7-7800x3d', 'Ryzen 7 7800X3D', 142.0, 8, 16, 1);
  cpu('r9-7900x', 'Ryzen 9 7900X', 114.6, 12, 24);
  cpu('r9-7950x', 'Ryzen 9 7950X', 114.4, 16, 32);
  cpu('r5-8600g', 'Ryzen 5 8600G', 98.0, 6, 12, 1);
  cpu('r7-8700g', 'Ryzen 7 8700G', 104.0, 8, 16, 1);
  cpu('r5-9600x', 'Ryzen 5 9600X', 118.0, 6, 12, 1);
  cpu('r7-9700x', 'Ryzen 7 9700X', 124.0, 8, 16, 1);
  cpu('r7-9800x3d', 'Ryzen 7 9800X3D', 158.0, 8, 16, 1);
  cpu('r9-9900x', 'Ryzen 9 9900X', 124.0, 12, 24, 1);
  cpu('r9-9950x', 'Ryzen 9 9950X', 126.0, 16, 32, 1);
  /* Notebookové procesory (est) */
  cpu('i5-12450h', 'Core i5-12450H', 74.0, 8, 12, 1);
  cpu('i5-12500h', 'Core i5-12500H', 84.0, 12, 16, 1);
  cpu('i7-12650h', 'Core i7-12650H', 90.0, 10, 16, 1);
  cpu('i7-12700h', 'Core i7-12700H', 92.0, 14, 20, 1);
  cpu('i9-12900h', 'Core i9-12900H', 98.0, 14, 20, 1);
  cpu('i5-13420h', 'Core i5-13420H', 78.0, 8, 12, 1);
  cpu('i5-13500h', 'Core i5-13500H', 92.0, 12, 16, 1);
  cpu('i7-13620h', 'Core i7-13620H', 98.0, 10, 16, 1);
  cpu('i7-13700h', 'Core i7-13700H', 102.0, 14, 20, 1);
  cpu('i7-13700hx', 'Core i7-13700HX', 118.0, 16, 24, 1);
  cpu('i9-13900h', 'Core i9-13900H', 106.0, 14, 20, 1);
  cpu('i9-13900hx', 'Core i9-13900HX', 124.0, 24, 32, 1);
  cpu('i7-14650hx', 'Core i7-14650HX', 120.0, 16, 24, 1);
  cpu('i7-14700hx', 'Core i7-14700HX', 124.0, 20, 28, 1);
  cpu('i9-14900hx', 'Core i9-14900HX', 128.0, 24, 32, 1);
  cpu('r5-6600h', 'Ryzen 5 6600H', 76.0, 6, 12, 1);
  cpu('r7-6800h', 'Ryzen 7 6800H', 82.0, 8, 16, 1);
  cpu('r5-7535hs', 'Ryzen 5 7535HS', 78.0, 6, 12, 1);
  cpu('r7-7735hs', 'Ryzen 7 7735HS', 84.0, 8, 16, 1);
  cpu('r5-7640hs', 'Ryzen 5 7640HS', 90.0, 6, 12, 1);
  cpu('r7-7840hs', 'Ryzen 7 7840HS', 98.0, 8, 16, 1);
  cpu('r9-7940hs', 'Ryzen 9 7940HS', 100.0, 8, 16, 1);
  cpu('r7-8845hs', 'Ryzen 7 8845HS', 99.0, 8, 16, 1);
  cpu('r9-7945hx', 'Ryzen 9 7945HX', 118.0, 16, 32, 1);
  cpu('r9-7945hx3d', 'Ryzen 9 7945HX3D', 135.0, 16, 32, 1);
  cpu('r9-9955hx3d', 'Ryzen 9 9955HX3D', 150.0, 16, 32, 1);

  /* ------------------------------------------------------------------
     Hry
     a    = FPS referenční karty (RTX 4060) v 1080p Ultra, bez omezení CPU
     cap  = FPS při procesoru se skóre 88,5 (Ryzen 5 5600X) a nízké zátěži GPU
     qs   = citlivost na kvalitu detailů (0–1; esport ~0,3–0,5, AAA ~1)
     v    = nároky na VRAM v GB (1080p Ultra)
     up   = 'df' DLSS+FSR, 'f' jen FSR/vlastní, '' žádný upscaling
     fg   = podpora generování snímků
     rt   = zbylý výkon s ray tracingem (0 = hra RT nemá)
     core = citlivost na málo vláken (0–1), ram = citlivost na 8 GB RAM
     max  = pevný strop FPS hry, needs = vyžaduje HW ray tracing
     ------------------------------------------------------------------ */
  var games = [
    { id: 'cs2', name: 'Counter-Strike 2', short: 'CS2', year: 2023, genre: 'Esport', hue: 38, a: 230, cap: 360, qs: 0.45, v: 5, up: '', fg: 0, rt: 0, core: 0.2, ram: 0.2, nvx: 1.0, amx: 0.95 },
    { id: 'valorant', name: 'Valorant', short: 'VAL', year: 2020, genre: 'Esport', hue: 355, a: 520, cap: 560, qs: 0.3, v: 3, up: '', fg: 0, rt: 0, core: 0.1, ram: 0.1, nvx: 1.0, amx: 1.0 },
    { id: 'lol', name: 'League of Legends', short: 'LoL', year: 2009, genre: 'Esport', hue: 215, a: 700, cap: 520, qs: 0.2, v: 2, up: '', fg: 0, rt: 0, core: 0.1, ram: 0.1, nvx: 1.0, amx: 1.0 },
    { id: 'dota2', name: 'Dota 2', short: 'D2', year: 2013, genre: 'Esport', hue: 4, a: 260, cap: 260, qs: 0.35, v: 3, up: '', fg: 0, rt: 0, core: 0.2, ram: 0.1, nvx: 1.0, amx: 1.0 },
    { id: 'r6', name: 'Rainbow Six Siege X', short: 'R6', year: 2015, genre: 'Esport', hue: 200, a: 300, cap: 380, qs: 0.5, v: 6, up: 'df', fg: 0, rt: 0, core: 0.3, ram: 0.3, nvx: 1.0, amx: 1.0 },
    { id: 'ow2', name: 'Overwatch 2', short: 'OW2', year: 2022, genre: 'Esport', hue: 28, a: 300, cap: 400, qs: 0.45, v: 4, up: '', fg: 0, rt: 0, core: 0.3, ram: 0.2, nvx: 1.0, amx: 1.0 },
    { id: 'rocketleague', name: 'Rocket League', short: 'RL', year: 2015, genre: 'Esport', hue: 205, a: 420, cap: 500, qs: 0.4, v: 3, up: '', fg: 0, rt: 0, core: 0.1, ram: 0.1, nvx: 1.0, amx: 1.0 },
    { id: 'fortnite', name: 'Fortnite', short: 'FN', year: 2017, genre: 'Battle royale', hue: 268, a: 85, cap: 230, qs: 0.8, v: 8, up: 'df', fg: 1, rt: 0.55, core: 0.5, ram: 0.6, nvx: 1.0, amx: 0.97 },
    { id: 'apex', name: 'Apex Legends', short: 'APX', year: 2019, genre: 'Battle royale', hue: 6, a: 150, cap: 230, qs: 0.6, v: 6, up: '', fg: 0, rt: 0, core: 0.4, ram: 0.4, nvx: 1.0, amx: 1.03 },
    { id: 'warzone', name: 'Call of Duty: Warzone', short: 'WZ', year: 2020, genre: 'Battle royale', hue: 150, a: 100, cap: 190, qs: 0.7, v: 8, up: 'df', fg: 1, rt: 0, core: 0.6, ram: 0.7, nvx: 1.0, amx: 1.08 },
    { id: 'pubg', name: 'PUBG: Battlegrounds', short: 'PUBG', year: 2017, genre: 'Battle royale', hue: 42, a: 140, cap: 220, qs: 0.8, v: 6, up: 'f', fg: 0, rt: 0, core: 0.5, ram: 0.5, nvx: 1.0, amx: 1.0 },
    { id: 'marvelrivals', name: 'Marvel Rivals', short: 'MR', year: 2024, genre: 'Akční', hue: 350, a: 95, cap: 190, qs: 0.85, v: 7, up: 'df', fg: 1, rt: 0, core: 0.5, ram: 0.5, nvx: 1.0, amx: 1.0 },
    { id: 'bf6', name: 'Battlefield 6', short: 'BF6', year: 2025, genre: 'Střílečka', hue: 24, a: 82, cap: 150, qs: 0.85, v: 8, up: 'df', fg: 0, rt: 0, core: 0.8, ram: 0.8, nvx: 1.0, amx: 1.0 },
    { id: 'arcraiders', name: 'ARC Raiders', short: 'ARC', year: 2025, genre: 'Střílečka', hue: 18, a: 70, cap: 150, qs: 0.9, v: 8, up: 'df', fg: 1, rt: 0, core: 0.6, ram: 0.6, nvx: 1.0, amx: 0.97 },
    { id: 'doomtda', name: 'DOOM: The Dark Ages', short: 'DOOM', year: 2025, genre: 'Střílečka', hue: 8, a: 60, cap: 150, qs: 0.9, v: 9, up: 'df', fg: 1, rt: 0, core: 0.5, ram: 0.6, needs: 'rt', nvx: 1.0, amx: 1.0 },
    { id: 'cyberpunk', name: 'Cyberpunk 2077', short: 'CP', year: 2020, genre: 'RPG', hue: 56, a: 64, cap: 130, qs: 0.95, v: 7, up: 'df', fg: 1, rt: 0.5, core: 0.5, ram: 0.6, nvx: 1.0, amx: 0.97 },
    { id: 'witcher3', name: 'The Witcher 3 (Next-Gen)', short: 'W3', year: 2015, genre: 'RPG', hue: 205, a: 75, cap: 120, qs: 0.8, v: 6, up: 'df', fg: 1, rt: 0.55, core: 0.4, ram: 0.5, nvx: 1.0, amx: 1.0 },
    { id: 'bg3', name: "Baldur's Gate 3", short: 'BG3', year: 2023, genre: 'RPG', hue: 342, a: 80, cap: 105, qs: 0.85, v: 7, up: 'df', fg: 0, rt: 0, core: 0.4, ram: 0.6, nvx: 1.0, amx: 1.0 },
    { id: 'eldenring', name: 'Elden Ring', short: 'ER', year: 2022, genre: 'RPG', hue: 45, a: 75, cap: 80, qs: 0.8, v: 6, up: '', fg: 0, rt: 0, core: 0.3, ram: 0.4, max: 60, nvx: 1.0, amx: 1.0 },
    { id: 'clairobscur', name: 'Clair Obscur: Expedition 33', short: 'E33', year: 2025, genre: 'RPG', hue: 330, a: 62, cap: 140, qs: 0.9, v: 7, up: 'df', fg: 0, rt: 0, core: 0.5, ram: 0.6, nvx: 1.0, amx: 1.0 },
    { id: 'hogwarts', name: 'Hogwarts Legacy', short: 'HL', year: 2023, genre: 'RPG', hue: 262, a: 58, cap: 100, qs: 0.9, v: 10, up: 'df', fg: 1, rt: 0.55, core: 0.7, ram: 0.8, nvx: 1.0, amx: 0.95 },
    { id: 'stalker2', name: 'S.T.A.L.K.E.R. 2', short: 'ST2', year: 2024, genre: 'Střílečka', hue: 95, a: 42, cap: 80, qs: 0.95, v: 9, up: 'df', fg: 1, rt: 0, core: 0.8, ram: 0.8, nvx: 1.0, amx: 1.0 },
    { id: 'rdr2', name: 'Red Dead Redemption 2', short: 'RDR2', year: 2019, genre: 'Akční', hue: 12, a: 70, cap: 135, qs: 1.0, v: 7, up: 'df', fg: 0, rt: 0, core: 0.5, ram: 0.6, nvx: 1.0, amx: 0.97 },
    { id: 'gta5', name: 'Grand Theft Auto V', short: 'GTA V', year: 2013, genre: 'Akční', hue: 140, a: 95, cap: 150, qs: 0.7, v: 6, up: 'df', fg: 0, rt: 0.65, core: 0.4, ram: 0.5, nvx: 1.0, amx: 1.0 },
    { id: 'spiderman2', name: "Marvel's Spider-Man 2", short: 'SM2', year: 2025, genre: 'Akční', hue: 0, a: 62, cap: 105, qs: 0.9, v: 9, up: 'df', fg: 1, rt: 0.72, core: 0.7, ram: 0.8, nvx: 1.0, amx: 0.97 },
    { id: 'aw2', name: 'Alan Wake II', short: 'AW2', year: 2023, genre: 'Horor', hue: 165, a: 40, cap: 135, qs: 1.0, v: 9, up: 'df', fg: 1, rt: 0.45, core: 0.5, ram: 0.7, nvx: 1.0, amx: 0.93 },
    { id: 'wukong', name: 'Black Myth: Wukong', short: 'BMW', year: 2024, genre: 'Akční RPG', hue: 32, a: 38, cap: 110, qs: 1.0, v: 9, up: 'df', fg: 1, rt: 0.5, core: 0.6, ram: 0.7, nvx: 1.03, amx: 0.95 },
    { id: 'mhwilds', name: 'Monster Hunter Wilds', short: 'MHW', year: 2025, genre: 'Akční RPG', hue: 25, a: 33, cap: 80, qs: 1.0, v: 10, up: 'df', fg: 1, rt: 0, core: 0.9, ram: 0.9, nvx: 1.0, amx: 1.0 },
    { id: 'acshadows', name: "Assassin's Creed Shadows", short: 'ACS', year: 2025, genre: 'Akční RPG', hue: 350, a: 38, cap: 95, qs: 1.0, v: 10, up: 'df', fg: 1, rt: 0, core: 0.8, ram: 0.8, nvx: 1.0, amx: 0.97 },
    { id: 'helldivers2', name: 'Helldivers 2', short: 'HD2', year: 2024, genre: 'Střílečka', hue: 52, a: 75, cap: 120, qs: 0.8, v: 8, up: 'f', fg: 0, rt: 0, core: 0.6, ram: 0.6, nvx: 1.0, amx: 1.0 },
    { id: 'fh5', name: 'Forza Horizon 5', short: 'FH5', year: 2021, genre: 'Závody', hue: 45, a: 105, cap: 200, qs: 0.75, v: 8, up: 'df', fg: 0, rt: 0, core: 0.4, ram: 0.5, nvx: 1.0, amx: 1.05 },
    { id: 'wow', name: 'World of Warcraft', short: 'WoW', year: 2004, genre: 'MMO', hue: 218, a: 210, cap: 175, qs: 0.6, v: 5, up: 'f', fg: 0, rt: 0, core: 0.4, ram: 0.5, nvx: 1.0, amx: 1.0 },
    { id: 'tarkov', name: 'Escape from Tarkov', short: 'EFT', year: 2017, genre: 'Střílečka', hue: 70, a: 100, cap: 95, qs: 0.8, v: 8, up: 'df', fg: 0, rt: 0, core: 0.8, ram: 0.9, nvx: 1.0, amx: 1.0 },
    { id: 'poe2', name: 'Path of Exile 2', short: 'PoE2', year: 2024, genre: 'RPG', hue: 20, a: 65, cap: 120, qs: 0.9, v: 8, up: 'df', fg: 0, rt: 0, core: 0.6, ram: 0.6, nvx: 1.0, amx: 1.0 }
  ];

  /* Předvolené (zvýrazněné) hry v nabídce — pořadí výběru */
  var featured = ['cs2', 'fortnite', 'cyberpunk', 'warzone', 'apex', 'gta5', 'valorant', 'wukong', 'eldenring', 'bf6'];

  return {
    version: 1,
    gpus: G,
    cpus: C,
    games: games,
    featured: featured,
    ref: { g1080: 71.5, cpuScore: 88.5 }
  };
});
