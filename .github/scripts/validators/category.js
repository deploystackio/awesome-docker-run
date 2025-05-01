const yaml = require('js-yaml');

/**
 * Validates the category field in the front matter of a markdown file
 * @param {string} fileContent - Content of the file to validate
 * @param {string} filePath - Path to the file (for error messages)
 * @returns {string|null} Error message or null if valid
 */
function validateCategory(fileContent, filePath) {
  // Extract front matter
  const frontMatterRegex = /^---\n([\s\S]*?)\n---/;
  const frontMatterMatch = fileContent.match(frontMatterRegex);

  if (!frontMatterMatch) {
    // If there's no front matter, another validator (frontMatter.js) should catch this.
    // We can return null here or choose to enforce front matter existence.
    // Let's assume frontMatter.js handles the absence of front matter.
    return null;
  }

  try {
    // Parse front matter as YAML
    const frontMatter = yaml.load(frontMatterMatch[1]);

    // Check if category field exists
    if (frontMatter.category === undefined || frontMatter.category === null) {
      return `Missing required field 'category' in front matter of ${filePath}`;
    }

    // Check if category is a string
    if (typeof frontMatter.category !== 'string') {
        return `Field 'category' must be a string in front matter of ${filePath}`;
    }

    const categoryValue = frontMatter.category.trim();

    // Check if category is empty after trimming
    if (categoryValue === '') {
      return `Field 'category' cannot be empty in front matter of ${filePath}`;
    }

    // Check if category length is >= 2
    if (categoryValue.length < 2) {
      return `Field 'category' must be at least 2 characters long in front matter of ${filePath}. Found: "${categoryValue}"`;
    }

    return null; // No errors
  } catch (error) {
    // Error parsing YAML, likely handled by frontMatter.js, but good to have a catch here too.
    return `Error parsing front matter in ${filePath} for category validation: ${error.message}`;
  }
}

module.exports = { validateCategory };
