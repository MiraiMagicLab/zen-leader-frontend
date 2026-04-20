# Users Management - API Mapping Hien Tai Va API Con Thieu

Tai lieu nay ghi dung theo implementation hien tai cua frontend `UsersPage` (`/dashboard/users`) de ban giao cho backend dev.

## 1) Backend APIs dang ton tai (frontend dang goi that)

Base URL: `/api/v1`

- `GET /users?page={page}&size={size}&field={field}&direction={direction}`
  - Dang duoc goi trong `userApi.getUsers()` de load list.
- `GET /users/{userId}`
  - Dang duoc goi trong:
    - `View details`
    - `Refresh user`
    - `Refresh data` trong details dialog
- `GET /users/me`
- `PUT /users/me`

## 2) Mapping dung theo UI hien tai (as-is)

Tu dropdown `User actions` trong moi row:

- `View details`
  - Goi: `GET /api/v1/users/{userId}`
  - Hanh vi: mo dialog chi tiet va hien data moi nhat.

- `Refresh user`
  - Goi: `GET /api/v1/users/{userId}`
  - Hanh vi: cap nhat lai row user trong table.

- `Manage access`
  - Hien tai: chi mo dialog UI (roles + verified + active), **chua goi API**.
  - Nut `Save changes`: hien notice backend chua co endpoint.

- `Copy email`
  - Hien tai: clipboard local, **khong goi API**.

- `Copy user ID`
  - Hien tai: clipboard local, **khong goi API**.

- `Deactivate user`
  - Hien tai: mo confirm dialog, **khong goi API**.

## 3) APIs backend con thieu de bat full flow hien tai

Duoi day la danh sach API toi thieu de dung voi UI da map san:

### 3.1 Update status user (active/verified)

- **Method + URL**: `PATCH /api/v1/users/{userId}/status`
- **Dung cho action**:
  - `Deactivate user`
  - toggle `Verified account` trong `Manage access`
  - toggle `Active account` trong `Manage access`

#### Request body de xuat

```json
{
  "active": false,
  "verified": true
}
```

#### Response de xuat

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "admin@gmail.com",
    "displayName": "admin",
    "active": false,
    "verified": true,
    "roles": ["admin"],
    "createdAt": "2026-04-12T08:46:01.778556Z",
    "updatedAt": "2026-04-20T09:00:00.000000Z"
  }
}
```

---

### 3.2 Replace roles cua user

- **Method + URL**: `PUT /api/v1/users/{userId}/roles`
- **Dung cho action**: `Manage access` (phan roles)

#### Request body de xuat

```json
{
  "roles": ["admin", "mentor"]
}
```

#### Response de xuat

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "admin@gmail.com",
    "displayName": "admin",
    "active": true,
    "verified": true,
    "roles": ["admin", "mentor"],
    "createdAt": "2026-04-12T08:46:01.778556Z",
    "updatedAt": "2026-04-20T09:00:00.000000Z"
  }
}
```

---

### 3.3 (Khuyen nghi) API lay role options dong

- **Method + URL**: `GET /api/v1/roles`
- **Dung cho action**: render options trong `Manage access`.
- Hien tai frontend dang hard-code: `["admin", "mentor", "member"]`.

#### Response de xuat

```json
{
  "success": true,
  "data": [
    { "name": "admin", "description": "System administrator" },
    { "name": "mentor", "description": "Mentor role" },
    { "name": "member", "description": "Default member role" }
  ]
}
```

## 4) Contract field name hien tai can thong nhat

Backend response hien tai dang tra:

- `active`
- `verified`

Frontend model dang su dung:

- `isActive`
- `isVerified`

Frontend da co normalize tam thoi trong `userApi`:

- `isActive = isActive ?? active ?? false`
- `isVerified = isVerified ?? verified ?? false`

De tranh sai lech ve sau, de nghi backend chot 1 contract ro rang trong OpenAPI (giu `active/verified` hoac doi sang `isActive/isVerified`).

## 5) Goi y quyen han

Cac endpoint quan tri users nen yeu cau role `ADMIN`:

- `PATCH /users/{id}/status`
- `PUT /users/{id}/roles`
- `GET /roles`
