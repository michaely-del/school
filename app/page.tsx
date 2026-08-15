"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { initialHouses, House } from './houses';

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function HouseCup() {
  const [houses, setHouses] = useState<House[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [t, setT] = useState<string | null>(null);
  const [m, setM] = useState(false);
  const [st, setSt] = useState(1);
  const [sel, setSel] = useState<House | null>(null);
  const [pIn, setPIn] = useState('');
  const [nIn, setNIn] = useState('');
  const [ptsIn, setPtsIn] = useState('');
  const [err, setErr] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  const [activeCelebration, setActiveCelebration] = useState<'small' | 'big' | 'incredible' | null>(null);
  const [celebrationColor, setCelebrationColor] = useState('#fbbf24');
  const [celebrationText, setCelebrationText] = useState('');

  async function load() {
    const { data: h } = await sb.from('houses').select('*').order('id', { ascending: true });
    if (h) setHouses([...h]);
    const { data: l } = await sb.from('logs').select('*').order('created_at', { ascending: false }).limit(5);
    if (l) setLogs([...l]);
  }

  useEffect(() => {
    load();
    const ch = sb.channel('db-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'houses' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'logs' }, () => load())
      .subscribe();
    const s = localStorage.getItem('cup_t');
    if (s) { setT(s); setSt(3); }
    setIsMounted(true);
    
    // Fixed for Vercel compiling:
    return () => {
      sb.removeChannel(ch);
    };
  }, []);

  function playCelebrationSound(tier: 'small' | 'big' | 'incredible') {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    if (tier === 'small') {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.frequency.setValueAtTime(587.33, now); osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
      gain.gain.setValueAtTime(0.08, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain); gain.connect(ctx.destination); osc.start(now); osc.stop(now + 0.15);
    } else if (tier === 'big') {
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06); gain.gain.setValueAtTime(0.1, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.3);
        osc.connect(gain); gain.connect(ctx.destination); osc.start(now + idx * 0.06); osc.stop(now + idx * 0.06 + 0.3);
      });
    } else if (tier === 'incredible') {
      const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now); osc.frequency.exponentialRampToValueAtTime(1760, now + 0.8);
      gain.gain.setValueAtTime(0.12, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc.connect(gain); gain.connect(ctx.destination); osc.start(now); osc.stop(now + 0.9);
    }
  }

  async function sub(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    if (st === 1) {
      if (pIn !== "school2026" && pIn !== "admin999") { setErr("Wrong Password!"); return; }
      localStorage.setItem('cache_p', pIn); setSt(2); return;
    }
    if (st === 2) {
      if (!nIn.trim()) { setErr("Enter name."); return; }
      localStorage.setItem('cup_t', nIn.trim()); setT(nIn.trim()); setSt(3); return;
    }
    if (st === 3 && sel) {
      const pointsNum = parseInt(ptsIn, 10);
      if (isNaN(pointsNum)) { setErr("Please type a valid point amount."); return; }
      const isAdm = localStorage.getItem('cache_p') === "admin999";
      if (pointsNum < 0 && !isAdm) { setErr("Only Admins can subtract points!"); return; }
      if (pointsNum === 0) { setErr("Please type a valid point amount."); return; }
      await sb.from('houses').update({ points: Math.max(0, sel.points + pointsNum) }).eq('id', sel.id);
      await sb.from('logs').insert([{ teacher_name: t || "Teacher", house_name: sel.name, points_changed: pointsNum }]);
      if (pointsNum > 0) {
        setCelebrationColor(sel.color || '#fbbf24');
        if (pointsNum < 100) {
          setActiveCelebration('small'); setCelebrationText(`+${pointsNum} to ${sel.name}`); playCelebrationSound('small'); setTimeout(() => setActiveCelebration(null), 1000);
        } else if (pointsNum >= 100 && pointsNum < 1000) {
          setActiveCelebration('big'); setCelebrationText(`BIG SCORE: +${pointsNum} to ${sel.name}`); playCelebrationSound('big'); setTimeout(() => setActiveCelebration(null), 2500);
        } else if (pointsNum >= 1000) {
          setActiveCelebration('incredible'); setCelebrationText(`INCREDIBLE! +${pointsNum} POINTS TO ${sel.name}`); playCelebrationSound('incredible'); setTimeout(() => setActiveCelebration(null), 4000);
        }
      }
      setM(false);
    }
  }
  return (
    <main style={{ minHeight: '100vh', background: 'radial-gradient(circle at top, #1e1e38 0%, #0c0d14 60%, #050508 100%)', color: '#f8fafc', padding: '50px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif', letterSpacing: '-0.01em' }}>
      <style>{`
        @keyframes smallPop { 0% { transform: scale(0.6); opacity: 0; } 50% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 0; } }
        @keyframes bigBlast { 0% { transform: scale(0.2); opacity: 0; filter: blur(10px); } 15% { transform: scale(1.2); opacity: 1; filter: blur(0px); } 85% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.5); opacity: 0; filter: blur(20px); } }
        @keyframes incredibleSwell { 0% { transform: scale(0.1); opacity: 0; } 10% { transform: scale(1.2); opacity: 1; } 85% { transform: scale(1); opacity: 1; filter: drop-shadow(0 0 30px var(--glow)); } 100% { transform: scale(2); opacity: 0; filter: blur(25px); } }
        @keyframes screenFlash { 0% { opacity: 0; } 10% { opacity: 0.4; } 100% { opacity: 0; } }
      `}</style>

      <div style={{ width: '100%', maxWidth: '1200px', display: 'flex', justifyContent: 'flex-end', marginBottom: '50px' }}>
        {t ? (
          <div style={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '8px 18px', borderRadius: '30px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#fbbf24' }}>User: {t}</span>
            <button onClick={() => { localStorage.clear(); setT(null); setSt(1); }} style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>Sign Out</button>
          </div>
        ) : (
          <div style={{ background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '8px 18px', borderRadius: '30px', fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>
            <span>View Only Mode</span>
          </div>
        )}
      </div>
      
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{ fontSize: '3.75rem', fontWeight: 900, background: 'linear-gradient(to right, #fff 20%, #fbbf24 50%, #f59e0b 80%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '12px', letterSpacing: '-0.03em' }}>House Cup Leaderboard</h1>
        <p style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.25em' }}>School Points</p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', width: '100%', maxWidth: '1200px' }}>
        {houses.map(h => {
          const fill = Math.min((h.points / 10000) * 100, 100);
          const isM = h.points === Math.max(...houses.map(x => x.points)) && h.points > 0;
          return (
            <div key={h.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: isM ? 'rgba(21, 25, 44, 0.8)' : 'rgba(13, 16, 27, 0.8)', backdropFilter: 'blur(16px)', padding: '32px 24px', borderRadius: '24px', border: isM ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)', transform: isM ? 'scale(1.02)' : 'scale(1)', transition: 'all 0.4s ease', position: 'relative' }}>
              {isM && <div style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: 'rgba(245, 158, 11, 0.15)', border: '1px solid #f59e0b', color: '#fbbf24', padding: '4px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>1st Place</div>}
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 6px 0', color: '#fff' }}>{h.name}</h2>
              <p style={{ fontSize: '1.75rem', fontWeight: 800, color: h.color || '#fbbf24', margin: '0 0 28px 0', textShadow: `0 0 20px ${h.color}40` }}>{h.points.toLocaleString()} <span style={{ fontSize: '0.85rem', color: '#475569' }}>pts</span></p>
              <div style={{ position: 'relative', width: '48px', height: '260px', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '40px', backgroundColor: 'rgba(0, 0, 0, 0.4)', padding: '5px', boxSizing: 'border-box', overflow: 'hidden', display: 'flex', flexDirection: 'column-reverse' }}>
                <div style={{ width: '100%', borderRadius: '40px', transition: 'height 1.5s ease', background: `linear-gradient(180deg, ${h.color}ff 0%, ${h.color}66 100%)`, height: `${fill}%`, boxShadow: `0 0 20px ${h.color}80` }} />
              </div>
              <button onClick={() => { setSel(h); setPtsIn(''); setPIn(''); setNIn(''); setErr(''); if (t) { setSt(3); } else { setSt(1); } setM(true); }} style={{ marginTop: '32px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '12px 24px', borderRadius: '14px', color: '#fff', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', width: '100%', textTransform: 'uppercase' }}>Modify Score</button>
            </div>
          );
        })}
      </div>
      <div style={{ width: '100%', maxWidth: '1200px', backgroundColor: 'rgba(10, 12, 20, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '24px', padding: '32px', marginTop: '55px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 24px 0' }}>
          <h3 style={{ color: '#fff', margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Recent Point Modifications</h3>
          {(isMounted && localStorage.getItem('cache_p') === "admin999") && (
            <button onClick={async () => { if (!window.confirm("Clear point logs?")) return; await sb.from('logs').delete().neq('house_name', 'SAFETY_VAL'); window.location.reload(); }} style={{ backgroundColor: 'rgba(244, 63, 94, 0.06)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#f43f5e', padding: '8px 16px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>Purge Database History</button>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {logs.length === 0 ? (
            <div style={{ color: '#475569', fontStyle: 'italic', padding: '20px 0', textAlign: 'center' }}>No point modifications recorded yet.</div>
          ) : (
            logs.map(l => {
              const isP = l.points_changed >= 0;
              return (
                <div key={l.id} style={{ padding: '18px 24px', backgroundColor: 'rgba(30, 41, 59, 0.2)', border: '1px solid rgba(255, 255, 255, 0.03)', borderRadius: '16px', fontSize: '0.95rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `4px solid ${isP ? '#10b981' : '#ef4444'}` }}>
                  <span style={{ color: '#cbd5e1' }}><strong style={{ color: '#fff' }}>{l.teacher_name}</strong> {isP ? 'allocated' : 'retracted'} <strong style={{ color: isP ? '#34d399' : '#f87171', background: isP ? 'rgba(52, 211, 153, 0.1)' : 'rgba(248, 113, 113, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>{isP ? '+' : ''}{l.points_changed}</strong> to <strong style={{ color: '#fff' }}>{l.house_name}</strong></span>
                </div>
              );
            })
          )}
        </div>
      </div>
      {m && sel && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(5, 5, 8, 0.85)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <form onSubmit={sub} style={{ backgroundColor: '#0d101b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '36px', width: '100%', maxWidth: '340px' }}>
            <h3 style={{ margin: '0 0 6px 0', color: '#fff', textAlign: 'center', fontSize: '1.5rem', fontWeight: 800 }}>Adjust {sel.name}</h3>
            <p style={{ margin: '0 0 32px 0', color: '#64748b', fontSize: '0.9rem', textAlign: 'center' }}>Current Balance: <span style={{ color: '#fbbf24', fontWeight: 700 }}>{sel.points.toLocaleString()}</span></p>
            {st === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Verification Key</label>
                <input type="password" value={pIn} onChange={e => setPIn(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '14px 16px', borderRadius: '12px' }} required />
              </div>
            )}
            {st === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Authority Signature</label>
                <input type="text" value={nIn} onChange={e => setNIn(e.target.value)} placeholder="e.g. Professor Smith" style={{ width: '100%', boxSizing: 'border-box', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '14px 16px', borderRadius: '12px' }} required />
              </div>
            )}
            {st === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Point Amount</label>
                <input type="number" value={ptsIn} onChange={e => setPtsIn(e.target.value)} placeholder="e.g. 50 or -25" style={{ width: '100%', boxSizing: 'border-box', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '14px 16px', borderRadius: '12px' }} required />
              </div>
            )}
            {err && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '16px', textAlign: 'center', fontWeight: 700 }}>{err}</p>}
            <div style={{ display: 'flex', gap: '12px', marginTop: '36px' }}>
              <button type="button" onClick={() => setM(false)} style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '14px', borderRadius: '12px' }}>Cancel</button>
              <button type="submit" style={{ flex: 1, backgroundColor: '#fbbf24', border: 'none', color: '#000', padding: '14px', borderRadius: '12px', fontWeight: 800 }}>{st === 3 ? "Commit" : "Proceed"}</button>
            </div>
          </form>
        </div>
      )}

      {activeCelebration === 'small' && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999 }}>
          <div style={{ padding: '20px 40px', backgroundColor: 'rgba(15, 23, 42, 0.95)', border: `2px solid ${celebrationColor}`, color: '#fff', borderRadius: '20px', fontSize: '1.5rem', fontWeight: 800, animation: 'smallPop 1s ease-out forwards' }}>{celebrationText}</div>
        </div>
      )}
      {activeCelebration === 'big' && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999 }}>
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle, ${celebrationColor}22 0%, transparent 70%)`, animation: 'screenFlash 1.5s ease-out forwards' }} />
          <div style={{ padding: '30px 60px', backgroundColor: '#0d101b', border: `3px solid ${celebrationColor}`, color: '#fff', borderRadius: '30px', fontSize: '2.25rem', fontWeight: 900, animation: 'bigBlast 2.5s ease forwards', textAlign: 'center' }}>{celebrationText}</div>
        </div>
      )}
      {activeCelebration === 'incredible' && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999, '--glow': celebrationColor } as any}>
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle, ${celebrationColor}44 0%, transparent 60%)`, animation: 'screenFlash 3.5s infinite' }} />
          <div style={{ padding: '50px 80px', background: 'linear-gradient(135deg, #0d101b 0%, #151a30 100%)', border: `4px dashed ${celebrationColor}`, color: celebrationColor, borderRadius: '40px', fontSize: '3rem', fontWeight: 950, animation: 'incredibleSwell 4s ease forwards' }}>{celebrationText}</div>
        </div>
      )}
    </main>
  );
}
