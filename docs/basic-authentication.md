# Basic Authentication

YASGUI supports HTTP Basic Authentication for SPARQL endpoints that require username and password credentials.

## User Guide

### Configuring Basic Authentication

1. **Open Settings**: Click the settings icon (⚙️) in the control bar
2. **Navigate to Authentication**: Click on the "Authentication" tab in the settings modal
3. **Enable Authentication**: Check the "Enable Basic Authentication" checkbox
4. **Enter Credentials**:
   - Username: Enter your username
   - Password: Enter your password
5. **Save**: Click the "Save" button to apply your settings

### Security Considerations

⚠️ **Important Security Notes:**

- **Credentials are stored in browser localStorage**: Your username and password are stored locally in your browser
- **Only use with HTTPS endpoints**: Never send credentials to HTTP endpoints as they will be transmitted in plain text
- **Be cautious on shared computers**: Clear your browser data when using YASGUI on shared or public computers

### Per-Tab Configuration

Authentication settings are stored per-tab, which means:
- Each tab can have different credentials
- You can have multiple tabs connecting to different authenticated endpoints
- Credentials persist across browser sessions (stored in localStorage)

### How It Works

When authentication is enabled:
1. YASGUI encodes your credentials using Base64 encoding
2. Adds an `Authorization` header with the format: `Basic <encoded-credentials>`
3. Sends this header with every SPARQL query request to the endpoint

## Developer Guide

### Programmatic Configuration

You can configure basic authentication programmatically when initializing YASGUI:

```javascript
const yasgui = new Yasgui(document.getElementById("yasgui"), {
  requestConfig: {
    endpoint: "https://example.com/sparql",
    basicAuth: {
      username: "myuser",
      password: "mypassword"
    }
  }
});
```

### Per-Tab Configuration

Set authentication for a specific tab:

```javascript
const tab = yasgui.getTab();
tab.setRequestConfig({
  basicAuth: {
    username: "myuser",
    password: "mypassword"
  }
});
```

### Dynamic Authentication

Use a function to dynamically provide credentials:

```javascript
const yasgui = new Yasgui(document.getElementById("yasgui"), {
  requestConfig: {
    endpoint: "https://example.com/sparql",
    basicAuth: (yasqe) => {
      // Return credentials dynamically
      return {
        username: getCurrentUsername(),
        password: getCurrentPassword()
      };
    }
  }
});
```

### Disabling Authentication

To disable authentication:

```javascript
tab.setRequestConfig({
  basicAuth: undefined
});
```

### TypeScript Types

```typescript
import { BasicAuthConfig } from "@matdata/yasqe";

const authConfig: BasicAuthConfig = {
  username: "myuser",
  password: "mypassword"
};
```

## API Reference

### BasicAuthConfig

```typescript
interface BasicAuthConfig {
  username: string;
  password: string;
}
```

### RequestConfig.basicAuth

```typescript
basicAuth: BasicAuthConfig | ((yasqe: Yasqe) => BasicAuthConfig | undefined) | undefined;
```

- **Type**: `BasicAuthConfig` object, function returning `BasicAuthConfig`, or `undefined`
- **Default**: `undefined` (authentication disabled)
- **Description**: Configuration for HTTP Basic Authentication

## Examples

### Example 1: Simple Authentication

```javascript
const yasgui = new Yasgui(document.getElementById("yasgui"), {
  requestConfig: {
    endpoint: "https://secure-endpoint.example.com/sparql",
    basicAuth: {
      username: "user",
      password: "pass"
    }
  }
});
```

### Example 2: Multiple Tabs with Different Credentials

```javascript
const yasgui = new Yasgui(document.getElementById("yasgui"));

// Tab 1 - Public endpoint (no auth)
const tab1 = yasgui.addTab();
tab1.setRequestConfig({
  endpoint: "https://dbpedia.org/sparql",
  basicAuth: undefined
});

// Tab 2 - Private endpoint (with auth)
const tab2 = yasgui.addTab();
tab2.setRequestConfig({
  endpoint: "https://private.example.com/sparql",
  basicAuth: {
    username: "admin",
    password: "secret"
  }
});
```

### Example 3: Prompt User for Credentials

```javascript
const yasgui = new Yasgui(document.getElementById("yasgui"), {
  requestConfig: {
    endpoint: "https://secure-endpoint.example.com/sparql",
    basicAuth: (yasqe) => {
      // Only prompt if credentials aren't already stored
      const stored = localStorage.getItem("sparql_credentials");
      if (stored) {
        return JSON.parse(stored);
      }
      
      const username = prompt("Enter username:");
      const password = prompt("Enter password:");
      
      if (username && password) {
        const credentials = { username, password };
        localStorage.setItem("sparql_credentials", JSON.stringify(credentials));
        return credentials;
      }
      
      return undefined;
    }
  }
});
```

## Troubleshooting

### Authentication Not Working

1. **Check HTTPS**: Ensure you're using HTTPS endpoints
2. **Verify Credentials**: Double-check your username and password
3. **CORS Issues**: The endpoint must have proper CORS headers configured
4. **Check Browser Console**: Look for authentication errors in the browser developer console

### Credentials Not Persisting

1. **Check localStorage**: Ensure your browser allows localStorage
2. **Private/Incognito Mode**: Credentials won't persist in private browsing mode
3. **Browser Storage Cleared**: Clearing browser data will remove stored credentials

## Best Practices

1. **Use HTTPS Only**: Never use basic authentication with HTTP endpoints
2. **Secure Storage**: Consider implementing additional encryption for stored credentials
3. **Token-Based Auth**: For production applications, consider using token-based authentication instead of basic auth
4. **Clear on Logout**: Implement a logout mechanism that clears stored credentials
5. **Environment Variables**: Store credentials in environment variables for server-side applications
