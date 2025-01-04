require('dotenv').config();
const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');
const path = require('path');

class TwitterClient {
  constructor(options = {}) {
    this.client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    });
    
    this.bearer = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);
    this.readOnlyClient = this.bearer.readOnly;
    
    this.cacheEnabled = options.cache !== false;
    this.cacheDir = options.cacheDir || path.join(__dirname, '.cache');
    this.cacheTTL = options.cacheTTL || 5 * 60 * 1000; // 5 minutes default
    
    if (this.cacheEnabled) {
      this._initCache();
    }
  }

  _initCache() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  _getCacheKey(type, params) {
    const key = `${type}_${JSON.stringify(params)}`;
    return key.replace(/[^a-zA-Z0-9]/g, '_');
  }

  _getCachePath(cacheKey) {
    return path.join(this.cacheDir, `${cacheKey}.json`);
  }

  _readCache(cacheKey) {
    if (!this.cacheEnabled) return null;
    
    const cachePath = this._getCachePath(cacheKey);
    if (!fs.existsSync(cachePath)) return null;
    
    try {
      const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      if (Date.now() - cacheData.timestamp > this.cacheTTL) {
        fs.unlinkSync(cachePath);
        return null;
      }
      return cacheData.data;
    } catch (error) {
      return null;
    }
  }

  _writeCache(cacheKey, data) {
    if (!this.cacheEnabled) return;
    
    const cachePath = this._getCachePath(cacheKey);
    const cacheData = {
      timestamp: Date.now(),
      data: data
    };
    
    try {
      fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2));
    } catch (error) {
      console.warn('Failed to write cache:', error.message);
    }
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
    const cacheKey = this._getCacheKey('userTweets', { username, count });
    const cachedData = this._readCache(cacheKey);
    
    if (cachedData) {
      console.log(`Using cached data for @${username} tweets`);
      return cachedData;
    }
    
    try {
      const user = await this.readOnlyClient.userByUsername(username);
      const tweets = await this.readOnlyClient.userTimeline(user.data.id, {
        max_results: count,
        'tweet.fields': ['created_at', 'public_metrics', 'text']
      });
      
      if (tweets.data) {
        this._writeCache(cacheKey, tweets.data);
      }
      
      return tweets.data;
    } catch (error) {
      console.error(`Failed to get tweets for @${username}:`, error.message);
      return null;
    }
  }

  async searchTweets(query, count = 10) {
    const cacheKey = this._getCacheKey('searchTweets', { query, count });
    const cachedData = this._readCache(cacheKey);
    
    if (cachedData) {
      console.log(`Using cached data for search: "${query}"`);
      return cachedData;
    }
    
    try {
      const tweets = await this.readOnlyClient.search(query, {
        max_results: count,
        'tweet.fields': ['created_at', 'public_metrics', 'author_id']
      });
      
      if (tweets.data) {
        this._writeCache(cacheKey, tweets.data);
      }
      
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