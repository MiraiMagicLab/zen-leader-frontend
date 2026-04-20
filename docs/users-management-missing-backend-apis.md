# Users Management - Missing Backend APIs

Tai lieu nay tong hop cac API backend con thieu de hoan tat cac thao tac tai trang `Dashboard > Users` (`/dashboard/users`).

## 1) Hien trang backend da co

Base URL: `/api/v1`

- `GET /users` - Lay danh sach user co phan trang
- `GET /users/{userId}` - Lay chi tiet user
- `GET /users/me` - Lay thong tin user hien tai
- `PUT /users/me` - Cap nhat user hien tai

## 2) API con thieu can bo sung

## 2.1 Update user status (active/verified/ban)

- **Method + URL**: `PATCH /api/v1/users/{userId}/status`
- **Muc dich**:
  - Khoa/mo khoa user (`active`)
  - Danh dau xac minh (`verified`)
  - (Tuy chon) set thoi diem het han cam (`bannedUntil`)

### Request body de xuat

```json
{
  "active": true,
  "verified": true,
  "bannedUntil": null
}
```

### Validation de xuat

- `userId` phai ton tai
- Khong cho admin tu khoa chinh minh (neu co rule)
- `bannedUntil` phai la ISO 8601 va >= now neu khong null

### Response de xuat

```json
{
  "success": true,
  "data": {
    "id": "f0f58535-5c00-4bc4-bef7-048140e7f580",
    "email": "admin",
    "displayName": "admin",
    "active": true,
    "verified": true,
    "verifiedAt": "2026-04-12T08:46:01.701386Z",
    "bannedUntil": null,
    "roles": ["admin"],
    "createdAt": "2026-04-12T08:46:01.778556Z",
    "updatedAt": "2026-04-20T09:00:00.000000Z"
  }
}
```

---

## 2.2 Replace user roles

- **Method + URL**: `PUT /api/v1/users/{userId}/roles`
- **Muc dich**: Gan lai danh sach role cho 1 user (replace toan bo roles)

### Request body de xuat

```json
{
  "roles": ["admin", "mentor"]
}
```

### Validation de xuat

- Role phai ton tai trong he thong
- Khong de user khong co role nao (neu business rule yeu cau)
- Khong cho phep xoa role `admin` cua chinh tai khoan dang dang nhap (neu co rule)

### Response de xuat

```json
{
  "success": true,
  "data": {
    "id": "f0f58535-5c00-4bc4-bef7-048140e7f580",
    "email": "admin",
    "displayName": "admin",
    "roles": ["admin", "mentor"],
    "active": true,
    "verified": true,
    "createdAt": "2026-04-12T08:46:01.778556Z",
    "updatedAt": "2026-04-20T09:00:00.000000Z"
  }
}
```

---

## 2.3 Get roles list (de render UI role picker)

- **Method + URL**: `GET /api/v1/roles`
- **Muc dich**: Lay danh sach role hop le de frontend render options

### Response de xuat

```json
{
  "success": true,
  "data": [
    {
      "name": "admin",
      "description": "System administrator"
    },
    {
      "name": "mentor",
      "description": "Mentor role"
    },
    {
      "name": "member",
      "description": "Default member role"
    }
  ]
}
```

---

## 2.4 Optional - Deactivate shortcut endpoint (neu muon endpoint rieng)

Neu team backend muon endpoint ro nghia thay vi dung status patch:

- **Method + URL**: `PATCH /api/v1/users/{userId}/deactivate`
- **Request body**: co the rong hoac:

```json
{
  "reason": "Manual moderation"
}
```

- **Hanh vi**: set `active=false`

> Khuyen nghi: Chi can `PATCH /users/{id}/status` la du, endpoint nay la optional.

---

## 3) Luu y contract field name (quan trong)

Frontend dang su dung model:

- `isActive`
- `isVerified`

Trong khi backend hien tai response dang la:

- `active`
- `verified`

De tranh mismatch lan nua, de xuat backend thong nhat 1 trong 2 cach:

1. **Cach A (khuyen nghi)**: backend tra `isActive`, `isVerified` dung theo DTO ten boolean Java.
2. **Cach B**: giu `active`, `verified` va document ro contract trong OpenAPI.

> Hien frontend da co normalize tam thoi, nhung van nen thong nhat contract chinh thuc.

---

## 4) Yeu cau phan quyen de xuat

Nhung API quan tri tren nen yeu cau role `ADMIN`:

- `PATCH /users/{id}/status`
- `PUT /users/{id}/roles`
- `GET /roles`

Va can audit log cho cac thao tac:

- thay doi status
- thay doi role

---

## 5) Frontend se goi API nhu the nao sau khi backend xong

- Tu menu row user:
  - `Manage access` -> goi:
    1) `PUT /users/{id}/roles`
    2) `PATCH /users/{id}/status`
  - `Deactivate user` -> goi:
    - `PATCH /users/{id}/status` voi `{ "active": false }`

Neu backend muon, co the gop role + status vao **1 endpoint duy nhat**:

- `PATCH /api/v1/users/{userId}` voi body gom `roles`, `active`, `verified`, `bannedUntil`.

Khi do frontend chi can 1 request/save.
