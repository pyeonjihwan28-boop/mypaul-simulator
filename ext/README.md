# 마이폴 확장: GTA5 × 마인크래프트

`index.html`(배포본) 안에 들어 있는 확장 코드의 원본이에요. 기능 블록 11개로 되어 있어요.

| 블록 | 파일 | 하는 일 | 저장 칸 |
|---|---|---|---|
| `mp_build` | `src/20-build.js` | 짓기 모드 · 한 칸 캐기 · 놓기 | `mpb` |
| `mp_craft` | `src/30-craft.js` | 제작 · 화로 · 내 상자 · 도구 등급 | `mpf` |
| `mp_home` | `src/40-home.js` | 내 땅 · 침대 = 집 · 농사 · 번식 | `mph` |
| `mp_phone` | `src/50-phone.js` | 블록폰 · 은행 · 엔더 택배 · 카메라 | `mpp` |
| `mp_story` | `src/60-story.js` | 이야기 미션 5장 · 다이아 은행 한탕 · 바리케이드 | `mps` |
| `mp_ride` | `src/70-ride.js` | 블록카 · 튜닝 · 레이스 · 점프대 · 겉날개 | `mpr` |
| `mp_mine` | `src/80-mine.js` | 폐광 · 떠돌이 강아지 | `mpm` |
| `mp_world` | `src/90-world.js` | 레드스톤 · 용암 차원 · 주인공 3명 | `mpw` |
| `mp_offline` | `src/96-offline.js` | 와이파이 없이 실행 (서비스 워커 켜기 · 첫 화면 '앱으로 설치') | — |
| `mp_qfold` | `src/97-qfold.js` | 휴대폰 바로가기 줄 접기 ('메뉴' 하나만 · 누르면 펼치기/접기 · 처음은 접힘 · ☰ = 전체 메뉴) | localStorage `mypaul_qfold` |
| `mp_visfix` | `src/98-visfix.js` | 다른 창에 갔다 와도 흐려지지 않게 (멈춘 시간을 FPS 로 안 세요) | — |

`src/00-core.js` · `src/10-items.js`는 공통 도구와 새 아이템 · 블록 표예요.

## 와이파이 없이 실행 (설치형 웹앱)

- 저장소 맨 위의 `sw.js` · `manifest.webmanifest` · `icon-*.png`가 그 파일이에요(원본은 `ext/pwa/`, 아이콘은 `ext/pwa/make_icons.py`로 만들어요).
- `sw.js`: 게임 화면은 인터넷이 되면 늘 새로 받아 저장하고, 안 되면(5초 넘게 느려도) 저장본으로 열어요. 글꼴은 한 번 받으면 저장. `version.json`은 늘 인터넷으로.
- `build.py`가 GitHub 판(`build/mypaul-*.html`)의 `<head>`에만 manifest · 아이콘 태그를 넣어요. claude.ai 아티팩트 본문(`build/publish-*.html`)에는 안 넣어요.

## 어떻게 들어가 있나

- 배포본의 큰 `<script>` 안, `}),de.start(),c.music=null;` 바로 앞에 `src/*.js`를 이름 순서대로 이어 붙여 즉시 실행 함수 하나로 끼워 넣어요 (`build.py`).
- 확장은 번들의 **압축된 이름**(`c`, `S`, `Kt`, `wg` …)을 그대로 써요. 지금 `src/`는 **V109 배포본**(빌드 `1791816826200`, 커밋 `8c43f6c`)의 이름에 맞춰져 있어요.
- 번들을 다시 빌드하면 압축된 이름이 바뀌어요. 그래서 새 판에는 `src/`를 그대로 붙이면 안 되고, 아래처럼 옮겨야 해요.

## ⚠️ 게임 본체를 새로 빌드해서 올릴 때

확장이 없는 판을 그대로 올리면 GTA × 마크 기능이 사라지고, 그 판에서 저장하면 위 저장 칸(`mpb` … `mpw`)이 지워질 수 있어요. 새 판을 만들면 꼭 확장을 다시 넣어 주세요.

```bash
cd ext/tools && npm install && pip install diff-match-patch
# 1) src 를 새 판 이름으로 옮기기 (old = 지금 src 가 맞춰진 판, new = 확장 없이 새로 빌드한 판)
git show 8c43f6c:index.html > /tmp/old.html
python3 rebase.py --old /tmp/old.html --new /path/to/new-index.html --src ../src --out ../src-new
# 2) 새 판에 끼워 넣기 (정식: prod · 베타: beta)
cd .. && python3 build.py prod --base /path/to/new-index.html --src src-new --notes notes.txt
# → build/mypaul-prod.html (index.html) · build/version-prod.json (version.json)
```

`rebase.py`는 두 판의 최상위 선언을 줄 맞춰 이름 대응표를 만들고, 확장이 쓰는 번들 이름만 골라 바꿔요. 확장 안의 지역 변수와 이름이 겹치면 지역 변수 쪽 이름을 바꿔요. 대응이 불확실한 이름이 있으면 멈추고 알려 줘요. 옮긴 뒤에는 `src-new`를 `src`로 바꾸고, 이 문서의 "맞춰진 판"(빌드 번호 · 커밋)도 고쳐 주세요.

새 판에서 확장이 감싸는 함수(아래)의 모양이 바뀌었다면 직접 확인해야 해요.
`xM wM MM rj yp gp ES wg L_ _9 pM XB dB A0 aee yd d0 bB RA Lt xee Ci` (V109 이름)

## 원칙

- 기능마다 블록 하나 (`de.add`) — 하나를 꺼도 나머지는 그대로.
- 시초 디자인 그대로: 진한 남색 반투명 판 · 모서리 12px · 흰 글자 · 노랑 강조 `#f5c542` 하나 · IBM Plex Sans KR.
- 실제 인물 규칙: 학교 안 실제 선생님 · 학생은 장난스러운 보스전까지만. 한탕 · 범죄 미션의 상대와 악역, 새 주인공은 바깥 도시의 가상 인물.
- 휴대폰 먼저: 기능마다 터치 버튼.
