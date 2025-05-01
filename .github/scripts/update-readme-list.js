const fs = require('fs');
const path = require('path');

const readmePath = path.resolve(__dirname, '../../README.md');
const repoIndexPath = path.resolve(__dirname, '../repo-index.json');
const appStartMarker = '<!-- APPLICATIONS_START -->';
const appEndMarker = '<!-- APPLICATIONS_END -->';
const tocStartMarker = '<!-- TOC_START -->';
const tocEndMarker = '<!-- TOC_END -->';

/**
 * Loads the repository index with enhanced metadata
 * @returns {Object|null} The repository index object or null if not found
 */
function loadRepoIndex() {
  try {
    if (fs.existsSync(repoIndexPath)) {
      console.log(`Reading repo index from: ${repoIndexPath}`);
      const indexContent = fs.readFileSync(repoIndexPath, 'utf8');
      console.log(`Repo index content: ${indexContent.slice(0, 300)}...`); // Log the first 300 chars
      return JSON.parse(indexContent);
    } else {
      console.error(`Repo index file does not exist at: ${repoIndexPath}`);
    }
  } catch (error) {
    console.error(`Error reading or parsing repo index: ${error.message}`);
  }
  return null;
}

/**
 * Generates the markdown list grouped by category from repo index
 * @returns {{markdownList: string, categories: string[]}} An object containing the markdown string and sorted category names.
 */
function generateGroupedAppListAndCategories() {
  const appsByCategory = {};
  const repoIndex = loadRepoIndex();

  if (!repoIndex) {
    console.error("Could not load repository index");
    process.exit(1);
  }

  console.log(`Found ${Object.keys(repoIndex).length} entries in repo index`);
  
  // Process all entries in the repo index
  for (const [repoUrl, repoEntry] of Object.entries(repoIndex)) {
    const { path: appPath, name: appName, category, description } = repoEntry;
    console.log(`Processing entry: ${repoUrl} -> ${appName} (${category})`);
    
    if (category) {
      if (!appsByCategory[category]) {
        appsByCategory[category] = [];
      }
      
      appsByCategory[category].push({
        name: appName,
        path: appPath,
        description: description || ''
      });
    } else {
      console.warn(`Skipping app "${appName}" due to missing category in repo-index.json`);
    }
  }

  // Sort categories alphabetically
  const sortedCategories = Object.keys(appsByCategory).sort((a, b) => a.localeCompare(b));
  console.log(`Found categories: ${sortedCategories.join(', ')}`);

  let markdownList = '';
  for (const category of sortedCategories) {
    markdownList += `### ${category}\n\n`;
    
    // Sort apps within category alphabetically
    const sortedApps = appsByCategory[category].sort((a, b) => a.name.localeCompare(b.name));
    console.log(`Category ${category} has ${sortedApps.length} apps`);
    
    // Create entries with name, path and description
    markdownList += sortedApps.map(app => {
      const description = app.description ? ` - ${app.description}` : '';
      return `- [${app.name}](${app.path}/)${description}`;
    }).join('\n');
    
    markdownList += '\n\n'; // Add space between categories
  }

  return {
    markdownList: markdownList.trim(), // Remove trailing newline
    categories: sortedCategories
  };
}

/**
 * Generates the full Table of Contents markdown, including static items and dynamic categories.
 * @param {string[]} categories - Sorted list of category names.
 * @returns {string} The generated markdown string for the full TOC.
 */
function generateFullTocContent(categories) {
  // Static TOC items
  const staticItems = [
    '- [What is this?](#what-is-this)',
    '- [How it works](#how-it-works)',
    '- [How to contribute](#how-to-contribute)',
    '- [Community](#community)',
    '- [Applications](#applications)'
  ];

  // Dynamic category items (indented)
  const formatAnchor = (name) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  const dynamicItems = categories.map(category => `  - [${category}](#${formatAnchor(category)})`);

  // Combine static, dynamic, and the final static item
  const tocItems = [
    ...staticItems,
    ...dynamicItems,
    '- [License](#license)' // Add the last static item
  ];

  return tocItems.join('\n');
}

/**
 * Updates the README.md file with the new application list and TOC.
 */
function updateReadme() {
  try {
    const { markdownList: newAppListContent, categories: sortedCategories } = generateGroupedAppListAndCategories();
    const newFullTocContent = generateFullTocContent(sortedCategories);

    let readmeContent = fs.readFileSync(readmePath, 'utf8');
    const originalReadmeContent = readmeContent; // Store original content for comparison

    // --- Update Applications Section ---
    const appStartIndex = readmeContent.indexOf(appStartMarker);
    const appEndIndex = readmeContent.indexOf(appEndMarker);

    if (appStartIndex === -1 || appEndIndex === -1 || appStartIndex >= appEndIndex) {
      console.error(`Error: Application markers '${appStartMarker}' or '${appEndMarker}' not found or in wrong order in ${readmePath}`);
      process.exit(1);
    }

    const appPrefix = readmeContent.substring(0, appStartIndex + appStartMarker.length);
    const appSuffix = readmeContent.substring(appEndIndex);
    // Ensure there's a newline after the start marker and before the list, and after the list before the end marker
    readmeContent = `${appPrefix}\n\n${newAppListContent}\n\n${appSuffix}`;
    console.log('Applications section prepared.');

    // --- Update TOC Section ---
    const tocStartIndex = readmeContent.indexOf(tocStartMarker);
    const tocEndIndex = readmeContent.indexOf(tocEndMarker);

    if (tocStartIndex === -1 || tocEndIndex === -1 || tocStartIndex >= tocEndIndex) {
      console.error(`Error: TOC markers '${tocStartMarker}' or '${tocEndMarker}' not found or in wrong order in ${readmePath}. Please add them.`);
      // Don't exit immediately, maybe only apps changed. But warn loudly.
    } else {
      const tocPrefix = readmeContent.substring(0, tocStartIndex + tocStartMarker.length);
      const tocSuffix = readmeContent.substring(tocEndIndex);
      readmeContent = `${tocPrefix}\n${newFullTocContent}\n${tocSuffix}`;
      console.log('Full TOC section prepared using start/end markers.');
    }

    // --- Write File and Set Output ---
    let changesMade = false;
    if (readmeContent !== originalReadmeContent) {
      fs.writeFileSync(readmePath, readmeContent, 'utf8');
      console.log(`${readmePath} updated successfully.`);
      changesMade = true;
    } else {
      console.log(`${readmePath} is already up-to-date.`);
    }

    // Output for GitHub Actions
    const githubOutput = process.env.GITHUB_OUTPUT;
    if (githubOutput) {
      fs.appendFileSync(githubOutput, `changes_made=${changesMade}\n`);
      console.log(`Output changes_made=${changesMade} set for GitHub Actions.`);
    } else {
      console.warn('GITHUB_OUTPUT environment variable not set. Cannot set output for GitHub Actions.');
    }

  } catch (error) {
    console.error(`Error updating ${readmePath}:`, error);
    process.exit(1);
  }
}

// Run the update
updateReadme();
