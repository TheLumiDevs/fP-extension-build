import { createAndPushTag, createRelease } from './release-utils';

function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (command === 'create-tag') {
        const tagName = args[1];
        if (!tagName) {
            console.error('Error: Missing tag name for create-tag command.');
            process.exit(1);
        }
        createAndPushTag(tagName);
    } else if (command === 'create-release') {
        const [
            ,
            tagName,
            project,
            userscriptName,
            commitLog,
            date,
            isPrereleaseStr,
            commitSha,
        ] = args;

        if (
            !tagName ||
            !project ||
            !userscriptName ||
            !commitLog ||
            !date ||
            !isPrereleaseStr ||
            !commitSha
        ) {
            console.error('Error: Missing arguments for create-release command.');
            process.exit(1);
        }

        const isPrerelease = isPrereleaseStr === 'true';

        createRelease(
            tagName,
            project,
            userscriptName,
            commitLog,
            date,
            isPrerelease,
            commitSha
        );
    } else {
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }
}

main();