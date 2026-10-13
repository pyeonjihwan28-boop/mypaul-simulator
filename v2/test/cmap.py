#!/usr/bin/env python3
# 전 판 복셀(classic-vox.json) → 새 판 블록 표(src/world/gen/classic-campus.json)
#   칸마다 재질 종류(class) → 블록 키 · 모양(온블록 / 반블록) 으로 바꾸고, 범위 안을 RLE 로 묶어요.
import json, sys, os
from collections import Counter
SP = '/tmp/claude-0/-home-claude-mypaul-simulator/b1595000-bb9f-5cb7-a0c0-a65bcc6c9735/scratchpad'
d = json.load(open(f'{SP}/classic-vox.json'))
V = d['vox']
FULL, SLAB_BOTTOM, SLAB_TOP, HALF_XN, HALF_XP, HALF_ZN, HALF_ZP = range(7)
G = 8  # 첫 공기 칸
# ---- 종류 → 블록 ----
WALLISH = {'plaster': 'SCHOOL_WALL', 'ext': 'SCHOOL_WALL', 'panel': 'SCHOOL_WALL', 'board': 'WHITEBOARD', 'white': 'PAINT_WHITE', 'whiteGloss': 'PAINT_WHITE', 'busWhite': 'PAINT_WHITE',
           'extBand': 'SCHOOL_BAND', 'extBase': 'WALL_GRAY', 'dorm': 'DORM_WALL', 'orange': 'ORANGE_WALL', 'ceiling': 'CEILING', 'slab': 'CONCRETE', 'roof': 'ROOF_GRAY', 'redRoof': 'ROOF_RED',
           'oak': 'PLANKS', 'wood': 'PLANKS', 'walnut': 'WOOD_DARK', 'pew': 'WOOD_DARK', 'cork': 'PLANKS', 'pot': 'BRICK',
           'metal': 'FENCE_WHITE', 'darkMetal': 'IRON', 'alu': 'IRON', 'black': 'TILE_DARK', 'rubber': 'TILE_DARK', 'screen': 'TILE_DARK', 'bus': 'TILE_DARK', 'carGlass': 'WINDOW',
           'red': 'PAINT_RED', 'hammock': 'PAINT_RED', 'green': 'LEAVES', 'umbrella': 'LEAVES', 'leafDark': 'LEAVES', 'plant': 'LEAVES', 'yellow': 'PAINT_YELLOW', 'blue': 'PAINT_BLUE', 'fabricBlue': 'PAINT_BLUE', 'fabric': 'TILE_DARK',
           'glass': 'WINDOW', 'dormglass': 'WINDOW', 'acrylic': 'WINDOW', 'led': 'LAMP_HEAD', 'rope': 'PLANKS', 'line': 'PAINT_WHITE',
           'floor': 'FLOOR_TILE', 'laminate': 'WOOD_FLOOR', 'dirt': 'SAND', 'grass': 'GRASS', 'turf': 'GRASS', 'asphalt': 'ASPHALT', 'concrete': 'SIDEWALK', 'court': 'COURT'}
def hsv(r, g, b):
    r, g, b = r / 255, g / 255, b / 255
    mx, mn = max(r, g, b), min(r, g, b); v = mx; s = 0 if mx == 0 else (mx - mn) / mx
    if mx == mn: h = 0
    elif mx == r: h = (60 * ((g - b) / (mx - mn)) + 360) % 360
    elif mx == g: h = 60 * ((b - r) / (mx - mn)) + 120
    else: h = 60 * ((r - g) / (mx - mn)) + 240
    return h, s, v
def by_color(r, g, b, horiz):
    h, s, v = hsv(r, g, b)
    if v < 0.2: return 'TILE_DARK'
    if s < 0.18:
        if v > 0.8: return 'PAINT_WHITE' if horiz else 'SCHOOL_WALL'
        if v > 0.5: return 'SIDEWALK' if horiz else 'WALL_GRAY'
        return 'CONCRETE' if horiz else 'IRON'
    if 20 <= h < 50: return 'SAND' if horiz else 'WOOD_DARK' if v < 0.5 else 'PLANKS'
    if 50 <= h < 70: return 'PAINT_YELLOW'
    if 70 <= h < 170: return 'LEAVES' if v < 0.6 else 'SCHOOL_BAND'
    if 170 <= h < 260: return 'PAINT_BLUE'
    if h >= 330 or h < 20: return 'PAINT_RED' if s > 0.45 else 'BRICK'
    return 'BRICK'
grid = {}  # (x,y,z) → (key, shape)
cls_of = {}
for v in V:
    x, y, z, cls, cl, r, g, b, n, h, lx0, lx1, ly0, ly1, lz0, lz1, top = v
    horiz = h > 0.5
    wx, wy, wz = lx1 - lx0, ly1 - ly0, lz1 - lz0
    glass = cl.get('glass', 0) + cl.get('dormglass', 0) + cl.get('carGlass', 0) + cl.get('acrylic', 0)
    key = None; shape = FULL
    if y <= 7:
        # 땅 윗면: 바닥 재질만 (벽 밑동·기둥 밑은 무시)
        if not horiz and ly0 > 0.75: continue
        if cls in ('dirt', 'laminate', 'floor', 'slab', 'concrete', 'extBase', 'panel', 'court', 'line', 'grass', 'turf', 'asphalt'):
            if cls == 'line': key = 'PAINT_WHITE'
            elif cls == 'court': key = 'COURT'
            elif cls in ('grass', 'turf'): key = 'GRASS'
            elif cls == 'asphalt': key = 'ASPHALT'
            else:
                hh, ss, vv = hsv(r, g, b)
                key = 'SAND' if (20 <= hh < 55 and ss > 0.2) else 'SIDEWALK' if vv > 0.45 else 'CONCRETE'
        elif horiz: key = by_color(r, g, b, True)
        else: continue
        grid[(x, 7, z)] = (key, FULL); cls_of[(x, 7, z)] = cls; continue
    # 창: 유리가 조금이라도 있는 세로 칸
    if not horiz and glass >= 0.04 and cls not in ('oak', 'walnut'): key = 'WINDOW'
    elif cls == 'led' and horiz: key = 'LAMP_HEAD'; shape = SLAB_TOP if ly0 > 0.4 else SLAB_BOTTOM
    elif horiz and (cl.get('roof', 0) > 0.08 or (cls == 'ceiling' and y >= 15)): key = 'ROOF_GRAY'
    elif horiz and cl.get('redRoof', 0) > 0.08: key = 'ROOF_RED'
    elif cls == 'other': key = by_color(r, g, b, horiz)
    else: key = WALLISH.get(cls) or by_color(r, g, b, horiz)
    # 모양: 얇은 벽 → 반블록
    if key not in ('WINDOW', 'DOOR', 'LAMP_HEAD', 'FENCE_WHITE', 'LAMP_POLE'):
        if horiz and wy < 0.4 and y not in (11, 15):
            shape = SLAB_BOTTOM if ly1 < 0.55 else SLAB_TOP if ly0 > 0.45 else FULL
        elif not horiz:
            tx, tz = wx < 0.35, wz < 0.35
            if tx and not tz: shape = HALF_XN if lx1 < 0.5 else HALF_XP if lx0 > 0.5 else FULL
            elif tz and not tx: shape = HALF_ZN if lz1 < 0.5 else HALF_ZP if lz0 > 0.5 else FULL
    grid[(x, y, z)] = (key, shape); cls_of[(x, y, z)] = cls
# 문: 참나무 세로 칸이 y=8,9 에 겹쳐 있으면 문
for (x, y, z), (key, shape) in list(grid.items()):
    if y == 8 and cls_of.get((x, 8, z)) == 'oak' and cls_of.get((x, 9, z)) == 'oak' and key == 'PLANKS':
        grid[(x, 8, z)] = ('DOOR', FULL); grid[(x, 9, z)] = ('DOOR', FULL)
    if y == 12 and cls_of.get((x, 12, z)) == 'oak' and cls_of.get((x, 13, z)) == 'oak' and key == 'PLANKS':
        grid[(x, 12, z)] = ('DOOR', FULL); grid[(x, 13, z)] = ('DOOR', FULL)
# 통계
print('cells', len(grid)); print(Counter(k for k, s in grid.values()).most_common(40)); print('shapes', Counter(s for k, s in grid.values()))
xs = [p[0] for p in grid]; ys = [p[1] for p in grid]; zs = [p[2] for p in grid]
x0, x1, y0, y1, z0, z1 = min(xs), max(xs), min(ys), max(ys), min(zs), max(zs)
print('range', x0, x1, y0, y1, z0, z1)
keys = sorted(set(k for k, s in grid.values()))
ki = {k: i + 1 for i, k in enumerate(keys)}
W, H, D = x1 - x0 + 1, y1 - y0 + 1, z1 - z0 + 1
vals = []
for x in range(x0, x1 + 1):
    for z in range(z0, z1 + 1):
        for y in range(y0, y1 + 1):
            c = grid.get((x, y, z)); vals.append(0 if not c else ki[c[0]] * 8 + c[1])
runs = []; prev = vals[0]; cnt = 0
for v in vals:
    if v == prev: cnt += 1
    else: runs.append(f'{prev}x{cnt}' if cnt > 1 else str(prev)); prev = v; cnt = 1
runs.append(f'{prev}x{cnt}' if cnt > 1 else str(prev))
out = {'x0': x0, 'y0': y0, 'z0': z0, 'w': W, 'h': H, 'd': D, 'keys': keys, 'rle': ','.join(runs)}
dst = os.path.join(os.path.dirname(__file__), '..', 'src', 'world', 'gen', 'classic-campus.json')
json.dump(out, open(dst, 'w'), ensure_ascii=False)
print('wrote', dst, os.path.getsize(dst), 'bytes', 'cells', len(vals))
# 미리보기 그림
try:
    from PIL import Image
    COL = {'SCHOOL_WALL': (240, 240, 235), 'SCHOOL_BAND': (31, 143, 116), 'WINDOW': (150, 200, 230), 'DOOR': (190, 140, 80), 'PLANKS': (200, 160, 100), 'WOOD_DARK': (110, 70, 40), 'CEILING': (230, 230, 225), 'ROOF_GRAY': (120, 130, 125), 'ROOF_RED': (168, 48, 42), 'DORM_WALL': (232, 220, 196), 'ORANGE_WALL': (234, 154, 58), 'CONCRETE': (160, 160, 155), 'SIDEWALK': (190, 190, 185), 'SAND': (214, 194, 140), 'PAINT_WHITE': (255, 255, 255), 'COURT': (184, 181, 170), 'FENCE_WHITE': (245, 245, 245), 'IRON': (90, 92, 96), 'TILE_DARK': (40, 40, 44), 'LAMP_HEAD': (255, 240, 200), 'FLOOR_TILE': (210, 210, 205), 'WOOD_FLOOR': (190, 150, 100), 'GRASS': (90, 150, 70), 'LEAVES': (60, 120, 50), 'PAINT_RED': (200, 50, 45), 'PAINT_BLUE': (50, 90, 170), 'PAINT_YELLOW': (230, 180, 40), 'WALL_GRAY': (170, 170, 168), 'BRICK': (150, 80, 60), 'ASPHALT': (60, 60, 60), 'WHITEBOARD': (250, 250, 250)}
    def save(img, name, sc=5): img.resize((img.width * sc, img.height * sc), Image.NEAREST).save(name)
    top = {}
    for (x, y, z), (k, s) in grid.items():
        if (x, z) not in top or y > top[(x, z)][0]: top[(x, z)] = (y, k)
    img = Image.new('RGB', (W, D), (60, 120, 60))
    for (x, z), (y, k) in top.items(): img.putpixel((x - x0, z1 - z), COL.get(k, (255, 0, 255)))
    save(img, f'{SP}/map-top.png')
    for Y in (7, 8, 9, 12):
        img = Image.new('RGB', (W, D), (30, 30, 30))
        for (x, y, z), (k, s) in grid.items():
            if y == Y: img.putpixel((x - x0, z1 - z), COL.get(k, (255, 0, 255)))
        save(img, f'{SP}/map-y{Y}.png')
except Exception as e: print('preview fail', e)
