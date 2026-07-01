const fs = require('fs');
let code = fs.readFileSync('components/ShiftSystem.tsx', 'utf8');

code = code.replace(
  /const \[editPlanId, setEditPlanId\] = useState<string \| null>\(null\);/,
  `const [editPlanId, setEditPlanId] = useState<string | null>(null);
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [planListLocFilter, setPlanListLocFilter] = useState<string>('all');`
);

fs.writeFileSync('components/ShiftSystem.tsx', code);
