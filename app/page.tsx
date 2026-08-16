"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const sb = createClient("https://eyrztqdmpqjeokkwqauv.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5cnp0cWRtcHFqZW9ra3dxYXV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3NDM0NTUsImV4cCI6MjEwMjMxOTQ1NX0.gqvEZ6DEan-whe72AB3tMCQYjP8VGBi2iqw4QuESW6E");
interface House { id: number; name: string; points: number; color: string; }

export default function HouseCup() {
  const [houses, setHouses] = useState<House[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [t, setT] = useState<string | null>(null);
  const [m, setM] = useState(false);
  const [st, setSt] = useState(1);
  const [sel, setSel] = useState<House | null>(null);
  const [pIn, setPIn] = useState(''); const [nIn, setNIn] = useState(''); const [ptsIn, setPtsIn] = useState('');
  const [err, setErr] = useState(''); const [isMounted, setIsMounted] = useState(false);
  const [activeCel, setActiveCel] = useState<'small' | 'big' | 'incredible' | null>(null);
  const [celColor, setCelColor] = useState('#fbbf24'); const [celText, setCelText] = useState('');

  async function load() {
    const { data: h } = await sb.from('houses').select('*');
    if (h) setHouses([...h].sort((a, b) => b.points - a.points));
    const { data: l } = await sb.from('logs').select('*').order('created_at', { ascending: false }).limit(5);
    if (l) setLogs([...l]);
  }

  useEffect(() => {
    load();
    const ch = sb.channel('db-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'houses' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'logs' }, () => load()).subscribe();
    const s = localStorage.getItem('cup_t'); if (s) { setT(s); setSt(3); }
    setIsMounted(true); return () => { sb.removeChannel(ch); };
  }, []);

  function playSound(tier: string) {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); const now = ctx.currentTime;
    if (tier === 'small') {
      const o = ctx.createOscillator(); const g = ctx.createGain(); o.frequency.setValueAtTime(587, now); o.frequency.exponentialRampToValueAtTime(880, now + 0.1);
      g.gain.setValueAtTime(0.08, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.15); o.connect(g); g.connect(ctx.destination); o.start(); o.stop(now + 0.15);
    } else if (tier === 'big') {
      [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
        const o = ctx.createOscillator(); const g = ctx.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(f, now + i * 0.06);
        g.gain.setValueAtTime(0.1, now + i * 0.06); g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.3); o.connect(g); g.connect(ctx.destination); o.start(now + i * 0.06); o.stop(now + i * 0.06 + 0.3);
      });
    } else {
      const o = ctx.createOscillator(); const g = ctx.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(220, now); o.frequency.exponentialRampToValueAtTime(1760, now + 0.8);
      const l = ctx.createOscillator(); const lg = ctx.createGain(); l.frequency.setValueAtTime(15, now); lg.gain.setValueAtTime(30, now); l.connect(lg); lg.connect(o.frequency);
      g.gain.setValueAtTime(0.12, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.9); o.connect(g); g.connect(ctx.destination); l.start(); o.start(); l.stop(now + 0.9); o.stop(now + 0.9);
    }
  }
  async function sub(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    if (st === 1) {
      if (pIn !== "school2026" && pIn !== "admin999") { setErr("Wrong password!"); return; }
      localStorage.setItem('cache_p', pIn); setSt(2); return;
    }
    if (st === 2) {
      if (!nIn.trim()) { setErr("Please enter your name."); return; }
      localStorage.setItem('cup_t', nIn.trim()); setT(nIn.trim()); setSt(3); return;
    }
    if (st === 3 && sel) {
      const pNum = parseInt(ptsIn, 10); if (isNaN(pNum) || pNum === 0) { setErr("Invalid points."); return; }
      if (pNum < 0 && localStorage.getItem('cache_p') !== "admin999") { setErr("Admins only!"); return; }
      await sb.from('houses').update({ points: Math.max(0, sel.points + pNum) }).eq('id', sel.id);
      await sb.from('logs').insert([{ teacher_name: t || "Teacher", house_name: sel.name, points_changed: pNum }]);
      if (pNum > 0) {
        setCelColor(sel.color === '#000000' || sel.color === 'black' ? '#ffffff' : sel.color || '#fbbf24');
        if (pNum < 100) { setActiveCel('small'); setCelText(`+${pNum} to ${sel.name}`); playSound('small'); setTimeout(() => setActiveCel(null), 1000); }
        else if (pNum <= 1000) { setActiveCel('big'); setCelText(`BIG SCORE: +${pNum} to ${sel.name}`); playSound('big'); setTimeout(() => setActiveCel(null), 2500); }
        else { setActiveCel('incredible'); setCelText(`INCREDIBLE: +${pNum} TO ${sel.name}!`); playSound('incredible'); setTimeout(() => setActiveCel(null), 4000); }
      }
      setM(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#05060b', backgroundImage: 'radial-gradient(circle at top, #14172a 0%, #07080f 70%, #030406 100%), radial-gradient(white, rgba(255,255,255,.2) 2px, transparent 40px), radial-gradient(white, rgba(255,255,255,.15) 1px, transparent 30px), radial-gradient(white, rgba(255,255,255,.1) 2px, transparent 40px)', backgroundSize: '100% 100%, 550px 550px, 350px 350px, 250px 250px', backgroundPosition: '0 0, 40px 60px, 130px 270px, 70px 150px', color: '#f8fafc', padding: '50px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: '"Inter", sans-serif', animation: 'subtleSpace 120s linear infinite', position: 'relative', overflowX: 'hidden' }}>
      <style>{`
        @keyframes subtleSpace { 0% { background-position: 0 0, 40px 60px, 130px 270px, 70px 150px; } 100% { background-position: 0 0, 590px 610px, 480px 620px, 320px 400px; } }
        @keyframes smallPop { 0% { transform: scale(0.6); opacity: 0; } 50% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 0; } }
        @keyframes bigBlast { 0% { transform: scale(0.2); opacity: 0; filter: blur(10px); } 15% { transform: scale(1.2); opacity: 1; filter: blur(0px); } 85% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.5); opacity: 0; filter: blur(20px); } }
        @keyframes incredibleSwell { 0% { transform: scale(0.1); opacity: 0; } 10% { transform: scale(1.3) rotate(15deg); opacity: 1; } 85% { transform: scale(1); opacity: 1; filter: drop-shadow(0 0 30px var(--glow)); } 100% { transform: scale(4); opacity: 0; filter: blur(40px); } }
        @keyframes screenFlash { 0% { opacity: 0; } 15% { opacity: 0.5; } 100% { opacity: 0; } }
      `}</style>

      <div style={{ width: '100%', maxWidth: '1200px', display: 'flex', justifyContent: 'flex-end', marginBottom: '45px', zIndex: 10 }}>
        {t ? (
          <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.4)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>Signed in as: <strong style={{ color: '#fff' }}>{t}</strong></span>
            <button onClick={() => { localStorage.clear(); setT(null); setSt(1); }} style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Sign Out</button>
          </div>
        ) : (
          <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '20px', fontSize: '0.85rem', color: '#94a3b8' }}><span>View Only Mode</span></div>
        )}
      </div>
      
      <div style={{ textAlign: 'center', marginBottom: '60px', zIndex: 10 }}>
        <h1 style={{ fontSize: '4rem', fontWeight: 900, color: '#fff', marginBottom: '8px', letterSpacing: '-0.02em' }}>House Cup Leaderboard</h1>
        <p style={{ color: '#475569', fontSize: '0.9rem', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.25em' }}>School Points</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '30px', width: '100%', maxWidth: '1200px', zIndex: 10 }}>
        {houses.map((h, idx) => {
          const fill = Math.min((h.points / 10000) * 100, 100); const isFirst = idx === 0 && h.points > 0;
          const hColor = h.color === '#000000' || h.color === 'black' ? '#ffffff' : h.color || '#fbbf24';
          return (
            <div key={h.id} style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', inset: '-10px', background: `radial-gradient(circle, ${hColor}15 0%, transparent 70%)`, filter: 'blur(15px)', pointerEvents: 'none' }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'rgba(15, 17, 26, 0.7)', backdropFilter: 'blur(12px)', padding: '32px 24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.04)', boxShadow: isFirst ? `0 20px 40px -10px ${hColor}20` : '0 10px 30px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
                {isFirst && <div style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid ${hColor}`, color: hColor, padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>Leader</div>}
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 4px 0', color: '#fff' }}>{h.name}</h2>
                <p style={{ fontSize: '2.5rem', fontWeight: 800, color: hColor, margin: '0 0 24px 0', display: 'flex', alignItems: 'baseline', gap: '4px', WebkitTextStroke: '1px #ffffff', filter: 'drop-shadow(0px 4px 12px rgba(0, 0, 0, 0.6))' }}>
                  {h.points.toLocaleString()} <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 500, WebkitTextStroke: '0px', marginLeft: '4px' }}>pts</span>
                </p>
                <div style={{ position: 'relative', width: '44px', height: '240px', borderRadius: '12px', backgroundColor: '#07080d', overflow: 'hidden', display: 'flex', flexDirection: 'column-reverse', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8)' }}>
                  <div style={{ width: '100%', transition: 'height 1.2s ease', background: `linear-gradient(0deg, ${hColor}99 0%, ${hColor}ff 100%)`, height: `${fill}%`, position: 'relative', boxShadow: `0 0 20px ${hColor}66` }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#fff', opacity: 0.7 }} />
                  </div>
                  <div style={{ position: 'absolute', top: 0, left: '4px', width: '15%', height: '100%', background: 'linear-gradient(to right, rgba(255, 255, 255, 0.08), transparent)' }} />
                </div>
                <button onClick={() => { setSel(h); setPtsIn(''); setPIn(''); setNIn(''); setErr(''); if (t) { setSt(3); } else { setSt(1); } setM(true); }} style={{ marginTop: '28px', backgroundColor: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255,255,255,0.05)', padding: '10px 20px', borderRadius: '10px', color: '#cbd5e1', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', width: '100%' }}>Change Points</button>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ width: '100%', maxWidth: '1200px', backgroundColor: '#0f111a', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '20px', padding: '24px', marginTop: '45px', boxSizing: 'border-box', zIndex: 10 }}>
        <h3 style={{ color: '#fff', margin: '0 0 20px 0', fontSize: '1.1rem', fontWeight: 700 }}>Recent Point Modifications</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {logs.length === 0 ? (
            <div style={{ color: '#475569', fontStyle: 'italic', textAlign: 'center', padding: '10px 0' }}>No point modifications recorded yet.</div>
          ) : (
            logs.map(l => {
              const isP = l.points_changed >= 0;
              return (
                <div key={l.id} style={{ padding: '14px 20px', backgroundColor: '#141622', border: '1px solid rgba(255,255,255,0.01)', borderRadius: '12px', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `3px solid ${isP ? '#10b981' : '#ef4444'}` }}>
                  <span style={{ color: '#cbd5e1' }}><strong style={{ color: '#fff' }}>{l.teacher_name}</strong> {isP ? 'added' : 'deducted'} <strong style={{ color: isP ? '#10b981' : '#ef4444', background: isP ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', padding: '2px 6px', borderRadius: '4px', margin: '0 4px' }}>{isP ? '+' : ''}{l.points_changed} pts</strong> to <strong>{l.house_name}</strong></span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {m && sel && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <form onSubmit={sub} style={{ backgroundColor: '#0f111a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '340px' }}>
            <h3 style={{ margin: '0 0 4px 0', color: '#fff', textAlign: 'center', fontSize: '1.35rem', fontWeight: 700 }}>Adjust {sel.name}</h3>
            <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '0.85rem', textAlign: 'center' }}>Current Balance: {sel.points.toLocaleString()} pts</p>
            {st === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Password</label>
                <input type="password" value={pIn} onChange={e => setPIn(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#141622', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', padding: '12px', borderRadius: '8px', outline: 'none' }} required />
              </div>
            )}
            {st === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Enter Name</label>
                <input type="text" value={nIn} onChange={e => setNIn(e.target.value)} placeholder="e.g. Mr. Smith" style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#141622', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', padding: '12px', borderRadius: '8px', outline: 'none' }} required />
              </div>
            )}
            {st === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Point Amount</label>
                <input type="number" value={ptsIn} onChange={e => setPtsIn(e.target.value)} placeholder="e.g. 100 or -50" style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#141622', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', padding: '14px 16px', borderRadius: '12px', outline: 'none' }} required />
              </div>
            )}
            {err && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '16px', textAlign: 'center', fontWeight: 600 }}>{err}</p>}
            <div style={{ display: 'flex', gap: '12px', marginTop: '30px' }}>
              <button type="button" onClick={() => setM(false)} style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', padding: '12px', borderRadius: '8px' }}>Cancel</button>
              <button type="submit" style={{ flex: 1, backgroundColor: '#fbbf24', border: 'none', color: '#000', padding: '12px', borderRadius: '8px', fontWeight: 700 }}>{st === 3 ? "Confirm" : "Next"}</button>
            </div>
          </form>
        </div>
      )}

      {activeCel === 'small' && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999 }}>
          <div style={{ padding: '20px 40px', backgroundColor: 'rgba(15, 23, 42, 0.95)', border: `2px solid ${celColor}`, color: '#fff', borderRadius: '20px', fontSize: '1.5rem', fontWeight: 800, animation: 'smallPop 1s ease-out forwards' }}>{celText}</div>
        </div>
      )}
      {activeCel === 'big' && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999 }}>
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle, ${celColor}22 0%, transparent 70%)`, animation: 'screenFlash 1.5s ease-out forwards' }} />
          <div style={{ padding: '30px 60px', backgroundColor: '#0d101b', border: `3px solid ${celColor}`, color: '#fff', borderRadius: '30px', fontSize: '2.25rem', fontWeight: 900, animation: 'bigBlast 2.5s ease forwards', textAlign: 'center' }}>{celText}</div>
        </div>
      )}
      {activeCel === 'incredible' && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999, '--glow': celColor } as any}>
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle, ${celColor}44 0%, transparent 60%)`, animation: 'screenFlash 3.5s infinite' }} />
          <div style={{ padding: '50px 80px', background: 'linear-gradient(135deg, #0d101b 0%, #151a30 100%)', border: `4px dashed ${celColor}`, color: celColor, borderRadius: '40px', fontSize: '3rem', fontWeight: 950, animation: 'incredibleSwell 4s ease forwards', textAlign: 'center' }}>{celText}</div>
        </div>
      )}
    </main>
  );
}
