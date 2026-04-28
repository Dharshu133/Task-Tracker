const fs = require('fs');
const path = require('path');

function walkSync(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.tsx')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
}

const files = [...walkSync('app'), ...walkSync('components')];

const regexes = [
  { p: /(?<!dark:)bg-slate-950/g, r: 'bg-slate-50 dark:bg-slate-950' },
  { p: /(?<!dark:)text-white(?!.*?(btn-primary|bg-brand-500|bg-red-500|bg-emerald-500))/g, r: 'text-slate-900 dark:text-white' },
];

let changedFiles = 0;

files.forEach(f => {
  if (f.includes('Sidebar.tsx') || f.includes('globals.css') || f.includes('page.tsx')) {
    // skip page.tsx because I already manually updated dashboard/page.tsx and login/page.tsx
    // wait, I only updated the Dashboard and Login page manually. What about others? There are none.
    // I will just skip the ones I know I fixed manually.
  }
  
  if (!f.includes('Modal.tsx')) return; // let's only target Modals now

  let original = fs.readFileSync(f, 'utf8');
  let content = original;
  
  // Specific modal fixes
  content = content.replace(/text-white/g, 'text-slate-900 dark:text-white');
  // Revert buttons that should keep text-white
  content = content.replace(/text-slate-900 dark:text-white(?!.*?(btn-primary|bg-brand-500|bg-red-500|bg-emerald-500))/g, 'text-slate-900 dark:text-white');
  
  content = content.replace(/bg-slate-950/g, 'bg-white dark:bg-slate-950');
  content = content.replace(/hover:text-white/g, 'hover:text-slate-900 dark:hover:text-white');

  // Fix button text colors that were replaced incorrectly
  content = content.replace(/className="text-slate-900 dark:text-white/g, 'className="text-white'); // for SVG inside primary buttons
  
  // Actually, regex is dangerous. I'll just manual multi_replace the Modals since there are only 3 left: AddTaskModal, EditTaskModal, AddUserModal.
  
});
