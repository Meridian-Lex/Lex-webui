# Project Relationship Graph - Design Document

**Feature:** v1.1 Project Relationship Graph
**Status:** In Development
**Priority:** Medium
**Complexity:** High

---

## Overview

Visualize project relationships from PROJECT-MAP.md as an interactive force-directed graph, showing dependencies, shared code, and project hierarchy.

## Requirements

### Core Functionality
1. Parse PROJECT-MAP.md for project data
2. Extract relationships between projects
3. Display interactive force-directed graph
4. Node click for project details
5. Visual distinction for different relationship types

### Data Source

Read from `~/meridian-home/PROJECT-MAP.md` and parse markdown structure to extract:
- Project names
- Project status
- Dependencies
- Shared code relationships
- Project descriptions

### Visualization Library

**react-force-graph-2d** - Lightweight, performant, good for network graphs

### Technical Approach

**Backend:**
- Enhance existing projectService to parse PROJECT-MAP.md
- Extract relationship data
- API endpoint returning graph data structure

**Frontend:**
- New page: ProjectGraph.tsx
- Force-directed graph component
- Node/link styling
- Interactive controls (zoom, pan)
- Project details panel

## Data Structure

### Graph Format
```typescript
{
  nodes: [
    {
      id: "project-name",
      name: "Project Name",
      status: "active" | "archived" | "completed",
      description: string
    }
  ],
  links: [
    {
      source: "project-a",
      target: "project-b",
      type: "dependency" | "shared-code" | "related"
    }
  ]
}
```

## Implementation Plan

1. COMPLETE Design document
2. Backend graph data service
3. API endpoint for graph data
4. Frontend graph page
5. Force graph component integration
6. Node styling and interaction
7. Details panel
8. Navigation integration
9. Testing and deployment

---

**Start Time:** 2026-02-07
**Estimated Completion:** 2-3 hours
**Assigned To:** Cadet Meridian Lex
