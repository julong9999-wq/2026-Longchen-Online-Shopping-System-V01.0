const fs = require('fs');
let code = fs.readFileSync('components/ShiftSystem.tsx', 'utf8');

const newMemo = `
    const upcomingRecords = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        let filtered = currentRecords.filter(r => r.date >= today);
        if (planListLocFilter !== 'all') {
            filtered = filtered.filter(r => r.locationId === planListLocFilter);
        }
        filtered.sort((a, b) => {
            if (upcomingSort === 'date_asc') return a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime) || a.endTime.localeCompare(b.endTime);
            if (upcomingSort === 'date_desc') return b.date.localeCompare(a.date) || a.startTime.localeCompare(b.startTime) || a.endTime.localeCompare(b.endTime);
            if (upcomingSort === 'time_asc') return a.startTime.localeCompare(b.startTime) || a.endTime.localeCompare(b.endTime) || a.date.localeCompare(b.date);
            if (upcomingSort === 'time_desc') return b.startTime.localeCompare(a.startTime) || b.endTime.localeCompare(a.endTime) || a.date.localeCompare(b.date);
            return 0;
        });
        return filtered;
    }, [currentRecords, upcomingSort, planListLocFilter]);
`;

code = code.replace(/const upcomingRecords = useMemo\(\(\) => \{[\s\S]*?\}, \[currentRecords, upcomingSort\]\);/, newMemo.trim());

fs.writeFileSync('components/ShiftSystem.tsx', code);
