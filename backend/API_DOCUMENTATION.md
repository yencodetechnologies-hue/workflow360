# Workflow360 API Documentation

This document provides a comprehensive overview of the available API endpoints for the Workflow360 backend.

**Base URL:** `http://localhost:5000/api`

---

## 📦 Product Management

### 1. Get All Products
Retrieves a list of all products in the database.
- **Method:** `GET`
- **Endpoint:** `/products`
- **Response:** Array of product objects.

### 2. Get Product by ID
Retrieves details for a specific product using its MongoDB `_id`.
- **Method:** `GET`
- **Endpoint:** `/products/:id`
- **Response:** Product object or `404 Not Found`.

### 3. Create Product
Adds a new product to the inventory.
- **Method:** `POST`
- **Endpoint:** `/products`
- **Payload:**
  ```json
  {
    "s_no": "101",
    "category": "Electronics",
    "particulars": "RFID Reader",
    "rate": "1500",
    "sku": "ELEC-101",
    "reorderLevel": 5
  }
  ```

### 4. Update Product
Updates an existing product's details.
- **Method:** `PUT`
- **Endpoint:** `/products/:id`
- **Payload:** Any partial product object.

### 5. Delete Product
Removes a product from the database.
- **Method:** `DELETE`
- **Endpoint:** `/products/:id`

---

## 🏷️ RFID Tag Management

### 6. Assign Tag to Product
Links a physical RFID tag ID to a specific product ID.
- **Method:** `POST`
- **Endpoint:** `/products/assign-tag`
- **Payload:**
  ```json
  {
    "productId": "WF360-0346",
    "tagId": "E2000017221101441890ABCD"
  }
  ```

### 7. Scan RFID Tag
Fetches product details by scanning a tag ID. **Note:** This automatically logs the scan event in the history.
- **Method:** `POST`
- **Endpoint:** `/products/scan`
- **Payload:**
  ```json
  {
    "tagId": "E2000017221101441890ABCD"
  }
  ```
- **Response (Success):** `{ "status": "success", "product": { ... } }`
- **Response (Not Found):** `{ "status": "not_found" }`

### 8. Bulk Assign Tags
Assigns multiple tags to multiple products in one request.
- **Method:** `POST`
- **Endpoint:** `/products/bulk-assign`
- **Payload:** Array of assignment objects.
  ```json
  [
    { "productId": "WF360-001", "tagId": "TAG001" },
    { "productId": "WF360-002", "tagId": "TAG002" }
  ]
  ```

---

## 📜 Scan History

### 9. Get Scan History
Retrieves all successful RFID scan events, sorted by the most recent first.
- **Method:** `GET`
- **Endpoint:** `/products/scan-history`
- **Response:** Array of scan log objects.

---

## 🖼️ Media

### 10. Upload Image
Uploads a product image directly to Cloudinary.
- **Method:** `POST`
- **Endpoint:** `/products/upload`
- **Payload:** `multipart/form-data` with field `image`.
- **Response:**
  ```json
  {
    "message": "File uploaded to Cloudinary!",
    "filePath": "https://res.cloudinary.com/..."
  }
  ```

---

## 🛠️ Configuration & Seeding

### Environment Variables (`.env`)
- `PORT`: Server port (default 5000).
- `MONGODB_URI`: Connection string for MongoDB.
- `FORCE_SEED`:
  - `true`: Wipes the database and re-seeds from `price_list_2026.json` on startup.
  - `false`: Normal operation (persists data).

> [!CAUTION]
> Ensure `FORCE_SEED` is set to `false` in production to prevent data loss.
