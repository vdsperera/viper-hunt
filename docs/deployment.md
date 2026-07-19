# Deployment and Legal Compliance Process

## Manual Compliance Check Gate (TASK-002)

To fulfill legal and compliance requirements (US-015), public deployments of the Viper Hunt application MUST include a manual approval step before releasing to production.

### Requirement
Before any automated pipeline promotes an artifact to the production environment, a designated compliance reviewer must manually verify:
1. PII and sensitive data masking are intact.
2. The fallback JSON (`fallback_registry.json`) does not contain unapproved real-world criminal identities outside of the agreed-upon public figures.
3. No hardcoded credentials or API secrets are embedded in the client source.

### Implementation
In the CI/CD pipeline (e.g., GitHub Actions environments, GitLab manual gates), the deployment job to `production` must be configured with `environment` protection rules requiring manual sign-off by the `@compliance-team`.

**Example GitHub Actions pseudo-config:**
```yaml
environment:
  name: production
  url: https://viper-hunt.app
  # Requires manual approval in repository settings for this environment
```
