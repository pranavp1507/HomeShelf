# Customization Guide

This guide explains how to customize the Mulampuzha Library Management System for your own library.

---

## Library Name and Logo

### Step 1: Configure Environment Variables

1. Navigate to the `client` directory
2. Open the `.env` file (or create it from `.env.example`)
3. Update the following variables:

```env
# Change this to your library's name
VITE_LIBRARY_NAME=My Library

# Path to your logo file (relative to the public directory)
VITE_LIBRARY_LOGO=/Logo.svg
```

### Step 2: Replace the Logo File

**Option A: Replace the existing logo**
1. Create your logo as an SVG or PNG file
2. Name it `Logo.svg` (or your preferred name)
3. Place it in `client/public/`
4. If you use a different filename, update `VITE_LIBRARY_LOGO` in `.env`

**Option B: Use a different format**
1. Place your logo (PNG, JPG, etc.) in `client/public/`
2. Update `.env`:
   ```env
   VITE_LIBRARY_LOGO=/MyLibraryLogo.png
   ```

### Step 3: Update the Favicon (Optional)

The favicon (browser tab icon) is also located at `client/public/Logo.svg`. You can replace this file with your own icon.

For better browser support, you can also provide multiple formats:
1. Place `favicon.ico` in `client/public/`
2. Update `client/index.html` to reference it:
   ```html
   <link rel="icon" type="image/x-icon" href="/favicon.ico" />
   ```

### Step 4: Restart the Application

After making changes:

**If using Docker:**
```bash
docker-compose down
docker-compose up --build
```

**If running locally:**
```bash
# Stop the dev server (Ctrl+C)
# Restart it
cd client
pnpm run dev
```

---

## Example Configurations

### Home Library Example
```env
VITE_LIBRARY_NAME=Smith Family Library
VITE_LIBRARY_LOGO=/smith-logo.svg
```

### Book Club Example
```env
VITE_LIBRARY_NAME=Downtown Book Club
VITE_LIBRARY_LOGO=/bookclub-icon.png
```

### Community Library Example
```env
VITE_LIBRARY_NAME=Riverside Community Library
VITE_LIBRARY_LOGO=/riverside-logo.svg
```

---

## Advanced Customization

### Changing the Page Title

The page title appears in the browser tab. To customize it:

1. Open `client/index.html`
2. Find the `<title>` tag (line 7)
3. Change it to your preferred title:
   ```html
   <title>My Library Management System</title>
   ```

### Dynamic Title Based on Library Name

For a more dynamic approach, you can set the title programmatically:

1. Open `client/src/main.tsx`
2. Add this line after the imports:
   ```typescript
   import { config } from './config';
   document.title = config.libraryName;
   ```

### Adding More Branding

You can extend the `config.ts` file to add more customization options:

```typescript
export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  libraryName: import.meta.env.VITE_LIBRARY_NAME || 'My Library',
  libraryLogo: import.meta.env.VITE_LIBRARY_LOGO || '/Logo.svg',

  // Add your own:
  libraryTagline: import.meta.env.VITE_LIBRARY_TAGLINE || 'Manage your books with ease',
  libraryAddress: import.meta.env.VITE_LIBRARY_ADDRESS || '',
  libraryContact: import.meta.env.VITE_LIBRARY_CONTACT || '',
} as const;
```

Then add these to your `.env`:
```env
VITE_LIBRARY_TAGLINE=Where stories come alive
VITE_LIBRARY_ADDRESS=123 Main St, Your City
VITE_LIBRARY_CONTACT=contact@yourlibrary.com
```

---

## Theming and Colors

See the [Material UI Theming Guide](./mui_theming_guide.md) (coming soon) for information on customizing colors and appearance.

---

## Troubleshooting

### Changes not appearing?
- Make sure you've restarted the development server
- Clear your browser cache (Ctrl+Shift+Delete)
- Check the browser console for errors

### Logo not showing?
- Verify the file exists in `client/public/`
- Check that the path in `.env` matches the filename exactly
- Check the browser console for 404 errors

### Environment variables not working?
- Environment variable names must start with `VITE_`
- Make sure `.env` is in the `client` directory (not the root)
- Restart the dev server after changing `.env`

---

## Need Help?

If you encounter issues:
1. Check the [main README](../README.md)
2. Review the [issues and gaps document](./issues_and_gaps.md)
3. Open an issue on GitHub with details about your problem
