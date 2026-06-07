Structured outputs help developers make Large Language Model responses more reliable.

In older prompt engineering approaches, developers often described the required output format using plain English. This could work sometimes, but it was fragile. If the model added an extra newline, changed the headings, forgot a footer, or used different formatting, the program could break.

A schema defines the shape of data. It describes the fields, types, and structure that the application expects. In TypeScript, Zod can be used to define schemas. In Python, Pydantic can be used.

Structured outputs force the model to return valid JSON that follows the schema. This makes it easier for an application to parse the model response and use it safely.

An HTTP API server allows a frontend or client app to send a request to the backend. The backend can process the request, call the AI model, and return JSON data.

Middleware is code that runs during the request and response cycle. Logger middleware records request information. Timing middleware measures how long a request takes. CORS middleware allows other applications to access the API.