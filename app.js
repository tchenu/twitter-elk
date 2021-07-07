require('dotenv').config();

const { Client } = require('@elastic/elasticsearch');
const Twitter = require('twitter');
const twitter = new Twitter({
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token_key: process.env.ACCESS_TOKEN_KEY,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET,
})

const elastic = new Client({ node: 'http://localhost:9200' })

const stream = twitter.stream('statuses/filter', {track: 'BTC'});

stream.on('data', async function(event) {
    await elastic.index({
        index: 'tweets',
        body: {
          text: event.text
        }
      })    
});

stream.on('error', function(error) {
  throw error;
});
                
	        