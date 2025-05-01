/**
 * Validates that the Docker image in the run command has a tag
 * @param {string} fileContent - Content of the file to validate
 * @param {string} filePath - Path to the file (for error messages)
 * @returns {string|null} Error message or null if valid
 */
function validateDockerImageTag(fileContent, filePath) {
  // Check for Docker run command in a code block
  const dockerRunRegex = /```bash\s+(docker\s+run\s+.+?)```/s;
  const dockerRunMatch = fileContent.match(dockerRunRegex);
  
  if (!dockerRunMatch) {
    return null; // No Docker run command found, this will be caught by another validator
  }
  
  // Extract the Docker run command
  const dockerRunCmd = dockerRunMatch[1].trim();
  
  // Split the command by whitespace, preserving quoted strings
  const parts = splitCommandLine(dockerRunCmd);
  
  // Find the image part (it should be the first non-flag argument after "docker run")
  let imageIndex = -1;
  for (let i = 2; i < parts.length; i++) {
    // Skip flags and their values
    if (parts[i].startsWith('-')) {
      // If it's a flag with a value (like -p 80:80), skip the next part
      if (!parts[i].includes('=') && 
          i + 1 < parts.length && 
          !parts[i + 1].startsWith('-')) {
        i++;
      }
      continue;
    }
    
    // First non-flag argument should be the image
    imageIndex = i;
    break;
  }
  
  if (imageIndex === -1) {
    return `No Docker image found in the run command in ${filePath}`;
  }
  
  const image = parts[imageIndex];
  
  // Check if the image has a tag (contains a colon that's not part of a registry port)
  // Fixed regex to properly handle username/repository:tag format
  const hasTag = /:([^/]+)$/.test(image);
  
  if (!hasTag) {
    return `Docker image "${image}" in ${filePath} does not specify a tag. Please use a specific tag (e.g., ${image}:latest)`;
  }
  
  return null; // No errors
}

/**
 * Splits a command line string into an array of arguments, preserving quoted strings
 * @param {string} cmdLine - Command line string to split
 * @returns {string[]} Array of command arguments
 */
function splitCommandLine(cmdLine) {
  const result = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';
  
  // Remove line continuations
  cmdLine = cmdLine.replace(/\s*\\\s*\n\s*/g, ' ');
  
  for (let i = 0; i < cmdLine.length; i++) {
    const char = cmdLine[i];
    
    if ((char === '"' || char === "'") && (i === 0 || cmdLine[i-1] !== '\\')) {
      if (!inQuote) {
        inQuote = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        inQuote = false;
        quoteChar = '';
      } else {
        current += char;
      }
    } else if (char === ' ' && !inQuote) {
      if (current) {
        result.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }
  
  if (current) {
    result.push(current);
  }
  
  return result;
}

module.exports = { validateDockerImageTag };
