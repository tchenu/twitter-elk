require('dotenv').config();

const fs = require('fs')
const { Client } = require('@elastic/elasticsearch');
const Twitter = require('twitter');
const twitter = new Twitter({
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token_key: process.env.ACCESS_TOKEN_KEY,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET,
})

const elastic = new Client({
    cloud: {
        id: process.env.ELK_HOST,
    },
    auth: {
        apiKey: process.env.ELK_SECRET
    }
})

function log(message) {
    fs.appendFile('log.txt', `${message}\n`, function (err) {
        if (err) throw err;
    });
}

function search(query, id = 0) {
    const body = {
        q: query,
        lang: 'eu',
        count: '100',
    }

    if (id !== 0) {
        body.max_id = id + 1
    }

    return twitter.get('search/tweets', body);
}

async function aggregate(query) {
    log(`${query}: Start`)

    let lastId = 0
    let page = 0

    while (true) {
        let tweets = search(query, lastId)
        let end = false

        tweets.then(response => {
            if(response.statuses === []) {
                end = true
            } else {
                for (const tweet of response.statuses) {
                    lastId = tweet.id

                    elastic.index({
                        index: 'tweets',
                        body: {
                            "date": tweet.created_at,
                            "text": tweet.text,
                            "user": tweet.user.id,
                            "user_name": tweet.user.name
                        }
                    })
                }
            }
        })

        if (end) {
            break
        }

        if (page === 10) {
            log(`${query}: Waiting 16 minutes, actual page: ${page}`)
            await require('timers/promises').setTimeout(960000);
            log(`${query}: Waiting ended, retake the process.`)
        }

        page += 1
    }

    return  {message: `${query}: import ended!`}
}

aggregate('BTC')
    .then(data => log(data.message))
aggregate('ETH')
    .then(data => log(data.message))
aggregate('DOGE')
    .then(data => log(data.message))
aggregate('BNB')
    .then(data => log(data.message))
aggregate('LINK')
    .then(data => log(data.message))
aggregate('ADA')
    .then(data => log(data.message))
