// 심부름(퀘스트) — 교무실·게시판에서 받고, 장소마다 E 로 한 단계씩 끝내면 용돈을 받아요.
export const QUESTS = [
  { id: 'coffee', title: '선생님 커피 심부름', steps: [{ place: 'cafeteria', text: '카페 가이아에서 아메리카노 사기', cost: 1500 }, { place: 'office', text: '교무실에 가져다 드리기' }], reward: 4000 },
  { id: 'books', title: '도서관 책 반납', steps: [{ place: 'chapel', text: '두란노 도서관에 책 반납하기' }, { place: 'board', text: '게시판에 반납 확인 적기' }], reward: 2000, fx: { grade: 1 } },
  { id: 'water', title: '텃밭 물 주기', steps: [{ place: 'garden', text: '텃밭에 물 주기' }, { place: 'office', text: '교무실에 보고하기' }], reward: 2500 },
  { id: 'balls', title: '농구공 정리', steps: [{ place: 'basketball', text: '농구장에 흩어진 공 모으기' }, { place: 'storage', text: '창고에 넣기' }], reward: 2500, fx: { fitness: 1 } },
  { id: 'print', title: '작업실 출력물 가져오기', steps: [{ place: 'workshop', text: '작업실에서 3D 출력물 받기' }, { place: 'lab', text: '연구실 선생님께 드리기' }], reward: 3000 },
  { id: 'nurse', title: '보건실 약 심부름', steps: [{ place: 'pharmacy', text: '약국에서 밴드 사기', cost: 2000 }, { place: 'nurse', text: '보건실에 갖다 주기' }], reward: 5000 },
  { id: 'laundry', title: '세탁물 찾아오기', steps: [{ place: 'laundry', text: '지하 세탁실에서 세탁물 찾기' }, { place: 'dormoffice', text: '사감실에 전달하기' }], reward: 2000 },
  { id: 'mail', title: '감사 편지 부치기', steps: [{ place: 'stationery', text: '문방구에서 편지지 사기', cost: 1000 }, { place: 'main', text: '현관 앞 감사편지 우체통에 넣기' }], reward: 3000, fx: { stress: -5 } },
  { id: 'snack', title: '간식 사 오기', steps: [{ place: 'conv', text: '편의점에서 간식 사기', cost: 3000 }, { place: 'lounge', text: '생활관 휴게실에 갖다 두기' }], reward: 5000 },
  { id: 'mart', title: '마트 장보기', steps: [{ place: 'mart', text: '우리 마트에서 급식 재료 사기', cost: 5000 }, { place: 'cafeteria', text: '식당에 전달하기' }], reward: 8000 },
  { id: 'flag', title: '국기 게양', steps: [{ place: 'podium', text: '조회대 옆 국기 게양하기' }], reward: 1500 },
  { id: 'mic', title: '노래방 마이크 점검', steps: [{ place: 'karaoke', text: '노래방 마이크 점검하기' }, { place: 'studio', text: '방송실에 결과 알리기' }], reward: 2500 },
  { id: 'hill', title: '뒷산 쓰레기 줍기', steps: [{ place: 'hill', text: '전망대까지 올라가 쓰레기 줍기' }, { place: 'garden', text: '텃밭 옆에서 분리수거' }], reward: 4000, fx: { fitness: 3 } },
  { id: 'flyer', title: '아파트 전단지 돌리기', steps: [{ place: 'aptplay', text: '아파트 놀이터에 전단지 붙이기' }, { place: 'office', text: '교무실에 보고하기' }], reward: 6000 },
  { id: 'bread', title: '빵집 간식 주문', steps: [{ place: 'bakery', text: '빵집에서 빵 20개 주문하기', cost: 4000 }, { place: 'store', text: '매점에 전달하기' }], reward: 7000 },
  { id: 'pc', title: 'PC방 포스터 붙이기', steps: [{ place: 'pc', text: 'PC방에 학교 축제 포스터 붙이기' }, { place: 'board', text: '게시판에 확인 적기' }], reward: 3000 },
];

export class Quests {
  constructor(save = {}, stats) {
    const q = save.quests || {};
    this.stats = stats;
    this.active = q.active || null; // { id, step }
    this.done = q.done || {}; // id → 횟수
    this.offerDay = q.offerDay ?? 0; this.offered = q.offered || [];
  }
  toJSON() { return { active: this.active, done: this.done, offerDay: this.offerDay, offered: this.offered }; }
  get activeQuest() { return this.active ? QUESTS.find((q) => q.id === this.active.id) : null; }
  get activeStep() { const q = this.activeQuest; return q ? q.steps[this.active.step] : null; }
  // 오늘 받을 수 있는 심부름 3개 (날마다 바뀜)
  available() {
    const day = this.stats.day;
    if (this.offerDay !== day) {
      const ids = QUESTS.map((q) => q.id); let s = (day * 2654435761) >>> 0;
      const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
      for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
      this.offered = ids.slice(0, 3); this.offerDay = day;
    }
    return this.offered.filter((id) => !this.active || this.active.id !== id).map((id) => QUESTS.find((q) => q.id === id));
  }
  accept(id) { if (this.active) return false; this.active = { id, step: 0 }; return true; }
  giveUp() { this.active = null; }
  // 이 장소에서 끝낼 수 있는 단계인지
  stepAt(placeKey) { const st = this.activeStep; return st && st.place === placeKey ? st : null; }
  // 단계 완료 → 다 끝났으면 퀘스트 돌려줌
  complete(placeKey) {
    const q = this.activeQuest, st = this.stepAt(placeKey); if (!q || !st) return null;
    this.active.step++;
    if (this.active.step >= q.steps.length) { this.done[q.id] = (this.done[q.id] || 0) + 1; this.active = null; this.offered = this.offered.filter((id) => id !== q.id); return q; }
    return null;
  }
}
