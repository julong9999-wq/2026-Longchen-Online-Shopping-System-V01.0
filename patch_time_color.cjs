const fs = require('fs');
let code = fs.readFileSync('components/ShiftSystem.tsx', 'utf8');

// Replace definition of getTimeColor
const oldDef = /const getTimeColor = \(timeStr: string\) => \{\s*if \(\!timeStr\) return 'text-slate-700';\s*const hour = parseInt\(timeStr\.split\(':'\)\[0\], 10\);\s*if \(hour >= 5 && hour < 12\) return 'text-amber-600';\s*if \(hour >= 12 && hour < 18\) return 'text-orange-600';\s*return 'text-indigo-600';\s*\};/;

const newDef = `const getShiftColor = (start: string, end: string) => {
    if (!start || !end) return 'text-slate-700';
    const colors = [
        'text-rose-600', 'text-orange-600', 'text-amber-600', 'text-emerald-600', 
        'text-teal-600', 'text-cyan-600', 'text-sky-600', 'text-blue-600', 
        'text-indigo-600', 'text-violet-600', 'text-purple-600', 'text-fuchsia-600'
    ];
    let hash = 0;
    const str = \`\${start}-\${end}\`;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    hash = Math.abs(hash);
    return colors[hash % colors.length];
};`;

code = code.replace(oldDef, newDef);

// Replace usages
code = code.replace(/\$\{getTimeColor\(r\.startTime\)\}/g, '${getShiftColor(r.startTime, r.endTime)}');
code = code.replace(/\$\{getTimeColor\(r\.endTime\)\}/g, '${getShiftColor(r.startTime, r.endTime)}');
code = code.replace(/\$\{getTimeColor\(planStartTime\)\}/g, '${getShiftColor(planStartTime, planEndTime)}');
code = code.replace(/\$\{getTimeColor\(planEndTime\)\}/g, '${getShiftColor(planStartTime, planEndTime)}');

fs.writeFileSync('components/ShiftSystem.tsx', code);
