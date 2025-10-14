# wy-dom-helper

DOM manipulation utilities and helpers for web development.

## Installation

```bash
npm install wy-dom-helper
# or
pnpm add wy-dom-helper
# or
yarn add wy-dom-helper
```

## Peer Dependencies

- `wy-helper` (workspace dependency)

## Features

### Core Modules

- **contentEditable** - Content editable utilities and helpers
- **canvas** - Canvas manipulation and drawing utilities
- **CSS Processing** - CSS styling and manipulation tools
- **Layout Utilities** - Text layout and line breaking

### Dependencies

- `csstype` - CSS type definitions
- `linebreak` - Unicode line breaking algorithm
- `stylis` - CSS preprocessor

## Usage

```typescript
// Import from main module
import {} from /* DOM utilities */ 'wy-dom-helper';

// Import specific modules
import {} from /* content editable utilities */ 'wy-dom-helper/contentEditable';
import {} from /* canvas utilities */ 'wy-dom-helper/canvas';
```

## Submodule Exports

- `wy-dom-helper/contentEditable` - Content editable functionality
- `wy-dom-helper/canvas` - Canvas manipulation tools

## Development

See the [main README](../README.md) for development setup instructions.

## License

MIT
