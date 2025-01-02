require('dotenv').config();
const { TwitterApi } = require('twitter-api-v2');

class TwitterClient {
  constructor() {
    this.client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    });
    
    this.bearer = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);
    this.readOnlyClient = this.bearer.readOnly;
  }

  async testConnection() {
    try {
      const me = await this.readOnlyClient.currentUser();
      console.log('Connected to Twitter successfully!');
      console.log(`Authenticated as: @${me.username}`);
      return true;
    } catch (error) {
      console.error('Failed to connect to Twitter:', error.message);
      return false;
    }
  }

  async getUserTweets(username, count = 10) {
    try {
      const user = await this.readOnlyClient.userByUsername(username);
      const tweets = await this.readOnlyClient.userTimeline(user.data.id, {
        max_results: count,
        'tweet.fields': ['created_at', 'public_metrics', 'text']
      });
      
      return tweets.data;
    } catch (error) {
      console.error(`Failed to get tweets for @${username}:`, error.message);
      return null;
    }
  }

  async searchTweets(query, count = 10) {
    try {
      const tweets = await this.readOnlyClient.search(query, {
        max_results: count,
        'tweet.fields': ['created_at', 'public_metrics', 'author_id']
      });
      
      return tweets.data;
    } catch (error) {
      console.error(`Failed to search tweets:`, error.message);
      return null;
    }
  }

  async streamTweets(rules = []) {
    try {
      if (rules.length > 0) {
        await this.bearer.v2.updateStreamRules({
          add: rules
        });
      }

      const stream = await this.bearer.v2.searchStream({
        'tweet.fields': ['created_at', 'public_metrics', 'author_id']
      });

      console.log('Starting Twitter stream...');
      
      stream.on('data', (tweet) => {
        console.log('New tweet:', tweet.text);
      });

      stream.on('error', (error) => {
        console.error('Stream error:', error);
      });

      return stream;
    } catch (error) {
      console.error('Failed to start stream:', error.message);
      return null;
    }
  }
}

module.exports = TwitterClient;