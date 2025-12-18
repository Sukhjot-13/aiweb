# Configuration Layer

## Responsibility

Environment-based configuration and constants.

## Rules

- **No secrets in code** - use environment variables
- **Type safety** - validate config on load
- **Defaults provided** - app works out of the box
- **Documented** - each config option explained

## Structure

### Environment Config

```javascript
// config/env.js
export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  apiUrl: process.env.API_URL || "http://localhost:3000",
  // ...
};
```

### Feature Flags

```javascript
// config/features.js
export const features = {
  enableBrowserProvider: process.env.ENABLE_BROWSER === "true",
  enableLogging: process.env.NODE_ENV === "production",
};
```

### Strategy Config

```javascript
// config/strategyConfig.js
export const strategyConfig = {
  defaultOrder: ["API", "SCRAPER", "BROWSER"],
  domainOverrides: {
    "example.com": ["BROWSER"], // Force browser for this domain
  },
};
```
