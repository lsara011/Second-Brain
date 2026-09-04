# SecondBrain

<p align="center">
  <img src="./assets/readme/second-brain-light.png" alt="SecondBrain purple logo on a light background" width="48%" />
  <img src="./assets/readme/second-brain-dark.png" alt="SecondBrain white logo on a dark background" width="48%" />
</p>

SecondBrain is an AI-powered study assistant designed for high school and university students. It brings course organization and guided learning support into one cross-platform application, helping students manage their academic lives, understand difficult concepts, prepare for exams, and build stronger study habits.

The project is founded on a simple principle: AI should support learning, not replace it. SecondBrain will guide students through problems, ask useful questions, explain ideas in different ways, and help create study plans. It will not complete coursework, assessments, or exams on a student's behalf. Educators remain essential to the learning process, and this application is intended to complement their teaching.

## Project goals

- Organize classes, schedules, assignments, and exam dates.
- Create personalized study plans based on a student's available time and priorities.
- Explain course material at an appropriate level without simply supplying answers.
- Generate practice questions, quizzes, flashcards, and review sessions.
- Encourage active recall, critical thinking, and independent problem-solving.
- Help students identify topics that need additional practice.
- Make responsible AI assistance accessible across mobile and web platforms.

## Current status

SecondBrain is in active development. The application supports account creation and login, protected application routes, editable student profiles, semester schedule creation, local class storage, dashboard views, theme settings, and an AI study companion that can answer questions in the context of a selected class.

Supabase Authentication manages user accounts and persistent login sessions. The Django backend provides the development-only connection to OpenAI so provider credentials remain outside the mobile and web application. The AI Companion currently sends the selected class and the student's question to this backend. Authentication of Django API requests, rate limiting, production deployment, and cloud synchronization of schedules still need to be implemented before public release.

## Implemented features

- Create a schedule for a named semester.
- Add multiple classes with names, start and end times, meeting days, professor, location, and an optional description.
- Validate required schedule information before saving.
- Persist schedules and classes locally with Expo SQLite.
- Display saved semesters and their associated classes on the dashboard.
- Automatically refresh the dashboard after a schedule is created.
- Navigate between Dashboard, Add Class, AI Companion, Profile, and Settings using a shared bottom navigation bar.
- Create accounts and sign in with email and password through Supabase Authentication.
- Restore authenticated sessions and protect application screens from signed-out users.
- Sign out from the Settings screen.
- View and edit a student profile containing a name, grade, graduation year, major, email, and profile-photo URL.
- Save editable profile information to the authenticated user's Supabase metadata.
- Switch between automatic, light, and dark appearance modes.
- Select a class from the current semester as the context for an AI Companion conversation.
- Send a question from the AI Companion to the local Django API and display the response.
- Run on Android, iOS, and web through Expo.
- Start and validate a Django development backend.
- Keep local environment settings and AI credentials out of version control.
- Verify that the backend can communicate with OpenAI without placing provider credentials in the client.

## Local database

The application uses a persistent `second-brain.db` SQLite database. A schedule owns one or more classes through the `classes.schedule_id` foreign key:

```text
schedules
├── id
├── semester_name
└── created_at
       │
       └── classes
           ├── schedule_id
           ├── name
           ├── hours
           ├── professor
           ├── description
           ├── days
           └── location
```

Foreign-key enforcement and cascade deletion are enabled. Indexes support lookup by semester name and schedule ID.

During development, inspect the on-device database by pressing `Shift + M` in the running Expo terminal and selecting **Open expo-sqlite**.

## Current technology

The client application currently uses:

- **TypeScript** for safer, more maintainable application code.
- **React 19** for building the component-based user interface.
- **React Native 0.86** for creating native Android and iOS experiences from a shared codebase.
- **Expo SDK 57** for development tooling, device capabilities, builds, and cross-platform support.
- **Expo Router** for file-based navigation and screen transitions.
- **Expo SQLite** for persistent on-device schedules and classes.
- **Supabase Authentication** for accounts, persistent sessions, and user profile metadata.
- **React Native Paper** and **Expo UI** for interface components.
- **React Native Reanimated** and **React Native Gesture Handler** for animations and interactions.
- **Tamagui** for interface primitives and toast notifications.
- **React Native SVG** for cross-platform navigation icons.
- **React Native Web** so the application can also run in a browser.

The backend foundation uses:

- **Python and Django** for the server application, administration tools, routing, and future API endpoints.
- **SQLite** for local backend development and early data-model work.
- **OpenAI's server-side SDK** for the initial AI connectivity experiment.
- **Environment-based configuration** to keep credentials and deployment-specific settings separate from the source repository.

## Authentication and profiles

Signed-out users can access only the login and signup screens. After authentication, Expo Router makes the main application routes available and restores the session when the application starts again.

The Profile screen reads the signed-in user's email and metadata from Supabase. Students can update their name, grade, graduation year, major, and a profile-photo URL. When no photo is available, the interface displays the student's initials. Schedules and classes are still device-local, so they do not currently follow a user to another device.

## Backend and AI integration

The mobile application will communicate with the Django backend rather than calling an AI provider directly. The backend receives an authenticated request, validates it, applies the application's learning and safety rules, communicates with the selected AI service, and returns an appropriate response to the student. This design keeps provider credentials away from distributed client builds and creates one controlled place for authentication, rate limits, safety policies, logging, and usage monitoring.

```text
Expo / React Native application
              |
              | HTTPS requests
              v
        Django API
      /               \
Database         AI provider
                   OpenAI
```

The current development integration allows the AI Companion screen to call a dedicated Django endpoint. The student must choose a class from the most recently created semester before sending a question. Django validates the request, adds the selected course as context, applies the Atlas tutoring instructions, requests a response from OpenAI, and returns the generated text to the application.

This endpoint is intentionally available only while Django is in development mode. It does not yet validate a Supabase access token, so it must not be deployed publicly in its current form.

The AI layer will be evaluated for:

- Quality of explanations and tutoring behavior.
- Ability to follow educational guardrails.
- Structured output and tool-calling support.
- Privacy, security, and data-retention policies.
- Latency, reliability, context limits, and cost.
- Support for text, images, documents, and other useful learning formats.

## Responsible AI principles

SecondBrain should be designed to:

- Guide students toward an answer instead of doing assessed work for them.
- Prefer hints, questions, examples, and step-by-step explanations.
- Clearly communicate that AI output can be incomplete or incorrect.
- Encourage students to verify important information with course materials and educators.
- Respect academic-integrity expectations established by schools and instructors.
- Protect student information and collect only the data required by the product.
- Include additional safeguards when the application is used by minors.

## Future roadmap

- Add assignments and exam dates to saved schedules.
- Add schedule editing and deletion.
- Add direct profile-photo selection and secure uploads with Supabase Storage.
- Synchronize schedules and classes with authenticated cloud accounts.
- Validate Supabase access tokens on Django API requests.
- Add production-ready Django API authentication and deployment configuration.
- Add request validation, rate limiting, safety checks, and usage monitoring.
- Add guided tutoring and concept explanations.
- Generate quizzes, flashcards, and practice sessions.
- Support document or course-note uploads with source-grounded answers.
- Add progress tracking, reminders, and study recommendations.
- Introduce automated tests, monitoring, and AI-quality evaluations.

## Getting started

### Requirements

- Node.js 22.13 or newer
- npm
- Expo Go, an Android emulator, an iOS simulator, or a web browser

### Run the application

Create a local `.env.local` file in the project root. Supply your own values and never commit this file:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_KEY=your_supabase_publishable_or_anon_key
EXPO_PUBLIC_API_URL=http://your_backend_address:8000
```

The Supabase publishable or anonymous key is intended for client initialization. Never place a Supabase `service_role` key, an OpenAI API key, or another private server credential in an `EXPO_PUBLIC_` variable.

```bash
npm install
npx expo start --clear
```

You can also start a specific platform:

```bash
npm run android
npm run ios
npm run web
```

### Run the development backend

Set `OPENAI_API_KEY` in the backend process environment, then start Django from the `server` directory using the project's Python environment. The current Django settings do not load `server/.env` automatically.

```bash
cd server
export OPENAI_API_KEY=your_openai_api_key
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

For an iOS simulator or local web browser, the API URL can normally use `127.0.0.1`. The Android emulator uses `10.0.2.2` to reach the host computer. A physical phone must use the development computer's local network address, and Django must allow that host.

### Validate the project

```bash
npx tsc --noEmit
cd server && python manage.py test
```

## Security notes

- Local environment files are ignored by Git; `.env.example` files may contain variable names but must never contain real credentials.
- AI provider credentials belong only on the Django server.
- Supabase Row Level Security should protect any future cloud database tables or storage buckets.
- The current Django AI endpoint is for local development and requires authentication and rate limiting before deployment.

## Contributing

Contributions should support the project's educational purpose and responsible-AI principles. New AI features should be evaluated not only for whether they work, but also for whether they help students learn independently and safely.

## License

See [LICENSE](./LICENSE) for license information.
