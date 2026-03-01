const fs = require('fs');
const path = require('path');

const jsonPath = 'C:/Users/duhan/.gemini/antigravity/brain/bca2b6c0-b522-4163-8c05-6b32f1825a7f/.system_generated/steps/480/output.txt';
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Group by file
const issuesByFile = {};
data.issues.forEach(issue => {
    // issue.component is like 'projectKey:filepath'
    if (!issue.component) return;
    const file = issue.component.split(':').slice(1).join(':');

    if (!issuesByFile[file]) issuesByFile[file] = [];
    issuesByFile[file].push(issue);
});

let modifiedFiles = 0;

for (const [file, issues] of Object.entries(issuesByFile)) {
    let fullPath = path.join(__dirname, '..', file);
    if (!fs.existsSync(fullPath)) continue;

    let content = fs.readFileSync(fullPath, 'utf8');
    let originalContent = content;

    // We process line by line or robust regex
    const rulesPresent = new Set(issues.map(i => i.rule));

    if (rulesPresent.has('typescript:S6759')) {
        // Readonly props.
        // E.g. export default function Page({ params }: { params: { id: string } })
        content = content.replace(/(export (?:default )?(?:async )?function \w+\s*\([^:]*?:\s*)(\{[\s\S]*?\})(\s*\))/g, (match, prefix, typeObj, suffix) => {
            if (typeObj.startsWith('Readonly<')) return match;
            return `${prefix}Readonly<${typeObj}>${suffix}`;
        });

        // Match `const Component = ({ prop }: { prop: string }) =>`
        content = content.replace(/(const \w+\s*=\s*(?:async\s*)?\([^:]*?:\s*)(\{[\s\S]*?\})(\s*\)\s*=>)/g, (match, prefix, typeObj, suffix) => {
            if (typeObj.startsWith('Readonly<')) return match;
            return `${prefix}Readonly<${typeObj}>${suffix}`;
        });

        // Also if they used named types: export default function Page(props: PageProps) -> Readonly<PageProps>
        // Best effort:
        content = content.replace(/(export (?:default )?(?:async )?function \w+\s*\([^:]*?:\s*)([A-Z][a-zA-Z0-9_]+)(\s*\))/g, (match, prefix, typeName, suffix) => {
            if (typeName.startsWith('Readonly<')) return match;
            return `${prefix}Readonly<${typeName}>${suffix}`;
        });
    }

    if (rulesPresent.has('javascript:S2486') || rulesPresent.has('typescript:S2486')) {
        // Empty catch block
        content = content.replace(/catch\s*\(([^)]+)\)\s*\{\s*\}/g, 'catch ($1) { console.error("Ignored error:", $1); }');
        content = content.replace(/catch\s*\{\s*\}/g, 'catch { console.error("Ignored error"); }');
    }

    if (rulesPresent.has('typescript:S4325')) {
        // Unnecessary assertions: ` as any` or ` as string`
        // We will do a generic replace for common ones that Sonar flags, like ` as string` when it's already string.
        // Actually, Sonar JSON gives us textRange. We can use it.
        // BUT editing string offsets is tricky if previous edits shifted things.
        // Let's just remove the `// NOSONAR` related to these if we added any before.
        // Actually to remove ` as Type` robustly it's safer to use textRange from back to front!
    }

    if (rulesPresent.has('typescript:S7755')) {
        // [arr.length - 1] -> .at(-1)
        content = content.replace(/\[([a-zA-Z0-9_]+)\.length\s*-\s*1\]/g, '.at(-1)');
    }

    if (rulesPresent.has('typescript:S7766')) {
        // Math.max ternary
        content = content.replace(/([a-zA-Z0-9_]+)\s*>\s*([a-zA-Z0-9_]+)\s*\?\s*\1\s*:\s*\2/g, 'Math.max($1, $2)');
    }

    if (rulesPresent.has('typescript:S7759')) {
        // new Date().getTime() -> Date.now()
        content = content.replace(/new\s+Date\(\)\.getTime\(\)/g, 'Date.now()');
    }

    if (rulesPresent.has('typescript:S7735')) {
        // !(a === b) -> a !== b
        content = content.replace(/!\(([^=]+)={2,3}\s*([^)]+)\)/g, '$1!== $2');
    }

    if (content !== originalContent) {
        fs.writeFileSync(fullPath, content);
        modifiedFiles++;
    }
}

console.log("Modified", modifiedFiles, "files with general regex patterns.");
