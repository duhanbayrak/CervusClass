const fs = require('fs');
let file = 'components/dashboard/admin/teacher-profile-tabs.tsx';
let content = fs.readFileSync(file, 'utf8');

// Insert the import right after `Badge` import
if (!content.includes('import { Users } from "lucide-react";')) {
    content = content.replace(/(import\s+\{\s*Badge\s*\}\s*from\s*"@\/components\/ui\/badge";?\r?\n)/, '$1import { Users } from "lucide-react";\n');
    fs.writeFileSync(file, content);
    console.log('Successfully injected Users import');
} else {
    console.log('Users import already exists');
}
