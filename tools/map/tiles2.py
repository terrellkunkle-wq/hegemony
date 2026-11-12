import json, gzip, math, numpy as np
from PIL import Image
from scipy import ndimage as nd
W, H = 4096, 2048
ids = np.load('ids.npy'); CR = np.load('CR.npy'); tile_c = json.load(open('tile_country.json'))
world = json.load(open('world.json')); meta = world['meta']; cities = world['cities']
NT = len(tile_c)  # index 0 = vide
NT0 = NT

# ---- v4 : villes polaires et sibériennes, bases antarctiques --------------------
ix = {m['a']: i for i, m in enumerate(meta) if m['a']}
# [nom, pays, lon, lat, pop (milliers), drapeau]  drapeau : 1 = port d'origine, 2 = base antarctique
EXTRA = [
 ['Anchorage','USA',-149.90,61.22,291,1], ['Fairbanks','USA',-147.72,64.84,32,0], ['Juneau','USA',-134.42,58.30,32,0], ['Nome','USA',-165.41,64.50,6,0], ['Utqiaġvik','USA',-156.79,71.29,5,1],
 ['Iakoutsk','RUS',129.73,62.03,311,0], ['Magadan','RUS',150.80,59.56,92,1], ['Petropavlovsk-Kamtchatski','RUS',158.65,53.02,180,1], ['Bratsk','RUS',101.63,56.15,226,0], ['Mirny','RUS',113.96,62.54,35,0],
 ['Oulan-Oudé','RUS',107.60,51.83,430,0], ['Blagovechtchensk','RUS',127.54,50.27,225,0], ['Nijnevartovsk','RUS',76.56,60.94,275,0], ['Okhotsk','RUS',143.20,59.36,5,1], ['Tomsk','RUS',84.97,56.50,570,0],
 ['Norilsk','RUS',88.20,69.35,175,0], ['Tiksi','RUS',128.87,71.64,5,1], ['Pevek','RUS',170.31,69.70,5,1], ['Dikson','RUS',80.55,73.51,5,1],
 ['Base McMurdo','USA',166.67,-77.85,5,2], ['Base Vostok','RUS',106.84,-78.46,5,2], ['Base Dumont-d’Urville','FRA',140.00,-66.66,5,2], ['Base Concordia','ITA',123.33,-75.10,5,2], ['Base Halley','GBR',-25.50,-75.57,5,2],
 ['Base Zhongshan','CHN',76.37,-69.37,5,2], ['Base Showa','JPN',39.58,-69.00,5,2], ['Base Neumayer','DEU',-8.27,-70.67,5,2], ['Base Marambio','ARG',-56.63,-64.24,5,2], ['Base Casey','AUS',110.53,-66.28,5,2]]
EXTRA += json.load(open('v6/extra6.json'))  # v6 : régions vides + villes refuges (drapeau 4)
names = {c[0] for c in cities}
cflag = {}
for e in EXTRA:
    assert e[0] not in names, e[0]
    cflag[len(cities)] = e[5] or 3; cities.append([e[0], ix[e[1]], e[2], e[3], e[4], 0])
# tuiles antarctiques : diagramme de Voronoï sphérique autour des bases et de germes réguliers
_wat = np.array(Image.open('../../data/tex/t_water_4k.png').convert('L')) > 128
_lat = 90 - (np.arange(H) + .5) / H * 180; _lon = (np.arange(W) + .5) / W * 360 - 180
def _v(lo, la): lo = np.radians(lo); la = np.radians(la); return np.stack([np.cos(la) * np.cos(lo), np.cos(la) * np.sin(lo), np.sin(la)], -1)
bases = [(i, c) for i, c in enumerate(cities) if cflag.get(i) == 2]
seeds = [(c[2], c[3], c[1]) for i, c in bases]
BV = _v(np.array([s[0] for s in seeds]), np.array([s[1] for s in seeds]))
k = 0
for la in (-66.5, -70, -73.5, -77, -80.5, -84, -87.5):
    n = max(3, int(round(22 * math.cos(math.radians(la)) / math.cos(math.radians(66.5)))))
    for j in range(n):
        lo = -180 + (j + (k % 2) * .5) * 360 / n; v = _v(np.array(lo), np.array(la))
        if (BV @ v).max() > math.cos(math.radians(3.5)): continue
        seeds.append((lo, la, seeds[int(np.argmax(BV @ v))][2]))
    k += 1
SV = _v(np.array([s[0] for s in seeds]), np.array([s[1] for s in seeds]))
y0 = int((90 + 60) / 180 * H)
for y in range(y0, H):
    m = (~_wat[y]) & (ids[y] == 0)
    if not m.any(): continue
    pv = _v(_lon[m], np.full(m.sum(), _lat[y])); ids[y, m] = NT + np.argmax(pv @ SV.T, 1)
used = np.unique(ids[ids >= NT]); remap = {int(u): NT + i for i, u in enumerate(used)}
lut = np.arange(ids.max() + 1); 
for u, v in remap.items(): lut[u] = v
ids = lut[ids]
tile_c = tile_c + [seeds[int(u) - NT][2] + 1 for u in used]
print('tuiles antarctiques', len(used), 'villes ajoutées', len(EXTRA))
NT = len(tile_c)
elev = np.array(Image.open('../../data/tex/t_elev_bump_4k.jpg').convert('L')).astype(np.float32)
elev = np.maximum(0, elev - 24) * 31
water = np.array(Image.open('../../data/tex/t_water_4k.png').convert('L')) > 128
bm = np.array(Image.open('../../data/tex/earth-blue-marble.jpg').convert('RGB')).astype(np.float32)
lat = 90 - (np.arange(H) + .5) / H * 180; lon = (np.arange(W) + .5) / W * 360 - 180
LAT = np.repeat(lat[:, None], W, 1); cosl = np.cos(np.radians(LAT))
idx = np.arange(NT)
flat = ids.ravel()
pix = np.bincount(flat, minlength=NT).astype(float)
area = np.bincount(flat, weights=(cosl * (40075 / W) * (20004 / H)).ravel(), minlength=NT)
# centroïdes (vecteurs 3D pour gérer l’antiméridien)
LONr = np.radians(np.repeat(lon[None, :], H, 0)); LATr = np.radians(LAT)
X = np.bincount(flat, (np.cos(LATr) * np.cos(LONr)).ravel(), NT); Y = np.bincount(flat, (np.cos(LATr) * np.sin(LONr)).ravel(), NT); Z = np.bincount(flat, np.sin(LATr).ravel(), NT)
clon = np.degrees(np.arctan2(Y, X)); clat = np.degrees(np.arctan2(Z, np.hypot(X, Y)))
# couleur moyenne (hors eau), altitude
land = ~water
wl = land.ravel().astype(float)
nland = np.bincount(flat, wl, NT) + 1e-9
mc = [np.bincount(flat, (bm[..., k] * land).ravel(), NT) / nland for k in range(3)]
emean = np.bincount(flat, (elev * land).ravel(), NT) / nland
# dispersion d’altitude par tuile : percentiles via tri
order = np.argsort(flat, kind='stable'); fs = flat[order]; es = elev.ravel()[order]
starts = np.searchsorted(fs, idx); ends = np.searchsorted(fs, idx, 'right')
p90 = np.zeros(NT); p10 = np.zeros(NT)
for t in range(1, NT):
    a, b = starts[t], ends[t]
    if b > a: v = np.sort(es[a:b]); p90[t] = v[int((b - a - 1) * .9)]; p10[t] = v[int((b - a - 1) * .1)]
# côtier : tuile touchant l’eau
wd = nd.binary_dilation(water, iterations=2)
coast = np.bincount(flat, (wd & (ids > 0)).ravel().astype(float), NT) > 0
def biome(t):
    r, g, b = mc[0][t], mc[1][t], mc[2][t]; v = (r + g + b) / 3; rg = r / max(g, 1); al = abs(clat[t])
    if al > 66 or (al > 45 and v > 170) or (v > 200): return 'toundra'
    if al >= 50: return 'taiga' if (v > 90 or rg < 1) else ('steppe' if rg > 1.12 else 'plaine')
    if (v > 130 and rg > 1.12) or (rg > 1.35 and v > 75): return 'desert'
    if al < 20 and rg < .86 and v < 48: return 'jungle'
    if al < 25 and rg >= .95: return 'savane'
    if rg >= 1.12 and v >= 70: return 'steppe'
    if rg < .97 and v < 58: return 'foret'
    return 'plaine'
def relief(t):
    rg = p90[t] - p10[t]; hi = p90[t]
    if t >= NT0: hi = 0  # inlandsis : seul le dénivelé compte
    if hi > 2200 or rg > 1800: return 3
    if hi > 1100 or rg > 800: return 2
    if hi > 450 or rg > 300: return 1
    return 0
B = ['plaine', 'steppe', 'savane', 'desert', 'foret', 'taiga', 'jungle', 'toundra']
bio = [None] + [biome(t) for t in range(1, NT)]; rel = [0] + [relief(t) for t in range(1, NT)]
# ressource (à la RoN), déterministe
def res(t):
    h = (t * 2654435761) % 1000 / 1000; b = bio[t]; r = rel[t]
    if h >= .965: return 'uranium'
    if h >= .88 and b in ('plaine', 'foret', 'taiga', 'steppe'): return 'charbon'
    if h < .05: return 'rare'
    if b in ('desert', 'steppe') and h < .42: return 'petrole'
    if b in ('toundra', 'taiga') and h < .3: return 'gaz'
    if r >= 2 and h < .55: return 'minerai'
    if b in ('foret', 'taiga', 'jungle') and h < .6: return 'bois'
    if b in ('plaine', 'savane') and h < .55: return 'cereales'
    if h < .2: return 'minerai'
    return ''
rs = [''] + [res(t) for t in range(1, NT)]
# ---- rattachement tuile -> ville (plus proche ville du même pays)
def v3(lo, la): lo, la = math.radians(lo), math.radians(la); return np.array([math.cos(la) * math.cos(lo), math.cos(la) * math.sin(lo), math.sin(la)])
CV = np.array([v3(c[2], c[3]) for c in cities]); TV = np.stack([np.cos(np.radians(clat)) * np.cos(np.radians(clon)), np.cos(np.radians(clat)) * np.sin(np.radians(clon)), np.sin(np.radians(clat))], 1)
byc = {}
for i, c in enumerate(cities): byc.setdefault(c[1], []).append(i)
tcity = [-1] * NT
for t in range(1, NT):
    L = [i for i in byc[tile_c[t] - 1] if (cflag.get(i) == 2) == (t >= NT0)]; d = CV[L] @ TV[t]; tcity[t] = L[int(np.argmax(d))]
# tuile de chaque ville (pixel de la ville) ; si dans l’eau/autre pays, tuile rattachée la plus proche
ccell = []
for i, c in enumerate(cities):
    x = int((c[2] + 180) / 360 * W) % W; y = min(H - 1, int((90 - c[3]) / 180 * H)); t = int(ids[y, x])
    if t == 0 or tcity[t] != i:
        own = [u for u in range(1, NT) if tcity[u] == i]
        if own: t = own[int(np.argmax(TV[own] @ CV[i]))]
        else:  # aucune tuile : on lui attribue la tuile la plus proche de son pays
            own = [u for u in range(1, NT) if tile_c[u] - 1 == c[1]]; t = own[int(np.argmax(TV[own] @ CV[i]))]
    ccell.append(t)
for i, t in enumerate(ccell):
    if t and not any(tcity[u] == i for u in range(1, NT)) and (cflag.get(i) == 2) == (t >= NT0): tcity[t] = i
cnt_ = [0] * len(cities)
for u in range(1, NT): cnt_[tcity[u]] += 1
for i, c in enumerate(cities):
    if cnt_[i]: continue
    own = [u for u in range(1, NT) if tile_c[u] - 1 == c[1] and cnt_[tcity[u]] >= 2 and (cflag.get(i) == 2) == (u >= NT0)]
    if not own: continue
    u = own[int(np.argmax(TV[own] @ CV[i]))]; cnt_[tcity[u]] -= 1; tcity[u] = i; cnt_[i] = 1; ccell[i] = u
# ---- adjacences des tuiles
a = ids[:, :-1].ravel(); b = ids[:, 1:].ravel(); m = (a != b) & (a > 0) & (b > 0)
a2 = ids[:-1, :].ravel(); b2 = ids[1:, :].ravel(); m2 = (a2 != b2) & (a2 > 0) & (b2 > 0)
wa = ids[:, -1]; wb = ids[:, 0]; m3 = (wa != wb) & (wa > 0) & (wb > 0)
A = np.concatenate([a[m], a2[m2], wa[m3]]); Bb = np.concatenate([b[m], b2[m2], wb[m3]])
lo_, hi_ = np.minimum(A, Bb), np.maximum(A, Bb); pk = lo_.astype(np.int64) * 100000 + hi_
up, cnt = np.unique(pk, return_counts=True)
tadj = [(int(k // 100000), int(k % 100000), int(c)) for k, c in zip(up, cnt)]
# ---- liaisons entre villes : terrestres par tuiles voisines, maritimes entre villes côtières
def dkm(i, j): return 6371 * math.acos(max(-1, min(1, float(CV[i] @ CV[j]))))
edges = {}
for ta, tb, c in tadj:
    ca, cb = tcity[ta], tcity[tb]
    if ca == cb or c < 2: continue
    k = (min(ca, cb), max(ca, cb)); edges[k] = (0, round(dkm(ca, cb)))
ccoast = [False] * len(cities)
for t in range(1, NT):
    if coast[t]: ccoast[tcity[t]] = True
def seafrac(i, j):
    s = 0
    for f in (.15, .3, .45, .6, .75, .9):
        v = CV[i] * (1 - f) + CV[j] * f; v /= np.linalg.norm(v); la = math.degrees(math.asin(v[2])); lo = math.degrees(math.atan2(v[1], v[0]))
        s += water[min(H - 1, int((90 - la) / 180 * H)), int((lo + 180) / 360 * W) % W]
    return s / 6
coastal = [i for i in range(len(cities)) if ccoast[i]]
for i in coastal:
    cand = sorted(((dkm(i, j), j) for j in coastal if j != i), key=lambda x: x[0])
    k = 0
    for d, j in cand:
        if d > 2600 or k >= 3: break
        key = (min(i, j), max(i, j))
        if key in edges: continue
        if d > 120 and seafrac(i, j) >= .65: edges[key] = (1, round(d)); k += 1
# connexité intra-pays et globale
par = list(range(len(cities)))
def f(x):
    while par[x] != x: par[x] = par[par[x]]; x = par[x]
    return x
for (i, j) in edges: par[f(i)] = f(j)
for c, L in byc.items():
    while len({f(i) for i in L}) > 1:
        r0 = f(L[0]); best = None
        for i in L:
            for j in L:
                if f(i) == r0 and f(j) != r0:
                    d = dkm(i, j)
                    if best is None or d < best[0]: best = (d, i, j)
        d, i, j = best; edges[(min(i, j), max(i, j))] = (1 if seafrac(i, j) >= .5 else 0, round(d)); par[f(i)] = f(j)
while len({f(i) for i in range(len(cities))}) > 1:
    r0 = f(0); A_ = [i for i in range(len(cities)) if f(i) == r0]; Bc = [i for i in range(len(cities)) if f(i) != r0]
    M = CV[A_] @ CV[Bc].T; k = np.unravel_index(np.argmax(M), M.shape); i, j = A_[k[0]], Bc[k[1]]
    edges[(min(i, j), max(i, j))] = (1, round(dkm(i, j))); par[f(i)] = f(j)
print('tuiles', NT - 1, 'liaisons', len(edges), 'maritimes', sum(1 for v in edges.values() if v[0]), 'villes côtières', sum(ccoast))
from collections import Counter
print('biomes', Counter(bio[1:])); print('relief', Counter(rel[1:])); print('ressources', Counter(rs[1:]))
out = {
 'tiles': [[tile_c[t] - 1, tcity[t], round(float(clon[t]), 2), round(float(clat[t]), 2), round(float(area[t])), B.index(bio[t]), rel[t], round(float(emean[t])), rs[t], 1 if coast[t] else 0] for t in range(1, NT)],
 'cities': [c + [1 if (ccoast[i] or cflag.get(i) == 1) else 0, ccell[i], cflag.get(i, 0)] for i, c in enumerate(cities)],
 'edges': [[i, j, k, d] for (i, j), (k, d) in edges.items()],
 'tadj': [[a_, b_] for a_, b_, c in tadj if c >= 2], 'meta': meta}
json.dump(out, open('gamedata.json', 'w'), ensure_ascii=False)
open('tiles.bin.gz', 'wb').write(gzip.compress(ids.astype('<u2').tobytes(), 9))
import os; print('gamedata', os.path.getsize('gamedata.json') // 1024, 'Ko  tiles.gz', os.path.getsize('tiles.bin.gz') // 1024, 'Ko')
# contrôles
cn = {m['n']: i for i, m in enumerate(meta)}
for n in ['France', 'Russie', 'Égypte', 'Brésil', 'Chine', 'Suisse', 'Népal', 'Mongolie', 'Kazakhstan', 'Canada', 'Australie', 'Niger', 'Indonésie']:
    if n not in cn: print('?', n); continue
    T_ = [t for t in range(1, NT) if tile_c[t] - 1 == cn[n]]
    print(n, len(T_), 'tuiles', Counter(bio[t] for t in T_).most_common(3), Counter(rel[t] for t in T_).most_common(4))
