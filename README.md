# Draw.io VS Code Integration (Fork)

This is a fork of [hediet/vscode-drawio](https://github.com/hediet/vscode-drawio) with personal customizations.

## Changes from Upstream

- **Shapes panel closed by default** - Cleaner initial view without the left sidebar ([6969ffd](https://github.com/nisedo/vscode-drawio/commit/6969ffd))
- **Grid and Page View settings** - New settings `hediet.vscode-drawio.enableGrid` and `hediet.vscode-drawio.enablePageView` ([c429580](https://github.com/nisedo/vscode-drawio/commit/c429580))
- **Elbow edge style by default** - Orthogonal connectors for cleaner diagrams ([2a46a24](https://github.com/nisedo/vscode-drawio/commit/2a46a24))

## Install from Source

```bash
git clone --recurse-submodules https://github.com/nisedo/vscode-drawio.git && cd vscode-drawio && yarn install && yarn build && code --install-extension ./dist/extension.vsix
```

Then reload VS Code to activate the extension.

## Original Extension

For the official extension, visit:
- **Marketplace**: [Draw.io Integration](https://marketplace.visualstudio.com/items?itemName=hediet.vscode-drawio)
- **Repository**: [hediet/vscode-drawio](https://github.com/hediet/vscode-drawio)
