import { setOutput } from '@actions/core';
import { Octokit } from '@octokit/rest';

async function checkReleaseAndTag() {
  try {
    const [,, repoInput, tagInput] = process.argv;
    const [owner, repo] = repoInput.split('/');
    const tagName = tagInput;
    const token = process.env.GH_TOKEN || '';

    const octokit = new Octokit({ auth: token });
    let releaseExists = false;
    let tagExists = false;

    // Check for release
    try {
      await octokit.repos.getReleaseByTag({ owner, repo, tag: tagName });
      releaseExists = true;
    } catch (error: unknown) {
      if (isGitHubError(error) && error.status !== 404) {
        throw new Error(`Release check failed: ${error.message}`);
      }
    }

    // Check for tag
    try {
      await octokit.git.getRef({ owner, repo, ref: `tags/${tagName}` });
      tagExists = true;
    } catch (error: unknown) {
      if (isGitHubError(error) && error.status !== 404) {
        throw new Error(`Tag check failed: ${error.message}`);
      }
    }

    setOutput('release_exists', releaseExists.toString());
    setOutput('tag_exists', tagExists.toString());
    console.log(`Checked ${repoInput}@${tagName} - Release: ${releaseExists}, Tag: ${tagExists}`);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error checking release and tag:', message);
    process.exit(1);
  }
}

function isGitHubError(error: unknown): error is { status: number } & Error {
  return error instanceof Error && 
        'status' in error && 
        typeof (error as { status: unknown }).status === 'number';
}

checkReleaseAndTag();