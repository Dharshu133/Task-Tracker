const fs = require('fs');
const path = require('path');

function walkSync(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.tsx') && !dirFile.includes('Sidebar.tsx')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
}

const files = [...walkSync('app'), ...walkSync('components')];

const regexes = [
  { p: /(?<!dark:)bg-slate-900/g, r: 'bg-white dark:bg-slate-900' },
  { p: /(?<!dark:)bg-slate-800/g, r: 'bg-slate-100 dark:bg-slate-800' },
  { p: /(?<!dark:)border-slate-800/g, r: 'border-slate-200 dark:border-slate-800' },
  { p: /(?<!dark:)border-slate-700/g, r: 'border-slate-300 dark:border-slate-700' },
  { p: /(?<!dark:)text-slate-600/g, r: 'text-slate-500 dark:text-slate-400' },
  { p: /(?<!dark:)text-slate-400/g, r: 'text-slate-600 dark:text-slate-400' },
  { p: /(?<!dark:)text-slate-300/g, r: 'text-slate-700 dark:text-slate-300' },
  { p: /(?<!dark:)text-slate-200/g, r: 'text-slate-800 dark:text-slate-200' },
  { p: /(?<!dark:)text-slate-100/g, r: 'text-slate-900 dark:text-slate-100' },
];

let changedFiles = 0;

files.forEach(f => {
  let original = fs.readFileSync(f, 'utf8');
  let content = original;
  regexes.forEach(rule => {
    content = content.replace(rule.p, rule.r);
  });
  if (content !== original) {
    fs.writeFileSync(f, content, 'utf8');
    changedFiles++;
    console.log(`Updated ${f}`);
  }
});

console.log(`Updated ${changedFiles} files.`);
