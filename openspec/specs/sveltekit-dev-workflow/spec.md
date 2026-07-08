# Specification: SvelteKit Dev Workflow

## Purpose
Ensure all setup and port mapping documentation aligns with the SvelteKit development workflow.

## Requirements
- Documentation MUST specify `npm run dev` to start the frontend development server on port `5173`.
- Documentation MUST specify `npm run build` and `npm run preview` (port `4173`/`5173`) for production-like execution.
- Documentation MUST reference the backend Spring Boot REST API on port `8080`.
- All legacy references to Express backend serving EJS files on port `3000` or `3001` MUST be removed.

## Scenarios

### Scenario: Development Server Initialization
- GIVEN a developer is setting up the local environment
- WHEN they follow the instructions to start the frontend in `README.md` or `CONEXION.md`
- THEN the documentation MUST guide them to execute `npm run dev` and open `http://localhost:5173`.
