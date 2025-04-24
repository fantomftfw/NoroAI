# Daily Tasks Screen Components

## Overview

This document outlines the components needed to recreate the daily tasks screen from the design image. All components will use shadcn/ui with Tailwind CSS for styling and Lucide React for icons.

## Component Breakdown

### Layout Components

1. **MainLayout**
   - Container for the entire screen with dark theme background
   - Navigation bottom bar
   - Header with date and navigation buttons

### Header Components

1. **AppHeader**
   - Status bar (time, network signal, battery) // ignore it
   - "Track mood" button with flower icon
   - Hamburger menu button
   - Date header ("Tuesday, April 15th, 2025") // it should be dynamic
   - Left/right navigation arrows for date switching

### Tasks Components

1. **TasksSection**

   - Section header with title and dropdown ("PLANNED (3)")
   - Collapsible content

2. **TaskCard**

   - Task icon (timer, checkmark, etc.)
   - Task title
   - Task status ("Paused", time remaining, etc.)
   - Circular checkmark button

### Bottom Navigation

1. **BottomNavBar**
   - Four navigation items: To-Do, Plan, Focus, Me
   - Each with icon and label
   - Active state for the current tab (To-Do)
   - Bottom indicator line

### Interactive Elements

1. **CircleCheckButton**
   - Circular outline button for completing tasks
2. **CollapsibleTaskList**

   - Expandable/collapsible sections for task groups

3. **FloatingActionButton**

   - Purple "+" button for adding new tasks

4. **QuickActionsBar**
   - Search and sparkle buttons at bottom

## Icons Needed (from Lucide React)

- Check/Checkmark
- Calendar/Schedule
- Timer/Clock
- Menu/Hamburger
- ChevronLeft/ChevronRight (for date navigation)
- Plus (for add button)
- Search
- Sparkles/Stars
- User/Profile
- Focus/Target

## Implementation Plan

1. Create base layout with correct dark theme background
2. Build header with date navigation
3. Implement task card components with correct styling
4. Create collapsible sections for planned and anytime tasks
5. Build bottom navigation bar with proper active states
6. Add floating action button and quick actions
7. Implement the review day card with illustration
8. Ensure all components are responsive and pixel-perfect

## Notes

- Use shadcn/ui components where possible (Button, Card, Collapsible)
- Custom styling with Tailwind CSS for specific design elements
- Implement proper dark mode theming throughout
- Use proper spacing and typography to match the design
