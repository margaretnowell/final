# DailyVibes API Documentation

Base URL (local development):
http://localhost:3000

---

## GET /api/entries

Retrieve the most recent vibe entries from the database.

### Method
GET

### URL
/api/entries

### Success Response (200 OK)

{
  "example": [
    {
      "id": 1,
      "created_at": "2025-12-21T18:30:00.000Z",
      "category": "Study",
      "rating": 8,
      "notes": "Worked on INST377 project"
    }
  ]
}

### Error Response (500)

{
  "error": "Error fetching entries"
}

---

## POST /api/entries

Create a new vibe entry.

### Method
POST

### URL
/api/entries

### Request Body Example

{
  "category": "Work",
  "rating": 6,
  "notes": "Meetings all afternoon"
}

### Success Response (201 Created)

{
  "id": 2,
  "created_at": "2025-12-21T20:15:00.000Z",
  "category": "Work",
  "rating": 6,
  "notes": "Meetings all afternoon"
}

### Error Responses

Missing fields:
{
  "error": "category and rating are required"
}

Invalid rating:
{
  "error": "rating must be a number between 1 and 10"
}

Server/database failure:
{
  "error": "Error inserting entry"
}
