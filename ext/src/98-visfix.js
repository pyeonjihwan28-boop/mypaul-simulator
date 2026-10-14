/* 창 전환 뒤 흐려짐 막기 (mp_visfix)
   · 다른 창 · 앱에 갔다 오면, 화면이 멈춰 있던 시간까지 '느린 프레임'으로 세서 자동 그래픽이 해상도(또는 화질)를 낮췄어요 → 흐려짐
   · 돌아오면(창 다시 보임 · 다시 누름) 프레임 재기를 처음부터 다시 하고 2초 쉬었다가 판단해요
   · 프레임 사이가 1초 넘게 벌어진 구간(멈춰 있던 동안)은 아예 세지 않아요
   · 실제로 느린 기기에서 낮추는 건 그대로예요 */
const VF = (MP.visfix = { last: 0, resets: 0 });
const vfReset = () => {
  try { Xi.t0 = 0; Xi.n = 0; Xi.low = 0; Xi.high = 0; Xi.wait = Math.max(Xi.wait || 0, 2); VF.last = 0; VF.resets++; } catch (e) {}
};
document.addEventListener("visibilitychange", vfReset);
addEventListener("focus", vfReset);
addEventListener("pageshow", vfReset);
{
  const orig = lS;   // 본체 FPS 재기 (매 프레임)
  lS = function (e) {
    if (VF.last && e - VF.last > 1000) { Xi.t0 = 0; Xi.n = 0; Xi.low = 0; Xi.high = 0; }   // 멈춰 있던 구간은 버려요
    VF.last = e;
    return orig.apply(this, arguments);
  };
}
VF.tick = e => lS(e);   // 시험용

de.add({
  id: "mp_visfix", name: "창 전환 뒤 흐려짐 막기",
  gives: "다른 창에 갔다 와도 자동 그래픽이 해상도를 낮추지 않게 (멈춘 시간은 안 세요)",
});
