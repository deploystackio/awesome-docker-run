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
  
  // Parse the Docker command into components
  const parsedCommand = parseDockerCommand(dockerRunCmd);
  
  if (!parsedCommand.image) {
    return `No Docker image found in the run command in ${filePath}`;
  }
  
  // Check if the image has a tag (contains a colon that's not part of a registry port)
  const hasTag = /:([^/]+)$/.test(parsedCommand.image);
  
  if (!hasTag) {
    return `Docker image "${parsedCommand.image}" in ${filePath} does not specify a tag. Please use a specific tag (e.g., ${parsedCommand.image}:latest)`;
  }
  
  return null; // No errors
}

/**
 * Parses a Docker run command into its components
 * @param {string} commandLine - Docker run command to parse
 * @returns {Object} Object with image and other command components
 */
function parseDockerCommand(commandLine) {
  // Split the command by whitespace, preserving quoted strings
  const parts = splitCommandLine(commandLine);
  
  const result = {
    image: null,
    entrypoint: null,
    command: []
  };
  
  // Start after "docker run"
  let i = 2;
  
  // Process flags and their values
  while (i < parts.length) {
    const part = parts[i];
    
    // Check for entrypoint flag
    if (part === '--entrypoint') {
      if (i + 1 < parts.length) {
        result.entrypoint = parts[i + 1];
        i += 2;
        continue;
      }
    }
    
    // Skip other flags and their values
    if (part.startsWith('-')) {
      // If it's a flag with a value (like -p 80:80), skip the next part
      if (!part.includes('=') && 
          i + 1 < parts.length && 
          !parts[i + 1].startsWith('-')) {
        i += 2;
      } else {
        i += 1;
      }
      continue;
    }
    
    // First non-flag argument should be the image
    if (!result.image) {
      result.image = part;
    } else {
      // Anything after the image is considered part of the command
      result.command.push(part);
    }
    
    i += 1;
  }
  
  return result;
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
