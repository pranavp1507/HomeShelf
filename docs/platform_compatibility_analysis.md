# Platform Compatibility Analysis

**Date:** 2025-11-23
**Issue:** Current setup may not work on all systems
**Impact:** High - Prevents users from testing and contributing

---

## Current Issues Identified

### 🔴 Critical: Podman Socket Hardcoded

**Location:** `compose.yml:62,72`

```yaml
- --providers.docker.endpoint=unix:///run/podman/podman.sock
volumes:
  - /run/podman/podman.sock:/run/podman/podman.sock:ro
```

**Problems:**

- ❌ **Linux with Podman**: `/run/podman/podman.sock` (current setup)
- ❌ **Linux with Docker**: `/var/run/docker.sock`
- ❌ **Windows with Docker Desktop**: `//./pipe/docker_engine` or `npipe:////./pipe/docker_engine`
- ❌ **Windows with Podman**: Requires WSL2, path is `\\wsl$\podman-machine-default\run\podman\podman.sock`
- ❌ **macOS with Docker Desktop**: `/var/run/docker.sock`
- ❌ **macOS with Podman**: Different path in Podman machine

**Impact:** Traefik cannot start on systems that don't match the hardcoded path.

---

### 🟠 High: Traefik Complexity for Local Development

**Problems:**

1. **HTTPS Setup Required**:

   - Needs self-signed certificates in `traefik/certs/`
   - No documentation on generating these
   - Browser security warnings

2. **Hosts File Modification**:

   - Requires adding `127.0.0.1 local.test` to `/etc/hosts` (Linux/Mac) or `C:\Windows\System32\drivers\etc\hosts` (Windows)
   - Needs admin/root privileges
   - Not documented in README

3. **Complex for Testing**:
   - New contributors can't just run `docker-compose up`
   - Multiple manual steps required
   - High barrier to entry

---

### 🟠 High: No Fallback for Docker Users

**Problem:** Project uses "Podman" terminology and socket paths

**Impact:**

- Docker is more common on Windows (90%+ of container users)
- Podman users are primarily Linux users
- Project appears Podman-only, discouraging Docker users

**Reality:** Both should work, but documentation and config are Podman-specific.

---

### 🟡 Medium: Environment Differences

**Current Issues:**

1. **Port Conflicts**:

   - Port 443, 5432 may be in use
   - No easy way to change ports

2. **Volume Paths**:

   - Windows paths with backslashes
   - WSL2 path translation issues

3. **Line Endings**:
   - Shell scripts (`start.sh`, `backup.sh`) may have Windows line endings (CRLF)
   - Causes "file not found" errors in containers

---

## Recommended Solutions

### Solution 1: Simple Development Setup (RECOMMENDED)

Create `compose.dev.yml` - A simple, cross-platform development setup:

**Features:**

- ✅ No Traefik (direct port exposure)
- ✅ HTTP only (no certificates needed)
- ✅ No hosts file modification
- ✅ Works with Docker AND Podman
- ✅ Zero configuration required

**Usage:**

```bash
docker-compose -f compose.dev.yml up
# or
podman-compose -f compose.dev.yml up
```

**Access:**

- Frontend: <http://localhost:3000>
- Backend API: <http://localhost:3001>
- Database: localhost:5432

---

### Solution 2: Auto-Detect Container Runtime

Use environment variables to select the correct socket:

```yaml
# In compose.yml
volumes:
  - ${CONTAINER_SOCKET:-/var/run/docker.sock}:/var/run/docker.sock:ro
```

Then users set:

```bash
# For Docker (Linux/Mac)
export CONTAINER_SOCKET=/var/run/docker.sock

# For Podman (Linux)
export CONTAINER_SOCKET=/run/podman/podman.sock

# For Windows Docker Desktop
export CONTAINER_SOCKET=//./pipe/docker_engine
```

**Downside:** Still requires user configuration.

---

### Solution 3: Multiple Compose Files

Provide pre-configured files for different scenarios:

```text
compose.dev.yml          # Simple local development (RECOMMENDED FOR TESTING)
compose.docker.yml       # With Traefik using Docker socket
compose.podman.yml       # With Traefik using Podman socket
compose.prod.yml         # Production with Let's Encrypt
```

Users choose based on their setup.

---

### Solution 4: Makefile Shortcuts

Create a `Makefile` with platform detection:

```makefile
# Detect OS and container runtime
UNAME := $(shell uname -s)
DOCKER := $(shell which docker 2>/dev/null)
PODMAN := $(shell which podman 2>/dev/null)

dev:
 @docker-compose -f compose.dev.yml up

dev-build:
 @docker-compose -f compose.dev.yml up --build

prod:
 @docker-compose -f compose.prod.yml up -d
```

**Usage:**

```bash
make dev           # Start development environment
make dev-build     # Rebuild and start
```

---

## Comparison Matrix

| Setup                  | Platforms          | Complexity | HTTPS               | Use Case                                  |
| ---------------------- | ------------------ | ---------- | ------------------- | ----------------------------------------- |
| **compose.dev.yml**    | All                | Low        | No                  | Local testing, development, contributions |
| **compose.docker.yml** | Docker systems     | Medium     | Yes                 | Advanced local dev with HTTPS             |
| **compose.podman.yml** | Podman systems     | Medium     | Yes                 | Advanced local dev with HTTPS             |
| **compose.prod.yml**   | Production servers | High       | Yes (Let's Encrypt) | Production deployment                     |

---

## Recommended Implementation Plan

### Phase 1: Quick Fix (Immediate)

1. **Create `compose.dev.yml`** - Simple, no Traefik
2. **Update README.md** - Show simple path first
3. **Add `.editorconfig`** - Prevent line ending issues
4. **Test on Windows/Mac/Linux**

### Phase 2: Better Docs (Short Term)

1. **Create `docs/docker_vs_podman.md`** - Explain differences
2. **Update installation instructions** - Platform-specific
3. **Add troubleshooting guide** - Common issues
4. **CI/CD to test on multiple platforms**

### Phase 3: Polish (Long Term)

1. **Makefile for convenience**
2. **Setup script** to auto-detect and configure
3. **Docker Desktop extensions** (if applicable)

---

## Testing Matrix

To ensure cross-platform compatibility, test on:

| OS           | Container Runtime | Expected Result                  |
| ------------ | ----------------- | -------------------------------- |
| Ubuntu 22.04 | Docker            | ✅ Should work                   |
| Ubuntu 22.04 | Podman            | ✅ Should work                   |
| Windows 11   | Docker Desktop    | ❌ Currently fails (socket path) |
| Windows 11   | Podman Desktop    | ❌ Currently fails (socket path) |
| macOS        | Docker Desktop    | ❌ Currently fails (socket path) |
| macOS        | Podman Desktop    | ❌ Currently fails (socket path) |

**With compose.dev.yml:**

| OS           | Container Runtime | Expected Result |
| ------------ | ----------------- | --------------- |
| Ubuntu 22.04 | Docker            | ✅ Should work  |
| Ubuntu 22.04 | Podman            | ✅ Should work  |
| Windows 11   | Docker Desktop    | ✅ Should work  |
| Windows 11   | Podman Desktop    | ✅ Should work  |
| macOS        | Docker Desktop    | ✅ Should work  |
| macOS        | Podman Desktop    | ✅ Should work  |

---

## Technical Details

### Why Traefik Fails on Different Systems

Traefik needs access to the container runtime socket to:

1. Discover running containers
2. Read labels for routing configuration
3. Update routes dynamically

**The socket path is platform and runtime specific:**

```text
Linux + Docker:    /var/run/docker.sock
Linux + Podman:    /run/podman/podman.sock
                   (or /run/user/1000/podman/podman.sock for rootless)

Windows + Docker:  npipe:////./pipe/docker_engine
                   (or //./pipe/docker_engine)

macOS + Docker:    /var/run/docker.sock
                   (inside Docker VM)
```

**Solution:** For local development, skip Traefik entirely and expose ports directly.

---

## Recommendations Summary

### For New Users / Contributors (Top Priority)

**Create `compose.dev.yml`** with this structure:

- Direct port exposure (no reverse proxy)
- HTTP only (no certificates)
- Works everywhere (Docker/Podman, all OS)
- Zero configuration

### For Advanced Users

Keep `compose.yml` for those who want:

- HTTPS locally
- Traefik routing
- Production-like environment

But **document the requirements** clearly.

### For Production

`compose.prod.yml` is fine as-is but:

- Clarify it's for production only
- Docker socket is standard on servers
- Let's Encrypt handles certificates

---

## Immediate Action Items

1. ✅ Create `compose.dev.yml` (simple setup)
2. ✅ Create `.editorconfig` (prevent line ending issues)
3. ✅ Update README with "Quick Start" using dev setup
4. ✅ Move advanced Traefik setup to separate documentation
5. ✅ Add platform compatibility notes
6. ✅ Test on Windows with Docker Desktop

---

## Long-term Vision

**Goal:** Anyone on any platform can run:

```bash
git clone https://github.com/user/mulampuzha-library.git
cd mulampuzha-library
docker-compose up
```

And have it work immediately.

**Advanced users** can opt into Traefik/HTTPS if they want.

---

## Questions for Discussion

1. Should we keep `compose.yml` with Traefik as default, or make it `compose.advanced.yml`?
2. Should we rename the project to be "Docker/Podman" instead of "Podman-first"?
3. Should we provide a setup script to auto-generate certificates for local HTTPS?
4. Should we support Podman as the primary runtime or Docker?

**My Opinion:**

- Default to simplicity (compose.dev.yml with Docker)
- Support both Docker and Podman
- Make Traefik optional for advanced users
- Prioritize "works everywhere" over "production-like locally"
