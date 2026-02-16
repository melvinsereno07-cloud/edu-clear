# SEE Organization Management System (SEE-OMS)

A deployment-ready, lightweight organization management portal with:
- Role-based login (Admin, Officer, Member)
- Request submission and approval workflow
- User management (Admin)
- Audit log trail

## Local usage

```bash
npm install
npm run build
npm run dev
```

Open: `http://localhost:5173`

## Vercel deployment

This project is configured for Vercel using `vercel.json`:
- Build command: `npm run build`
- Output directory: `dist`

### Deploy from Vercel Dashboard
1. Import this repository in Vercel.
2. Framework preset: **Other** (or auto-detect).
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Deploy.

> Note: CLI deployment (`vercel --prod`) requires the Vercel CLI package and network access to npm.
