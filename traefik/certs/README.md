# Traefik SSL Certificates

This directory contains SSL certificates for Traefik HTTPS.

## For Local Development (Self-Signed Certificates)

Generate self-signed certificates:

```bash
# From the project root directory:
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout traefik/certs/key.pem \
  -out traefik/certs/cert.pem \
  -subj "/CN=homelib.local"
```

Replace `homelib.local` with your `TRAEFIK_HOST` value from `.env` if you changed it.

## For Production (Let's Encrypt)

Use `compose.prod.yml` instead of `compose.yml`. Let's Encrypt will automatically generate and manage certificates.

## Required Files

- `cert.pem` - SSL certificate
- `key.pem` - Private key

**Note:** These files are gitignored and will not be committed to the repository. Each user must generate their own certificates.
