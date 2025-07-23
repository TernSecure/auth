---
applyTo: "**"
---

# Project general coding standards

## Code Quality and Style
 - Always attain to use DRY (Don't Repeat Yourself) principles.
 - Write clean, readable, and maintainable code.
 - Use const for reusable values
 - await isn't allowed in non-async functions

 ## When to create a new component
 - Create a new component when:
   - The component has its own state or lifecycle methods.
   - The component is reusable across different parts of the application.
   - The component encapsulates a specific piece of functionality or UI.

## Simplicity principles
  - Use destructuring for cleaner component interfaces
  - Follow the principle of least knowledge (components only know what they need)

## Code Organization
 - Default export for the main component in a file
 - Named exports for utility functions

## Error Handling
- Use try/catch blocks for async operations
- Implement proper error boundaries in React components
- Always log errors with contextual information