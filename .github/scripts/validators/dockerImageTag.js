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
  
  // Tokenize the command properly
  const tokens = tokenizeCommand(dockerRunCmd);
  
  // Find the image index in the command
  const imageIndex = findImageIndex(tokens);
  
  if (imageIndex === -1 || imageIndex >= tokens.length) {
    return `No Docker image found in the run command in ${filePath}`;
  }
  
  const image = tokens[imageIndex];
  
  // Check if the image has a tag (contains a colon that's not part of a registry port)
  const hasTag = /:([^/]+)$/.test(image);
  
  if (!hasTag) {
    return `Docker image "${image}" in ${filePath} does not specify a tag. Please use a specific tag (e.g., ${image}:latest)`;
  }
  
  return null; // No errors
}

/**
 * Tokenizes a command string respecting quotes
 * @param {string} cmd - Command string to tokenize
 * @returns {string[]} Array of tokens
 */
function tokenizeCommand(cmd) {
  const tokens = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';
  
  for (let i = 0; i < cmd.length; i++) {
    const char = cmd[i];
    
    if ((char === '"' || char === "'") && (i === 0 || cmd[i-1] !== '\\')) {
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
        tokens.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }
  
  if (current) {
    tokens.push(current);
  }
  
  return tokens;
}

/**
 * Finds the index of the Docker image in the command tokens
 * @param {string[]} tokens - Tokenized command
 * @returns {number} Index of the image or -1 if not found
 */
function findImageIndex(tokens) {
  if (tokens.length < 3 || tokens[0] !== 'docker' || tokens[1] !== 'run') {
    return -1;
  }

  // Options known to take exactly one argument
  // Note: This list might not be exhaustive but covers common cases.
  const optionsWithArgs = new Set([
    '-p', '--publish',
    '-v', '--volume',
    '-e', '--env',
    '--name',
    '--network',
    '--user', '-u',
    '--workdir', '-w',
    '--label', '-l',
    '--add-host',
    '--device',
    '--env-file',
    '--log-driver',
    '--log-opt',
    '--mount',
    '--ulimit',
    '--entrypoint',
    '--hostname', '-h',
    '--memory', '-m',
    '--cpus',
    '--gpus',
    '--runtime',
    '--security-opt',
    '--storage-opt',
    '--tmpfs',
    '--restart', // Takes an argument like 'always' or 'on-failure:5'
    // Add more as needed
  ]);

  let i = 2; // Start after "docker run"
  while (i < tokens.length) {
    const token = tokens[i];

    if (token.startsWith('-')) {
      let option = token;
      let valueIncluded = false;

      // Handle combined options like --option=value
      if (token.includes('=')) {
        const parts = token.split('=', 2);
        option = parts[0];
        valueIncluded = true; // Value is part of this token
        i++; // Consume this token
      }
      // Handle separate option and value
      else if (optionsWithArgs.has(option)) {
        // Check if there is a next token to be the value
        if (i + 1 < tokens.length) {
          // Assume the next token is the value, even if it starts with '-'
          // Docker CLI generally treats the next token as the value for these options.
          i += 2; // Consume option and value
        } else {
          // Option requires value, but none provided (error state, but let validation catch it later)
          i++; // Consume just the option
        }
      }
      // Handle boolean flags or combined short flags like -it
      else {
         // Assume it's a flag (or multiple combined flags like -it) that doesn't take a value
         i++; // Consume the flag token
      }
      continue; // Move to the next potential token
    } else {
      // This is the first token that doesn't start with '-' and wasn't consumed as an argument
      return i; // Found the image
    }
  }

  return -1; // Image not found
}

module.exports = { validateDockerImageTag };
