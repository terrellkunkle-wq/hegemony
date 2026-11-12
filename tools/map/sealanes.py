import json, gzip, math, heapq, numpy as np
from PIL import Image
from scipy import ndimage
g = json.load(open('../../data/gamedata.json'))
ids = np.frombuffer(gzip.open('../../data/tiles.bin.gz').read(), dtype='<u2').reshape(2048, 4096)
wat = np.array(Image.open('../../data/tex/t_water_4k.png').convert('L')) > 128
F = 4; H, W = 2048 // F, 4096 // F
blk = wat.reshape(H, F, W, F)
cw = blk.any(axis=(1, 3))                                   # eau grossière : détroits maintenus ouverts
lab, n = ndimage.label(cw, structure=np.ones((3, 3)))
size = ndimage.sum(cw, lab, range(1, n + 1))
big = np.zeros(n + 1, bool); big[1:] = size >= 30           # écarte les petits lacs
sea = big[lab]
# côtes : tuiles terrestres présentes dans un bloc d’eau ou voisin
cities = g['cities']; tiles = g['tiles']; NC = len(cities)
tcity = np.array([0] + [t[1] for t in tiles])
land_ids = ids.reshape(H, F, W, F)
lat = 90 - (np.arange(H) + .5) / H * 180
def gc(lo1, la1, lo2, la2):
    p1, p2 = math.radians(la1), math.radians(la2); dl = math.radians(lo2 - lo1)
    return 6371 * math.acos(max(-1, min(1, math.sin(p1) * math.sin(p2) + math.cos(p1) * math.cos(p2) * math.cos(dl))))
seeds = {}
for y in range(H):
    for x in range(W):
        if not sea[y, x]: continue
        ts = set()
        for dy in (-1, 0, 1):
            yy = y + dy
            if yy < 0 or yy >= H: continue
            for dx in (-1, 0, 1):
                xx = (x + dx) % W
                b = land_ids[yy, :, xx, :]; ts.update(int(v) for v in np.unique(b[b > 0]))
        for t in ts:
            ci = int(tcity[t])
            if cities[ci][6] and gc(cities[ci][2], cities[ci][3], (x + .5) / W * 360 - 180, lat[y]) <= 320: seeds.setdefault(ci, set()).add((y, x))
lat = 90 - (np.arange(H) + .5) / H * 180; cell = 40030 / W  # km par cellule à l’équateur
def bfs(src, lim=950):
    D = {}; h = []
    for s in src: D[s] = 0; heapq.heappush(h, (0, s))
    while h:
        d, (y, x) = heapq.heappop(h)
        if d > D.get((y, x), 1e9) or d > lim: continue
        cx = cell * max(.05, math.cos(math.radians(lat[y])))
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)):
            yy = y + dy
            if yy < 0 or yy >= H: continue
            xx = (x + dx) % W
            if not sea[yy, xx]: continue
            nd = d + math.hypot(dx * cx, dy * cell)
            if nd < D.get((yy, xx), 1e9): D[(yy, xx)] = nd; heapq.heappush(h, (nd, (yy, xx)))
    return D
owner = {}
for ci, ss in seeds.items():
    for s in ss: owner.setdefault(s, []).append(ci)
have = {(min(e[0], e[1]), max(e[0], e[1])) for e in g['edges'] if e[2]}
out = {}
for ci, ss in seeds.items():
    D = bfs(ss); best = {}
    for c2, d in D.items():
        for cj in owner.get(c2, ()):
            if cj != ci and d < best.get(cj, 1e9): best[cj] = d
    for cj, d in sorted(best.items(), key=lambda kv: kv[1])[:7]:
        k = (min(ci, cj), max(ci, cj))
        if k in have: continue
        dd = round(max(d + 30, gc(cities[ci][2], cities[ci][3], cities[cj][2], cities[cj][3]) * 1.05, 40))
        if k not in out or dd < out[k]: out[k] = dd
g['sea2'] = [[a, b, d] for (a, b), d in out.items()]
json.dump(g, open('../../data/gamedata.json', 'w'), separators=(',', ':'), ensure_ascii=False)
nm = lambda i: cities[i][0]
print('villes côtières avec accès à la mer', len(seeds), '/', sum(1 for c in cities if c[6]), '— nouvelles routes', len(out))
for a in ['Marseille', 'Nice', 'Bordeaux', 'Nantes', 'Paris', 'Barranquilla', 'Guayaquil', 'Londres', 'Istanbul', 'Bakou', 'Panama']:
    i = next((k for k, c in enumerate(cities) if c[0] == a), None)
    if i is None: continue
    print(a, sorted([(nm(b if a_ == i else a_), d) for a_, b, d in g['sea2'] if i in (a_, b)], key=lambda x: x[1])[:7])
