import json, numpy as np, math
g = json.load(open('../../data/gamedata.json'))
ids = np.load('../../data/ids_final.npy') if False else None
import gzip
raw = gzip.open('../../data/tiles.bin.gz').read(); T = np.frombuffer(raw, dtype='<u2').reshape(2048, 4096)
R = json.load(open('../../data/raw/rivers.geojson'))
cnt = {}; lines = []
for f in R['features']:
    p = f['properties']; sr = p.get('scalerank', 9)
    if p.get('featurecla', '').lower().startswith('lake'): pass
    geo = f['geometry']
    if not geo: continue
    parts = [geo['coordinates']] if geo['type'] == 'LineString' else geo['coordinates']
    for L in parts:
        if sr > 6: continue
        prev = None; out = []
        for lon, lat in [(c[0], c[1]) for c in L]:
            if prev:
                n = max(1, int(max(abs(lon - prev[0]), abs(lat - prev[1])) / .05))
                for k in range(1, n + 1):
                    x = prev[0] + (lon - prev[0]) * k / n; y = prev[1] + (lat - prev[1]) * k / n
                    t = int(T[min(2047, int((90 - y) / 180 * 2048)), int((x + 180) / 360 * 4096) % 4096])
                    if t: cnt[t] = cnt.get(t, 0) + 1
            if not out or abs(lon - out[-2]) + abs(lat - out[-1]) > .35: out += [round(lon, 2), round(lat, 2)]
            prev = (lon, lat)
        if out[-2:] != [round(prev[0], 2), round(prev[1], 2)]: out += [round(prev[0], 2), round(prev[1], 2)]
        if sr <= 5 and len(out) >= 4: lines.append(out)
riv = sorted(t - 1 for t, c in cnt.items() if c >= 12)
g['riv'] = riv; g['rivers'] = lines
json.dump(g, open('../../data/gamedata.json', 'w'), separators=(',', ':'), ensure_ascii=False)
print('tuiles fluviales', len(riv), 'polylignes', len(lines), 'points', sum(len(l) for l in lines) // 2)
