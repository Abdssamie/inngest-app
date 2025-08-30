This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
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

## Pre-Production Test Scenarios

### Concurrency & Locking
- **Concurrent Updates**: Two simultaneous PUT requests with different credentials should result in one 412 (optimistic lock) response
- **Deletion Race**: Clean failure when a credential is deleted while another request is linking to it

### Idempotency & Deduplication
- **Idempotent Retry**: Re-sending a POST with the same idempotency key returns the same result without creating duplicate links
- **Join Deduplication**: Duplicate credential IDs in payload are stored only once

### Security & Validation
- **Cross-Tenant Guard**: Attempting to use credentials from another user results in 403/400 error
- **Token Refresh**: When 10+ requests occur near token expiry, only one refresh happens while others reuse the new token

### Data Integrity
- **Rollback Safety**: Database remains unchanged if a process fails mid-execution (e.g., Zod validation fails)
- **Pagination Stability**: Workflow lists maintain consistent order when sorted by `updatedAt desc` with deterministic results