/**
 * Validates the Docker run command in the markdown file
 * @param {string} fileContent - Content of the file to validate
 * @param {string} filePath - Path to the file (for error messages)
 * @returns {string|null} Error message or null if valid
 */
function validateDockerCommand(fileContent, filePath) {
  // Check for Docker run command in a code block
  const dockerRunRegex = /```bash\s+(docker\s+run\s+.+?)```/s;
  const dockerRunMatch = fileContent.match(dockerRunRegex);
  
  if (!dockerRunMatch) {
    return `No Docker run command found in a bash code block in ${filePath}`;
  }
  
  // Basic validation of Docker run command
  const dockerRunCmd = dockerRunMatch[1].trim();
  if (!dockerRunCmd.startsWith('docker run')) {
    return `Invalid Docker run command in ${filePath}`;
  }
  
  // Check that Docker run command includes a port mapping
  const portRegex = /-p\s+(\d+):(\d+)|--publish\s+(\d+):(\d+)/;
  if (!portRegex.test(dockerRunCmd)) {
    return `Docker run command must include a port mapping using -p or --publish in ${filePath}`;
  }
  
  return null; // No errors
}

module.exports = { validateDockerCommand };
