# 07 - Design System Spec

## Design Goal

MyKeyz Care should feel like a premium Dubai operations tool for providers: clear, fast, trustworthy, and easy for non-native English speakers. The design must support real states, not static mockups.

## Existing Token Direction

Core palette:

- dark navy primary
- white card surfaces
- gold accent
- light slate backgrounds
- green success
- red destructive

Typography:

- strong uppercase display language for key headings
- smaller utilitarian body text for operational content
- avoid oversized marketing hero treatment inside functional screens

Shape:

- rounded mobile-native surfaces
- use high border radius carefully, but avoid nested card-on-card clutter

## Component Requirements

Button:

- primary, secondary, ghost, danger
- loading state
- disabled state
- icon support
- safe text wrapping

Card:

- job card
- quote card
- plan card
- stat card
- document card
- empty-state card

Input:

- text
- phone
- money
- OTP
- multiline note
- validation error

Status:

- verification status
- job status
- quote status
- payment status
- reveal credit state

Navigation:

- bottom tabs for core areas
- stack screens for detail flows
- clear back behavior

Language:

- visible language switch in onboarding/settings
- support long translated strings
- avoid layouts that only work in English

Accessibility:

- large tap targets
- clear icons with labels where needed
- voice help for critical actions
- simple mode for low-literacy users

## Screen State Requirements

Every meaningful screen needs:

- loading
- empty
- error
- success/content
- offline or retry where applicable

Critical screens also need:

- blocked/unverified
- pending verification
- no credits
- payment pending
- expired job
- quote lost
- quote won

## Visual Gate

A screen fails if:

- it is only a static mockup
- CTA is detached from the workflow
- important content is below the fold without intent
- text overlaps or clips on common phone sizes
- it depends on one screenshot size
- it hides real backend states
- it uses mock data as if it were production data

A screen passes if:

- it supports real state from API
- hierarchy is obvious
- CTA matches the current user action
- loading/error/empty states are designed
- language expansion does not break layout
- screenshot review passes on mobile dimensions

## Required Screen Families

Onboarding:

- language
- phone
- OTP
- trade
- service areas
- business profile
- license
- bank
- pending verification
- rejected/needs changes

Marketplace:

- home/simple mode
- jobs list
- job detail
- quote submit
- quote success
- reveal price
- no credits

Work:

- active jobs
- route plan
- chat
- job completion
- completion proof

Business:

- earnings
- plans
- credits
- profile preview
- edit profile
- availability
- settings

Admin is specified separately and does not need to share all mobile UI components.
