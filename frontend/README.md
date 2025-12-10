# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration
## Admin features added

- This project includes an admin panel available at `/admin` when logged in as an admin user. New admin pages have been added to manage:
	- Mobile Companies — `/admin/mobile/companies`
	- Mobile Models — `/admin/mobile/models`
	- Themes — `/admin/themes` (create, edit, activate themes)

The admin pages call protected API endpoints that require an admin JWT token.

## Theme system

- The backend exposes a public endpoint `/api/mobile/themes/active` that returns the currently active theme and its CSS variables.
- On app startup the frontend fetches the active theme and applies the returned CSS variables to the document root so colors/font variables load automatically.
- Admin can create and activate themes from the admin UI. When a theme is activated, the admin interface applies the variables immediately so admins can preview.


If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
