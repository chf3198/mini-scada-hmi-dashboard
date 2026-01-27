# Security Policy

## Supported Versions

This is an educational demo project. Security updates are provided on a best-effort basis.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously, even for demo projects. If you discover a security vulnerability:

1. **Do NOT** open a public issue
2. Email: curtisfranks@gmail.com with subject "SECURITY: Mini SCADA HMI Dashboard"
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and work with you to address the issue.

## Security Considerations

This is a **demonstration project** for learning purposes. For production use:

- Implement proper authentication/authorization
- Add input validation beyond the demo sanitization
- Use HTTPS for all connections
- Implement rate limiting
- Add CSRF protection
- Use environment variables for any credentials
- Regular dependency updates
