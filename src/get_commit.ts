import { execSync } from 'child_process';

/**
 * Retrieves the subject of the last git commit.
 * @returns {string} The commit subject.
 * @throws {Error} If the git command fails.
 */
function getCommitSubject(): string {
    try {
        return execSync('git log -1 --pretty=%s', { encoding: 'utf-8' }).trim();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to execute git command: ${errorMessage}`);
    }
}

/**
 * Sanitizes a string for use in a Markdown link title by escaping special characters.
 * @param {string} text The text to sanitize.
 * @returns {string} The sanitized text.
 */
function sanitizeForMarkdownLink(text: string): string {
    // Escape characters that have special meaning in Markdown link titles: [ and ]
    return text.replace(/[\[\]]/g, '\\$&');
}

/**
 * Main script execution.
 */
function main() {
    try {
        const commitSubject = getCommitSubject();
        const sanitizedSubject = sanitizeForMarkdownLink(commitSubject);
        console.log(sanitizedSubject);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        // Log the error to stderr
        console.error(`Failed to get commit info: ${errorMessage}`);
        process.exit(1);
    }
}

main();