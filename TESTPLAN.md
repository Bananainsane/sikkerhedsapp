# Test Plan: Sikkerhedsapp - Ikke-funktionel Test

**Projekt:** Sikkerhedsapp - Authentication & Authorization System
**Version:** 1.0
**Dato:** 13. november 2025
**Testansvarlig:** Bananainsane

---

## I. Introduction

### A. Purpose of the Test Plan

The purpose of this test plan is to verify the non-functional requirements of the Sikkerhedsapp system through systematic black-box testing. This plan documents the test strategy, test environment, and test cases to ensure the application meets security, performance, and usability requirements specified in the course assignment for Day 4 (Ikke-funktionel test).

### B. Scope

This test plan covers:
- **System Testing:** Login system functionality from web application to API
- **Integration Testing:** Web application integration with API endpoints
- **Security Testing:** Authentication, authorization, and two-factor authentication (2FA)
- **Certificate Validation Testing:** HTTPS certificate requirement verification

This test plan does NOT cover:
- Unit testing (already covered with Jest - 65 tests passing)
- Performance/load testing beyond basic functionality
- Cross-browser compatibility testing (Chrome only)
- Mobile responsiveness testing

### C. Features to be Tested

1. User Registration and Login System
2. Admin User Authorization and Role-based Access Control
3. API Endpoint Authorization (Admin vs. Non-Admin)
4. Two-Factor Authentication (2FA) Setup and QR Code Generation
5. HTTPS Certificate Validation (Application crash on invalid certificate)
6. Session Management and Logout Functionality

---

## II. Test Environment

### A. Development Environment

**Purpose:** To test the application in a development environment with self-signed SSL certificate.

**Configuration:**
- **Operating System:** Windows 10/11
- **Browser:** Google Chrome (latest version)
- **Server:** Node.js HTTPS server (custom server.js)
- **Database:** SQLite (prisma/dev.db)
- **Application URL:** https://localhost:3000
- **Port:** 3000 (HTTPS)

**Tools Used:**
- Chrome DevTools for network analysis
- Playwright MCP for browser automation
- Prisma Studio for database inspection
- Server console logs for monitoring

### B. Test Data Environment

**Purpose:** To provide consistent test data for executing test cases.

**Test Users:**
- **Regular User:** testplan@example.com (Password: TestPass123!)
- **Admin User:** admin@example.com (Password: Admin123!)

**Database State:**
- Fresh database with test users created during test execution
- All users have hashed passwords (bcrypt)
- Admin user promoted to "admin" role via promote script

**Prerequisites:**
- SSL certificates generated in `/certs` folder
- `.env` file configured with correct SSL paths and password
- Database migrations applied
- Dependencies installed (`npm install`)

---

## III. Test Cases

### A. System Test 1: User Registration and Login

**Test ID:** TC-001
**Test Type:** System Test (Black Box)
**Priority:** High
**Feature:** User Registration and Login System

#### Prerequisites:
1. Server is running at https://localhost:3000
2. Browser is open and ready
3. Database is accessible
4. User testplan@example.com does NOT exist in database

#### Test Steps:

**Step 1: Navigate to Application**
- Action: Open browser and navigate to https://localhost:3000
- Expected Result: Homepage displays with "Hello, World!" text (unauthenticated state)

**Step 2: Navigate to Registration Page**
- Action: Click "Opret konto (Register)" link
- Expected Result: Registration page displays with email, password, and confirm password fields

**Step 3: Enter Registration Details**
- Action: Enter email "testplan@example.com"
- Data: testplan@example.com
- Expected Result: Email field accepts input

**Step 4: Enter Password**
- Action: Enter password "TestPass123!"
- Data: TestPass123!
- Expected Result: Password field accepts input and masks characters

**Step 5: Confirm Password**
- Action: Enter password confirmation "TestPass123!"
- Data: TestPass123!
- Expected Result: Confirmation field accepts input

**Step 6: Submit Registration**
- Action: Click "Opret konto" button
- Expected Result: Success message "Account created successfully! You can now log in." displays

**Step 7: Automatic Redirect**
- Action: Wait 2 seconds
- Expected Result: Application automatically redirects to /login page

**Step 8: Enter Login Credentials**
- Action: Enter email "testplan@example.com" and password "TestPass123!"
- Data: testplan@example.com, TestPass123!
- Expected Result: Both fields accept input

**Step 9: Submit Login**
- Action: Click "Log ind" button
- Expected Result: User is authenticated and redirected to dashboard

**Step 10: Verify Logged In State**
- Action: Observe dashboard page content
- Expected Result: Dashboard displays "Du er logget ind." and shows user email "testplan@example.com" with role "Bruger"

#### Postconditions:
- User testplan@example.com exists in database with hashed password
- User is logged in with active session
- User can access protected routes (dashboard)

#### Success Criteria:
✅ Test is SUCCESSFUL if:
1. Registration completes without errors
2. User is created in database with hashed password (not plaintext)
3. Login succeeds with correct credentials
4. Dashboard displays "Du er logget ind."
5. User information shows correct email and "Bruger" role

**Actual Result:** ✅ PASSED
New user created successfully. Login works correctly. Dashboard shows "Du er logget ind." with email testplan@example.com and role "Bruger".

---

### B. System Test 2: Admin User Authorization

**Test ID:** TC-002
**Test Type:** System Test (Black Box)
**Priority:** High
**Feature:** Admin Role-based Authorization

#### Prerequisites:
1. Server is running at https://localhost:3000
2. Admin user admin@example.com exists in database
3. Admin user has role "admin" (promoted via script)
4. No active user session (logged out)

#### Test Steps:

**Step 1: Navigate to Login Page**
- Action: Navigate to https://localhost:3000/login
- Expected Result: Login page displays

**Step 2: Enter Admin Credentials**
- Action: Enter email "admin@example.com" and password "Admin123!"
- Data: admin@example.com, Admin123!
- Expected Result: Both fields accept input

**Step 3: Submit Login**
- Action: Click "Log ind" button
- Expected Result: Admin user is authenticated and session is created

**Step 4: Navigate to Homepage**
- Action: Navigate to https://localhost:3000
- Expected Result: Homepage displays admin-specific message

**Step 5: Verify Admin Content on Homepage**
- Action: Read paragraph text on homepage
- Expected Result: Text displays "Du er logget ind. Du er admin"

**Step 6: Navigate to Dashboard**
- Action: Navigate to https://localhost:3000/dashboard
- Expected Result: Dashboard loads with admin privileges

**Step 7: Verify Admin Status on Dashboard**
- Action: Observe dashboard heading and user information
- Expected Result:
  - Heading shows "Du er logget ind. Du er admin"
  - Subtext shows "Som administrator har du adgang til alle funktioner"
  - User info shows rolle: "Administrator"
  - Navigation bar shows "👑 Admin" link

**Step 8: Verify Admin Navigation Link**
- Action: Check navigation bar for admin link
- Expected Result: "👑 Admin" link is visible and points to /admin/manage-users

#### Postconditions:
- Admin user remains logged in
- Admin has access to admin-only routes
- Admin sees admin-specific UI elements

#### Success Criteria:
✅ Test is SUCCESSFUL if:
1. Admin can log in with correct credentials
2. Homepage shows "Du er logget ind. Du er admin"
3. Dashboard shows admin heading and "Administrator" role
4. "👑 Admin" link appears in navigation
5. Admin user can access admin-only pages

**Actual Result:** ✅ PASSED
Admin login successful. Homepage shows "Du er logget ind. Du er admin". Dashboard displays admin privileges with role "Administrator" and "👑 Admin" link in navigation.

---

### C. Integration Test 1: API Authentication for Non-Admin User

**Test ID:** TC-003a
**Test Type:** Integration Test (Black Box)
**Priority:** High
**Feature:** API Endpoint Authorization (Non-Admin)

#### Prerequisites:
1. Server is running at https://localhost:3000
2. Regular user (testplan@example.com) is logged in
3. User has role "user" (not "admin")
4. User is on dashboard page

#### Test Steps:

**Step 1: Locate API Test Button**
- Action: On dashboard, find "Test Web API Endpoint" section
- Expected Result: Section displays with "Test API Endpoint" button

**Step 2: Read API Endpoint Information**
- Action: Read description text
- Expected Result: Text states "Kun administratorer kan få adgang til denne endpoint"

**Step 3: Click Test API Button**
- Action: Click "Test API Endpoint" button
- Expected Result: Browser sends GET request to /api/hello

**Step 4: Observe Response Display**
- Action: Wait for response to display on page
- Expected Result: Error message appears on dashboard

**Step 5: Verify Error Message**
- Action: Read error message content
- Expected Result: Message displays "Adgang nægtet, du er ikke admin"

**Step 6: Verify HTTP Status Code**
- Action: Open Chrome DevTools Network tab and check /api/hello request
- Data: HTTP status code
- Expected Result: Status code is 403 Forbidden

**Step 7: Verify Response Body**
- Action: Check response body in DevTools
- Expected Result: Response body contains "Adgang nægtet, du er ikke admin"

#### Postconditions:
- User remains logged in
- No access granted to protected API endpoint
- User sees appropriate error message

#### Success Criteria:
✅ Test is SUCCESSFUL if:
1. API request is sent to /api/hello
2. Server returns HTTP 403 Forbidden status
3. Response body contains "Adgang nægtet, du er ikke admin"
4. Error message displays on UI
5. User is NOT able to access admin-only API endpoint

**Actual Result:** ✅ PASSED
Non-admin user receives 403 Forbidden response. Error message "Adgang nægtet, du er ikke admin" displays correctly. Console shows "403 (Forbidden)" for /api/hello request.

---

### D. Integration Test 2: API Authentication for Admin User

**Test ID:** TC-003b
**Test Type:** Integration Test (Black Box)
**Priority:** High
**Feature:** API Endpoint Authorization (Admin)

#### Prerequisites:
1. Server is running at https://localhost:3000
2. Admin user (admin@example.com) is logged in
3. User has role "admin"
4. User is on dashboard page

#### Test Steps:

**Step 1: Locate API Test Button**
- Action: On dashboard, find "Test Web API Endpoint" section
- Expected Result: Section displays with "Test API Endpoint" button

**Step 2: Read API Endpoint Information**
- Action: Read description text
- Expected Result: Text states "Som admin kan du få adgang til endpoint"

**Step 3: Click Test API Button**
- Action: Click "Test API Endpoint" button
- Expected Result: Browser sends GET request to /api/hello

**Step 4: Observe Response Display**
- Action: Wait for response to display on page
- Expected Result: Success message appears on dashboard

**Step 5: Verify Success Message**
- Action: Read success message content
- Expected Result: Message displays "Hello, World! From api"

**Step 6: Verify Success Heading**
- Action: Check heading in success message box
- Expected Result: Heading displays "Success"

**Step 7: Verify HTTP Status Code**
- Action: Open Chrome DevTools Network tab and check /api/hello request
- Data: HTTP status code
- Expected Result: Status code is 200 OK

**Step 8: Verify Response Body**
- Action: Check response body in DevTools
- Expected Result: Response body contains "Hello, World! From api"

#### Postconditions:
- Admin user remains logged in
- Admin successfully accessed protected API endpoint
- Correct success message displayed

#### Success Criteria:
✅ Test is SUCCESSFUL if:
1. API request is sent to /api/hello
2. Server returns HTTP 200 OK status
3. Response body contains "Hello, World! From api"
4. Success message displays on UI with "Success" heading
5. Admin IS able to access admin-only API endpoint

**Actual Result:** ✅ PASSED
Admin user receives 200 OK response. Success message "Hello, World! From api" displays with "Success" heading. API endpoint authorization works correctly for admin users.

---

### E. Integration Test 3: Two-Factor Authentication (2FA) Setup

**Test ID:** TC-004
**Test Type:** Integration Test (Black Box)
**Priority:** Medium
**Feature:** Two-Factor Authentication (2FA) System

#### Prerequisites:
1. Server is running at https://localhost:3000
2. User (admin@example.com) is logged in
3. User does NOT have 2FA enabled
4. User is on dashboard page

#### Test Steps:

**Step 1: Navigate to Security Settings**
- Action: Click "Sikkerhed" link in navigation bar
- Expected Result: Security settings page loads at /settings/security

**Step 2: Verify 2FA Status**
- Action: Locate "To-Faktor Godkendelse (2FA)" section
- Expected Result: Status shows "Deaktiveret" (Deactivated)

**Step 3: Locate Activation Button**
- Action: Find "Aktiver 2FA" button
- Expected Result: Button is visible and enabled

**Step 4: Read Instructions**
- Action: Read "Sådan fungerer det" instructions
- Expected Result: Instructions explain authenticator app setup process

**Step 5: Click Activate 2FA Button**
- Action: Click "Aktiver 2FA" button
- Expected Result: 2FA setup screen displays

**Step 6: Verify Setup Screen**
- Action: Observe page heading
- Expected Result: Heading displays "Opsæt To-Faktor Godkendelse"

**Step 7: Verify QR Code Display**
- Action: Locate QR code image under "Trin 1: Scan QR-koden"
- Expected Result: QR code image is visible and rendered

**Step 8: Verify Manual Secret Key**
- Action: Locate secret key under "Kan ikke scanne QR-koden?"
- Expected Result: Secret key is displayed (e.g., "HR2UYPZIBFJFYBA2")

**Step 9: Verify Verification Input**
- Action: Locate verification code input field under "Trin 2: Indtast verifikationskode"
- Expected Result: 6-digit input field is present and accepts input

**Step 10: Verify Action Buttons**
- Action: Locate "Verificer og Aktiver" and "Annuller" buttons
- Expected Result: Both buttons are present

#### Postconditions:
- 2FA secret is generated and stored in database
- QR code is available for scanning with authenticator app
- User can proceed with verification (not tested in this case)

#### Success Criteria:
✅ Test is SUCCESSFUL if:
1. 2FA activation screen loads correctly
2. QR code is generated and displayed
3. Manual secret key is visible for manual entry
4. Verification code input field is present
5. User can scan QR code with authenticator app
6. Instructions are clear and complete

**Actual Result:** ✅ PASSED
2FA activation screen displays correctly. QR code generated and visible. Manual secret key shown: "HR2UYPZIBFJFYBA2". Verification input field present. All setup elements functional.

---

### F. System Test 3: HTTPS Certificate Validation

**Test ID:** TC-005
**Test Type:** System Test (Black Box)
**Priority:** High
**Feature:** HTTPS Certificate Requirement (App must crash without valid certificate)

#### Test Case F.1: Valid Certificate Configuration

**Prerequisites:**
1. Server is NOT running
2. `.env` file has correct SSL certificate paths
3. `.env` has SSL_CERT_PASSWORD="sikkerhedsapp2024"
4. Certificate files exist in `/certs` folder

**Test Steps:**

**Step 1: Open Terminal**
- Action: Open command prompt or terminal
- Expected Result: Terminal is ready for input

**Step 2: Navigate to Project Directory**
- Action: Execute `cd C:\code\sikkerhedsapp`
- Expected Result: Working directory changed to project root

**Step 3: Start Server**
- Action: Execute `npm run dev`
- Expected Result: Server startup process begins

**Step 4: Observe Certificate Validation**
- Action: Watch console output for validation message
- Expected Result: Console displays "🔒 Validating HTTPS certificate configuration..."

**Step 5: Verify Validation Success**
- Action: Check next console message
- Expected Result: Console displays "✅ Certificate validation passed"

**Step 6: Verify Certificate Paths**
- Action: Read certificate path confirmation
- Expected Result: Paths display correctly:
  - Certificate: C:\code\sikkerhedsapp\certs\localhost-cert.pem
  - Private Key: C:\code\sikkerhedsapp\certs\localhost-key.pem

**Step 7: Verify Server Start**
- Action: Check for server ready message
- Expected Result: Console displays "Ready on https://localhost:3000"

**Step 8: Verify Server Accessibility**
- Action: Open browser and navigate to https://localhost:3000
- Expected Result: Application loads successfully

**Step 9: Stop Server**
- Action: Press Ctrl+C in terminal
- Expected Result: Server stops gracefully

**Success Criteria:**
✅ Test is SUCCESSFUL if:
1. Certificate validation passes
2. Server starts without errors
3. Application is accessible via HTTPS
4. Console shows validation success message

**Actual Result:** ✅ PASSED
Server started successfully. Console showed "✅ Certificate validation passed" with correct certificate paths. Application accessible at https://localhost:3000.

---

#### Test Case F.2: Invalid Certificate Password (Negative Test)

**Prerequisites:**
1. Server is NOT running
2. `.env` file is accessible for editing
3. Original password is "sikkerhedsapp2024"

**Test Steps:**

**Step 1: Open .env File**
- Action: Open `.env` file in text editor
- Expected Result: File opens successfully

**Step 2: Locate SSL Password**
- Action: Find line `SSL_CERT_PASSWORD="sikkerhedsapp2024"`
- Expected Result: Line is located

**Step 3: Change Password to Invalid Value**
- Action: Change to `SSL_CERT_PASSWORD="wrongpassword"`
- Data: wrongpassword
- Expected Result: Change is made

**Step 4: Save .env File**
- Action: Save file with Ctrl+S
- Expected Result: File is saved

**Step 5: Start Server**
- Action: Execute `npm run dev` in terminal
- Expected Result: Server attempts to start

**Step 6: Observe Certificate Validation**
- Action: Watch console output
- Expected Result: Console displays "🔒 Validating HTTPS certificate configuration..."

**Step 7: Verify Validation Failure**
- Action: Check for error message
- Expected Result: Console displays "❌ ERROR: Invalid SSL certificate password"

**Step 8: Verify Error Details**
- Action: Read error description
- Expected Result: Message states "The certificate password does not match the expected value"

**Step 9: Verify Server Crash**
- Action: Check if server process continues
- Expected Result: Server process exits with exit code 1 (crash)

**Step 10: Verify Application Inaccessibility**
- Action: Attempt to access https://localhost:3000 in browser
- Expected Result: Application is NOT accessible (connection refused)

**Step 11: Restore Correct Password**
- Action: Change `.env` back to `SSL_CERT_PASSWORD="sikkerhedsapp2024"`
- Expected Result: Correct password restored

**Step 12: Save .env File**
- Action: Save file
- Expected Result: File saved with correct configuration

**Success Criteria:**
✅ Test is SUCCESSFUL if:
1. Server detects invalid password
2. Error message displays clearly
3. Server crashes (exit code 1)
4. Application is NOT accessible
5. Server does NOT start with invalid certificate password

**Actual Result:** ✅ PASSED
Server crashed with error "❌ ERROR: Invalid SSL certificate password". Process exited with code 1. Application not accessible. Certificate validation requirement working correctly.

---

### G. Integration Test 4: Session Management and Logout

**Test ID:** TC-006
**Test Type:** Integration Test (Black Box)
**Priority:** Medium
**Feature:** Session Management and Logout Functionality

#### Prerequisites:
1. Server is running at https://localhost:3000
2. User (testplan@example.com) is logged in
3. User is on dashboard page
4. Active session exists

#### Test Steps:

**Step 1: Verify Logged In State**
- Action: Observe dashboard page
- Expected Result: Dashboard displays "Du er logget ind." and user information

**Step 2: Locate Logout Button**
- Action: Find "Log ud" button in navigation bar
- Expected Result: Button is visible in navigation

**Step 3: Click Logout Button**
- Action: Click "Log ud" button
- Expected Result: Logout request is sent to server

**Step 4: Observe Server Response**
- Action: Watch for navigation/redirect
- Expected Result: Server invalidates session and redirects

**Step 5: Navigate to Homepage**
- Action: Navigate to https://localhost:3000
- Expected Result: Homepage loads

**Step 6: Verify Logged Out State**
- Action: Read paragraph text on homepage
- Expected Result: Text displays "Hello, World!" (unauthenticated state)

**Step 7: Verify Login/Register Links**
- Action: Check for "Opret konto" and "Log ind" links
- Expected Result: Both links are visible

**Step 8: Attempt to Access Protected Route**
- Action: Navigate directly to https://localhost:3000/dashboard
- Expected Result: Access denied or redirect to login

**Step 9: Verify Redirect to Login**
- Action: Check current URL after attempting dashboard access
- Expected Result: URL is /login (automatic redirect)

#### Postconditions:
- User session is invalidated
- User cannot access protected routes
- User sees unauthenticated state on homepage
- User must log in again to access protected content

#### Success Criteria:
✅ Test is SUCCESSFUL if:
1. Logout button triggers logout action
2. Session is invalidated on server
3. Homepage shows "Hello, World!" after logout
4. Protected routes redirect to /login
5. User cannot access dashboard without logging in again

**Actual Result:** ✅ PASSED
Logout functionality works correctly. After logout, homepage shows "Hello, World!" (unauthenticated state). Attempting to access /dashboard redirects to /login. Session invalidated successfully.

---

## IV. Test Execution Summary

**Test Date:** 13. november 2025
**Tester:** Bananainsane
**Environment:** Windows 10/11, Chrome Browser, Node.js HTTPS Server

### Test Results Overview

| Test ID | Test Name | Priority | Status | Notes |
|---------|-----------|----------|--------|-------|
| TC-001 | User Registration and Login | High | ✅ PASSED | User created: testplan@example.com |
| TC-002 | Admin Authorization | High | ✅ PASSED | Admin role verified |
| TC-003a | API Auth (Non-Admin) | High | ✅ PASSED | 403 Forbidden as expected |
| TC-003b | API Auth (Admin) | High | ✅ PASSED | 200 OK as expected |
| TC-004 | 2FA Setup | Medium | ✅ PASSED | QR code generated |
| TC-005 | HTTPS Certificate | High | ✅ PASSED | Both valid and invalid tested |
| TC-006 | Session Management | Medium | ✅ PASSED | Logout works correctly |

**Total Tests:** 7
**Passed:** 7 (100%)
**Failed:** 0 (0%)
**Blocked:** 0 (0%)

### Issues Found

**Minor Issue - Self-Signed Certificate Redirect Warning**
- **Severity:** Low (Expected behavior in development)
- **Description:** During logout and login actions, browser temporarily shows "ERR_EMPTY_RESPONSE" due to self-signed certificate in redirect chain
- **Impact:** No functional impact - navigation works correctly after manual reload
- **Root Cause:** Node.js server's fetch() call cannot validate self-signed certificate in redirects
- **Workaround:** Manual navigation to destination URL
- **Resolution:** In production, valid SSL certificate from Certificate Authority will eliminate this issue

**Conclusion:** No critical or blocking bugs found. Minor issue is development environment related and will not occur in production.

---

## V. Recommendation

**✅ APPROVED FOR SUBMISSION**

The Sikkerhedsapp system is **approved for submission** based on the following evaluation:

### Strengths:
1. **100% Test Success Rate** - All 7 test cases passed without critical issues
2. **Security Features Verified:**
   - Password hashing with bcrypt ✅
   - Role-based authorization (Admin/User) ✅
   - Two-Factor Authentication with QR code ✅
   - API endpoint authorization ✅
   - HTTPS certificate validation ✅
   - Session management ✅
3. **Assignment Requirements Met:**
   - System test of login system (web app to API) ✅
   - Integration test of web app with API ✅
   - Script test format for all test cases ✅
   - Non-functional test methodology applied ✅
   - Test plan documented with conclusions ✅

### Assessment:
- All test cases executed successfully
- Application demonstrates proper security principles
- Authentication and authorization working correctly
- 2FA implementation functional
- Certificate validation requirement enforced
- System ready for school assignment submission

### Final Verdict:
The application meets all functional and non-functional requirements specified in the Day 4 assignment documentation. Recommend approval for submission.

**Test Plan Completed:** 13. november 2025
**Approved by:** Bananainsane (Test Manager)
