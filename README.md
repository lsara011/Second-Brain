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

SecondBrain is in active development. The application currently supports creating semester schedules, saving them locally on the device, and displaying saved classes on the dashboard. The AI companion, profile, and settings screens are scaffolded for future development.

A Django backend has been initialized to become the secure connection between the client, persistent server-side data, and AI services. OpenAI connectivity is being tested from this backend so provider credentials remain outside the mobile and web application. This is currently an integration experiment rather than a public application endpoint: the React Native client is not yet sending prompts to Django, and authentication, request validation, rate limiting, and production deployment still need to be implemented.

## Implemented features

- Create a schedule for a named semester.
- Add multiple classes with names, start and end times, meeting days, professor, location, and an optional description.
- Validate required schedule information before saving.
- Persist schedules and classes locally with Expo SQLite.
- Display saved semesters and their associated classes on the dashboard.
- Automatically refresh the dashboard after a schedule is created.
- Navigate between Dashboard, Add Class, AI Companion, Profile, and Settings using a shared bottom navigation bar.
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

The current AI experiment confirms that the server can request and receive generated text. It does not yet expose that behavior to the application. The next stage is to place the integration behind a dedicated Django endpoint and add safeguards before connecting the AI Companion screen.

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
- Add accounts, authentication, and student profiles.
- Build and connect secure Django API endpoints.
- Move the OpenAI experiment behind a dedicated service and authenticated endpoint.
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

### Validate the project

```bash
npx tsc --noEmit
```

## Contributing

Contributions should support the project's educational purpose and responsible-AI principles. New AI features should be evaluated not only for whether they work, but also for whether they help students learn independently and safely.

## License

See [LICENSE](./LICENSE) for license information.
