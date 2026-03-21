# Steady Habits

A frontend-only, local-first habit tracker built with Next.js, Tailwind CSS, and Zustand.

## Features

- **Grid Layout**: Visualise your habits over time. The grid automatically adjusts to fit your screen width (desktop ~3 weeks, mobile ~1 week).
- **Habit Management**: Create, edit, delete, and hide habits. Customizable colors and default states.
- **Interactive Tracking**: Click cells to toggle status (Done, Not Done, N/A).
- **Groups**: Organize habits into collapsible groups. Drag and drop habits between groups.
- **Drag & Drop Reordering**: Reorder habits within lists and move them between groups easily.
- **Date Navigation**: Scroll back in time to view past data.
- **Streaks**: View current streaks for each habit.
- **Notes**: Keep a journal or notes below the grid.
- **Local Persistence**: All data is saved to your browser's LocalStorage. No account required.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **State Management**: Zustand (with persist middleware)
- **Drag & Drop**: @dnd-kit/core, @dnd-kit/sortable
- **Dates**: date-fns
- **Icons**: Lucide React

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) with your browser.

## Future Roadmap (Full Stack)

- User Authentication (Supabase/Auth.js)
- Cloud Sync (PostgreSQL + Prisma)
- Mobile App (React Native / PWA)
