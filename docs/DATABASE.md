# Database Design

## Overview

The platform uses **MySQL** as its primary relational database. This document describes the conceptual data model and expected entities.

> **Note:** This is a conceptual design. The final SQL schema has not been created yet.
> Relationships marked as PROPOSED require further discussion and approval.

---

## Conceptual Entities

### Users

| Field | Type | Notes |
|-------|------|-------|
| id | Primary Key | Auto-increment |
| email | String | Unique, required |
| password_hash | String | Hashed, never stored in plain text |
| first_name | String | Required |
| last_name | String | Required |
| phone | String | Optional |
| role | Enum | customer, admin |
| status | Enum | active, suspended, deleted |
| created_at | Timestamp | |
| updated_at | Timestamp | |

### Products

| Field | Type | Notes |
|-------|------|-------|
| id | Primary Key | |
| name | String | Required |
| description | Text | |
| price | Decimal | Required |
| sku | String | Unique, optional |
| category_id | Foreign Key | References Categories |
| status | Enum | active, inactive, archived |
| created_at | Timestamp | |
| updated_at | Timestamp | |

### Categories

| Field | Type | Notes |
|-------|------|-------|
| id | Primary Key | |
| name | String | Required |
| parent_id | Foreign Key | Self-referencing (PROPOSED) |
| sort_order | Integer | |
| created_at | Timestamp | |

### Inventory

| Field | Type | Notes |
|-------|------|-------|
| id | Primary Key | |
| product_id | Foreign Key | References Products |
| quantity | Integer | Current stock level |
| low_stock_threshold | Integer | PROPOSED |
| updated_at | Timestamp | |

**Relationship:** PROPOSED — Inventory as a separate entity vs. quantity on Products table.

### Cart

| Field | Type | Notes |
|-------|------|-------|
| id | Primary Key | |
| user_id | Foreign Key | References Users |
| created_at | Timestamp | |
| updated_at | Timestamp | |

### Cart Items

| Field | Type | Notes |
|-------|------|-------|
| id | Primary Key | |
| cart_id | Foreign Key | References Cart |
| product_id | Foreign Key | References Products |
| quantity | Integer | |
| added_at | Timestamp | |

### Wishlist

| Field | Type | Notes |
|-------|------|-------|
| id | Primary Key | |
| user_id | Foreign Key | References Users |
| product_id | Foreign Key | References Products |
| added_at | Timestamp | |

**Relationship:** PROPOSED — Single wishlist per user vs. multiple named wishlists.

### Orders

| Field | Type | Notes |
|-------|------|-------|
| id | Primary Key | |
| user_id | Foreign Key | References Users |
| status | Enum | pending, confirmed, processing, shipped, delivered, cancelled |
| total_amount | Decimal | |
| shipping_address | Text/JSON | PROPOSED — inline vs. separate addresses table |
| notes | Text | Optional |
| created_at | Timestamp | |
| updated_at | Timestamp | |

### Order Items

| Field | Type | Notes |
|-------|------|-------|
| id | Primary Key | |
| order_id | Foreign Key | References Orders |
| product_id | Foreign Key | References Products |
| quantity | Integer | |
| unit_price | Decimal | Price at time of order |
| total_price | Decimal | |

### Payments

| Field | Type | Notes |
|-------|------|-------|
| id | Primary Key | |
| order_id | Foreign Key | References Orders |
| amount | Decimal | |
| method | Enum | OPEN — payment methods to be decided |
| status | Enum | pending, completed, failed, refunded |
| transaction_id | String | External payment reference |
| created_at | Timestamp | |

### Reviews

| Field | Type | Notes |
|-------|------|-------|
| id | Primary Key | |
| user_id | Foreign Key | References Users |
| product_id | Foreign Key | References Products |
| rating | Integer | 1-5 |
| comment | Text | Optional |
| status | Enum | PROPOSED — pending, approved, rejected (moderation) |
| created_at | Timestamp | |

### Notifications

| Field | Type | Notes |
|-------|------|-------|
| id | Primary Key | |
| user_id | Foreign Key | References Users |
| type | String | Order update, promotion, etc. |
| title | String | |
| message | Text | |
| is_read | Boolean | |
| created_at | Timestamp | |

---

## Open Questions

- [ ] Separate addresses table vs. inline on orders?
- [ ] Product images — separate table or JSON field?
- [ ] Multiple wishlists per user or single?
- [ ] Inventory as separate entity or field on products?
- [ ] Soft delete strategy (deleted_at vs. status field)
- [ ] Audit logging table structure
- [ ] Discount/coupon entity design
- [ ] Database character set (utf8mb4 recommended)
- [ ] Index strategy
- [ ] Migration tool selection
