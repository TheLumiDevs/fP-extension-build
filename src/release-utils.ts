import { execSync } from 'child_process';
import * as fs from 'fs';
import * as crypto from 'crypto';

/**
 * Executes a command and returns the trimmed output.
 * @param command The command to execute.
 * @returns The trimmed output of the command.
 */
function exec(command: string): string {
    return execSync(command, { stdio: 'inherit', encoding: 'utf-8' }).trim();
}

/**
 * Gets the size and SHA256 hash of a file.
 * @param filePath The path to the file.
 * @returns An object with the file size (in human-readable format) and SHA256 hash.
 */
function getFileStats(filePath: string): { size: string; sha256: string } {
    const stats = fs.statSync(filePath);
    const sizeInBytes = stats.size;

    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    const sha256 = hashSum.digest('hex');

    // Replicate numfmt --to=iec-i --suffix=B --format=%.2f
    const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
    let size = sizeInBytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    const formattedSize = `${size.toFixed(2)}${units[unitIndex]}`;


    return { size: formattedSize, sha256 };
}

/**
 * Creates and pushes a Git tag.
 * @param tagName The name of the tag to create.
 */
export function createAndPushTag(tagName: string): void {
    console.log(`Checking for tag: ${tagName}`);
    try {
        exec(`git ls-remote --exit-code origin "refs/tags/${tagName}"`);
        console.log(`Tag ${tagName} already exists in remote. Skipping tag creation.`);
    } catch (error) {
        console.log(`Tag ${tagName} does not exist. Creating and pushing tag.`);
        exec(`git config user.name "github-actions[bot]"`);
        exec(`git config user.email "41898282+github-actions[bot]@users.noreply.github.com"`);
        exec(`git tag -fa "${tagName}" -m "Release ${tagName}"`);
        exec(`git push origin "${tagName}"`);
        console.log(`Tag ${tagName} created and pushed successfully.`);
    }
}

/**
 * Creates a GitHub release.
 * @param tagName The name of the tag for the release.
 * @param project The project name.
 * @param userscriptName The name of the userscript file.
 * @param commitLog The commit log in JSON format.
 * @param date The date of the release.
 * @param isPrerelease Whether the release is a pre-release.
 * @param commitSha The commit SHA.
 */
export function createRelease(
    tagName: string,
    project: string,
    userscriptName: string,
    commitLog: string,
    date: string,
    isPrerelease: boolean,
    commitSha: string
): void {
    console.log(`Creating release for tag: ${tagName}`);

    try {
        exec(`gh release view "${tagName}"`);
        console.log(`Release ${tagName} already exists. Skipping.`);
        return;
    } catch (error) {
        // Release does not exist, proceed
    }

    const titleSuffix = isPrerelease ? ' - Forced Build' : '';
    const prereleaseFlag = isPrerelease ? '--prerelease' : '--latest';

    const chromeAsset = `${project}/dist/extension-chrome.zip`;
    const firefoxAsset = `${project}/dist/extension-firefox.zip`;
    const userscriptAsset = `${project}/dist/${userscriptName}`;

    const chromeStats = getFileStats(chromeAsset);
    const firefoxStats = getFileStats(firefoxAsset);
    const userscriptStats = getFileStats(userscriptAsset);

    const notes = `### ${project} commit\n\n${JSON.parse(commitLog)}`;

    const command = [
        'gh', 'release', 'create', `"${tagName}"`,
        `"${chromeAsset}"`, `"${firefoxAsset}"`, `"${userscriptAsset}"`,
        '--title', `"fakeProfile auto build for ${project} - ${date}${titleSuffix}"`,
        '--notes', `"${notes}"`,
        prereleaseFlag
    ].join(' ');

    exec(command);

    const releaseUrl = exec(`gh release view "${tagName}" --json url -q .url`);

    exec(`echo -n "${commitSha}" > last_successful_sha_${project}.txt`);

    const output = {
        html_url: releaseUrl,
        tag_name: tagName,
        title_suffix: titleSuffix,
        chrome_size: chromeStats.size,
        chrome_sha256: chromeStats.sha256,
        firefox_size: firefoxStats.size,
        firefox_sha256: firefoxStats.sha256,
        userscript_size: userscriptStats.size,
        userscript_sha256: userscriptStats.sha256,
    };

    let outputString = '';
    for (const [key, value] of Object.entries(output)) {
        outputString += `${key}=${value}\n`;
    }

    fs.appendFileSync(process.env.GITHUB_OUTPUT!, outputString);

    console.log(`Release ${tagName} created successfully.`);
}