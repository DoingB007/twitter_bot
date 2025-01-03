# Twitter Monitor

A Node.js application for connecting to and monitoring Twitter.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Add your Twitter API credentials to the `.env` file:
   - Get your credentials from [Twitter Developer Portal](https://developer.twitter.com/)
   - Fill in all the required fields in `.env`

## Usage

Run the application:
```bash
npm start
```

## Features

- **Connection Testing**: Verify your Twitter API credentials
- **User Tweets**: Fetch recent tweets from any user
- **Tweet Search**: Search for tweets by keywords
- **Real-time Streaming**: Monitor tweets in real-time with filters

## Twitter API Credentials

You need the following credentials from Twitter Developer Portal:
- Bearer Token (for read-only access)
- API Key & Secret (for app authentication)
- Access Token & Secret (for user authentication)

## Example Usage

```javascript
const TwitterClient = require('./twitter-client');

const twitter = new TwitterClient();

// Test connection
await twitter.testConnection();

// Get user tweets
const tweets = await twitter.getUserTweets('username', 10);

// Search tweets
const results = await twitter.searchTweets('javascript', 20);

// Start streaming
const stream = await twitter.streamTweets([
  { value: 'javascript OR nodejs' }
]);
```