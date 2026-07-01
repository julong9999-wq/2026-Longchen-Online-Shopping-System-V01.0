const fs = require('fs');
let code = fs.readFileSync('components/ShiftSystem.tsx', 'utf8');

code = code.replace(
/const handleEditRecord = \(r: ShiftRecord\) => {([\s\S]*?)setView\('plan'\);\n    };/,
`const handleEditRecord = (r: ShiftRecord) => {
        setPlanLocationId(r.locationId);
        setPlanDates([r.date]);
        setPlanStartTime(r.startTime);
        setPlanEndTime(r.endTime);
        setPlanRemarks(r.remarks);
        setEditPlanId(r.id);
        setShowPlanModal(true);
        setView('plan');
    };`
);

code = code.replace(
/setPlanDates\(\[\]\); setPlanStartTime\(''\); setPlanEndTime\(''\); setPlanRemarks\(''\); setEditPlanId\(null\);/g,
`setPlanDates([]); setPlanStartTime(''); setPlanEndTime(''); setPlanRemarks(''); setEditPlanId(null); setShowPlanModal(false);`
);

fs.writeFileSync('components/ShiftSystem.tsx', code);
