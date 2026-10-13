# 앱 아이콘 만들기: python3 make_icons.py 출력폴더
#   남색 바탕에 블록으로 지은 흰 학교 건물(초록 띠) · 노란 해 블록
import sys, os
from PIL import Image, ImageDraw
out = sys.argv[1] if len(sys.argv) > 1 else "."
os.makedirs(out, exist_ok=True)
NAVY, NAVY2, WALL, WALL2, GREEN, WIN, SUN, DOOR = (22, 32, 46), (32, 46, 66), (244, 241, 234), (214, 208, 196), (47, 143, 78), (27, 39, 64), (245, 197, 66), (122, 78, 44)
def draw(S, maskable):
    im = Image.new("RGB", (S, S), NAVY); d = ImageDraw.Draw(im)
    k = .80 if maskable else 1.0                     # 마스크용은 가운데 80% 안에 그려요
    def R(x0, y0, x1, y1, col):
        c = lambda v: S * (.5 + (v - .5) * k)
        d.rectangle([c(x0), c(y0), c(x1) - 1, c(y1) - 1], fill=col)
    d.rectangle([0, S * (.5 + (.80 - .5) * k), S, S], fill=NAVY2)    # 땅 (가장자리까지)
    R(.70, .12, .86, .28, SUN)                        # 해 블록
    R(.16, .34, .84, .82, WALL)                       # 건물
    R(.16, .34, .84, .40, WALL2)                      # 지붕 턱
    R(.16, .55, .84, .61, GREEN)                      # 초록 띠
    for cx in (.22, .38, .54, .70): R(cx, .43, cx + .08, .51, WIN)    # 위층 창문
    for cx in (.22, .32, .60, .70): R(cx, .64, cx + .08, .72, WIN)    # 아래층 창문 (가운데는 문)
    R(.45, .70, .55, .82, DOOR)                       # 문
    return im
for name, S, m in (("icon-512.png", 512, 0), ("icon-192.png", 192, 0), ("icon-180.png", 180, 0), ("icon-maskable-512.png", 512, 1)):
    big = draw(S * 4, m).resize((S, S), Image.LANCZOS)
    if not m and name != "icon-180.png":              # 일반 아이콘은 모서리를 둥글게 (투명)
        mask = Image.new("L", (S * 4, S * 4), 0); ImageDraw.Draw(mask).rounded_rectangle([0, 0, S * 4 - 1, S * 4 - 1], radius=S * 4 * .22, fill=255)
        big = big.convert("RGBA"); big.putalpha(mask.resize((S, S), Image.LANCZOS))
    big.save(os.path.join(out, name), optimize=True)
    print("ok", name)
