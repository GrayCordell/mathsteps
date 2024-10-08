import Node from '../../node/index.js'
import { ChangeTypes } from '../../types/changeType/ChangeTypes'

const nthRootLUT = {
  2: {
    4: [2, 0],
    8: [2, 2],
    9: [3, 0],
    12: [2, 3],
    16: [4, 0],
    18: [3, 2],
    20: [2, 5],
    24: [2, 6],
    25: [5, 0],
    27: [3, 3],
    28: [2, 7],
    32: [4, 2],
    36: [6, 0],
    40: [2, 10],
    44: [2, 11],
    45: [3, 5],
    48: [4, 3],
    49: [7, 0],
    50: [5, 2],
    52: [2, 13],
    54: [3, 6],
    56: [2, 14],
    60: [2, 15],
    63: [3, 7],
    64: [8, 0],
    68: [2, 17],
    72: [6, 2],
    75: [5, 3],
    76: [2, 19],
    80: [4, 5],
    81: [9, 0],
    84: [2, 21],
    88: [2, 22],
    90: [3, 10],
    92: [2, 23],
    96: [4, 6],
    98: [7, 2],
    99: [3, 11],
    100: [10, 0],
    104: [2, 26],
    108: [6, 3],
    112: [4, 7],
    116: [2, 29],
    117: [3, 13],
    120: [2, 30],
    121: [11, 0],
    124: [2, 31],
    125: [5, 5],
    126: [3, 14],
    128: [8, 2],
    132: [2, 33],
    135: [3, 15],
    136: [2, 34],
    140: [2, 35],
    144: [12, 0],
    147: [7, 3],
    148: [2, 37],
    150: [5, 6],
    152: [2, 38],
    153: [3, 17],
    156: [2, 39],
    160: [4, 10],
    162: [9, 2],
    164: [2, 41],
    168: [2, 42],
    169: [13, 0],
    171: [3, 19],
    172: [2, 43],
    175: [5, 7],
    176: [4, 11],
    180: [6, 5],
    184: [2, 46],
    188: [2, 47],
    189: [3, 21],
    192: [8, 3],
    196: [14, 0],
    198: [3, 22],
    200: [10, 2],
    204: [2, 51],
    207: [3, 23],
    208: [4, 13],
    212: [2, 53],
    216: [6, 6],
    220: [2, 55],
    224: [4, 14],
    225: [15, 0],
    228: [2, 57],
    232: [2, 58],
    234: [3, 26],
    236: [2, 59],
    240: [4, 15],
    242: [11, 2],
    243: [9, 3],
    244: [2, 61],
    245: [7, 5],
    248: [2, 62],
    250: [5, 10],
    252: [6, 7],
    256: [16, 0],
    261: [3, 29],
    270: [3, 30],
    272: [4, 17],
    275: [5, 11],
    279: [3, 31],
    288: [12, 2],
    289: [17, 0],
    294: [7, 6],
    297: [3, 33],
    300: [10, 3],
    304: [4, 19],
    306: [3, 34],
    315: [3, 35],
    320: [8, 5],
    324: [18, 0],
    325: [5, 13],
    333: [3, 37],
    336: [4, 21],
    338: [13, 2],
    342: [3, 38],
    343: [7, 7],
    350: [5, 14],
    351: [3, 39],
    352: [4, 22],
    360: [6, 10],
    361: [19, 0],
    363: [11, 3],
    368: [4, 23],
    369: [3, 41],
    375: [5, 15],
    378: [3, 42],
    384: [8, 6],
    387: [3, 43],
    392: [14, 2],
    396: [6, 11],
    400: [20, 0],
    405: [9, 5],
    414: [3, 46],
    416: [4, 26],
    423: [3, 47],
    425: [5, 17],
    432: [12, 3],
    441: [21, 0],
    448: [8, 7],
    450: [15, 2],
    459: [3, 51],
    464: [4, 29],
    468: [6, 13],
    475: [5, 19],
    477: [3, 53],
    480: [4, 30],
    484: [22, 0],
    486: [9, 6],
    490: [7, 10],
    495: [3, 55],
    496: [4, 31],
    500: [10, 5],
    504: [6, 14],
    507: [13, 3],
    512: [16, 2],
    513: [3, 57],
    522: [3, 58],
    525: [5, 21],
    528: [4, 33],
    529: [23, 0],
    531: [3, 59],
    539: [7, 11],
    540: [6, 15],
    544: [4, 34],
    549: [3, 61],
    550: [5, 22],
    558: [3, 62],
    560: [4, 35],
    567: [9, 7],
    575: [5, 23],
    576: [24, 0],
    578: [17, 2],
    588: [14, 3],
    592: [4, 37],
    600: [10, 6],
    605: [11, 5],
    608: [4, 38],
    612: [6, 17],
    624: [4, 39],
    625: [25, 0],
    637: [7, 13],
    640: [8, 10],
    648: [18, 2],
    650: [5, 26],
    656: [4, 41],
    672: [4, 42],
    675: [15, 3],
    676: [26, 0],
    684: [6, 19],
    686: [7, 14],
    688: [4, 43],
    700: [10, 7],
    704: [8, 11],
    720: [12, 5],
    722: [19, 2],
    725: [5, 29],
    726: [11, 6],
    729: [27, 0],
    735: [7, 15],
    736: [4, 46],
    750: [5, 30],
    752: [4, 47],
    756: [6, 21],
    768: [16, 3],
    775: [5, 31],
    784: [28, 0],
    792: [6, 22],
    800: [20, 2],
    810: [9, 10],
    816: [4, 51],
    825: [5, 33],
    828: [6, 23],
    832: [8, 13],
    833: [7, 17],
    841: [29, 0],
    845: [13, 5],
    847: [11, 7],
    848: [4, 53],
    850: [5, 34],
    864: [12, 6],
    867: [17, 3],
    875: [5, 35],
    880: [4, 55],
    882: [21, 2],
    891: [9, 11],
    896: [8, 14],
    900: [30, 0],
    912: [4, 57],
    925: [5, 37],
    928: [4, 58],
    931: [7, 19],
    936: [6, 26],
    944: [4, 59],
    950: [5, 38],
    960: [8, 15],
    961: [31, 0],
    968: [22, 2],
    972: [18, 3],
    975: [5, 39],
    976: [4, 61],
    980: [14, 5],
    992: [4, 62],
    1000: [10, 10],
    1008: [12, 7],
    1014: [13, 6],
    1024: [32, 0],
    1025: [5, 41],
    1029: [7, 21],
    1044: [6, 29],
    1050: [5, 42],
    1053: [9, 13],
    1058: [23, 2],
    1075: [5, 43],
    1078: [7, 22],
    1080: [6, 30],
    1083: [19, 3],
    1088: [8, 17],
    1089: [33, 0],
    1100: [10, 11],
    1116: [6, 31],
    1125: [15, 5],
    1127: [7, 23],
    1134: [9, 14],
    1150: [5, 46],
    1152: [24, 2],
    1156: [34, 0],
    1175: [5, 47],
    1176: [14, 6],
    1183: [13, 7],
    1188: [6, 33],
    1200: [20, 3],
    1210: [11, 10],
    1215: [9, 15],
    1216: [8, 19],
    1224: [6, 34],
    1225: [35, 0],
    1250: [25, 2],
    1260: [6, 35],
    1274: [7, 26],
    1275: [5, 51],
    1280: [16, 5],
    1296: [36, 0],
    1300: [10, 13],
    1323: [21, 3],
    1325: [5, 53],
    1331: [11, 11],
    1332: [6, 37],
    1344: [8, 21],
    1350: [15, 6],
    1352: [26, 2],
    1368: [6, 38],
    1369: [37, 0],
    1372: [14, 7],
    1375: [5, 55],
    1377: [9, 17],
    1400: [10, 14],
    1404: [6, 39],
    1408: [8, 22],
    1421: [7, 29],
    1425: [5, 57],
    1440: [12, 10],
    1444: [38, 0],
    1445: [17, 5],
    1450: [5, 58],
    1452: [22, 3],
    1458: [27, 2],
    1470: [7, 30],
    1472: [8, 23],
    1475: [5, 59],
    1476: [6, 41],
    1500: [10, 15],
    1512: [6, 42],
    1519: [7, 31],
    1521: [39, 0],
    1525: [5, 61],
    1536: [16, 6],
    1539: [9, 19],
    1548: [6, 43],
    1550: [5, 62],
    1568: [28, 2],
    1573: [11, 13],
    1575: [15, 7],
    1584: [12, 11],
    1587: [23, 3],
    1600: [40, 0],
    1617: [7, 33],
    1620: [18, 5],
    1656: [6, 46],
    1664: [8, 26],
    1666: [7, 34],
    1681: [41, 0],
    1682: [29, 2],
    1690: [13, 10],
    1692: [6, 47],
    1694: [11, 14],
    1700: [10, 17],
    1701: [9, 21],
    1715: [7, 35],
    1728: [24, 3],
    1734: [17, 6],
    1764: [42, 0],
    1782: [9, 22],
    1792: [16, 7],
    1800: [30, 2],
    1805: [19, 5],
    1813: [7, 37],
    1815: [11, 15],
    1836: [6, 51],
    1849: [43, 0],
    1856: [8, 29],
    1859: [13, 11],
    1862: [7, 38],
    1863: [9, 23],
    1872: [12, 13],
    1875: [25, 3],
    1900: [10, 19],
    1908: [6, 53],
    1911: [7, 39],
    1920: [8, 30],
    1922: [31, 2],
    1936: [44, 0],
    1944: [18, 6],
    1960: [14, 10],
    1980: [6, 55],
    1984: [8, 31],
    2000: [20, 5],
    2009: [7, 41],
    2016: [12, 14],
    2023: [17, 7],
    2025: [45, 0],
    2028: [26, 3],
    2048: [32, 2],
    2052: [6, 57],
    2057: [11, 17],
    2058: [7, 42],
    2088: [6, 58],
    2100: [10, 21],
    2106: [9, 26],
    2107: [7, 43],
    2112: [8, 33],
    2116: [46, 0],
    2124: [6, 59],
    2156: [14, 11],
    2160: [12, 15],
    2166: [19, 6],
    2176: [8, 34],
    2178: [33, 2],
    2187: [27, 3],
    2196: [6, 61],
    2197: [13, 13],
    2200: [10, 22],
    2205: [21, 5],
    2209: [47, 0],
    2232: [6, 62],
    2240: [8, 35],
    2250: [15, 10],
    2254: [7, 46],
    2268: [18, 7],
    2299: [11, 19],
    2300: [10, 23],
    2303: [7, 47],
    2304: [48, 0],
    2312: [34, 2],
    2349: [9, 29],
    2352: [28, 3],
    2366: [13, 14],
    2368: [8, 37],
    2400: [20, 6],
    2401: [49, 0],
    2420: [22, 5],
    2430: [9, 30],
    2432: [8, 38],
    2448: [12, 17],
    2450: [35, 2],
    2475: [15, 11],
    2496: [8, 39],
    2499: [7, 51],
    2500: [50, 0],
    2511: [9, 31],
    2523: [29, 3],
    2527: [19, 7],
    2535: [13, 15],
    2541: [11, 21],
    2548: [14, 13],
    2560: [16, 10],
    2592: [36, 2],
    2597: [7, 53],
    2600: [10, 26],
    2601: [51, 0],
    2624: [8, 41],
    2645: [23, 5],
    2646: [21, 6],
    2662: [11, 22],
    2673: [9, 33],
    2688: [8, 42],
    2695: [7, 55],
    2700: [30, 3],
    2704: [52, 0],
    2736: [12, 19],
    2738: [37, 2],
    2744: [14, 14],
    2752: [8, 43],
    2754: [9, 34],
    2783: [11, 23],
    2793: [7, 57],
    2800: [20, 7],
    2809: [53, 0],
    2816: [16, 11],
    2835: [9, 35],
    2842: [7, 58],
    2873: [13, 17],
    2880: [24, 5],
    2883: [31, 3],
    2888: [38, 2],
    2890: [17, 10],
    2891: [7, 59],
    2900: [10, 29],
    2904: [22, 6],
    2916: [54, 0],
    2925: [15, 13],
    2940: [14, 15],
    2944: [8, 46],
    2989: [7, 61],
    2997: [9, 37],
    3000: [10, 30],
    3008: [8, 47],
    3024: [12, 21],
    3025: [55, 0],
    3038: [7, 62],
    3042: [39, 2],
    3072: [32, 3],
    3078: [9, 38],
    3087: [21, 7],
    3100: [10, 31],
    3125: [25, 5],
    3136: [56, 0],
    3146: [11, 26],
    3150: [15, 14],
    3159: [9, 39],
    3168: [12, 22],
    3174: [23, 6],
    3179: [17, 11],
    3200: [40, 2],
    3211: [13, 19],
    3240: [18, 10],
    3249: [57, 0],
    3264: [8, 51],
    3267: [33, 3],
    3300: [10, 33],
    3312: [12, 23],
    3321: [9, 41],
    3328: [16, 13],
    3332: [14, 17],
    3362: [41, 2],
    3364: [58, 0],
    3375: [15, 15],
    3380: [26, 5],
    3388: [22, 7],
    3392: [8, 53],
    3400: [10, 34],
    3402: [9, 42],
    3456: [24, 6],
    3468: [34, 3],
    3481: [59, 0],
    3483: [9, 43],
    3500: [10, 35],
    3509: [11, 29],
    3520: [8, 55],
    3528: [42, 2],
    3549: [13, 21],
    3564: [18, 11],
    3584: [16, 14],
    3600: [60, 0],
    3610: [19, 10],
    3630: [11, 30],
    3645: [27, 5],
    3648: [8, 57],
    3675: [35, 3],
    3698: [43, 2],
    3700: [10, 37],
    3703: [23, 7],
    3712: [8, 58],
    3718: [13, 22],
    3721: [61, 0],
    3724: [14, 19],
    3726: [9, 46],
    3744: [12, 26],
    3750: [25, 6],
    3751: [11, 31],
    3757: [17, 13],
    3776: [8, 59],
    3800: [10, 38],
    3807: [9, 47],
    3825: [15, 17],
    3840: [16, 15],
    3844: [62, 0],
    3872: [44, 2],
    3887: [13, 23],
    3888: [36, 3],
    3900: [10, 39],
    3904: [8, 61],
    3920: [28, 5],
    3968: [8, 62],
    3969: [63, 0],
    3971: [19, 11],
    3993: [11, 33],
    4000: [20, 10],
    4032: [24, 7],
    4046: [17, 14],
    4050: [45, 2],
    4056: [26, 6],
  },
  3: {
    8: [2, 0],
    16: [2, 2],
    24: [2, 3],
    27: [3, 0],
    32: [2, 4],
    40: [2, 5],
    48: [2, 6],
    54: [3, 2],
    56: [2, 7],
    64: [4, 0],
    72: [2, 9],
    80: [2, 10],
    81: [3, 3],
    88: [2, 11],
    96: [2, 12],
    104: [2, 13],
    108: [3, 4],
    112: [2, 14],
    125: [5, 0],
    128: [4, 2],
    135: [3, 5],
    162: [3, 6],
    189: [3, 7],
    192: [4, 3],
    216: [6, 0],
    243: [3, 9],
    250: [5, 2],
    256: [4, 4],
    270: [3, 10],
    297: [3, 11],
    320: [4, 5],
    324: [3, 12],
    343: [7, 0],
    351: [3, 13],
    375: [5, 3],
    378: [3, 14],
    384: [4, 6],
    432: [6, 2],
    448: [4, 7],
    500: [5, 4],
    512: [8, 0],
    576: [4, 9],
    625: [5, 5],
    640: [4, 10],
    648: [6, 3],
    686: [7, 2],
    704: [4, 11],
    729: [9, 0],
    750: [5, 6],
    768: [4, 12],
    832: [4, 13],
    864: [6, 4],
    875: [5, 7],
    896: [4, 14],
    1000: [10, 0],
    1024: [8, 2],
    1029: [7, 3],
    1080: [6, 5],
    1125: [5, 9],
    1250: [5, 10],
    1296: [6, 6],
    1331: [11, 0],
    1372: [7, 4],
    1375: [5, 11],
    1458: [9, 2],
    1500: [5, 12],
    1512: [6, 7],
    1536: [8, 3],
    1625: [5, 13],
    1715: [7, 5],
    1728: [12, 0],
    1750: [5, 14],
    1944: [6, 9],
    2000: [10, 2],
    2048: [8, 4],
    2058: [7, 6],
    2160: [6, 10],
    2187: [9, 3],
    2197: [13, 0],
    2376: [6, 11],
    2401: [7, 7],
    2560: [8, 5],
    2592: [6, 12],
    2662: [11, 2],
    2744: [14, 0],
    2808: [6, 13],
    2916: [9, 4],
    3000: [10, 3],
    3024: [6, 14],
    3072: [8, 6],
    3087: [7, 9],
    3430: [7, 10],
    3456: [12, 2],
    3584: [8, 7],
    3645: [9, 5],
    3773: [7, 11],
    3993: [11, 3],
    4000: [10, 4],
  },
  4: {
    16: [2, 0],
    32: [2, 2],
    48: [2, 3],
    64: [2, 4],
    80: [2, 5],
    81: [3, 0],
    96: [2, 6],
    112: [2, 7],
    162: [3, 2],
    243: [3, 3],
    256: [4, 0],
    324: [3, 4],
    405: [3, 5],
    486: [3, 6],
    512: [4, 2],
    567: [3, 7],
    625: [5, 0],
    768: [4, 3],
    1024: [4, 4],
    1250: [5, 2],
    1280: [4, 5],
    1296: [6, 0],
    1536: [4, 6],
    1792: [4, 7],
    1875: [5, 3],
    2401: [7, 0],
    2500: [5, 4],
    2592: [6, 2],
    3125: [5, 5],
    3750: [5, 6],
    3888: [6, 3],
  },
  5: {
    32: [2, 0],
    64: [2, 2],
    96: [2, 3],
    128: [2, 4],
    243: [3, 0],
    486: [3, 2],
    729: [3, 3],
    972: [3, 4],
    1024: [4, 0],
    2048: [4, 2],
    3072: [4, 3],
  },
  6: { 64: [2, 0], 128: [2, 2] },
  7: { 128: [2, 0], 256: [2, 2] },
}
const NODE_TWO = Node.Creator.constant(2)
function _factorRadicandNode(radicand, exponent) {
  let rv = null
  let p = null
  let q = null
  exponent = exponent || NODE_TWO
  if (Node.Type.isConstant(radicand) && nthRootLUT[exponent.value]) {
    const entryLUT = nthRootLUT[exponent.value][radicand.value]
    if (entryLUT) {
      // Use lookup table for common radicands e.g. sqrt(8) -> 2 sqrt(2)
      p = entryLUT[0]
      q = entryLUT[1]
    }
    else {
      // General algorithm.
      // Try to convert into form: p sqrt(q).
      const value = radicand.value
      const nMax = Math.floor(Math.sqrt(value))
      // Possible improvement: Use factorization.
      for (let n = nMax; n > 1; n--) {
        const nToExp = n ** exponent.value
        if ((value % nToExp) === 0) {
          p = n
          q = value / nToExp
          break
        }
      }
    }
  }
  if (p) {
    rv = {
      p,
      q,
      pNode: Node.Creator.constant(p),
    }
    if (q && (q !== 1)) {
      // p * nthRoot(q, exponent)
      rv.qNode = Node.Creator.constant(q)
      rv.p2Node = Node.Creator.operator('^', [rv.pNode, exponent])
      rv.p2qNode = Node.Creator.operator('*', [rv.p2Node, rv.qNode], false)
      rv.sqrtP2qNode = Node.Creator.nthRoot(rv.p2qNode, exponent)
      rv.sqrtQNode = Node.Creator.nthRoot(rv.qNode, exponent)
    }
  }
  return rv
}
function _buildResultNode(pNode, args, argIdx, qNode, expNode) {
  let rv = null
  // p * sqrt(... a * b * q * d * e * ...)
  // Clone original args.
  const newArgs = args.slice(0)
  if (qNode) {
    // Replace one arg by qNode.
    newArgs[argIdx] = qNode
  }
  else {
    // qNode is null - just remove original arg.
    newArgs.splice(argIdx, 1)
  }
  if (newArgs.length > 0) {
    // Wrap args into product: ... * a * b * q * d * e * ...
    const newArgsProduct = newArgs.length > 1
    // sqrt(a*b*c*d*...) -> sqrt(c) * sqrt(a*b*d*...)
      ? Node.Creator.operator('*', newArgs, false)
    // sqrt(x*y) -> sqrt(x) * sqrt(y)
      : newArgs[0]
    // Build right node: sqrt(... * a * b * q * d * e * ...)
    const sqrtRightNode = Node.Creator.nthRoot(newArgsProduct, expNode)
    if (pNode) {
      // Build result node: p * sqrt(... a * b * q * d * e * ...)
      rv = Node.Creator.operator('*', [pNode, sqrtRightNode], true)
    }
    else {
      // Build result node: sqrt(... a * b * q * d * e * ...)
      rv = sqrtRightNode
    }
  }
  else {
    // Perfect match - whole sqrt gone away.
    rv = pNode
  }
  return rv
}
function _collectFactors(rv, node) {
  if (node.op === '*') {
    node.args.forEach((oneArg) => {
      _collectFactors(rv, oneArg)
    })
  }
  else {
    rv.push(node)
  }
  return rv
}
function sqrtFromConstant(node) {
  let rv = null
  if (Node.Type.isNthRoot(node)) {
    const baseNode = node.args[0]
    const expNode = node.args[1] || NODE_TWO
    if (Node.Type.isOperator(baseNode, '/')) {
      // sqrt(x/y)
      // Possible improvement: optimize it.
      const sqrtX = Node.Creator.nthRoot(baseNode.args[0], expNode)
      const sqrtY = Node.Creator.nthRoot(baseNode.args[1], expNode)
      if (sqrtFromConstant(sqrtX) || sqrtFromConstant(sqrtY)) {
        // sqrt(x/y) gives sqrt(x) / sqrt(y)
        const newNode = Node.Creator.operator('/', [sqrtX, sqrtY])
        rv = {
          changeType: ChangeTypes.KEMU_ROOT_FROM_FRACTION,
          rootNode: newNode,
        }
      }
    }
    else {
      // sqrt(...)
      const args = _collectFactors([], node.args[0])
      for (const argIdx in args) {
        const oneFactor = args[argIdx]
        const factorResult = _factorRadicandNode(oneFactor, expNode)
        if (factorResult) {
          // Breakable factor found.
          // Clone original args.
          const pNode = factorResult.pNode
          const qNode = factorResult.qNode
          if (qNode) {
            // Non-perfect match: sqrt(x) -> p sqrt(q)
            // Step I: sqrt(p^2 * q)
            const stepNode1 = _buildResultNode(null, args, argIdx, factorResult.p2qNode, expNode)
            // Step II: p sqrt(q)
            const stepNode2 = _buildResultNode(pNode, args, argIdx, qNode, expNode)
            // Prepare substeps.
            const substeps = [
              { changeType: ChangeTypes.KEMU_FACTOR_EXPRESSION_UNDER_ROOT, rootNode: stepNode1 },
              { changeType: ChangeTypes.KEMU_SQRT_FROM_POW, rootNode: stepNode2 },
            ]
            // Final result.
            rv = {
              changeType: ChangeTypes.KEMU_SQRT_FROM_CONST,
              rootNode: stepNode2,
              substeps,
            }
          }
          else {
            // Perfect match: sqrt(x) -> p
            const newNode = _buildResultNode(pNode, args, argIdx, null, expNode)
            rv = {
              changeType: ChangeTypes.KEMU_ROOT_FROM_CONST,
              rootNode: newNode,
            }
          }
          // Move out one breakable factor at one time.
          // Don't go on anymore in current call.
          break
        }
      }
    }
  }
  return rv
}
export default sqrtFromConstant
