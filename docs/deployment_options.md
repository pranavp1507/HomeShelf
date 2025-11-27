# Deployment Options Comparison

Choose the right deployment method for your needs.

---

## Quick Decision Guide

**Just want to test the app?**
→ Use `compose.dev.yml` ✅

**Setting up for your home library?**
→ Use `compose.dev.yml` ✅

**Want HTTPS locally?**
→ Use `compose.yml` (advanced)

**Deploying to a server?**
→ Use `compose.prod.yml`

---

## Detailed Comparison

### Option 1: Simple Development (`compose.dev.yml`) ⭐ RECOMMENDED

**Best for:**
- Testing the application
- Local development
- Contributing to the project
- First-time users
- Home libraries on local network

**Command:**
```bash
docker-compose -f compose.dev.yml up
# or
make dev
```

**Access:**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001/api
- Database: localhost:5432

**Pros:**
- ✅ Works everywhere (Windows, Mac, Linux)
- ✅ Works with Docker AND Podman
- ✅ No configuration required
- ✅ No hosts file modification
- ✅ No certificate generation
- ✅ Simple HTTP (no SSL complexity)
- ✅ Ports exposed directly
- ✅ Fast startup

**Cons:**
- ❌ HTTP only (no HTTPS)
- ❌ No reverse proxy
- ❌ Less production-like

**When to use:**
- 99% of users should start here
- Use this for your home library if on local network
- Use this for development and testing

---

### Option 2: Advanced with Traefik (`compose.yml`)

**Best for:**
- Advanced users who want HTTPS locally
- Testing production-like setup
- Learning Traefik
- Multi-service development

**Command:**
```bash
docker-compose up
# or
make advanced
```

**Access:**
- Frontend: https://local.test
- Backend: https://local.test/api
- Traefik Dashboard: http://localhost:8080

**Requires:**
1. ⚠️ Modify hosts file: Add `127.0.0.1 local.test`
2. ⚠️ Generate SSL certificates in `traefik/certs/`
3. ⚠️ Configure container socket (Podman/Docker specific)

**Pros:**
- ✅ HTTPS with self-signed certificates
- ✅ Traefik reverse proxy (like production)
- ✅ Single domain for frontend and backend
- ✅ Traefik dashboard for monitoring

**Cons:**
- ❌ Complex setup
- ❌ Platform-specific (socket paths differ)
- ❌ Browser warnings (self-signed certs)
- ❌ Requires manual configuration
- ❌ May not work on Windows easily

**When to use:**
- Only if you specifically need HTTPS locally
- Only if you're comfortable with Traefik
- Not recommended for first-time users

---

### Option 3: Production (`compose.prod.yml`)

**Best for:**
- Production servers
- VPS/cloud deployments
- Public-facing instances

**Command:**
```bash
docker-compose -f compose.prod.yml up -d
# or
make prod
```

**Access:**
- Your domain (e.g., https://library.yourdomain.com)

**Requires:**
1. ⚠️ A real domain name
2. ⚠️ DNS pointing to your server
3. ⚠️ Server with Docker installed
4. ⚠️ Ports 80/443 open
5. ⚠️ Configure domain in compose file

**Pros:**
- ✅ Let's Encrypt SSL (free, automatic)
- ✅ Production-ready
- ✅ Automatic certificate renewal
- ✅ Optimized for servers

**Cons:**
- ❌ Requires a domain
- ❌ Requires public server
- ❌ Not for local development

**When to use:**
- Deploying to a real server
- Making your library accessible from internet
- Professional/organizational use

---

## Setup Instructions by Option

### Setup: compose.dev.yml (Simple) ⭐

**Step 1:** Clone repository
```bash
git clone https://github.com/user/mulampuzha-library.git
cd mulampuzha-library
```

**Step 2:** (Optional) Customize
```bash
# Edit client/.env
VITE_LIBRARY_NAME=My Library
```

**Step 3:** Start
```bash
docker-compose -f compose.dev.yml up --build
```

**Step 4:** Access
- Open http://localhost:3000
- Create admin account
- Done!

---

### Setup: compose.yml (Advanced with Traefik)

**Step 1:** Clone repository
```bash
git clone https://github.com/user/mulampuzha-library.git
cd mulampuzha-library
```

**Step 2:** Modify hosts file

**Linux/Mac:**
```bash
echo "127.0.0.1 local.test" | sudo tee -a /etc/hosts
```

**Windows (as Administrator):**
```powershell
Add-Content C:\Windows\System32\drivers\etc\hosts "127.0.0.1 local.test"
```

**Step 3:** Generate SSL certificates
```bash
mkdir -p traefik/certs
cd traefik/certs

# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes \
  -subj "/CN=local.test"

cd ../..
```

**Step 4:** Check socket path

**For Docker:**
```bash
# Verify socket exists
ls -la /var/run/docker.sock

# Edit compose.yml if needed (line 72):
# - /var/run/docker.sock:/var/run/docker.sock:ro
```

**For Podman:**
```bash
# Verify socket exists
ls -la /run/podman/podman.sock

# Socket path should already be correct in compose.yml
```

**For Windows with Docker Desktop:**
This setup may not work easily. Use `compose.dev.yml` instead.

**Step 5:** Start
```bash
docker-compose up --build
```

**Step 6:** Access
- Open https://local.test (accept browser warning)
- Create admin account
- Done!

---

### Setup: compose.prod.yml (Production)

See [Production Deployment Guide](../README.md#deployment) for full instructions.

**Quick overview:**
1. Get a VPS (DigitalOcean, AWS, etc.)
2. Point your domain to the server IP
3. Install Docker on server
4. Clone repository
5. Edit `compose.prod.yml` with your domain
6. Start: `docker-compose -f compose.prod.yml up -d`

---

## Switching Between Options

### From compose.dev.yml to compose.yml

```bash
# Stop dev environment
docker-compose -f compose.dev.yml down

# Set up hosts file and certificates (see above)

# Start advanced environment
docker-compose up
```

### From compose.yml to compose.dev.yml

```bash
# Stop advanced environment
docker-compose down

# Start simple environment (no setup needed)
docker-compose -f compose.dev.yml up
```

### To Production

```bash
# On your local machine, build images
docker-compose -f compose.prod.yml build

# Tag and push to Docker Hub (optional)
docker tag mulampuzha-library_server:latest yourusername/library-server:latest
docker push yourusername/library-server:latest

# On production server
git clone https://github.com/user/mulampuzha-library.git
cd mulampuzha-library

# Edit compose.prod.yml with your domain
nano compose.prod.yml

# Start
docker-compose -f compose.prod.yml up -d
```

---

## Platform Compatibility Matrix

| Setup | Windows + Docker | Windows + Podman | Mac + Docker | Mac + Podman | Linux + Docker | Linux + Podman |
|-------|------------------|------------------|--------------|--------------|----------------|----------------|
| **compose.dev.yml** | ✅ Works | ✅ Works | ✅ Works | ✅ Works | ✅ Works | ✅ Works |
| **compose.yml** | ⚠️ Difficult | ❌ Complex | ✅ Works | ⚠️ Tricky | ✅ Works | ✅ Works |
| **compose.prod.yml** | N/A (server only) | N/A | N/A | N/A | ✅ Works | ✅ Works |

Legend:
- ✅ Works - Should work out of the box
- ⚠️ Tricky - Requires extra configuration
- ❌ Complex - Not recommended, use alternatives
- N/A - Not applicable for this use case

---

## Troubleshooting

### compose.dev.yml Issues

See [Troubleshooting Platforms Guide](troubleshooting_platforms.md)

Common fixes:
- Port conflicts: Change ports in compose file
- Permission errors: Fix file permissions
- Build failures: Run with `--no-cache`

### compose.yml Issues

**"Cannot connect to Docker socket"**
- Check socket path in compose.yml line 72
- Verify socket exists: `ls -la /var/run/docker.sock` or similar
- May need to use `compose.dev.yml` instead

**Browser shows "Your connection is not private"**
- This is expected with self-signed certificates
- Click "Advanced" → "Proceed to local.test"
- Or install certificate in system trust store

**"local.test not found"**
- Check hosts file has the entry
- Try `ping local.test` to verify

### compose.prod.yml Issues

**Let's Encrypt certificate failed**
- Verify DNS is pointing to server
- Check ports 80 and 443 are open
- Check email in compose.prod.yml is valid
- May need to wait for DNS propagation (up to 24 hours)

---

## Recommendations by Use Case

### Home Library (Local Network Only)
→ Use `compose.dev.yml`
- Simple, no HTTPS needed
- Access via http://your-computer-ip:3000

### Home Library (Internet Accessible)
→ Use `compose.prod.yml`
- Get a cheap domain ($10/year)
- Use Dynamic DNS if no static IP
- Let's Encrypt provides free SSL

### Development/Contributing
→ Use `compose.dev.yml`
- Fast iteration
- No complexity
- Works everywhere

### Learning Traefik/Reverse Proxies
→ Use `compose.yml`
- Good learning experience
- Production-like locally
- But expect some setup challenges

---

## Still Unsure?

**Start with `compose.dev.yml`**

It works everywhere, requires zero configuration, and is perfect for:
- Testing the application
- Using as a home library
- Contributing to the project
- Learning the codebase

You can always switch to more advanced setups later!
