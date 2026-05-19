// ─────────────────────────────────────────────────────────────
//  BD Inscripciones ICO  —  Backend Express + MySQL
//  Instalar: npm install express mysql2 cors
//  Correr:   node server.js
// ─────────────────────────────────────────────────────────────
const express = require('express');
const mysql   = require('mysql2/promise');
const cors    = require('cors');

const app  = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// ── Conexión MySQL con variables de entorno para producción
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: process.env.MYSQL_PORT || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'bd_inscripciones_ico',
  waitForConnections: true,
  connectionLimit: 10,
});

// ── Verificar conexión al arrancar
pool.getConnection()
  .then(c => { console.log('✅ MySQL conectado'); c.release(); })
  .catch(e => console.error('❌ Error MySQL:', e.message));

// ────────────────────────────────────────────────────────────
// AUTH: POST /api/login
// body: { matricula, contrasena }
// ────────────────────────────────────────────────────────────
app.post('/api/login', async (req, res) => {
  const { matricula, contrasena } = req.body;
  if (!matricula || !contrasena)
    return res.status(400).json({ ok: false, msg: 'Datos incompletos' });
  try {
    const [rows] = await pool.query(
      `SELECT a.*, c.nombre AS nombre_carrera, c.clave AS clave_carrera
       FROM alumno a JOIN carrera c ON a.id_carrera = c.id_carrera
       WHERE a.matricula = ? AND a.contrasena = ?`,
      [matricula, contrasena]
    );
    if (!rows.length)
      return res.status(401).json({ ok: false, msg: 'Número de cuenta o contraseña incorrectos' });
    const a = rows[0];
    if (a.estado !== 'Activo')
      return res.status(403).json({ ok: false, msg: 'Tu cuenta está dada de baja. Acude a control escolar.' });
    const alumno = {
      matricula: a.matricula, nombre: a.nombre,
      ap_paterno: a.ap_paterno, ap_materno: a.ap_materno,
      correo: a.correo, turno: a.turno, generacion: a.generacion,
      semestre: a.semestre, sistema: a.sistema, estado: a.estado,
      promedio: a.promedio, carrera: a.nombre_carrera, clave_carrera: a.clave_carrera
    };
    res.json({ ok: true, alumno });
  } catch (e) { res.status(500).json({ ok: false, msg: e.message }); }
});

// ────────────────────────────────────────────────────────────
// OFERTA: GET /api/oferta/:matricula
// Devuelve obligatorias disponibles (sem 8 y 9), cursadas (1-7),
// optativas y laboratorios — para ESTA matrícula
// ────────────────────────────────────────────────────────────
app.get('/api/oferta/:matricula', async (req, res) => {
  const { matricula } = req.params;
  try {
    // Semestre actual del alumno
    const [[alu]] = await pool.query('SELECT semestre FROM alumno WHERE matricula=?',[matricula]);
    if (!alu) return res.status(404).json({ ok:false, msg:'Alumno no encontrado' });

    // Materias cursadas (sem 1 a sem-1)
    const [cursadas] = await pool.query(
      `SELECT clave_materia, nombre, semestre, area, creditos, tipo, tiene_lab
       FROM materia WHERE semestre < ? AND tipo='Obligatoria' ORDER BY semestre, nombre`,
      [alu.semestre]
    );

    // Obligatorias disponibles (sem actual y sem+1 si es 8)
    const semMax = alu.semestre >= 8 ? 9 : alu.semestre;
    const [disponibles] = await pool.query(
      `SELECT m.clave_materia, m.nombre, m.semestre, m.area, m.creditos, m.tiene_lab,
              g.id_grupo, g.clave_grupo, g.turno, g.cupo_maximo, g.cupo_disponible,
              CONCAT(p.nombre,' ',p.ap_paterno) AS profesor,
              GROUP_CONCAT(
                CONCAT(h.dia_semana,' ',TIME_FORMAT(h.hora_inicio,'%H:%i'),'-',TIME_FORMAT(h.hora_fin,'%H:%i'))
                ORDER BY FIELD(h.dia_semana,'Lunes','Martes','Miércoles','Jueves','Viernes','Sábado')
                SEPARATOR ', '
              ) AS dias_horas,
              MAX(h.salon) AS salon
       FROM materia m
       JOIN grupo g ON g.clave_materia = m.clave_materia AND g.id_periodo=2
       JOIN profesor p ON g.id_profesor = p.id_profesor
       LEFT JOIN horario_sesion h ON h.id_grupo = g.id_grupo
       WHERE m.tipo='Obligatoria' AND m.semestre BETWEEN ? AND ?
       GROUP BY m.clave_materia, g.id_grupo
       ORDER BY m.semestre, m.nombre, g.clave_grupo`,
      [alu.semestre, semMax]
    );

    // Optativas (sem 6-9, sin límite de semestre)
    const [optativas] = await pool.query(
      `SELECT m.clave_materia, m.nombre, m.semestre, m.area, m.creditos, m.tiene_lab,
              g.id_grupo, g.clave_grupo, g.turno, g.cupo_maximo, g.cupo_disponible,
              CONCAT(p.nombre,' ',p.ap_paterno) AS profesor,
              GROUP_CONCAT(
                CONCAT(h.dia_semana,' ',TIME_FORMAT(h.hora_inicio,'%H:%i'),'-',TIME_FORMAT(h.hora_fin,'%H:%i'))
                ORDER BY FIELD(h.dia_semana,'Lunes','Martes','Miércoles','Jueves','Viernes','Sábado')
                SEPARATOR ', '
              ) AS dias_horas,
              MAX(h.salon) AS salon
       FROM materia m
       LEFT JOIN grupo g ON g.clave_materia = m.clave_materia AND g.id_periodo=2
       LEFT JOIN profesor p ON g.id_profesor = p.id_profesor
       LEFT JOIN horario_sesion h ON h.id_grupo = g.id_grupo
       WHERE m.tipo='Optativa' AND m.semestre >= 6
       GROUP BY m.clave_materia, g.id_grupo
       ORDER BY m.semestre, m.nombre`
    );

    // Laboratorios (materias con tiene_lab=1, sem 8-9 no tienen)
    const [labs] = await pool.query(
      `SELECT clave_materia, nombre, semestre, area, creditos
       FROM materia WHERE tiene_lab=1 ORDER BY semestre`
    );

    // Inscripciones activas del alumno (para marcar qué ya tiene)
    const [inscritas] = await pool.query(
      `SELECT i.id_inscripcion, g.clave_materia, i.id_grupo
       FROM inscripcion i JOIN grupo g ON i.id_grupo=g.id_grupo
       WHERE i.matricula=? AND i.estatus='Activa'`,
      [matricula]
    );

    res.json({ ok:true, cursadas, disponibles, optativas, labs, inscritas });
  } catch(e) { res.status(500).json({ ok:false, msg:e.message }); }
});

// ────────────────────────────────────────────────────────────
// MIS INSCRIPCIONES: GET /api/inscripciones/:matricula
// ────────────────────────────────────────────────────────────
app.get('/api/inscripciones/:matricula', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT i.id_inscripcion, i.fecha_inscripcion, i.estatus,
              m.clave_materia, m.nombre AS materia, m.semestre, m.tipo, m.creditos,
              g.id_grupo, g.clave_grupo, g.turno,
              CONCAT(p.nombre,' ',p.ap_paterno) AS profesor,
              GROUP_CONCAT(
                CONCAT(h.dia_semana,' ',TIME_FORMAT(h.hora_inicio,'%H:%i'),'-',TIME_FORMAT(h.hora_fin,'%H:%i'))
                ORDER BY FIELD(h.dia_semana,'Lunes','Martes','Miércoles','Jueves','Viernes','Sábado')
                SEPARATOR ' | '
              ) AS horario,
              GROUP_CONCAT(DISTINCT h.salon SEPARATOR ', ') AS salon
       FROM inscripcion i
       JOIN grupo g ON i.id_grupo=g.id_grupo
       JOIN materia m ON g.clave_materia=m.clave_materia
       JOIN profesor p ON g.id_profesor=p.id_profesor
       LEFT JOIN horario_sesion h ON h.id_grupo=g.id_grupo
       WHERE i.matricula=? AND i.estatus='Activa'
       GROUP BY i.id_inscripcion
       ORDER BY m.semestre, m.tipo DESC, m.nombre`,
      [req.params.matricula]
    );
    res.json({ ok:true, inscripciones: rows });
  } catch(e) { res.status(500).json({ ok:false, msg:e.message }); }
});

// ────────────────────────────────────────────────────────────
// INSCRIBIR: POST /api/inscripciones
// body: { matricula, id_grupo }
// ────────────────────────────────────────────────────────────
app.post('/api/inscripciones', async (req, res) => {
  const { matricula, id_grupo } = req.body;
  if (!matricula || !id_grupo)
    return res.status(400).json({ ok:false, msg:'Datos incompletos' });
  try {
    await pool.query(
      'INSERT INTO inscripcion (matricula, id_grupo, fecha_inscripcion) VALUES (?,?,CURDATE())',
      [matricula, id_grupo]
    );
    res.json({ ok:true, msg:'Inscripción realizada correctamente' });
  } catch(e) {
    const msg = e.message.includes('45000') ? e.message.split('SET MESSAGE_TEXT =')[1]?.replace(/['"]/g,'').trim() || e.message : e.message;
    res.status(400).json({ ok:false, msg });
  }
});

// ────────────────────────────────────────────────────────────
// DESINSCRIBIR: DELETE /api/inscripciones/:id
// ────────────────────────────────────────────────────────────
app.delete('/api/inscripciones/:id', async (req, res) => {
  try {
    await pool.query(
      "UPDATE inscripcion SET estatus='Baja' WHERE id_inscripcion=?",
      [req.params.id]
    );
    res.json({ ok:true, msg:'Materia desinscrita correctamente' });
  } catch(e) { res.status(500).json({ ok:false, msg:e.message }); }
});

// ────────────────────────────────────────────────────────────
// CONSTANCIA: GET /api/constancia/:matricula
// ────────────────────────────────────────────────────────────
app.get('/api/constancia/:matricula', async (req, res) => {
  try {
    const [[alu]] = await pool.query(
      `SELECT a.*, c.nombre AS carrera FROM alumno a JOIN carrera c ON a.id_carrera=c.id_carrera
       WHERE a.matricula=?`, [req.params.matricula]
    );
    const [ins] = await pool.query(
      `SELECT m.clave_materia, m.nombre AS materia, m.creditos, m.tipo,
              g.clave_grupo, g.turno,
              CONCAT(p.nombre,' ',p.ap_paterno) AS profesor,
              GROUP_CONCAT(
                CONCAT(h.dia_semana,' ',TIME_FORMAT(h.hora_inicio,'%H:%i'),'-',TIME_FORMAT(h.hora_fin,'%H:%i'))
                ORDER BY FIELD(h.dia_semana,'Lunes','Martes','Miércoles','Jueves','Viernes','Sábado')
                SEPARATOR ' | '
              ) AS horario,
              GROUP_CONCAT(DISTINCT h.salon SEPARATOR ', ') AS salon
       FROM inscripcion i
       JOIN grupo g ON i.id_grupo=g.id_grupo
       JOIN materia m ON g.clave_materia=m.clave_materia
       JOIN profesor p ON g.id_profesor=p.id_profesor
       LEFT JOIN horario_sesion h ON h.id_grupo=g.id_grupo
       WHERE i.matricula=? AND i.estatus='Activa'
       GROUP BY i.id_inscripcion ORDER BY m.tipo DESC, m.nombre`,
      [req.params.matricula]
    );
    res.json({ ok:true, alumno:alu, inscripciones:ins, fecha: new Date().toLocaleDateString('es-MX') });
  } catch(e) { res.status(500).json({ ok:false, msg:e.message }); }
});

app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));
