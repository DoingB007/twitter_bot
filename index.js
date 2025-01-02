const TwitterClient = require('./twitter-client');

async function main() {
  const twitter = new TwitterClient();
  
  console.log('Testing Twitter connection...');
  const isConnected = await twitter.testConnection();
  
  if (!isConnected) {
    console.log('Please check your Twitter API credentials in .env file');
    return;
  }

  console.log('\n--- Example: Getting recent tweets from a user ---');
  const userTweets = await twitter.getUserTweets('elonmusk', 5);
  if (userTweets) {
    userTweets.forEach((tweet, index) => {
      console.log(`${index + 1}. ${tweet.text}`);
      console.log(`   Posted: ${tweet.created_at}\n`);
    });
  }

  console.log('\n--- Example: Searching for tweets ---');
  const searchResults = await twitter.searchTweets('javascript', 5);
  if (searchResults) {
    searchResults.forEach((tweet, index) => {
      console.log(`${index + 1}. ${tweet.text}`);
      console.log(`   Posted: ${tweet.created_at}\n`);
    });
  }

  console.log('\n--- Example: Starting a filtered stream ---');
  const streamRules = [
    { value: 'javascript OR nodejs' }
  ];
  
  const stream = await twitter.streamTweets(streamRules);
  if (stream) {
    console.log('Stream started. Press Ctrl+C to stop.');
    
    setTimeout(() => {
      console.log('Stopping stream...');
      stream.close();
    }, 30000); // Stop after 30 seconds
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };