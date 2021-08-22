const fetch = require('node-fetch')
const fs = require('fs')

var myHeaders = new fetch.Headers();
myHeaders.append("Authorization", `Bearer ${process.env.BEARER}`);

var requestOptions = {
  method: 'GET',
  headers: myHeaders,
  redirect: 'follow'
};

var url = "https://api.twitter.com/2/tweets/search/recent?query=cityhallselfie&tweet.fields=attachments,author_id,context_annotations,conversation_id,created_at,entities,geo,id,in_reply_to_user_id,lang,non_public_metrics,organic_metrics,possibly_sensitive,promoted_metrics,public_metrics,referenced_tweets,reply_settings,source,text,withheld&place.fields=contained_within,country,country_code,full_name,geo,id,name,place_type&user.fields=created_at,description,entities,id,location,name,pinned_tweet_id,profile_image_url,protected,public_metrics,url,username,verified,withheld&max_results=100"

let getTwitterData = async (url, requestOptions) => {
  let twitterData = [];
  let response = await fetch(url, requestOptions);
  let results = await response.json();
  let nextToken = results.meta.next_token;

  do {
    results.data.forEach(element => twitterData.push(element));
    let res = await fetch(`https://api.twitter.com/2/tweets/search/recent?query=cityhallselfie&max_results=100&next_token=${nextToken}`, requestOptions)
    let secondResult = await res.json();
    nextToken = secondResult.meta.next_token;
    secondResult.data.forEach(element => twitterData.push(element));
  } while (nextToken != null)
  return twitterData;
}

let getTwitterEmbed = async (tweets) => {
  let embedData = []
  for(let i = 0;i<tweets.length;i++) {
      let response = await fetch(`https://publish.twitter.com/oembed?url=https://twitter.com/Interior/status/${tweets[i].id}`);
      let result = await response.json();
      embedData.push(result);
  }
  return embedData;
} 

let twitterData = [];

getTwitterData(url, requestOptions)
    .then(result => {
        twitterData.push(result);
        return getTwitterEmbed(result, requestOptions);
    })
    .then(result => JSON.stringify(result))
    .then(result => {
        fs.writeFile('./tweets.json', JSON.stringify(twitterData), err => {
            if (err) {
                console.log('Error writing file', err)
            } else {
                console.log('Successfully wrote file')
            }
        });
        fs.writeFile('./embedCode.json', result, err => {
            if (err) {
                console.log('Error writing file', err)
            } else {
                console.log('Successfully wrote file')
            }
        });
    })
