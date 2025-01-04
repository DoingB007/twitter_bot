const TwitterClient = require('./twitter-client');
const readline = require('readline');

function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  const twitter = new TwitterClient();
  
  console.log('Testing Twitter connection...');
  const isConnected = await twitter.testConnection();
  
  if (!isConnected) {
    console.log('Please check your Twitter API credentials in .env file');
    return;
  }

  console.log('\n--- Getting tweets from a user ---');
  const username = await askQuestion('请输入要查看推特的用户名 (不含@): ');
  const tweetCount = await askQuestion('请输入要获取的推特数量 (默认5): ') || '5';
  
  const userTweets = await twitter.getUserTweets(username, parseInt(tweetCount));
  if (userTweets) {
    console.log(`\n@${username} 的最新推特:`);
    userTweets.forEach((tweet, index) => {
      console.log(`${index + 1}. ${tweet.text}`);
      console.log(`   Posted: ${tweet.created_at}\n`);
    });
  }

  console.log('\n--- Searching for tweets ---');
  const searchQuery = await askQuestion('请输入搜索关键词: ');
  const searchCount = await askQuestion('请输入要获取的推特数量 (默认5): ') || '5';
  
  const searchResults = await twitter.searchTweets(searchQuery, parseInt(searchCount));
  if (searchResults) {
    console.log(`\n关键词 "${searchQuery}" 的搜索结果:`);
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