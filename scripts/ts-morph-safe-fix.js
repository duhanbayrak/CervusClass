const { Project, SyntaxKind } = require('ts-morph');
const fs = require('fs');
const path = require('path');

const jsonPath = 'C:/Users/duhan/.gemini/antigravity/brain/bca2b6c0-b522-4163-8c05-6b32f1825a7f/.system_generated/steps/636/output.txt';
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const issuesByFile = {};
data.issues.forEach(issue => {
    if (!issue.component) return;
    const file = issue.component.split(':').slice(1).join(':');
    if (!issuesByFile[file]) issuesByFile[file] = [];
    issuesByFile[file].push(issue);
});

const project = new Project({
    tsConfigFilePath: path.join(__dirname, '..', 'tsconfig.json'),
    skipAddingFilesFromTsConfig: true
});

let modifiedFilesCount = 0;

for (const [file, issues] of Object.entries(issuesByFile)) {
    const fullPath = path.join(__dirname, '..', file);
    if (!fs.existsSync(fullPath)) continue;

    const sourceFile = project.addSourceFileAtPath(fullPath);
    let isModified = false;

    // We process Rules that manipulate the file line by line safely.
    // To prevent "node removed" errors, we sort issues by line descending!
    issues.sort((a, b) => {
        const la = a.textRange ? a.textRange.startLine : 0;
        const lb = b.textRange ? b.textRange.startLine : 0;
        return lb - la;
    });

    for (const issue of issues) {
        if (!issue.textRange) continue;
        const line = issue.textRange.startLine;

        if (issue.rule === 'typescript:S4325') {
            const asExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.AsExpression);
            const nonNulls = sourceFile.getDescendantsOfKind(SyntaxKind.NonNullExpression);
            const matchingAs = asExpressions.find(expr => expr.getStartLineNumber() === line);
            const matchingNN = nonNulls.find(expr => expr.getStartLineNumber() === line);

            if (matchingAs && !matchingAs.wasForgotten()) {
                matchingAs.replaceWithText(matchingAs.getExpression().getText());
                isModified = true;
            } else if (matchingNN && !matchingNN.wasForgotten()) {
                matchingNN.replaceWithText(matchingNN.getExpression().getText());
                isModified = true;
            }
        }
        else if (issue.rule === 'typescript:S1128') {
            const imports = sourceFile.getImportDeclarations();
            const matchingImport = imports.find(imp => !imp.wasForgotten() && imp.getStartLineNumber() === line);
            if (matchingImport) {
                const match = issue.message.match(/import of '([^']+)'/);
                let varName = match ? match[1] : null;
                if (varName) {
                    const namedImports = matchingImport.getNamedImports();
                    const targetNamed = namedImports.find(ni => ni.getName() === varName);
                    if (targetNamed && !targetNamed.wasForgotten()) {
                        targetNamed.remove();
                        isModified = true;
                    } else if (matchingImport.getDefaultImport() && matchingImport.getDefaultImport().getText() === varName) {
                        try { matchingImport.removeDefaultImport(); isModified = true; } catch (e) { }
                    } else {
                        try { matchingImport.remove(); isModified = true; } catch (e) { }
                    }
                } else {
                    try { matchingImport.remove(); isModified = true; } catch (e) { }
                }
            }
        }
        else if (issue.rule === 'typescript:S7787') {
            const imports = sourceFile.getImportDeclarations();
            for (const imp of imports) {
                if (!imp.wasForgotten() && imp.getImportClause() == null) {
                    imp.remove();
                    isModified = true;
                }
            }
        }
        else if (issue.rule === 'typescript:S6759') {
            const funcs = [...sourceFile.getFunctions(), ...sourceFile.getDescendantsOfKind(SyntaxKind.ArrowFunction)];
            const func = funcs.find(f => !f.wasForgotten() && f.getStartLineNumber() === line);
            if (func && func.getParameters().length > 0) {
                const firstParam = func.getParameters()[0];
                const typeNode = firstParam.getTypeNode();
                if (typeNode && !typeNode.getText().startsWith('Readonly<')) {
                    firstParam.setType(`Readonly<${typeNode.getText()}>`);
                    isModified = true;
                }
            }
        }
        else if (issue.rule === 'typescript:S2486') {
            const catchClauses = sourceFile.getDescendantsOfKind(SyntaxKind.CatchClause);
            const catchClause = catchClauses.find(c => !c.wasForgotten() && c.getStartLineNumber() === line);
            if (catchClause) {
                const block = catchClause.getBlock();
                if (block.getStatements().length === 0) {
                    const varName = catchClause.getVariableDeclaration() ? catchClause.getVariableDeclaration().getName() : 'e';
                    if (!catchClause.getVariableDeclaration()) {
                        block.addStatements(`console.error("Ignored execution error");`);
                    } else {
                        block.addStatements(`console.error("Ignored execution error:", ${varName});`);
                    }
                    isModified = true;
                }
            }
        }
    }

    if (isModified) {
        sourceFile.saveSync();
        modifiedFilesCount++;
    }
}

console.log("Modified files with safe ts-morph:", modifiedFilesCount);
