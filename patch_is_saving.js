import fs from 'fs';

let content = fs.readFileSync('components/BankSystem.tsx', 'utf-8');

// Add isSaving state
content = content.replace(
  "const [saveSuccess, setSaveSuccess] = useState(false);\n  const [showSaveConfirm, setShowSaveConfirm] = useState(false);",
  "const [saveSuccess, setSaveSuccess] = useState(false);\n  const [isSaving, setIsSaving] = useState(false);\n  const [showSaveConfirm, setShowSaveConfirm] = useState(false);"
);

// Update handleSaveTransaction
const handleSavePattern = "const handleSaveTransaction = async () => {\\n    if (!addForm.category || !addForm.amount) return;";
const handleSaveNew = "const handleSaveTransaction = async () => {\\n    if (!addForm.category || !addForm.amount || isSaving) return;\\n    setIsSaving(true);";
content = content.replace(new RegExp(handleSavePattern.replace(/[.*+?^$\{\}()|[\\]\\\\]/g, '\\\\$&'), 'g'), handleSaveNew);

const tryBlockPattern = "try {\\n      await setDoc(doc(db, 'transactions', newTx.id), newTx);";
const tryBlockNew = "try {\\n      await setDoc(doc(db, 'transactions', newTx.id), newTx);\\n      setIsSaving(false);";
content = content.replace(tryBlockPattern, tryBlockNew);

const catchBlockPattern = "} catch (e) {\\n      console.error(\"error saving transaction\", e);\\n    }";
const catchBlockNew = "} catch (e) {\\n      console.error(\"error saving transaction\", e);\\n      setIsSaving(false);\\n    }";
content = content.replace(catchBlockPattern, catchBlockNew);

// Update button disabled state and text
const buttonPattern = "<button type=\"button\" onClick={handleSaveTransaction} className=\"px-4 py-2 text-sm font-bold text-white bg-[#408f61] rounded-lg hover:bg-[#347a51] transition-colors shadow-sm\">確定儲存</button>";
const buttonNew = "<button type=\"button\" onClick={handleSaveTransaction} disabled={isSaving} className={`px-4 py-2 text-sm font-bold text-white rounded-lg transition-colors shadow-sm ${isSaving ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#408f61] hover:bg-[#347a51]'}`}>{isSaving ? '儲存中...' : '確定儲存'}</button>";
content = content.replace(buttonPattern, buttonNew);
content = content.replace(buttonPattern, buttonNew); // in case there are multiple, but usually just one in the modal

fs.writeFileSync('components/BankSystem.tsx', content);
console.log("Patched isSaving successfully!");
