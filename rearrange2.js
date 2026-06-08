import fs from 'fs';

const content = fs.readFileSync('components/EcommerceAnalysisSystem.tsx', 'utf-8');

const match = content.match(/(\s+return \(\n\s+<div className="flex-1 overflow-y-auto pb-16 bg-white">\n)([\s\S]+?)(\s+<\/div>\n\s+\);\n\s+\}\)\(\)})/);

if (!match) {
   console.log("Failed to match the area in EcommerceAnalysisSystem");
   process.exit(1);
}

const beforeBlock = content.substring(0, match.index + match[1].length);
const innerContent = match[2];
const afterBlock = content.substring(match.index + match[1].length + innerContent.length);

const block1Start = innerContent.indexOf('{latestMonth ?');
const block2Start = innerContent.indexOf('<table className="w-full text-left text-sm">');
const block3Start = innerContent.indexOf('{/* 空間區隔 */}');
const block4Start = innerContent.indexOf('<div className="bg-slate-50 border-t border-slate-200 shrink-0">');

if (block1Start === -1 || block2Start === -1 || block3Start === -1 || block4Start === -1) {
    console.log("Failed to find boundaries in EcommerceAnalysisSystem", block1Start, block2Start, block3Start, block4Start);
    process.exit(1);
}

const latestMonthStr = innerContent.substring(block1Start, block2Start);
const tableStr = innerContent.substring(block2Start, block3Start);
const spacerStr = innerContent.substring(block3Start, block4Start);
const accountSummaryStr = innerContent.substring(block4Start);

let newInnerContent = accountSummaryStr + spacerStr + latestMonthStr + tableStr;

fs.writeFileSync('components/EcommerceAnalysisSystem.tsx', beforeBlock + newInnerContent + afterBlock);
console.log("Successfully re-arranged EcommerceAnalysisSystem");
