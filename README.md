# Book Search API

## Overview

The Book Search API has been re-written as a modular backend service for fetching and normalizing book data from multiple third-party providers. The solution is designed for scalability, maintainability, and testability, following modern engineering practices and production-ready patterns.

## Architectural Design

This service abstracts away provider-specific API differences, supports multiple query types (author, publisher, year), and returns a consistent JSON structure. Each provider implements a common interface and handles its own query construction and response mapping (JSON or XML), enabling loose coupling and easy extensibility.

A unified parser layer was implemented to ensure all provider responses are converted into a consistent JSON format, so consumers would never need to handle provider-specific formats. The BookSearchApiClientService now acts as a Facade, exposing simple methods like getBooksByAuthor, getBooksByPublisher, and getBooksByYear while hiding the underlying complexity.

Caching at the service layer reduces repeated API calls and improves performance using a hybrid of in-memory storage and redis service for a production grade microservice. The in-memory caching is suitable to testing, and while redis cache is efficient enough in production, the hybrid caching is even more suitable for improved production efficiency. The in-memory storage uses short TTL and falls back on redis at expiry, leaving redis also to update the data by calling the API whenever it expires, reducing too frequent call to provider APIs. Concurrent queries to providers' API improve performance in the multi-provider setups.

The architecture follows Provider-Adapter, Facade, Parser patterns, supporting future expansion with minimal changes. Extensive unit and integration tests (mocking HTTP calls) ensure correctness and maintainability. TypeScript enforces strong typing and safety, and the solution is production-ready, and test-driven.

