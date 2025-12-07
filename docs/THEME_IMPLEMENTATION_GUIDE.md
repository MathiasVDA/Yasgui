# Theme Implementation Guide for Yasgui Plugins

This guide explains how to implement dark mode theming support in Yasgui plugins to match the main Yasgui interface theme system.

## Overview

Yasgui uses a centralized theme system that plugins should integrate with to provide a consistent user experience across light and dark modes.

## Implementation Steps

### 1. Detect the Current Theme

Read the `data-theme` attribute on `document.documentElement`:

```javascript
const currentTheme = document.documentElement.getAttribute('data-theme');
// Returns: "light" or "dark"
```

### 2. Use CSS Custom Properties

Define theme-aware variables following Yasgui's pattern. Available CSS custom properties:

#### Background Colors
- `--yasgui-bg-primary` - Main background color
- `--yasgui-bg-secondary` - Secondary background color
- `--yasgui-bg-tertiary` - Tertiary background color

#### Text Colors
- `--yasgui-text-primary` - Primary text color
- `--yasgui-text-secondary` - Secondary/muted text color

#### Accent Colors
- `--yasgui-accent-color` - Primary accent color
- `--yasgui-link-hover` - Link hover state color

#### Border Colors
- `--yasgui-border-color` - Standard border color
- `--yasgui-input-border` - Input field border color
- `--yasgui-input-focus` - Input field focus border color

#### Button Colors
- `--yasgui-button-text` - Button text/icon color
- `--yasgui-button-hover` - Button hover state color

#### Other Colors
- `--yasgui-notification-bg` - Notification background
- `--yasgui-notification-text` - Notification text color

### 3. Watch for Theme Changes

Use a `MutationObserver` to detect when the theme changes:

```javascript
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.attributeName === 'data-theme') {
      const theme = document.documentElement.getAttribute('data-theme');
      updateGraphTheme(theme); // Apply theme to your visualization
    }
  });
});

observer.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['data-theme']
});
```

### 4. Apply Theme on Initialization

Check and apply the current theme when your plugin loads:

```javascript
function initializeTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  updateGraphTheme(currentTheme);
}

// Call during plugin initialization
initializeTheme();
```

### 5. Update Visualization Colors Dynamically

Your `updateGraphTheme` function should update all visual elements:

```javascript
function updateGraphTheme(theme) {
  // Example for a graph visualization
  if (theme === 'dark') {
    // Apply dark theme colors
    graphConfig.backgroundColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--yasgui-bg-primary').trim();
    graphConfig.nodeColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--yasgui-accent-color').trim();
    graphConfig.textColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--yasgui-text-primary').trim();
  } else {
    // Apply light theme colors
    // ...
  }
  
  // Refresh your visualization
  renderGraph(graphConfig);
}
```

### 6. Use CSS Selectors for Theme-Specific Styles

In your CSS files, use attribute selectors:

```css
/* Light mode (default) */
.graph-container {
  background-color: var(--yasgui-bg-primary);
  color: var(--yasgui-text-primary);
}

.graph-node {
  fill: var(--yasgui-accent-color);
  stroke: var(--yasgui-border-color);
}

.graph-link {
  stroke: var(--yasgui-text-secondary);
}

/* Dark mode overrides */
[data-theme="dark"] .graph-node {
  fill: var(--yasgui-accent-color);
  stroke: var(--yasgui-border-color);
}

[data-theme="dark"] .graph-tooltip {
  background-color: var(--yasgui-bg-secondary);
  color: var(--yasgui-text-primary);
  border-color: var(--yasgui-border-color);
}
```

### 7. Add Smooth Transitions

Include CSS transitions for smooth theme switching:

```css
.graph-container,
.graph-node,
.graph-link,
.graph-text {
  transition: fill 0.3s ease, stroke 0.3s ease, 
              background-color 0.3s ease, color 0.3s ease;
}
```

## Elements to Theme

Ensure you apply theme colors to all visual elements:

- **Graph/Visualization Background**: Main canvas/container background
- **Nodes/Points**: Node fill colors, borders, and hover states
- **Edges/Links**: Connection lines between nodes
- **Text Labels**: All text labels and annotations
- **Tooltips**: Tooltip backgrounds, text, and borders
- **Control Buttons**: Zoom, pan, and other UI controls
- **Legends**: Color legends and explanatory text
- **Overlays**: Loading indicators, error messages
- **Selection Highlights**: Selected node/edge highlights

## Testing

Test your implementation in both themes:

1. **Light Mode**: Default appearance with light backgrounds
2. **Dark Mode**: Verify proper contrast and readability
3. **Theme Switching**: Ensure smooth transitions without visual glitches
4. **Theme Persistence**: Check that the theme persists across page reloads

## How Yasgui Theme System Works

The Yasgui theme system:

1. Uses `document.documentElement.setAttribute('data-theme', 'dark')` to toggle themes
2. Stores the user's preference in localStorage (key: `yasgui_theme`)
3. Automatically detects system dark mode preference on first visit
4. Provides a theme toggle button in the tab bar
5. Applies theme changes globally to all components

## Example Implementation

Here's a complete example for a graph plugin:

```javascript
class GraphPlugin {
  constructor() {
    this.initializeTheme();
    this.watchThemeChanges();
  }

  initializeTheme() {
    const theme = document.documentElement.getAttribute('data-theme') || 'light';
    this.applyTheme(theme);
  }

  watchThemeChanges() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          const theme = document.documentElement.getAttribute('data-theme');
          this.applyTheme(theme);
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }

  applyTheme(theme) {
    const styles = getComputedStyle(document.documentElement);
    
    this.config.colors = {
      background: styles.getPropertyValue('--yasgui-bg-primary').trim(),
      nodeDefault: styles.getPropertyValue('--yasgui-accent-color').trim(),
      nodeText: styles.getPropertyValue('--yasgui-text-primary').trim(),
      link: styles.getPropertyValue('--yasgui-text-secondary').trim(),
      border: styles.getPropertyValue('--yasgui-border-color').trim()
    };

    this.updateVisualization();
  }

  updateVisualization() {
    // Redraw or update your visualization with new colors
  }
}
```

## Additional Resources

- [Yasgui Theme Guide](./THEME_GUIDE.md) - User-facing theme documentation
- [Yasgui Graph Plugin Repository](https://github.com/Matdata-eu/yasgui-graph-plugin)
- [CSS Custom Properties Documentation](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [MutationObserver API](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)
