/**
 * Validates that the repository URL in the front matter is not a duplicate
 * @param {string} fileContent - Content of the file to validate
 * @param {string} filePath - Path to the file (for error messages)
 * @returns {Object} Object with error (string|null) and isUpdate (boolean) properties
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Path to the repo index file
const INDEX_FILE = path.join(__dirname, '../../repo-index.json');

function validateDuplicateRepo(fileContent, filePath) {
  // Default result object
  const result = {
    error: null,
    isUpdate: false
  };

  // Extract front matter
  const frontMatterRegex = /^---\n([\s\S]*?)\n---/;
  const frontMatterMatch = fileContent.match(frontMatterRegex);
  
  if (!frontMatterMatch) {
    return result; // No front matter found, this will be caught by another validator
  }
  
  try {
    // Parse front matter as YAML
    const frontMatter = yaml.load(frontMatterMatch[1]);
    
    // Check if repo field exists
    if (!frontMatter.repo) {
      return result; // No repo field, this will be caught by another validator
    }
    
    const repoUrl = frontMatter.repo;
    
    // Check if index file exists
    if (!fs.existsSync(INDEX_FILE)) {
      console.warn(`Repo index file ${INDEX_FILE} not found, skipping duplicate check`);
      return result;
    }
    
    // Load the index
    const index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
    
    // Check if the repo URL already exists in the index
    if (repoUrl in index) {
      // Get the command directory path from the current filePath
      // e.g., "commands/nginx/docker-run.md" -> "commands/nginx"
      const currentDirPath = path.dirname(filePath);
      
      // Get the existing path from the index
      // In newer format, the path is stored in index[repoUrl].path
      // In older format, it was stored directly as index[repoUrl]
      let existingPath;
      if (typeof index[repoUrl] === 'object' && index[repoUrl].path) {
        existingPath = index[repoUrl].path;
      } else {
        existingPath = index[repoUrl];
      }
      
      // If updating an existing entry (same directory), it's valid
      if (existingPath === currentDirPath) {
        result.isUpdate = true;
        return result;
      }
      
      result.error = `Repository URL "${repoUrl}" is already used in ${existingPath}. Each repository can only be added once.`;
      return result;
    }
    
    return result; // No duplicates found
  } catch (error) {
    result.error = `Error checking for duplicate repository: ${error.message}`;
    return result;
  }
}

module.exports = { validateDuplicateRepo };
