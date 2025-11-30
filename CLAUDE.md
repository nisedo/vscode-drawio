# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About This Repository

This is a fork of [hediet/vscode-drawio](https://github.com/hediet/vscode-drawio) - a VS Code extension that integrates Draw.io diagram editor. The fork includes customizations for default UI behavior.

## Build Commands

```bash
# Install dependencies (also initializes git submodules)
yarn install

# Full build (extension + plugins + package)
yarn build

# Development mode with watch
yarn dev

# Build and install locally
yarn build && code --install-extension ./dist/extension.vsix
```

## Architecture

### Core Components

- **Extension.ts** - Entry point. Registers custom editors and commands, initializes all services.

- **DrawioEditorService.ts** - Manages all open Draw.io editors. Tracks active editor, handles theme switching, convert/export commands.

- **DrawioClient/DrawioClient.ts** - Communication layer with Draw.io iframe via postMessage. Handles load/save/export actions and autosave events.

- **DrawioClient/DrawioClientFactory.ts** - Creates Draw.io webviews. Generates HTML with config, handles plugin loading, manages webview lifecycle. This is where Draw.io configuration options (theme, colors, styles, sidebarWidth, etc.) are passed to the iframe.

- **Config.ts** - All VS Code settings. Uses `VsCodeSetting` class with MobX `@computed` decorators for reactive settings.

### Editor Providers

Two custom editor providers for different file types:
- **DrawioEditorProviderText.ts** - For `.drawio`, `.dio`, `.drawio.svg` (text-based)
- **DrawioEditorProviderBinary.ts** - For `.drawio.png` (binary with embedded XML)

### Features (src/features/)

- **CodeLinkFeature** - Links diagram nodes to code symbols via `#SymbolName` labels
- **LiveshareFeature** - VS Code Liveshare integration for collaborative editing
- **EditDiagramAsTextFeature** - Experimental XML text editing

### Draw.io Configuration

Configuration flows: `package.json` (setting definitions) → `Config.ts` (reads settings) → `DrawioClientFactory.ts` (passes to iframe) → `DrawioTypes.ts` (TypeScript interfaces)

Key Draw.io config options in `DrawioClientFactory.getConfig()`:
- `sidebarWidth` - Set to 0 to hide shapes panel
- `defaultGridEnabled`, `defaultPageVisible` - Initial grid/page view state
- `defaultEdgeStyle`, `defaultVertexStyle` - Default styling for new elements

### Submodule

The `drawio/` directory is a git submodule containing the Draw.io web app source. It's bundled for offline mode.

## Adding New Settings

1. Add setting definition in `package.json` under `contributes.configuration`
2. Add `VsCodeSetting` instance and `@computed` getter in `Config.ts`
3. If it's a Draw.io config option, add to interface in `DrawioTypes.ts` and pass in `DrawioClientFactory.ts`
4. Update documentation (see below)

## Documentation Updates

When making changes, always update:

1. **CHANGELOG.md** - Add entry in the appropriate section:
   - `### Added` - New features/settings
   - `### Changed` - Modified behavior
   - `### Fixed` - Bug fixes

2. **README.md** - Update the "Changes from Upstream" section with:
   - Brief description of the change
   - Link to the commit: `([hash](https://github.com/nisedo/vscode-drawio/commit/hash))`
