# 확장을 새 판(index.html)으로 옮기기
#   python3 rebase.py --old 옛판.html --new 새판.html --src ../src --out ../src-new
# 1) 두 판에서 큰 <script>를 꺼내고  2) 끼워 넣을 자리(앵커)를 찾고
# 3) 두 판의 최상위 이름을 줄 맞춰 대응표를 만들고  4) src 안의 번들 이름을 새 이름으로 바꿔요.
# 필요한 것: node (npm install — 이 폴더의 package.json), python3 + diff-match-patch
import argparse, os, re, subprocess, sys, json, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ANCHOR = r"\}\),([\w$]+)\.start\(\),([\w$]+)\.music=null;"

ap = argparse.ArgumentParser()
ap.add_argument("--old", required=True, help="src 가 맞춰져 있는 판의 index.html")
ap.add_argument("--new", required=True, help="옮겨 갈 새 판의 index.html")
ap.add_argument("--src", required=True)
ap.add_argument("--out", required=True)
ap.add_argument("--work", default=None, help="중간 파일 폴더 (기본: 임시 폴더)")
a = ap.parse_args()
work = a.work or tempfile.mkdtemp(prefix="mpx-rebase-")
os.makedirs(work, exist_ok=True)

def main_script(path, out):
    src = open(path, encoding="utf-8").read()
    scripts = re.findall(r"<script>(.*?)</script>", src, re.S)
    main = max(scripts, key=len)
    open(out, "w", encoding="utf-8").write(main)
    m = re.findall(ANCHOR, main)
    if len(m) != 1: sys.exit(f"{path}: 끼워 넣을 자리를 못 찾았어요 ({len(m)}개)")
    pe, c = m[0]
    return r"\}\)," + re.escape(pe) + r"\.start\(\)," + re.escape(c) + r"\.music=null;"

def run(cmd):
    print("$", " ".join(cmd)); r = subprocess.run(cmd, cwd=HERE)
    if r.returncode: sys.exit("실패: " + " ".join(cmd))

ja, jb = os.path.join(work, "old.js"), os.path.join(work, "new.js")
ra, rb = main_script(a.old, ja), main_script(a.new, jb)
run(["node", "--max-old-space-size=8000", "analyze.js", ja, os.path.join(work, "old.json"), ra])
run(["node", "--max-old-space-size=8000", "analyze.js", jb, os.path.join(work, "new.json"), rb])
run([sys.executable, "align.py", os.path.join(work, "old.json"), os.path.join(work, "new.json"), os.path.join(work, "map.json")])
run(["node", "port.js", os.path.abspath(a.src), os.path.abspath(a.out), os.path.join(work, "map.json"), os.path.join(work, "old.json"), os.path.join(work, "new.json"), os.path.join(work, "report.json")])
rep = json.load(open(os.path.join(work, "report.json"), encoding="utf-8"))
print("\n바꾼 번들 이름", rep["renamedNames"], "개 · 고친 곳", rep["edits"], "곳 · 겹쳐서 이름 바꾼 지역 변수", rep["conflicts"])
if rep["problems"]:
    print("⚠️ 확인할 것:"); [print("  -", p) for p in rep["problems"]]; sys.exit(1)
print("중간 파일:", work)
