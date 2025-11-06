const db = require('../config/config');

// ✅ Obtener tareas por usuario (desde usuario_tareas)
exports.getTasksByUser = (req, res) => {
  const userId = req.params.id;
  const sql = `
    SELECT id, titulo, descripcion, fechaProgramada, horaProgramada, completada, predefinida_id
    FROM usuario_tareas
    WHERE usuario_id = ?
    ORDER BY fechaProgramada ASC, horaProgramada ASC
  `;
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('❌ Error en getTasksByUser:', err);
      return res.status(500).json({ success: false, message: 'Error al obtener tareas' });
    }
    res.json({ success: true, data: results });
  });
};

// ✅ Crear tarea en usuario_tareas
exports.createTask = (req, res) => {
  const {
    usuario_id,
    titulo,
    descripcion,
    fechaProgramada,
    horaProgramada,
    predefinida_id,
  } = req.body;

  const sql = `
    INSERT INTO usuario_tareas (usuario_id, titulo, descripcion, fechaProgramada, horaProgramada, predefinida_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [usuario_id, titulo, descripcion, fechaProgramada, horaProgramada, predefinida_id || null],
    (err, result) => {
      if (err) {
        console.error('❌ Error en createTask:', err);
        return res.status(500).json({ success: false, message: 'Error al crear tarea' });
      }
      res.json({ success: true, message: 'Tarea creada', data: { id: result.insertId } });
    }
  );
};

exports.updateRoutine = async (req, res) => {
  /*  horaProgramada = nueva hora que quiere el usuario
      oldHora        = hora con la que guardamos la rutina originalmente
      Se envían ambas desde el frontend (ver más abajo)                */
  const { usuario_id, titulo, descripcion, horaProgramada, oldHora, dias, fechaFin } = req.body;

  try {
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(fechaFin);
    end.setHours(0, 0, 0, 0);

    /* 1. Buscar las tareas de la rutina usando la hora ORIGINAL */
    const getExistingSql = `
      SELECT id, fechaProgramada
      FROM usuario_tareas
      WHERE usuario_id = ?
        AND horaProgramada = ?
        AND fechaProgramada BETWEEN ? AND ?
    `;
    const existingTasks = await new Promise((resolve, reject) => {
      db.query(getExistingSql,
        [usuario_id, oldHora, start.toISOString().slice(0,10), end.toISOString().slice(0,10)],
        (err, results) => (err ? reject(err) : resolve(results))
      );
    });

    /* 2. Fechas que deben existir según los días elegidos */
    const shouldExist = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayName = dayNames[d.getDay()];
      if (dias.includes(dayName)) {
        shouldExist.push({ fecha: d.toISOString().slice(0, 10) });
      }
    }

    /* 3. Clasificar tareas */
    const toDelete = existingTasks.filter(ex =>
      !shouldExist.some(s => s.fecha === ex.fechaProgramada)
    );
    const toCreate = shouldExist.filter(s =>
      !existingTasks.some(ex => ex.fechaProgramada === s.fecha)
    );
    const toUpdate = existingTasks.filter(ex =>
      shouldExist.some(s => s.fecha === ex.fechaProgramada)
    );

    const operations = [];

    /* 4. Borrar */
    if (toDelete.length) {
      const deleteIds = toDelete.map(t => t.id);
      const deleteSql = `DELETE FROM usuario_tareas WHERE id IN (${deleteIds.map(() => '?').join(',')})`;
      operations.push(new Promise((res, rej) => db.query(deleteSql, deleteIds, err => (err ? rej(err) : res()))));
    }

    /* 5. Crear nuevas (con título, descripción y hora NUEVOS) */
    if (toCreate.length) {
      const createValues = [];
      toCreate.forEach(day => createValues.push(usuario_id, titulo, descripcion, day.fecha, horaProgramada, 0));
      const createSql = `
        INSERT INTO usuario_tareas
        (usuario_id, titulo, descripcion, fechaProgramada, horaProgramada, completada)
        VALUES ${toCreate.map(() => '(?,?,?,?,?,?)').join(',')}
      `;
      operations.push(new Promise((res, rej) => db.query(createSql, createValues, err => (err ? rej(err) : res()))));
    }

    /* 6. Actualizar existentes (título, descripción y hora NUEVOS) */
    if (toUpdate.length) {
      const updateValues = [];
      const updateIds = [];
      toUpdate.forEach(t => {
        updateValues.push(titulo, descripcion, horaProgramada);
        updateIds.push(t.id);
      });
      const updateSql = `
        UPDATE usuario_tareas
        SET titulo = ?, descripcion = ?, horaProgramada = ?
        WHERE id IN (${updateIds.map(() => '?').join(',')})
      `;
      operations.push(new Promise((res, rej) =>
        db.query(updateSql, [...updateValues, ...updateIds], err => (err ? rej(err) : res()))
      ));
    }

    /* 7. Ejecutar */
    await Promise.all(operations);

    res.json({
      success: true,
      message: `Rutina actualizada: ${toDelete.length} eliminadas, ${toCreate.length} creadas, ${toUpdate.length} actualizadas`
    });
  } catch (error) {
    console.error('❌ Error en updateRoutine:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar rutina' });
  }
};

// ✅ Marcar como completada
exports.toggleComplete = (req, res) => {
  const sql = `UPDATE usuario_tareas SET completada = ? WHERE id = ?`;
  db.query(sql, [req.body.completed, req.params.id], (err) => {
    if (err) {
      console.error('❌ Error en toggleComplete:', err);
      return res.status(500).json({ success: false, message: 'Error al cambiar estado' });
    }
    res.json({ success: true, message: 'Estado actualizado' });
  });
};

exports.deleteRoutine = (req, res) => {
  const { usuario_id, titulo, horaProgramada } = req.body;

  const sql = `
    DELETE FROM usuario_tareas
    WHERE usuario_id = ? AND titulo = ? AND horaProgramada = ?
  `;

  db.query(sql, [usuario_id, titulo, horaProgramada], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Error al eliminar rutina' });
    }
    res.json({ success: true, message: `${result.affectedRows} tareas eliminadas` });
  });
};

// ✅ Tareas completadas
exports.getCompletedTasks = (req, res) => {
  const userId = req.params.id;
  const sql = `
    SELECT id, titulo, descripcion, fechaProgramada, horaProgramada, completada, predefinida_id
    FROM usuario_tareas
    WHERE usuario_id = ? AND completada = 1
    ORDER BY fechaProgramada DESC, horaProgramada DESC
  `;
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('❌ Error en getCompletedTasks:', err);
      return res.status(500).json({ success: false, message: 'Error al obtener tareas completadas' });
    }
    res.json({ success: true, data: results });
  });
};

// ✅ Tareas atrasadas (fecha < hoy y no completadas)
exports.getOutdatedTasks = (req, res) => {
  const userId = req.params.id;
  const today = new Date().toISOString().slice(0, 10);
  const sql = `
    SELECT id, titulo, descripcion, fechaProgramada, horaProgramada, completada, predefinida_id
    FROM usuario_tareas
    WHERE usuario_id = ? AND completada = 0 AND fechaProgramada < ?
    ORDER BY fechaProgramada ASC, horaProgramada ASC
  `;
  db.query(sql, [userId, today], (err, results) => {
    if (err) {
      console.error('❌ Error en getOutdatedTasks:', err);
      return res.status(500).json({ success: false, message: 'Error al obtener tareas atrasadas' });
    }
    res.json({ success: true, data: results });
  });
};

exports.createRoutineAndFutureTasks = (req, res) => {
  const {
    usuario_id,
    titulo,
    descripcion,
    horaProgramada,
    dias,
    fechaFin
  } = req.body;

  if (!Array.isArray(dias) || !dias.length || !fechaFin) {
    return res.status(400).json({ success: false, message: 'Faltan días o fecha fin' });
  }

  const dayMap = {
    Domingo: 0, Lunes: 1, Martes: 2, Miércoles: 3,
    Jueves: 4, Viernes: 5, Sábado: 6
  };

  const start = new Date();
  start.setHours(0, 0, 0, 0); // 00:00:00.000 hoy
  const end = new Date(fechaFin);
  end.setHours(0, 0, 0, 0);

  console.log('📅 start (00:00)', start.toISOString());
  console.log('📅 end', end.toISOString());
  console.log('📅 dias', dias);

  const inserts = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayName = dayNames[d.getDay()]; // <- sin depender de locale
    if (dias.includes(dayName)) {
      inserts.push([
        usuario_id,
        titulo,
        descripcion,
        d.toISOString().slice(0, 10),
        horaProgramada,
        null
      ]);
    }
  }

  console.log('📦 Filas a insertar:', inserts.length);

  if (!inserts.length) {
    return res.status(400).json({ success: false, message: 'No hay fechas que coincidan' });
  }

  const sql = `
    INSERT INTO usuario_tareas (usuario_id, titulo, descripcion, fechaProgramada, horaProgramada, predefinida_id)
    VALUES ?
  `;

  db.query(sql, [inserts], (err, result) => {
    if (err) {
      console.error('❌ Error al insertar:', err);
      return res.status(500).json({ success: false, message: 'Error al crear tareas' });
    }
    res.json({ success: true, message: `${result.affectedRows} tareas creadas` });
  });
};