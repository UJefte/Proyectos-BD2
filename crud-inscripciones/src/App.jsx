import { useState, useEffect, useCallback, useRef } from "react";

const API = "http://localhost:3001/api";

// ── Estilos base ─────────────────────────────────────────────
const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; background: #f5f6fa; color: #1a1a2e; font-size: 14px; }
  input, select, button { font-family: inherit; font-size: 14px; }
  button { cursor: pointer; }
`;

// ── Colores ───────────────────────────────────────────────────
const C = {
  azul:    "#003f8a",
  azulL:   "#e8eef7",
  gris:    "#64748b",
  grisL:   "#f0f2f5",
  borde:   "#e0e4ea",
  verde:   "#15803d",
  verdeL:  "#f0fdf4",
  rojo:    "#dc2626",
  rojoL:   "#fef2f2",
  ambar:   "#b45309",
  ambarL:  "#fffbeb",
  blanco:  "#ffffff",
  texto:   "#1a1a2e",
  textoS:  "#64748b",
};

// ── Componentes base ─────────────────────────────────────────
function Tag({ color, bg, children }) {
  return (
    <span style={{ display:"inline-block", padding:"2px 8px", borderRadius:4,
      fontSize:11, fontWeight:600, color, background:bg, whiteSpace:"nowrap" }}>
      {children}
    </span>
  );
}

function Alert({ tipo, msg }) {
  const map = { error:{bg:C.rojoL,c:C.rojo}, ok:{bg:C.verdeL,c:C.verde}, info:{bg:C.azulL,c:C.azul} };
  const s = map[tipo] || map.info;
  return (
    <div style={{ background:s.bg, color:s.c, border:`1px solid ${s.c}22`,
      borderRadius:8, padding:"10px 14px", fontSize:13, marginBottom:12 }}>
      {msg}
    </div>
  );
}

function Spinner() {
  return <div style={{ textAlign:"center", padding:40, color:C.gris }}>Cargando…</div>;
}

// ── LOGIN ────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [form, setForm] = useState({ matricula:"", contrasena:"" });
  const [err,  setErr]  = useState("");
  const [load, setLoad] = useState(false);

  const submit = async () => {
    if (!form.matricula) { setErr("Ingresa tu número de cuenta"); return; }
    setLoad(true); setErr("");
    try {
      const r = await fetch(`${API}/login`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify(form)
      });
      const d = await r.json();
      if (!d.ok) { setErr(d.msg); } else { onLogin(d.alumno); }
    } catch { setErr("No se pudo conectar al servidor. ¿Está corriendo node server.js?"); }
    setLoad(false);
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center",
      justifyContent:"center", background:C.grisL }}>
      <style>{css}</style>
      <div style={{ width:360 }}>
        {/* Logo UNAM */}
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.azul, letterSpacing:1,
            textTransform:"uppercase" }}>Universidad Nacional Autónoma de México</div>
          <div style={{ fontSize:12, color:C.gris, marginTop:4 }}>
            Facultad de Estudios Superiores Aragón
          </div>
        </div>

        <div style={{ background:C.blanco, borderRadius:10, border:`1px solid ${C.borde}`,
          padding:"28px 28px 24px" }}>
          <div style={{ fontSize:17, fontWeight:700, color:C.texto, marginBottom:4 }}>
            Sistema de Inscripciones
          </div>
          <div style={{ fontSize:12, color:C.gris, marginBottom:24 }}>
            Período 2026-1 · Ingeniería en Computación
          </div>

          {err && <Alert tipo="error" msg={err}/>}

          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block", fontSize:12, color:C.gris,
              fontWeight:600, marginBottom:6 }}>Número de cuenta</label>
            <input
              style={{ width:"100%", padding:"9px 12px", border:`1px solid ${C.borde}`,
              borderRadius:6, outline:"none", background:C.grisL,
              color: C.texto,
              fontSize:15, letterSpacing:1, textAlign:"center" }}
              value={form.matricula}
              onChange={e => setForm(f => ({ ...f, matricula:e.target.value }))}
              onKeyDown={e => e.key==="Enter" && submit()}
              placeholder="320XXXXXXX"
              type="text"
            />
          </div>

          <div style={{ marginBottom:20 }}>
            <label style={{ display:"block", fontSize:12, color:C.gris,
              fontWeight:600, marginBottom:6 }}>Contraseña (NIP)</label>
            <input
              style={{ width:"100%", padding:"9px 12px", border:`1px solid ${C.borde}`,
              borderRadius:6, outline:"none", background:C.grisL,
              color: C.texto,
              fontSize:15, letterSpacing:3, textAlign:"center" }}
              value={form.contrasena}
              onChange={e => setForm(f => ({ ...f, contrasena:e.target.value }))}
              onKeyDown={e => e.key==="Enter" && submit()}
              type="password"
              placeholder="••••••••••"
            />
            <div style={{ fontSize:11, color:C.gris, marginTop:5 }}>
              Por defecto la contraseña es tu número de cuenta
            </div>
          </div>

          <button
            onClick={submit}
            disabled={load}
            style={{ width:"100%", padding:"10px", background:C.azul, color:"#fff",
              border:"none", borderRadius:6, fontWeight:600, fontSize:14,
              opacity:load?0.7:1 }}>
            {load ? "Verificando…" : "Ingresar"}
          </button>
        </div>

        <div style={{ textAlign:"center", marginTop:16, fontSize:11, color:`${C.gris}88` }}>
          ICO · FES Aragón · UNAM · 2026
        </div>
      </div>
    </div>
  );
}

// ── TARJETA DE GRUPO ─────────────────────────────────────────
function GrupoCard({ g, inscritaId, onInscribir, onDesinscribir, loading }) {
  const lleno = g.cupo_disponible <= 0;
  const inscrito = inscritaId != null;

  return (
    <div style={{ border:`1px solid ${inscrito?C.azul:lleno?C.borde:C.borde}`,
      borderRadius:8, padding:"12px 14px", marginBottom:8,
      background: inscrito ? C.azulL : lleno ? C.grisL : C.blanco }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
            <span style={{ fontFamily:"monospace", fontWeight:700, fontSize:15,
              color: inscrito ? C.azul : C.texto }}>
              Grupo {g.clave_grupo}
            </span>
            <Tag color={g.turno==="Matutino"?C.azul:C.ambar}
                 bg={g.turno==="Matutino"?C.azulL:C.ambarL}>
              {g.turno}
            </Tag>
            {inscrito && <Tag color={C.verde} bg={C.verdeL}>✓ Inscrito</Tag>}
            {lleno && !inscrito && <Tag color={C.rojo} bg={C.rojoL}>Sin cupo</Tag>}
          </div>

          <div style={{ fontSize:12, color:C.gris, marginBottom:4 }}>
            <span style={{ fontWeight:500 }}>Prof.</span> {g.profesor}
          </div>

          {g.dias_horas && (
            <div style={{ fontSize:12, color:C.gris, marginBottom:4 }}>
              🕐 {g.dias_horas}
            </div>
          )}

          {g.salon && (
            <div style={{ fontSize:12, color:C.gris }}>
              📍 {g.salon}
            </div>
          )}
        </div>

        {/* Cupo */}
        <div style={{ textAlign:"center", minWidth:70, marginLeft:12 }}>
          <div style={{ fontSize:11, color:C.gris, marginBottom:2 }}>Cupo</div>
          <div style={{ fontSize:18, fontWeight:700,
            color: g.cupo_disponible===0?C.rojo:g.cupo_disponible<=5?C.ambar:C.verde }}>
            {g.cupo_disponible}
          </div>
          <div style={{ fontSize:10, color:C.gris }}>de {g.cupo_maximo}</div>

          {/* Barra de cupo */}
          <div style={{ height:3, background:C.borde, borderRadius:2, marginTop:4 }}>
            <div style={{ height:"100%", borderRadius:2,
              width:`${Math.round(100*(g.cupo_maximo-g.cupo_disponible)/g.cupo_maximo)}%`,
              background:g.cupo_disponible===0?C.rojo:g.cupo_disponible<=5?C.ambar:C.verde }}/>
          </div>
        </div>
      </div>

      {/* Botones */}
      <div style={{ marginTop:10, display:"flex", justifyContent:"flex-end" }}>
        {inscrito ? (
          <button onClick={() => onDesinscribir(inscritaId)}
            disabled={loading}
            style={{ padding:"5px 14px", background:"transparent", color:C.rojo,
              border:`1px solid ${C.rojo}`, borderRadius:5, fontSize:12, fontWeight:500 }}>
            Desinscribir
          </button>
        ) : (
          <button onClick={() => onInscribir(g.id_grupo)}
            disabled={lleno || loading}
            style={{ padding:"5px 14px",
              background: lleno ? C.grisL : C.azul,
              color: lleno ? C.gris : "#fff",
              border:`1px solid ${lleno?C.borde:C.azul}`,
              borderRadius:5, fontSize:12, fontWeight:500,
              opacity: loading ? 0.6 : 1 }}>
            {loading ? "…" : lleno ? "Sin cupo" : "Inscribir"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── MATERIA ACORDEÓN ─────────────────────────────────────────
function MateriaAcordeon({ materia, grupos, inscritas, onInscribir, onDesinscribir, opCount }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const inscritaEnMateria = inscritas.find(i => i.clave_materia === materia.clave_materia);
  const esOptativa = materia.tipo === "Optativa";

  const handleInscribir = async (id_grupo) => {
    if (esOptativa && opCount >= 3 && !inscritaEnMateria)
      return setMsg({ tipo:"error", msg:"Límite de 3 optativas alcanzado." });
    setLoading(true); setMsg(null);
    const ok = await onInscribir(id_grupo);
    if (!ok.ok) setMsg({ tipo:"error", msg: ok.msg });
    else setMsg({ tipo:"ok", msg:"¡Inscripción realizada!" });
    setLoading(false);
    setTimeout(() => setMsg(null), 3000);
  };

  const handleDesinscribir = async (id) => {
    setLoading(true); setMsg(null);
    const ok = await onDesinscribir(id);
    if (!ok.ok) setMsg({ tipo:"error", msg: ok.msg });
    else setMsg({ tipo:"ok", msg:"Materia desinscrita." });
    setLoading(false);
    setTimeout(() => setMsg(null), 3000);
  };

  const tieneGrupos = grupos && grupos.length > 0;

  return (
    <div style={{ border:`1px solid ${inscritaEnMateria?C.azul:C.borde}`,
      borderRadius:8, marginBottom:8, overflow:"hidden",
      background: inscritaEnMateria ? C.azulL : C.blanco }}>

      {/* Header materia */}
      <div onClick={() => tieneGrupos && setOpen(o=>!o)}
        style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"12px 16px", cursor: tieneGrupos ? "pointer" : "default" }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontWeight:600, color:C.texto }}>{materia.nombre}</span>
            <span style={{ fontFamily:"monospace", fontSize:11, color:C.gris }}>
              {materia.clave_materia}
            </span>
            {inscritaEnMateria && <Tag color={C.verde} bg={C.verdeL}>✓ Inscrita</Tag>}
            {!tieneGrupos && <Tag color={C.gris} bg={C.grisL}>Sin grupos disponibles</Tag>}
          </div>
          <div style={{ fontSize:11, color:C.gris, marginTop:3 }}>
            {materia.area} · {materia.creditos} créditos
            {materia.tiene_lab ? " · Con laboratorio" : ""}
          </div>
        </div>
        {tieneGrupos && (
          <span style={{ color:C.gris, fontSize:18, transform: open?"rotate(180deg)":"none",
            transition:"transform .2s" }}>⌄</span>
        )}
      </div>

      {/* Grupos */}
      {open && tieneGrupos && (
        <div style={{ padding:"0 16px 14px", borderTop:`1px solid ${C.borde}` }}>
          {msg && <div style={{ marginTop:10 }}><Alert tipo={msg.tipo} msg={msg.msg}/></div>}
          <div style={{ marginTop:12 }}>
            {grupos.map(g => (
              <GrupoCard key={g.id_grupo} g={g}
                inscritaId={inscritas.find(i=>i.id_grupo===g.id_grupo)?.id_inscripcion ?? null}
                onInscribir={handleInscribir}
                onDesinscribir={handleDesinscribir}
                loading={loading}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── CONSTANCIA ───────────────────────────────────────────────
function Constancia({ alumno, inscripciones, fecha, onClose }) {
  const printRef = useRef();

  const imprimir = () => {
    const w = window.open('','_blank');
    w.document.write(`
      <html><head><title>Constancia de Inscripción</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; color:#1a1a2e; padding:30px; max-width:800px; margin:0 auto; }
        h1 { font-size:16px; text-align:center; margin-bottom:4px; }
        h2 { font-size:13px; text-align:center; color:#64748b; font-weight:normal; margin-bottom:20px; }
        .info { background:#f5f6fa; border-radius:8px; padding:14px; margin-bottom:20px; display:grid; grid-template-columns:1fr 1fr; gap:8px; }
        .info-item label { font-size:11px; color:#64748b; font-weight:600; text-transform:uppercase; display:block; }
        .info-item span { font-size:13px; font-weight:500; }
        table { width:100%; border-collapse:collapse; margin-bottom:20px; }
        th { background:#003f8a; color:#fff; padding:8px 10px; font-size:11px; text-align:left; text-transform:uppercase; letter-spacing:.5px; }
        td { padding:8px 10px; border-bottom:1px solid #e0e4ea; font-size:12px; }
        tr:nth-child(even) td { background:#f8f9fb; }
        .footer { font-size:11px; color:#64748b; text-align:center; margin-top:30px; padding-top:12px; border-top:1px solid #e0e4ea; }
        .sello { text-align:center; margin:30px 0 10px; font-size:12px; color:#64748b; }
        @media print { body { padding:10px; } }
      </style></head><body>
      <h1>UNIVERSIDAD NACIONAL AUTÓNOMA DE MÉXICO</h1>
      <h2>Facultad de Estudios Superiores Aragón — Constancia de Inscripción</h2>
      <div class="info">
        <div class="info-item"><label>Nombre</label><span>${alumno.nombre} ${alumno.ap_paterno} ${alumno.ap_materno}</span></div>
        <div class="info-item"><label>Número de cuenta</label><span>${alumno.matricula}</span></div>
        <div class="info-item"><label>Carrera</label><span>${alumno.carrera}</span></div>
        <div class="info-item"><label>Semestre</label><span>${alumno.semestre}°</span></div>
        <div class="info-item"><label>Turno</label><span>${alumno.turno}</span></div>
        <div class="info-item"><label>Sistema</label><span>${alumno.sistema}</span></div>
        <div class="info-item"><label>Generación</label><span>${alumno.generacion}</span></div>
        <div class="info-item"><label>Período</label><span>2026-1</span></div>
      </div>
      <table>
        <thead><tr><th>#</th><th>Materia</th><th>Grupo</th><th>Créditos</th><th>Profesor</th><th>Horario</th><th>Salón</th></tr></thead>
        <tbody>
          ${inscripciones.map((i,n)=>`
            <tr>
              <td>${n+1}</td>
              <td><strong>${i.materia}</strong><br><small style="color:#64748b">Clave: ${i.clave_materia} · ${i.tipo}</small></td>
              <td style="font-family:monospace;font-weight:700">${i.clave_grupo}</td>
              <td style="text-align:center">${i.creditos}</td>
              <td>${i.profesor}</td>
              <td style="font-size:11px">${i.horario||'—'}</td>
              <td>${i.salon||'—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div style="display:flex;justify-content:space-between;padding:10px 0;border-top:1px solid #e0e4ea;font-size:12px;">
        <span>Total de materias: <strong>${inscripciones.length}</strong></span>
        <span>Total de créditos: <strong>${inscripciones.reduce((s,i)=>s+Number(i.creditos),0)}</strong></span>
      </div>
      <div class="sello">
        <br><br>
        _________________________ <br>
        Sello de Control Escolar<br>
        Fecha de emisión: ${fecha}
      </div>
      <div class="footer">
        Documento generado el ${fecha} · Sistema de Inscripciones ICO · FES Aragón · UNAM<br>
        Este documento es informativo. Consérvalo como comprobante de tu inscripción.
      </div>
      </body></html>
    `);
    w.document.close();
    w.print();
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)",
      display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:C.blanco, borderRadius:10, padding:24, width:520,
        maxHeight:"80vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between",
          alignItems:"center", marginBottom:16 }}>
          <div>
            <div style={{ fontWeight:700, fontSize:16 }}>Constancia de Inscripción</div>
            <div style={{ fontSize:12, color:C.gris }}>Período 2026-1</div>
          </div>
          <button onClick={onClose}
            style={{ background:"none", border:"none", fontSize:20, color:C.gris }}>×</button>
        </div>

        {/* Resumen */}
        <div style={{ background:C.grisL, borderRadius:8, padding:14, marginBottom:16,
          display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          {[
            ["Nombre", `${alumno.nombre} ${alumno.ap_paterno}`],
            ["Matrícula", alumno.matricula],
            ["Carrera", alumno.carrera],
            ["Semestre", `${alumno.semestre}°`],
          ].map(([l,v]) => (
            <div key={l}>
              <div style={{ fontSize:10, color:C.gris, fontWeight:600,
                textTransform:"uppercase" }}>{l}</div>
              <div style={{ fontSize:13, fontWeight:500 }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Tabla de inscripciones */}
        <div style={{ marginBottom:16 }}>
          {inscripciones.map((i,n) => (
            <div key={i.clave_materia} style={{ padding:"10px 0",
              borderBottom:`1px solid ${C.borde}` }}>
              <div style={{ display:"flex", justifyContent:"space-between",
                alignItems:"flex-start" }}>
                <div>
                  <div style={{ fontWeight:600, fontSize:13 }}>{i.materia}</div>
                  <div style={{ fontSize:11, color:C.gris, marginTop:2 }}>
                    {i.profesor} · {i.horario||'—'} · {i.salon||'—'}
                  </div>
                </div>
                <div style={{ textAlign:"right", marginLeft:12 }}>
                  <div style={{ fontFamily:"monospace", fontWeight:700, color:C.azul }}>
                    {i.clave_grupo}
                  </div>
                  <div style={{ fontSize:11, color:C.gris }}>{i.creditos} crd.</div>
                </div>
              </div>
            </div>
          ))}
          <div style={{ display:"flex", justifyContent:"space-between",
            padding:"10px 0", fontWeight:600, fontSize:13 }}>
            <span>Total materias: {inscripciones.length}</span>
            <span>Total créditos: {inscripciones.reduce((s,i)=>s+Number(i.creditos),0)}</span>
          </div>
        </div>

        <button onClick={imprimir}
          style={{ width:"100%", padding:"10px", background:C.azul, color:"#fff",
            border:"none", borderRadius:6, fontWeight:600, fontSize:14 }}>
          🖨️ Imprimir / Guardar PDF
        </button>
      </div>
    </div>
  );
}

// ── PORTAL PRINCIPAL ─────────────────────────────────────────
function Portal({ alumno, onLogout }) {
  const [tab,           setTab]           = useState("obligatorias");
  const [oferta,        setOferta]        = useState(null);
  const [inscripciones, setInscripciones] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [constancia,    setConstancia]    = useState(false);
  const [constData,     setConstData]     = useState(null);
  const [alert,         setAlert]         = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [o, i] = await Promise.all([
        fetch(`${API}/oferta/${alumno.matricula}`).then(r=>r.json()),
        fetch(`${API}/inscripciones/${alumno.matricula}`).then(r=>r.json()),
      ]);
      if (o.ok) setOferta(o);
      if (i.ok) setInscripciones(i.inscripciones);
    } catch { setAlert({ tipo:"error", msg:"Error de conexión con el servidor." }); }
    setLoading(false);
  }, [alumno.matricula]);

  useEffect(() => { cargar(); }, [cargar]);

  const inscritas = oferta?.inscritas || [];
  const opCount   = inscritas.filter(i => {
    const m = oferta?.disponibles?.find(d=>d.clave_materia===i.clave_materia)
           || oferta?.optativas?.find(d=>d.clave_materia===i.clave_materia);
    return m?.tipo === "Optativa";
  }).length;

  const handleInscribir = async (id_grupo) => {
    const r = await fetch(`${API}/inscripciones`,{
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ matricula:alumno.matricula, id_grupo })
    }).then(r=>r.json());
    if (r.ok) cargar();
    return r;
  };

  const handleDesinscribir = async (id) => {
    const r = await fetch(`${API}/inscripciones/${id}`,{ method:"DELETE" }).then(r=>r.json());
    if (r.ok) cargar();
    return r;
  };

  const abrirConstancia = async () => {
    const r = await fetch(`${API}/constancia/${alumno.matricula}`).then(r=>r.json());
    if (r.ok) { setConstData(r); setConstancia(true); }
  };

  // Agrupar disponibles por materia
  const gruposPorMateria = {};
  (oferta?.disponibles || []).forEach(g => {
    if (!gruposPorMateria[g.clave_materia])
      gruposPorMateria[g.clave_materia] = { meta:g, grupos:[] };
    gruposPorMateria[g.clave_materia].grupos.push(g);
  });

  const gruposOptativasPorMateria = {};
  (oferta?.optativas || []).forEach(g => {
    if (!gruposOptativasPorMateria[g.clave_materia])
      gruposOptativasPorMateria[g.clave_materia] = { meta:g, grupos:[] };
    if (g.id_grupo) gruposOptativasPorMateria[g.clave_materia].grupos.push(g);
  });

  const TABS = [
    { id:"obligatorias", label:"Obligatorias" },
    { id:"cursadas",     label:"Cursadas" },
    { id:"optativas",    label:`Optativas (${opCount}/3)` },
    { id:"laboratorios", label:"Laboratorios" },
    { id:"inscritas",    label:`Mis materias (${inscripciones.length})` },
  ];

  return (
    <div style={{ minHeight:"100vh", background:C.grisL }}>
      <style>{css}</style>

      {/* Header */}
      <div style={{ background:C.blanco, borderBottom:`1px solid ${C.borde}`,
        padding:"0 24px" }}>
        <div style={{ maxWidth:900, margin:"0 auto" }}>
          {/* Banda superior */}
          <div style={{ display:"flex", justifyContent:"space-between",
            alignItems:"center", padding:"12px 0",
            borderBottom:`1px solid ${C.borde}` }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:C.azul }}>
                Sistema de Inscripciones · FES Aragón · UNAM
              </div>
              <div style={{ fontSize:11, color:C.gris }}>
                Período 2026-1 · Ingeniería en Computación
              </div>
            </div>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <button onClick={abrirConstancia}
                style={{ padding:"6px 14px", background:C.azulL, color:C.azul,
                  border:`1px solid ${C.azul}33`, borderRadius:6,
                  fontSize:12, fontWeight:600 }}>
                📋 Constancia
              </button>
              <button onClick={onLogout}
                style={{ padding:"6px 14px", background:"transparent", color:C.gris,
                  border:`1px solid ${C.borde}`, borderRadius:6, fontSize:12 }}>
                Salir
              </button>
            </div>
          </div>

          {/* Info alumno */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)",
            gap:16, padding:"14px 0" }}>
            {[
              ["Alumno",     `${alumno.ap_paterno} ${alumno.nombre}`],
              ["Matrícula",  alumno.matricula],
              ["Carrera",    alumno.carrera],
              ["Semestre",   `${alumno.semestre}°`],
              ["Turno",      alumno.turno],
              ["Promedio",   Number(alumno.promedio).toFixed(2)],
            ].map(([l,v]) => (
              <div key={l}>
                <div style={{ fontSize:10, color:C.gris, fontWeight:600,
                  textTransform:"uppercase", letterSpacing:.5 }}>{l}</div>
                <div style={{ fontSize:13, fontWeight:600, color:C.texto,
                  marginTop:2 }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display:"flex", gap:0, borderTop:`1px solid ${C.borde}` }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ padding:"10px 16px", border:"none",
                  background:"transparent", fontSize:13, fontWeight:600,
                  color: tab===t.id ? C.azul : C.gris,
                  borderBottom: tab===t.id ? `2px solid ${C.azul}` : "2px solid transparent",
                  transition:"all .15s" }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div style={{ maxWidth:900, margin:"0 auto", padding:"20px 24px" }}>
        {alert && <Alert tipo={alert.tipo} msg={alert.msg}/>}

        {loading ? <Spinner/> : (
          <>
            {/* ── OBLIGATORIAS */}
            {tab==="obligatorias" && (
              <div>
                <div style={{ fontSize:13, color:C.gris, marginBottom:16 }}>
                  Materias obligatorias disponibles para inscribir en este período.
                  Los semestres 1 al 7 están marcados como cursados.
                </div>
                {Object.values(gruposPorMateria).length === 0
                  ? <Alert tipo="info" msg="No hay materias disponibles para tu semestre."/>
                  : Object.values(gruposPorMateria).map(({ meta, grupos }) => (
                    <MateriaAcordeon key={meta.clave_materia}
                      materia={meta} grupos={grupos}
                      inscritas={inscritas}
                      onInscribir={handleInscribir}
                      onDesinscribir={handleDesinscribir}
                      opCount={opCount}
                    />
                  ))
                }
              </div>
            )}

            {/* ── CURSADAS */}
            {tab==="cursadas" && (
              <div>
                <div style={{ fontSize:13, color:C.gris, marginBottom:16 }}>
                  Materias obligatorias de semestres anteriores (1–{alumno.semestre-1}).
                </div>
                {(oferta?.cursadas||[]).map(m => (
                  <div key={m.clave_materia}
                    style={{ background:C.grisL, border:`1px solid ${C.borde}`,
                      borderRadius:8, padding:"10px 14px", marginBottom:6,
                      display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <span style={{ fontWeight:500, color:C.textoS }}>{m.nombre}</span>
                      <span style={{ fontFamily:"monospace", fontSize:11,
                        color:C.gris, marginLeft:8 }}>{m.clave_materia}</span>
                    </div>
                    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                      <span style={{ fontSize:11, color:C.gris }}>Sem. {m.semestre}</span>
                      <Tag color={C.verde} bg={C.verdeL}>Cursada</Tag>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── OPTATIVAS */}
            {tab==="optativas" && (
              <div>
                <div style={{ fontSize:13, color:C.gris, marginBottom:16 }}>
                  Máximo <strong>3 optativas</strong>. Llevas {opCount} inscrita{opCount!==1?"s":""}.
                </div>
                {opCount >= 3 && <Alert tipo="info" msg="Ya alcanzaste el límite de 3 optativas."/>}
                {Object.values(gruposOptativasPorMateria).map(({ meta, grupos }) => (
                  <MateriaAcordeon key={meta.clave_materia}
                    materia={meta} grupos={grupos}
                    inscritas={inscritas}
                    onInscribir={handleInscribir}
                    onDesinscribir={handleDesinscribir}
                    opCount={opCount}
                  />
                ))}
              </div>
            )}

            {/* ── LABORATORIOS */}
            {tab==="laboratorios" && (
              <div>
                <div style={{ fontSize:13, color:C.gris, marginBottom:16 }}>
                  Materias con componente de laboratorio en el plan ICO.
                  En 8° y 9° semestre no hay materias de laboratorio.
                </div>
    
                <div style={{ marginTop:16 }}>
                  {(oferta?.labs||[]).map(m => (
                    <div key={m.clave_materia}
                      style={{ background:C.blanco, border:`1px solid ${C.borde}`,
                        borderRadius:8, padding:"10px 14px", marginBottom:6,
                        display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <span style={{ fontWeight:500 }}>{m.nombre}</span>
                        <span style={{ fontFamily:"monospace", fontSize:11,
                          color:C.gris, marginLeft:8 }}>{m.clave_materia}</span>
                      </div>
                      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                        <span style={{ fontSize:11, color:C.gris }}>Sem. {m.semestre}</span>
                        <Tag color={C.azul} bg={C.azulL}>Con laboratorio</Tag>
                        {m.semestre <= 7
                          ? <Tag color={C.verde} bg={C.verdeL}>Cursada</Tag>
                          : <Tag color={C.gris} bg={C.grisL}>No aplica sem 8-9</Tag>
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── MIS MATERIAS */}
            {tab==="inscritas" && (
              <div>
                {inscripciones.length === 0
                  ? <Alert tipo="info" msg="No tienes materias inscritas aún. Ve a Obligatorias u Optativas para inscribirte."/>
                  : (
                    <div>
                      <div style={{ fontSize:13, color:C.gris, marginBottom:16 }}>
                        {inscripciones.length} materia{inscripciones.length!==1?"s":""} inscrita{inscripciones.length!==1?"s":""} ·
                        {" "}{inscripciones.reduce((s,i)=>s+Number(i.creditos),0)} créditos totales
                      </div>
                      {inscripciones.map(i => {
                        const insId = inscritas.find(x=>x.id_grupo===i.id_grupo)?.id_inscripcion;
                        return (
                          <div key={i.id_inscripcion}
                            style={{ background:C.blanco, border:`1px solid ${C.borde}`,
                              borderRadius:8, padding:"14px 16px", marginBottom:8 }}>
                            <div style={{ display:"flex", justifyContent:"space-between",
                              alignItems:"flex-start" }}>
                              <div>
                                <div style={{ fontWeight:600, marginBottom:4 }}>
                                  {i.materia}
                                  <span style={{ fontFamily:"monospace", fontSize:11,
                                    color:C.gris, marginLeft:8 }}>{i.clave_materia}</span>
                                </div>
                                <div style={{ fontSize:12, color:C.gris }}>
                                  <span style={{ fontWeight:500 }}>Prof.</span> {i.profesor}
                                </div>
                                {i.horario && (
                                  <div style={{ fontSize:12, color:C.gris, marginTop:2 }}>
                                    🕐 {i.horario}
                                  </div>
                                )}
                                {i.salon && (
                                  <div style={{ fontSize:12, color:C.gris, marginTop:2 }}>
                                    📍 {i.salon}
                                  </div>
                                )}
                              </div>
                              <div style={{ textAlign:"right", minWidth:100 }}>
                                <div style={{ fontFamily:"monospace", fontWeight:700,
                                  color:C.azul }}>Grupo {i.clave_grupo}</div>
                                <div style={{ fontSize:11, color:C.gris }}>{i.creditos} créditos</div>
                                <Tag color={i.tipo==="Optativa"?C.ambar:C.azul}
                                     bg={i.tipo==="Optativa"?C.ambarL:C.azulL}>
                                  {i.tipo}
                                </Tag>
                                <div style={{ marginTop:8 }}>
                                  <button
                                    onClick={async()=>{
                                      const r=await handleDesinscribir(i.id_inscripcion);
                                      if(!r.ok) setAlert({tipo:"error",msg:r.msg});
                                    }}
                                    style={{ padding:"4px 12px", background:"transparent",
                                      color:C.rojo, border:`1px solid ${C.rojo}`,
                                      borderRadius:5, fontSize:11, fontWeight:500 }}>
                                    Desinscribir
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                }
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal constancia */}
      {constancia && constData && (
        <Constancia
          alumno={constData.alumno}
          inscripciones={constData.inscripciones}
          fecha={constData.fecha}
          onClose={() => setConstancia(false)}
        />
      )}
    </div>
  );
}

// ── APP ROOT ─────────────────────────────────────────────────
export default function App() {
  const [alumno, setAlumno] = useState(null);
  if (!alumno) return <Login onLogin={setAlumno}/>;
  return <Portal alumno={alumno} onLogout={() => setAlumno(null)}/>;
}
