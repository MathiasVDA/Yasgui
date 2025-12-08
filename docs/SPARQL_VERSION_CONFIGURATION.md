# SPARQL Version Configuration Guide

This guide explains how to configure and implement SPARQL version support in Yasgui for developers.

## Overview

Yasgui supports multiple SPARQL versions (1.1 and 1.2) through a modular grammar system. Each SPARQL version has its own:
- Grammar file (`.pl` format)
- Tokenizer implementation (`tokenizer.ts` or `tokenizer12.ts`)
- Tokenizer table (`_tokenizer-table.js` or `_tokenizer-table12.js`)
- CodeMirror mode registration

## Architecture

### Grammar Files

Grammar files are located in `packages/yasqe/grammar/` and define the syntax rules for each SPARQL version:

- **`sparql11-grammar.pl`**: SPARQL 1.1 grammar based on [W3C SPARQL 1.1 Recommendation](https://www.w3.org/TR/sparql11-query/)
- **`sparql12-grammar.pl`**: SPARQL 1.2 grammar based on [W3C SPARQL 1.2 Working Draft](https://www.w3.org/TR/sparql12-query/)

These files use EBNF (Extended Backus-Naur Form) in Prolog syntax to define grammar rules.

### Tokenizer Files

Each grammar version has a corresponding tokenizer implementation:

- **`tokenizer.ts`**: SPARQL 1.1 tokenizer
- **`tokenizer12.ts`**: SPARQL 1.2 tokenizer

These files import their respective tokenizer tables and export a CodeMirror mode function.

### Tokenizer Tables

The tokenizer tables contain the actual parsing logic:

- **`_tokenizer-table.js`**: SPARQL 1.1 tokenizer table
- **`_tokenizer-table12.js`**: SPARQL 1.2 tokenizer table

Each table exports:
- `keywords`: Regular expression matching valid keywords
- `punct`: Regular expression matching punctuation tokens
- `table`: Grammar rules lookup table
- `startSymbol`: The entry point for parsing (e.g., `"sparql11"` or `"sparql12"`)

**Important**: The `startSymbol` must match a key in the `table` object. For example:
```javascript
export const startSymbol = "sparql12";

export const table = {
  // ... other rules
  sparql12: {  // Must match startSymbol
    $: ["prologue", "or([queryAll,updateAll])", "$"],
    // ... query rules
  }
};
```

## Configuration

### Default SPARQL Version

The default SPARQL version is set in `packages/yasqe/src/defaults.ts`:

```typescript
const config: Omit<Config, "requestConfig"> = {
  sparqlVersion: "1.1", // Default to SPARQL 1.1
  mode: "sparql11",
  // ... other config options
};
```

### Registering CodeMirror Modes

Both SPARQL modes are registered in `packages/yasqe/src/CodeMirror.ts`:

```typescript
import * as sparql11Mode from "../grammar/tokenizer";
import * as sparql12Mode from "../grammar/tokenizer12";

_CodeMirror.defineMode("sparql11", sparql11Mode.default);
_CodeMirror.defineMode("sparql12", sparql12Mode.default);
```

### Switching Versions

The `setSparqlVersion()` method in `packages/yasqe/src/index.ts` handles version switching:

```typescript
public setSparqlVersion(version: "1.1" | "1.2") {
  this.config.sparqlVersion = version;
  const mode = version === "1.2" ? "sparql12" : "sparql11";
  this.config.mode = mode;
  this.setOption("mode", mode);
  this.checkSyntax();
}
```

## Adding Support for a New SPARQL Version

To add support for a new SPARQL version (e.g., SPARQL 2.0):

### 1. Create Grammar File

Create `packages/yasqe/grammar/sparql20-grammar.pl` with the new grammar rules:

```prolog
/*
SPARQL 2.0 grammar rules based on:
  https://www.w3.org/TR/sparql20-query/
*/

% Add your grammar rules here
% Example:
newFeature ==> ['NEW_KEYWORD', expression].
```

### 2. Create Tokenizer Table

Create `packages/yasqe/grammar/_tokenizer-table20.js`:

```javascript
// SPARQL 2.0 keywords
export const keywords = /^(EXISTING_KEYWORDS|NEW_KEYWORD_1|NEW_KEYWORD_2)/i;

// SPARQL 2.0 punctuation (if new operators are added)
export const punct = /^(existing_punct|new_operator)/;

export const table = {
  // ... grammar rules
  sparql20: {  // Entry point - must match startSymbol
    $: ["prologue", "or([queryAll,updateAll])", "$"],
    // ... rules
  }
};

export const startSymbol = "sparql20";  // Must match table key
export const acceptEmpty = true;
```

**Critical**: Ensure the `startSymbol` value matches the corresponding key in the `table` object.

### 3. Create Tokenizer Implementation

Create `packages/yasqe/grammar/tokenizer20.ts`:

```typescript
import * as grammar from "./_tokenizer-table20.js";

export default function(config: any, parserConfig: any) {
  // Use the standard tokenizer implementation
  // (copy from tokenizer.ts and adjust as needed)
}

export { State } from "./tokenizer";
```

### 4. Register CodeMirror Mode

In `packages/yasqe/src/CodeMirror.ts`:

```typescript
import * as sparql11Mode from "../grammar/tokenizer";
import * as sparql12Mode from "../grammar/tokenizer12";
import * as sparql20Mode from "../grammar/tokenizer20";  // Add this

_CodeMirror.defineMode("sparql11", sparql11Mode.default);
_CodeMirror.defineMode("sparql12", sparql12Mode.default);
_CodeMirror.defineMode("sparql20", sparql20Mode.default);  // Add this
```

### 5. Update Configuration Types

In `packages/yasqe/src/index.ts`, update the `Config` interface:

```typescript
export interface Config extends Partial<CodeMirror.EditorConfiguration> {
  mode: string;
  sparqlVersion: "1.1" | "1.2" | "2.0";  // Add new version
  // ... other config options
}
```

Update the `setSparqlVersion()` method:

```typescript
public setSparqlVersion(version: "1.1" | "1.2" | "2.0") {
  this.config.sparqlVersion = version;
  const mode = version === "2.0" ? "sparql20" : 
               version === "1.2" ? "sparql12" : "sparql11";
  this.config.mode = mode;
  this.setOption("mode", mode);
  this.checkSyntax();
}
```

### 6. Update UI

Add the new version to the settings modal in `packages/yasgui/src/TabSettingsModal.ts`:

```typescript
const versionSelect = this.createSelect(
  ["1.1", "1.2", "2.0"],  // Add "2.0"
  yasqe?.config.sparqlVersion || "1.1",
);
```

### 7. Update runMode Calls

The `runMode` method is used for formatting and processing queries. It should automatically use the current mode from `this.config.mode`, but verify all calls in `packages/yasqe/src/index.ts`:

```typescript
(<any>Yasqe).runMode(text, this.config.mode, function (stringVal: string, type: string) {
  // Processing logic
});
```

## Testing

After implementing a new SPARQL version:

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Test in development**:
   ```bash
   npm run dev
   ```
   Navigate to `http://localhost:4000/yasgui.html`

3. **Verify the following**:
   - Version selector appears in Settings modal
   - Switching versions updates the editor mode
   - New syntax is highlighted correctly
   - New keywords are recognized
   - Syntax validation works (no false errors for valid queries)
   - Backward compatibility (old queries still work)

4. **Test queries with new features**:
   - Create queries using new syntax
   - Verify syntax highlighting
   - Check for validation errors

## Common Issues

### Issue: Syntax validation errors for valid queries

**Cause**: Mismatch between `startSymbol` and table entry name

**Solution**: Ensure the `startSymbol` export matches the key in the `table` object:

```javascript
// ❌ Wrong - mismatch
export const startSymbol = "sparql12";
export const table = {
  sparql11: { /* ... */ }  // Wrong key
};

// ✅ Correct - matching
export const startSymbol = "sparql12";
export const table = {
  sparql12: { /* ... */ }  // Correct key
};
```

### Issue: New keywords not recognized

**Cause**: Keywords not added to the `keywords` regex

**Solution**: Update the `keywords` export in the tokenizer table:

```javascript
export const keywords = /^(EXISTING|NEW_KEYWORD_1|NEW_KEYWORD_2)/i;
```

### Issue: New operators not parsed

**Cause**: Operators not added to `punct` regex or grammar rules

**Solution**: 
1. Add to `punct` regex (order matters - longer patterns first):
   ```javascript
   export const punct = /^(new_op|<<|>>|existing_ops)/;
   ```

2. Add grammar rules for the operator usage in the table

## SPARQL 1.2 Specific Changes

The SPARQL 1.2 implementation includes these specific additions:

### New Keywords
- `TRIPLE` - Create a triple term from subject, predicate, and object
- `SUBJECT` - Extract subject from a triple term
- `PREDICATE` - Extract predicate from a triple term
- `OBJECT` - Extract object from a triple term
- `isTRIPLE` - Test if a value is a triple term
- `ADJUST` - Adjust datetime values by duration

### New Punctuation
- `<<` and `>>` for quoted triples (RDF-star reification)
- `{|` and `|}` for annotation blocks

### New Grammar Rules
- `quotedTriple`: Handles `<< subject predicate object >>` syntax
- `annotationBlock`: Handles `{| propertyList |}` syntax

### Example Implementation

In `_tokenizer-table12.js`:

```javascript
// Add keywords (add to existing keyword list)
export const keywords = /^(GROUP_CONCAT|DATATYPE|BASE|PREFIX|/* ...existing keywords... */|TRIPLE|SUBJECT|PREDICATE|OBJECT|isTRIPLE|ADJUST)/i;

// Add punctuation (order matters! New tokens before similar existing ones)
export const punct = /^(\{\||\|\}|<<|>>|\*|a|\.|\{|\}|/* ...existing punctuation... */)/;

// Add grammar rules
export const table = {
  // ... other rules
  graphTerm: {
    // ... existing options
    "<<": ["quotedTriple"],  // Add quoted triple entry point
  },
  quotedTriple: {
    "<<": ["<<", "varOrTerm", "or([varOrIRIref,'a'])", "varOrTerm", ">>"],
  },
  // ... other rules
};
```

## Resources

- [SPARQL 1.1 Query Language](http://www.w3.org/TR/sparql11-query/)
- [SPARQL 1.2 Working Draft](https://www.w3.org/TR/sparql12-query/)
- [CodeMirror Mode Documentation](https://codemirror.net/5/doc/manual.html#modeapi)
- [EBNF Notation](https://en.wikipedia.org/wiki/Extended_Backus%E2%80%93Naur_form)

## Support

For issues or questions about SPARQL version support:
- Open an issue on [GitHub](https://github.com/Matdata-eu/Yasgui/issues)
- Check existing issues for similar problems
- Include your SPARQL version and sample query when reporting issues
