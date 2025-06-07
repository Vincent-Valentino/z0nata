/// <reference types="vite/client" />

// Add support for markdown imports
declare module '*.md?raw' {
  const content: string
  export default content
}
