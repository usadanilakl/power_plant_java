# Naming Convention Component - Refactor Plan

## Status: COMPLETED

---

## Previous Implementation
1. Fetched Equipment Types and System Values from server via `CurrentValueService`
2. Looped over lists and displayed: `Value.alias - Value.name`
3. Required API calls on component initialization
4. Dynamic content but no guidance on naming conventions

## Refactored Implementation
1. Static content - no API calls needed
2. Provides formulas, directions, and examples for consistent naming
3. Organized into Valve and Breaker sections
4. Includes keywords as chips for quick reference
5. Clear rules with examples

---

## Component Structure

### TypeScript (naming-convention.component.ts)
- Simple standalone component
- No dependencies on services
- Data arrays for examples and keywords

### Template (naming-convention.component.html)
- Two main sections: Valve Naming, Breaker Naming
- Formula boxes with visual emphasis
- Examples lists with monospace code styling
- Keyword chips for quick scanning
- Rules lists with highlighted important terms

### Styles (naming-convention.component.scss)
- Clean, organized layout
- Consistent visual hierarchy
- Dark mode support
- Responsive design

---

## Content Included

### Valve Naming
- **Formula:** What it isolates + Isolation type
- **Examples:** 6 real-world valve names
- **Keywords:** ISO, DRAIN, VENT, EQ, ROOT, BLOCK, LO SIDE, HI SIDE, UPSTREAM, DOWNSTREAM
- **Rules:**
  - Do NOT include unit or tag number in name
  - Include tag number of equipment valve isolates
  - Use keywords for consistency
  - Extra details go in Specific Location field

### Breaker Naming
- **Rules:**
  - Use name that appears at the breaker
  - Do NOT place unit/tag number/cubicle number into name
- **Specific Location Format:** Location, Bus Number, Breaker/Cubicle Number
- **Examples:** 3 location format examples

---

## Benefits of Refactor
1. **No API calls** - Faster load, no network dependency
2. **Better guidance** - Users understand conventions, not just see values
3. **Consistency** - Keywords and rules promote uniform naming
4. **Maintainable** - Easy to update examples and rules
5. **Lightweight** - Smaller component with no service dependencies
