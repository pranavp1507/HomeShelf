# Platform-Specific Troubleshooting

Common issues and solutions for different operating systems and container runtimes.

---

## Table of Contents

1. [Windows Issues](#windows-issues)
2. [macOS Issues](#macos-issues)
3. [Linux Issues](#linux-issues)
4. [Docker vs Podman](#docker-vs-podman)
5. [General Issues](#general-issues)

---

## Windows Issues

### Issue: Line Ending Errors ("file not found")

**Symptom:**
```
exec /bin/sh: exec format error
standard_init_linux.go:228: exec user process caused: no such file or directory
```

**Cause:** Shell scripts (`start.sh`, `backup.sh`) have Windows line endings (CRLF instead of LF).

**Solution:**

1. **Use `.editorconfig`** (already included in project):
   - Ensures LF endings for `.sh` files
   - Most editors support this automatically

2. **Convert manually if needed:**
   ```bash
   # In Git Bash or WSL
   dos2unix server/start.sh
   dos2unix server/backup.sh
   ```

3. **Configure Git to handle line endings:**
   ```bash
   git config --global core.autocrlf input
   ```

4. **Re-clone the repository** after configuring Git.

---

### Issue: Docker Desktop Not Starting

**Symptom:** "Docker Desktop failed to start"

**Solutions:**

1. **Enable WSL 2:**
   - Settings → Apps → Programs and Features → Turn Windows features on/off
   - Enable "Windows Subsystem for Linux"
   - Enable "Virtual Machine Platform"
   - Restart computer

2. **Update Docker Desktop** to latest version

3. **Reset Docker Desktop:**
   - Settings → Troubleshoot → Reset to factory defaults

---

### Issue: Port Already in Use

**Symptom:**
```
Error: bind: address already in use
```

**Solution:**

1. **Check what's using the port:**
   ```powershell
   netstat -ano | findstr :3000
   netstat -ano | findstr :3001
   netstat -ano | findstr :5432
   ```

2. **Kill the process:**
   ```powershell
   taskkill /PID <process_id> /F
   ```

3. **Or change ports in `compose.dev.yml`:**
   ```yaml
   ports:
     - "3002:3000"  # Changed from 3000
   ```

---

### Issue: Slow Performance

**Cause:** File watching in volumes can be slow on Windows.

**Solutions:**

1. **Use WSL 2 backend** (not Hyper-V) in Docker Desktop settings

2. **Clone repository inside WSL:**
   ```bash
   # In WSL terminal
   cd ~
   git clone https://github.com/user/mulampuzha-library.git
   cd mulampuzha-library
   docker-compose -f compose.dev.yml up
   ```

3. **Disable file watching** if not needed (edit package.json)

---

## macOS Issues

### Issue: Docker Desktop Resource Limits

**Symptom:** Containers crashing or slow performance.

**Solution:**

1. **Increase Docker Desktop resources:**
   - Docker Desktop → Settings → Resources
   - Increase CPUs to 4
   - Increase Memory to 4GB minimum

2. **Restart Docker Desktop**

---

### Issue: Port 5432 Already Used by Postgres.app

**Symptom:**
```
Error: bind: address already in use (port 5432)
```

**Solution:**

**Option 1: Stop local PostgreSQL**
```bash
brew services stop postgresql
# or
pg_ctl stop
```

**Option 2: Change port in compose**
```yaml
postgres:
  ports:
    - "5433:5432"  # Use different host port
```

Then update connection strings to use `localhost:5433`.

---

### Issue: Permission Denied on Volumes

**Symptom:**
```
Error: EACCES: permission denied
```

**Solution:**

1. **Allow Docker Desktop to access directories:**
   - System Preferences → Security & Privacy → Privacy → Files and Folders
   - Enable access for Docker Desktop

2. **Fix permissions:**
   ```bash
   chmod -R 755 server/uploads
   ```

---

## Linux Issues

### Issue: Permission Denied (Podman Rootless)

**Symptom:**
```
Error: permission denied
```

**Cause:** Running rootless Podman but volumes need specific permissions.

**Solution:**

1. **Use rootless Podman properly:**
   ```bash
   podman-compose -f compose.dev.yml up
   ```

2. **Fix volume permissions:**
   ```bash
   chmod -R 755 server/uploads
   podman unshare chown -R 0:0 server/uploads
   ```

3. **Or run Podman with sudo** (not recommended):
   ```bash
   sudo podman-compose -f compose.dev.yml up
   ```

---

### Issue: Podman Socket Not Found

**Symptom:**
```
Error: Cannot connect to Podman socket
```

**Solution:**

1. **Enable Podman socket:**
   ```bash
   systemctl --user enable --now podman.socket
   ```

2. **Verify socket exists:**
   ```bash
   ls -la /run/user/$(id -u)/podman/podman.sock
   ```

3. **For compose.dev.yml** this issue shouldn't occur (no Traefik)

---

### Issue: SELinux Blocking Volumes

**Symptom:**
```
Error: Permission denied (SELinux)
```

**Solution:**

1. **Add :Z flag to volumes in compose file:**
   ```yaml
   volumes:
     - ./server:/app:Z
   ```

2. **Or disable SELinux temporarily** (not recommended):
   ```bash
   sudo setenforce 0
   ```

3. **Proper solution - set SELinux context:**
   ```bash
   chcon -Rt svirt_sandbox_file_t server/
   ```

---

## Docker vs Podman

### Key Differences

| Feature | Docker | Podman |
|---------|--------|--------|
| Daemon | Yes | No (daemonless) |
| Root | Requires root (unless rootless mode) | Rootless by default |
| Socket | `/var/run/docker.sock` | `/run/podman/podman.sock` (rootful) or `/run/user/UID/podman/podman.sock` (rootless) |
| Compose | `docker-compose` or `docker compose` | `podman-compose` |
| Windows | Docker Desktop (WSL2 backend) | Podman Desktop or Podman Machine |
| macOS | Docker Desktop | Podman Desktop or Podman Machine |

### Switching Between Docker and Podman

The `compose.dev.yml` file works with both!

**For Docker:**
```bash
docker-compose -f compose.dev.yml up
```

**For Podman:**
```bash
podman-compose -f compose.dev.yml up
```

**Using Make (auto-detects):**
```bash
make dev
```

---

## General Issues

### Issue: Database Connection Failed

**Symptoms:**
- "ECONNREFUSED" errors
- "Connection timeout"
- Backend logs show DB errors

**Solutions:**

1. **Wait for database to start:**
   - PostgreSQL takes ~10 seconds to initialize
   - The `start.sh` script waits 10 seconds automatically

2. **Check if Postgres is running:**
   ```bash
   docker-compose -f compose.dev.yml ps
   # or
   podman-compose -f compose.dev.yml ps
   ```

3. **Check logs:**
   ```bash
   docker-compose -f compose.dev.yml logs postgres
   ```

4. **Manually test connection:**
   ```bash
   docker-compose -f compose.dev.yml exec postgres psql -U user -d library
   ```

---

### Issue: Can't Access Application

**Frontend loads but shows errors**

**Solutions:**

1. **Check if all services are running:**
   ```bash
   docker-compose -f compose.dev.yml ps
   ```

2. **Check backend is accessible:**
   ```bash
   curl http://localhost:3001/api/books
   ```

3. **Check browser console for errors** (F12)

4. **Verify environment variables:**
   ```bash
   # In client container
   docker-compose -f compose.dev.yml exec client env | grep VITE
   ```

---

### Issue: Changes Not Reflecting

**You made code changes but don't see them**

**Solutions:**

1. **For backend:** Restart is needed
   ```bash
   docker-compose -f compose.dev.yml restart server
   ```

2. **For frontend:** Should hot-reload automatically
   - If not, rebuild:
   ```bash
   docker-compose -f compose.dev.yml up --build client
   ```

3. **Clear browser cache** (Ctrl+Shift+R or Cmd+Shift+R)

---

### Issue: Out of Disk Space

**Symptom:**
```
Error: no space left on device
```

**Solution:**

1. **Clean up Docker/Podman:**
   ```bash
   # Docker
   docker system prune -a --volumes

   # Podman
   podman system prune -a --volumes
   ```

2. **Remove old images:**
   ```bash
   # Docker
   docker image prune -a

   # Podman
   podman image prune -a
   ```

---

### Issue: Build Fails

**Symptoms:**
- "npm install failed"
- "pnpm install failed"
- Dependency errors

**Solutions:**

1. **Clean build (remove node_modules):**
   ```bash
   docker-compose -f compose.dev.yml down -v
   docker-compose -f compose.dev.yml up --build
   ```

2. **Check internet connection**

3. **Try with --no-cache:**
   ```bash
   docker-compose -f compose.dev.yml build --no-cache
   ```

---

## Getting More Help

### Enable Debug Logs

**Docker:**
```bash
docker-compose -f compose.dev.yml --verbose up
```

**Podman:**
```bash
podman-compose -f compose.dev.yml up --log-level debug
```

### Check Container Logs

```bash
# All containers
docker-compose -f compose.dev.yml logs

# Specific service
docker-compose -f compose.dev.yml logs server

# Follow logs (live)
docker-compose -f compose.dev.yml logs -f
```

### Access Container Shell

```bash
# Backend
docker-compose -f compose.dev.yml exec server sh

# Frontend
docker-compose -f compose.dev.yml exec client sh

# Database
docker-compose -f compose.dev.yml exec postgres psql -U user -d library
```

---

## Still Having Issues?

1. Check [existing issues](https://github.com/yourusername/mulampuzha-library/issues)
2. Read the [compatibility analysis](platform_compatibility_analysis.md)
3. Open a new issue with:
   - Your OS and version
   - Docker/Podman version (`docker --version` or `podman --version`)
   - Complete error message
   - Steps to reproduce
