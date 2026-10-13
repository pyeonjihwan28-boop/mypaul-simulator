# 마이폴학교 시뮬레이터 확장 빌드
#   python3 build.py [beta|prod] --base 확장없는/index.html [--src src] [--notes notes.txt]
# 배포본(index.html, 전체 문서) 안 <pe>.start() 바로 앞에 src/*.js 를 끼워 넣어요.
# 결과:
#   build/mypaul-<mode>.html   GitHub 에 올릴 전체 문서 (prod → index.html · beta → beta/index.html)
#   build/version-<mode>.json  같이 올릴 version.json
#   build/publish-<mode>.html  claude.ai 아티팩트로 올릴 본문 (뼈대 빼고)
import sys, re, os, glob, time, subprocess, json

ROOT = os.path.dirname(os.path.abspath(__file__))
os.makedirs(os.path.join(ROOT, "build"), exist_ok=True)
mode = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("--") else "beta"
def arg(name, default=None):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default
notes_file = arg("--notes")
base_path = arg("--base")
if not base_path: raise SystemExit("--base 확장 없는 index.html 을 알려 주세요")
src_dir = arg("--src", os.path.join(ROOT, "src"))

base = open(base_path, encoding="utf-8").read()
if "마이폴 확장: GTA5 × 마인크래프트" in base: raise SystemExit("이 index.html 에는 이미 확장이 들어 있어요 — 확장 없는 판을 --base 로 주세요")
AN = r"\}\),([\w$]+)\.start\(\),([\w$]+)\.music=null;"
m = re.search(AN, base)
assert m and len(re.findall(AN, base)) == 1, "anchor"
PE = m.group(1)

parts = []
for f in sorted(glob.glob(os.path.join(src_dir, "*.js"))):
    code = open(f, encoding="utf-8").read()
    parts.append(f"\n/* ── {os.path.basename(f)} ── */\n" + code)
ext = "\n/* ==== 마이폴 확장: GTA5 × 마인크래프트 ==== */\n(()=>{\n" + "\n".join(parts) + "\n})();\n"
if "</script" in ext.lower():
    raise SystemExit("src 안에 </script 가 있으면 안 돼요")

out = base[:m.start()] + "});" + ext + f"{PE}.start(),{m.group(2)}.music=null;" + base[m.end():]

# 베타 · 정식
fm = re.search(r'var ([\w$]+)="prod",([\w$]+)=\1==="beta"', out)
assert fm, "beta flag"
if mode == "beta":
    out = out[:fm.start()] + f'var {fm.group(1)}="beta",{fm.group(2)}={fm.group(1)}==="beta"' + out[fm.end():]
    assert out.count("<title>마이폴학교 시뮬레이터</title>") == 1, "title"
    out = out.replace("<title>마이폴학교 시뮬레이터</title>", "<title>마이폴학교 시뮬레이터 베타</title>", 1)

# 빌드 번호 · 업데이트 소식
build_id = str(int(time.time() * 1000))
bm = re.search(r'var ([\w$]+)="(\d{13})",([\w$]+)="((?:[^"\\]|\\.)*)"', out)
assert bm, "build/notes"
notes_js = bm.group(4)
notes_txt = json.loads('"' + notes_js + '"')
if notes_file:
    notes_txt = open(notes_file, encoding="utf-8").read().strip()
    notes_js = json.dumps(notes_txt, ensure_ascii=False)[1:-1]
out = out[:bm.start()] + f'var {bm.group(1)}="{build_id}",{bm.group(3)}="{notes_js}"' + out[bm.end():]

# 문법 확인 (큰 스크립트만 따로 꺼내서 node --check)
scripts = re.findall(r"<script>(.*?)</script>", out, re.S)
main = max(scripts, key=len)
tmp = os.path.join(ROOT, "build", "_check.js")
open(tmp, "w", encoding="utf-8").write(main)
r = subprocess.run(["node", "--check", tmp], capture_output=True, text=True)
if r.returncode != 0:
    print(r.stderr[:3000]); raise SystemExit("문법 오류")
os.remove(tmp)

# GitHub 판에만: 설치형 웹앱(와이파이 없이 실행) 머리 태그 — manifest · 아이콘 (sw.js 는 96-offline.js 가 켜요)
pre = "../" if mode == "beta" else ""
pwa = (f'<link rel="manifest" href="{pre}manifest.webmanifest">'
       f'<link rel="icon" type="image/png" sizes="192x192" href="{pre}icon-192.png">'
       f'<link rel="apple-touch-icon" href="{pre}icon-180.png">\n')
he0 = out.find("</head>"); assert he0 > 0
out_gh = out[:he0] + pwa + out[he0:]
name = os.path.join(ROOT, "build", f"mypaul-{mode}.html")
open(name, "w", encoding="utf-8").write(out_gh)
json.dump({"build": build_id, "notes": notes_txt}, open(os.path.join(ROOT, "build", f"version-{mode}.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

# 아티팩트로 올릴 본문: 머리말 주석 + <title>부터 </head> 전까지 + <body> 안쪽
assert out.startswith("<!DOCTYPE html>\n")
h = out.find("<html"); comment = out[len("<!DOCTYPE html>\n"):h]
t = out.find("<title>"); he = out.find("</head>"); bs = out.find("<body>", he); be = out.rfind("</body>")
assert 0 < t < he < bs < be, "skeleton"
open(os.path.join(ROOT, "build", f"publish-{mode}.html"), "w", encoding="utf-8").write(comment + out[t:he] + out[bs + 6:be])
print("ok", name, len(out), "bytes · ext", len(ext), "chars · build", build_id, "· anchor", PE)
