import { execSync } from 'child_process';

function getStagedFiles(): { added: string[], modified: string[] } {
    const statusOutput = execSync('git diff --name-status --cached', { encoding: 'utf-8' }).trim();
    const added: string[] = [];
    const modified: string[] = [];

    if (!statusOutput) {
        return { added, modified };
    }

    const lines = statusOutput.split('\n');
    for (const line of lines) {
        const [status, file] = line.split('\t');

        if (status === 'A') {
            added.push(file);
        } else if (status === 'M') {
            modified.push(file);
        }
    }

    return { added, modified };
}

function generateCommitMessage(added: string[], modified: string[]): string {
    if (added.length === 0 && modified.length === 0) {
        return 'No staged changes to commit.';
    }

    let subject = '';
    if (added.length > 0 && modified.length > 0) {
        subject = 'feat: add and update files';
    } else if (added.length > 0) {
        subject = 'feat: add new files';
    } else {
        subject = 'fix: update files';
    }

    let body = '';
    if (added.length > 0) {
        body += 'Added files:\n';
        body += added.map(f => `- ${f}`).join('\n');
        if (modified.length > 0) {
            body += '\n\n';
        }
    }

    if (modified.length > 0) {
        body += 'Updated files:\n';
        body += modified.map(f => `- ${f}`).join('\n');
    }

    return `${subject}\n\n${body.trim()}`;
}

function main() {
    try {
        const { added, modified } = getStagedFiles();
        const message = generateCommitMessage(added, modified);
        console.log(message);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.error(`Failed to generate commit message: ${errorMessage}`);
        process.exit(1);
    }
}

main();