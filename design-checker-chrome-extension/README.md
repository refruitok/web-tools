# Website QC Checker - Chrome Extension

A Chrome extension designed to help QC testers quickly inspect and validate website elements.

## Features

### 1. Header Tag Checker
- Validates H1-H6 tag presence and hierarchy
- Checks for proper semantic structure (H1 → H2 → H3, etc.)
- Detects missing or empty headers
- Highlights hierarchy violations on the page

### 2. Font Size & Color Checker
- Analyzes all text elements for font sizes
- Detects text smaller than 12px (accessibility concern)
- Checks color contrast ratios (WCAG compliance)
- Reports font families used on the page

### 3. Image Dimension Checker
- Lists all images with their dimensions
- Detects missing alt attributes
- Identifies oversized images (larger than display size)
- Flags broken images

### 4. Element Spacing Checker
- Analyzes margins and paddings
- Detects inconsistent spacing patterns
- Reports common spacing values used
- Identifies elements with minimal or excessive gaps

### 5. Meta & Description Checker
- Validates page title length (50-60 chars recommended)
- Checks meta description (150-160 chars recommended)
- Verifies viewport meta tag for mobile
- Checks Open Graph tags for social sharing
- Validates canonical URL and language attributes

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `checker-chrome-extension` folder
5. The extension icon will appear in your toolbar

## Usage

1. Navigate to any website you want to inspect
2. Click the QC Checker extension icon
3. Select which checks you want to run (all enabled by default)
4. Click "Run All Checks"
5. Review the results in the popup
6. Hover over highlighted elements on the page to see details
7. Export results as a text report if needed
8. Click "Clear Highlights" to remove visual indicators

## Results Legend

- ✅ **Pass** (Green) - Element meets best practices
- ⚠️ **Warning** (Yellow) - Potential issue, review recommended
- ❌ **Fail** (Red) - Issue that should be fixed

## Icons

The extension requires icon files. You can:
1. Use the provided `icon.svg` as a template
2. Convert it to PNG at 16x16, 48x48, and 128x128 pixels
3. Save as `icon16.png`, `icon48.png`, and `icon128.png` in the `icons` folder

Or use any icon converter tool to generate the PNG files from the SVG.

## Development

### Project Structure
```
checker-chrome-extension/
├── manifest.json          # Extension configuration
├── popup/
│   ├── popup.html        # Extension popup UI
│   ├── popup.css         # Popup styles
│   └── popup.js          # Popup logic
├── content/
│   ├── content.js        # Page analysis scripts
│   └── content.css       # Highlight styles
├── icons/
│   ├── icon.svg          # Source icon
│   ├── icon16.png        # Toolbar icon
│   ├── icon48.png        # Extension page icon
│   └── icon128.png       # Chrome Web Store icon
└── README.md
```

### Modifying Checks

Each check function is located in `content/content.js`:
- `checkHeaders()` - Header validation
- `checkFonts()` - Font analysis
- `checkImages()` - Image inspection
- `checkSpacing()` - Spacing analysis
- `checkMeta()` - Meta tag validation

## License

MIT License - Feel free to modify and distribute.
