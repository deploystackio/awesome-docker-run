const fs = require('fs');
const path = require('path');

/**
 * Validates that files follow the expected structure and naming conventions
 * @param {string} filePath - Path to the file being validated
 * @returns {string|null} Error message or null if valid
 */
function validateFileStructure(filePath) {
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return `File ${filePath} not found`;
  }
  
  // Check if file is in the correct directory structure
  if (!filePath.startsWith('commands/')) {
    return `File ${filePath} is not in the commands directory`;
  }
  
  // Parse the path components
  const pathParts = filePath.split('/');
  
  // commands/app-name/docker-run.md
  if (pathParts.length !== 3) {
    return `Invalid path structure: ${filePath}. Expected format: commands/app-name/docker-run.md`;
  }
  
  // Check if the filename is correct
  const filename = path.basename(filePath);
  if (filename !== 'docker-run.md') {
    return `Invalid filename: ${filename}. Expected 'docker-run.md'`;
  }
  
  return null; // No errors
}

module.exports = { validateFileStructure };
