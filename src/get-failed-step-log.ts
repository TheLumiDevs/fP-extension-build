import { execSync } from 'child_process';
import * as https from 'https';
import * as fs from 'fs';

const { GITHUB_REPOSITORY, GITHUB_RUN_ID, GITHUB_TOKEN, PROJECT_NAME } = process.env;

if (!GITHUB_REPOSITORY || !GITHUB_RUN_ID || !GITHUB_TOKEN || !PROJECT_NAME) {
    console.error("Missing required environment variables. Make sure GITHUB_REPOSITORY, GITHUB_RUN_ID, GITHUB_TOKEN, and PROJECT_NAME are set.");
    process.exit(1);
}

const [owner, repo] = GITHUB_REPOSITORY.split('/');

const getJson = <T>(url: string): Promise<T> => {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'User-Agent': 'node.js',
                'Accept': 'application/vnd.github.v3+json'
            }
        };
        https.get(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        const err = e as Error;
                        reject(new Error(`Failed to parse JSON response: ${err.message}`));
                    }
                } else {
                    reject(new Error(`Failed to get data: ${res.statusCode} ${res.statusMessage}\nResponse: ${data}`));
                }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
};

function extractStepLog(fullLog: string, stepName: string): string {
    const lines = fullLog.split('\n');
    let inStep = false;
    const stepLogLines: string[] = [];
    
    const startRegex = new RegExp(`^##\\[group\\]${escapeRegex(stepName)}`);
    const endRegex = /^##\[endgroup\]/;

    for (const line of lines) {
        if (startRegex.test(line)) {
            inStep = true;
            continue;
        }
        if (endRegex.test(line)) {
            if (inStep) {
                break;
            }
        }
        if (inStep) {
            stepLogLines.push(line.replace(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z\s/, ''));
        }
    }

    return stepLogLines.join('\n').trim();
}

function escapeRegex(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function main() {
    try {
        const jobsUrl = `https://api.github.com/repos/${owner}/${repo}/actions/runs/${GITHUB_RUN_ID}/jobs`;
        const jobsResponse = await getJson<{ jobs: any[] }>(jobsUrl);
        
        const jobName = `build (${PROJECT_NAME})`;
        const failedJob = jobsResponse.jobs.find(j => j.name === jobName && j.conclusion === 'failure');

        if (!failedJob) {
            const result = {
                log: `Could not find a failed job named "${jobName}". This can happen if the workflow failed before the job started.`,
                stepName: "Job Setup",
                logFile: ""
            };
            console.log(JSON.stringify(result));
            process.exit(0);
        }

        const failedStep = failedJob.steps.find((s: any) => s.conclusion === 'failure');
        if (!failedStep) {
            const result = {
                log: `Could not find a failed step in job "${failedJob.name}". The job may have been cancelled.`,
                stepName: "Unknown Step",
                logFile: ""
            };
            console.log(JSON.stringify(result));
            process.exit(0);
        }

        const fullLog = execSync(`gh job view ${failedJob.id} --log`, {
            env: { ...process.env, NO_COLOR: '1' },
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'ignore']
        });

        const logFileName = `failure-log-${PROJECT_NAME}-${GITHUB_RUN_ID}.log`;
        fs.writeFileSync(logFileName, fullLog);

        const stepLog = extractStepLog(fullLog, failedStep.name);
        
        const maxLogLength = 1024;
        let truncatedLog = stepLog;
        if (stepLog.length > maxLogLength) {
            truncatedLog = '...\n' + stepLog.slice(stepLog.length - (maxLogLength - 5));
        }

        const result = {
            log: truncatedLog || "Could not extract specific step log. The job may have failed without detailed logs.",
            stepName: failedStep.name,
            logFile: logFileName
        };
        console.log(JSON.stringify(result));

    } catch (error) {
        const err = error as Error;
        const result = {
            log: `Error fetching failed step log: ${err.message}`,
            stepName: "Log Retrieval",
            logFile: ""
        };
        console.log(JSON.stringify(result));
        process.exit(1);
    }
}

main();