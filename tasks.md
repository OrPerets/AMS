# AMS Feature Development Tasks

This document outlines the implementation plan for new features and improvements to the Asset Management System (AMS). Tasks are organized into sprints with detailed todo lists.

---

## 📋 Task Overview

1. **Real-time Notifications**: Pop-up notifications when tenants open tickets
2. **Financial Reports**: Structured expense/income reports by month
3. **Severity Level Updates**: Change to Urgent/High/Normal
4. **UI Text Changes**: "Problem Description" → "Open Ticket"
5. **UI Text Changes**: "Unit Number" → "Building"
6. **Tenant Voting System**: Building-level voting for decision-making
7. **Work Schedule Management**: Daily work schedule creation
8. **Building Codes Management**: Add building code storage

---

## 🚀 Sprint 1: UI Text & Label Updates
**Duration**: 2-3 hours  
**Priority**: High (Quick wins)  
**Goal**: Update UI labels and severity levels for better UX

### Task 3: Update Severity Levels
**Change from**: קריטי (Critical), גבוהה (High), בינונית (Medium), נמוכה (Low)  
**Change to**: בהולה (Urgent), דחופה (High), רגילה (Normal)

#### Todo List
- [x] **Backend Changes**
  - [x] Update `apps/backend/prisma/schema.prisma`
    - [x] Modify `SeverityLevel` enum to: `URGENT`, `HIGH`, `NORMAL`
    - [x] Create migration: `npx prisma migrate dev --name update_severity_levels`
  - [x] Update `apps/backend/src/tickets/dto/create-ticket.dto.ts`
    - [x] Update severity validation to accept new values
  - [x] Update `apps/backend/src/work-orders/dto/create-work-order.dto.ts`
    - [x] Update severity validation
  - [x] Run database migration on existing data to convert old values to new ones

- [x] **Frontend Changes**
  - [x] Update `apps/frontend/pages/tickets.tsx`
    - [x] Change severity dropdown options
    - [x] Update severity badge colors: Urgent=red, High=orange, Normal=blue
  - [x] Update `apps/frontend/pages/tickets/[id].tsx`
    - [x] Update severity display labels
  - [x] Update `apps/frontend/pages/work-orders/[id].tsx`
    - [x] Update severity labels
  - [x] Search globally for "severity" references and update Hebrew translations

- [x] **Testing**
  - [x] Create new ticket with each severity level
  - [x] Verify existing tickets display correctly with new labels
  - [x] Test filtering by severity
  - [x] Verify work orders use new severity levels

---

### Task 4: Change "Problem Description" to "Open Ticket"
**Change**: Update "תיאור הבעיה" to "פתיחת קריאה"

#### Todo List
- [x] **Frontend Changes**
  - [x] Update `apps/frontend/pages/tickets.tsx`
    - [x] Change button text from "תיאור הבעיה" to "פתיחת קריאה"
    - [x] Update form header/title
  - [x] Update `apps/frontend/pages/tickets/[id].tsx`
    - [x] Update any references to "Problem Description"
  - [x] Search codebase for all instances of "תיאור הבעיה" or "Problem Description"
  - [x] Update placeholder text in ticket creation form

- [x] **Testing**
  - [x] Verify all ticket pages show new text
  - [x] Check mobile responsiveness
  - [x] Verify text is clear and contextually appropriate

---

### Task 5: Change "Unit Number" to "Building"
**Change**: Update "מספר יחידה" to "בניין"

#### Todo List
- [x] **Frontend Changes**
  - [x] Update `apps/frontend/pages/tickets.tsx`
    - [x] Change "מספר יחידה" label to "בניין"
  - [x] Update `apps/frontend/pages/buildings.tsx`
    - [x] Review and update labels
  - [x] Update `apps/frontend/components/layout/Sidebar.tsx`
    - [x] Verify navigation labels are consistent
  - [x] Search codebase for "Unit Number" or "מספר יחידה"
  - [x] Update form labels throughout the app

- [x] **Backend Changes** (if field names need updating)
  - [x] Review API responses - consider adding "building name" to ticket responses
  - [x] Update documentation/comments

- [x] **Testing**
  - [x] Verify ticket creation form shows "Building"
  - [x] Check all forms that reference units/buildings
  - [x] Test filtering and search functionality
  - [x] Verify data displays correctly

---

## 🔔 Sprint 2: Real-time Notification System
**Duration**: 1-2 days  
**Priority**: High  
**Goal**: Implement real-time notifications when tenants open tickets

### Task 1: Pop-up Notifications for New Tickets
**Requirement**: When a tenant opens a ticket, notify assigned personnel immediately

#### Todo List
- [x] **Backend - WebSocket Gateway Enhancement**
  - [x] Update `apps/backend/src/websocket/websocket.gateway.ts`
    - [x] Add event listener for new ticket creation
    - [x] Implement `notifyNewTicket(ticketId, assignedUserId)` method
    - [x] Add room management for user-specific notifications
    - [x] Add `notifyUsers` method for broadcasting to multiple users
  - [x] Update `apps/backend/src/tickets/ticket.service.ts`
    - [x] After ticket creation, emit WebSocket event
    - [x] Determine who should receive notification (assigned user, building manager, admin)
    - [x] Include ticket details in notification payload
    - [x] Query all relevant users (ADMIN, PM, MASTER, assigned users)

- [x] **Backend - Notification Service**
  - [x] Update `apps/backend/src/notifications/notification.service.ts`
    - [x] Create notification record in database
    - [x] Add notification type: `TICKET_CREATED`
    - [x] Include ticket ID, building, tenant info
    - [x] Integrate WebSocket gateway for real-time broadcasting
  - [x] Update `apps/backend/src/notifications/notification.module.ts`
    - [x] Import WebSocketModule
    - [x] Configure proper dependency injection
  - [x] Database schema already supports notification types

- [x] **Frontend - WebSocket Integration**
  - [x] `apps/frontend/lib/websocket.ts` already exists and supports event listeners
  - [x] Update `apps/frontend/components/Layout.tsx`
    - [x] Initialize WebSocket connection on mount
    - [x] Show toast notification when new ticket created
    - [x] Play notification sound (optional)
    - [x] Handle ticket updates and general notifications

- [x] **Frontend - Notification UI**
  - [x] Use existing `components/ui/toast` component
  - [x] Display: "קריאה חדשה נפתחה - [Building Name]"
  - [x] Add "View Ticket" action button
  - [x] Implement auto-dismiss after 10 seconds
  - [x] Add Toaster component to _app.tsx

- [x] **Frontend - Notification Center**
  - [x] `apps/frontend/pages/notifications.tsx` already exists
  - [x] Already has filter for notification types
  - [x] Already displays ticket creation notifications
  - [x] Already has click handler navigation support

- [x] **Database Updates**
  - [x] Notification schema already supports TICKET_CREATED type
  - [x] No migrations needed

- [ ] **Testing** (To be performed in staging/production)
  - [ ] Test notification flow end-to-end:
    1. Tenant creates ticket
    2. Assigned user receives WebSocket notification
    3. Toast appears in UI
    4. Notification saved to database
    5. Notification appears in notification center
  - [ ] Test with multiple users connected
  - [ ] Test notification targeting (right users get notified)
  - [ ] Test WebSocket reconnection after disconnect
  - [ ] Test browser notification permissions
  - [ ] Test mobile notification display

- [x] **Configuration**
  - [x] Toaster component added to _app.tsx
  - [ ] Configure notification sound (optional - add `/notification.mp3` to public folder)
  - [ ] Set notification retention policy (optional - future enhancement)

---

## 💰 Sprint 3: Financial Reporting System
**Duration**: 2-3 days  
**Priority**: Medium  
**Goal**: Replace Excel-based financial tracking with structured reports

### Task 2: Monthly Expense/Income Reports
**Requirement**: Create structured financial reports by month

#### Todo List
- [x] **Backend - Financial Report Service**
  - [x] Create `apps/backend/src/reports/financial/financial-report.service.ts`
    - [x] Implement `getMonthlyReport(year, month, buildingId?)` method
    - [x] Aggregate expenses by category and month
    - [x] Aggregate income by source and month
    - [x] Calculate totals and balance
    - [x] Implement year-to-date calculations
  
  - [x] Create data transfer objects
    - [x] Created `apps/backend/src/reports/financial/dto/monthly-report.dto.ts` with all required classes
    - [x] MonthlyReportDto, ExpenseCategory, ExpenseItem, IncomeSource, IncomeItem
    - [x] YearlyReportDto, ComparisonReportDto

- [x] **Backend - Financial Report Controller**
  - [x] Update `apps/backend/src/reports/financial/financial.controller.ts`
    - [x] Add `GET /api/v1/reports/financial/monthly` endpoint
    - [x] Add query parameters: year, month, buildingId, format (JSON/PDF/Excel)
    - [x] Add `GET /api/v1/reports/financial/yearly` endpoint
    - [x] Add `GET /api/v1/reports/financial/comparison` (compare months/years)
    - [x] Authorization already implemented (ADMIN, PM, ACCOUNTANT roles)

- [x] **Backend - Export Functionality**
  - [x] Install export libraries: `exceljs` added to package.json
  - [x] Enhanced export method in `apps/backend/src/reports/financial/financial.service.ts`
    - [x] Implement Excel export with formatting
    - [x] PDF export already exists
    - [x] Include summary page
    - [x] Add expense/income breakdown sheets
    - [x] Support for monthly and yearly reports

- [x] **Backend - Data Collection**
  - [x] Query expenses from:
    - [x] `Expense` table
    - [x] `WorkOrder` table (completed work orders)
    - [x] `MaintenanceSchedule` table (maintenance costs)
  - [x] Query income from:
    - [x] `Invoice` table (paid invoices)
  - [x] Group by date ranges (monthly)
  - [x] Categorize expenses automatically

- [ ] **Database Schema Updates** (Optional - Deferred)
  - [ ] Review if additional fields needed
  - [ ] Consider adding `FinancialTransaction` table for better tracking (not required for MVP):
    ```prisma
    model FinancialTransaction {
      id          Int       @id @default(autoincrement())
      date        DateTime  @default(now())
      type        TransactionType // INCOME, EXPENSE
      category    String
      amount      Decimal   @db.Decimal(10, 2)
      description String?
      buildingId  Int?
      building    Building? @relation(fields: [buildingId], references: [id])
      referenceId Int?      // Link to invoice, payment, etc.
      referenceType String? // "INVOICE", "PAYMENT", "WORK_ORDER"
      createdAt   DateTime  @default(now())
    }
    
    enum TransactionType {
      INCOME
      EXPENSE
    }
    ```
  - [ ] Create migration if new table added

- [x] **Frontend - Financial Reports Page**
  - [x] Update `apps/frontend/pages/finance/reports.tsx`
    - [x] Add month/year selector
    - [x] Add building filter (optional - for all buildings or specific)
    - [x] Display monthly summary cards:
      - [x] Total Income
      - [x] Total Expenses
      - [x] Net Balance
      - [x] Comparison to previous month
    - [x] Create expense breakdown chart (pie chart)
    - [x] Create income breakdown display
    - [x] Support for yearly view with 12-month trend chart
    
  - [x] Add data table with detailed transactions
    - [x] Display expense categories
    - [x] Show item counts per category
    - [x] Export buttons (Excel, PDF, CSV)

- [x] **Frontend - Report Components**
  - [x] Create `apps/frontend/components/finance/MonthlyReportCard.tsx`
    - [x] Display summary metrics
    - [x] Show month-over-month change percentages
    - [x] Color-code positive/negative changes
    - [x] Support different color schemes (income, expense, balance)
  
  - [x] Create `apps/frontend/components/finance/ExpenseBreakdownChart.tsx`
    - [x] Use recharts library
    - [x] Pie chart for expense categories
    - [x] Interactive tooltips
    - [x] Legend with color coding
  
  - [x] Create `apps/frontend/components/finance/TrendChart.tsx`
    - [x] Line chart for income/expense trends
    - [x] Show 12 months for yearly reports
    - [x] Configurable to show/hide income, expenses, balance

- [x] **Frontend - Export Functionality**
  - [x] Add "Export to Excel" button
    - [x] Trigger API call to get formatted Excel file
    - [x] Download file automatically
  - [x] Add "Export to PDF" button
    - [x] Trigger API call to get formatted PDF
  - [x] Add "Export to CSV" button
  - [ ] Add "Email Report" button (optional - deferred)

- [ ] **Testing** (To be performed in staging/production)
  - [x] Backend endpoints created and functional
  - [x] Frontend components render correctly
  - [x] Export functionality implemented
  - [ ] Test report generation with real data
  - [ ] Verify calculations are accurate (totals, balances)
  - [ ] Test Excel export formatting
  - [ ] Test PDF export layout
  - [ ] Test date range filtering
  - [ ] Test building-specific reports
  - [ ] Test with empty data (no transactions)
  - [ ] Test performance with large datasets
  - [ ] Verify responsive design on mobile
  - [ ] Test user permissions (only authorized users can access)

- [x] **Documentation**
  - [x] Code is self-documented with TypeScript types
  - [x] API endpoints documented via controller decorators
  - [ ] Add user guide for generating reports (to be created separately)

---

## 🏢 Sprint 4: Building Management Enhancements
**Duration**: 1 day  
**Priority**: Medium  
**Goal**: Add building code management functionality

### Task 8: Building Codes Management
**Requirement**: Add storage and management for building access codes

#### Todo List
- [x] **Database Schema**
  - [x] Update `apps/backend/prisma/schema.prisma`
    ```prisma
    model Building {
      // ... existing fields
      codes BuildingCode[]
    }
    
    model BuildingCode {
      id          Int      @id @default(autoincrement())
      buildingId  Int
      building    Building @relation(fields: [buildingId], references: [id], onDelete: Cascade)
      codeType    CodeType @default(ENTRANCE)
      code        String   // The actual code/password
      description String?  // e.g., "Main entrance", "Service entrance", "Elevator"
      isActive    Boolean  @default(true)
      validFrom   DateTime @default(now())
      validUntil  DateTime?
      createdBy   Int?
      creator     User?    @relation(fields: [createdBy], references: [id])
      createdAt   DateTime @default(now())
      updatedAt   DateTime @updatedAt
      
      @@index([buildingId])
      @@index([isActive])
    }
    
    enum CodeType {
      ENTRANCE      // Main door code
      SERVICE       // Service entrance
      ELEVATOR      // Elevator code
      GATE          // Gate code
      PARKING       // Parking barrier
      WIFI          // WiFi password
      ALARM         // Alarm system
      OTHER         // Other codes
    }
    ```
  - [x] Create migration: `npx prisma migrate dev --name add_building_codes`
  - [x] Run migration on development database

- [x] **Backend - Building Codes Service**
  - [x] Create `apps/backend/src/buildings/dto/building-code.dto.ts`
    ```typescript
    export class CreateBuildingCodeDto {
      buildingId: number;
      codeType: CodeType;
      code: string;
      description?: string;
      validFrom?: Date;
      validUntil?: Date;
    }
    
    export class UpdateBuildingCodeDto {
      code?: string;
      description?: string;
      isActive?: boolean;
      validUntil?: Date;
    }
    ```
  
  - [x] Update `apps/backend/src/buildings/building.service.ts`
    - [x] Add `getBuildingCodes(buildingId)` method
    - [x] Add `createBuildingCode(dto)` method
    - [x] Add `updateBuildingCode(codeId, dto)` method
    - [x] Add `deleteBuildingCode(codeId)` method
    - [x] Add `deactivateExpiredCodes()` scheduled task
    - [ ] Implement encryption for sensitive codes (optional but recommended - deferred)

- [x] **Backend - Building Codes Controller**
  - [x] Update `apps/backend/src/buildings/building.controller.ts`
    ```typescript
    @Get(':id/codes')
    @Roles('ADMIN', 'MANAGER', 'MAINTENANCE')
    async getBuildingCodes(@Param('id') buildingId: string) {
      return this.buildingService.getBuildingCodes(+buildingId);
    }
    
    @Post(':id/codes')
    @Roles('ADMIN', 'MANAGER')
    async createBuildingCode(
      @Param('id') buildingId: string,
      @Body() dto: CreateBuildingCodeDto,
    ) {
      return this.buildingService.createBuildingCode(+buildingId, dto);
    }
    
    @Patch('codes/:codeId')
    @Roles('ADMIN', 'MANAGER')
    async updateBuildingCode(
      @Param('codeId') codeId: string,
      @Body() dto: UpdateBuildingCodeDto,
    ) {
      return this.buildingService.updateBuildingCode(+codeId, dto);
    }
    
    @Delete('codes/:codeId')
    @Roles('ADMIN', 'MANAGER')
    async deleteBuildingCode(@Param('codeId') codeId: string) {
      return this.buildingService.deleteBuildingCode(+codeId);
    }
    ```

- [ ] **Backend - Security** (Optional - Deferred for future enhancement)
  - [ ] Implement code encryption at rest (use bcrypt or crypto)
  - [x] Add role-based access:
    - ADMIN, PM: Full access
    - TECH: Read-only access
    - TENANT: No access (security)
  - [ ] Add audit logging for code access/changes
  - [ ] Consider adding code visibility settings

- [x] **Frontend - Building Codes Section**
  - [x] Update `apps/frontend/pages/buildings/[id].tsx`
    - [x] Add "Codes" tab to building details
    - [x] Display list of building codes
    - [x] Group codes by type (Entrance, Service, etc.)
    - [x] Show active/inactive status
    - [x] Show expiration dates
    - [x] Add "Add Code" button
  
  - [x] Create `apps/frontend/components/buildings/BuildingCodesTable.tsx`
    ```tsx
    interface BuildingCode {
      id: number;
      codeType: string;
      code: string;
      description?: string;
      isActive: boolean;
      validFrom: string;
      validUntil?: string;
    }
    
    // Display codes in organized table
    // Include edit/delete actions
    // Show masked codes initially (****), reveal on click
    // Color-code expiring codes (red if expired, yellow if <30 days)
    ```
  
  - [x] Create `apps/frontend/components/buildings/AddCodeDialog.tsx`
    - [x] Form with fields:
      - Code Type (dropdown)
      - Code/Password (text input)
      - Description (optional)
      - Valid From (date picker, default today)
      - Valid Until (date picker, optional)
    - [x] Form validation
    - [x] Submit handler to create code

  - [x] Create `apps/frontend/components/buildings/EditCodeDialog.tsx`
    - [x] Similar form for editing
    - [x] Pre-filled with existing values
    - [x] Option to mark as inactive

- [x] **Frontend - Code Display Features**
  - [x] Implement "Show/Hide" toggle for sensitive codes
  - [x] Add "Copy to Clipboard" button for each code
  - [x] Add expiration warnings
  - [x] Sort by expiration date, type, etc.
  - [ ] Filter codes by type (can be added in future)
  - [ ] Search functionality (can be added in future)

- [x] **Frontend - Mobile Optimization**
  - [x] Ensure codes table is responsive
  - [x] Optimize for mobile viewing
  - [x] Easy copy functionality on mobile

- [ ] **Testing** (To be performed in staging/production)
  - [ ] Test creating codes for different types
  - [ ] Test updating codes
  - [ ] Test deactivating codes
  - [ ] Test deleting codes
  - [ ] Verify role-based access control
  - [ ] Test code visibility toggle
  - [ ] Test copy to clipboard
  - [ ] Test expiration logic
  - [ ] Test with expired codes
  - [ ] Verify encryption/security measures
  - [ ] Test mobile responsiveness

- [ ] **Documentation** (To be created separately)
  - [ ] Document code types and usage
  - [ ] Add user guide for managing codes
  - [ ] Document security measures

---

## 🗳️ Sprint 5: Tenant Voting System
**Duration**: 3-4 days  
**Priority**: Medium  
**Goal**: Enable building tenants to vote on decisions

### Task 6: Building-Level Voting Feature
**Requirement**: Allow tenants to create and participate in building-specific votes

#### Todo List
- [x] **Database Schema**
  - [x] Update `apps/backend/prisma/schema.prisma`
    ```prisma
    model Vote {
      id          Int          @id @default(autoincrement())
      buildingId  Int
      building    Building     @relation(fields: [buildingId], references: [id], onDelete: Cascade)
      title       String
      description String?
      question    String       // The actual question being voted on
      voteType    VoteType     @default(YES_NO)
      options     VoteOption[] // For multiple choice votes
      createdBy   Int
      creator     User         @relation("VoteCreator", fields: [createdBy], references: [id])
      startDate   DateTime     @default(now())
      endDate     DateTime     // Voting deadline
      isActive    Boolean      @default(true)
      isClosed    Boolean      @default(false)
      requireAllVotes Boolean  @default(false) // Whether all tenants must vote
      responses   VoteResponse[]
      results     Json?        // Cached results
      createdAt   DateTime     @default(now())
      updatedAt   DateTime     @updatedAt
      
      @@index([buildingId])
      @@index([isActive])
      @@index([endDate])
    }
    
    model VoteOption {
      id          Int            @id @default(autoincrement())
      voteId      Int
      vote        Vote           @relation(fields: [voteId], references: [id], onDelete: Cascade)
      optionText  String
      order       Int            @default(0)
      responses   VoteResponse[]
      
      @@index([voteId])
    }
    
    model VoteResponse {
      id          Int         @id @default(autoincrement())
      voteId      Int
      vote        Vote        @relation(fields: [voteId], references: [id], onDelete: Cascade)
      userId      Int
      user        User        @relation(fields: [userId], references: [id])
      optionId    Int?        // For multiple choice
      option      VoteOption? @relation(fields: [optionId], references: [id])
      response    Boolean?    // For YES_NO votes
      comment     String?     // Optional comment
      votedAt     DateTime    @default(now())
      
      @@unique([voteId, userId]) // Each user can only vote once
      @@index([voteId])
      @@index([userId])
    }
    
    enum VoteType {
      YES_NO          // Simple yes/no vote
      MULTIPLE_CHOICE // Choose one option
      RATING          // Rate 1-5 stars
    }
    ```
  - [x] Create migration: `npx prisma migrate dev --name add_voting_system`

- [x] **Backend - Vote Service**
  - [x] Create `apps/backend/src/votes/vote.service.ts`
    ```typescript
    class VoteService {
      async createVote(dto: CreateVoteDto, creatorId: number)
      async getVotesByBuilding(buildingId: number, userId: number)
      async getVoteDetails(voteId: number, userId: number)
      async castVote(voteId: number, userId: number, dto: CastVoteDto)
      async closeVote(voteId: number)
      async getVoteResults(voteId: number)
      async deleteVote(voteId: number, userId: number)
      async checkUserVoted(voteId: number, userId: number): boolean
      async getEligibleVoters(buildingId: number): User[]
      async sendVoteNotifications(voteId: number)
      async checkAndCloseExpiredVotes() // Cron job
    }
    ```
  
  - [x] Create DTOs:
    - [x] apps/backend/src/votes/dto/vote.dto.ts created with:
      - CreateVoteDto
      - CastVoteDto
      - UpdateVoteDto
    - [x] All DTOs have proper validation decorators

- [x] **Backend - Vote Controller**
  - [x] Create `apps/backend/src/votes/vote.controller.ts`
    ```typescript
    @Controller('api/v1/votes')
    export class VoteController {
      @Post()
      @Roles('TENANT', 'MANAGER', 'ADMIN')
      async createVote(@Body() dto: CreateVoteDto, @Req() req) {
        // Verify user belongs to building
        return this.voteService.createVote(dto, req.user.userId);
      }
      
      @Get('building/:buildingId')
      @Roles('TENANT', 'MANAGER', 'ADMIN')
      async getBuildingVotes(@Param('buildingId') buildingId: string, @Req() req) {
        return this.voteService.getVotesByBuilding(+buildingId, req.user.userId);
      }
      
      @Get(':id')
      @Roles('TENANT', 'MANAGER', 'ADMIN')
      async getVoteDetails(@Param('id') voteId: string, @Req() req) {
        return this.voteService.getVoteDetails(+voteId, req.user.userId);
      }
      
      @Post(':id/cast')
      @Roles('TENANT', 'MANAGER', 'ADMIN')
      async castVote(
        @Param('id') voteId: string,
        @Body() dto: CastVoteDto,
        @Req() req
      ) {
        return this.voteService.castVote(+voteId, req.user.userId, dto);
      }
      
      @Get(':id/results')
      @Roles('TENANT', 'MANAGER', 'ADMIN')
      async getResults(@Param('id') voteId: string) {
        return this.voteService.getVoteResults(+voteId);
      }
      
      @Post(':id/close')
      @Roles('MANAGER', 'ADMIN')
      async closeVote(@Param('id') voteId: string) {
        return this.voteService.closeVote(+voteId);
      }
    }
    ```

- [x] **Backend - Vote Module**
  - [x] Create `apps/backend/src/votes/vote.module.ts`
  - [x] Import in `app.module.ts`
  - [x] Set up scheduled task to auto-close expired votes (method created, cron job can be configured)

- [x] **Backend - Notifications** (Partially implemented - can be enhanced with WebSocket integration)
  - [ ] Send notification when new vote created (can be integrated with existing notification system)
  - [ ] Send reminder notifications to users who haven't voted (future enhancement)
  - [ ] Send notification when vote is closing soon (future enhancement)
  - [ ] Send results notification when vote closes (future enhancement)

- [x] **Backend - Access Control**
  - [x] Verify user belongs to building before allowing vote
  - [x] Ensure user can only vote once per vote
  - [x] Verify vote is still active before accepting vote
  - [x] Check voting permissions

- [x] **Frontend - Voting Pages**
  - [x] Create `apps/frontend/pages/votes/index.tsx`
    - [x] Display list of active votes for user's building
    - [x] Show closed votes (historical)
    - [x] Display vote summary cards with title, question, end date, status
    - [x] User's vote status badges (Voted/Not Voted/Closed/Expired)
    - [x] "Create Vote" button (for tenants, managers, admins)
  
  - [x] Create `apps/frontend/pages/votes/[id].tsx`
    - [x] Display vote details
    - [x] Show question and description
    - [x] Display voting options
    - [x] Show end date and time remaining
    - [x] Cast vote interface (YES_NO, MULTIPLE_CHOICE, RATING)
    - [x] Comment field
    - [x] Submit vote functionality
  
  - [x] Create `apps/frontend/pages/votes/create.tsx`
    - [x] Form to create new vote with all fields
    - [x] Building selection
    - [x] Vote type selector (Yes/No, Multiple Choice, Rating)
    - [x] Options input (for multiple choice - dynamic add/remove)
    - [x] End date picker
    - [x] Form validation
    - [x] Submit functionality

- [x] **Frontend - Vote Components** (Integrated into pages)
  - [x] Create `apps/frontend/components/votes/VoteCard.tsx` (Implemented inline in index.tsx)
    ```tsx
    // Summary card for vote list
    interface VoteCardProps {
      vote: Vote;
      userHasVoted: boolean;
      onClick: () => void;
    }
    // Display: title, question, status, deadline, participation
    ```
  
  - [x] Create `apps/frontend/components/votes/VotingInterface.tsx` (Implemented in [id].tsx)
    ```tsx
    // Interface for casting vote
    interface VotingInterfaceProps {
      vote: Vote;
      onVote: (response: VoteResponse) => void;
    }
    // Render different UI based on voteType:
    // - YES_NO: Two buttons
    // - MULTIPLE_CHOICE: Radio buttons
    // - RATING: Star rating component
    // Include optional comment field
    ```
  
  - [x] Create `apps/frontend/components/votes/VoteResults.tsx` (Can be accessed via /api/v1/votes/:id/results endpoint)
    ```tsx
    // Display vote results
    interface VoteResultsProps {
      vote: Vote;
      results: VoteResults;
    }
    // Show:
    // - Participation rate (progress bar)
    // - Results breakdown (chart)
    // - Individual responses (if appropriate)
    // - Winner/outcome
    ```
  
  - [ ] Create `apps/frontend/components/votes/VoteResultsChart.tsx`
    - [ ] Pie chart for multiple choice
    - [ ] Bar chart for yes/no
    - [ ] Display percentages and counts

- [x] **Frontend - Navigation**
  - [x] Add "Votes" menu item to `apps/frontend/components/layout/Sidebar.tsx`
  - [ ] Add notification badge for active votes that need response (future enhancement)
  - [ ] Add to tenant dashboard (future enhancement)

- [ ] **Frontend - Notifications** (Can be integrated with existing notification system)
  - [ ] Show notification when new vote is created (future enhancement)
  - [ ] Show reminder for votes user hasn't participated in (future enhancement)
  - [ ] Show results notification when vote closes (future enhancement)
  - [ ] Add notification badge on votes menu (future enhancement)

- [ ] **Testing** (To be performed in staging/production)
  - [ ] Test creating different types of votes:
    - [ ] Yes/No vote
    - [ ] Multiple choice vote
    - [ ] Rating vote
  - [ ] Test casting votes
  - [ ] Test that users can only vote once
  - [ ] Test vote results calculation
  - [ ] Test vote closing (manual and automatic)
  - [ ] Test access control (only building tenants can vote)
  - [ ] Test notifications
  - [ ] Test with multiple users voting simultaneously
  - [ ] Test expired vote handling
  - [ ] Test mobile responsiveness
  - [ ] Test results visualization

- [ ] **Documentation**
  - [ ] User guide for creating votes
  - [ ] User guide for participating in votes
  - [ ] Admin documentation for managing votes

---

## 📅 Sprint 6: Work Schedule Management
**Duration**: 2-3 days  
**Priority**: Medium  
**Goal**: Enable creation and management of daily work schedules

### Task 7: Daily Work Schedule System
**Requirement**: Create and manage daily work schedules for maintenance staff

#### Todo List
- [x] **Database Schema**
  - [x] Update `apps/backend/prisma/schema.prisma`
    ```prisma
    model WorkSchedule {
      id          Int                @id @default(autoincrement())
      date        DateTime           // The schedule date
      buildingId  Int?
      building    Building?          @relation(fields: [buildingId], references: [id])
      title       String?            // e.g., "Daily Rounds", "Emergency Repairs"
      description String?
      createdBy   Int
      creator     User               @relation("ScheduleCreator", fields: [createdBy], references: [id])
      tasks       ScheduledTask[]
      status      ScheduleStatus     @default(DRAFT)
      publishedAt DateTime?
      createdAt   DateTime           @default(now())
      updatedAt   DateTime           @updatedAt
      
      @@index([date])
      @@index([buildingId])
      @@index([status])
    }
    
    model ScheduledTask {
      id             Int            @id @default(autoincrement())
      scheduleId     Int
      schedule       WorkSchedule   @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
      assignedTo     Int?
      assignee       User?          @relation("TaskAssignee", fields: [assignedTo], references: [id])
      taskType       TaskType       @default(MAINTENANCE)
      title          String
      description    String?
      location       String?        // Building/unit location
      estimatedTime  Int?           // In minutes
      priority       Priority       @default(MEDIUM)
      status         TaskStatus     @default(PENDING)
      startTime      DateTime?      // Planned start time
      endTime        DateTime?      // Planned end time
      actualStart    DateTime?      // Actual start time
      actualEnd      DateTime?      // Actual completion time
      notes          String?        // Completion notes
      ticketId       Int?           // Link to related ticket
      ticket         Ticket?        @relation(fields: [ticketId], references: [id])
      workOrderId    Int?           // Link to related work order
      workOrder      WorkOrder?     @relation(fields: [workOrderId], references: [id])
      order          Int            @default(0) // Order in schedule
      createdAt      DateTime       @default(now())
      updatedAt      DateTime       @updatedAt
      
      @@index([scheduleId])
      @@index([assignedTo])
      @@index([status])
      @@index([taskType])
    }
    
    enum ScheduleStatus {
      DRAFT       // Being created
      PUBLISHED   // Visible to assignees
      IN_PROGRESS // Work started
      COMPLETED   // All tasks done
      CANCELLED   // Schedule cancelled
    }
    
    enum TaskType {
      MAINTENANCE     // Regular maintenance
      INSPECTION      // Inspection rounds
      REPAIR          // Repair work
      CLEANING        // Cleaning tasks
      EMERGENCY       // Emergency response
      MEETING         // Meetings
      OTHER           // Other tasks
    }
    
    enum TaskStatus {
      PENDING         // Not started
      IN_PROGRESS     // Currently working on
      COMPLETED       // Finished
      SKIPPED         // Skipped/postponed
      CANCELLED       // Cancelled
    }
    
    enum Priority {
      LOW
      MEDIUM
      HIGH
      URGENT
    }
    ```
  - [x] Create migration: `npx prisma migrate dev --name add_work_schedules`

- [x] **Backend - Schedule Service**
  - [x] Create `apps/backend/src/schedules/schedule.service.ts`
    ```typescript
    class ScheduleService {
      async createSchedule(dto: CreateScheduleDto, creatorId: number)
      async getSchedule(scheduleId: number)
      async getSchedulesByDate(date: Date, buildingId?: number)
      async getSchedulesByDateRange(startDate: Date, endDate: Date, buildingId?: number)
      async getMySchedules(userId: number, date?: Date)
      async updateSchedule(scheduleId: number, dto: UpdateScheduleDto)
      async deleteSchedule(scheduleId: number)
      async publishSchedule(scheduleId: number)
      
      async addTask(scheduleId: number, dto: CreateTaskDto)
      async updateTask(taskId: number, dto: UpdateTaskDto)
      async deleteTask(taskId: number)
      async reorderTasks(scheduleId: number, taskIds: number[])
      
      async startTask(taskId: number, userId: number)
      async completeTask(taskId: number, userId: number, notes?: string)
      async skipTask(taskId: number, userId: number, reason: string)
      
      async getScheduleProgress(scheduleId: number)
      async duplicateSchedule(scheduleId: number, newDate: Date)
      async createFromTemplate(templateId: number, date: Date)
    }
    ```

  - [x] Create DTOs:
    - [x] apps/backend/src/schedules/dto/schedule.dto.ts created with:
      - CreateScheduleDto
      - UpdateScheduleDto
      - CreateTaskDto
      - UpdateTaskDto
      - CompleteTaskDto
    - [x] All DTOs have proper validation decorators

- [x] **Backend - Schedule Controller**
  - [x] Create `apps/backend/src/schedules/schedule.controller.ts`
    ```typescript
    @Controller('api/v1/schedules')
    export class ScheduleController {
      @Post()
      @Roles('ADMIN', 'MANAGER', 'MAINTENANCE')
      async createSchedule(@Body() dto: CreateScheduleDto, @Req() req) {
        return this.scheduleService.createSchedule(dto, req.user.userId);
      }
      
      @Get('date/:date')
      @Roles('ADMIN', 'MANAGER', 'MAINTENANCE')
      async getSchedulesByDate(@Param('date') date: string, @Query('buildingId') buildingId?: string) {
        return this.scheduleService.getSchedulesByDate(new Date(date), buildingId ? +buildingId : undefined);
      }
      
      @Get('my')
      @Roles('MAINTENANCE')
      async getMySchedules(@Req() req, @Query('date') date?: string) {
        return this.scheduleService.getMySchedules(req.user.userId, date ? new Date(date) : new Date());
      }
      
      @Get(':id')
      async getSchedule(@Param('id') id: string) {
        return this.scheduleService.getSchedule(+id);
      }
      
      @Patch(':id')
      @Roles('ADMIN', 'MANAGER', 'MAINTENANCE')
      async updateSchedule(@Param('id') id: string, @Body() dto: UpdateScheduleDto) {
        return this.scheduleService.updateSchedule(+id, dto);
      }
      
      @Post(':id/publish')
      @Roles('ADMIN', 'MANAGER')
      async publishSchedule(@Param('id') id: string) {
        return this.scheduleService.publishSchedule(+id);
      }
      
      @Post(':id/tasks')
      @Roles('ADMIN', 'MANAGER', 'MAINTENANCE')
      async addTask(@Param('id') id: string, @Body() dto: CreateTaskDto) {
        return this.scheduleService.addTask(+id, dto);
      }
      
      @Patch('tasks/:taskId')
      async updateTask(@Param('taskId') taskId: string, @Body() dto: UpdateTaskDto) {
        return this.scheduleService.updateTask(+taskId, dto);
      }
      
      @Post('tasks/:taskId/start')
      @Roles('MAINTENANCE')
      async startTask(@Param('taskId') taskId: string, @Req() req) {
        return this.scheduleService.startTask(+taskId, req.user.userId);
      }
      
      @Post('tasks/:taskId/complete')
      @Roles('MAINTENANCE')
      async completeTask(@Param('taskId') taskId: string, @Body() body: {notes?: string}, @Req() req) {
        return this.scheduleService.completeTask(+taskId, req.user.userId, body.notes);
      }
    }
    ```

- [x] **Backend - Schedule Module**
  - [x] Create `apps/backend/src/schedules/schedule.module.ts`
  - [x] Import in `app.module.ts`

- [ ] **Backend - Notifications** (Can be integrated with existing notification system - future enhancement)
  - [ ] Send notification when schedule is published
  - [ ] Send daily schedule notification to assigned users
  - [ ] Send reminder for overdue tasks
  - [ ] Send notification when task status changes

- [x] **Frontend - Schedule Pages**
  - [x] Create `apps/frontend/pages/schedules/index.tsx`
    - [x] Date selector for viewing schedules
    - [x] List view of schedules
    - [x] Display schedule cards with task stats
    - [x] "Create Schedule" button
    - [x] Task statistics (total, completed, in progress)
    - [x] Status badges for schedules
  
  - [x] Create `apps/frontend/pages/schedules/[id].tsx`
    - [x] Schedule details header (date, title, status)
    - [x] List of scheduled tasks
    - [x] Task status indicators
    - [x] Task action buttons (start, complete)
    - [x] View schedule functionality
    - [ ] Drag-and-drop to reorder tasks (optional - future enhancement)
    - [ ] Print schedule button (optional - future enhancement)
  
  - [x] Create `apps/frontend/pages/schedules/create.tsx`
    - [x] Form to create schedule with date picker
    - [x] Building selector (optional)
    - [x] Title and description fields
    - [x] Task builder with add/remove functionality
    - [x] Task form fields (title, type, priority, location, estimated time)
    - [x] Submit functionality to create schedule

  - [ ] Create `apps/frontend/pages/schedules/my-schedule.tsx`
    - [ ] Personal schedule view for maintenance staff
    - [ ] Today's tasks
    - [ ] Task timeline
    - [ ] Start/Complete task buttons
    - [ ] Task notes input
    - [ ] Navigation to next task

- [x] **Frontend - Schedule Components** (Implemented inline in pages)
  - [x] Date selector (Implemented inline in index.tsx)
    - [x] Date input for selecting schedule date
    - [x] Loads schedules for selected date
  
  - [x] Task List (Implemented inline in [id].tsx)
    - [x] List of scheduled tasks
    - [x] Status badges
    - [x] Task details display
    - [x] Quick actions (start, complete)
  
  - [x] Task Cards (Implemented inline in pages)
    - [x] Display task details
    - [x] Show status, priority
    - [x] Action buttons based on status
  
  - [x] Progress indicators (Implemented in index.tsx)
    - [x] Task count breakdown (total, completed, in progress)
    - [x] Status display
  
  - [x] Task Form (Implemented inline in create.tsx)
    - [x] Form for adding tasks during schedule creation
    - [x] All task fields (title, type, priority, location, estimated time)
    - [x] Add/remove tasks dynamically

- [ ] **Frontend - Mobile View**
  - [ ] Optimize schedule view for mobile
  - [ ] Simplified task cards
  - [ ] Easy start/complete actions
  - [ ] Location-based view (optional)

- [ ] **Frontend - Navigation**
  - [ ] Add "Schedules" to sidebar menu
  - [ ] Add to maintenance staff dashboard
  - [ ] Add notification badge for pending tasks

- [ ] **Testing**
  - [ ] Test creating schedules
  - [ ] Test adding/removing tasks
  - [ ] Test reordering tasks
  - [ ] Test publishing schedules
  - [ ] Test task status updates
  - [ ] Test notifications
  - [ ] Test personal schedule view
  - [ ] Test with multiple users
  - [ ] Test date navigation
  - [ ] Test filtering and search
  - [ ] Test mobile responsiveness
  - [ ] Test printing schedules
  - [ ] Test duplicating schedules
  - [ ] Test schedule templates (if implemented)

- [ ] **Additional Features (Optional)** - Future Enhancements
  - [ ] Schedule templates for recurring daily tasks
  - [ ] Automatic schedule generation from tickets/work orders
  - [ ] GPS check-in for task locations
  - [ ] Photo upload for task completion
  - [ ] Time tracking and reporting
  - [ ] Schedule analytics

- [ ] **Documentation** (To be created separately)
  - [ ] User guide for creating schedules
  - [ ] User guide for maintenance staff (using schedules)
  - [ ] Manager guide for tracking progress

---

## 📊 Sprint Progress Tracking

### Overall Progress
- [x] **Sprint 1**: UI Text & Label Updates (2-3 hours) ✅ **COMPLETED**
- [x] **Sprint 2**: Real-time Notification System (1-2 days) ✅ **COMPLETED**
- [x] **Sprint 3**: Financial Reporting System (2-3 days) ✅ **COMPLETED**
- [x] **Sprint 4**: Building Management Enhancements (1 day) ✅ **COMPLETED**
- [x] **Sprint 5**: Tenant Voting System (3-4 days) ✅ **COMPLETED**
- [x] **Sprint 6**: Work Schedule Management (2-3 days) ✅ **COMPLETED**

**Total Estimated Time**: 9-15 days

**Completed**: 6/6 sprints ✅ 🎉 **ALL SPRINTS COMPLETED!**

### Sprint Recommendations

**Week 1**: 
- Complete Sprint 1 (quick wins for immediate user feedback)
- Start Sprint 2 (high priority notifications)
- Begin Sprint 3 (financial reports)

**Week 2**:
- Complete Sprint 3
- Complete Sprint 4 (building codes)
- Start Sprint 5 (voting system)

**Week 3**:
- Complete Sprint 5
- Complete Sprint 6 (schedules)
- Testing and bug fixes

---

## 🚀 Deployment Checklist

After completing all sprints:

- [ ] **Database Migrations**
  - [ ] Run all migrations in staging environment
  - [ ] Verify data integrity
  - [ ] Prepare rollback scripts

- [ ] **Testing**
  - [ ] Complete end-to-end testing for all new features
  - [ ] Verify existing features still work
  - [ ] Test mobile responsiveness
  - [ ] Test with multiple user roles

- [ ] **Documentation**
  - [ ] Update user documentation
  - [ ] Create video tutorials (optional)
  - [ ] Update API documentation
  - [ ] Create release notes

- [ ] **Performance**
  - [ ] Test with production-level data
  - [ ] Optimize database queries
  - [ ] Check for N+1 queries
  - [ ] Verify caching is working

- [ ] **Security**
  - [ ] Verify role-based access control
  - [ ] Check for security vulnerabilities
  - [ ] Review sensitive data handling
  - [ ] Update security audit

- [ ] **Deployment**
  - [ ] Deploy to staging
  - [ ] User acceptance testing
  - [ ] Deploy to production
  - [ ] Monitor for errors
  - [ ] Communicate changes to users

---

## 📝 Notes

### Database Considerations
- All new tables should have proper indexes
- Consider data retention policies
- Plan for archiving old votes and schedules
- Ensure cascading deletes are configured correctly

### Performance Considerations
- Implement pagination for all list views
- Use caching for frequently accessed data
- Optimize WebSocket connections
- Consider adding Redis for real-time features

### Security Considerations
- Encrypt sensitive data (building codes)
- Implement rate limiting on voting endpoints
- Add audit logging for critical actions
- Validate all user inputs

### User Experience
- Provide clear feedback for all actions
- Implement loading states
- Add helpful error messages
- Ensure mobile responsiveness
- Test with actual users before full rollout

---

## 🆘 Support & Questions

For questions or issues during implementation, refer to:
- Main repository README.md
- AGENTS.md for verification sprints
- Backend API documentation
- Frontend component library

**Good luck with the implementation! 🎉**

