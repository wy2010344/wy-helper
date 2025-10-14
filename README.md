# wy-helper

A comprehensive JavaScript utility library with various helper functions.

## Packages

- **wy-helper** - Core JavaScript utilities and helper functions
- **wy-dom-helper** - DOM manipulation utilities and web helpers

## Development

This project is part of a pseudo monorepo setup. To contribute:

1. Clone the pseudo monorepo:

   ```bash
   git clone https://github.com/wy2010344/es-pseudo-monorepo.git
   cd es-pseudo-monorepo
   ```

2. Clone this project into the packages directory:

   ```bash
   cd packages
   git clone https://github.com/wy2010344/wy-helper.git
   cd wy-helper
   ```

3. Install dependencies from the monorepo root:

   ```bash
   cd ../..
   pnpm install
   ```

4. Build and test:
   ```bash
   cd packages/wy-helper
   pnpm run build
   pnpm run lint:check
   pnpm run type-check
   ```

## Documentation

Generate API documentation:

```bash
pnpm run docs
```

Serve documentation locally:

```bash
pnpm run docs:serve
```

The documentation will be available at http://localhost:8080

## Publishing

From the monorepo root:

```bash
pnpm changeset
pnpm version-packages
pnpm release
```
