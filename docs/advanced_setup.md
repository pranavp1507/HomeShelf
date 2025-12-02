# Advanced Setup Guide with Traefik and HTTPS

This guide covers the advanced local development setup using Traefik reverse proxy with self-signed SSL certificates.

**⚠️ Important:** This setup is complex and platform-specific. **Most users should use `compose.dev.yml` instead** (see [Quick Start](../README.md#quick-start)).

Only use this setup if you specifically need:
- HTTPS locally (with self-signed certificates)
- Production-like reverse proxy configuration
- Learning Traefik
- Testing multi-service routing

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Platform Compatibility](#platform-compatibility)
3. [Step-by-Step Setup](#step-by-step-setup)
4. [Accessing the Application](#accessing-the-application)
5. [Troubleshooting](#troubleshooting)
6. [Switching Back to Simple Setup](#switching-back-to-simple-setup)

---

## Prerequisites

### Required Software

- **Container Runtime:**
  - Docker 24+ with Docker Compose, OR
  - Podman 4+ with podman-compose
- **OpenSSL** (for certificate generation)
- **Administrator/sudo access** (for hosts file modification)

### Platform-Specific Requirements

**Linux:**
- Docker socket: `/var/run/docker.sock` (Docker) or `/run/podman/podman.sock` (Podman rootful)
- Rootless Podman: `/run/user/$(id -u)/podman/podman.sock`

**macOS:**
- Docker Desktop installed
- Docker socket: `/var/run/docker.sock`

**Windows:**
- This setup is **difficult on Windows**
- Docker Desktop with WSL2 backend may work
- **Recommendation: Use `compose.dev.yml` instead**

---

## Platform Compatibility

| Platform | Docker | Podman | Difficulty | Recommendation |
|----------|--------|--------|------------|----------------|
| **Linux** | ✅ Works | ✅ Works | Medium | Proceed with this guide |
| **macOS** | ✅ Works | ⚠️ Tricky | Medium | Docker recommended |
| **Windows** | ⚠️ Difficult | ❌ Complex | High | Use `compose.dev.yml` instead |

---

## Step-by-Step Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/pranavp1507/homeshelf.git
cd homeshelf
```

### Step 2: Modify Hosts File

Add `local.test` to your hosts file so your browser can resolve it to localhost.

**Linux/macOS:**
```bash
# Add entry to hosts file
echo "127.0.0.1 local.test" | sudo tee -a /etc/hosts

# Verify it was added
grep local.test /etc/hosts
```

**Windows (PowerShell as Administrator):**
```powershell
# Add entry to hosts file
Add-Content C:\Windows\System32\drivers\etc\hosts "127.0.0.1 local.test"

# Verify it was added
Get-Content C:\Windows\System32\drivers\etc\hosts | Select-String "local.test"
```

**Verify:**
```bash
ping local.test
# Should respond from 127.0.0.1
```

### Step 3: Generate SSL Certificates

Create self-signed SSL certificates for HTTPS locally.

```bash
# Create certificates directory
mkdir -p traefik/certs
cd traefik/certs

# Generate self-signed certificate valid for 365 days
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes \
  -subj "/CN=local.test" \
  -addext "subjectAltName=DNS:local.test"

# Set appropriate permissions
chmod 600 key.pem
chmod 644 cert.pem

# Return to project root
cd ../..
```

**Verify certificates:**
```bash
# Check certificate details
openssl x509 -in traefik/certs/cert.pem -text -noout | grep -A 1 "Subject:"
# Should show CN=local.test
```

### Step 4: Configure Container Socket Path

The `compose.yml` file needs access to the container runtime socket. The path differs by platform and runtime.

**For Docker (most systems):**

The default path in `compose.yml` should work:
```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock:ro
```

Verify the socket exists:
```bash
ls -la /var/run/docker.sock
# Should show: srw-rw---- ... /var/run/docker.sock
```

**For Podman (Linux rootful):**

Edit `compose.yml` line ~72:
```yaml
volumes:
  - /run/podman/podman.sock:/var/run/docker.sock:ro
```

Verify:
```bash
ls -la /run/podman/podman.sock
```

**For Podman (Linux rootless):**

Edit `compose.yml` line ~72:
```yaml
volumes:
  - /run/user/1000/podman/podman.sock:/var/run/docker.sock:ro
  # Replace 1000 with your UID (run: id -u)
```

Verify:
```bash
ls -la /run/user/$(id -u)/podman/podman.sock
```

**For macOS with Podman:**

Podman Machine creates a socket at:
```yaml
volumes:
  - /Users/yourusername/.local/share/containers/podman/machine/podman.sock:/var/run/docker.sock:ro
```

Check where your Podman socket is:
```bash
podman info --format '{{.Host.RemoteSocket.Path}}'
```

### Step 5: Update Environment Variables

**Backend (`server/.env`):**

The backend needs to know it's behind Traefik:
```bash
# Copy example if not exists
cp server/.env.example server/.env

# Edit server/.env
nano server/.env
```

Update:
```env
DATABASE_URL=postgresql://user:password@postgres:5432/library
JWT_SECRET=your-secure-secret-here
PORT=3001
NODE_ENV=development
```

**Frontend (`client/.env`):**

The frontend needs to use the Traefik domain:
```bash
# Copy example if not exists
cp client/.env.example client/.env

# Edit client/.env
nano client/.env
```

Update:
```env
VITE_API_URL=https://local.test/api
VITE_LIBRARY_NAME=My Library
VITE_LIBRARY_LOGO=/Logo.svg
```

### Step 6: Start the Application

```bash
# Start all services
docker-compose up --build

# OR for Podman
podman-compose up --build

# OR using Make
make advanced
```

**What happens:**
1. PostgreSQL starts and initializes database
2. Backend server starts and waits for database
3. Frontend builds and serves
4. Traefik starts and routes traffic

**Expected output:**
```
[+] Running 4/4
 ✔ Container mulampuzha-library-postgres-1  Started
 ✔ Container mulampuzha-library-server-1    Started
 ✔ Container mulampuzha-library-client-1    Started
 ✔ Container mulampuzha-library-traefik-1   Started
```

### Step 7: Verify Traefik is Running

Check Traefik dashboard:
```bash
# Open in browser
open http://localhost:8080

# OR use curl
curl http://localhost:8080/api/http/routers
```

You should see:
- Router: `mulampuzha-library-client`
- Router: `mulampuzha-library-server`
- Both should show as "green" (active)

---

## Accessing the Application

### Main Application

**URL:** https://local.test

**First visit:**
1. Browser will show "Your connection is not private" warning
2. This is **expected** with self-signed certificates
3. Click "Advanced" → "Proceed to local.test (unsafe)"

**Trust certificate (optional):**

To avoid warnings every time, install the certificate in your system:

**Linux:**
```bash
# Copy to system trust store
sudo cp traefik/certs/cert.pem /usr/local/share/ca-certificates/local.test.crt
sudo update-ca-certificates
```

**macOS:**
```bash
# Add to keychain and trust
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain traefik/certs/cert.pem
```

**Windows:**
```powershell
# Import to Trusted Root Certification Authorities
Import-Certificate -FilePath .\traefik\certs\cert.pem -CertStoreLocation Cert:\LocalMachine\Root
```

### Traefik Dashboard

**URL:** http://localhost:8080

- View active routers
- Check service health
- Monitor traffic
- Debug routing issues

### Direct Service Access (for debugging)

Services are NOT directly accessible on host ports. To access directly:

```bash
# Backend API (inside container)
docker-compose exec server sh
wget http://localhost:3001/api/books

# Frontend (inside container)
docker-compose exec client sh
wget http://localhost:3000

# PostgreSQL
docker-compose exec postgres psql -U user -d library
```

---

## Troubleshooting

### Issue: "local.test not found"

**Symptom:** Browser shows "This site can't be reached"

**Solutions:**
1. Verify hosts file entry:
   ```bash
   grep local.test /etc/hosts  # Linux/macOS
   # OR
   Get-Content C:\Windows\System32\drivers\etc\hosts | Select-String "local.test"  # Windows
   ```
2. Ping to verify:
   ```bash
   ping local.test
   # Should respond from 127.0.0.1
   ```
3. Clear DNS cache:
   ```bash
   # Linux
   sudo systemd-resolve --flush-caches

   # macOS
   sudo dscacheutil -flushcache

   # Windows
   ipconfig /flushdns
   ```

### Issue: "Cannot connect to Docker socket"

**Symptom:**
```
Error: Cannot connect to the Docker daemon at unix:///var/run/docker.sock
```

**Solutions:**

1. **Check socket exists:**
   ```bash
   ls -la /var/run/docker.sock
   # OR for Podman
   ls -la /run/podman/podman.sock
   ```

2. **For Podman, enable socket:**
   ```bash
   # Rootful
   sudo systemctl enable --now podman.socket

   # Rootless
   systemctl --user enable --now podman.socket
   ```

3. **Verify socket path in compose.yml:**
   - Check line ~72 in `compose.yml`
   - Path must match your actual socket location

4. **Try simple setup instead:**
   ```bash
   docker-compose down
   docker-compose -f compose.dev.yml up
   ```

### Issue: Certificate Warnings Persist

**Symptom:** Browser always shows "Not secure" warning

**Solutions:**

1. **Verify certificate CN matches domain:**
   ```bash
   openssl x509 -in traefik/certs/cert.pem -text -noout | grep Subject:
   # Should show: CN=local.test
   ```

2. **Regenerate certificate with SAN:**
   ```bash
   cd traefik/certs
   openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes \
     -subj "/CN=local.test" \
     -addext "subjectAltName=DNS:local.test"
   ```

3. **Install certificate in system trust store** (see [Accessing the Application](#accessing-the-application))

4. **Alternatively, use HTTP setup:**
   ```bash
   docker-compose down
   docker-compose -f compose.dev.yml up
   # Access at http://localhost:3000 (no warnings)
   ```

### Issue: Traefik Shows "No Routers"

**Symptom:** Traefik dashboard (localhost:8080) shows no routers

**Solutions:**

1. **Check container labels:**
   ```bash
   docker inspect mulampuzha-library-client-1 | grep -A 20 Labels
   # Should show traefik labels
   ```

2. **Check Traefik logs:**
   ```bash
   docker-compose logs traefik
   # Look for errors about provider or configuration
   ```

3. **Verify socket permissions:**
   ```bash
   # Check Traefik can access socket
   docker-compose exec traefik ls -la /var/run/docker.sock
   ```

4. **Restart Traefik:**
   ```bash
   docker-compose restart traefik
   ```

### Issue: Services Start But Can't Connect

**Symptom:** Traefik shows green, but https://local.test shows errors

**Solutions:**

1. **Check service health:**
   ```bash
   docker-compose ps
   # All should show "Up"
   ```

2. **Check backend logs:**
   ```bash
   docker-compose logs server
   # Look for database connection errors
   ```

3. **Test backend directly:**
   ```bash
   curl http://localhost:8080/api/books
   # Should NOT work (not exposed)

   # Test via Traefik
   curl https://local.test/api/books --insecure
   # Should return JSON
   ```

4. **Verify frontend env:**
   ```bash
   docker-compose exec client env | grep VITE_API_URL
   # Should show: VITE_API_URL=https://local.test/api
   ```

### Issue: Windows-Specific Errors

**Symptom:** Line ending errors, exec format errors

**Solution:**

1. **Fix Git line endings:**
   ```bash
   git config --global core.autocrlf input
   git config --global core.eol lf
   ```

2. **Re-clone repository:**
   ```bash
   cd ..
   rm -rf mulampuzha-library
   git clone https://github.com/yourusername/mulampuzha-library.git
   cd mulampuzha-library
   ```

3. **Or convert files:**
   ```bash
   # In Git Bash or WSL
   dos2unix server/start.sh
   dos2unix server/backup.sh
   ```

4. **Recommended: Use WSL2:**
   ```bash
   # In WSL2 terminal
   cd ~
   git clone https://github.com/yourusername/mulampuzha-library.git
   cd mulampuzha-library
   docker-compose up
   ```

5. **Or switch to simple setup:**
   ```bash
   docker-compose -f compose.dev.yml up
   ```

---

## Switching Back to Simple Setup

If this advanced setup is too complex or causing issues:

**Step 1: Stop Advanced Setup**
```bash
docker-compose down
```

**Step 2: Start Simple Setup**
```bash
docker-compose -f compose.dev.yml up --build
```

**Step 3: Access Application**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001/api
- No hosts file needed
- No certificates needed
- No socket configuration needed

**Step 4: Update Frontend Env (if needed)**
```bash
# Edit client/.env
VITE_API_URL=http://localhost:3001/api
```

---

## Comparison: Advanced vs Simple

| Feature | Advanced (compose.yml) | Simple (compose.dev.yml) |
|---------|----------------------|------------------------|
| **HTTPS** | ✅ Yes (self-signed) | ❌ No (HTTP only) |
| **Reverse Proxy** | ✅ Traefik | ❌ None |
| **Setup Complexity** | ❌ High | ✅ Zero |
| **Platform Support** | ⚠️ Limited | ✅ All platforms |
| **Configuration** | ❌ Hosts file, certs, socket | ✅ None required |
| **Browser Warnings** | ⚠️ Yes (self-signed) | ✅ No |
| **Production-like** | ✅ Yes | ❌ No |
| **Recommended For** | Advanced users, Traefik learning | Everyone else |

---

## When to Use This Setup

**Use Advanced Setup If:**
- You specifically need HTTPS locally
- You're learning Traefik for production use
- You're testing production-like routing
- You're comfortable with certificates and networking
- You're on Linux or macOS with Docker

**Use Simple Setup If:**
- You just want to test the application
- You're new to the project
- You're on Windows
- You want zero configuration
- You value simplicity over production-similarity
- You're using this for a home library (most users!)

---

## Additional Resources

- [Deployment Options Comparison](deployment_options.md)
- [Platform-Specific Troubleshooting](troubleshooting_platforms.md)
- [Platform Compatibility Analysis](platform_compatibility_analysis.md)
- [Traefik Documentation](https://doc.traefik.io/traefik/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

---

## Need Help?

1. Check [troubleshooting guide](troubleshooting_platforms.md)
2. Try the [simple setup](../README.md#quick-start) instead
3. Open an issue with:
   - Your OS and version
   - Docker/Podman version
   - Complete error message
   - Steps you've tried

---

**Remember:** There's no shame in using `compose.dev.yml`! It's the recommended setup for 99% of users.
