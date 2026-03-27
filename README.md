# Customer API (service template)

Greenfield **B2B Customer API** template: Node.js + TypeScript, **OpenAPI 3** as the HTTP contract, and typical repository hygiene (CI, Dependabot, Docker).

This repository is intentionally **not** Postman-specific. The canonical API description lives at [`openapi.yaml`](openapi.yaml) in the repository root. Tools that integrate with your **local filesystem** (including Postman) can watch or import that file while you iterate on the contract and implementation together.

## Quickstart

**Requirements:** Node.js 20+ (see [`.nvmrc`](.nvmrc)).

```bash
npm ci
cp .env.example .env   # optional
npm run dev
```

- Health: `GET http://localhost:3000/health`
- API base: `GET http://localhost:3000/v1/customers`

## OpenAPI contract

- **Spec file:** [`openapi.yaml`](openapi.yaml)
- **Lint:** `npm run validate:openapi`

The service validates requests and responses against this document at runtime (`express-openapi-validator`). When you change the contract, update the YAML and adjust handlers/tests in the same change.

`components.securitySchemes.bearerAuth` documents how you might secure the API later; this template does not validate bearer tokens.

## Scripts

| Script                     | Purpose                                                     |
| -------------------------- | ----------------------------------------------------------- |
| `npm run dev`              | Run the API with hot reload (`tsx`)                         |
| `npm run build`            | Compile TypeScript to `dist/`                               |
| `npm start`                | Run compiled output                                         |
| `npm test`                 | Vitest + Supertest                                          |
| `npm run validate:openapi` | Redocly lint on the OpenAPI file                            |
| `npm run ci`               | Format check, ESLint, typecheck, OpenAPI lint, tests, build |

## Docker

```bash
docker compose up --build
```

The image runs as a non-root user and copies [`openapi.yaml`](openapi.yaml) next to `dist/` so runtime validation can load the spec.

## Data storage

The implementation uses an **in-memory** store for easy local demos. Replace it with your operational database or CRM integration in a real deployment.

Use **synthetic** names and emails in examples (see tests); do not commit real customer PII.

## CI and GitHub settings

This repo includes a [GitHub Actions workflow](.github/workflows/ci.yml) that runs on pushes and pull requests to `main`/`master`. Workflows run automatically once the files exist on GitHub and Actions is enabled for the repository.

**Configured in GitHub (not in this repo):** branch protection, required status checks, required reviewers, and org-level Actions policies. Enable **Template repository** under repository settings if you want others to generate new repos from this layout.

## Creating a new repository from this template

1. Initialize git locally if you have not already:

   ```bash
   git init
   git add .
   git commit -m "Initial import from customer API template"
   ```

2. Create an empty repository on GitHub, add it as `origin`, and push (for example `git push -u origin main`).
3. Optional: in the GitHub repository **Settings**, enable **Template repository** so others can generate new repos from this layout.
4. Replace placeholders such as [`CODEOWNERS`](CODEOWNERS) with your org’s teams and process.
5. Configure branch protection to require the CI workflow (and Docker job, if you keep it).

## License

See [LICENSE](LICENSE).
