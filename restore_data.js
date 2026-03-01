const fs = require('node:fs');
const path = require('node:path');

const debugFile = path.join(__dirname, 'debug_exams.json');
const exams = JSON.parse(fs.readFileSync(debugFile, 'utf8'));

const sqlValues = exams.map(exam => {
    const name = exam.exam_name.replace(/'/g, "''");

    let scoresStr = typeof exam.scores === 'string' ? exam.scores : JSON.stringify(exam.scores);
    const scoresSql = `'${scoresStr.replace(/'/g, "''")}'`;

    let detailsStr = typeof exam.details === 'string' ? exam.details : JSON.stringify(exam.details || {});
    const detailsSql = `'${detailsStr.replace(/'/g, "''")}'`;

    const deletedAt = exam.deleted_at ? `'${exam.deleted_at}'` : 'NULL';

    return `('${exam.id}', '${exam.organization_id}', '${exam.student_id}', '${name}', '${exam.exam_date}', ${scoresSql}::jsonb, ${exam.total_net}, '${exam.created_at}', ${detailsSql}::jsonb, ${deletedAt}, '${exam.exam_type}'::exam_type_enum)`;
});

const sql = `
INSERT INTO exam_results (id, organization_id, student_id, exam_name, exam_date, scores, total_net, created_at, details, deleted_at, exam_type)
VALUES 
${sqlValues.join(',\n')}
ON CONFLICT (id) DO NOTHING;
`;

fs.writeFileSync('restore_script.sql', sql, 'utf8');
console.log('SQL generated in restore_script.sql');
