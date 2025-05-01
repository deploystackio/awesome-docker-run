const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');

// Configuration
const REPO_INDEX_PATH = path.join('.github', 'repo-index.json');
const DOCKER_RUN_PATTERN = 'commands/*/docker-run.md';
const GITHUB_API_RATE_LIMIT_WAIT = 60000; // 1 minute in ms

/**
 * Makes an HTTPS request to the GitHub API
 * @param {string} url - The GitHub API URL
 * @returns {Promise<Object>} The parsed JSON response
 */
function fetchFromGitHub(url) {
  return new Promise((resolve, reject) => {
    // Check if GitHub token is available
    const token = process.env.GITHUB_TOKEN;
    
    const options = {
      headers: {
        'User-Agent': 'awesome-docker-run-indexer',
        ...(token ? { 'Authorization': `token ${token}` } : {})
      }
    };

    https.get(url, options, (res) => {
      if (res.statusCode === 404) {
        return resolve({ notFound: true });
      }
      
      if (res.statusCode === 403) {
        console.warn('GitHub API rate limit reached. Waiting 60 seconds before retry...');
        setTimeout(() => {
          fetchFromGitHub(url).then(resolve).catch(reject);
        }, GITHUB_API_RATE_LIMIT_WAIT);
        return;
      }
      
      if (res.statusCode !== 200) {
        return reject(new Error(`GitHub API returned status code ${res.statusCode}`));
      }

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve(parsedData);
        } catch (e) {
          reject(new Error(`Failed to parse GitHub API response: ${e.message}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Runs a shell command and returns the output
 * @param {string} command - The command to run
 * @returns {string} The command output
 */
function runCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' }).trim();
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    return '';
  }
}

/**
 * Gets the list of files to process based on the changed files or fallback methods
 * @param {string} changedFiles - Space-separated list of changed files from GH Actions
 * @returns {string[]} Array of files to process
 */
function getFilesToProcess(changedFiles) {
  let filesToProcess = [];
  
  if (changedFiles && changedFiles.trim() !== '') {
    console.log("Processing changed files from action output...");
    filesToProcess = changedFiles.split(/\s+/).filter(Boolean);
  } else {
    // Fallback: Look for changes in the current PR
    console.log("No changes detected by changed-files action, falling back to git diff...");
    const prFiles = runCommand("git diff --name-only HEAD~1 HEAD | grep \"^commands/.*/docker-run.md\" || echo \"\"");
    
    if (prFiles) {
      filesToProcess = prFiles.split('\n').filter(Boolean);
    } else {
      // If still no files found, check for any docker-run.md files
      console.log("Checking for any files in commands directory...");
      const allFiles = runCommand(`find commands -name "docker-run.md"`);
      filesToProcess = allFiles.split('\n').filter(Boolean);
    }
  }
  
  return filesToProcess;
}

/**
 * Extracts front matter data from a docker-run.md file
 * @param {string} filePath - Path to the docker-run.md file
 * @returns {Object|null} Object with repo URL and category, or null if not found
 */
function extractFrontMatter(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const frontMatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontMatterRegex);
    
    if (match && match[1]) {
      const frontMatterLines = match[1].split('\n');
      let repoUrl = null;
      let category = null;
      
      // Parse front matter manually to extract repo and category
      for (const line of frontMatterLines) {
        const repoMatch = line.match(/repo:\s*"([^"]+)"/);
        if (repoMatch) {
          repoUrl = repoMatch[1];
        }
        
        const categoryMatch = line.match(/category:\s*"([^"]+)"/);
        if (categoryMatch) {
          category = categoryMatch[1];
        }
      }
      
      return { repoUrl, category };
    }
  } catch (error) {
    console.error(`Error reading ${filePath}: ${error.message}`);
  }
  return null;
}

/**
 * Get repository information from GitHub API
 * @param {string} repoUrl - The repository URL
 * @returns {Promise<Object>} Repository information object
 */
async function getRepoInfo(repoUrl) {
  try {
    // Extract owner and repo name from the URL
    const urlParts = repoUrl.replace(/^https:\/\/github\.com\//, '').split('/');
    const owner = urlParts[0];
    const repo = urlParts[1];
    
    if (!owner || !repo) {
      console.error(`Invalid GitHub URL format: ${repoUrl}`);
      return null;
    }
    
    console.log(`Fetching information for ${owner}/${repo} from GitHub API...`);
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;
    const repoData = await fetchFromGitHub(apiUrl);
    
    if (repoData.notFound) {
      console.warn(`Repository not found: ${repoUrl}`);
      return {
        name: repo,
        description: `Repository for ${repo}`
      };
    }
    
    return {
      name: repoData.name || repo,
      description: repoData.description || `Repository for ${repo}`
    };
  } catch (error) {
    console.error(`Error fetching repo info for ${repoUrl}: ${error.message}`);
    // Fallback to default values
    const repoName = repoUrl.split('/').pop();
    return {
      name: repoName,
      description: `Repository for ${repoName}`
    };
  }
}

/**
 * Updates the repository index with new mappings
 * @param {string[]} filesToProcess - List of files to update in the index
 * @returns {Promise<boolean>} True if changes were made, false otherwise
 */
async function updateRepoIndex(filesToProcess) {
  // Make sure the index file exists
  const indexDir = path.dirname(REPO_INDEX_PATH);
  if (!fs.existsSync(indexDir)) {
    fs.mkdirSync(indexDir, { recursive: true });
  }
  
  // Read the current index
  let indexContent = {};
  if (fs.existsSync(REPO_INDEX_PATH)) {
    try {
      indexContent = JSON.parse(fs.readFileSync(REPO_INDEX_PATH, 'utf8'));
    } catch (error) {
      console.error(`Error reading index file: ${error.message}`);
      indexContent = {};
    }
  }
  
  let changesMade = false;
  
  // Process each file
  for (const file of filesToProcess) {
    // Only process docker-run.md files
    if (!file.match(/commands\/[^\/]+\/docker-run\.md$/)) {
      continue;
    }
    
    console.log(`Processing ${file}`);
    
    // Extract the front matter data
    const frontMatterData = extractFrontMatter(file);
    
    if (frontMatterData && frontMatterData.repoUrl) {
      const repoUrl = frontMatterData.repoUrl;
      const category = frontMatterData.category;
      
      // Extract the command directory path
      const commandDir = path.dirname(file);
      const commandName = path.basename(commandDir);
      
      // Check if this repo URL already exists in the index
      const existingEntry = indexContent[repoUrl];
      
      if (existingEntry && existingEntry.path !== commandDir) {
        console.log(`Warning: Repository URL ${repoUrl} already exists in ${existingEntry.path}, will be updated to ${commandDir}`);
      }
      
      // Get repository information from GitHub API
      const repoInfo = await getRepoInfo(repoUrl);
      
      if (repoInfo) {
        // Add or update the entry in the index with the new structure including category
        indexContent[repoUrl] = {
          path: commandDir,
          category: category,
          name: repoInfo.name,
          description: repoInfo.description
        };
        
        console.log(`Added/Updated ${repoUrl} -> ${commandDir} (${repoInfo.name}, Category: ${category})`);
        changesMade = true;
      }
    }
  }
  
  // Write the updated index back to the file with proper formatting
  if (changesMade) {
    fs.writeFileSync(REPO_INDEX_PATH, JSON.stringify(indexContent, null, 2));
    console.log(`Updated ${REPO_INDEX_PATH}`);
  } else {
    console.log("No changes to the index file");
  }
  
  return changesMade;
}

// Main function
async function main() {
  try {
    // Get arguments from command line
    const changedFiles = process.argv[2] || '';
    
    // Get files to process
    const filesToProcess = getFilesToProcess(changedFiles);
    console.log(`Files to process: ${filesToProcess.join(', ') || 'none'}`);
    
    // Update the index
    const changesMade = await updateRepoIndex(filesToProcess);
    
    // Set output for GitHub Actions
    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `changes_made=${changesMade}\n`);
    } else {
      console.log(`::set-output name=changes_made::${changesMade}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error(`Error updating repository index: ${error.message}`);
    process.exit(1);
  }
}

main();
