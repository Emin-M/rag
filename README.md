# RAG PDF Document Search

A simple **NestJS** project for uploading PDFs, extracting text, generating embeddings using OpenAI, storing them in PostgreSQL (with pgvector), and performing vector search queries.

---

## Technologies Used

- **Backend:** NestJS, TypeScript
- **Database:** PostgreSQL + pgvector extension
- **ORM:** Prisma
- **AI:** OpenAI Embeddings (`text-embedding-3-small`)
- **PDF Parsing:** pdf-parse

---

## Project Structure

```
src/
├─ ai/
│  └─ embedding.service.ts           # OpenAI embedding logic
├─ documents/
│  ├─ documents.controller.ts        # API endpoints
│  ├─ documents.service.ts           # CRUD operations
│  ├─ document-processor.service.ts  # Full processing pipeline
│  ├─ pdf-extractor.service.ts       # Extract text from PDFs
│  └─ text-chunker.service.ts        # Split text into chunks
├─ prisma/
│  └─ prisma.service.ts              # PrismaClient wrapper
├─ app.module.ts
└─ main.ts

uploads/                              # Uploaded PDF files
prisma/schema.prisma                  # DB schema
```

---

## Environment Variables

Create a `.env` file:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
OPENAI_API_KEY=your_openai_api_key_here
```

---

## API Endpoints

| Method | Endpoint | Description | Request Body Example | Response Example |
|--------|----------|-------------|----------------------|------------------|
| `POST` | `/documents/upload` | Upload a PDF file. | `multipart/form-data` with `file` field | `{ "id": "uuid", "name": "example.pdf", "path": "uploads/example.pdf", "status": "PENDING", "createdAt": "...", "updatedAt": "..." }` |
| `POST` | `/documents/:id/process` | Extract text, chunk, generate embeddings, and save to DB. | None | `{ "message": "Document processed successfully" }` |
| `POST` | `/documents/query` | Search documents using text query via vector similarity. | `{ "query": "Can horses speak?" }` | `[ { "content": "Horses can speak human languages", "similarity": 0.87, "documentId": "uuid", "position": 2 } ]` |

---

## Setup & Run

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Generate Prisma client and run migrations:**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

3. **Start development server:**
   ```bash
   npm run start:dev
   ```

4. **Open API at** `http://localhost:3000`

---

## Example Pipeline

```
[Upload PDF] → [Extract Text] → [Chunk Text] → [Generate Embeddings] → [Store in PostgreSQL] → [Query via Vector Search]
```

### 1. Upload a PDF:
```http
POST /documents/upload
```

### 2. Process PDF:
```http
POST /documents/:id/process
```

### 3. Query documents:
```http
POST /documents/query
```

**Request:**
```json
{
  "query": "Can cows fly?"
}
```

**Response:**
```json
[
  {
    "content": "Cows can fly",
    "similarity": 0.92,
    "documentId": "uuid",
    "position": 0
  }
]
```

---

## Notes

- Ensure `pgvector` extension is enabled in PostgreSQL.
- You need an OpenAI API key for embeddings.
- Uploaded PDFs are stored in the `uploads/` folder.
- The `/documents/query` endpoint uses vector search to find the most relevant text chunks from uploaded PDFs.
- Keep an eye on OpenAI API quotas to avoid rate limits.

---
