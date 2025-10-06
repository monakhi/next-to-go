# Next To Go

A Vue 3 + TypeScript application that displays upcoming horse, harness, and greyhound races using the Neds Racing API.

---

## Features

- **Next to Go races** – Shows the next 5 races by category (Horse, Harness, Greyhound).
- **Live countdowns** – Per-race countdown timers with automatic refresh.
- **Auto-refresh polling** – Intelligent re-fetching when a race expires or visible races drop below 5.
- **Category persistence** – Selected category is remembered via `localStorage`.
- **Local timezone display** – Race start times are shown in the user’s local timezone.
- **Vuex store integration** – Centralized state management.
- **TypeScript strict mode** – Strongly typed store, API, and utils.
- **Unit tests with Vitest** – Tests for API adapter, store, and composables.

---

## Screenshot

---

## Tech Stack

- [Vue 3](https://vuejs.org/) (Composition API + `<script setup>`)
- [TypeScript](https://www.typescriptlang.org/)
- [Vuex](https://vuex.vuejs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vitest](https://vitest.dev/) (unit testing)
- [Vue Test Utils](https://test-utils.vuejs.org/)

---

## Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/next-to-go.git
   cd next-to-go
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create environment files:  
   Add `.env.development` and `.env.production` in the project root with:

   ```ini
   VITE_NEDS_API_URL=https://api.neds.com.au/rest/v1/racing/
   ```

   You can also add a base `.env` file if needed.

4. Start the dev server:

   ```bash
   npm run dev
   ```

5. Build for production:

   ```bash
   npm run build
   ```

6. Run unit tests:
   ```bash
   npm run test
   ```

---

## Testing

We use **Vitest** for unit testing. Key tests include:

- **API Adapter (`api/neds.ts`)**
  - Maps Neds API payload into strongly typed `Race` objects.
  - Validates count escalation (10, 20, 30…) until 5 races available.
- **Composable (`useClockAndPoll.ts`)**
  - Ensures ticks every second.
  - Polls when earliest race expiry passes +60s.
  - Polls when visible races < 5.
- **Vuex Store (`store/index.ts`)**
  - Persists selected category via `localStorage`.
  - Getter `nextFive` filters, sorts, and slices to 5 races.
  - Actions handle error and loading states.

Run in watch mode for TDD:

```bash
npm run test:watch
```

---

## Project Structure

```
src/
├── api/              # API adapter (Neds Racing)
├── assets/           # SVG icons (Horse, Harness, Greyhound)
├── components/       # Reusable Vue components
├── composables/      # Vue composables (useClockAndPoll)
├── constants/        # Categories, IDs, mappings
├── store/            # Vuex store (state, getters, actions)
├── utils/            # Time and formatting utilities
└── views/            # Pages (NextToGoPage.vue)
```

---

## Timezone Handling

Race advertised start times are converted to **the user’s local timezone** with `Intl.DateTimeFormat`.  
Example:

- Sydney user → `01:35 AEDT`
- London user → `14:35 GMT`

---

## Scripts

| Command              | Description                                 |
| -------------------- | ------------------------------------------- |
| `npm run dev`        | Start development server                    |
| `npm run build`      | Build for production                        |
| `npm run preview`    | Preview production build                    |
| `npm run lint`       | Run ESLint checks                           |
| `npm run type-check` | Run TypeScript checks without emitting code |
| `npm run test`       | Run all unit tests                          |
| `npm run test:watch` | Run tests in watch mode (TDD)               |

---

## Environment Variables

| Variable            | Description           |
| ------------------- | --------------------- |
| `VITE_NEDS_API_URL` | Base URL for Neds API |
