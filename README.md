This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Database Schema

This project uses [Drizzle ORM](https://orm.drizzle.team/) for database management. The schema is defined in `src/db/schema.ts`.

### ⚠️ CRITICAL: Do Not Delete or Edit the `kv` Table

The `kv` table in `src/db/schema.ts` is a **required built-in table** that must never be removed or modified. Deleting or editing this table definition will cause:

- Database schema conflicts during deployment
- Interactive prompts during `drizzle-kit push` that block app startup
- Deployment failures and health check timeouts

**Rules for the `kv` table:**

- ❌ Never delete the table definition
- ❌ Never modify the table name, fields, or types
- ❌ Never rename or comment out the table
- ✅ Always keep it exactly as defined in the template

**Always keep the `kv` table definition unchanged in your schema file, even if you don't use it.**

### Adding Custom Tables

Add your custom table definitions below the `kv` table in `src/db/schema.ts`. See the examples in that file for reference.

### Database Schema Push Behavior

The `db:push` command uses `drizzle-kit push` to synchronize your schema with the database. **This command is configured to fail fast** rather than prompt for user input.

**Important behavior:**

- The push command will **fail immediately** if there are ambiguous or destructive schema changes
- This is intentional to prevent blocking deployments
- Common failure scenarios:
  - Renaming columns (Drizzle can't distinguish rename from delete+add)
  - Renaming tables
  - Adding constraints to tables with existing data
  - Ambiguous schema changes

**When the push fails, you should:**

1. Make non-destructive changes instead:
   - **Instead of renaming columns:** Add a new column, migrate data, then remove the old column in a separate change
   - **Instead of renaming tables:** Create a new table with the desired name
   - **Instead of adding unique constraints to populated tables:** Clear data first or use nullable fields
2. Review the error message from `drizzle-kit push` to understand what change is ambiguous
3. Adjust your schema to be more explicit and non-destructive

## Getting Started

First, run the development server:

```bash
pnpm run dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
