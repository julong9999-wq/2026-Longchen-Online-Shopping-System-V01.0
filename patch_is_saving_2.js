import fs from 'fs';
let content = fs.readFileSync('components/BankSystem.tsx', 'utf-8');

content = content.replace(
  "const handleSaveTransaction = async () => {\n    if (!addForm.category || !addForm.amount) return;",
  "const handleSaveTransaction = async () => {\n    if (!addForm.category || !addForm.amount || isSaving) return;\n    setIsSaving(true);"
);

content = content.replace(
  "try {\n      await setDoc(doc(db, 'transactions', newTx.id), newTx);",
  "try {\n      await setDoc(doc(db, 'transactions', newTx.id), newTx);\n      setIsSaving(false);"
);

content = content.replace(
  "} catch (e) {\n      console.error(\"error saving transaction\", e);\n    }",
  "} catch (e) {\n      console.error(\"error saving transaction\", e);\n      setIsSaving(false);\n    }"
);

fs.writeFileSync('components/BankSystem.tsx', content);
console.log("Patched correctly");
