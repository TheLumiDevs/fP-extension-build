import { execSync } from 'child_process';

/**
 * Fetches latest tags from remote and gets commit history since last release
 * @returns {string} Formatted markdown of commits
 */
function getCommitHistory(): string {
    try {
        // Ensure we have latest tags
        execSync('git fetch --tags', { stdio: 'inherit' });
        
        // Get last two tags sorted by date
        const tags = execSync('git tag --sort=-creatordate | head -n 2')
            .toString()
            .trim()
            .split('\n');

        const currentTag = tags[0];
        const previousTag = tags[1] || 'initial-commit';

        // Get commits between last release and HEAD
        const rawLog = execSync(
            `git log --pretty=format:"%h|%s|%b|%an" ${previousTag}..HEAD --no-merges`
        ).toString().trim();

        return formatCommitLog(rawLog);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to get commit history: ${errorMessage}`);
    }
}

/**
 * Formats raw git log output into markdown
 */
function formatCommitLog(rawLog: string): string {
    return rawLog.split('\n')
        .map(line => {
            const [hash, subject, body, author] = line.split('|');
            const cleanBody = body.replace(/[\r\n]/g, ' ').replace(/\s+/g, ' ').trim();
            const fullMessage = [subject, cleanBody].filter(Boolean).join(' - ');
            return `- ${fullMessage} (${hash}) - ${author}`;
        })
        .join('\n');
}

function main() {
    try {
        const commitLog = getCommitHistory();
        console.log(commitLog);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.error(`Failed to generate commit log: ${errorMessage}`);
        process.exit(1);
    }
}

main();