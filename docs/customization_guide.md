# Customization Guide

This guide explains how to customize HomeShelf for your own library, including branding, configuration, and deployment options.

---

## Understanding Branding Customization

**Important:** HomeShelf's branding (library name and logo) uses **build-time variables** that are compiled into the JavaScript bundle. Your customization options depend on your deployment method.

---

## Deployment Methods & Branding Options

### Option 1: Pre-built Images from GHCR (Easiest)

**File:** `compose.ghcr.yml`

**Branding:** Fixed as "HomeShelf" with default logo

**When to use:**
- Quick deployment without building
- Don't need custom branding
- Want automatic updates when pulling latest images

**Setup:**
```bash
cp .env.ghcr.example .env
# Edit .env with your configuration
docker-compose -f compose.ghcr.yml up -d
```

**Customizable via .env:**
- ✅ Ports (CLIENT_PORT, SERVER_PORT, POSTGRES_PORT)
- ✅ Database credentials
- ✅ JWT secret
- ✅ API keys (Google Books)
- ✅ Email/SMTP settings
- ❌ Library name and logo (fixed in pre-built image)

---

### Option 2: Local Build with Custom Branding (Recommended)

**Files:** `compose.yml` or `compose.dev.yml`

**Branding:** Fully customizable

**When to use:**
- Want custom library name and logo
- Building on your own hardware
- Need full control over the build

**Setup:**

1. **Clone the repository:**
   ```bash
   git clone https://github.com/pranavp1507/HomeShelf.git
   cd HomeShelf
   ```

2. **Copy environment template:**
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` with your configuration:**
   ```env
   # Required: Database and JWT
   POSTGRES_PASSWORD=your_secure_password
   JWT_SECRET=your_jwt_secret_min_32_chars  # Generate with: openssl rand -hex 32

   # Optional: Customize branding
   VITE_LIBRARY_NAME=My Personal Library
   VITE_LIBRARY_LOGO=/my-logo.svg

   # Optional: Custom hostname for Traefik (if using compose.yml)
   TRAEFIK_HOST=homelib.local
   ```

4. **Add your logo file (if customizing):**
   ```bash
   # Place your logo in the client public folder
   cp /path/to/your/logo.svg client/public/my-logo.svg
   ```

5. **Choose deployment method:**

   **Option A: Simple Development (HTTP, no certificates needed)**
   ```bash
   docker-compose -f compose.dev.yml up --build
   # Access: http://localhost:3000
   ```

   **Option B: Production with HTTPS (requires certificates)**

   a. Generate self-signed certificates:
   ```bash
   mkdir -p traefik/certs
   openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
     -keyout traefik/certs/key.pem \
     -out traefik/certs/cert.pem \
     -subj "/CN=homelib.local"
   ```

   b. Add hostname to your hosts file:
   ```bash
   # Linux/Mac
   echo "127.0.0.1  homelib.local" | sudo tee -a /etc/hosts

   # Windows (run as Administrator in PowerShell)
   Add-Content C:\Windows\System32\drivers\etc\hosts "127.0.0.1  homelib.local"
   ```

   c. Start with Traefik:
   ```bash
   docker-compose -f compose.yml up --build -d
   # Access: https://homelib.local (accept browser warning for self-signed cert)
   ```

**Customizable via .env:**
- ✅ Library name and logo (build-time)
- ✅ All options from Option 1

---

### Option 3: Fork and Build Your Own Images

**When to use:**
- Want custom branding with pre-built images
- Deploying to multiple servers
- Want automatic builds via GitHub Actions

**Setup:**

1. **Fork the repository** on GitHub

2. **Set repository variables** (Settings → Secrets and variables → Actions):
   - Name: `VITE_LIBRARY_NAME`
     Value: `My Library`
   - Name: `VITE_LIBRARY_LOGO`
     Value: `/my-logo.svg`

3. **Add your logo to the repository:**
   ```bash
   git clone https://github.com/yourusername/HomeShelf.git
   cd HomeShelf
   cp /path/to/your/logo.svg client/public/my-logo.svg
   git add client/public/my-logo.svg
   git commit -m "Add custom logo"
   git push
   ```

4. **Update compose.ghcr.yml** to use your images:
   ```yaml
   services:
     server:
       image: ghcr.io/yourusername/homeshelf-server:latest
     client:
       image: ghcr.io/yourusername/homeshelf-client:latest
   ```

5. **Make packages public** (if you want them accessible without login):
   - Go to your package page on GitHub
   - Package settings → Change visibility → Public

6. **Deploy with your custom images:**
   ```bash
   docker-compose -f compose.ghcr.yml up -d
   ```

---

## Logo File Formats and Requirements

### Supported Formats
- SVG (recommended - scales to any size)
- PNG (good for raster graphics)
- JPG (use only if necessary)
- WebP (modern format, smaller file size)

### Recommendations
- **Size:** 200x200 pixels minimum for PNG/JPG
- **Aspect ratio:** Square or rectangular (max 3:1 ratio)
- **File size:** Under 100KB for best performance
- **Transparency:** Use PNG or SVG for transparent backgrounds

### Logo Placement Options

**Local file (recommended):**
```env
VITE_LIBRARY_LOGO=/Logo.svg
```
- Place logo in `client/public/` directory
- Include in Docker builds automatically

**External URL:**
```env
VITE_LIBRARY_LOGO=https://your-domain.com/logo.png
```
- Hosted elsewhere (CDN, website, etc.)
- Must be publicly accessible
- Consider CORS and SSL

---

## Port Configuration

### Checking Port Availability

Before changing ports, verify they're not already in use:

**Windows:**
```cmd
netstat -ano | findstr :3000
netstat -ano | findstr :3001
netstat -ano | findstr :5432
```

**Linux/macOS:**
```bash
lsof -i :3000
lsof -i :3001
lsof -i :5432
# Or use:
netstat -tuln | grep :3000
```

### Changing Ports

All deployment methods support custom ports via `.env`:

```env
# Client web interface (default: 3000)
CLIENT_PORT=8080

# Server API (default: 3001)
SERVER_PORT=8081

# PostgreSQL database (default: 5432)
POSTGRES_PORT=5433
```

**Important for GHCR images:**
- `CLIENT_PORT` and `SERVER_PORT` only change the **host-side** port
- Containers internally still use ports 3000 and 3001
- This is necessary because pre-built images have fixed internal ports

---

## Example Configurations

### Home Library
```env
VITE_LIBRARY_NAME=Smith Family Library
VITE_LIBRARY_LOGO=/smith-crest.svg

CLIENT_PORT=3000
SERVER_PORT=3001
POSTGRES_PORT=5432
```

### Book Club
```env
VITE_LIBRARY_NAME=Downtown Book Club
VITE_LIBRARY_LOGO=/bookclub-icon.png

CLIENT_PORT=3000
SERVER_PORT=3001
```

### Community Library
```env
VITE_LIBRARY_NAME=Riverside Community Library
VITE_LIBRARY_LOGO=https://riverside.org/logo.svg

CLIENT_PORT=8080
SERVER_PORT=8081
POSTGRES_PORT=5433
```

---

## Advanced Customization

### Changing the Page Title

1. Open `client/index.html`
2. Update the `<title>` tag:
   ```html
   <title>My Library Management System</title>
   ```
3. Rebuild the client (for Docker deployments)

### Adding More Branding Options

You can extend the configuration system:

1. **Update `client/src/config.ts`:**
   ```typescript
   export const config = {
     apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
     libraryName: import.meta.env.VITE_LIBRARY_NAME || 'HomeShelf',
     libraryLogo: import.meta.env.VITE_LIBRARY_LOGO || '/Logo.svg',

     // Add your own:
     libraryTagline: import.meta.env.VITE_LIBRARY_TAGLINE || '',
     libraryAddress: import.meta.env.VITE_LIBRARY_ADDRESS || '',
     libraryContact: import.meta.env.VITE_LIBRARY_CONTACT || '',
   } as const;
   ```

2. **Update your `.env`:**
   ```env
   VITE_LIBRARY_TAGLINE=Where stories come alive
   VITE_LIBRARY_ADDRESS=123 Main St, Your City
   VITE_LIBRARY_CONTACT=contact@yourlibrary.com
   ```

3. **Use in components:**
   ```typescript
   import { config } from './config';

   <p>{config.libraryTagline}</p>
   ```

4. **Rebuild for changes to take effect**

---

## Environment Variables Reference

### Build-time Variables (Vite)
These are compiled into the JavaScript bundle and cannot be changed after building:

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_LIBRARY_NAME` | HomeShelf | Library name shown in UI |
| `VITE_LIBRARY_LOGO` | /Logo.svg | Logo path or URL |

### Runtime Variables
These can be changed without rebuilding:

| Variable | Default | Description |
|----------|---------|-------------|
| `CLIENT_PORT` | 3000 | Host port for web interface |
| `SERVER_PORT` | 3001 | Host port for API server |
| `POSTGRES_PORT` | 5432 | Host port for database |
| `POSTGRES_USER` | library_user | Database username |
| `POSTGRES_PASSWORD` | *required* | Database password |
| `JWT_SECRET` | *required* | JWT signing key |
| `GOOGLE_BOOKS_API_KEY` | *(optional)* | Google Books API key |
| `NODE_ENV` | production | Server environment |
| `CLIENT_URL` | http://localhost:3000 | CORS origin |

See `.env.example` or `.env.ghcr.example` for complete lists.

---

## Troubleshooting

### Branding Changes Not Appearing

**Pre-built images (compose.ghcr.yml):**
- Branding is fixed in pre-built images
- Switch to local build or fork to customize

**Local build:**
- Did you run `docker-compose up --build`?
- Check that variables are in `.env` at project root
- Variables must start with `VITE_` for client-side use
- Clear browser cache (Ctrl+Shift+Delete)

### Logo Not Showing

1. **Check file exists:**
   ```bash
   ls -l client/public/my-logo.svg
   ```

2. **Check path in .env matches filename exactly:**
   ```env
   # Path should start with / and match filename
   VITE_LIBRARY_LOGO=/my-logo.svg
   ```

3. **Check browser console for 404 errors** (F12 → Console tab)

4. **For external URLs:**
   - Verify URL is accessible: `curl -I https://example.com/logo.png`
   - Check CORS headers allow your domain
   - Use HTTPS if your site uses HTTPS

### Port Already in Use

1. **Check what's using the port:**
   ```bash
   # Windows
   netstat -ano | findstr :3000

   # Linux/macOS
   lsof -i :3000
   ```

2. **Options:**
   - Stop the conflicting process
   - Change to a different port in `.env`

### Database Connection Errors

1. **Check database is running:**
   ```bash
   docker-compose ps
   ```

2. **Check credentials in `.env` match everywhere:**
   - `POSTGRES_USER` and `POSTGRES_PASSWORD` must match
   - `DATABASE_URL` must use same credentials

3. **Reset database (destructive):**
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

---

## Need Help?

If you encounter issues:

1. **Check logs:**
   ```bash
   docker-compose logs client
   docker-compose logs server
   docker-compose logs postgres
   ```

2. **Review documentation:**
   - [Main README](../README.md)
   - [Deployment Options](./deployment_options.md)
   - [Troubleshooting Guide](./troubleshooting_platforms.md)

3. **Open an issue on GitHub** with:
   - Your deployment method (GHCR/local build/fork)
   - Environment file (redact secrets)
   - Error messages from logs
   - Docker version: `docker --version`
