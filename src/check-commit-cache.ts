import { setOutput, getInput } from '@actions/core';
import { existsSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

interface CacheCheckResult {
  shouldProceed: boolean;
  lastSha: string;
  lastShaShort: string;
  shaDisplay: string;
  cacheExists: boolean;
}

async function checkCommitCache(): Promise<void> {
  try {
    const project = getInput('project');
    const currentSha = getInput('current_sha');
    const cacheFileName = `last_successful_sha_${project}.txt`;
    
    let result: CacheCheckResult = {
      shouldProceed: true, // Default to true when no cache exists
      lastSha: '',
      lastShaShort: '',
      shaDisplay: currentSha.slice(0, 7),
      cacheExists: false
    };

    if (existsSync(cacheFileName)) {
      const lastSha = (await readFile(cacheFileName, 'utf-8')).trim();
      const lastShaShort = lastSha.slice(0, 7);
      
      result = {
        shouldProceed: currentSha !== lastSha,
        lastSha,
        lastShaShort,
        shaDisplay: `[${lastShaShort}](https://github.com/${getInput('repo')}/commit/${lastSha}) → [${currentSha.slice(0,7)}](https://github.com/${getInput('repo')}/commit/${currentSha})`,
        cacheExists: true
      };
    }

    setOutput('should_proceed', result.shouldProceed.toString());
    setOutput('last_sha', result.lastSha);
    setOutput('last_sha_short', result.lastShaShort);
    setOutput('sha_display', result.shaDisplay);
    setOutput('cache_exists', result.cacheExists.toString());

    // Update cache file if proceeding
    if (result.shouldProceed) {
      await writeFile(cacheFileName, currentSha);
    }

  } catch (error) {
    console.error('Commit cache check failed:', error instanceof Error ? error.message : String(error));
    setOutput('should_proceed', 'false');
    process.exit(1);
  }
}

checkCommitCache();