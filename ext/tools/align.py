import json, difflib, collections, sys, time, pickle
from diff_match_patch import diff_match_patch
# python3 align.py old.json new.json map.json  — 두 판의 최상위 이름 대응표
fa, fb, outp = sys.argv[1], sys.argv[2], sys.argv[3]
A = json.load(open(fa)); B = json.load(open(fb))
t0 = time.time()
def itemkeys(X):
    return ['\x00'.join(X['norm'][it['t0']:it['t1']]) for it in X['items']]
ka, kb = itemkeys(A), itemkeys(B)
votes = collections.defaultdict(collections.Counter)
def vote_tokens(a0, b0, n):
    ta, tb = A['tv'], B['tv']
    for k in range(n):
        va, vb = ta[a0 + k], tb[b0 + k]
        if va >= 0 and vb >= 0: votes[va][vb] += 1
dmp = diff_match_patch(); dmp.Diff_Timeout = 0
def tokdiff(a0, a1, b0, b1):
    # token-level diff via char mapping
    na, nb = A['norm'][a0:a1], B['norm'][b0:b1]
    vocab = {}
    def enc(lst):
        out = []
        for t in lst:
            c = vocab.get(t)
            if c is None:
                cp = 0x100 + len(vocab)
                if cp >= 0xD800: cp += 0x800
                c = chr(cp); vocab[t] = c
            out.append(c)
        return ''.join(out)
    sa, sb = enc(na), enc(nb)
    diffs = dmp.diff_main(sa, sb, False)
    i = j = 0; eq = 0
    for op, txt in diffs:
        L = len(txt)
        if op == 0: vote_tokens(a0 + i, b0 + j, L); i += L; j += L; eq += L
        elif op == -1: i += L
        else: j += L
    return eq
sm = difflib.SequenceMatcher(None, ka, kb, autojunk=False)
stats = collections.Counter(); changed = []
for tag, i1, i2, j1, j2 in sm.get_opcodes():
    stats[tag] += max(i2 - i1, j2 - j1)
    if tag == 'equal':
        for d in range(i2 - i1):
            ia, ib = A['items'][i1 + d], B['items'][j1 + d]
            vote_tokens(ia['t0'], ib['t0'], ia['t1'] - ia['t0'])
    else:
        a0 = A['items'][i1]['t0'] if i1 < i2 else None; a1 = A['items'][i2 - 1]['t1'] if i1 < i2 else None
        b0 = B['items'][j1]['t0'] if j1 < j2 else None; b1 = B['items'][j2 - 1]['t1'] if j1 < j2 else None
        changed.append((tag, i1, i2, j1, j2, (a1 - a0) if a0 is not None else 0, (b1 - b0) if b0 is not None else 0))
        if tag == 'replace': tokdiff(a0, a1, b0, b1)
print('items', len(ka), len(kb), dict(stats), 'changed blocks', len(changed), round(time.time() - t0, 1), 's')
big = sorted(changed, key=lambda c: -(c[5] + c[6]))[:15]
for c in big:
    tag, i1, i2, j1, j2, la, lb = c
    na = [A['items'][i]['n'] for i in range(i1, i2)][:6]; nb = [B['items'][j]['n'] for j in range(j1, j2)][:6]
    print(tag, (i1, i2), (j1, j2), 'toks', la, lb, na, nb)
# decide mapping for visible vars of A
VA, VB = A['vars'], B['vars']
mp = {}
for va, cnt in votes.items():
    if not VA[va]['vis']: continue
    (vb, c1), = cnt.most_common(1); tot = sum(cnt.values())
    mp[VA[va]['name']] = {'to': VB[vb]['name'], 'vis': VB[vb]['vis'], 'votes': c1, 'tot': tot, 'alt': [(VB[x]['name'], n) for x, n in cnt.most_common(3)[1:]]}
json.dump(mp, open(outp, 'w'), ensure_ascii=False)
nvisA = sum(1 for v in VA if v['vis'])
print('visible A vars', nvisA, 'mapped', len(mp), 'low-conf', sum(1 for m in mp.values() if m['votes'] / m['tot'] < .9), 'to-nonvisible', sum(1 for m in mp.values() if not m['vis']))
