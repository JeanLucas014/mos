// @ts-nocheck
import React, { useState, useMemo, useEffect, useCallback, useRef, Component } from "react";
import { supabase } from "../../lib/supabase";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Area, AreaChart, CartesianGrid, ComposedChart, Line, ReferenceLine
} from "recharts";

const MS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const MSH = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

const ACCENTS = {
  blue: { main: "#0EA5E9", bg: "rgba(14,165,233,.12)" },
  purple: { main: "#8b5cf6", bg: "rgba(139,92,246,.12)" },
  emerald: { main: "#10b981", bg: "rgba(16,185,129,.12)" },
  orange: { main: "#f97316", bg: "rgba(249,115,22,.12)" },
  rose: { main: "#f43f5e", bg: "rgba(244,63,94,.12)" },
  cyan: { main: "#06b6d4", bg: "rgba(6,182,212,.12)" },
};

const THEMES = {
  dark: {
    bg: "#0a0a0a", card: "#111111", border: "rgba(255,255,255,0.06)", bL: "#1f1f1f",
    tx: "#f5f5f5", dm: "#71717a", dm2: "#3f3f46",
    g: "#22c55e", gB: "rgba(34,197,94,0.1)",
    r: "#ef4444", rB: "rgba(239,68,68,0.08)",
    p: "#a78bfa", pB: "rgba(167,139,250,0.1)",
    a: "#f59e0b", aB: "rgba(245,158,11,0.08)",
    c: "#06b6d4", o: "#f97316", pk: "#ec4899",
    headerBg: "rgba(10,10,10,0.9)", optionBg: "#111111",
  },
  light: {
    bg: "#f1f5f9", card: "#ffffff", border: "#e2e8f0", bL: "#cbd5e1",
    tx: "#1e293b", dm: "#64748b", dm2: "#94a3b8",
    g: "#059669", gB: "rgba(5,150,105,.08)",
    r: "#dc2626", rB: "rgba(220,38,38,.08)",
    p: "#7c3aed", pB: "rgba(124,58,237,.08)",
    a: "#d97706", aB: "rgba(217,119,6,.08)",
    c: "#0891b2", o: "#ea580c", pk: "#db2777",
    headerBg: "rgba(241,245,249,.9)", optionBg: "#f8fafc",
  }
};

function buildC(theme, accent) {
  var base = THEMES[theme] || THEMES.dark;
  var ac = ACCENTS[accent] || ACCENTS.blue;
  return Object.assign({}, base, { b: ac.main, bB: ac.bg });
}

var C = buildC("dark", "blue");

const PC_BASE = ["#8b5cf6", "#f59e0b", "#06b6d4", "#f97316", "#ec4899", "#10b981", "#f43f5e", "#14b8a6", "#eab308"];


// Simple SVG icons (no emojis)
var IC = {
  grid: function() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>; },
  calendar: function() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; },
  target: function() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>; },
  trending: function() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>; },
  settings: function() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>; },
  plus: function() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; },
  trash: function() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>; },
  edit: function() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; },
  arrowUp: function() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="7 11 12 6 17 11"/><line x1="12" y1="6" x2="12" y2="18"/></svg>; },
  arrowDown: function() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="7 13 12 18 17 13"/><line x1="12" y1="18" x2="12" y2="6"/></svg>; },
  check: function() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>; },
  x: function() { return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; },
  chart: function() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>; },
  wallet: function() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="5" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>; },
  home: function() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>; },
  dollar: function() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>; },
};


const fmt = (v) => {
  if (v == null) return "R$ 0,00";
  const a = Math.abs(v);
  const f = a.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return v < 0 ? `-R$ ${f}` : `R$ ${f}`;
};

const fmtS = (v) => {
  if (!v) return "0";
  const a = Math.abs(v);
  return a >= 1000 ? `${v < 0 ? "-" : ""}${(a / 1000).toFixed(1)}k` : v.toFixed(0);
};

let _id = Date.now();
const uid = () => String(_id++);

/* ═══════════════════════════════════════ */
/*         INITIAL DATA                    */
/* ═══════════════════════════════════════ */
function buildInitMonths() {
  const d = {};
  d["Janeiro"] = {
    entradas: [{ id: uid(), nome: "Nata Business", valor: 2000 }, { id: uid(), nome: "Nata Custos", valor: 189 }, { id: uid(), nome: "Poupança", valor: 900 }, { id: uid(), nome: "Pintura AP", valor: 1000 }, { id: uid(), nome: "IPS", valor: 1525 }],
    fixas: [{ id: uid(), nome: "Condomínio", valor: 350 }, { id: uid(), nome: "Luz", valor: 150 }, { id: uid(), nome: "Internet", valor: 150 }, { id: uid(), nome: "Gás", valor: 35 }, { id: uid(), nome: "Pai", valor: 450, subs: [{ nome: "Casa", valor: 200 }, { nome: "Premier", valor: 20 }, { nome: "Carro", valor: 250 }] }, { id: uid(), nome: "Mãe", valor: 280, subs: [{ nome: "Imposto", valor: 100 }, { nome: "IPSEMG", valor: 50 }, { nome: "Webp (nata)", valor: 130 }] }, { id: uid(), nome: "Nubank Emp.", valor: 550 }, { id: uid(), nome: "Jota Celular", valor: 279 }],
    variaveis: [{ id: uid(), nome: "Pessoais", valor: 100 }, { id: uid(), nome: "Locomoção", valor: 150 }],
    cartoes_itens: [{ id: uid(), cartao: "Nubank", nome: "Renegociação", valor: 465 }, { id: uid(), cartao: "Nubank", nome: "Escola Breno", valor: 40 }, { id: uid(), cartao: "Nubank", nome: "Celular", valor: 160 }, { id: uid(), cartao: "Nubank", nome: "Chatgpt", valor: 115 }, { id: uid(), cartao: "Nubank", nome: "Decathlon", valor: 61 }, { id: uid(), cartao: "Nubank", nome: "Supermercado", valor: 144 }, { id: uid(), cartao: "Nubank", nome: "Uber", valor: 111 }, { id: uid(), cartao: "Bradesco", nome: "Origamid", valor: 39 }, { id: uid(), cartao: "Bradesco", nome: "Maratona BH", valor: 139 }, { id: uid(), cartao: "Bradesco", nome: "Tenis", valor: 269 }, { id: uid(), cartao: "Bradesco", nome: "Cavaquinho", valor: 54 }, { id: uid(), cartao: "Bradesco", nome: "Gasolina", valor: 72 }, { id: uid(), cartao: "Bradesco", nome: "Emp.", valor: 134.46 }]
  };
  d["Fevereiro"] = {
    entradas: [{ id: uid(), nome: "Nata Business", valor: 2003 }, { id: uid(), nome: "Nata Custos", valor: 224 }, { id: uid(), nome: "IPS", valor: 1600 }, { id: uid(), nome: "Caixa", valor: 250 }],
    fixas: [{ id: uid(), nome: "Condomínio", valor: 350 }, { id: uid(), nome: "Luz", valor: 100 }, { id: uid(), nome: "Pai", valor: 540 }, { id: uid(), nome: "Mãe", valor: 534 }, { id: uid(), nome: "Jota Celular", valor: 279 }, { id: uid(), nome: "Nubank Emp.", valor: 550 }, { id: uid(), nome: "Jota Bike", valor: 200 }, { id: uid(), nome: "Let", valor: 100 }, { id: uid(), nome: "Poupança", valor: 200 }],
    variaveis: [{ id: uid(), nome: "Pessoais", valor: 100 }, { id: uid(), nome: "Locomoção", valor: 100 }, { id: uid(), nome: "Mercado", valor: 700 }, { id: uid(), nome: "Lazer", valor: 150 }],
    cartoes_itens: [{ id: uid(), cartao: "Nubank", nome: "Renegociação", valor: 465 }, { id: uid(), cartao: "Nubank", nome: "Escola Breno", valor: 40 }, { id: uid(), cartao: "Nubank", nome: "Celular", valor: 160 }, { id: uid(), cartao: "Nubank", nome: "Strava", valor: 150 }, { id: uid(), cartao: "Nubank", nome: "Hamburguer", valor: 73 }, { id: uid(), cartao: "Nubank", nome: "Gasolina", valor: 257 }, { id: uid(), cartao: "Bradesco", nome: "Origamid", valor: 39 }, { id: uid(), cartao: "Bradesco", nome: "Tenis", valor: 269 }, { id: uid(), cartao: "Bradesco", nome: "Cavaquinho", valor: 54 }, { id: uid(), cartao: "Bradesco", nome: "Emp.", valor: 134 }, { id: uid(), cartao: "Bradesco", nome: "Juros", valor: 110 }, { id: uid(), cartao: "Bradesco", nome: "Tinta", valor: 121 }]
  };
  d["Março"] = {
    entradas: [{ id: uid(), nome: "Nata Business", valor: 2500 }, { id: uid(), nome: "Nata Custos", valor: 189 }, { id: uid(), nome: "Moto", valor: 1500 }, { id: uid(), nome: "IPS", valor: 1000 }],
    fixas: [{ id: uid(), nome: "Condomínio", valor: 350 }, { id: uid(), nome: "Luz", valor: 150 }, { id: uid(), nome: "Internet", valor: 140 }, { id: uid(), nome: "Pai", valor: 600 }, { id: uid(), nome: "Mãe", valor: 525 }, { id: uid(), nome: "Jota Celular", valor: 279 }, { id: uid(), nome: "Nubank Emp.", valor: 1100 }, { id: uid(), nome: "Jota Bike", valor: 200 }, { id: uid(), nome: "Poupança", valor: 200 }, { id: uid(), nome: "Let", valor: 200 }, { id: uid(), nome: "Sabrina", valor: 450 }],
    variaveis: [{ id: uid(), nome: "Pessoais", valor: 100 }, { id: uid(), nome: "Locomoção", valor: 150 }, { id: uid(), nome: "Mercado", valor: 500 }],
    cartoes_itens: [{ id: uid(), cartao: "Nubank", nome: "Renegociação", valor: 465 }, { id: uid(), cartao: "Nubank", nome: "Escola Breno", valor: 40 }, { id: uid(), cartao: "Nubank", nome: "Celular", valor: 160 }, { id: uid(), cartao: "Bradesco", nome: "Origamid", valor: 39 }, { id: uid(), cartao: "Bradesco", nome: "Tenis", valor: 269 }, { id: uid(), cartao: "Bradesco", nome: "Gasolina", valor: 160 }, { id: uid(), cartao: "Bradesco", nome: "Emp.", valor: 134 }, { id: uid(), cartao: "Bradesco", nome: "Privacy", valor: 76 }]
  };
  for (let i = 3; i < 12; i++) {
    d[MS[i]] = {
      entradas: [{ id: uid(), nome: "Nata Business", valor: 2000 }, { id: uid(), nome: "Nata Custos", valor: 189 }],
      fixas: [{ id: uid(), nome: "Condomínio", valor: 350 }, { id: uid(), nome: "Luz", valor: 150 }, { id: uid(), nome: "Internet", valor: 200 }, { id: uid(), nome: "Gás", valor: 35 }],
      variaveis: [{ id: uid(), nome: "Mercado", valor: 500 }, { id: uid(), nome: "Pessoais", valor: 150 }],
      cartoes_itens: []
    };
  }
  return d;
}

function buildInitDiario() {
  const raw = {
    "Janeiro": [
      { d: 1, e: 0, s: 0, di: 10, l: "Café" }, { d: 2, e: 2199, s: 869.98, di: 15.8, l: "Salário" },
      { d: 3, e: 0, s: 0, di: 0, l: "" }, { d: 4, e: 0, s: 0, di: 31, l: "Almoço" },
      { d: 5, e: 0, s: 2166.93, di: 0, l: "Cartão Nubank" }, { d: 6, e: 0, s: 0, di: 0, l: "" },
      { d: 7, e: 0, s: 0, di: 0, l: "" }, { d: 8, e: 0, s: 0, di: 0, l: "" },
      { d: 9, e: 0, s: 0, di: 15.9, l: "Uber" }, { d: 10, e: 900, s: 730, di: 26.5, l: "Poupança" },
      { d: 11, e: 0, s: 200, di: 12, l: "Jota Bike" }, { d: 12, e: 0, s: 0, di: 0, l: "" },
      { d: 13, e: 0, s: 0, di: 18, l: "Mercado" }, { d: 14, e: 0, s: 52, di: 0, l: "PicPay" },
      { d: 15, e: 0, s: 0, di: 43, l: "Lazer" }, { d: 16, e: 2525, s: 0, di: 96.03, l: "IPS" },
      { d: 17, e: 0, s: 500, di: 10.3, l: "Mãe" }, { d: 18, e: 0, s: 0, di: 10.3, l: "Café" },
      { d: 19, e: 0, s: 0, di: 50, l: "Mercado" }, { d: 20, e: 0, s: 0, di: 24.45, l: "Uber" },
      { d: 21, e: 0, s: 0, di: 148, l: "Corrida" }, { d: 22, e: 0, s: 0, di: 63.45, l: "Lazer" },
      { d: 23, e: 0, s: 0, di: 139.05, l: "Mercado" }, { d: 24, e: 0, s: 0, di: 48.9, l: "Gasolina" },
      { d: 25, e: 0, s: 0, di: 2, l: "" }, { d: 26, e: 0, s: 0, di: 0, l: "" },
      { d: 27, e: 0, s: 0, di: 30, l: "Diário" }, { d: 28, e: 0, s: 0, di: 0, l: "" },
      { d: 29, e: 0, s: 0, di: 0, l: "" }, { d: 30, e: 0, s: 0, di: 88.97, l: "Mercado" },
      { d: 31, e: 0, s: 550, di: 0, l: "Nubank Emp." }
    ],
    "Fevereiro": [
      { d: 1, e: 2003, s: 579, di: 25, l: "Salário" }, { d: 2, e: 224, s: 0, di: 88.22, l: "Nata Custos" },
      { d: 3, e: 0, s: 0, di: 0, l: "" }, { d: 4, e: 0, s: 0, di: 25.09, l: "Café" },
      { d: 5, e: 0, s: 2815.6, di: 160.78, l: "Cartões" }, { d: 6, e: 1600, s: 0, di: 40, l: "IPS" },
      { d: 7, e: 0, s: 200, di: 721.99, l: "Jota Bike" }, { d: 8, e: 0, s: 350, di: 21.7, l: "Condomínio" },
      { d: 9, e: 0, s: 0, di: 30, l: "Diário" }, { d: 10, e: 0, s: 1175.41, di: 30, l: "Contas" },
      { d: 11, e: 0, s: 0, di: 30, l: "Diário" }, { d: 12, e: 0, s: 0, di: 30, l: "Diário" },
      { d: 13, e: 500, s: 0, di: 30, l: "Extra" }, { d: 14, e: 0, s: 53, di: 30, l: "PicPay" },
      { d: 15, e: 0, s: 0, di: 30, l: "" }, { d: 16, e: 0, s: 0, di: 30, l: "" },
      { d: 17, e: 0, s: 0, di: 30, l: "" }, { d: 18, e: 0, s: 0, di: 30, l: "" },
      { d: 19, e: 0, s: 0, di: 30, l: "" }, { d: 20, e: 0, s: 0, di: 30, l: "" },
      { d: 21, e: 0, s: 0, di: 30, l: "" }, { d: 22, e: 0, s: 0, di: 30, l: "" },
      { d: 23, e: 0, s: 0, di: 30, l: "" }, { d: 24, e: 0, s: 0, di: 30, l: "" },
      { d: 25, e: 0, s: 0, di: 30, l: "" }, { d: 26, e: 0, s: 0, di: 30, l: "" },
      { d: 27, e: 0, s: 0, di: 30, l: "" }, { d: 28, e: 0, s: 0, di: 30, l: "" }
    ]
  };
  const result = {};
  for (const m of MS) {
    if (raw[m]) {
      let saldo = m === "Janeiro" ? 78.48 : -240.08;
      result[m] = raw[m].map((x) => {
        saldo = saldo + x.e - x.s - x.di;
        return { id: uid(), dia: x.d, entrada: x.e, saida: x.s, diario: x.di, label: x.l, saldo: Math.round(saldo * 100) / 100 };
      });
    } else {
      const numDays = new Date(2026, MS.indexOf(m) + 1, 0).getDate();
      const prevMonth = result[MS[MS.indexOf(m) - 1]];
      let saldo = prevMonth ? prevMonth[prevMonth.length - 1].saldo : 0;
      result[m] = Array.from({ length: numDays }, (_, i) => {
        saldo = saldo - 30;
        return { id: uid(), dia: i + 1, entrada: 0, saida: 0, diario: 30, label: "", saldo: Math.round(saldo * 100) / 100 };
      });
    }
  }
  return result;
}

/* ═══════════════════════════════════════ */
/*         EMPTY DATA (new users)          */
/* ═══════════════════════════════════════ */
function buildEmptyMonths() {
  var d = {};
  for (var i = 0; i < 12; i++) {
    d[MS[i]] = { entradas: [], fixas: [], variaveis: [], cartoes_itens: [] };
  }
  return d;
}

function buildEmptyDiario() {
  var result = {};
  for (var mi = 0; mi < 12; mi++) {
    var numDays = new Date(2026, mi + 1, 0).getDate();
    result[MS[mi]] = Array.from({ length: numDays }, function(_, i) {
      return { id: uid(), dia: i + 1, entrada: 0, saida: 0, diario: 0, label: "", saldo: 0 };
    });
  }
  return result;
}

/* ═══════════════════════════════════════ */
/*         UI COMPONENTS                   */
/* ═══════════════════════════════════════ */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div style={{ background: C.card, border: "1px solid " + C.bL, borderRadius: 8, padding: "10px 14px", fontSize: 12, boxShadow: "0 8px 32px rgba(0,0,0,.4)" }}>
      <p style={{ color: C.tx, fontWeight: 600, marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: "3px 0" }}>{p.name}: {fmt(p.value)}</p>
      ))}
    </div>
  );
}

function ENum({ value, onChange, color, w }) {
  const c = color || C.tx;
  const width = w || 75;
  const [ed, setEd] = useState(false);
  const [tmp, setTmp] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    if (ed && ref.current) ref.current.select();
  }, [ed]);

  const commit = () => {
    setEd(false);
    const n = parseFloat(tmp.replace(",", "."));
    if (!isNaN(n) && n !== value) onChange(n);
  };

  const startEdit = () => {
    setTmp(String(value || 0));
    setEd(true);
  };

  if (ed) {
    return (
      <input ref={ref} value={tmp}
        onChange={(e) => setTmp(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEd(false);
        }}
        style={{ background: "rgba(59,130,246,.15)", border: "1px solid " + C.b, borderRadius: 4, color: C.tx, padding: "2px 6px", fontSize: 11, fontFamily: "'JetBrains Mono',monospace", width: width, outline: "none", textAlign: "right" }}
      />
    );
  }
  return <span onClick={startEdit} style={{ cursor: "pointer", color: c, fontFamily: "'JetBrains Mono',monospace", fontSize: 12, padding: "4px 6px", borderRadius: 4, minHeight: 28, display: "inline-flex", alignItems: "center" }}>{fmt(value)}</span>;
}

function EText({ value, onChange, placeholder, w }) {
  const width = w || 120;
  const ph = placeholder || "";
  const [ed, setEd] = useState(false);
  const [tmp, setTmp] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    if (ed && ref.current) ref.current.focus();
  }, [ed]);

  const commit = () => {
    setEd(false);
    if (tmp !== value) onChange(tmp);
  };

  const startEdit = () => {
    setTmp(value || "");
    setEd(true);
  };

  if (ed) {
    return (
      <input ref={ref} value={tmp}
        onChange={(e) => setTmp(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEd(false);
        }}
        style={{ background: "rgba(59,130,246,.15)", border: "1px solid " + C.b, borderRadius: 4, color: C.tx, padding: "2px 6px", fontSize: 11, width: width, outline: "none" }}
        placeholder={ph}
      />
    );
  }
  return <span onClick={startEdit} style={{ cursor: "pointer", color: value ? C.tx : C.dm2, fontSize: 11, padding: "2px 4px" }}>{value || ph}</span>;
}

function Stat({ label, value, icon, color, sub }) {
  return (
    <div style={{ background: C.card, borderRadius: 14, padding: "18px 20px", border: "1px solid " + C.border, position: "relative", overflow: "hidden", transition: "transform .15s, box-shadow .15s" }} onMouseOver={function(e) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,.3)"; }} onMouseOut={function(e) { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
      <div style={{ position: "absolute", top: 16, right: 16, width: 8, height: 8, borderRadius: "50%", background: color }} />
      <div style={{ color: C.dm, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10, fontFamily: "'Sora',sans-serif" }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: color, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "-.3px" }}>{typeof value === "number" ? fmt(value) : value}</div>
      {sub ? <div style={{ color: C.dm2, fontSize: 10, marginTop: 6 }}>{sub}</div> : null}
    </div>
  );
}

function Section({ title, icon, children, action }) {
  return (
    <div style={{ background: C.card, borderRadius: 14, border: "1px solid " + C.border, overflow: "hidden", marginBottom: 16 }}>
      <div style={{ padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.tx, fontFamily: "'Sora',sans-serif" }}>{title}</h3>
        </div>
        {action}
      </div>
      <div style={{ padding: "14px 18px" }}>{children}</div>
    </div>
  );
}

function Btn({ children, onClick, color, small }) {
  const c = color || C.b;
  return (
    <button onClick={onClick} style={{ background: c + "20", border: "1px solid " + c + "40", color: c, padding: small ? "4px 8px" : "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: small ? 10 : 11, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 4 }}>
      {children}
    </button>
  );
}

/* ═══════════════════════════════════════ */
/*         MONTH TAB                       */
/* ═══════════════════════════════════════ */

// Mini day picker component
function DayPicker({ value, onChange, numDays }) {
  const [open, setOpen] = useState(false);
  var nd = numDays || 31;
  var days = [];
  for (var i = 1; i <= nd; i++) days.push(i);
  var val = parseInt(value) || 0;

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button onClick={function() { setOpen(!open); }} style={{ background: val > 0 ? "rgba(59,130,246,.1)" : "rgba(255,255,255,.03)", border: "1px solid " + (val > 0 ? "rgba(59,130,246,.3)" : "rgba(255,255,255,.08)"), borderRadius: 6, padding: "4px 8px", color: val > 0 ? "#3b82f6" : "#666", fontSize: 11, cursor: "pointer", minWidth: 36, textAlign: "center", fontFamily: "'JetBrains Mono',monospace" }}>
        {val > 0 ? (val < 10 ? "0" + val : val) : "—"}
      </button>
      {open && (
        <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", zIndex: 200, background: "#1e1e2e", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, padding: 8, marginTop: 4, boxShadow: "0 8px 24px rgba(0,0,0,.5)", width: 210 }}>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {days.map(function(d) {
              var isSelected = d === val;
              return <button key={d} onClick={function() { onChange(String(d)); setOpen(false); }} style={{ background: isSelected ? "#3b82f6" : "transparent", border: "none", borderRadius: 4, padding: "5px 2px", color: isSelected ? "#fff" : "#ccc", fontSize: 11, cursor: "pointer", fontWeight: isSelected ? 700 : 400 }} onMouseOver={function(e) { if (!isSelected) e.target.style.background = "rgba(255,255,255,.08)"; }} onMouseOut={function(e) { if (!isSelected) e.target.style.background = "transparent"; }}>{d}</button>;
            })}
          </div>
          <button onClick={function() { onChange(""); setOpen(false); }} style={{ width: "100%", marginTop: 4, padding: 4, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 4, color: "#888", fontSize: 9, cursor: "pointer" }}>Limpar</button>
        </div>
      )}
    </div>
  );
}

function MonthTab({ month, data, cartaosList, onUpdate, onAddCartao, duplicarMes, forceTab }) {
  const [tab, setTab] = useState("entradas");
  var activeTab = forceTab || tab;
  const [expanded, setExpanded] = useState({});
  const d = data || { entradas: [], fixas: [], variaveis: [], cartoes_itens: [] };

  function addItem(cat) {
    const item = { id: uid(), nome: "", valor: 0, dataPg: "", prioridade: "normal", pago: false };
    if (cat === "cartoes_itens") item.cartao = cartaosList[0] || "Nubank";
    const existing = d[cat] || [];
    onUpdate(month, { ...d, [cat]: [...existing, item] });
  }
  


  function upItem(cat, itemId, f, v) {
    const items = (d[cat] || []).map((it) => it.id === itemId ? { ...it, [f]: v } : it);
    onUpdate(month, { ...d, [cat]: items });
  }

  function rmItem(cat, itemId) {
    const items = (d[cat] || []).filter((it) => it.id !== itemId);
    onUpdate(month, { ...d, [cat]: items });
  }

  function recur(cat, item) {
    var mi = MS.indexOf(month);
    var opts = MS.slice(mi + 1).map(function(m, i) { return (mi + 2 + i) + " - " + m; }).join("\n");
    var choice = window.prompt("Repetir '" + (item.nome || "item") + "' ate qual mes?\n\n" + opts, "12");
    if (!choice) return;
    var endIdx = parseInt(choice) - 1;
    if (isNaN(endIdx) || endIdx <= mi || endIdx > 11) endIdx = 11;
    for (var i = mi + 1; i <= endIdx; i++) {
      onUpdate(MS[i], function (p) {
        var prev = p || { entradas: [], fixas: [], variaveis: [], cartoes_itens: [] };
        var existing = prev[cat] || [];
        var newItem = Object.assign({}, item, { id: uid() });
        delete newItem.subs;
        return Object.assign({}, prev, { [cat]: existing.concat([newItem]) });
      });
    }
  }

  // Sub-item functions for detailing (e.g. Pai -> Casa, Carro, Premier)
  function addSub(cat, itemId) {
    const items = (d[cat] || []).map(function(it) {
      if (it.id !== itemId) return it;
      var subs = (it.subs || []).concat([{ id: uid(), nome: "", valor: 0 }]);
      return Object.assign({}, it, { subs: subs });
    });
    onUpdate(month, { ...d, [cat]: items });
  }

  function upSub(cat, itemId, si, f, v) {
    const items = (d[cat] || []).map(function(it) {
      if (it.id !== itemId) return it;
      var subs = (it.subs || []).map(function(s, j) { return j === si ? Object.assign({}, s, { [f]: v }) : s; });
      var total = subs.reduce(function(a, s) { return a + (s.valor || 0); }, 0);
      return Object.assign({}, it, { subs: subs, valor: total > 0 ? total : it.valor });
    });
    onUpdate(month, Object.assign({}, d, { [cat]: items }));
  }

  function rmSub(cat, itemId, si) {
    const items = (d[cat] || []).map(function(it) {
      if (it.id !== itemId) return it;
      var subs = (it.subs || []).filter(function(_, j) { return j !== si; });
      var total = subs.reduce(function(a, s) { return a + (s.valor || 0); }, 0);
      return Object.assign({}, it, { subs: subs, valor: subs.length > 0 ? total : it.valor });
    });
    onUpdate(month, Object.assign({}, d, { [cat]: items }));
  }

  function toggleExpand(id) {
    setExpanded(function(prev) {
      var n = Object.assign({}, prev);
      n[id] = !n[id];
      return n;
    });
  }

  const totE = (d.entradas || []).reduce((a, b) => a + (b.valor || 0), 0);
  const totF = (d.fixas || []).reduce((a, b) => a + (b.valor || 0), 0);
  const totV = (d.variaveis || []).reduce((a, b) => a + (b.valor || 0), 0);
  const totC = (d.cartoes_itens || []).reduce((a, b) => a + (b.valor || 0), 0);
  const res = totE - totF - totV - totC;

  const tabs = [
    { id: "entradas", label: "Entradas", icon: "", color: C.g, t: totE },
    { id: "fixas", label: "Fixas", icon: "", color: C.r, t: totF },
    { id: "variaveis", label: "Variáveis", icon: "", color: C.a, t: totV },
    { id: "cartoes_itens", label: "Cartões", icon: "", color: C.p, t: totC }
  ];

  const isCart = activeTab === "cartoes_itens";
  const canExpand = activeTab === "fixas" || activeTab === "variaveis" || activeTab === "cartoes_itens";
  var rawItems = d[activeTab] || [];
  // Sort for display but use id-based updates
  const items = rawItems.slice().sort(function(a, b) {
    var da = parseInt(a.dataPg) || 99, db = parseInt(b.dataPg) || 99;
    return da - db;
  });
  const clr = tabs.find((t) => t.id === activeTab)?.color || C.b;
  const priColors = { alta: C.r, normal: C.a, baixa: C.g };

  return (
    <div>
      {!forceTab && <div className="stats-grid" style={{ gap: 8 }}>
        <Stat label="Entradas" value={totE} color={C.g} />
        <Stat label="Fixas" value={totF} color={C.r} />
        <Stat label="Variáveis" value={totV} color={C.a} />
        <Stat label="Cartões" value={totC} color={C.p} />
        <Stat label="Resultado" value={res} icon={res >= 0 ? "" : ""} color={res >= 0 ? C.g : C.r} />
      </div>}
      {!forceTab && <div style={{ marginBottom: 10 }}><Btn onClick={function() { duplicarMes(month); }} color={C.dm} small> Copiar estrutura para próximo mês</Btn></div>}
      {!forceTab && <div style={{ display: "flex", gap: 4, marginBottom: 12, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ background: tab === t.id ? t.color + "18" : "transparent", border: tab === t.id ? "1px solid " + t.color + "40" : "1px solid transparent", color: tab === t.id ? t.color : C.dm, padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, minHeight: 38, fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}>
            <span>{t.icon}</span>{t.label}<span style={{ fontSize: 9, opacity: 0.7 }}>({fmt(t.t)})</span>
          </button>
        ))}
      </div>}
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", background: C.card, borderRadius: 14, border: "1px solid " + C.border, overflow: "hidden" }}>
      <table className="monthtab-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: "2px solid " + C.border }}>
            {canExpand ? <th style={{ padding: "8px", width: 24 }}></th> : null}
            <th style={{ padding: "8px 12px", textAlign: "center", color: C.dm2, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>✓</th>
            {isCart ? <th style={{ padding: "8px", textAlign: "left", color: C.dm, fontSize: 10, width: 85 }}>Cartão</th> : null}
            <th style={{ padding: "8px 12px", textAlign: "left", color: C.dm2, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>Nome</th>
            <th style={{ padding: "8px 12px", textAlign: "right", color: C.dm2, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", width: 120 }}>Valor</th>
            <th style={{ padding: "8px 12px", textAlign: "center", color: C.dm2, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", width: 50 }}>Dia</th>
            <th style={{ padding: "8px 12px", textAlign: "center", color: C.dm2, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", width: 35 }}>Pri</th>
            <th style={{ padding: "8px 12px", textAlign: "right", color: C.dm2, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", width: 100 }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {items.map(function(it, i) {
            const isExp = expanded[it.id];
            const hasSubs = it.subs && it.subs.length > 0;
            const rows = [];
            rows.push(
              <tr key={it.id || i} style={{ opacity: it.pago ? 0.5 : 1 }}>
                {canExpand ? (
                  <td style={{ padding: "12px 8px", textAlign: "center" }}>
                    <button onClick={function() { toggleExpand(it.id); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: C.b }}>{isExp ? "▼" : (hasSubs ? "▶" : "·")}</button>
                  </td>
                ) : null}
                <td style={{ padding: "5px 4px", textAlign: "center" }}>
                  <input type="checkbox" checked={!!it.pago} onChange={function() { upItem(activeTab, it.id, "pago", !it.pago); }} style={{ cursor: "pointer", width: 14, height: 14, accentColor: C.g }} />
                </td>
                {isCart ? (
                  <td style={{ padding: "5px 8px" }}>
                    <select value={it.cartao || cartaosList[0]} onChange={(e) => upItem(activeTab, it.id, "cartao", e.target.value)} style={{ background: "rgba(255,255,255,.05)", border: "1px solid " + C.border, borderRadius: 4, color: C.tx, padding: "3px 6px", fontSize: 10, outline: "none" }}>
                      {cartaosList.map((cc) => <option key={cc} value={cc}>{cc}</option>)}
                    </select>
                  </td>
                ) : null}
                <td style={{ padding: "5px 8px" }}><EText value={it.nome} onChange={(v) => upItem(activeTab, it.id, "nome", v)} placeholder="Nome..." w={130} /></td>
                <td style={{ padding: "5px 8px", textAlign: "right" }}><ENum value={it.valor} onChange={(v) => upItem(activeTab, it.id, "valor", v)} color={clr} /></td>
                <td style={{ padding: "5px 4px", textAlign: "center" }}><DayPicker value={it.dataPg || ""} onChange={function(v) { upItem(activeTab, it.id, "dataPg", v); }} numDays={new Date(2026, MS.indexOf(month) + 1, 0).getDate()} /></td>
                <td style={{ padding: "5px 4px", textAlign: "center" }}>
                  <select value={it.prioridade || "normal"} onChange={function(e) { upItem(activeTab, it.id, "prioridade", e.target.value); }} style={{ background: "none", border: "none", fontSize: 10, color: priColors[it.prioridade || "normal"], cursor: "pointer", outline: "none" }}>
                    <option value="alta">●</option>
                    <option value="normal">●</option>
                    <option value="baixa">●</option>
                  </select>
                </td>
                <td style={{ padding: "5px 4px", textAlign: "center" }}>
                  {canExpand ? <button onClick={function() { addSub(activeTab, it.id); }} title="Detalhar" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, padding: 1, color: C.b }}>+</button> : null}
                  <button onClick={() => recur(activeTab, it)} title="Repetir nos próximos meses" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, padding: "4px 6px", minWidth: 28, minHeight: 28, color: C.dm }}>⟳</button>
                  <button onClick={function() { if (window.confirm("Remover " + (it.nome || "item") + "?")) rmItem(activeTab, it.id); }} title="Remover" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, padding: 1, color: C.r }}>✕</button>
                </td>
              </tr>
            );
            // Sub-items (expanded detail)
            if (canExpand && isExp) {
              (it.subs || []).forEach(function(sub, si) {
                rows.push(
                  <tr key={(it.id || i) + "-sub-" + si} style={{ background: "rgba(59,130,246,.04)", borderBottom: "1px solid " + C.border + "60" }}>
                    <td style={{ padding: "3px 4px" }}></td>
                    {isCart ? <td></td> : null}
                    <td style={{ padding: "3px 8px", paddingLeft: 28 }}>
                      <span style={{ color: C.dm2, fontSize: 10, marginRight: 4 }}>└</span>
                      <EText value={sub.nome} onChange={function(v) { upSub(activeTab, it.id, si, "nome", v); }} placeholder="Detalhe..." w={110} />
                    </td>
                    <td style={{ padding: "3px 8px", textAlign: "right" }}><ENum value={sub.valor} onChange={function(v) { upSub(activeTab, it.id, si, "valor", v); }} color={C.dm} w={65} /></td>
                    <td></td><td></td>
                    <td style={{ padding: "3px 4px", textAlign: "center" }}>
                      <button onClick={function() { rmSub(activeTab, it.id, si); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: C.dm2, minWidth: 28, minHeight: 28, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                    </td>
                  </tr>
                );
              });
              rows.push(
                <tr key={(it.id || i) + "-sub-add"} style={{ background: "rgba(59,130,246,.04)", borderBottom: "1px solid " + C.border }}>
                  <td colSpan={canExpand ? 7 : 6} style={{ padding: "3px 8px", paddingLeft: 36 }}>
                    <button onClick={function() { addSub(activeTab, it.id); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: C.b }}>+ detalhe</button>
                  </td>
                </tr>
              );
            }
            return rows;
          })}
        </tbody>
      </table>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <Btn onClick={() => addItem(activeTab)} color={clr} small>+ Adicionar</Btn>
        {isCart ? <Btn onClick={onAddCartao} color={C.c} small>+ Novo Cartão</Btn> : null}
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════ */
/*         DIARIO VIEW                     */
/* ═══════════════════════════════════════ */
// Saldo color coding based on value ranges
function saldoStyle(val) {
  if (val > 2000) return { bg: "#2d6a2e", color: "#fff" };
  if (val > 1000) return { bg: "#8bc34a", color: "#1a1a1a" };
  if (val > 0) return { bg: "#c8e6c9", color: "#1a1a1a" };
  if (val > -500) return { bg: "#ffcdd2", color: "#1a1a1a" };
  return { bg: "#c62828", color: "#fff" };
}



class ErrorWrap extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error: error }; }
  render() {
    if (this.state.error) {
      return React.createElement("div", { style: { padding: 40, textAlign: "center", color: "#ef4444" } },
        React.createElement("h3", null, "Erro ao renderizar"),
        React.createElement("p", { style: { fontSize: 12, color: "#64748b" } }, String(this.state.error.message)),
        React.createElement("button", { onClick: () => this.setState({ error: null }), style: { marginTop: 12, padding: "8px 16px", background: "#3b82f6", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer" } }, "Tentar novamente")
      );
    }
    return this.props.children;
  }
}

              function InvForm({ inv, setInv, C }) {
                
                
                var isRV = inv.tipo === "Renda Variável";
                var rfSubtipos = ["CDB", "LCI", "LCA", "Tesouro Direto", "Poupança"];
                var rvSubtipos = ["Ações", "FIIs", "Cripto"];
                var subtipos = isRV ? rvSubtipos : inv.tipo === "Previdência" ? ["Previdência"] : rfSubtipos;
                
                var fieldStyle = { width: "100%", background: "rgba(255,255,255,.05)", border: "1px solid " + C.border, borderRadius: 8, padding: "10px 12px", color: C.tx, fontSize: 13, outline: "none" };
                var labelStyle = { fontSize: 10, color: C.dm, marginBottom: 4, display: "block" };
                var rowStyle = { marginBottom: 10 };
                
                return (
                  <div>
                    <div style={rowStyle}>
                      <label style={labelStyle}>Nome</label>
                      <input value={inv.nome || ""} onChange={function(e) { setInv(Object.assign({}, inv, { nome: e.target.value })); }} placeholder="Ex: CDB Nubank 120% CDI" style={fieldStyle} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <div style={rowStyle}>
                        <label style={labelStyle}>Subtipo</label>
                        <select value={inv.subtipo || ""} onChange={function(e) { setInv(Object.assign({}, inv, { subtipo: e.target.value })); }} style={fieldStyle}>
                          {subtipos.map(function(s) { return <option key={s} value={s}>{s}</option>; })}
                        </select>
                      </div>
                      <div style={rowStyle}>
                        <label style={labelStyle}>Banco/Corretora</label>
                        <input value={inv.banco || ""} onChange={function(e) { setInv(Object.assign({}, inv, { banco: e.target.value })); }} placeholder="Nubank, XP..." style={fieldStyle} />
                      </div>
                    </div>
                    
                    {isRV ? (
                      <div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          <div style={rowStyle}>
                            <label style={labelStyle}>Ticker</label>
                            <input value={inv.ticker || ""} onChange={function(e) { setInv(Object.assign({}, inv, { ticker: e.target.value })); }} placeholder="PETR4, MXRF11..." style={fieldStyle} />
                          </div>
                          <div style={rowStyle}>
                            <label style={labelStyle}>Quantidade</label>
                            <input type="number" value={inv.quantidade || ""} onChange={function(e) { setInv(Object.assign({}, inv, { quantidade: parseFloat(e.target.value) || 0 })); }} style={fieldStyle} />
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          <div style={rowStyle}>
                            <label style={labelStyle}>Preço Pago (un)</label>
                            <input type="number" step="0.01" value={inv.precoPago || ""} onChange={function(e) { setInv(Object.assign({}, inv, { precoPago: parseFloat(e.target.value) || 0 })); }} style={fieldStyle} />
                          </div>
                          <div style={rowStyle}>
                            <label style={labelStyle}>Preço Atual (un)</label>
                            <input type="number" step="0.01" value={inv.precoAtual || ""} onChange={function(e) { setInv(Object.assign({}, inv, { precoAtual: parseFloat(e.target.value) || 0 })); }} style={fieldStyle} />
                          </div>
                        </div>
                        <div style={{ fontSize: 10, color: C.dm, marginBottom: 8 }}>Total investido: {fmt((inv.quantidade || 0) * (inv.precoPago || 0))}</div>
                      </div>
                    ) : (
                      <div>
                        <div style={rowStyle}>
                          <label style={labelStyle}>Valor Investido (R$)</label>
                          <input type="number" step="0.01" value={inv.valor || ""} onChange={function(e) { setInv(Object.assign({}, inv, { valor: parseFloat(e.target.value) || 0 })); }} style={fieldStyle} />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          <div style={rowStyle}>
                            <label style={labelStyle}>Tipo de Taxa</label>
                            <select value={inv.taxaTipo || "cdi"} onChange={function(e) { setInv(Object.assign({}, inv, { taxaTipo: e.target.value })); }} style={fieldStyle}>
                              <option value="cdi">% do CDI/Selic</option>
                              <option value="ipca">IPCA +</option>
                              <option value="pre">Prefixado</option>
                            </select>
                          </div>
                          <div style={rowStyle}>
                            <label style={labelStyle}>{inv.taxaTipo === "cdi" ? "% do CDI" : inv.taxaTipo === "ipca" ? "IPCA + %" : "Taxa % a.a."}</label>
                            <input type="number" step="0.01" value={inv.taxaTipo === "ipca" ? (inv.taxaFixa || "") : (inv.taxaValor || "")} onChange={function(e) { var v = parseFloat(e.target.value) || 0; if (inv.taxaTipo === "ipca") setInv(Object.assign({}, inv, { taxaFixa: v })); else setInv(Object.assign({}, inv, { taxaValor: v })); }} style={fieldStyle} />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <div style={rowStyle}>
                        <label style={labelStyle}>Data Aplicação</label>
                        <input type="date" value={inv.dataAplicacao || ""} onChange={function(e) { setInv(Object.assign({}, inv, { dataAplicacao: e.target.value })); }} style={fieldStyle} />
                      </div>
                      <div style={rowStyle}>
                        <label style={labelStyle}>Vencimento</label>
                        <input type="date" value={inv.vencimento || ""} onChange={function(e) { setInv(Object.assign({}, inv, { vencimento: e.target.value })); }} style={fieldStyle} />
                      </div>
                    </div>
                  </div>
                );
              }


function DiarioView({ mes, setMes, months, diario, upDiario, addEntry, rmEntry, avulsos, setAvulsos, updateMonth, upDiarioCol, addMensalFromDiario }) {
  var [viewMode, setViewMode] = useState("diarios");
  var [showViewMenu, setShowViewMenu] = useState(false);
  var viewModes = [
    { id: "entradas", label: "Entradas", color: C.g, letter: "E" },
    { id: "saidas", label: "Saídas", color: C.r, letter: "S" },
    { id: "diarios", label: "Diários", color: C.a, letter: "D" },
    { id: "todas", label: "Todas", color: C.dm, letter: "T" }
  ];
  var activeMode = viewModes.find(function(m) { return m.id === viewMode; }) || viewModes[2];
  var md = months[mes] || { entradas: [], fixas: [], variaveis: [], cartoes_itens: [] };
  var days = Array.isArray(diario[mes]) ? diario[mes] : [];
  var numDays = new Date(2026, MS.indexOf(mes) + 1, 0).getDate();

  // Build mensal items per day (entradas, fixas, cartoes - NOT variaveis)
  var mensalByDay = {};
  for (var dd = 1; dd <= numDays; dd++) mensalByDay[dd] = { entradas: [], saidas: [] };
  ["entradas"].forEach(function(cat) {
    (md[cat] || []).forEach(function(it) {
      var dia = parseInt(it.dataPg);
      if (dia >= 1 && dia <= numDays && (it.valor || 0) > 0) {
        mensalByDay[dia].entradas.push({ id: it.id, nome: it.nome, valor: it.valor, pago: !!it.pago, cat: cat });
      }
    });
  });
  ["fixas", "cartoes_itens"].forEach(function(cat) {
    (md[cat] || []).forEach(function(it) {
      var dia = parseInt(it.dataPg);
      if (dia >= 1 && dia <= numDays && (it.valor || 0) > 0) {
        mensalByDay[dia].saidas.push({ id: it.id, nome: it.nome, valor: it.valor, pago: !!it.pago, cat: cat, cartao: it.cartao });
      }
    });
  });

  // Avulsos per day
  var mesAvulsos = Array.isArray(avulsos[mes]) ? avulsos[mes] : [];

  // Compute carry from previous months
  var carry = 0;
  for (var mi = 0; mi < MS.indexOf(mes); mi++) {
    var pm = MS[mi];
    var pmd = months[pm] || {};
    var pnd = new Date(2026, mi + 1, 0).getDate();
    for (var pd = 1; pd <= pnd; pd++) {
      ["entradas"].forEach(function(cat) { (pmd[cat] || []).forEach(function(it) { if (parseInt(it.dataPg) === pd) carry += (it.valor || 0); }); });
      ["fixas","cartoes_itens"].forEach(function(cat) { (pmd[cat] || []).forEach(function(it) { if (parseInt(it.dataPg) === pd) carry -= (it.valor || 0); }); });
      var pAvulsos = Array.isArray(avulsos[pm]) ? avulsos[pm] : [];
      pAvulsos.filter(function(a) { return a.dia === pd; }).forEach(function(a) { if (a.tipo === "entrada") carry += a.valor; else carry -= a.valor; });
    }
  }

  // Build day rows with running saldo
  var daySaldos = [];
  var runSaldo = Math.round(carry * 100) / 100;
  for (var d = 1; d <= numDays; d++) {
    var mItems = mensalByDay[d];
    var entradaMensal = mItems.entradas.reduce(function(a, b) { return a + b.valor; }, 0);
    var saidaMensal = mItems.saidas.reduce(function(a, b) { return a + b.valor; }, 0);
    var dayAv = mesAvulsos.filter(function(a) { return a.dia === d; });
    var avEntrada = dayAv.filter(function(a) { return a.tipo === "entrada"; }).reduce(function(a, b) { return a + b.valor; }, 0);
    var avSaida = dayAv.filter(function(a) { return a.tipo !== "entrada"; }).reduce(function(a, b) { return a + b.valor; }, 0);
    var totalEntrada = entradaMensal + avEntrada;
    var totalSaida = saidaMensal + avSaida;
    runSaldo = runSaldo + totalEntrada - totalSaida;
    runSaldo = Math.round(runSaldo * 100) / 100;
    daySaldos.push({ dia: d, entrada: totalEntrada, saida: totalSaida, saldo: runSaldo, mensalE: mItems.entradas, mensalS: mItems.saidas, avulsos: dayAv });
  }

  var tE = daySaldos.reduce(function(a, d) { return a + d.entrada; }, 0);
  var tS = daySaldos.reduce(function(a, d) { return a + d.saida; }, 0);
  var tAv = mesAvulsos.reduce(function(a, b) { return a + b.valor; }, 0);
  var sf = daySaldos.length > 0 ? daySaldos[daySaldos.length - 1].saldo : 0;

  // Top gastos from labels
  var catMap = {};
  mesAvulsos.forEach(function(a) { if (a.nome && a.tipo !== "entrada") catMap[a.nome] = (catMap[a.nome] || 0) + a.valor; });
  daySaldos.forEach(function(d) { d.mensalS.forEach(function(it) { if (it.nome) catMap[it.nome] = (catMap[it.nome] || 0) + it.valor; }); });
  var topCats = Object.entries(catMap).sort(function(a, b) { return b[1] - a[1]; });  // show all

  var [popup, setPopup] = useState(null);
  var [addPopup, setAddPopup] = useState(null);

  function addAvulso(dia, nome, valor, tipo) {
    setAvulsos(function(prev) {
      var n = Object.assign({}, prev);
      n[mes] = (n[mes] || []).concat([{ id: uid(), dia: dia, nome: nome, valor: valor, tipo: tipo || "saida" }]);
      return n;
    });
  }

  function rmAvulso(avId) {
    setAvulsos(function(prev) {
      var n = Object.assign({}, prev);
      n[mes] = (n[mes] || []).filter(function(a) { return a.id !== avId; });
      return n;
    });
  }

  function updateMensalItem(itemId, newVal) {
    var newMd = Object.assign({}, md);
    ["entradas", "fixas", "variaveis", "cartoes_itens"].forEach(function(cat) {
      newMd[cat] = (newMd[cat] || []).map(function(it) {
        return it.id === itemId ? Object.assign({}, it, { valor: newVal }) : it;
      });
    });
    updateMonth(mes, newMd);
  }

  // Quick-add categories for diario gastos
  var quickCats = ["Mercado", "Gasolina", "Alimentação", "Uber", "Café", "Pessoais", "Lazer", "Farmácia", "Outro"];

  return (
    <div style={{ animation: "fadeIn .3s" }}>
      {/* Month selector */}
      

      <Section title={mes}>
    

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr className="desktop-only" style={{ borderBottom: "2px solid " + C.border }}>
                <th style={{ padding: "8px", textAlign: "left", color: C.dm, fontSize: 10, fontWeight: 600 }}>DIA</th>
                <th style={{ padding: "8px", textAlign: "right", color: C.dm, fontSize: 10, fontWeight: 600 }}>ENTRADA</th>
                <th style={{ padding: "8px", textAlign: "right", color: C.dm, fontSize: 10, fontWeight: 600 }}>SAÍDA</th>
                <th style={{ padding: "8px", textAlign: "right", color: C.dm, fontSize: 10, fontWeight: 600 }}>DIÁRIO</th>
                <th style={{ padding: "8px", textAlign: "right", color: C.dm, fontSize: 10, fontWeight: 600 }}>SALDO</th>
                <th style={{ padding: "8px 4px", textAlign: "center", color: C.g, fontSize: 10, fontWeight: 600 }}>AÇÃO</th>
              </tr>
              <tr className="mobile-only" style={{ borderBottom: "2px solid " + C.border }}>
                <th style={{ padding: "8px", textAlign: "left", color: C.dm, fontSize: 10, fontWeight: 600 }}>DIA</th>
                <th colSpan={3} style={{ padding: "8px" }}>
                  <button onClick={function() { setShowViewMenu(true); }} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.card, border: "1px solid " + C.border, borderRadius: 16, padding: "4px 12px 4px 4px", cursor: "pointer" }}>
                    <span style={{ width: 20, height: 20, borderRadius: "50%", background: activeMode.color, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff" }}>{activeMode.letter}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.tx }}>{activeMode.label}</span>
                    <span style={{ fontSize: 9, color: C.dm2 }}>▾</span>
                  </button>
                </th>
                <th style={{ padding: "8px", textAlign: "right", color: C.dm, fontSize: 10, fontWeight: 600 }}>SALDO</th>
                <th style={{ padding: "8px 4px", textAlign: "center", color: C.g, fontSize: 10, fontWeight: 600 }}>+</th>
              </tr>
            </thead>
            <tbody>
              {daySaldos.map(function(row) {
                var isToday = row.dia === (new Date().getMonth() === MS.indexOf(mes) ? new Date().getDate() : -1);
                var ss = saldoStyle(row.saldo);
                    var saldoBg = row.saldo > 200 ? C.gB : row.saldo > 0 ? C.aB : C.rB;
                var entLabel = row.mensalE.map(function(e) { return e.nome; }).join(", ");
                var saiLabel = row.mensalS.map(function(s) { return s.nome; }).join(", ");
                var hasPending = row.mensalE.some(function(e) { return !e.pago; }) || row.mensalS.some(function(s) { return !s.pago; });
                var dayAvulsosSaida = row.avulsos.filter(function(a) { return a.tipo !== "entrada"; });
                    var dayInvestimentos = row.avulsos.filter(function(a) { return a.tipo === "investimento"; });

                return (
                  <tr key={row.dia} style={{ borderBottom: "1px solid " + C.border, background: isToday ? C.bB : "transparent", verticalAlign: "top" }}>
                    {/* DIA */}
                    <td style={{ padding: "8px", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: isToday ? 700 : 400, color: isToday ? C.b : C.tx }}>{String(row.dia).padStart(2, "0")}</td>

                    {/* ENTRADA */}
                    <td className="desktop-only" style={{ padding: "8px", textAlign: "right", cursor: row.mensalE.length > 0 ? "pointer" : "default" }} onClick={function() { if (row.mensalE.length > 0) setPopup({ dia: row.dia, tipo: "entrada", items: row.mensalE, avulsos: row.avulsos.filter(function(a) { return a.tipo === "entrada"; }) }); }}>
                      {row.entrada > 0 ? <span style={{ color: C.g, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 600, borderBottom: row.mensalE.length > 0 ? "1px dashed " + C.g + "40" : "none" }} title={entLabel}>{fmt(row.entrada)}</span> : <span style={{ color: C.dm2, fontSize: 10 }}>—</span>}
                      {entLabel ? <div style={{ fontSize: 8, color: C.dm, marginTop: 1, maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entLabel}</div> : null}
                    </td>

                    {/* SAÍDA (desktop) */}
                    <td className="desktop-only" style={{ padding: "8px", textAlign: "right", cursor: row.mensalS.length > 0 ? "pointer" : "default" }} onClick={function() { if (row.mensalS.length > 0) setPopup({ dia: row.dia, tipo: "saida", items: row.mensalS, avulsos: [] }); }}>
                      {(row.saida - dayAvulsosSaida.reduce(function(a,b){return a+b.valor;},0)) > 0 ? <span style={{ color: C.r, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 600 }}>{fmt(row.saida - dayAvulsosSaida.reduce(function(a,b){return a+b.valor;},0))}</span> : <span style={{ color: C.dm2, fontSize: 10 }}>—</span>}
                      {saiLabel ? <div style={{ fontSize: 8, color: C.dm, marginTop: 1, maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{saiLabel}</div> : null}
                    </td>

                    {/* DIÁRIO (desktop - editable via upDiarioCol) */}
                    <td className="desktop-only" style={{ padding: "8px", textAlign: "right" }}>
                      {(function() {
                        var dayEntry = days.find(function(d) { return d.dia === row.dia; });
                        var diVal = dayEntry ? (dayEntry.diario || 0) : 0;
                        var diLabel = dayEntry ? (dayEntry.label || "") : "";
                        return (
                          <div>
                            <ENum value={diVal} onChange={function(v) { upDiarioCol(mes, row.dia, v); }} color={diVal > 0 ? C.a : C.dm2} w={68} />
                            {diLabel ? <div style={{ fontSize: 7, color: C.dm, marginTop: 1, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 100 }}>{diLabel}</div> : null}
                          </div>
                        );
                      })()}
                    </td>

                    {/* MOBILE: selector-based column */}
                    {viewMode === "entradas" && <td colSpan={3} className="mobile-only" style={{ padding: "8px", textAlign: "right" }}><span style={{ color: row.entrada > 0 ? C.g : C.dm2, fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>{row.entrada > 0 ? fmt(row.entrada) : "R$ 0,00"}</span></td>}
                    {viewMode === "saidas" && <td colSpan={3} className="mobile-only" style={{ padding: "8px", textAlign: "right" }}><span style={{ color: (row.saida - dayAvulsosSaida.reduce(function(a,b){return a+b.valor;},0)) > 0 ? C.r : C.dm2, fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>{(row.saida - dayAvulsosSaida.reduce(function(a,b){return a+b.valor;},0)) > 0 ? fmt(row.saida - dayAvulsosSaida.reduce(function(a,b){return a+b.valor;},0)) : "R$ 0,00"}</span></td>}
                    {viewMode === "diarios" && (function() { var de = days.find(function(d) { return d.dia === row.dia; }); var dv = de ? (de.diario || 0) : 0; return <td colSpan={3} className="mobile-only" style={{ padding: "8px", textAlign: "right" }}><span style={{ color: dv > 0 ? C.a : C.dm2, fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>{fmt(dv)}</span></td>; })()}
                    {viewMode === "todas" && <td colSpan={3} className="mobile-only" style={{ padding: "8px", textAlign: "right" }}><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: C.tx }}>{fmt(row.entrada + row.saida)}</span></td>}

                    {/* SALDO */}
                    <td style={{ padding: "8px", textAlign: "right" }}>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 600, padding: "2px 6px", borderRadius: 4, background: ss.bg, color: ss.color }}>{fmt(row.saldo)}</span>
                    </td>

                    {/* ADD BUTTON */}
                    <td style={{ padding: "8px 4px", textAlign: "center" }}>
                      <button onClick={function() { setAddPopup(row.dia); }} style={{ background: C.g + "15", border: "1px solid " + C.g + "40", borderRadius: 8, cursor: "pointer", fontSize: 11, color: C.g, padding: "4px 8px", minWidth: 36, minHeight: 32, fontWeight: 600 }}>+</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Items without date */}
        {(function() {
          var noDate = [];
          ["entradas","fixas","cartoes_itens"].forEach(function(cat) {
            (md[cat] || []).forEach(function(it) {
              var dia = parseInt(it.dataPg);
              if ((!dia || dia < 1 || dia > numDays) && (it.valor || 0) > 0) {
                noDate.push({ nome: it.nome, valor: it.valor, cat: cat });
              }
            });
          });
          if (noDate.length === 0) return null;
          return (
            <div style={{ marginTop: 12, padding: 10, background: "rgba(245,158,11,.05)", border: "1px solid " + C.a + "20", borderRadius: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.a, marginBottom: 4 }}> {noDate.length} itens sem data (defina no Mensal)</div>
              {noDate.map(function(it, i) {
                return <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 10, padding: "2px 0" }}>
                  <span style={{ color: C.dm }}>{it.nome}</span>
                  <span style={{ color: C.r, fontFamily: "'JetBrains Mono',monospace" }}>{fmt(it.valor)}</span>
                </div>;
              })}
            </div>
          );
        })()}
      </Section>

      {/* View Mode Selector Popup */}
      {showViewMenu && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 300, background: "rgba(0,0,0,.5)" }} onClick={function() { setShowViewMenu(false); }}>
          <div onClick={function(e) { e.stopPropagation(); }} style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.card, borderRadius: "20px 20px 0 0", padding: "20px 0 30px", maxWidth: 500, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 20px 16px", borderBottom: "1px solid " + C.border }}>
              <span style={{ fontSize: 18, fontWeight: 700 }}>Mostrar</span>
              <button onClick={function() { setShowViewMenu(false); }} style={{ background: "none", border: "none", color: C.dm, fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            {viewModes.map(function(m) {
              return <button key={m.id} onClick={function() { setViewMode(m.id); setShowViewMenu(false); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", width: "100%", background: viewMode === m.id ? "rgba(255,255,255,.03)" : "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,.03)", cursor: "pointer", color: C.tx, fontSize: 14, fontWeight: 500, fontFamily: "'Manrope',sans-serif", textAlign: "left" }}>
                <span style={{ width: 32, height: 32, borderRadius: "50%", background: m.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{m.letter}</span>
                {m.label}
              </button>;
            })}
          </div>
        </div>
      )}

      {/* Top Gastos */}
      {topCats.length > 0 && (
        <Section title="Top Gastos">
          {topCats.map(function(entry, i) {
            var maxVal = topCats[0][1];
            var pct = maxVal > 0 ? (entry[1] / maxVal) * 100 : 0;
            return (
              <div key={i} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 2 }}>
                  <span style={{ color: C.tx }}>{entry[0]}</span>
                  <span style={{ color: PC_BASE[i % PC_BASE.length], fontFamily: "'JetBrains Mono',monospace" }}>{fmt(entry[1])}</span>
                </div>
                <div style={{ height: 4, background: "rgba(255,255,255,.06)", borderRadius: 2 }}>
                  <div style={{ height: "100%", width: pct + "%", background: PC_BASE[i % PC_BASE.length], borderRadius: 2, transition: "width .4s" }} />
                </div>
              </div>
            );
          })}
        </Section>
      )}

      {/* Popup: View/edit mensal items */}
      {popup && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 400, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={function() { setPopup(null); }}>
          <div onClick={function(e) { e.stopPropagation(); }} style={{ background: C.bg, border: "1px solid " + C.border, borderRadius: 16, padding: 20, maxWidth: 400, width: "100%" }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: C.tx }}>
              {popup.tipo === "entrada" ? " Entradas" : popup.tipo === "diario" ? " Gastos Diários" : " Saídas"} — Dia {String(popup.dia).padStart(2, "0")}
            </div>
            {popup.items.map(function(it) {
              return (
                <div key={it.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid " + C.border }}>
                  <div>
                    <span style={{ fontSize: 12, color: C.tx }}>{it.nome}</span>
                    <span style={{ fontSize: 9, color: it.pago ? C.g : C.dm2, marginLeft: 6 }}>{it.pago ? "✓ pago" : "pendente"}</span>
                    {it.cartao && <span style={{ fontSize: 8, color: C.p, marginLeft: 4 }}>{it.cartao}</span>}
                  </div>
                  <ENum value={it.valor} onChange={function(v) { updateMensalItem(it.id, v); setPopup(null); }} color={popup.tipo === "entrada" ? C.g : C.r} w={80} />
                </div>
              );
            })}
            {popup.avulsos && popup.avulsos.map(function(av) {
              return (
                <div key={av.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid " + C.border }}>
                  <span style={{ fontSize: 12, color: C.tx }}>{av.nome} <span style={{ fontSize: 9, color: C.a }}>avulso</span></span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono',monospace", color: popup.tipo === "entrada" ? C.g : C.r }}>{fmt(av.valor)}</span>
                    <button onClick={function() { rmAvulso(av.id); setPopup(null); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: C.dm2 }}>✕</button>
                  </div>
                </div>
              );
            })}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", fontWeight: 700 }}>
              <span style={{ fontSize: 12, color: C.tx }}>Total</span>
              <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono',monospace", color: popup.tipo === "entrada" ? C.g : C.r }}>
                {fmt(popup.items.reduce(function(a, b) { return a + b.valor; }, 0) + (popup.avulsos || []).reduce(function(a, b) { return a + b.valor; }, 0))}
              </span>
            </div>
            <button onClick={function() { setPopup(null); }} style={{ width: "100%", marginTop: 14, padding: 12, background: C.bB, border: "1px solid " + C.b + "30", borderRadius: 10, color: C.b, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Fechar</button>
          </div>
        </div>
      )}

      {/* Popup: Add new item */}
      {addPopup && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 400, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={function() { setAddPopup(null); }}>
          <div onClick={function(e) { e.stopPropagation(); }} style={{ background: C.bg, border: "1px solid " + C.border, borderRadius: 16, padding: 20, maxWidth: 400, width: "100%" }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: C.tx }}>Adicionar — Dia {String(addPopup).padStart(2, "0")}</div>

            {/* Quick-add diario gastos */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.a, marginBottom: 8 }}> Gasto Diário</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                {quickCats.map(function(cat) {
                  return <button key={cat} onClick={function() {
                    var valor = parseFloat(window.prompt(cat + " — Valor R$:", "0"));
                    if (!isNaN(valor) && valor > 0) { addAvulso(addPopup, cat, valor, "saida"); setAddPopup(null); }
                  }} style={{ padding: "6px 10px", background: C.a + "12", border: "1px solid " + C.a + "30", borderRadius: 6, color: C.a, fontSize: 11, cursor: "pointer" }}>{cat}</button>;
                })}
              </div>
              <button onClick={function() {
                var nome = window.prompt("Nome do gasto:");
                if (!nome) return;
                var valor = parseFloat(window.prompt("Valor R$:", "0"));
                if (!isNaN(valor) && valor > 0) { addAvulso(addPopup, nome, valor, "saida"); setAddPopup(null); }
              }} style={{ width: "100%", padding: 10, background: "rgba(255,255,255,.03)", border: "1px dashed " + C.border, borderRadius: 8, color: C.dm, fontSize: 11, cursor: "pointer" }}>+ Outro gasto personalizado</button>
            </div>

            {/* Add entrada/saida that goes to mensal */}
            <div style={{ borderTop: "1px solid " + C.border, paddingTop: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.g, marginBottom: 8 }}> Entrada (vai pro Mensal)</div>
              <button onClick={function() {
                var nome = window.prompt("Nome da entrada (ex: Salário, Freelance):");
                if (!nome) return;
                var valor = parseFloat(window.prompt("Valor R$:", "0"));
                if (!isNaN(valor) && valor > 0) { addMensalFromDiario(mes, "entradas", nome, valor, addPopup); setAddPopup(null); }
              }} style={{ width: "100%", padding: 10, background: C.g + "08", border: "1px solid " + C.g + "30", borderRadius: 8, color: C.g, fontSize: 11, cursor: "pointer", marginBottom: 10 }}>+ Adicionar entrada</button>

              <div style={{ fontSize: 11, fontWeight: 600, color: C.r, marginBottom: 8 }}> Saída Fixa (vai pro Mensal)</div>
              <button onClick={function() {
                var nome = window.prompt("Nome da saída (ex: Condomínio, Conta extra):");
                if (!nome) return;
                var valor = parseFloat(window.prompt("Valor R$:", "0"));
                if (!isNaN(valor) && valor > 0) { addMensalFromDiario(mes, "fixas", nome, valor, addPopup); setAddPopup(null); }
              }} style={{ width: "100%", padding: 10, background: C.r + "08", border: "1px solid " + C.r + "30", borderRadius: 8, color: C.r, fontSize: 11, cursor: "pointer" }}>+ Adicionar saída fixa</button>
            </div>

            <div style={{ fontSize: 11, fontWeight: 600, color: C.b, marginBottom: 8, marginTop: 8 }}> Investimento / Poupança</div>
            <button onClick={function() {
              var nome = window.prompt("Descrição (ex: Aporte CDB, Poupança):");
              if (!nome) return;
              var valor = parseFloat(window.prompt("Valor R$:", "0"));
              if (!isNaN(valor) && valor > 0) { addAvulso(addPopup, " " + nome, valor, "investimento"); setAddPopup(null); }
            }} style={{ width: "100%", padding: 10, background: C.b + "08", border: "1px solid " + C.b + "30", borderRadius: 10, color: C.b, fontSize: 12, cursor: "pointer" }}>+ Saída para Investimento</button>

            <button onClick={function() { addAvulso(addPopup, "Sem gastos", 0, "saida"); setAddPopup(null); }} style={{ width: "100%", marginTop: 10, padding: 12, background: "rgba(16,185,129,.05)", border: "1px solid " + C.g + "30", borderRadius: 10, color: C.g, fontSize: 12, cursor: "pointer" }}>✓ Nada hoje (zerar)</button>
            <button onClick={function() { setAddPopup(null); }} style={{ width: "100%", marginTop: 6, padding: 12, background: "rgba(255,255,255,.03)", border: "1px solid " + C.border, borderRadius: 10, color: C.dm, fontSize: 12, cursor: "pointer" }}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════ */
/*         MAIN APP                        */
/* ═══════════════════════════════════════ */
function Dashboard({ session = null }) {
  const [ano, setAno] = useState(new Date().getFullYear());
  const [months, setMonths] = useState(function() { return buildEmptyMonths(); });
  const [diario, setDiario] = useState(function() { return buildEmptyDiario(); });
  const [cartaosList, setCartaosList] = useState([]);
  const currentMonthIdx = new Date().getMonth();
  const currentMonthName = MS[currentMonthIdx] || "Janeiro";
  const [view, setView] = useState("overview");
  const [diarioMes, setDiarioMes] = useState(currentMonthName);
  const [monthTab, setMonthTab] = useState(currentMonthName);
  const [mesesSubTab, setMesesSubTab] = useState("diadia");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [newCartao, setNewCartao] = useState("");
  const [showAddCartao, setShowAddCartao] = useState(false);
  const [dividas, setDividas] = useState([]);
  const [metas, setMetas] = useState([]);
  const [investimentos, setInvestimentos] = useState(function() {
    var inv = {};
    MS.forEach(function(m) { inv[m] = { economia: 0 }; });
    return inv;
  });
  // Theme & Settings
  const [theme, setTheme] = useState("dark");
  const [accent, setAccent] = useState("blue");
  const [settings, setSettings] = useState({ nome: "", email: session?.user?.email || "", metaEconomia: 10 });
  const [orcamentos, setOrcamentos] = useState({});
  const [orcBase, setOrcBase] = useState({ total: 0, categorias: [] });
  const [orcMeses, setOrcMeses] = useState({});
  const [filtroMeses, setFiltroMeses] = useState("ano");
  const [busca, setBusca] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [avulsos, setAvulsos] = useState({});
  const [carteira, setCarteira] = useState([]);
  const [editInv, setEditInv] = useState(null);
  const [addInv, setAddInv] = useState(null);
  const [aportePopup, setAportePopup] = useState(null);
  const [taxaSelic, setTaxaSelic] = useState(15); // Taxa Selic anual

  // Rebuild C whenever theme/accent changes
  C = buildC(theme, accent);
  const PC = [C.b].concat(PC_BASE);

  const userId = session?.user?.id;

  useEffect(() => {
    document.body.style.fontFamily = "'Manrope', sans-serif";
  }, []);

  // Register service worker for PWA
  useEffect(function() {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(function() {});
    }
  }, []);

  function resetToEmpty() {
    setMonths(buildEmptyMonths());
    setDiario(buildEmptyDiario());
    setDividas([]);
    setMetas([]);
    setOrcamentos({});
    setInvestimentos(function() { var inv = {}; MS.forEach(function(m) { inv[m] = { economia: 0 }; }); return inv; });
  }

  useEffect(() => {
    async function loadData() {
      if (!userId) return;
      setLoaded(false);
      try {
        // Try loading year-specific data first
        var result = await supabase.from("financeiro").select("payload").eq("id", String(ano)).eq("user_id", userId);
        var rows = (result.data || []);
        
        if (rows.length > 0 && rows[0].payload) {
          var d = typeof rows[0].payload === "string" ? JSON.parse(rows[0].payload) : rows[0].payload;
          if (d.months) setMonths(d.months); else setMonths(buildEmptyMonths());
          if (d.diario) setDiario(d.diario); else setDiario(buildEmptyDiario());
          if (d.cartaosList) setCartaosList(d.cartaosList);
          if (d.dividas) setDividas(d.dividas); else setDividas([]);
          if (d.metas) setMetas(d.metas); else setMetas([]);
          if (d.investimentos) setInvestimentos(d.investimentos); else setInvestimentos(function() { var inv = {}; MS.forEach(function(m) { inv[m] = { economia: 0 }; }); return inv; });
          if (d.theme) setTheme(d.theme);
          if (d.accent) setAccent(d.accent);
          if (d.settings) setSettings(d.settings);
          if (d.orcamentos) setOrcamentos(d.orcamentos); else setOrcamentos({});
          if (d.avulsos) setAvulsos(d.avulsos); else setAvulsos({});
          if (d.carteira) setCarteira(d.carteira); else setCarteira([]);
          if (d.taxaSelic) setTaxaSelic(d.taxaSelic);
          if (d.orcBase) setOrcBase(d.orcBase);
          if (d.orcMeses) setOrcMeses(d.orcMeses);
        } else if (ano === 2026) {
          // Try migrate from old "main" id
          var oldResult = await supabase.from("financeiro").select("payload").eq("id", "main").eq("user_id", userId);
          var oldRows = (oldResult.data || []);
          if (oldRows.length > 0 && oldRows[0].payload) {
            var od = typeof oldRows[0].payload === "string" ? JSON.parse(oldRows[0].payload) : oldRows[0].payload;
            if (od.months) setMonths(od.months);
            if (od.diario) setDiario(od.diario);
            if (od.cartaosList) setCartaosList(od.cartaosList);
            if (od.dividas) setDividas(od.dividas);
            if (od.metas) setMetas(od.metas);
            if (od.investimentos) setInvestimentos(od.investimentos);
            if (od.theme) setTheme(od.theme);
            if (od.accent) setAccent(od.accent);
            if (od.settings) setSettings(od.settings);
            if (od.orcamentos) setOrcamentos(od.orcamentos);
            if (od.avulsos) setAvulsos(od.avulsos);
            if (od.carteira) setCarteira(od.carteira);
            if (od.taxaSelic) setTaxaSelic(od.taxaSelic);
            if (od.orcBase) setOrcBase(od.orcBase);
            if (od.orcMeses) setOrcMeses(od.orcMeses);
            // Save under new "2026" id
            try { await supabase.from("financeiro").upsert({ id: "2026", user_id: userId, payload: od, updated_at: new Date().toISOString() }); } catch(ue) {}
          } else {
            resetToEmpty();
          }
        } else {
          resetToEmpty();
        }
      } catch (e) {
        console.error("Load error:", e);
        resetToEmpty();
      }
      setLoaded(true);
    }
    loadData();
  }, [userId, ano]);

  // Auto-show tutorial for brand new users
  useEffect(function() {
    if (loaded && months) {
      var hasData = false;
      MS.forEach(function(m) {
        var md = months[m] || {};
        if ((md.entradas || []).length > 0 || (md.fixas || []).length > 0) hasData = true;
      });
      if (!hasData) setShowTutorial(true);
    }
  }, [loaded]);

  const save = useCallback(async (m, d, cl) => {
    if (!userId) return;
    setSaving(true);
    try {
      const payload = { months: m, diario: d, cartaosList: cl, dividas, metas, investimentos, theme, accent, settings, orcamentos, avulsos, carteira, taxaSelic, orcBase, orcMeses };
      await supabase.from("financeiro").upsert({ id: String(ano), user_id: userId, payload, updated_at: new Date().toISOString() });
    } catch (e) { }
    setTimeout(() => setSaving(false), 600);
  }, [dividas, metas, investimentos, theme, accent, settings, orcamentos, avulsos, carteira, taxaSelic, orcBase, orcMeses, userId, ano]);

  // Export CSV
  function exportCSV() {
    var header = "Mês,Entradas,Fixas,Dívidas,Variáveis,Cartão,Resultado\n";
    var rows = overview.map(function(r) {
      return [r.mes, r.entradas, r.fixas - r.dividas, r.dividas, r.variaveis, r.cartao, r.resultado].join(",");
    }).join("\n");
    var blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = "financeiro_" + ano + ".csv"; a.click();
    URL.revokeObjectURL(url);
  }

  // Backup JSON
  function exportBackup() {
    var payload = { ano: ano, months: months, diario: diario, avulsos: avulsos || {}, cartaosList: cartaosList, dividas: dividas, metas: metas, investimentos: investimentos, orcamentos: orcamentos, settings: settings, theme: theme, accent: accent };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = "backup_financeiro_" + ano + ".json"; a.click();
    URL.revokeObjectURL(url);
  }

  // Import JSON backup
  function importBackup() {
    var input = document.createElement("input");
    input.type = "file"; input.accept = ".json";
    input.onchange = function(e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(ev) {
        try {
          var d = JSON.parse(ev.target.result);
          if (!window.confirm("Isso vai substituir TODOS os dados de " + ano + ". Continuar?")) return;
          if (d.months) setMonths(d.months);
          if (d.diario) setDiario(d.diario);
          if (d.cartaosList) setCartaosList(d.cartaosList);
          if (d.dividas) setDividas(d.dividas);
          if (d.metas) setMetas(d.metas);
          if (d.investimentos) setInvestimentos(d.investimentos);
          if (d.orcamentos) setOrcamentos(d.orcamentos);
          if (d.settings) setSettings(d.settings);
          if (d.theme) setTheme(d.theme);
          if (d.accent) setAccent(d.accent);
          // Force save
          setTimeout(function() { save(d.months || months, d.diario || diario, d.cartaosList || cartaosList); }, 500);
        } catch (err) { alert("Arquivo inválido!"); }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  function updateMonth(month, dataOrFn) {
    setMonths((prev) => {
      const n = { ...prev };
      if (typeof dataOrFn === "function") {
        n[month] = dataOrFn(n[month] || { entradas: [], fixas: [], variaveis: [], cartoes_itens: [] });
      } else {
        n[month] = dataOrFn;
      }
      save(n, diario, cartaosList);
      return n;
    });
  }

  // Recalculate saldos across ALL months for continuous flow
  function recalcAllSaldos(allDiario) {
    try {
      var result = Object.assign({}, allDiario);
      var carry = 0;
      for (var mi = 0; mi < 12; mi++) {
        var m = MS[mi];
        var days = result[m];
        if (!days || !Array.isArray(days) || days.length === 0) continue;
        var updated = [];
        for (var i = 0; i < days.length; i++) {
          var d = days[i] || {};
          var entrada = Number(d.entrada) || 0;
          var saida = Number(d.saida) || 0;
          var diarioVal = Number(d.diario) || 0;
          var saldo = carry + entrada - saida - diarioVal;
          saldo = Math.round(saldo * 100) / 100;
          updated.push(Object.assign({}, d, { saldo: saldo }));
          carry = saldo;
        }
        result[m] = updated;
      }
      return result;
    } catch(e) {
      console.error("recalcAllSaldos error:", e);
      return allDiario;
    }
  }

  function addMensalFromDiario(mes, cat, nome, valor, dia) {
    setMonths(function(prev) {
      var n = Object.assign({}, prev);
      var md = Object.assign({}, n[mes] || { entradas: [], fixas: [], variaveis: [], cartoes_itens: [] });
      md[cat] = (md[cat] || []).concat([{ id: uid(), nome: nome, valor: valor, dataPg: String(dia), prioridade: "normal", pago: true }]);
      n[mes] = md;
      save(n, diario, cartaosList);
      return n;
    });
  }

  function upDiarioCol(mes, dia, val) {
    setDiario(function(prev) {
      var updated = Object.assign({}, prev);
      var arr = (updated[mes] || []).slice();
      var dayIdx = arr.findIndex(function(d) { return d.dia === dia; });
      if (dayIdx >= 0) {
        arr[dayIdx] = Object.assign({}, arr[dayIdx], { diario: val });
      } else {
        arr.push({ id: uid(), dia: dia, entrada: 0, saida: 0, diario: val, label: "", saldo: 0 });
        arr.sort(function(a, b) { return a.dia - b.dia; });
      }
      updated[mes] = arr;
      updated = recalcAllSaldos(updated);
      save(months, updated, cartaosList);
      return updated;
    });
  }

  function upDiario(mes, idx, f, v) {
    setDiario((prev) => {
      var updated = Object.assign({}, prev);
      updated[mes] = prev[mes].map((d, i) => i === idx ? { ...d, [f]: v } : d);
      if (["entrada", "saida", "diario"].includes(f)) {
        updated = recalcAllSaldos(updated);
      }
      save(months, updated, cartaosList);
      return updated;
    });
  }

  function syncMensalDiario(mes) {
    var md = months[mes] || {};
    var changes = [];
    ["entradas", "fixas", "variaveis", "cartoes_itens"].forEach(function(cat) {
      (md[cat] || []).forEach(function(it) {
        if (it.pago && it.dataPg && it.valor > 0) {
          var dia = parseInt(it.dataPg);
          if (dia >= 1 && dia <= 31) {
            var isEntrada = cat === "entradas";
            changes.push({ dia: dia, valor: it.valor, nome: it.nome || "", isEntrada: isEntrada });
          }
        }
      });
    });
    if (changes.length === 0) { alert("Nenhum item marcado como pago com data para sincronizar."); return; }
    if (!window.confirm("Sincronizar " + changes.length + " itens pagos para o diário de " + mes + "?")) return;
    setDiario(function(prev) {
      var updated = Object.assign({}, prev);
      var days = (updated[mes] || []).map(function(d) { return Object.assign({}, d); });
      changes.forEach(function(ch) {
        var dayIdx = days.findIndex(function(d) { return d.dia === ch.dia; });
        if (dayIdx >= 0) {
          if (ch.isEntrada) {
            days[dayIdx].entrada = (days[dayIdx].entrada || 0) + ch.valor;
            if (!days[dayIdx].labelEntrada) days[dayIdx].labelEntrada = ch.nome;
          } else {
            days[dayIdx].saida = (days[dayIdx].saida || 0) + ch.valor;
            if (!days[dayIdx].labelSaida) days[dayIdx].labelSaida = ch.nome;
          }
        }
      });
      updated[mes] = days;
      updated = recalcAllSaldos(updated);
      save(months, updated, cartaosList);
      return updated;
    });
    alert(changes.length + " itens sincronizados!");
  }

  function addDiarioEntry(mes) {
    setDiario((prev) => {
      const days = prev[mes] || [];
      const lastDay = days.length > 0 ? days[days.length - 1].dia : 0;
      const lastSaldo = days.length > 0 ? days[days.length - 1].saldo : 0;
      const n = { ...prev, [mes]: [...days, { id: uid(), dia: lastDay + 1, entrada: 0, saida: 0, diario: 0, label: "", saldo: lastSaldo }] };
      save(months, n, cartaosList);
      return n;
    });
  }

  function rmDiarioEntry(mes, idx) {
    setDiario((prev) => {
      var updated = Object.assign({}, prev);
      updated[mes] = prev[mes].filter((_, i) => i !== idx);
      updated = recalcAllSaldos(updated);
      save(months, updated, cartaosList);
      return updated;
    });
  }

  function duplicarMes(mesSrc) {
    var srcIdx = MS.indexOf(mesSrc);
    if (srcIdx >= 11) { alert("Não há mês seguinte!"); return; }
    var mesDst = MS[srcIdx + 1];
    if (!window.confirm("Copiar estrutura de " + mesSrc + " para " + mesDst + "? (só nomes, sem valores)")) return;
    var src = months[mesSrc] || {};
    var dst = {};
    ["entradas", "fixas", "variaveis", "cartoes_itens"].forEach(function(cat) {
      dst[cat] = (src[cat] || []).map(function(it) {
        var copy = { id: uid(), nome: it.nome, valor: 0, dataPg: it.dataPg, prioridade: it.prioridade || "normal", pago: false };
        if (it.cartao) copy.cartao = it.cartao;
        return copy;
      });
    });
    setMonths(function(prev) {
      var n = Object.assign({}, prev);
      n[mesDst] = dst;
      save(n, diario, cartaosList);
      return n;
    });
    alert("Estrutura copiada para " + mesDst + "!");
  }

  function addCartao() {
    if (newCartao.trim() && !cartaosList.includes(newCartao.trim())) {
      const n = [...cartaosList, newCartao.trim()];
      setCartaosList(n);
      setNewCartao("");
      setShowAddCartao(false);
      save(months, diario, n);
    }
  }

  const overview = useMemo(() => MS.map((m, mi) => {
    const d = months[m] || { entradas: [], fixas: [], variaveis: [], cartoes_itens: [] };
    const e = (d.entradas || []).reduce((a, b) => a + (b.valor || 0), 0);
    const f = (d.fixas || []).reduce((a, b) => a + (b.valor || 0), 0);
    const v = (d.variaveis || []).reduce((a, b) => a + (b.valor || 0), 0);
    const c = (d.cartoes_itens || []).reduce((a, b) => a + (b.valor || 0), 0);
    // Dívidas: apenas visualização, NÃO somam nas fixas
    const dv = (dividas || []).reduce(function(a, dv) { return a + ((mi >= dv.inicio && mi <= dv.fim) ? (dv.parcela || 0) : 0); }, 0);
    return { mes: m, entradas: e, fixas: f, despesas: f + c, variaveis: v, diario: v, cartao: c, resultado: e - f - v - c, dividas: dv };
  }), [months, dividas]);

  const filteredOverview = useMemo(function() {
    if (filtroMeses === "ano") return overview;
    if (filtroMeses === "t1") return overview.slice(0, 3);
    if (filtroMeses === "t2") return overview.slice(3, 6);
    if (filtroMeses === "t3") return overview.slice(6, 9);
    if (filtroMeses === "t4") return overview.slice(9, 12);
    if (filtroMeses === "s1") return overview.slice(0, 6);
    if (filtroMeses === "s2") return overview.slice(6, 12);
    return overview;
  }, [overview, filtroMeses]);

  const totals = useMemo(() => filteredOverview.reduce((a, r) => ({
    entradas: a.entradas + r.entradas, fixas: a.fixas + r.fixas, variaveis: a.variaveis + r.variaveis, cartao: a.cartao + r.cartao, resultado: a.resultado + r.resultado, dividas: (a.dividas || 0) + (r.dividas || 0)
  }), { entradas: 0, fixas: 0, variaveis: 0, cartao: 0, resultado: 0, dividas: 0 }), [filteredOverview]);

  // Auto-save when dividas or metas change
  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) { didMount.current = true; return; }
    save(months, diario, cartaosList);
  }, [dividas, metas, investimentos, theme, accent, settings, orcamentos, avulsos, carteira, taxaSelic, orcBase, orcMeses]);

  const navItems = [
    { id: "overview", label: "Visão Geral", icon: "" },
    { id: "meses", label: "Meses", icon: "" },
    { id: "metas", label: "Metas", icon: "" },
    { id: "investimentos", label: "Investimentos", icon: "" },
    { id: "config", label: "Configurações", icon: "" }
  ];

  function TutorialOverlay() {
    var steps = [
      { icon: "", title: "Visão Geral", desc: "Resumo financeiro do ano com gráficos, orçamentos e resultado acumulado." },
      { icon: "", title: "Diário", desc: "Registre entradas e saídas do dia-a-dia. O saldo flui entre os meses. Clique nos valores para editar e  para notas." },
      { icon: "", title: "Mensal", desc: "Organize contas fixas, variáveis e cartões. Marque ✓ quando pagar. Use  para repetir nos próximos meses." },
      { icon: "", title: "Cartões", desc: "Gerencie gastos de cada cartão separadamente." },
      { icon: "", title: "Dívidas", desc: "Cadastre empréstimos e parcelas. São integradas automaticamente no resumo." },
      { icon: "", title: "Metas", desc: "Defina objetivos financeiros e acompanhe o progresso." },
      { icon: "", title: "Investimentos", desc: "Registre economia mensal. Defina valor inicial e acompanhe evolução." },
      { icon: "", title: "Sync Mensal", desc: "No Diário, clique 'Sync Mensal' para importar itens pagos do Mensal automaticamente." },
      { icon: "", title: "Copiar Estrutura", desc: "No Mensal, copie a estrutura de um mês para o próximo." },
      { icon: "", title: "Busca", desc: "Barra de busca no topo encontra qualquer gasto em todos os meses." }
    ];
    return (
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 400, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <div style={{ background: C.bg, border: "1px solid " + C.border, borderRadius: 20, padding: 24, maxWidth: 440, width: "100%", maxHeight: "80vh", overflowY: "auto" }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}></div>
            <h2 style={{ color: C.tx, fontSize: 18, fontWeight: 700, margin: 0 }}>Bem-vindo ao Zip Finanças!</h2>
            <p style={{ color: C.dm, fontSize: 12, marginTop: 6 }}>Veja como usar cada seção:</p>
          </div>
          {steps.map(function(s, i) {
            return (
              <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: i < steps.length - 1 ? "1px solid " + C.border : "none" }}>
                <span style={{ fontSize: 24, flexShrink: 0 }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.tx }}>{s.title}</div>
                  <div style={{ fontSize: 11, color: C.dm, marginTop: 2, lineHeight: 1.4 }}>{s.desc}</div>
                </div>
              </div>
            );
          })}
          <button onClick={function() { setShowTutorial(false); }} style={{ width: "100%", marginTop: 16, padding: 14, background: "linear-gradient(135deg,#10b981,#059669)", border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Entendi, vamos começar!</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.tx, fontFamily: "'Manrope',sans-serif" }}>
      {showTutorial && <TutorialOverlay />}
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.bL}; border-radius: 3px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        select option { background: ${C.optionBg || "#1e293b"}; color: ${C.tx}; }
        .stats-grid { display: grid; grid-template-columns: repeat(5,1fr); gap: 12px; margin-bottom: 20px; }
        .stats-grid-4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 20px; }
        @media (max-width: 768px) {
          .stats-grid, .stats-grid-4 { grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }
        }
        .chart-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .metas-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: repeat(2,1fr); }
          .stats-grid > *:last-child { grid-column: 1 / -1; }
          .stats-grid-4 { grid-template-columns: repeat(2,1fr); }
          .chart-grid { grid-template-columns: 1fr; }
          .metas-grid { grid-template-columns: 1fr; }
          .desktop-nav { display: none !important; }
          
          .main-content { padding-bottom: 16px !important; }
        }
        @media (min-width: 769px) {
          
        }
        @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: repeat(2,1fr); }
          .stats-grid-4 { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <header style={{ padding: "10px 24px", maxWidth: 1280, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 100, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          
          <div style={{ width: 36, height: 36, borderRadius: 10, background: C.g, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 18, color: "#000" }}>Z</div>
          <div>
            <h1 style={{ fontSize: 15, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>Zip Finanças <select value={ano} onChange={function(e) { setAno(Number(e.target.value)); }} style={{ background: "transparent", border: "1px solid " + C.border, borderRadius: 6, padding: "2px 6px", color: C.b, fontSize: 14, fontWeight: 700, cursor: "pointer", outline: "none" }}>{[2025,2026,2027,2028,2029,2030].map(function(y) { return <option key={y} value={y}>{y}</option>; })}</select></h1>
            <span style={{ fontSize: 9, color: C.dm }}></span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {saving ? <span style={{ fontSize: 10, color: C.g }}>✓ Salvo</span> : null}
          
          
          
        </div>
      </header>

      <nav className="desktop-nav" style={{ display: "flex", gap: 2, padding: "3px", maxWidth: 1232, margin: "0 auto 16px", background: C.card, borderRadius: 12, border: "1px solid " + C.border, overflowX: "auto" }}>
        {navItems.map((n) => (
          <button key={n.id} onClick={() => setView(n.id)} style={{ background: view === n.id ? C.bB : "transparent", border: view === n.id ? "1px solid " + C.b + "40" : "1px solid transparent", color: view === n.id ? C.b : C.dm, padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}>
            {n.label}
          </button>
        ))}
      </nav>
      {/* Mobile Hamburger Menu */}
      

      <main className="main-content" style={{ padding: "20px 24px", maxWidth: 1280, margin: "0 auto" }}>

        
        

        {view === "overview" && (
          <div style={{ animation: "fadeIn .3s" }}>
            {/* Filtro de período */}
            <div style={{ display: "flex", gap: 4, marginBottom: 14, flexWrap: "wrap" }}>
              {[{id:"ano",l:"Ano"},{id:"s1",l:"1º Sem"},{id:"s2",l:"2º Sem"},{id:"t1",l:"T1"},{id:"t2",l:"T2"},{id:"t3",l:"T3"},{id:"t4",l:"T4"}].map(function(f) {
                return <button key={f.id} onClick={function() { setFiltroMeses(f.id); }} style={{ padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontSize: 10, fontWeight: 600, border: filtroMeses === f.id ? "1px solid " + C.b + "40" : "1px solid " + C.border, background: filtroMeses === f.id ? C.bB : "transparent", color: filtroMeses === f.id ? C.b : C.dm }}>{f.l}</button>;
              })}
            </div>

            <div className="stats-grid">
              <Stat label="Entradas" value={totals.entradas} color={C.g} sub={filtroMeses !== "ano" ? "Período filtrado" : "Soma dos meses"} />
              <Stat label="Fixas" value={totals.fixas} color={C.r} sub={totals.dividas > 0 ? "Inclui R$ " + totals.dividas.toLocaleString("pt-BR",{minimumFractionDigits:2}) + " em dívidas" : "Gastos fixos"} />
              <Stat label="Variáveis" value={totals.variaveis} color={C.a} />
              <Stat label="Cartões" value={totals.cartao} color={C.p} />
              <Stat label="Resultado" value={totals.resultado} icon={totals.resultado >= 0 ? "" : ""} color={totals.resultado >= 0 ? C.g : C.r} />
            </div>

            

            
            <Section title="Entradas vs Saídas">
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={filteredOverview.map(function(r) { return { name: MSH[MS.indexOf(r.mes)], entradas: r.entradas, fixas: r.fixas, variaveis: r.variaveis, cartao: r.cartao }; })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="name" tick={{ fill: C.dm, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: C.dm, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtS} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="fixas" name="Fixas" fill={C.r} stackId="s" opacity={0.8} />
                  <Bar dataKey="variaveis" name="Variáveis" fill={C.a} stackId="s" opacity={0.8} />
                  <Bar dataKey="cartao" name="Cartão" fill={C.p} stackId="s" radius={[4, 4, 0, 0]} opacity={0.8} />
                  <Line type="monotone" dataKey="entradas" name="Entradas" stroke={C.g} strokeWidth={3} dot={{ r: 3, fill: C.g }} />
                </ComposedChart>
              </ResponsiveContainer>
            </Section>

            <Section title="Resultado Acumulado">
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={filteredOverview.reduce(function(a, r, i) { var p = i > 0 ? a[i - 1].acc : 0; a.push({ name: MSH[MS.indexOf(r.mes)], acc: p + r.resultado }); return a; }, [])}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="name" tick={{ fill: C.dm, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: C.dm, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtS} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={0} stroke={C.dm2} strokeDasharray="3 3" />
                  <Area type="monotone" dataKey="acc" name="Acumulado" stroke={C.r} fill={C.rB} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </Section>

            {/* Dívidas - editáveis */}
            <Section title="Dívidas" action={<Btn onClick={function() { setDividas(function(p) { return p.concat([{ id: uid(), nome: "", parcela: 0, inicio: 0, fim: 11 }]); }); }} color={C.dm} small>+ Dívida</Btn>}>
              {dividas.length > 0 ? dividas.map(function(dv, i) {
                var mi = currentMonthIdx;
                var ativo = mi >= dv.inicio && mi <= dv.fim;
                var totalMeses = (dv.fim || 0) - (dv.inicio || 0) + 1;
                var mesesPagos = Math.max(0, mi - (dv.inicio || 0) + 1);
                var pct = totalMeses > 0 ? Math.min(Math.round((mesesPagos / totalMeses) * 100), 100) : 0;
                return (
                  <div key={dv.id || i} style={{ marginBottom: 10, padding: 8, background: "rgba(255,255,255,.02)", borderRadius: 8, border: "1px solid " + C.border }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <EText value={dv.nome} onChange={function(v) { setDividas(function(p) { return p.map(function(x, j) { return j === i ? Object.assign({}, x, { nome: v }) : x; }); }); }} placeholder="Nome..." w={120} />
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <ENum value={dv.parcela} onChange={function(v) { setDividas(function(p) { return p.map(function(x, j) { return j === i ? Object.assign({}, x, { parcela: v }) : x; }); }); }} color={C.r} w={60} />
                        <span style={{ fontSize: 9, color: C.dm }}>/mês</span>
                        <button onClick={function() { setDividas(function(p) { return p.filter(function(_, j) { return j !== i; }); }); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: C.dm2 }}>✕</button>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, fontSize: 9, color: C.dm, marginBottom: 4 }}>
                      <span>Início: <select value={dv.inicio || 0} onChange={function(e) { setDividas(function(p) { return p.map(function(x, j) { return j === i ? Object.assign({}, x, { inicio: parseInt(e.target.value) }) : x; }); }); }} style={{ background: "rgba(255,255,255,.05)", border: "1px solid " + C.border, borderRadius: 4, color: C.tx, fontSize: 9, padding: "2px 4px" }}>{MSH.map(function(m, mi) { return <option key={mi} value={mi}>{m}</option>; })}</select></span>
                      <span>Fim: <select value={dv.fim || 11} onChange={function(e) { setDividas(function(p) { return p.map(function(x, j) { return j === i ? Object.assign({}, x, { fim: parseInt(e.target.value) }) : x; }); }); }} style={{ background: "rgba(255,255,255,.05)", border: "1px solid " + C.border, borderRadius: 4, color: C.tx, fontSize: 9, padding: "2px 4px" }}>{MSH.map(function(m, mi) { return <option key={mi} value={mi}>{m}</option>; })}</select></span>
                    </div>
                    <div style={{ height: 4, background: "rgba(255,255,255,.06)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: pct + "%", background: pct >= 100 ? C.g : C.a, borderRadius: 2 }} />
                    </div>
                    <div style={{ fontSize: 9, color: C.dm, marginTop: 2 }}>{pct}% — {mesesPagos}/{totalMeses} parcelas</div>
                  </div>
                );
              }) : <div style={{ color: C.dm, fontSize: 11, textAlign: "center", padding: 12 }}>Nenhuma dívida cadastrada</div>}
            </Section>

            {/* Mini Orçamento */}
            {(orcBase.categorias || []).length > 0 && (
              <Section title="Orçamento vs Realizado">
                {(function() {
                  var md = months[MS[currentMonthIdx]] || {};
                  var totalOrcado = (orcBase.categorias || []).reduce(function(a, c) { return a + (c.limite || 0); }, 0);
                  var totalReal = ["fixas", "variaveis", "cartoes_itens"].reduce(function(a, t) { return a + (md[t] || []).reduce(function(b, it) { return b + (it.valor || 0); }, 0); }, 0);
                  var pct = totalOrcado > 0 ? Math.round((totalReal / totalOrcado) * 100) : 0;
                  var over = totalReal > totalOrcado;
                  return (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                        <span style={{ color: over ? C.r : C.g, fontWeight: 600 }}>{pct}% usado</span>
                        <span style={{ fontFamily: "'JetBrains Mono',monospace" }}>
                          <span style={{ color: over ? C.r : C.g }}>{fmt(totalReal)}</span>
                          <span style={{ color: C.dm }}> / {fmt(totalOrcado)}</span>
                        </span>
                      </div>
                      <div style={{ height: 6, background: "rgba(255,255,255,.06)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: Math.min(pct, 100) + "%", background: over ? C.r : pct > 80 ? C.a : C.g, borderRadius: 3 }} />
                      </div>
                      <div style={{ fontSize: 9, color: C.dm, marginTop: 4 }}>* {MSH[currentMonthIdx]} — <button onClick={function() { setView("orcamentos"); }} style={{ background: "none", border: "none", color: C.b, cursor: "pointer", fontSize: 9, padding: 0 }}>Ver detalhes →</button></div>
                    </div>
                  );
                })()}
              </Section>
            )}

            <Section title="Resumo (clique no mês para editar)">
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, minWidth: 500 }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid " + C.border }}>
                      <th style={{ padding: "10px 12px", textAlign: "left", color: C.dm2, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em" }}>Mês</th>
                      <th style={{ padding: "10px 12px", textAlign: "right", color: C.dm2, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em" }}>Entradas</th>
                      <th style={{ padding: "10px 12px", textAlign: "right", color: C.dm2, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em" }}>Despesas</th>
                      <th style={{ padding: "10px 12px", textAlign: "right", color: C.dm2, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em" }}>Cartões</th>
                      <th style={{ padding: "10px 12px", textAlign: "right", color: C.dm2, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em" }}>Diário</th>
                      <th style={{ padding: "10px 12px", textAlign: "right", color: C.dm2, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em" }}>Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOverview.map(function(r, i) {
                      var mi = MS.indexOf(r.mes);
                      return (
                      <tr key={mi} style={{ borderBottom: "1px solid " + C.border, cursor: "pointer", background: mi === currentMonthIdx ? C.bB : "transparent" }} onClick={function() { setView("meses"); setMonthTab(r.mes); }}>
                        <td style={{ padding: "12px", fontWeight: 600, fontSize: 13 }}>{MSH[mi]}</td>
                        <td style={{ padding: "12px", textAlign: "right", color: C.g, fontSize: 13, fontFamily: "'JetBrains Mono',monospace" }}>{fmt(r.entradas)}</td>
                        <td style={{ padding: "12px", textAlign: "right", color: C.r, fontSize: 13, fontFamily: "'JetBrains Mono',monospace" }}>{fmt(r.despesas || (r.fixas + r.cartao))}</td>
                        <td style={{ padding: "12px", textAlign: "right", color: C.p, fontFamily: "'JetBrains Mono',monospace", fontSize: 13 }}>{fmt(r.cartao)}</td>
                        <td style={{ padding: "12px", textAlign: "right", color: C.a, fontFamily: "'JetBrains Mono',monospace", fontSize: 13 }}>{fmt(r.variaveis)}</td>
                        <td style={{ padding: "12px", textAlign: "right", fontWeight: 700, color: r.resultado >= 0 ? C.g : C.r, fontFamily: "'JetBrains Mono',monospace", fontSize: 13 }}>{fmt(r.resultado)}</td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Section>
          </div>
        )}

          {(view === "meses" || view === "diario" || view === "monthly") && (
          <div style={{ animation: "fadeIn .3s" }}>
            {/* Month selector */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6, marginBottom: 14 }}>
              {MS.map((m, i) => (
                <button key={m} onClick={() => { setDiarioMes(m); setMonthTab(m); }} style={{ background: diarioMes === m ? C.bB : "rgba(255,255,255,.03)", border: diarioMes === m ? "1px solid " + C.b + "40" : "1px solid " + C.border, color: diarioMes === m ? C.b : C.dm, padding: "10px 8px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: diarioMes === m ? 700 : 500, textAlign: "center" }}>{MSH[i]}</button>
              ))}
            </div>

            {/* Stats summary */}
            {(function() {
              var md = months[diarioMes] || { entradas: [], fixas: [], variaveis: [], cartoes_itens: [] };
              var totE = (md.entradas || []).reduce((a, b) => a + (b.valor || 0), 0);
              var totF = (md.fixas || []).reduce((a, b) => a + (b.valor || 0), 0);
              var totV = (md.variaveis || []).reduce((a, b) => a + (b.valor || 0), 0);
              var totC = (md.cartoes_itens || []).reduce((a, b) => a + (b.valor || 0), 0);
              var numDays = new Date(2026, MS.indexOf(diarioMes) + 1, 0).getDate();
              var totGastosDiarios = (avulsos[diarioMes] || []).filter(function(a) { return a.tipo !== "entrada"; }).reduce(function(a,b) { return a + (b.valor||0); }, 0);
              var res = totE - totF - totC - totGastosDiarios;
              return (
                <div className="stats-grid" style={{ gap: 8, marginBottom: 14 }}>
                  <Stat label="Entradas" value={totE} color={C.g} />
                  <Stat label="Despesas" value={totF} color={C.r} />
                  <Stat label="Cartões" value={totC} color={C.p} />
                    <Stat label="Gastos Diários" value={(avulsos[diarioMes] || []).filter(function(a) { return a.tipo !== "entrada"; }).reduce(function(a,b) { return a + (b.valor||0); }, 0)} color={C.a} sub={numDays > 0 ? "Média: " + fmt(((avulsos[diarioMes]||[]).filter(function(a){return a.tipo!=="entrada";}).reduce(function(a,b){return a+(b.valor||0);},0)) / numDays) + "/dia" : ""} />
                  <Stat label="Resultado" value={res} icon={res >= 0 ? "" : ""} color={res >= 0 ? C.g : C.r} />
                </div>
              );
            })()}

            <div style={{ marginBottom: 8, textAlign: "right" }}><button onClick={function() { duplicarMes(diarioMes); }} style={{ background: "none", border: "none", color: C.dm2, fontSize: 10, cursor: "pointer", padding: "4px 8px" }}> Copiar estrutura →</button></div>

            {/* Sub-tabs: Dia a dia | Entradas | Fixas | Variáveis | Cartões */}
            <div style={{ display: "flex", gap: 4, marginBottom: 14, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              {[
                { id: "diadia", label: "Diário", color: C.b },
                { id: "entradas", label: "Entradas", color: C.g },
                { id: "fixas", label: "Despesas", color: C.r },
                { id: "cartoes_itens", label: "Cartões", color: C.p }
              ].map(function(t) {
                return <button key={t.id} onClick={function() { setMesesSubTab(t.id); }} style={{ background: mesesSubTab === t.id ? t.color + "18" : "transparent", border: mesesSubTab === t.id ? "1px solid " + t.color + "40" : "1px solid transparent", color: mesesSubTab === t.id ? t.color : C.dm, padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 12, minHeight: 38, fontWeight: mesesSubTab === t.id ? 600 : 400, whiteSpace: "nowrap" }}>{t.label}</button>;
              })}
            </div>

            {/* Dia a dia = original DiarioView */}
            {mesesSubTab === "diadia" && (
              <ErrorWrap key={diarioMes}>
                <DiarioView mes={diarioMes} setMes={setDiarioMes} months={months} diario={diario} upDiario={upDiario} addEntry={addDiarioEntry} rmEntry={rmDiarioEntry} avulsos={avulsos} setAvulsos={setAvulsos} updateMonth={updateMonth} upDiarioCol={upDiarioCol} addMensalFromDiario={addMensalFromDiario} />
              </ErrorWrap>
            )}

            {/* Entradas / Fixas / Variáveis / Cartões = MonthTab functionality */}
            {mesesSubTab !== "diadia" && (
              <MonthTab month={diarioMes} data={months[diarioMes]} cartaosList={cartaosList} onUpdate={updateMonth} onAddCartao={() => setShowAddCartao(true)} duplicarMes={duplicarMes} forceTab={mesesSubTab} />
            )}
          </div>
        )}

        {view === "metas" && (
          <div style={{ animation: "fadeIn .3s" }}>
            <Section title="Metas e Objetivos 2026" action={<Btn onClick={function() { setMetas(function(p) { return p.concat([{ id: String(Date.now()), nome: "", target: 1000, atual: 0 }]); }); }} color={C.g} small>+ Meta</Btn>}>
              <div className="metas-grid">
                {metas.map(function(mt, i) {
                  var atualCalc = (mt.aportes || []).length > 0 ? (mt.aportes || []).reduce(function(a,b) { return a + (b.valor||0); }, 0) : mt.atual;
                  var pct = mt.target > 0 ? Math.min(Math.round((atualCalc / mt.target) * 100), 100) : 0;
                  return (
                    <div key={mt.id} style={{ background: "rgba(255,255,255,.02)", borderRadius: 12, padding: 16, border: "1px solid " + C.border }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <EText value={mt.nome} onChange={function(v) { setMetas(function(p) { return p.map(function(x, j) { return j === i ? Object.assign({}, x, { nome: v }) : x; }); }); }} placeholder="Nome da meta..." w={150} />
                        <button onClick={function() { setMetas(function(p) { return p.filter(function(_, j) { return j !== i; }); }); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: C.dm2, minWidth: 28, minHeight: 28, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 11 }}>
                        <span style={{ color: C.dm }}>Atual: {fmt(mt.atual)}</span>
                        <span style={{ color: C.dm }}>Meta: <ENum value={mt.target} onChange={function(v) { setMetas(function(p) { return p.map(function(x, j) { return j === i ? Object.assign({}, x, { target: v }) : x; }); }); }} color={C.b} w={70} /></span>
                      </div>
                      <div style={{ height: 8, background: "rgba(255,255,255,.06)", borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
                        <div style={{ height: "100%", width: pct + "%", background: pct >= 100 ? C.g : C.b, borderRadius: 4, transition: "width .5s" }} />
                      </div>
                      <div style={{ textAlign: "center", fontSize: 14, fontWeight: 700, color: pct >= 100 ? C.g : C.b, fontFamily: "'JetBrains Mono',monospace" }}>{pct}%</div>
                      <div style={{ textAlign: "center", fontSize: 10, color: C.dm, marginTop: 2 }}>Faltam {fmt(Math.max(0, mt.target - mt.atual))}</div>
                      {/* Aportes */}
                      <div style={{ marginTop: 10, borderTop: "1px solid " + C.border, paddingTop: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 600, color: C.dm }}>Aportes</span>
                          <button onClick={function() {
                            var valor = parseFloat(window.prompt("Valor do aporte R$:"));
                            if (isNaN(valor) || valor <= 0) return;
                            var data = new Date().toISOString().slice(0,10);
                            setMetas(function(p) { return p.map(function(x, j) {
                              if (j !== i) return x;
                              var aportes = (x.aportes || []).concat([{ valor: valor, data: data }]);
                              var novoAtual = aportes.reduce(function(a,b) { return a + (b.valor||0); }, 0);
                              return Object.assign({}, x, { aportes: aportes, atual: novoAtual });
                            }); });
                          }} style={{ background: C.g + "15", border: "1px solid " + C.g + "40", borderRadius: 6, color: C.g, fontSize: 9, padding: "3px 8px", cursor: "pointer" }}>+ Aporte</button>
                        </div>
                        {(mt.aportes || []).length > 0 ? (mt.aportes || []).slice().reverse().map(function(ap, ai) {
                          var apDate = ap.data ? (ap.data.split("-").length === 3 ? ap.data.split("-")[2]+"/"+ap.data.split("-")[1]+"/"+ap.data.split("-")[0] : ap.data) : "—";
                          return <div key={ai} style={{ display: "flex", justifyContent: "space-between", fontSize: 9, padding: "2px 0", color: C.dm }}>
                            <span>{apDate}</span>
                            <span style={{ color: C.g, fontFamily: "'JetBrains Mono',monospace" }}>{fmt(ap.valor)}</span>
                          </div>;
                        }) : <div style={{ fontSize: 9, color: C.dm2, textAlign: "center" }}>Nenhum aporte registrado</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          </div>
        )}

        {view === "investimentos" && (
          <div style={{ animation: "fadeIn .3s" }}>
            {(function() {
              var hoje = new Date();
              var totalInvestido = 0, totalAtual = 0, totalRendimento = 0;
              
              var carteiraCalc = carteira.map(function(inv) {
                var dataApp = new Date(inv.dataAplicacao || "2026-01-01");
                var diasCorr = Math.max(1, Math.floor((hoje - dataApp) / (1000*60*60*24)));
                
                if (inv.tipo === "Renda Variável") {
                  var valorAtual = (inv.precoAtual || inv.precoPago || 0) * (inv.quantidade || 1);
                  var totalInv = (inv.valor || 0);
                  var rendLiq = valorAtual - totalInv;
                  totalInvestido += totalInv;
                  totalAtual += valorAtual;
                  totalRendimento += rendLiq;
                  return Object.assign({}, inv, { diasCorr: diasCorr, valorAtual: Math.round(valorAtual*100)/100, rendLiq: Math.round(rendLiq*100)/100, rendBruto: Math.round(rendLiq*100)/100, ir: 0, aliqIR: "0", isento: false, taxaAnual: "—", totalInvestidoCalc: totalInv });
                }
                
                var taxaAnual = 0;
                if (inv.taxaTipo === "cdi" || inv.taxaTipo === "selic") taxaAnual = (taxaSelic / 100) * ((inv.taxaValor || 100) / 100);
                else if (inv.taxaTipo === "ipca") taxaAnual = (0.05 + (inv.taxaFixa || 0) / 100);
                else if (inv.taxaTipo === "pre") taxaAnual = (inv.taxaValor || 12) / 100;
                else taxaAnual = (inv.taxaValor || 10) / 100;
                var taxaDiaria = Math.pow(1 + taxaAnual, 1/252) - 1;
                
                // Calculate rendimento for each aporte individually
                var aportes = inv.aportes || [{ valor: inv.valor || 0, data: inv.dataAplicacao }];
                var totalValorInv = 0;
                var totalRendBruto = 0;
                
                aportes.forEach(function(ap) {
                  var apData = new Date(ap.data || inv.dataAplicacao || "2026-01-01");
                  var apDias = Math.max(1, Math.floor((hoje - apData) / (1000*60*60*24)));
                  var apDiasUteis = Math.floor(apDias * 252 / 365);
                  var apRend = (ap.valor || 0) * (Math.pow(1 + taxaDiaria, apDiasUteis) - 1);
                  totalValorInv += (ap.valor || 0);
                  totalRendBruto += apRend;
                });
                
                var isento = inv.subtipo === "LCI" || inv.subtipo === "LCA" || inv.subtipo === "Poupança";
                var aliqIR = diasCorr <= 180 ? 0.225 : diasCorr <= 360 ? 0.20 : diasCorr <= 720 ? 0.175 : 0.15;
                var ir = isento ? 0 : totalRendBruto * aliqIR;
                var rendLiq2 = totalRendBruto - ir;
                var valorAtual2 = totalValorInv + rendLiq2;
                
                totalInvestido += totalValorInv;
                totalAtual += valorAtual2;
                totalRendimento += rendLiq2;
                
                return Object.assign({}, inv, {
                  diasCorr: diasCorr, taxaAnual: (taxaAnual * 100).toFixed(2),
                  rendBruto: Math.round(totalRendBruto * 100) / 100,
                  rendLiq: Math.round(rendLiq2 * 100) / 100,
                  ir: Math.round(ir * 100) / 100,
                  aliqIR: (aliqIR * 100).toFixed(1),
                  valorAtual: Math.round(valorAtual2 * 100) / 100,
                  isento: isento,
                  totalInvestidoCalc: totalValorInv,
                  numAportes: aportes.length
                });
              });
              
              // Economia mensal
              var totalEconomia = MS.reduce(function(a, m) { return a + ((investimentos[m] || {}).economia || 0); }, 0);
              var valorInicial = investimentos._inicial || 0;
              var totalEconomizado = totalEconomia + valorInicial;
              
              // Grand total
              var patrimonioTotal = totalAtual; // economizado separado para não duplicar
              
              // Group by tipo and banco
              var porTipo = {};
              carteiraCalc.forEach(function(inv) {
                var t = inv.tipo || "Outro";
                if (!porTipo[t]) porTipo[t] = { total: 0, items: [] };
                porTipo[t].total += inv.valorAtual;
                porTipo[t].items.push(inv);
              });
              var porBanco = {};
              carteiraCalc.forEach(function(inv) {
                var b = inv.banco || "Outro";
                if (!porBanco[b]) porBanco[b] = 0;
                porBanco[b] += inv.valorAtual;
              });
              
              function fmtDate(d) { if (!d) return "—"; var p = d.split("-"); return p.length === 3 ? p[2]+"/"+p[1]+"/"+p[0] : d; }
              
              // Edit popup state
              
              function saveEditInv(updated) {
                setCarteira(function(prev) { return prev.map(function(i) { return i.id === updated.id ? updated : i; }); });
                setEditInv(null);
              }
              
              function rmInvestimento(invId) {
                if (!window.confirm("Remover investimento?")) return;
                setCarteira(function(prev) { return prev.filter(function(i) { return i.id !== invId; }); });
              }
              
              function startAdd(tipo) {
                var base = { id: uid(), nome: "", tipo: tipo === "rv" ? "Renda Variável" : tipo === "prev" ? "Previdência" : "Renda Fixa", subtipo: tipo === "rv" ? "Ações" : tipo === "prev" ? "Previdência" : "CDB", banco: "", valor: 0, dataAplicacao: hoje.toISOString().slice(0,10), vencimento: "", taxaTipo: "cdi", taxaValor: 100, taxaFixa: 0 };
                if (tipo === "rv") { base.quantidade = 0; base.precoPago = 0; base.precoAtual = 0; base.ticker = ""; }
                setAddInv(base);
              }
              
              function saveNewInv() {
                if (!addInv.nome) { alert("Preencha o nome"); return; }
                if (addInv.tipo === "Renda Variável") {
                  addInv.valor = (addInv.quantidade || 0) * (addInv.precoPago || 0);
                }
                setCarteira(function(prev) { return prev.concat([addInv]); });
                setAddInv(null);
              }
              
              
              return (
                <div>
                  {/* Dashboard */}
                  <div className="stats-grid-4" style={{ marginBottom: 14 }}>
                    <Stat label="Patrimônio" value={patrimonioTotal} color={C.b} sub={"Investido: " + fmt(totalInvestido)} />
                    <Stat label="Investimentos" value={totalAtual} color={C.g} sub={totalInvestido > 0 ? "Rend: " + fmt(totalRendimento) + " (" + ((totalRendimento/totalInvestido)*100).toFixed(1) + "%)" : ""} />
                    <Stat label="Economizado" value={totalEconomizado} color={C.a} sub={valorInicial > 0 ? "Inicial: " + fmt(valorInicial) : ""} />
                    <div style={{ background: C.card, borderRadius: 12, padding: "14px 16px", border: "1px solid " + C.border, position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: C.dm }} />
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                        <span style={{ fontSize: 13 }}></span>
                        <span style={{ color: C.dm, fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".04em" }}>Taxa Selic</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <ENum value={taxaSelic} onChange={function(v) { setTaxaSelic(v); }} color={C.tx} w={50} />
                        <span style={{ color: C.dm, fontSize: 12 }}>% a.a.</span>
                      </div>
                      <div style={{ color: C.dm, fontSize: 9, marginTop: 2 }}>{carteira.length} ativos</div>
                    </div>
                  </div>
                  
                  {/* Alocação */}
                  {totalAtual > 0 && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                      <Section title="Por Tipo">
                        {Object.entries(porTipo).map(function(entry, i) {
                          var pct = totalAtual > 0 ? (entry[1].total / totalAtual * 100).toFixed(1) : 0;
                          return <div key={entry[0]} style={{ display: "flex", justifyContent: "space-between", fontSize: 10, padding: "3px 0" }}>
                            <span style={{ color: C.tx }}>{entry[0]}</span>
                            <span style={{ color: PC_BASE[i % PC_BASE.length], fontFamily: "'JetBrains Mono',monospace" }}>{fmt(entry[1].total)} ({pct}%)</span>
                          </div>;
                        })}
                      </Section>
                      <Section title="Por Banco">
                        {Object.entries(porBanco).sort(function(a,b) { return b[1]-a[1]; }).map(function(entry, i) {
                          var pct = totalAtual > 0 ? (entry[1] / totalAtual * 100).toFixed(1) : 0;
                          return <div key={entry[0]} style={{ display: "flex", justifyContent: "space-between", fontSize: 10, padding: "3px 0" }}>
                            <span style={{ color: C.tx }}>{entry[0]}</span>
                            <span style={{ color: PC_BASE[i % PC_BASE.length], fontFamily: "'JetBrains Mono',monospace" }}>{fmt(entry[1])} ({pct}%)</span>
                          </div>;
                        })}
                      </Section>
                    </div>
                  )}
                  
                  {/* Meus Investimentos */}
                  <Section title="Meus Investimentos" action={
                    <div style={{ display: "flex", gap: 4 }}>
                      <Btn onClick={function() { startAdd("rf"); }} color={C.b} small>+ Renda Fixa</Btn>
                      <Btn onClick={function() { startAdd("rv"); }} color={C.g} small>+ Renda Variável</Btn>
                    </div>
                  }>
                    {carteiraCalc.length > 0 ? carteiraCalc.map(function(inv) {
                      var isRV = inv.tipo === "Renda Variável";
                      var rendColor = inv.rendLiq >= 0 ? C.g : C.r;
                      return (
                        <div key={inv.id} style={{ padding: "12px", marginBottom: 8, background: "rgba(255,255,255,.02)", border: "1px solid " + C.border, borderRadius: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: C.tx }}>{inv.nome} {inv.ticker ? <span style={{ color: C.dm, fontSize: 10 }}>({inv.ticker})</span> : null}</div>
                              <div style={{ fontSize: 10, color: C.dm, marginTop: 2, display: "flex", gap: 4, flexWrap: "wrap" }}>
                                <span style={{ background: C.b + "15", color: C.b, padding: "1px 6px", borderRadius: 4 }}>{inv.subtipo}</span>
                                <span style={{ color: C.dm2 }}>{inv.banco}</span>
                                {inv.isento && <span style={{ background: C.g + "15", color: C.g, padding: "1px 6px", borderRadius: 4 }}>Isento IR</span>}
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 4 }}>
                              <button onClick={function() { setAportePopup({ invId: inv.id, valor: "", data: hoje.toISOString().slice(0,10) }); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: C.g }} title="Novo aporte"></button>
                              <button onClick={function() { setEditInv(Object.assign({}, inv)); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: C.b }}>✎️</button>
                              <button onClick={function() { rmInvestimento(inv.id); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: C.dm2 }}>✕</button>
                            </div>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: isRV ? "1fr 1fr 1fr 1fr" : "1fr 1fr 1fr", gap: 8, fontSize: 10 }}>
                            <div><div style={{ color: C.dm }}>Investido</div><div style={{ color: C.tx, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>{fmt(inv.totalInvestidoCalc || inv.valor)}</div></div>
                            <div><div style={{ color: C.dm }}>Atual</div><div style={{ color: C.g, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>{fmt(inv.valorAtual)}</div></div>
                            <div><div style={{ color: C.dm }}>Rendimento</div><div style={{ color: rendColor, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>{fmt(inv.rendLiq)}</div></div>
                            {isRV && <div><div style={{ color: C.dm }}>Qtd × Preço</div><div style={{ color: C.tx, fontSize: 9 }}>{inv.quantidade}× {fmt(inv.precoAtual || inv.precoPago || 0)}</div></div>}
                          </div>
                          <div style={{ display: "flex", gap: 12, fontSize: 9, color: C.dm, marginTop: 4 }}>
                            {!isRV && <span>Taxa: {inv.taxaTipo === "cdi" ? inv.taxaValor + "% CDI" : inv.taxaTipo === "ipca" ? "IPCA+" + inv.taxaFixa + "%" : inv.taxaValor + "% a.a."}</span>}
                            <span>Desde: {fmtDate(inv.dataAplicacao)}</span>
                            {inv.numAportes > 1 && <span style={{ color: C.g }}>{inv.numAportes} aportes</span>}
                            {inv.vencimento && <span>Venc: {fmtDate(inv.vencimento)}</span>}
                            {!isRV && !inv.isento && <span>IR: {inv.aliqIR}%</span>}
                          </div>
                        </div>
                      );
                    }) : (
                      <div style={{ textAlign: "center", padding: 30, color: C.dm }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}></div>
                        <div style={{ fontSize: 12 }}>Nenhum investimento cadastrado</div>
                        <div style={{ fontSize: 10, color: C.dm2, marginTop: 4 }}>Adicione CDB, LCI, Tesouro, Ações, FIIs, Cripto...</div>
                      </div>
                    )}
                  </Section>
                  
                  {/* Economia Mensal */}
                  <Section title="Economia Mensal">
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, color: C.dm }}>Valor Inicial:</span>
                      <ENum value={investimentos._inicial || 0} onChange={function(v) { setInvestimentos(function(p) { return Object.assign({}, p, { _inicial: v }); }); }} color={C.b} w={80} />
                      <span style={{ fontSize: 10, color: C.g, fontWeight: 600 }}>Total Economizado: {fmt(totalEconomizado)}</span>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                        <thead><tr style={{ borderBottom: "2px solid " + C.border }}>
                          <th style={{ padding: "8px", textAlign: "left", color: C.dm, fontSize: 10 }}>Mês</th>
                          <th style={{ padding: "8px", textAlign: "right", color: C.dm, fontSize: 10 }}>Renda</th>
                          <th style={{ padding: "8px", textAlign: "right", color: C.dm, fontSize: 10 }}>Economizado</th>
                          <th style={{ padding: "8px", textAlign: "right", color: C.dm, fontSize: 10 }}>%</th>
                        </tr></thead>
                        <tbody>{MS.map(function(m, mi) {
                          var md = months[m] || {}; var totalEnt = (md.entradas || []).reduce(function(a,b) { return a + (b.valor||0); }, 0);
                          var inv = investimentos[m] || { economia: 0 }; var pct = totalEnt > 0 ? Math.round((inv.economia / totalEnt) * 100) : 0;
                          return <tr key={m} style={{ borderBottom: "1px solid " + C.border }}>
                            <td style={{ padding: "6px 8px" }}>{MSH[mi]}</td>
                            <td style={{ padding: "6px 8px", textAlign: "right", color: C.g, fontFamily: "'JetBrains Mono',monospace" }}>{fmt(totalEnt)}</td>
                            <td style={{ padding: "6px 8px", textAlign: "right" }}><ENum value={inv.economia} onChange={function(v) { setInvestimentos(function(prev) { var n = Object.assign({}, prev); n[m] = Object.assign({}, n[m], { economia: v }); return n; }); }} color={inv.economia >= 0 ? C.b : C.r} w={70} /></td>
                            <td style={{ padding: "6px 8px", textAlign: "right", color: pct >= 10 ? C.g : C.a, fontFamily: "'JetBrains Mono',monospace" }}>{pct}%</td>
                          </tr>;
                        })}</tbody>
                      </table>
                    </div>
                  </Section>
                  
                  {/* Add Popup */}
                  {addInv && (
                    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 400, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={function() { setAddInv(null); }}>
                      <div onClick={function(e) { e.stopPropagation(); }} style={{ background: C.bg, border: "1px solid " + C.border, borderRadius: 16, padding: 20, maxWidth: 440, width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
                        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: C.tx }}>Novo Investimento — {addInv.tipo}</div>
                        <InvForm inv={addInv} setInv={setAddInv} C={C} />
                        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                          <button onClick={saveNewInv} style={{ flex: 1, padding: 12, background: "linear-gradient(135deg,#10b981,#059669)", border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Salvar</button>
                          <button onClick={function() { setAddInv(null); }} style={{ flex: 1, padding: 12, background: "rgba(255,255,255,.03)", border: "1px solid " + C.border, borderRadius: 10, color: C.dm, fontSize: 13, cursor: "pointer" }}>Cancelar</button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Aporte Popup */}
                  {aportePopup && (
                    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 400, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={function() { setAportePopup(null); }}>
                      <div onClick={function(e) { e.stopPropagation(); }} style={{ background: C.bg, border: "1px solid " + C.border, borderRadius: 16, padding: 20, maxWidth: 360, width: "100%" }}>
                        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: C.tx }}>Novo Aporte</div>
                        <div style={{ marginBottom: 10 }}>
                          <label style={{ fontSize: 10, color: C.dm, marginBottom: 4, display: "block" }}>Valor R$</label>
                          <input type="number" step="0.01" value={aportePopup.valor} onChange={function(e) { setAportePopup(Object.assign({}, aportePopup, { valor: e.target.value })); }} style={{ width: "100%", background: "rgba(255,255,255,.05)", border: "1px solid " + C.border, borderRadius: 8, padding: "10px 12px", color: C.tx, fontSize: 13, outline: "none" }} autoFocus />
                        </div>
                        <div style={{ marginBottom: 10 }}>
                          <label style={{ fontSize: 10, color: C.dm, marginBottom: 4, display: "block" }}>Data</label>
                          <input type="date" value={aportePopup.data} onChange={function(e) { setAportePopup(Object.assign({}, aportePopup, { data: e.target.value })); }} style={{ width: "100%", background: "rgba(255,255,255,.05)", border: "1px solid " + C.border, borderRadius: 8, padding: "10px 12px", color: C.tx, fontSize: 13, outline: "none" }} />
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={function() {
                            var v = parseFloat(aportePopup.valor);
                            if (isNaN(v) || v <= 0) { alert("Valor inválido"); return; }
                            setCarteira(function(prev) { return prev.map(function(i) {
                              if (i.id !== aportePopup.invId) return i;
                              var aportes = (i.aportes || [{ valor: i.valor, data: i.dataAplicacao }]).concat([{ valor: v, data: aportePopup.data }]);
                              var totalVal = aportes.reduce(function(a,b) { return a + (b.valor||0); }, 0);
                              return Object.assign({}, i, { aportes: aportes, valor: totalVal });
                            }); });
                            setAportePopup(null);
                          }} style={{ flex: 1, padding: 12, background: "linear-gradient(135deg,#10b981,#059669)", border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Salvar</button>
                          <button onClick={function() { setAportePopup(null); }} style={{ flex: 1, padding: 12, background: "rgba(255,255,255,.03)", border: "1px solid " + C.border, borderRadius: 10, color: C.dm, fontSize: 13, cursor: "pointer" }}>Cancelar</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Edit Popup */}
                  {editInv && (
                    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 400, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={function() { setEditInv(null); }}>
                      <div onClick={function(e) { e.stopPropagation(); }} style={{ background: C.bg, border: "1px solid " + C.border, borderRadius: 16, padding: 20, maxWidth: 440, width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
                        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: C.tx }}>Editar — {editInv.nome}</div>
                        <InvForm inv={editInv} setInv={setEditInv} C={C} />
                        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                          <button onClick={function() { saveEditInv(editInv); }} style={{ flex: 1, padding: 12, background: "linear-gradient(135deg,#10b981,#059669)", border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Salvar</button>
                          <button onClick={function() { setEditInv(null); }} style={{ flex: 1, padding: 12, background: "rgba(255,255,255,.03)", border: "1px solid " + C.border, borderRadius: 10, color: C.dm, fontSize: 13, cursor: "pointer" }}>Cancelar</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {view === "orcamentos" && (
          <div style={{ animation: "fadeIn .3s" }}>
            {(function() {
              // Current month for comparison
              var [orcMesView, setOrcMesView] = [diarioMes, setDiarioMes];
              var cats = orcBase.categorias || [];
              var mesAdj = orcMeses[orcMesView] || {};
              
              function addCategoria() {
                setOrcBase(function(prev) {
                  var n = Object.assign({}, prev);
                  n.categorias = (n.categorias || []).concat([{ id: uid(), nome: "", limite: 0, itens: [] }]);
                  return n;
                });
              }
              
              function upCategoria(catId, field, value) {
                setOrcBase(function(prev) {
                  var n = Object.assign({}, prev);
                  n.categorias = (n.categorias || []).map(function(cat) {
                    return cat.id === catId ? Object.assign({}, cat, { [field]: value }) : cat;
                  });
                  return n;
                });
              }
              
              function rmCategoria(catId) {
                setOrcBase(function(prev) {
                  var n = Object.assign({}, prev);
                  n.categorias = (n.categorias || []).filter(function(cat) { return cat.id !== catId; });
                  return n;
                });
              }
              
              function addItem(catId) {
                setOrcBase(function(prev) {
                  var n = Object.assign({}, prev);
                  n.categorias = (n.categorias || []).map(function(cat) {
                    if (cat.id !== catId) return cat;
                    return Object.assign({}, cat, { itens: (cat.itens || []).concat([{ id: uid(), nome: "", valor: 0 }]) });
                  });
                  return n;
                });
              }
              
              function upItem(catId, itemId, field, value) {
                setOrcBase(function(prev) {
                  var n = Object.assign({}, prev);
                  n.categorias = (n.categorias || []).map(function(cat) {
                    if (cat.id !== catId) return cat;
                    var itens = (cat.itens || []).map(function(it) { return it.id === itemId ? Object.assign({}, it, { [field]: value }) : it; });
                    var total = itens.reduce(function(a, b) { return a + (b.valor || 0); }, 0);
                    return Object.assign({}, cat, { itens: itens, limite: total > 0 ? total : cat.limite });
                  });
                  return n;
                });
              }
              
              function rmItem(catId, itemId) {
                setOrcBase(function(prev) {
                  var n = Object.assign({}, prev);
                  n.categorias = (n.categorias || []).map(function(cat) {
                    if (cat.id !== catId) return cat;
                    var itens = (cat.itens || []).filter(function(it) { return it.id !== itemId; });
                    return Object.assign({}, cat, { itens: itens });
                  });
                  return n;
                });
              }
              
              // Calculate real spending per category from months data
              function getReal(cat) {
                var md = months[orcMesView] || {};
                var total = 0;
                (cat.itens || []).forEach(function(item) {
                  var nome = (item.nome || "").toLowerCase();
                  if (!nome) return;
                  ["fixas", "variaveis", "cartoes_itens"].forEach(function(tipo) {
                    (md[tipo] || []).forEach(function(it) {
                      if ((it.nome || "").toLowerCase().includes(nome)) {
                        total += (it.valor || 0);
                      }
                    });
                  });
                });
                return total;
              }
              
              var totalOrcado = cats.reduce(function(a, cat) { return a + (cat.limite || 0); }, 0);
              var md = months[orcMesView] || {};
              var totalReal = ["fixas", "variaveis", "cartoes_itens"].reduce(function(a, tipo) {
                return a + (md[tipo] || []).reduce(function(b, it) { return b + (it.valor || 0); }, 0);
              }, 0);
              
              return (
                <div>
                  {/* Header */}
                  <div className="stats-grid-4" style={{ marginBottom: 14 }}>
                    <Stat label="Orçado" value={totalOrcado} color={C.b} sub="Modelo base" />
                    <Stat label="Realizado" value={totalReal} color={totalReal > totalOrcado ? C.r : C.g} sub={MSH[MS.indexOf(orcMesView)]} />
                    <Stat label="Diferença" value={totalOrcado - totalReal} icon={totalOrcado >= totalReal ? "" : ""} color={totalOrcado >= totalReal ? C.g : C.r} sub={totalOrcado > 0 ? Math.round((totalReal / totalOrcado) * 100) + "% usado" : ""} />
                    <Stat label="Categorias" value={cats.length} color={C.a} sub={cats.reduce(function(a,c) { return a + (c.itens||[]).length; }, 0) + " itens"} />
                  </div>
                  
                  {/* Month selector for comparison */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6, marginBottom: 14 }}>
                    {MS.map(function(m, i) {
                      return <button key={m} onClick={function() { setDiarioMes(m); }} style={{ background: orcMesView === m ? C.bB : "rgba(255,255,255,.03)", border: orcMesView === m ? "1px solid " + C.b + "40" : "1px solid " + C.border, color: orcMesView === m ? C.b : C.dm, padding: "8px 6px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: orcMesView === m ? 700 : 400, textAlign: "center" }}>{MSH[i]}</button>;
                    })}
                  </div>
                  
                  {/* Barra geral */}
                  {totalOrcado > 0 && (
                    <div style={{ marginBottom: 16, padding: 12, background: C.card, borderRadius: 10, border: "1px solid " + C.border }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6 }}>
                        <span style={{ color: C.tx, fontWeight: 600 }}>Total Geral</span>
                        <span style={{ fontFamily: "'JetBrains Mono',monospace" }}>
                          <span style={{ color: totalReal > totalOrcado ? C.r : C.g }}>{fmt(totalReal)}</span>
                          <span style={{ color: C.dm }}> / {fmt(totalOrcado)}</span>
                        </span>
                      </div>
                      <div style={{ height: 8, background: "rgba(255,255,255,.06)", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: Math.min((totalReal / totalOrcado) * 100, 100) + "%", background: totalReal > totalOrcado ? C.r : C.g, borderRadius: 4, transition: "width .4s" }} />
                      </div>
                    </div>
                  )}
                  
                  {/* Categorias */}
                  {cats.map(function(cat, ci) {
                    var realGasto = getReal(cat);
                    var limite = cat.limite || 0;
                    var pctUsado = limite > 0 ? Math.round((realGasto / limite) * 100) : 0;
                    var overBudget = realGasto > limite && limite > 0;
                    
                    return (
                      <Section key={cat.id} title={cat.nome || "Nova Categoria"} action={
                        <div style={{ display: "flex", gap: 4 }}>
                          <Btn onClick={function() { addItem(cat.id); }} color={C.g} small>+ Item</Btn>
                          <button onClick={function() { if (window.confirm("Remover categoria?")) rmCategoria(cat.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: C.dm2, fontSize: 11 }}>✕</button>
                        </div>
                      }>
                        {/* Category header */}
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                          <EText value={cat.nome} onChange={function(v) { upCategoria(cat.id, "nome", v); }} placeholder="Nome da categoria..." w={160} />
                          <span style={{ color: C.dm, fontSize: 10 }}>Limite:</span>
                          <ENum value={cat.limite} onChange={function(v) { upCategoria(cat.id, "limite", v); }} color={C.b} w={70} />
                        </div>
                        
                        {/* Progress bar */}
                        {limite > 0 && (
                          <div style={{ marginBottom: 10 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 3 }}>
                              <span style={{ color: overBudget ? C.r : C.g, fontWeight: 600 }}>{pctUsado}% usado</span>
                              <span style={{ fontFamily: "'JetBrains Mono',monospace" }}>
                                <span style={{ color: overBudget ? C.r : C.g }}>{fmt(realGasto)}</span>
                                <span style={{ color: C.dm }}> / {fmt(limite)}</span>
                              </span>
                            </div>
                            <div style={{ height: 6, background: "rgba(255,255,255,.06)", borderRadius: 3, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: Math.min(pctUsado, 100) + "%", background: overBudget ? C.r : pctUsado > 80 ? C.a : C.g, borderRadius: 3, transition: "width .4s" }} />
                            </div>
                          </div>
                        )}
                        
                        {/* Items */}
                        {(cat.itens || []).length > 0 && (
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                            <thead>
                              <tr style={{ borderBottom: "1px solid " + C.border }}>
                                <th style={{ padding: "6px 8px", textAlign: "left", color: C.dm, fontSize: 10 }}>Item</th>
                                <th style={{ padding: "6px 8px", textAlign: "right", color: C.dm, fontSize: 10, width: 90 }}>Orçado</th>
                                <th style={{ padding: "6px 8px", textAlign: "right", color: C.dm, fontSize: 10, width: 90 }}>Real</th>
                                <th style={{ padding: "6px 8px", textAlign: "center", color: C.dm, fontSize: 10, width: 30 }}></th>
                              </tr>
                            </thead>
                            <tbody>
                              {(cat.itens || []).map(function(item) {
                                // Find real value matching item name
                                var itemNome = (item.nome || "").toLowerCase();
                                var itemReal = 0;
                                if (itemNome) {
                                  ["fixas", "variaveis", "cartoes_itens"].forEach(function(tipo) {
                                    (md[tipo] || []).forEach(function(it) {
                                      if ((it.nome || "").toLowerCase().includes(itemNome)) itemReal += (it.valor || 0);
                                    });
                                  });
                                }
                                var itemOver = itemReal > (item.valor || 0) && (item.valor || 0) > 0;
                                return (
                                  <tr key={item.id} style={{ borderBottom: "1px solid " + C.border }}>
                                    <td style={{ padding: "5px 8px" }}><EText value={item.nome} onChange={function(v) { upItem(cat.id, item.id, "nome", v); }} placeholder="Nome..." w={120} /></td>
                                    <td style={{ padding: "5px 8px", textAlign: "right" }}><ENum value={item.valor} onChange={function(v) { upItem(cat.id, item.id, "valor", v); }} color={C.b} w={65} /></td>
                                    <td style={{ padding: "5px 8px", textAlign: "right", fontFamily: "'JetBrains Mono',monospace", color: itemOver ? C.r : itemReal > 0 ? C.g : C.dm2, fontSize: 11 }}>{itemReal > 0 ? fmt(itemReal) : "—"}</td>
                                    <td style={{ padding: "5px 4px", textAlign: "center" }}>
                                      <button onClick={function() { rmItem(cat.id, item.id); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: C.dm2 }}>✕</button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </Section>
                    );
                  })}
                  
                  {/* Add category button */}
                  <button onClick={addCategoria} style={{ width: "100%", padding: 14, background: "rgba(255,255,255,.02)", border: "1px dashed " + C.border, borderRadius: 12, color: C.dm, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    + Nova Categoria
                  </button>
                </div>
              );
            })()}
          </div>
        )}

                {view === "config" && (
          <div style={{ animation: "fadeIn .3s" }}>
            {/* Aparência */}
            <Section title="Aparência">
              <div style={{ marginBottom: 20 }}>
                <label style={{ color: C.dm, fontSize: 11, fontWeight: 600, display: "block", marginBottom: 8 }}>TEMA</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[{id:"dark",label:" Escuro"},{id:"light",label:"️ Claro"}].map(function(t) {
                    return <button key={t.id} onClick={function() { setTheme(t.id); }} style={{ padding: "10px 20px", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600, border: theme === t.id ? "2px solid " + C.b : "1px solid " + C.border, background: theme === t.id ? C.bB : "transparent", color: theme === t.id ? C.b : C.dm }}>{t.label}</button>;
                  })}
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ color: C.dm, fontSize: 11, fontWeight: 600, display: "block", marginBottom: 8 }}>COR PRINCIPAL</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {Object.entries(ACCENTS).map(function(entry) {
                    var key = entry[0], ac = entry[1];
                    return <button key={key} onClick={function() { setAccent(key); }} style={{ width: 40, height: 40, borderRadius: 12, background: ac.main, border: accent === key ? "3px solid " + C.tx : "2px solid transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, transition: "transform .15s", transform: accent === key ? "scale(1.15)" : "scale(1)" }}>{accent === key ? "✓" : ""}</button>;
                  })}
                </div>
              </div>
            </Section>

            {/* Dados Pessoais */}
            <Section title="Dados Pessoais" icon="">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ color: C.dm, fontSize: 10, fontWeight: 600, display: "block", marginBottom: 4 }}>NOME</label>
                  <input value={settings.nome || ""} onChange={function(e) { setSettings(function(p) { return Object.assign({}, p, { nome: e.target.value }); }); }} placeholder="Seu nome..." style={{ width: "100%", background: "rgba(255,255,255,.05)", border: "1px solid " + C.border, borderRadius: 8, padding: "10px 12px", color: C.tx, fontSize: 13, outline: "none" }} />
                </div>
                <div>
                  <label style={{ color: C.dm, fontSize: 10, fontWeight: 600, display: "block", marginBottom: 4 }}>EMAIL</label>
                  <input value={settings.email || session?.user?.email || ""} disabled style={{ width: "100%", background: "rgba(255,255,255,.03)", border: "1px solid " + C.border, borderRadius: 8, padding: "10px 12px", color: C.dm, fontSize: 13, outline: "none" }} />
                </div>
              </div>
            </Section>

            {/* Segurança */}
            <Section title="Segurança" icon="">
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "rgba(255,255,255,.03)", borderRadius: 10, border: "1px solid " + C.border }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>Email da conta</div>
                    <div style={{ fontSize: 11, color: C.dm }}>{session?.user?.email}</div>
                  </div>
                  <span style={{ fontSize: 10, color: C.g, background: C.gB, padding: "3px 8px", borderRadius: 6 }}>Verificado</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "rgba(255,255,255,.03)", borderRadius: 10, border: "1px solid " + C.border }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>Último acesso</div>
                    <div style={{ fontSize: 11, color: C.dm }}>{new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                </div>
                <button onClick={function() { supabase.auth.resetPasswordForEmail(session?.user?.email || "").then(function() { alert("Email de alteração de senha enviado!"); }).catch(function(e) { alert("Erro: " + e.message); }); }} style={{ padding: "12px", background: C.bB, border: "1px solid " + C.b + "30", borderRadius: 10, color: C.b, fontSize: 13, fontWeight: 600, cursor: "pointer" }}> Alterar senha</button>
                <button onClick={function() { setShowTutorial(true); }} style={{ padding: "12px", background: C.bB, border: "1px solid " + C.b + "30", borderRadius: 10, color: C.b, fontSize: 13, fontWeight: 600, cursor: "pointer" }}> Tutorial do App</button>
                <button onClick={function() { if (window.confirm("ATENÇÃO: Isso vai apagar TODOS os seus dados de " + ano + ". Tem certeza?") && window.confirm("Última chance! Confirmar exclusão dos dados?")) { resetToEmpty(); save(buildEmptyMonths(), buildEmptyDiario(), []); alert("Dados zerados!"); } }} style={{ padding: "12px", background: C.aB, border: "1px solid " + C.a + "30", borderRadius: 10, color: C.a, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>️ Zerar dados do ano</button>
                <button onClick={function() { if (window.confirm("Tem certeza que deseja sair?")) supabase.auth.signOut(); }} style={{ padding: "12px", background: C.rB, border: "1px solid " + C.r + "30", borderRadius: 10, color: C.r, fontSize: 13, fontWeight: 600, cursor: "pointer" }}> Sair da conta</button>
                <button onClick={function() { if (window.confirm("ATENÇÃO: Isso vai APAGAR SUA CONTA e todos os dados permanentemente!") && window.confirm("Última chance! Não tem volta!")) { supabase.from("financeiro").delete().eq("user_id", userId).then(function() { supabase.auth.signOut(); }); } }} style={{ padding: "12px", background: "rgba(220,38,38,.05)", border: "1px solid rgba(220,38,38,.2)", borderRadius: 10, color: "#dc2626", fontSize: 11, fontWeight: 500, cursor: "pointer" }}>Apagar minha conta</button>
              </div>
            </Section>

            {/* Dados & Backup */}
            <Section title="Dados & Backup" icon="">
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={exportCSV} style={{ padding: "10px 16px", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600, border: "1px solid " + C.g + "40", background: C.gB, color: C.g }}> Exportar CSV</button>
                  <button onClick={exportBackup} style={{ padding: "10px 16px", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600, border: "1px solid " + C.b + "40", background: C.bB, color: C.b }}> Backup JSON</button>
                  <button onClick={importBackup} style={{ padding: "10px 16px", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600, border: "1px solid " + C.a + "40", background: C.aB, color: C.a }}> Restaurar Backup</button>
                </div>
                <div style={{ fontSize: 10, color: C.dm, marginTop: 4 }}>
                  <div>• CSV exporta o resumo anual (abre no Excel/Google Sheets)</div>
                  <div>• Backup JSON salva TODOS os dados do ano {ano}</div>
                  <div>• Restaurar importa um backup JSON previamente salvo</div>
                </div>
              </div>
            </Section>

            {/* Sobre */}
            <Section title="Sobre" icon="ℹ️">
              <div style={{ fontSize: 12, color: C.dm, lineHeight: 1.8 }}>
                <div>Versão <span style={{ color: C.tx, fontWeight: 600 }}>3.0.0</span></div>
                <div>Desenvolvido com ️ por <span style={{ color: C.b }}>Jean Lucas & Claude</span></div>
                <div>Stack: Next.js + Supabase + Recharts</div>
              </div>
            </Section>
          </div>
        )}

      </main>
      {/* Mobile Bottom Nav */}
      <nav className="mobile-bottom-nav" style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 72, background: C.card, borderTop: "1px solid " + C.border, display: "none", alignItems: "center", justifyContent: "space-around", padding: "0 8px 8px", zIndex: 200 }}>
        {navItems.map(function(n) {
          var iconFns = { overview: IC.grid, meses: IC.calendar, metas: IC.target, investimentos: IC.trending, config: IC.settings };
          var labels = { overview: "Geral", meses: "Meses", metas: "Metas", investimentos: "Invest.", config: "Config" };
          var IconFn = iconFns[n.id] || IC.grid;
          return <button key={n.id} onClick={function() { setView(n.id); }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", color: view === n.id ? C.g : C.dm2, fontSize: 10, fontWeight: view === n.id ? 600 : 400, cursor: "pointer", padding: "6px 12px", fontFamily: "'Manrope',sans-serif" }}>
            <span style={{ width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center" }}><IconFn /></span>
            <span>{labels[n.id] || n.label}</span>
            {view === n.id && <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.g }} />}
          </button>;
        })}
      </nav>

      {showAddCartao ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", backdropFilter: "blur(6px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowAddCartao(false)}>
          <div style={{ background: C.card, borderRadius: 16, padding: 24, width: 340, border: "1px solid " + C.bL }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: 16, fontSize: 15 }}>Novo Cartão</h3>
            <input value={newCartao} onChange={(e) => setNewCartao(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addCartao(); }} placeholder="Ex: C6, Inter, PicPay..." style={{ width: "100%", background: "rgba(255,255,255,.05)", border: "1px solid " + C.border, borderRadius: 8, padding: "10px 14px", color: C.tx, fontSize: 13, outline: "none", marginBottom: 12 }} autoFocus />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Btn onClick={() => setShowAddCartao(false)} color={C.dm}>Cancelar</Btn>
              <Btn onClick={addCartao} color={C.g}>Adicionar</Btn>
            </div>
            {cartaosList.length > 0 ? (
              <div style={{ marginTop: 16, borderTop: "1px solid " + C.border, paddingTop: 12 }}>
                <div style={{ fontSize: 10, color: C.dm, marginBottom: 8 }}>Cartões cadastrados:</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {cartaosList.map((c, i) => (
                    <span key={c} style={{ padding: "3px 10px", background: PC_BASE[i % PC_BASE.length] + "18", border: "1px solid " + PC_BASE[i % PC_BASE.length] + "40", borderRadius: 6, fontSize: 10, color: PC_BASE[i % PC_BASE.length], display: "inline-flex", alignItems: "center", gap: 4 }}>{c}<button onClick={function(ev) { ev.stopPropagation(); if (window.confirm("Excluir cartão " + c + "?")) { var nl = cartaosList.filter(function(x) { return x !== c; }); setCartaosList(nl); save(months, diario, nl); } }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 8, color: PC_BASE[i % PC_BASE.length], padding: 0, lineHeight: 1 }}>✕</button></span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
export default Dashboard;
