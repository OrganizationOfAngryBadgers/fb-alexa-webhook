'use strict';

// Imports dependencies and set up http server
const 
  express = require('express'),
  bodyParser = require('body-parser'),
  request = require('request'),
  fs = require('file-system'),
  FB = require('fb'),
  app = express().use(bodyParser.json()), // creates express http server
  PAGE_ACCESS_TOKEN = "EAAV68YNS1E0BAAZC9ZCi3zXGdFNFhi22wbUz8SaTRznaEWE8n70I8IaGZADdXmhRy0rutJTdAmyyyY91DnjSpZAJrLZCE7v7d7QcJkBGUItZBrZBZALwRw4rMKswrgFNFZC6tpmb1vXC7axZBNj4Of4ZChoaEQ6v3LZBkBj7LZCZCnXzB80nOhyTJRWn7N";


// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

// Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {  
 
  let body = req.body;

  // Checks this is an event from a page subscription
  if (body.object === 'page') {

    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {

      // Gets the message. entry.messaging is an array, but 
      // will only ever contain one message, so we get index 0
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);

      let sender_psid = webhook_event.sender.id;
      console.log('Sender  PSID: ' + sender_psid);
      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
         handleMessage(sender_psid, webhook_event.message);        
      } else if (webhook_event.postback) {
         handlePostback(sender_psid, webhook_event.postback);
      }
    });

    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

  // Your verify token. Should be a random string.
  let VERIFY_TOKEN = "9mSvHeBKKcZjttAFKfsG"
    
  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
    
  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
  
    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      
      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);      
    }
  }
});

// Handles messages events
function handleMessage(sender_psid, received_message) {
let response;



  var str = received_message.text;
  var cmd;
  var msg;
  var n = str.indexOf(" ");
  if (n > 0) {
    cmd = str.slice(0, n);
    msg = str.slice(n + 1, str.length + 1);
    console.log("SPLIT SUCCESS: " + cmd + "---" + msg);
  } else {
    cmd = "";
    msg = str;
    console.log("SPLIT FAILURE: " + msg);
  }

  if (cmd.localeCompare("") == 0 || cmd.localeCompare("add") == 0 || cmd.localeCompare("Add") == 0) {
    
    console.log(cmd.localeCompare("") + " " + cmd);
 


    manageWordList(sender_psid, msg);
  } else if (cmd.localeCompare("words") == 0 && msg.localeCompare("show") == 0) {
    getWordList(sender_psid);
  } else if (cmd.localeCompare("words") == 0 && msg.localeCompare("random") == 0)  {
    console.log("RANDOM WORDS");
  } else if (cmd.localeCompare("events") == 0 && msg.localeCompare("get") == 0)  {
    getEvents();
  } else if (cmd.localeCompare("post") == 0 && msg.length > 1)  {
    postToFeed(sender_psid, msg);
  } else {
    // Create the payload for a basic text message
    response = {
      "text": "INVALID COMMAND"
    }
    callSendAPI(sender_psid, response);
  }

}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {

}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
  let PAGE_ACCESS_TOKEN = "EAAV68YNS1E0BAAZC9ZCi3zXGdFNFhi22wbUz8SaTRznaEWE8n70I8IaGZADdXmhRy0rutJTdAmyyyY91DnjSpZAJrLZCE7v7d7QcJkBGUItZBrZBZALwRw4rMKswrgFNFZC6tpmb1vXC7axZBNj4Of4ZChoaEQ6v3LZBkBj7LZCZCnXzB80nOhyTJRWn7N"

    // Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }
  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  }); 
}

function validateWord(word) {
  var patt = new RegExp("[^a-zA-Z!@#$%&*?:;'._-]+");
  if (patt.test(word) == true) {
    console.log("WORD FAILS: " + word);     
    return false;
  }
  console.log("WORD WORKS: " + word);
  return true;
}


function manageWordList(sender_psid, word) {
  // Check if the message contains text
  if (word && validateWord(word)) {

    fs.writeFile('./wordlists/' + sender_psid, word + ' ', { flag: 'a' }, function(err) {
      if(err) {
        return console.log(err);
      }

      console.log("The file was saved!");
      getWordList(sender_psid);
    });

  } else {
    // Create the payload for a basic text message
    let response = {
      "text": "INVALID COMMAND"
    }
    callSendAPI(sender_psid, response);
  }
}


function getWordList(sender_psid) {
  fs.readFile('./wordlists/' + sender_psid, 'utf8', function (err,data) {
    if (err) {
      return console.log(err);
    }
    console.log(data);


    // Create the payload for a basic text message
    let response = {
      "text": "Your words are: " + data
    }


    // Sends the response message
    callSendAPI(sender_psid, response);


  });
}

function postToFeed(sender_psid, msg) {
  FB.setAccessToken(PAGE_ACCESS_TOKEN);
  FB.api('me/feed', 'post', { message: msg }, function (res) {
    if(!res || res.error) {
      console.log(!res ? 'error occurred' : res.error);
      let response = {
        "text": "Error Posting to Feed"
      }
      callSendAPI(sender_psid, response);
      return;
    }
    console.log('Post Id: ' + res.id);

    let response = {
      "text": "Post Successful!"
    }
    callSendAPI(sender_psid, response);
  });
}


function getEvents() {
  FB.setAccessToken(PAGE_ACCESS_TOKEN);
  FB.api('me/events.limit=50', 'get', function (res) {
    if(!res || res.error) {
      console.log(!res ? 'error occurred' : res.error);
      let response = {
       "text": "Error getting Events"
      }
      callSendAPI(sender_psid, response);
      return;
    }
    console.log(res.id);
    console.log(res.name);
    console.log(res.place.name);
    console.log(res.description);
    console.log(res.start_time);
    console.log(res.end_time);
    

    let response = {
      "text": JSON.stringify(res)
    }
    callSendAPI(sender_psid, response);
  });
}
