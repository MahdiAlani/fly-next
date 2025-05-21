# FlyNext: Your Most Reliable Travel Companion

FlyNext is a full‑stack travel booking platform built with Next.js, Prisma, React and TailwindCSS. It simplifies flight and hotel search, comparison, and booking, providing an intuitive, accessible, and responsive web application. Containerized with Docker & Docker Compose, FlyNext can be deployed seamlessly across environments.

---

## Features

* **Flight & Hotel Search**: Auto‑complete city/airport dropdowns, date pickers, and dynamic filters (price, departure time, duration, layovers, star ratings, amenities).
* **User Accounts & Auth**: JWT‑based sign up, log in, log out, and profile editing with profile picture upload.
* **Booking Management**: Create and view itineraries (flights, hotels), cancel bookings, and download PDF invoices.
* **Real‑Time Data**: Integrates with Advanced Flights System (AFS) via a secured Next.js REST API.
* **Accessibility & Theming**: WCAG‑compliant semantic HTML, ARIA roles, keyboard navigation, and light/dark mode toggle.
* **Containerized Deployment**: Dockerized backend and frontend, with docker‑compose orchestration for database, API, and UI.

---

## Tech Stack

* **Frontend**: Next.js (App Router), React, TailwindCSS, React Hooks, Axios
* **Backend**: Next.js API Routes, Node.js, Prisma ORM (SQLite3 in dev, PostgreSQL in prod), JWT Auth
* **Data Sources**: AFS flight APIs, local hotels database
* **DevOps**: Docker, Docker Compose, GitHub Actions (CI/CD), Azure Static Web Apps (frontend)

---

## Getting Started

### Prerequisites

* Docker & Docker Compose
* Node.js (v20+) & npm (for local development)
* Git

### Clone the Repository

```bash
# Clone and enter Part 2 directory
git clone https://github.com/your-org/flynext.git
cd flynext/PP2
```

### Environment Variables

Copy the example `.env.example` to `.env` and fill in:

```ini
DATABASE_URL="file:./dev.db"
JWT_SECRET="your_jwt_secret"
AFS_API_KEY="your_advanced_flights_api_key"
```

Copy the example `.env.example` to `.env` and fill in:

```ini
DATABASE_URL="file:./dev.db"
JWT_SECRET="your_jwt_secret"
AFS_API_KEY="your_advanced_flights_api_key"
```

### Development (Local)

1. **Install dependencies**

   ```bash
   npm install
   ```
2. **Run startup script** (installs packages, runs migrations, seeds cities/airports data)

   ```bash
   bash startup.sh
   ```
3. **Start the server**

   ```bash
   bash run.sh
   ```
4. **Open in browser**: [http://localhost:3000](http://localhost:3000)

### Containerized (Docker)

1. **Build images & start services**

   ```bash
   docker-compose up --build
   ```
2. **Visit app**: [http://localhost:3000](http://localhost:3000)

---

## API Endpoints

See the [Postman collection](docs/postman_collection.json) or Swagger docs (`docs/collection.openapi`) for full REST API details:

* **/api/auth/**: signup, login, profile
* **/api/flights/**: search, details, book, cancel
* **/api/hotels/**: CRUD hotel & room types, search, book, availability
* **/api/bookings/**: list, cancel, invoice
* **/api/notifications/**: list, mark as read

---

## Testing

* Use Postman to import `postman_collection.json` for API testing.
* Swagger Editor can import `collection.openapi` for interactive documentation.

---

## Deployment

1. SSH into your server
2. Clone repo & set env variables
3. Run `docker-compose up --build -d`
4. Expose port 3000 (and 5432 for prod DB) as needed

---

## Contributing

We welcome contributions! Please fork, create a feature branch, and submit a PR.

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
