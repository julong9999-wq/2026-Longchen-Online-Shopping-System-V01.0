const fs = require('fs');

// Update App.tsx home button
let appTxt = fs.readFileSync('App.tsx', 'utf-8');
appTxt = appTxt.replace('bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-5 rounded-xl shadow-lg border border-indigo-400', 'bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-5 rounded-xl shadow-lg border border-purple-500');
fs.writeFileSync('App.tsx', appTxt);

// Update TravelSystem.tsx colors and nav bar
let travelTxt = fs.readFileSync('components/TravelSystem.tsx', 'utf-8');

// replace all indigo with purple
travelTxt = travelTxt.replace(/indigo/g, 'purple');

// specifically update the nav bar which was slate
travelTxt = travelTxt.replace('bg-slate-800 flex shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] overflow-x-auto shrink-0 z-50 text-purple-100', 'bg-purple-600 flex shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] overflow-x-auto shrink-0 z-50 text-purple-100');

travelTxt = travelTxt.replace(
  "className={`flex-1 flex flex-col items-center justify-center py-3 transition-opacity ${view === 'detail' ? 'text-white bg-slate-700' : 'hover:text-white hover:bg-slate-700/50'}`}",
  "className={`flex-1 flex flex-col items-center justify-center py-3 transition-opacity ${view === 'detail' ? 'text-white bg-purple-700' : 'hover:text-white hover:bg-purple-700/50'}`}"
);

travelTxt = travelTxt.replace(
  "className={`flex-1 flex flex-col items-center justify-center py-3 transition-opacity ${view === 'record' ? 'text-purple-400 bg-slate-700' : 'hover:text-white hover:bg-slate-700/50'}`}",
  "className={`flex-1 flex flex-col items-center justify-center py-3 transition-opacity ${view === 'record' ? 'text-white bg-purple-700' : 'hover:text-white hover:bg-purple-700/50'}`}"
);

travelTxt = travelTxt.replace(
  "className=\"flex-1 flex flex-col items-center justify-center py-3 transition-opacity hover:text-white hover:bg-slate-700/50\"",
  "className=\"flex-1 flex flex-col items-center justify-center py-3 transition-opacity hover:text-white hover:bg-purple-700/50\""
);

fs.writeFileSync('components/TravelSystem.tsx', travelTxt);
