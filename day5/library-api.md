# Library API Design

A REST API for a library's `books` resource.

## Endpoints

### List all books
- **Method:** GET
- **Path:** `/books`
- **Description:** Returns all books in the library.
- **Success status:** 200 OK

### Get one book
- **Method:** GET
- **Path:** `/books/{id}`
- **Description:** Returns the single book with the given id.
- **Success status:** 200 OK

### Create a book
- **Method:** POST
- **Path:** `/books`
- **Description:** Adds a new book to the library.
- **Example request body:**
```json
  {
    "title": "Things Fall Apart",
    "author": "Chinua Achebe",
    "year": 1958
  }
```
- **Success status:** 201 Created

### Update a book
- **Method:** PUT
- **Path:** `/books/{id}`
- **Description:** Replaces the details of an existing book.
- **Example request body:**
```json
  {
    "title": "Things Fall Apart",
    "author": "Chinua Achebe",
    "year": 1959
  }
```
- **Success status:** 200 OK

### Delete a book
- **Method:** DELETE
- **Path:** `/books/{id}`
- **Description:** Removes the book with the given id.
- **Success status:** 204 No Content

### List books by an author
- **Method:** GET
- **Path:** `/books?author=Chinua%20Achebe`
- **Description:** Returns only the books written by the given author, using a query parameter.
- **Success status:** 200 OK

## Error codes

### 400 Bad Request
- The request is invalid or missing required data.
- **Example:** `POST /books` with a body that has no `title`, or with `year` sent as text instead of a number.

### 404 Not Found
- The requested resource does not exist.
- **Example:** `GET /books/9999` when no book has the id 9999.