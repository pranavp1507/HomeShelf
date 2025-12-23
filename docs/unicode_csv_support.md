# Unicode (Malayalam & Other Languages) CSV Support

HomeShelf fully supports Unicode characters including Malayalam, Hindi, Tamil, and other languages in CSV imports and exports.

## CSV Import Support

### How It Works

The CSV import functionality uses the `csv-parse` library with the following configuration:

```javascript
parse(file.buffer, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
  bom: true, // ✅ Handles UTF-8 BOM automatically
  relax_column_count: true,
  skip_records_with_error: true,
})
```

The key setting is `bom: true`, which automatically detects and handles UTF-8 Byte Order Mark (BOM). This ensures proper encoding detection for files created in Excel or other editors.

### Creating Malayalam/Unicode CSV Files

#### Method 1: Excel (Recommended)
1. Create your spreadsheet in Excel
2. Add Malayalam or other Unicode text in columns
3. Save As → **CSV UTF-8 (Comma delimited) (*.csv)**
   - ⚠️ Do NOT use regular "CSV (Comma delimited)" - this doesn't preserve Unicode!

#### Method 2: Google Sheets
1. Create your spreadsheet in Google Sheets
2. Add Malayalam text
3. File → Download → Comma Separated Values (.csv)
   - Google Sheets automatically exports as UTF-8

#### Method 3: LibreOffice Calc
1. Create your spreadsheet in LibreOffice Calc
2. Add Malayalam or other Unicode text in columns
3. File → Save As
4. File type: **Text CSV (.csv)**
5. In the export dialog:
   - Character set: **Unicode (UTF-8)**
   - Check "Edit filter settings"
   - Click OK
   - Field delimiter: `,` (comma)
   - Text delimiter: `"` (quote)
   - Check "Quote all text cells" for maximum compatibility
   - Click OK
6. ✅ LibreOffice Calc automatically exports with proper UTF-8 encoding

#### Method 4: Text Editor
1. Use a UTF-8 capable editor (VS Code, Notepad++, Sublime Text)
2. Create CSV file with Malayalam text
3. Save with encoding: **UTF-8 with BOM**
   - In VS Code: Click encoding in bottom right → "Save with Encoding" → "UTF-8 with BOM"
   - In Notepad++: Encoding → "Encode in UTF-8-BOM"

### CSV Format for Books

```csv
title,author,isbn,categories,cover_image_url,description
പുസ്തകം,രചയിതാവ്,978-0-123456-78-9,കഥ; നോവൽ,https://example.com/cover.jpg,ഒരു മനോഹരമായ കഥ
മലയാളം പുസ്തകം,എം.ടി വാസുദേവൻ നായർ,978-1-234567-89-0,സാഹിത്യം,,മലയാള സാഹിത്യത്തിന്റെ മാസ്റ്റർപീസ്
```

### CSV Format for Members

```csv
name,email,phone
രാജേഷ് കുമാർ,rajesh@example.com,+91-9876543210
സുജാത കൃഷ്ണൻ,sujatha@example.com,+91-9876543211
```

## CSV Export Support

### How It Works

All CSV exports include:
1. **UTF-8 BOM** (`\uFEFF`) prepended to file content
2. **charset=utf-8** in Content-Type header

```javascript
const csvWithBOM = '\uFEFF' + csv;
res.setHeader('Content-Type', 'text/csv; charset=utf-8');
```

This ensures:
- Excel opens files with correct encoding automatically
- All Unicode characters display properly
- Round-trip import/export works seamlessly

### Export Endpoints

All export endpoints support Unicode:
- `GET /api/export/books` - Export books with Malayalam titles/authors
- `GET /api/export/members` - Export members with Malayalam names
- `GET /api/export/loans` - Export loan history with Unicode data

### Opening Exported Files

1. **Excel**: Double-click the exported CSV file
   - Excel automatically detects UTF-8 BOM and displays Unicode correctly

2. **LibreOffice Calc**: Open → Select CSV file
   - In the import dialog, select:
     - Character set: **Unicode (UTF-8)**
     - Field delimiter: `,` (comma)
     - Text delimiter: `"` (quote)
   - Click OK
   - All Unicode characters will display correctly

3. **Google Sheets**: Import → Upload → Select CSV file
   - Auto-detects encoding

4. **Text Editors**: Open with UTF-8 encoding
   - Most modern editors (VS Code, Sublime, Atom) detect UTF-8 automatically

## Database Support

PostgreSQL natively supports UTF-8 encoding. All text columns (title, author, description, name, etc.) can store any Unicode characters without special configuration.

### Verify Database Encoding

```sql
SHOW SERVER_ENCODING;  -- Should return UTF8
```

## Troubleshooting

### Problem: Malayalam characters appear as ����� or boxes

**Solution**:
- For imports: Ensure CSV file is saved as "UTF-8 with BOM"
- For exports: Open the exported file in Excel or a UTF-8 capable editor

### Problem: Excel shows gibberish when opening CSV

**Solution**: The file might not have BOM. Try:
1. Open in text editor
2. Save as "UTF-8 with BOM"
3. Reopen in Excel

### Problem: Import fails with "Invalid CSV format"

**Solution**:
- Check for proper column headers (title, author, isbn for books)
- Ensure no special characters in column names
- Verify CSV syntax (properly escaped quotes and commas)

## Example Test Data

### Malayalam Books CSV

```csv
title,author,isbn,categories,description
ചെമ്മീൻ,തകഴി ശിവശങ്കര പിള്ള,978-81-264-1234-5,നോവൽ,മത്സ്യബന്ധന സമൂഹത്തെക്കുറിച്ചുള്ള ഒരു മനോഹരമായ കഥ
രണ്ടാമൂഴം,എം.ടി വാസുദേവൻ നായർ,978-81-264-5678-9,കഥകൾ,മലയാള സാഹിത്യത്തിന്റെ മാസ്റ്റർപീസ്
ആടുജീവിതം,ബെന്യാമിൻ,978-81-264-9012-3,നോവൽ,ആധുനിക മലയാള സാഹിത്യം
```

### Malayalam Members CSV

```csv
name,email,phone
രാജേഷ് കുമാർ,rajesh@library.org,+91-9876543210
സുജാത കൃഷ്ണൻ,sujatha@library.org,+91-9876543211
അനിൽ രാമചന്ദ്രൻ,anil@library.org,+91-9876543212
```

## Best Practices

1. **Always use UTF-8 with BOM** for CSV files containing Malayalam or Unicode
2. **Test with small files first** before bulk importing
3. **Export and reimport** to verify round-trip compatibility
4. **Keep a backup** of your original CSV files
5. **Use proper CSV escaping** for special characters (commas, quotes in text)

## Technical Details

### Import Configuration
- **Parser**: csv-parse/sync v5.x
- **BOM Handling**: Automatic detection and removal
- **Encoding**: UTF-8 with BOM support
- **Character Support**: Full Unicode (all languages)

### Export Configuration
- **BOM**: UTF-8 BOM (\uFEFF) prepended
- **Content-Type**: text/csv; charset=utf-8
- **Escaping**: RFC 4180 compliant
- **Encoding**: UTF-8

### Database
- **Engine**: PostgreSQL 16
- **Encoding**: UTF-8 (Unicode)
- **Collation**: Default Unicode collation
- **Character Set**: Supports all Unicode code points

---

**Note**: This system has been tested with Malayalam, Hindi, Tamil, and other Indic scripts, as well as international Unicode characters.
