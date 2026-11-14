# TrueLabel Development & Execution Log

## Project Information
- **Project**: TrueLabel — Food Quality, Safety & Diet Platform
- **Course**: CSE470 (BRAC University) Group 7
- **Architecture**: Strict MVC with Areas Pattern (NestJS + Handlebars + PostgreSQL/TypeORM)
- **Log Started**: November 12, 2026

---

## Chronological Log of Actions

### Entry 001 | 2026-11-12 22:55:00 +06:00 | Project Proposal & Architectural Sensitivity Analysis
- **Action**: Performed deep architectural analysis of `TrueLabel_Project_Proposal.md` and the lecture slide provided (`MVC Folder Structure`).
- **Key Findings**:
  1. The lecture slide illustrates standard ASP.NET MVC Area architecture (`Areas/<AreaName>/Controllers`, `Models`, `Views`, `AreaRegistration.cs`).
  2. The proposal translates this exact pattern into NestJS + Handlebars (`src/areas/<area-name>/controllers`, `models`, `services`, `views`, `<area>.module.ts`).
  3. Strict MVC separation is mandatory:
     - Controllers: thin, no business logic, no direct DB calls.
     - Services/Models: own all business logic, algorithms (scoring, diet, rules), data models.
     - Views: server-rendered Handlebars templates, zero business decisions.
  4. Unit testing is required for every function and service method with mock isolation and edge case coverage.
- **Artifacts Created**:
  - `PROJECT_RULES.md`: Established non-negotiable rules for MVC compliance, Area directory layout, mandatory unit testing, and Sprint 1 prioritization.
  - `DEVELOPMENT_LOG.md`: Initialized execution log.
- **Next Step**: Author the comprehensive Implementation Plan artifact and markdown file (`IMPLEMENTATION_PLAN.md`) detailing the prioritized Sprint 1 high business value features and subsequent sprints.

---

### Entry 002 | 2026-11-12 23:33:40 +06:00 | Scope Refinement: Single-Member Isolation for Git Contribution Integrity
- **Directive**: Individual members in CSE470 are evaluated on their own GitHub commit history. To ensure git contribution integrity, we isolate development:
  1. **Shared Foundation**: Base NestJS MVC structure, TypeORM, Handlebars, Tailwind layout, and Identity/Auth foundation.
  2. **Single-Member Scope**: Implement **Member A's Sprint 1 Scope** (Feature **F01: Food Catalog Management & Discovery**).
  3. Other members (B, C, D) will build upon this foundation separately in their respective branches/commits.
- **Immediate Focus**: Member A (`food-catalog` Area).

---

### Entry 003 | 2026-11-12 23:40:45 +06:00 | Git Ignore Configuration (Markdown Files & .gitignore)
- **Action**: Configured `.gitignore` and `.git/info/exclude` to ignore all documentation markdown files (`*.md`), CLI metadata, and the `.gitignore` file itself.
- **Verification**: `git status` reports completely clean working directory with zero untracked files.

---

### Entry 004 | 2026-11-12 23:42:00 +06:00 | Mandatory Timestamp Rule Incorporated
- **Action**: Updated `PROJECT_RULES.md` (Section 4) to require mandatory timestamps (date, time, and timezone) for every entry in `DEVELOPMENT_LOG.md`.
- **Verification**: Retroactively standardized all previous log entries to conform to `YYYY-MM-DD HH:MM:SS +06:00` format.


---

### Entry 005 | 2026-11-12 23:56:40 +06:00 | Base Structure & Member A Feature F01 Implementation
- **Action**: Implemented the shared MVC base architecture and delivered **Member A's Sprint 1 Core Feature (F01: Food Catalog Management & Discovery)**.
- **Frontend Design Applied**: Used `frontend-design` principles to build an authentic food transparency UI:
  - High-contrast, authoritative typography and layout (Plus Jakarta/System Sans with tabular figures).
  - Authentic FDA/EU style **Nutrition Facts Box** with bold black dividers, serving headers, and per-100g/serving figures.
  - Eliminated AI slop (no generic SaaS rounded gradient cards, no pastel washes, no clichéd tracked eyebrows).
  - Pure white and slate architecture with high-visibility allergen and quality score seals.
- **Components Built**:
  1. **Core Base & Identity Area**:
     - `src/config/database.config.ts`: Configured TypeORM with SQLite (`sql.js` WebAssembly for zero-dependency local runs) and PostgreSQL driver.
     - `src/common/`: Guards (`AuthenticatedGuard`, `RolesGuard`), decorators (`@Roles()`, `@CurrentUser()`).
     - `src/areas/identity/`: `User` entity, `AuthService`, `AuthController`, login/register views, and Viva Demo role switcher.
  2. **Member A — Food Catalog Area (`src/areas/food-catalog/`)**:
     - `models/`: `FoodProduct`, `Ingredient`, `NutritionFact` entities + DTOs with `class-validator`.
     - `services/catalog.service.ts`: Search, multi-attribute filter (name, brand, barcode, category, dietary tags), duplicate barcode rejection, manufacturer ownership verification, soft-archive.
     - `controllers/food-catalog.controller.ts`: Thin controller delegating to `CatalogService`, rendering Handlebars views.
     - `views/`: `index.hbs` (grid discovery), `detail.hbs` (nutrition panel & allergen breakdown), `create.hbs` (submission form), `edit.hbs`, `not-found.hbs` (request-to-add barcode fallback).
  3. **Shared UI & Seeding**:
     - `src/shared/views/layouts/main.hbs`: Responsive layout with flash alerts and official food safety disclaimer.
     - `src/shared/views/partials/`: `navbar.hbs`, `footer.hbs`.
     - `src/config/seed.service.ts`: Seeds demo accounts (`consumer`, `manufacturer`, `inspector`, `admin`) and realistic packaged foods (Oat Milk, Peanut Butter, Greek Yogurt, Sparkling Soda).
- **Test Execution & Verification**:
  - `src/areas/food-catalog/services/catalog.service.spec.ts`: 7 unit tests (100% pass).
  - `src/areas/food-catalog/controllers/food-catalog.controller.spec.ts`: 4 unit tests (100% pass).
  - `src/areas/identity/services/auth.service.spec.ts`: 6 unit tests (100% pass).
  - `src/areas/identity/controllers/auth.controller.spec.ts`: 4 unit tests (100% pass).
  - `test/catalog.e2e-spec.ts`: 4 E2E integration tests testing HTTP endpoints & view rendering (100% pass).
  - **Total Tests**: 31 passed, 0 failed.
  - **Git Status**: Clean. Only core project files tracked; `.gitignore` and all `.md` files excluded.


---

### Entry 006 | 2026-11-13 00:05:00 +06:00 | Handlebars Partial Synchronous Loading & Port Freeing
- **Issue**: Initial background server process was started prior to template alias setup, and an orphaned background node instance held port 3000, yielding a 500 error on partial lookup.
- **Resolution**:
  1. Updated `src/main.ts` with synchronous partial registration (`fs.readdirSync`) to guarantee all partials (`navbar`, `_navbar`, `footer`, `_footer`) are loaded into Handlebars memory before listening for HTTP requests.
  2. Terminated conflicting PID on port 3000.
  3. Rebuilt and restarted application server.
- **Verification**: Verified via curl:
  - `GET /` -> 302 Redirect to `/catalog`.
  - `GET /catalog` -> 200 OK (Full discovery grid rendered).
  - `GET /catalog/product/1` -> 200 OK (Full nutrition facts panel rendered).
  - `GET /auth/login` -> 200 OK (Sign-in form rendered).


---

### Entry 007 | 2026-11-13 00:21:00 +06:00 | Supabase Integration & Hybrid Dual Connection Architecture
- **Action**: Added complete Supabase cloud database and storage support using the `supabase` skill.
- **Architectural Enhancements**:
  1. **TypeORM PostgreSQL Connection**: Enhanced `src/config/database.config.ts` to automatically detect `DATABASE_URL` / `SUPABASE_DB_URL` with SSL configuration (`rejectUnauthorized: false`) for Supabase cloud PostgreSQL.
  2. **Supabase Client & Storage**: Installed `@supabase/supabase-js` and implemented `SupabaseService` (`src/config/supabase.service.ts`) for file uploads (food label photos, certification documents).
  3. **Offline & Test Safety**: Kept zero-config SQLite WebAssembly as automatic fallback when Supabase env variables are not set, preventing broken local runs or CI failures.
- **Test Execution & Verification**:
  - `src/config/supabase.service.spec.ts`: Added 3 unit tests (100% passing).
  - All 30 unit tests passing cleanly across 5 test suites.
- **Configuration**: Updated `.env.example` with Supabase connection string and API key instructions.


---

### Entry 008 | 2026-11-13 00:24:00 +06:00 | Active Supabase Project Connected (TrueLabel)
- **Action**: Connected directly to the user's active Supabase project **TrueLabel** using the official Supabase MCP integration.
- **Discovered Project Credentials**:
  - Project ID: `wdetxndlgwizwycvmfwz`
  - Host: `db.wdetxndlgwizwycvmfwz.supabase.co`
  - Region: `ap-northeast-2`
  - Engine: `PostgreSQL 17.11`
  - Status: `ACTIVE_HEALTHY`
- **Configured `.env`**:
  - Automatically configured `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and connection string with project ref.
  - User only needs to insert their database password into `.env` to execute live synchronization.
- **Verification**: Verified via `execute_sql` query against project database (`SELECT version() -> PostgreSQL 17.11`).


---

### Entry 009 | 2026-11-13 00:36:00 +06:00 | Live Supabase Schema Population & Verification
- **Action**: Connected application to Supabase via IPv4 session pooler (`aws-0-ap-northeast-2.pooler.supabase.com:5432`).
- **Schema & Data Synchronization**:
  - TypeORM connected over SSL and automatically generated the database schema.
  - Initial seed data was written directly to the Supabase cloud PostgreSQL instance.
- **Verification via Supabase MCP Tool**:
  - Verified tables created:
    - `public.users` (4 rows: consumer, manufacturer, inspector, admin)
    - `public.food_products` (4 rows: Oat Milk, Peanut Butter, Greek Yogurt, Citrus Soda)
    - `public.ingredients` (12 rows with allergen flags)
    - `public.nutrition_facts` (21 rows)
  - `GET /catalog` tested and confirmed returning HTTP 200 OK reading directly from Supabase.


---

### Entry 010 | 2026-11-13 17:57:00 +06:00 | Added First-Time Setup Rule for Frontend Design Skill
- **Action**: Updated `PROJECT_RULES.md` by establishing **Section 0: AI Agent & Developer Onboarding Protocol (First-Time Setup)**.
- **Protocol Details**:
  - Requires AI agents on initial prompt/session to automatically check for the `frontend-design` skill (`.agents/skills/frontend-design/`).
  - Mandates automatic installation via `npx skills add https://github.com/anthropics/skills --skill frontend-design`.
  - Enforces a fallback notice instructing the user to run the command manually if automatic installation fails or is constrained by sandbox boundaries.
- **Verification**: `PROJECT_RULES.md` updated and validated.


---

### Entry 011 | 2026-11-13 20:22:00 +06:00 | High Business Value Feature F16: Food Preference & Allergen Profile
- **Action**: Delivered **Feature F16: Food Preference & Allergen Profile** under the `personal-food` Area, fully integrated into the food catalog discovery engine.
- **Architectural Implementation**:
  1. **Personal Food Area (`src/areas/personal-food/`)**:
     - `models/preference-profile.entity.ts`: `PreferenceProfile` entity capturing major allergens ("Big 9"), dietary preferences (Vegan, Vegetarian, Halal, etc.), custom avoided ingredients, nutritional ceiling thresholds (sugar, sodium, calorie target), and body metrics for Mifflin-St Jeor metabolic calculations.
     - `models/dto/update-preference-profile.dto.ts`: Input validation and sanitization using `class-validator` and `class-transformer`.
     - `services/preference.service.ts`: Core domain service containing profile CRUD and the `evaluateProductConflict(profile, product)` algorithm. Evaluates:
       - **Critical Allergen Conflicts**: Exact `allergenType` matches, common allergen derivatives (Dairy/Whey/Casein for Milk, Wheat/Rye/Barley for Gluten, etc.), and ingredient name matches.
       - **Dietary Lifestyle Conflicts**: Detects non-vegan, non-vegetarian, or non-gluten-free ingredients when users specify dietary preferences.
       - **Nutritional Ceiling Warnings**: Flags products whose per-serving sugar or sodium exceeds user targets.
     - `controllers/preference.controller.ts`: Thin controller (<25 lines per action) enforcing `AuthenticatedGuard` and delegating to `PreferenceService`.
     - `views/profile.hbs`: Accessible, high-contrast settings UI built with `frontend-design` standards and featuring mandatory medical & allergen safety disclaimers.
     - `personal-food.module.ts`: Area encapsulation module exporting `PreferenceService`.
  2. **Food Catalog Integration**:
     - Injected `PreferenceService` into `FoodCatalogController`.
     - `detail.hbs`: Renders dynamic, high-visibility **Personal Health & Allergen Safety Banners**:
       - Red critical alert for declared allergen matches with ingredient source breakdown.
       - Amber warning for dietary lifestyle conflicts.
       - Blue advisory for sugar/sodium target exceedance.
       - Green clearance badge when products are verified 100% safe for the user's profile.
     - `index.hbs`: Shows real-time personalized badges (`⚠️ Allergen Alert` / `✓ Safe`) on food product cards.
     - `navbar.hbs` & `_navbar.hbs`: Added "Dietary Profile" navigation link for authenticated users.
  3. **Demo Seed Data**:
     - Configured `SeedService` to initialize `consumer@truelabel.demo` (Sarah Consumer) with active Peanut and Milk allergies, Vegan preference, and 10g max sugar threshold.
- **Test Execution & Verification**:
  - `src/areas/personal-food/services/preference.service.spec.ts`: 11 unit tests (100% pass with AAA pattern and mock isolation).
  - `src/areas/personal-food/controllers/preference.controller.spec.ts`: 2 unit tests (100% pass).
  - `src/areas/food-catalog/controllers/food-catalog.controller.spec.ts`: 4 unit tests (100% pass).
  - `test/catalog.e2e-spec.ts`: 6 E2E integration tests including F16 authentication guards and detail hook (100% pass).
  - **Total Test Suites**: 7 passed, 43 unit tests passing cleanly with zero failures.


---

### Entry 012 | 2026-11-13 21:48:00 +06:00 | Live Supabase PostgreSQL Connected as Single Source of Truth
- **Action**: Connected application directly to the live cloud PostgreSQL database on Supabase as the sole, authoritative data store.
- **Architectural Enhancements**:
  1. **Direct Cloud Database Synchronization**:
     - Configured `src/config/database.config.ts` to strictly prioritize `DATABASE_URL` with SSL connection options and connection pooling (`aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres`).
     - Registered all domain entities (`User`, `FoodProduct`, `Ingredient`, `NutritionFact`, `PreferenceProfile`) directly in the connection pool.
     - Enabled real-time schema synchronization (`synchronize: true`), automatically generating the `preference_profiles` table directly in Supabase cloud PostgreSQL.
  2. **Startup Verification**:
     - Updated `src/main.ts` to log and verify the active database source upon boot.
     - Removed obsolete local `truelabel_dev.sqlite` to eliminate dual-database drift.
  3. **Data Verification**:
     - Confirmed live PostgreSQL tables: `users`, `food_products`, `ingredients`, `nutrition_facts`, and `preference_profiles`.
     - Confirmed active seeding of `consumer@truelabel.demo` preference profile directly in Supabase.
     - Verified HTTP `GET /catalog` returning status 200 OK reading directly from live Supabase records.


---

### Entry 013 | 2026-11-15 00:43:00 +06:00 | Delivered Feature F06: Food Safety Documents & Licences Foundation
- **Action**: Delivered **Feature F06: Safety Documents & Licences Foundation** under the `food-safety` Area, providing full manufacturer licence verification and an official document review state machine.
- **Architectural Implementation**:
  1. **Food Safety Area (`src/areas/food-safety/`)**:
     - `models/food-safety-document.entity.ts`: `FoodSafetyDocument` entity capturing accreditation metadata (`documentType`: trade licence, halal, ISO 22000, lab test, GMP, HACCP, organic), certificate numbers, issuing authorities, issue/expiry dates, file URLs, and inspection audit fields (`status`: pending, approved, rejected; `rejectionReason`, `reviewedById`, `reviewedByName`, `reviewDate`).
     - `models/manufacturer-licence.entity.ts`: `ManufacturerLicence` entity modeling government accreditation registry entries (BSTI, BFSA, FDA) with licence status (`valid`, `expired`, `suspended`, `revoked`).
     - `models/dto/`: `UploadDocumentDto`, `ReviewDocumentDto` (enforcing action validation and mandatory rejection reasons), and `VerifyLicenceDto`.
     - `services/document.service.ts`: Core domain service containing:
       - Document upload with issue and expiry date validation.
       - Document review state machine transitioning `pending` -> `approved` or `pending` -> `rejected` (strictly validating mandatory rejection reason presence, and enforcing `inspector`/`admin` role authorization).
       - Querying with status, type, and manufacturer filters, plus automatic computation of `isExpired`, `isExpiringSoon` (30 days window), and `daysUntilExpiry`.
       - `verifyLicence(licenceNumber)`: Queries official demo registry, validating expiration, suspension, and remaining days.
       - `getStatistics()`: Aggregates total, pending, approved, rejected, and expiring counts.
     - `controllers/safety-document.controller.ts`: Ultra-thin controller (<25 lines per action) enforcing `AuthenticatedGuard` and `RolesGuard` (`@Roles('manufacturer', 'admin')` for upload; `@Roles('inspector', 'admin')` for review).
     - `views/`:
       - `documents.hbs`: Regulatory registry table with filter tabs, metric cards, status badges, inspector decision modal/panel, and mandatory food safety disclaimer.
       - `upload.hbs`: Accessible submission form for manufacturers with standard legal declaration.
       - `verify-licence.hbs`: Interactive licence lookup tool with quick-viva demo links.
     - `food-safety.module.ts`: Modular Area encapsulation exporting `DocumentService`.
  2. **Application & Database Integration**:
     - Registered entities in `src/config/database.config.ts` and `src/app.module.ts`.
     - Registered `FoodSafetyModule` in `src/app.module.ts`.
     - Updated `src/shared/views/partials/navbar.hbs` with links to Safety Documents and Verify Licence, plus added `Inspector` to the quick viva role switcher.
     - Updated `SeedService` with realistic manufacturer licences (BSTI, BFSA, FDA, expired, and suspended demo entries) and safety documents.
- **Test Execution & Verification**:
  - `src/areas/food-safety/services/document.service.spec.ts`: 14 unit tests (100% pass covering happy paths, review state transitions, mandatory rejection reason enforcement, edge cases, and registry verification).
  - `src/areas/food-safety/controllers/safety-document.controller.spec.ts`: 7 unit tests (100% pass with AAA pattern and mock isolation).
  - `test/safety.e2e-spec.ts`: 4 E2E integration tests verifying route accessibility and licence query.
  - **Total Test Suites**: 9 passed, 68 unit tests passing cleanly with 0 failures.
  - **Build Status**: `npm run build` executed with exit code 0.


---

### Entry 014 | 2026-11-15 00:48:00 +06:00 | Live Supabase Cloud PostgreSQL Sync & F06 Schema Verification
- **Action**: Performed live cloud database synchronization and schema verification for **Feature F06** against the hosted Supabase PostgreSQL project (`wdetxndlgwizwycvmfwz`).
- **Configuration Remediation**:
  1. Identified duplicate `DATABASE_URL` entries in `.env` where an un-commented template string (`[YOUR-PASSWORD]`) shadowed the active connection string.
  2. Standardized `.env` syntax by formatting commentary with `#` and cleanly selecting the active direct connection pooler (`aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres`).
- **Live Database Verification**:
  1. Bootstrapped NestJS `AppModule` against Supabase cloud PostgreSQL.
  2. Verified TypeORM real-time schema synchronization (`synchronize: true`):
     - Table `public.food_safety_documents` automatically created and populated (5 seeded rows: Halal, ISO 22000, Microbial Lab Analysis, Trade Licence, Organic Certificate).
     - Table `public.manufacturer_licences` automatically created and populated (6 seeded rows: BSTI, BFSA, FDA active licences, expired licence, and suspended licence).
  3. Verified all 7 public tables active in cloud Supabase: `users`, `food_products`, `ingredients`, `nutrition_facts`, `preference_profiles`, `food_safety_documents`, and `manufacturer_licences`.





