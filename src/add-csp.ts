import * as fs from 'fs';
import * as path from 'path';

const project = process.argv[2];
if (!project) {
    console.error("Project name (Equicord or Vencord) is required as a command line argument.");
    process.exit(1);
}

const cspFilePath = path.join(project, 'src', 'main', 'csp', 'index.ts');

if (!fs.existsSync(cspFilePath)) {
    console.log(`CSP file not found at ${cspFilePath}, skipping.`);
    process.exit(0);
}

try {
    let content = fs.readFileSync(cspFilePath, 'utf8');
    const searchString = '// Function Specific';
    const lineToAdd = '"fakeprofile.is-always.online": ImageAndCssSrc, // fakeProfile API';
    
    const lines = content.split('\n');
    const index = lines.findIndex(line => line.includes(searchString));

    if (index !== -1) {
        const match = lines[index].match(/^\s*/);
        const indentation = match ? match[0] : '    ';
        lines.splice(index + 1, 0, `${indentation}${lineToAdd}`);
        content = lines.join('\n');
        fs.writeFileSync(cspFilePath, content, 'utf8');
        console.log(`Successfully added fakeProfile CSP rule to ${cspFilePath}.`);
    } else {
        console.warn(`'${searchString}' not found in ${cspFilePath}. CSP rule not added.`);
    }
} catch (error) {
    const e = error as Error;
    console.error(`Failed to modify CSP file: ${e.message}`);
    process.exit(1);
}