# YASGUI

This is a fork 

## Table of Contents

- [Useful Links](#useful-links)
- [Features](#features)
  - [Keyboard Shortcuts](#keyboard-shortcuts)
    - [Query Editor (Yasqe)](#query-editor-yasqe)
    - [Fullscreen Mode](#fullscreen-mode)
    - [URI Explorer](#uri-explorer)
  - [Prefix Management](#prefix-management)
  - [Result Visualization Plugins (Yasr)](#result-visualization-plugins-yasr)
- [Installation](#installation)
  - [npm](#npm)
  - [Yarn](#yarn)
- [Local Development](#local-development)
- [License](#license)

## Useful Links

- User documentation: https://docs.triply.cc/yasgui/
- Developer documentation: https://docs.triply.cc/yasgui-api/
- Documentation Github repository (feel free to add a PR for improvements): https://github.com/TriplyDB/Documentation

## Features

### Keyboard Shortcuts

#### Query Editor (Yasqe)
- **Ctrl+Enter** / **Cmd+Enter**: Execute the current query
- **Ctrl+Space**: Trigger autocomplete
- **Ctrl+S**: Save query to local storage
- **Shift+Ctrl+F**: Auto-format the query
- **Ctrl+/**: Comment/uncomment selected lines
- **Shift+Ctrl+D**: Duplicate the current line
- **Shift+Ctrl+K**: Delete the current line
- **Esc**: Remove focus from the editor

#### Fullscreen Mode
- **F11**: Toggle fullscreen mode for the query editor (Yasqe)
- **F10**: Toggle fullscreen mode for the results viewer (Yasr)
- **Ctrl+Shift+F**: Switch between Yasqe and Yasr fullscreen modes

#### URI Explorer
- **Ctrl+Click** on any URI in the query editor: Automatically executes a CONSTRUCT query to explore the clicked URI's connections (incoming and outgoing triples). The query runs in the background without modifying your current query in the editor.

### Prefix Management
- **PREFIX Button**: Insert saved prefix declarations into your query (replaces existing PREFIX lines at the beginning)
- **Settings Modal**: Access via the settings button (⚙) to manage:
  - **Saved Prefixes**: Define reusable PREFIX declarations
  - **Auto-capture**: Automatically captures new prefixes from your queries (enabled by default)
  - **Request Configuration**: Configure HTTP request method, accept headers, arguments, headers, and named/default graphs
- **Default Prefixes**: Automatically includes `rdf:` and `rdfs:` prefixes for new users
- **Prefix Autocomplete**: When typing a prefix declaration (e.g., `PREFIX foaf:`), the editor automatically queries [prefix.cc](https://prefix.cc) to suggest and auto-complete the full URI commonly associated with that prefix. This helps you quickly add standard prefixes without needing to remember their full URIs.

### Result Visualization Plugins (Yasr)

Yasgui includes several built-in plugins to visualize SPARQL query results:

- **Table**: Interactive table view with sorting, filtering, pagination, and column resizing. Ideal for SELECT query results.
- **Boolean**: Displays boolean results (true/false) with visual indicators. Automatically used for ASK queries.
- **Response**: Raw response viewer with syntax highlighting and code folding. Shows the original response from the endpoint in JSON, XML, Turtle, or other formats.
- **Geo**: Geographic visualization plugin for displaying spatial data on interactive maps. Visualizes geospatial triples with coordinates.
- **Error**: Displays error messages and diagnostics when queries fail, including CORS troubleshooting guidance.

Plugins are automatically selected based on the query type and response format. You can manually switch between available plugins using the view selector in the results pane.

## Installation

Below are instructions on how to include Yasgui in your project.
If you only want to install Yasr or Yasqe, replace yasgui in the commands below.

### npm

```sh
npm i @matdata/yasgui
```

### Yarn

```sh
yarn add @matdata/yasgui
```

## Local Development

#### Installing dependencies

Run `npm install`.

#### Running Yasgui locally

To develop locally, run `npm run dev`

Go to `http://localhost:5173/demo` in your browser to see Yasgui in action.

#### Compiling Yasgui

Run `npm run build`. It'll store the transpiled js/css files in the `build` directory.

## License

This is a fork from Zazuko from software written by Triply.

This code is released under the MIT license.
