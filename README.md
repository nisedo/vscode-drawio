# Draw.io VS Code Integration (Fork)

This is a fork of [hediet/vscode-drawio](https://github.com/hediet/vscode-drawio) with personal customizations.

## Features

### Editor & File Support
| Feature | Source |
|---------|--------|
| Integrated Draw.io editor in VS Code | Original |
| Supports `.drawio`, `.dio`, `.drawio.svg`, `.dio.svg` (text-based) | Original |
| Supports `.drawio.png`, `.dio.png` (binary with embedded XML) | Original |
| Offline mode with bundled Draw.io | Original |
| Online mode using diagrams.net | Original |
| Edit Diagram as Text (experimental) | Original |

### Code Integration
| Feature | Source |
|---------|--------|
| **Code Link** - Click nodes to navigate to linked code | Original |
| Link Code with Selected Node (Shift+F3) | Original |
| Link File with Selected Node (right-click in explorer) | Original |
| Link Symbol with Selected Node | Original |
| Link Workspace Symbol with Selected Node | Original |
| **Create Node from Symbol** - Create linked nodes from code symbols | Fork |
| **Create Page from File** - Auto-generate page with function nodes | Fork |

### Collaboration
| Feature | Source |
|---------|--------|
| VS Code Liveshare integration | Original |

### Export & Conversion
| Feature | Source |
|---------|--------|
| Export to PNG, SVG, PDF, and more | Original |
| Convert between diagram formats | Original |

### Customization
| Feature | Source |
|---------|--------|
| Theme selection (Kennedy, Min) | Original |
| Appearance modes (Light, Dark, High Contrast, Automatic) | Original |
| Custom fonts | Original |
| Custom color schemes and preset colors | Original |
| Custom libraries (from file, URL, or inline) | Original |
| Custom plugins support | Original |
| Default vertex and edge styles | Original |
| Zoom factor configuration | Original |
| Global variables for placeholders | Original |
| SimpleLabels option for cleaner SVG output | Original |
| Resize images option | Original |
| **Grid enabled by default** (configurable) | Fork |
| **Page View enabled by default** (configurable) | Fork |

### UI Improvements (Fork)
| Feature | Description |
|---------|-------------|
| **Shapes panel closed by default** | Cleaner initial view without the left sidebar |
| **Elbow edge style by default** | Orthogonal connectors for cleaner diagrams |
| **Google Sheets-style notes** | Right-click nodes to insert/edit/delete notes with tooltip display |

## Fork Changes Summary

- **Shapes panel closed by default** - Cleaner initial view without the left sidebar ([6969ffd](https://github.com/nisedo/vscode-drawio/commit/6969ffd))
- **Grid and Page View settings** - New settings `hediet.vscode-drawio.enableGrid` and `hediet.vscode-drawio.enablePageView` ([c429580](https://github.com/nisedo/vscode-drawio/commit/c429580))
- **Elbow edge style by default** - Orthogonal connectors for cleaner diagrams ([2a46a24](https://github.com/nisedo/vscode-drawio/commit/2a46a24))
- **Google Sheets-style notes** - Right-click nodes to insert/edit/delete notes with tooltip display and visual indicator ([9b99dd4](https://github.com/nisedo/vscode-drawio/commit/9b99dd4))
- **Create Node from Symbol** - Command palette to create linked diagram nodes from code symbols ([b2ef148](https://github.com/nisedo/vscode-drawio/commit/b2ef148))
- **Create Page from File** - Command to create a new diagram page with a container node and function nodes from the current file ([551aba4](https://github.com/nisedo/vscode-drawio/commit/551aba4))

## Install from Source

```bash
git clone --recurse-submodules https://github.com/nisedo/vscode-drawio.git && cd vscode-drawio && yarn install && yarn build && code --install-extension ./dist/*.vsix
```

Then reload VS Code to activate the extension.

## Original Extension

For the official extension, visit:
- **Marketplace**: [Draw.io Integration](https://marketplace.visualstudio.com/items?itemName=hediet.vscode-drawio)
- **Repository**: [hediet/vscode-drawio](https://github.com/hediet/vscode-drawio)
