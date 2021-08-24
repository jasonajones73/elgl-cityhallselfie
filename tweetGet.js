const fetch = require('node-fetch')
const fs = require('fs')

var myHeaders = new fetch.Headers();
myHeaders.append("Authorization", `Bearer ${process.env.BEARER}`);

var requestOptions = {
  method: 'GET',
  headers: myHeaders,
  redirect: 'follow'
};

var url = "https://api.twitter.com/2/tweets/search/recent?query=cityhallselfie&max_results=100&expansions=attachments.poll_ids,attachments.media_keys,author_id,in_reply_to_user_id,referenced_tweets.id&place.fields=contained_within,country,country_code,full_name,geo,id,name,place_type&user.fields=created_at,description,entities,id,location,name,pinned_tweet_id,profile_image_url,protected,public_metrics,url,username,verified,withheld&tweet.fields=public_metrics,author_id,created_at,in_reply_to_user_id,referenced_tweets,source"

let getTwitterData = async (url, requestOptions) => {
    let nextToken = null;
    let response = await fetch(url, requestOptions);
    let results = await response.json();
    results.meta.hasOwnProperty('next_token') ? nextToken = results.meta.next_token : nextToken = null;
    let twitterData = results;
  
    while (nextToken != null) {
      let res = await fetch(url + `&next_token=${nextToken}`, requestOptions)
      let secondResult = await res.json();
      nextToken = secondResult.meta.next_token;
      secondResult.data.forEach(element => twitterData.data.push(element));
      secondResult.includes.hasOwnProperty('users') ? secondResult.includes.users.forEach(element => twitterData.includes.users.push(element)) : console.log('No users object found')
      secondResult.includes.hasOwnProperty('tweets') ? secondResult.includes.tweets.forEach(element => twitterData.includes.tweets.push(element)) : console.log('No tweets object found')
      secondResult.includes.hasOwnProperty('media') ? secondResult.includes.media.forEach(element => twitterData.includes.media.push(element)) : console.log('No media object found')
    }
    return twitterData;
  }
  
  let getTwitterEmbed = async (tweets) => {
    let embedData = []
    for(let i = 0;i<tweets.data.length;i++) {
        let response = await fetch(`https://publish.twitter.com/oembed?url=https://twitter.com/Interior/status/${tweets.data[i].id}`);
        let result = await response.json();
        embedData.push(result);
    }
    return embedData;
  } 
  
  let twitterData = null;
  
  getTwitterData(url, requestOptions)
      .then(result => {
          twitterData = result;
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