import { execSync } from 'child_process';

/**
 * Fetches the latest commit's subject (title) and hash.
 * @returns {string} The commit title and hash, e.g., "feat: new feature (abcdef1)".
 */
function getLatestCommit(): string {
    try {
        const format = '%s (%h)';
        const command = `git log -1 --pretty=format:"${format}"`;
        return execSync(command).toString().trim();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to get latest commit: ${errorMessage}`);
    }
}

function main() {
    try {
        const commitMessage = getLatestCommit();
        console.log(commitMessage);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.error(`Failed to generate commit log: ${errorMessage}`);
        process.exit(1);
    }
}

main();