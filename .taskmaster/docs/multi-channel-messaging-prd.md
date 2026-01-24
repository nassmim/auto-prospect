# Multi-Channel Messaging System - Requirements

## Overview
Implement a credits-based multi-channel messaging system that contacts ads using SMS, WhatsApp Text, and Ringless Voice channels with daily pacing limits and app-owner-controlled channel priority.

## Business Model

### Credits System
- Users purchase **credits** for each channel (SMS, WhatsApp, Ringless Voice)
- Each credit = ability to contact 1 ad via that channel
- Credits are consumed only when a message is **successfully sent** (failed sends don't count)
- Credits are time-independent (purchased credits never expire)

### Daily Pacing Limits
- Users configure: "How many ads per day maximum should we contact for you?"
- This is a single limit across ALL channels to prevent overwhelming the user
- Example: User buys 200 SMS + 100 Voice credits but sets 10/day limit → takes time to use all credits
- Pacing limit applies to successfully contacted ads only

### Channel Priority (Owner-Controlled)
- **App owner** controls which channel is tried first/second/third (not users)
- Default priority: Ringless Voice → WhatsApp Text → SMS (most to least effective)
- Priority order may change based on performance data
- Users should **not see** which specific channel was used for each contact (to avoid exposing underperforming channels)

## Functional Requirements

### Hunt Configuration
Users should be able to:
1. Enable/disable each messaging channel (SMS / WhatsApp / Voice)
2. Purchase credits for each enabled channel
3. Set a single daily pacing limit that applies across all channels

### Background Processing
The system should:
1. Find ads matching hunt criteria that haven't been contacted yet
2. Check today's contact count against the daily pacing limit
3. Allocate ads to channels based on:
   - Available credits per channel
   - App-owner defined channel priority
   - Daily pacing capacity remaining
4. Attempt to send messages via allocated channels
5. Only consume credits when sends succeed
6. Track which ads were contacted (but not necessarily expose channel details to users)

### User Visibility
Users should see:
- Total credits purchased per channel
- Total credits used per channel (lifetime)
- Credits remaining per channel
- Overall daily pacing limit
- Today's contact count vs limit

Users should **NOT** see:
- Which specific channel was used for each ad
- Daily/weekly breakdown by channel (to avoid exposing performance issues)
- Channel priority order

### Validation
The system should enforce:
- At least one channel must be enabled
- Credits and daily limits must be positive integers
- Daily limit should be reasonable relative to total credits
- Credits used cannot exceed credits purchased

## Technical Constraints

### Database
- All changes must follow existing Drizzle schema patterns
- RLS policies required for all new tables
- Migrations must be generated (never manually written SQL outside migrations)
- Schema changes must be the single source of truth

### Code Standards
- Follow existing patterns in codebase (review similar features first)
- Server components by default, client components only when needed
- Use react-hook-form + Zod for all forms (client + server validation)
- Prefer named exports, functional patterns
- Use shadcn/ui components for all UI

### Migration Safety
- Since migrations haven't been applied to production yet, can iterate freely on schemas
- Must run `pnpm db:generate` after schema changes
- Review generated SQL before committing
- If `db:generate` requires user interaction, inform user to run manually

## Success Criteria
- Users can purchase credits per channel via hunt creation/edit form
- Users can set daily pacing limit for entire hunt
- Background job respects channel priorities and limits
- Credits consumed only on successful sends
- Daily pacing enforced correctly across all channels
- UI shows credit usage and limits clearly
- UI hides which channel was used for specific contacts
- All changes validated on both client and server
- Type-safe throughout (TypeScript + Drizzle)

## Out of Scope
- Payment processing for credit purchases (assume credits can be added manually for now)
- Detailed analytics/reporting on channel performance
- User-configurable channel priority
- Automatic credit refills
- Usage notifications/alerts
