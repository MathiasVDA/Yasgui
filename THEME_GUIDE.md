# Yasgui Theme Guide

Yasgui now supports both light and dark themes, allowing users to customize the appearance of the SPARQL IDE according to their preferences.

## Features

- **Light Theme**: Default bright theme suitable for well-lit environments
- **Dark Theme**: Easy on the eyes dark theme with syntax highlighting
- **Theme Toggle**: Quick switching between themes via UI button
- **Persistence**: User's theme preference is saved in localStorage
- **System Preference**: Automatically detects and applies system theme preference
- **Programmatic Control**: Set theme via JavaScript API

## Usage

### Theme Toggle Button

By default, a theme toggle button appears in the tab bar (top-right area). Users can click this button to instantly switch between light and dark themes.

- **Light Mode**: Shows a sun icon (☀️) - clicking switches to dark mode
- **Dark Mode**: Shows a moon icon (🌙) - clicking switches to light mode

### Configuration Options

You can configure the theme when initializing Yasgui:

```javascript
import Yasgui from '@matdata/yasgui';

// Initialize with dark theme
const yasgui = new Yasgui(document.getElementById('yasgui'), {
  theme: 'dark'
});

// Initialize with light theme (default)
const yasgui = new Yasgui(document.getElementById('yasgui'), {
  theme: 'light'
});

// Hide the theme toggle button
const yasgui = new Yasgui(document.getElementById('yasgui'), {
  showThemeToggle: false
});
```

### Programmatic Theme Control

You can control the theme programmatically using the Yasgui API:

```javascript
// Get current theme
const currentTheme = yasgui.getTheme(); // Returns 'light' or 'dark'

// Set theme
yasgui.setTheme('dark');  // Switch to dark theme
yasgui.setTheme('light'); // Switch to light theme

// Toggle theme
const newTheme = yasgui.toggleTheme(); // Returns the new theme
```

## Theme Details

### Light Theme
- Clean, bright interface with high contrast
- Default CodeMirror syntax highlighting
- White backgrounds with dark text
- Blue accent color (#337ab7)

### Dark Theme
- Dark backgrounds with light text
- Material Palenight CodeMirror theme for syntax highlighting
- Reduced eye strain in low-light environments
- Cyan accent color (#4fc3f7)

## Technical Details

### CSS Custom Properties

Themes are implemented using CSS custom properties (variables). The following variables are available:

```css
--yasgui-bg-primary       /* Primary background color */
--yasgui-bg-secondary     /* Secondary background (hover states, etc.) */
--yasgui-bg-tertiary      /* Tertiary background */
--yasgui-text-primary     /* Primary text color */
--yasgui-text-secondary   /* Secondary text color */
--yasgui-text-muted       /* Muted text color */
--yasgui-border-color     /* Primary border color */
--yasgui-link-color       /* Link color */
--yasgui-accent-color     /* Accent color for highlights */
--yasgui-error-color      /* Error message color */
/* ... and more */
```

### Theme Persistence

The selected theme is automatically saved to localStorage under the key `yasgui_theme`. This means:

- Theme preference persists across page reloads
- Each user's preference is independent
- No server-side configuration needed

### System Theme Detection

If no theme is explicitly set and no saved preference exists, Yasgui will:
1. Check the system's color scheme preference (`prefers-color-scheme` media query)
2. Apply dark theme if system prefers dark mode
3. Apply light theme otherwise

The system theme listener will automatically update the theme if the user changes their system preference (and they haven't manually selected a theme in Yasgui).

## TypeScript

Theme types are exported for TypeScript users:

```typescript
import Yasgui, { Theme } from '@matdata/yasgui';

const theme: Theme = 'dark'; // Type-safe: only 'light' or 'dark' allowed
yasgui.setTheme(theme);
```

## Browser Compatibility

Themes work in all modern browsers that support:
- CSS Custom Properties
- localStorage
- Media Queries (for system theme detection)

This includes all recent versions of Chrome, Firefox, Safari, and Edge.

## Customization

If you want to customize the theme colors, you can override the CSS custom properties in your own stylesheet:

```css
/* Custom dark theme colors */
[data-theme="dark"] {
  --yasgui-bg-primary: #0d1117;
  --yasgui-accent-color: #58a6ff;
  /* Override other variables as needed */
}
```

## Troubleshooting

**Theme doesn't persist after page reload**

Ensure localStorage is enabled in the browser. Some browsers in private/incognito mode may not persist localStorage data.

**Theme toggle button is not visible**

Check that `showThemeToggle` is not set to `false` in the configuration.

**CodeMirror theme doesn't match**

The CodeMirror theme is automatically synchronized with the Yasgui theme. If you see a mismatch, try manually refreshing:

```javascript
yasgui.themeManager.refresh();
```
