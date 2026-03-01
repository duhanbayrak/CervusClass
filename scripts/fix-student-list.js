const fs = require('fs');
let file = 'components/dashboard/teacher/student-list.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('useSearchParams')) {
    if (content.match(/import\s*\{\s*[^}]*\s*\}\s*from\s*["']next\/navigation["']/)) {
        content = content.replace(/(import\s*\{\s*)([^}]*)(\s*\}\s*from\s*["']next\/navigation["'];?)/, (match, prefix, inner, suffix) => {
            return prefix + inner + ', useSearchParams' + suffix;
        });
        fs.writeFileSync(file, content);
        console.log('Added useSearchParams to existing import');
    } else {
        content = 'import { useRouter, usePathname, useSearchParams } from "next/navigation";\n' + content;
        fs.writeFileSync(file, content);
        console.log('Added full next/navigation import line');
    }
} else {
    console.log('useSearchParams already present!');
}
