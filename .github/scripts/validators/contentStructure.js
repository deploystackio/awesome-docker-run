// validators/contentStructure.js
/**
 * Validates the structure of the markdown content
 * @param {string} fileContent - Content of the file to validate
 * @param {string} filePath - Path to the file (for error messages)
 * @returns {string|null} Error message or null if valid
 */
function validateContentStructure(fileContent, filePath) {
  // Check if file is empty
  if (!fileContent.trim()) {
    return `File ${filePath} is empty`;
  }
  
  // Remove front matter for content checks
  const contentWithoutFrontMatter = fileContent.replace(/^---\n[\s\S]*?\n---/, '').trim();
  
  // Check for application name (H1 heading)
  const h1Match = contentWithoutFrontMatter.match(/^#\s+(.+)$/m);
  if (!h1Match) {
    return `Missing application name (H1 heading) in ${filePath}`;
  }
  
  // Check for Docker run command section - It can be either "# Docker Run Command" or "## Docker Run Command"
  if (!contentWithoutFrontMatter.includes('# Docker Run Command') && 
      !contentWithoutFrontMatter.includes('## Docker Run Command')) {
    return `Missing "Docker Run Command" section in ${filePath}`;
  }
  
  // Description is optional based on the CONTRIBUTING.md guidelines
  
  return null; // No errors
}

module.exports = { validateContentStructure };
