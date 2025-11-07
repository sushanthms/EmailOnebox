# Email Onebox - Feature-Rich Email Aggregator

A powerful email aggregation system with real-time synchronization, AI categorization, and integrations.

## 🚀 Features Implemented

### ✅ 1. Real-Time Email Synchronization
- **Multiple IMAP accounts** (minimum 2 accounts supported)
- **Last 30 days of emails** automatically fetched
- **Persistent IMAP connections** with IDLE mode for real-time updates
- **No cron jobs** - uses event-driven architecture

### ✅ 2. Searchable Storage with Elasticsearch
- **Locally hosted Elasticsearch** via Docker
- **Advanced email indexing** with full-text search
- **Filter by folder & account** functionality
- **Real-time search** with pagination

### ✅ 3. AI-Based Email Categorization
- **OpenAI integration** for intelligent categorization
- **5 categories supported**:
  - 📈 Interested
  - 📅 Meeting Booked
  - ❌ Not Interested
  - 🗑️ Spam
  - 🏖️ Out of Office
- **Batch processing** for efficiency

### ✅ 4. Slack & Webhook Integration
- **Slack notifications** for "Interested" emails
- **Webhook triggers** for external automation
- **Configurable endpoints** via environment variables

### ✅ 5. Backend API (Ready for Postman Testing)
- **RESTful API** with comprehensive endpoints
- **Account management** (add/remove IMAP accounts)
- **Email search & filtering** by category, folder, account
- **Real-time sync status** monitoring
- **Error handling** and logging

### ✅ 6. Production-Ready Features
- **Rate limiting** for API protection
- **Error handling** middleware
- **Redis caching** for performance
- **Docker support** with docker-compose
- **Environment configuration** management
- **Encryption** for sensitive data

## 🛠️ Technology Stack

- **Backend**: Node.js, TypeScript, Express
- **Database**: Elasticsearch (search), Redis (caching)
- **Email**: node-imap with IDLE mode
- **AI**: OpenAI GPT models
- **Integrations**: Slack API, Webhooks
- **Deployment**: Docker, Docker Compose

## 📋 Prerequisites

- Node.js (v16 or higher)
- Docker & Docker Compose
- OpenAI API key (free tier available)
- Slack Bot Token (optional)
- IMAP email accounts (Gmail, Outlook, etc.)

## 🚀 Quick Start

### 1. Clone and Setup
```bash
git clone <your-repo>
cd email-onebox
npm install
```

### 2. Environment Configuration
Copy the example environment file:
```bash
cp .env.example.txt .env
```

Edit `.env` with your configurations:
```env
# Required: OpenAI API Key (get from https://platform.openai.com)
OPENAI_API_KEY=your_openai_api_key_here

# Required: IMAP Accounts (minimum 2)
IMAP_HOST_1=imap.gmail.com
IMAP_USER_1=your-email@gmail.com
IMAP_PASS_1=your-app-password

IMAP_HOST_2=imap.outlook.com
IMAP_USER_2=your-outlook@outlook.com
IMAP_PASS_2=your-password

# Optional: Slack Integration
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_CHANNEL_ID=your-channel-id

# Optional: Webhook (use webhook.site for testing)
WEBHOOK_URL=https://webhook.site/your-unique-url
```

### 3. Start Infrastructure
```bash
docker-compose up -d
```

### 4. Start Application
```bash
npm run dev
```

### 5. Test with Postman
Import the Postman collection and test all endpoints.

## 📡 API Endpoints

### Account Management
- `POST /api/accounts` - Add IMAP account
- `GET /api/accounts` - List all accounts
- `GET /api/accounts/:id` - Get account details
- `DELETE /api/accounts/:id` - Remove account

### Email Operations
- `GET /api/emails/search?q=query` - Search emails
- `GET /api/emails/:id` - Get email by ID
- `GET /api/emails/category/:category` - Get emails by category
- `GET /api/emails/folder/:folder` - Get emails by folder

### Sync Management
- `POST /api/sync/start` - Start email synchronization
- `POST /api/sync/stop` - Stop synchronization
- `GET /api/sync/status` - Get sync status

### Integrations
- `POST /api/integrations/slack/test` - Test Slack integration
- `POST /api/integrations/webhook/test` - Test webhook integration

## 🔧 Configuration Guide

### Gmail IMAP Setup
1. Enable 2-factor authentication
2. Generate app-specific password
3. Use these settings:
   - Host: `imap.gmail.com`
   - Port: `993`
   - TLS: `true`

### Outlook IMAP Setup
1. Enable IMAP in settings
2. Use app password if 2FA is enabled
3. Use these settings:
   - Host: `imap.outlook.com`
   - Port: `993`
   - TLS: `true`

### OpenAI Setup (Free)
1. Sign up at https://platform.openai.com
2. Get API key from dashboard
3. Free tier includes GPT-3.5 access

### Slack Integration (Optional)
1. Create app at https://api.slack.com/apps
2. Add `chat:write` permission
3. Install to workspace
4. Get bot token and channel ID

### Webhook Testing
1. Go to https://webhook.site
2. Copy your unique URL
3. Add to `.env` file

## 🧪 Testing with Postman

### 1. Add Account
```http
POST http://localhost:3000/api/accounts
Content-Type: application/json

{
  "email": "your-email@gmail.com",
  "imap": {
    "host": "imap.gmail.com",
    "port": 993,
    "secure": true,
    "user": "your-email@gmail.com",
    "password": "your-app-password"
  }
}
```

### 2. Start Sync
```http
POST http://localhost:3000/api/sync/start
```

### 3. Search Emails
```http
GET http://localhost:3000/api/emails/search?q=meeting&accountId=your-account-id
```

### 4. Get Emails by Category
```http
GET http://localhost:3000/api/emails/category/interested
```

## 📊 Feature Completion Status

| Feature | Status | Notes |
|---------|--------|-------|
| Real-time IMAP Sync | ✅ | IDLE mode implemented |
| Multiple Accounts | ✅ | 2+ accounts supported |
| 30 Days History | ✅ | Configurable |
| Elasticsearch Storage | ✅ | Full-text search |
| AI Categorization | ✅ | 5 categories |
| Slack Integration | ✅ | Notifications for "Interested" |
| Webhook Integration | ✅ | External automation |
| Search & Filter | ✅ | By account, folder, category |
| API Endpoints | ✅ | Comprehensive REST API |
| Error Handling | ✅ | Middleware implemented |
| Rate Limiting | ✅ | API protection |
| Docker Support | ✅ | Ready for deployment |

## 🎯 Next Steps for Frontend

The backend is complete and ready for frontend integration. Recommended frontend technologies:
- **React** with TypeScript
- **Material-UI** or **Tailwind CSS** for styling
- **Axios** for API calls
- **Socket.io** for real-time updates

## 📞 Support

For issues or questions:
1. Check the logs in the console
2. Review the `.env` configuration
3. Ensure Docker containers are running
4. Verify IMAP credentials are correct

## 🏆 Leaderboard Submission

This implementation includes all required features for the assignment:
- ✅ Real-time email synchronization
- ✅ Multiple IMAP accounts
- ✅ Elasticsearch integration
- ✅ AI-based categorization
- ✅ Slack & webhook integrations
- ✅ Comprehensive API
- ✅ Production-ready features

Ready for Postman testing and frontend integration!