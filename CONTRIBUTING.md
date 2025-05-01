# Contributing to awesome-docker-run

Thank you for your interest in contributing to awesome-docker-run! This project aims to create a curated collection of Docker run commands that can be automatically integrated with DeployStack. By contributing, you're helping developers discover and deploy applications more easily.

## How to Contribute

Contributing a Docker run command is straightforward:

1. Fork this repository
2. Create a new directory under the `commands/` directory with your application name (use kebab-case, e.g., `my-awesome-app`)
3. Create a `docker-run.md` file in that directory using our template format
4. Submit a pull request

## Docker Run Command Format

Each `docker-run.md` file should follow this structure:

```markdown
---
repo: "https://github.com/username/repository-name"
category: "Database"
logo: "https://example.com/path/to/logo.png"
---

# Docker Run Command

\`\`\`bash
docker run -d \
  -p 8080:80 \
  --name your-app-name \
  -e ENV_VAR1=value1 \
  -e ENV_VAR2=value2 \
  your-image:tag
\`\`\`
```

## Required Information

- **Docker Run Command**: The command must use a publicly available image and be tested to work properly.
- **category**: The category under which your application falls (e.g., Database, Web Server, AI, etc.). This field is mandatory, cannot be empty, and must be at least 2 characters long.
- **GitHub Repository URL**: A valid GitHub repository URL where the application code is hosted.

## Optional Information

- **Logo URL**: A URL to your project's logo (must be publicly accessible)

## Validation Requirements

Before submitting your pull request, make sure:

1. Your Docker run command is valid and can be executed
2. The Docker image referenced in your command is publicly available
3. Any environment variables are properly documented
4. The command follows best practices for Docker containers

## What Happens After Your PR is Merged

Once your pull request is merged:

1. Our automated system will validate your Docker run command
2. We will create IaC templates by [docker-to-iac](https://github.com/deploystackio/docker-to-iac), that will be stored here: [https://github.com/deploystackio/deploy-templates](https://github.com/deploystackio/deploy-templates)
3. Your application will be added to the DeployStack catalog and the README in this repository
4. Your Users will be able to deploy your application with a single click

## Additional Tips

- Use line continuations with `\` for readability in longer Docker run commands
- Include the most important environment variables, but don't overload the command
- Provide a clear, concise description that explains what makes your application useful
- Test your Docker run command locally before submitting

## Need Help?

If you have questions or need assistance, please:

1. Open an issue in this repository
2. Describe what you're trying to accomplish
3. Provide as much relevant information as possible
4. You can also visit our [Discord community](https://discord.gg/42Ce3S7b3b) for real-time help
5. You can also reach out to us on [Twitter / X](https://x.com/DeployStack) for quick questions

We'll do our best to help you contribute successfully!

Thank you for helping build the awesome-docker-run collection!
