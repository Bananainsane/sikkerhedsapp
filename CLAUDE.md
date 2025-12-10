# TwinCurrent Admin Platform - AI Assistant Context

## Project Overview

TwinCurrent Admin is a comprehensive business management platform designed specifically for TwinCurrent's operations. This internal platform streamlines business operations with intelligent expense tracking, project management, financial reporting, and AI-powered automation tailored to Danish business requirements.

## Core Business Purpose

- **Company**: TwinCurrent - Danish technology and consulting company
- **Platform Type**: Internal business administration and management system
- **Primary Users**: Company administrators, project managers, and accounting personnel
- **Jurisdiction**: Denmark (Danish accounting and VAT regulations apply)

## Key Features

### 1. Expense Management
- **AI-Powered Receipt Processing**: Automatic extraction of expense data from uploaded receipts using Google Gemini AI
- **Danish VAT Handling**: Built-in support for Danish VAT rates and regulations
- **Category Management**: Smart categorization of expenses with learning capabilities
- **Export Functionality**: Excel export for accounting integration
- **Receipt Storage**: Secure cloud storage of receipt images and documents

### 2. Project Management
- **Client Management**: Track client information and relationships
- **Task Tracking**: Kanban-style task boards with status workflows
- **Time Tracking**: Billable and non-billable time entry system
- **Budget Monitoring**: Real-time budget vs actual tracking
- **Resource Allocation**: Team member assignment and workload management

### 3. Financial Reporting
- **Income Tracking**: Invoice management and payment tracking
- **Expense Analytics**: Detailed expense breakdowns by category, project, and period
- **VAT Reporting**: Danish VAT calculation and reporting tools
- **Profitability Analysis**: Project and client profitability metrics
- **Cash Flow Management**: Income vs expense visualization

### 4. Ideas & Innovation
- **Idea Capture**: Quick capture system for business ideas and improvements
- **Prioritization**: Voting and scoring system for idea evaluation
- **Implementation Tracking**: Convert ideas to projects with progress tracking

### 5. AI Integration
- **Google Gemini API**: Primary AI provider for intelligent features
- **Receipt OCR**: Automatic text extraction from images
- **Task Generation**: AI-powered project task breakdown
- **Expense Categorization**: Smart expense classification
- **Data Insights**: AI-generated business insights and recommendations

## Danish Business Context

### VAT (Moms) Requirements
- **Standard VAT Rate**: 25% (standard Danish moms rate)
- **VAT Registration**: Support for CVR number tracking
- **Quarterly Reporting**: Aligned with Danish VAT reporting periods
- **Reverse Charge**: Support for EU B2B transactions

### Accounting Standards
- **Fiscal Year**: Follows Danish calendar or custom fiscal years
- **Expense Categories**: Aligned with Danish tax deductible categories
- **Documentation Requirements**: Compliant with Danish bookkeeping laws
- **Currency**: Primary currency DKK with multi-currency support

## Technical Architecture

### Frontend Stack
- **Framework**: Next.js 15+ with App Router
- **UI Library**: Tailwind CSS with custom component library
- **State Management**: React hooks and context
- **Forms**: React Hook Form with Zod validation
- **Data Fetching**: TanStack Query for server state

### Backend Stack
- **API**: Next.js API routes with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with secure session management
- **File Storage**: Cloud storage for receipts and documents
- **AI Services**: Google Gemini API integration

### Security & Compliance
- **Data Protection**: GDPR compliant data handling
- **Authentication**: Secure login with session management
- **Authorization**: Role-based access control
- **Encryption**: Sensitive data encryption at rest and in transit
- **Audit Trail**: Comprehensive logging of financial transactions

## Development Guidelines

### Code Quality Standards
- **TypeScript**: Strict typing throughout the application
- **Testing**: Unit and integration tests for critical business logic
- **Documentation**: Clear inline documentation for complex logic
- **Error Handling**: Robust error handling with user-friendly messages
- **Performance**: Optimized queries and lazy loading

### Business Logic Priorities
1. **Data Accuracy**: Financial data must be 100% accurate
2. **Regulatory Compliance**: Danish tax and accounting law compliance
3. **User Experience**: Intuitive interface for non-technical users
4. **Performance**: Fast response times for data-heavy operations
5. **Scalability**: Architecture supporting business growth

### AI Usage Guidelines
- **Primary Model**: Claude Opus 4.5 - the most capable model for all tasks
- **Cost Optimization**: Efficient use of AI API calls
- **Fallback Handling**: Manual input options when AI fails
- **Data Privacy**: No sensitive data in AI prompts
- **Accuracy Verification**: Human review for AI-extracted data
- **Rate Limiting**: Prevent API quota exhaustion

## Common Use Cases

1. **Daily Expense Entry**: Quick receipt upload with automatic data extraction
2. **Monthly VAT Reporting**: Generate VAT reports for tax filing
3. **Project Profitability**: Analyze project costs vs revenue
4. **Time Billing**: Generate time-based invoices for clients
5. **Budget Monitoring**: Track project spending against budgets
6. **Idea Evaluation**: Assess and prioritize business improvements

## Integration Points

- **Accounting Software**: Export formats compatible with Danish accounting systems
- **Banking**: Support for bank statement import
- **Email**: Automated notifications and reports
- **Calendar**: Time tracking integration with calendar systems
- **Document Management**: Receipt and invoice storage system

## Key Business Rules

1. **Expense Approval**: Expenses over certain thresholds require approval
2. **Project Authorization**: Projects must have approved budgets
3. **Time Entry**: Time must be logged to specific projects/tasks
4. **VAT Calculation**: Automatic VAT calculation based on transaction type
5. **Data Retention**: Financial records kept per Danish legal requirements

## Performance Metrics

- **Page Load**: Target < 2 seconds for dashboard
- **AI Processing**: Receipt processing < 5 seconds
- **Search**: Instant search across all business data
- **Export**: Large data exports handled asynchronously
- **Uptime**: 99.9% availability target

## Claude Code Capabilities

### Available Skills
| Skill | Description |
|-------|-------------|
| `frontend-design:frontend-design` | Create distinctive, production-grade frontend interfaces with high design quality. Generates creative, polished code that avoids generic AI aesthetics. |

**IMPORTANT**: All UI/UX work (components, pages, layouts, styling) MUST use the `frontend-design` skill. Always invoke this skill when creating or modifying user interfaces.

### Specialized Agents
| Agent | Purpose |
|-------|---------|
| `Explore` | Fast codebase exploration and search |
| `Plan` | Task planning and implementation design |
| `nextjs-developer` | Next.js 15+ App Router, TypeScript, Three.js/R3F development |
| `ui-ux-designer` | Tailwind CSS 4+, Framer Motion, accessibility specialist |
| `scandi-designer` | Scandinavian Industrial design system implementation for React/Next.js components |
| `research-specialist` | Web research and documentation analysis |
| `firecrawl-scraper` | Deep web content extraction and site crawling |
| `doc-maintainer` | Documentation updates after code changes |
| `doc-guardian` | Documentation quality and accuracy checking |
| `meta-agent` | Create new custom agents |
| `idea-generator` | AI-powered brainstorming with Zen MCP |
| `claude-code-guide` | Claude Code and Agent SDK documentation lookup |
| `agent-sdk-dev:agent-sdk-verifier-py` | Verify Python Agent SDK apps are properly configured |
| `agent-sdk-dev:agent-sdk-verifier-ts` | Verify TypeScript Agent SDK apps are properly configured |
| `component-scanner` | Catalog and analyze components in the codebase |
| `context-loader` | Load comprehensive project documentation and context |
| `integration-mapper` | Document feature integrations across systems |
| `project-initializer` | Scaffold new projects with .claude infrastructure |

### Slash Commands
| Command | Description |
|---------|-------------|
| `/agent-sdk-dev:new-sdk-app [name]` | Create and setup a new Claude Agent SDK application |
| `/git_status` | Understand current git repository state |
| `/check-docs` | Check if documentation needs updates |
| `/update-docs` | Update documentation after code changes |
| `/agents` | Agent management system |
| `/map-feature` | Analyze feature integration across codebase |
| `/load-docs` | Load project documentation into session |
| `/init-project` | Initialize new project with .claude infrastructure |
| `/ideate` | Brainstorm with AI collaboration (Zen MCP) |
| `/scan-components` | Scan and catalog all components |
| `/prime` | Initialize orchestrator with project context |

### Agent Details

#### Cyan scandi-designer - Scandinavian Industrial Design Specialist
**Expertise**: UI/UX design using Scandinavian Industrial design system, Tailwind CSS, component enhancement, Nordic minimalism, warm industrial aesthetics
**Tools**: Read, Write, Edit, MultiEdit, Glob, Grep
**When to Delegate**:
- Enhancing React/Next.js components with Scandinavian Industrial design
- Applying the TwinCurrent design system to UI components
- Creating distinctive, production-grade interfaces that avoid generic AI looks
- Implementing Nordic minimalism with copper/amber accents
- Converting existing components to match the brand aesthetic
- Adding animations and transitions following design system patterns

### Core Tools
- **File Operations**: Read, Write, Edit, MultiEdit, Glob, Grep
- **Terminal**: Bash command execution
- **Web**: WebSearch, WebFetch for research
- **Browser Automation**: Full Playwright integration
- **Task Management**: TodoWrite for tracking progress
- **Notebooks**: Jupyter notebook editing and execution

## Future Enhancements

- **Mobile App**: Native mobile application for on-the-go management
- **Advanced Analytics**: Predictive analytics and forecasting
- **Workflow Automation**: Custom business process automation
- **API Access**: External API for third-party integrations
- **Multi-Company**: Support for multiple company entities

---

**Last Updated**: 2025-11-25
**Platform Version**: 1.0.0
**Primary Maintainer**: TwinCurrent Development Team
**Documentation Status**: Active development with continuous updates
