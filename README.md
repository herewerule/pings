# Pings - Senior Wellness Companion

**Code name:** Pings  
**Real name:** TBD

## 🎯 Mission
Simple, accessibility-first family connection app for seniors who struggle with traditional smartphones.

## 👥 Target Users

### Primary (Senior User - Android)
- Limited reading ability
- Prefers voice over text
- Has Android phone

### Secondary (Family Circle)
- Children, grandchildren, caregivers
- Configure reminders
- Send check-ins, photos
- Monitor wellness patterns

## 📱 App Structure

```
pings/
├── apps/
│   └── mobile/              # React Native + Expo app
│       ├── app/
│       │   ├── (senior)/    # Dad's simple UI
│       │   ├── (family)/    # Family's rich UI
│       │   └── ...
│       └── src/
│           └── hooks/       # State management
├── infra/                    # AWS CDK infrastructure
│   ├── lib/                 # CDK stacks
│   ├── functions/           # Lambda functions
│   └── test/                # CDK tests
├── packages/                # Shared packages
└── ...
```

## 🛠️ Tech Stack

### Mobile (React Native + Expo)
- **Framework:** React Native + Expo
- **Language:** TypeScript
- **State:** Zustand
- **Platform:** Android-first

### Backend (AWS)
- **API:** API Gateway (REST)
- **Compute:** Lambda (Node.js)
- **Database:** DynamoDB
- **Storage:** S3 + CloudFront
- **Auth:** Cognito
- **Push:** SNS (Mobile Push)
- **Infra:** AWS CDK

## 🏗️ AWS Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        AWS                                  │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   Mobile    │───▶│  API GW     │───▶│   Lambda     │  │
│  │   (React    │    │  (REST)     │    │  (Node.js)  │  │
│  │   Native)   │    └─────────────┘    └─────────────┘  │
│  └─────────────┘           │                    │        │
│                             │                    │        │
│  ┌─────────────┐           │                    │        │
│  │     S3      │◀───────────┘                    │        │
│  │ (photos,    │                                  │        │
│  │  voice)     │                                  │        │
│  └─────────────┘                                  │        │
│                                                    │        │
│  ┌─────────────┐    ┌─────────────┐              │        │
│  │  DynamoDB   │◀───│   Lambda    │◀─────────────┘        │
│  │ (check-ins, │    │  (CRUD)     │                       │
│  │   meds)     │    └─────────────┘                       │
│  └─────────────┘                                          │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐                       │
│  │    SNS      │◀───│   Lambda    │                       │
│  │  (Push)     │    │ (triggers)  │                       │
│  └─────────────┘    └─────────────┘                       │
│                                                             │
│  ┌─────────────┐                                           │
│  │  Cognito    │                                           │
│  │  (Auth)     │                                           │
│  └─────────────┘                                           │
└─────────────────────────────────────────────────────────────┘
```

## 🔌 API Endpoints (REST)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/checkin` | Dad sends check-in |
| `GET` | `/family/{id}/status` | Get family member status |
| `POST` | `/family/send-checkin` | Family sends check-in to dad |
| `POST` | `/medications/log` | Log medication taken |
| `POST` | `/photos/upload` | Upload photo to S3 |
| `GET` | `/photos/{id}` | Get photo with presigned URL |
| `POST` | `/notifications/register` | Register device token (SNS) |

## 🚀 Getting Started

### Mobile App
```bash
cd apps/mobile
npm install
npm start
npm run android
```

### Infrastructure
```bash
cd infra
npm install
cdk deploy --profile your-aws-profile
```

### Running Tests
```bash
# Mobile tests
cd apps/mobile && npm test

# Infra tests
cd infra && npm test
```

## 📋 Features (MVP)

### Senior App
- 👋 Check-in button (4 big buttons max)
- 💊 Medication tracking
- 📷 Photo viewing with AI descriptions
- 📞 One-tap calling
- 🔊 Text-to-speech feedback

### Family App
- 📊 Dashboard with status
- 👋 Send emoji check-ins
- 📷 Share photos
- 🎤 Voice memos
- 💊 Configure medication reminders

## 📦 Lambda Functions

| Function | Purpose |
|----------|---------|
| `checkin` | Handle senior check-ins |
| `family` | Family operations |
| `medications` | Medication logging |
| `photos` | Photo upload/download |
| `notifications` | SNS push notifications |
