// Code modified from: https://dev.twitch.tv/docs/eventsub/handling-webhook-events#simple-nodejs-example

const crypto = require('crypto');
const express = require('express');
const path = require('path');
const app = express();
const port = 8080;
const server = app.listen(port, () => {
    //console.log(`listening at http://localhost:${port}`);
    console.log(`listening at https://alerts-border-widget.onrender.com`);
});
const io = require('socket.io')(server, {
    path: '/ws/'
});


app.use('/public', express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection', (socket) => {
	console.log('connected');
})

// Notification request headers
const TWITCH_MESSAGE_ID = 'Twitch-Eventsub-Message-Id'.toLowerCase();
const TWITCH_MESSAGE_TIMESTAMP = 'Twitch-Eventsub-Message-Timestamp'.toLowerCase();
const TWITCH_MESSAGE_SIGNATURE = 'Twitch-Eventsub-Message-Signature'.toLowerCase();
const MESSAGE_TYPE = 'Twitch-Eventsub-Message-Type'.toLowerCase();

// Notification message types
const MESSAGE_TYPE_VERIFICATION = 'webhook_callback_verification';
const MESSAGE_TYPE_NOTIFICATION = 'notification';
const MESSAGE_TYPE_REVOCATION = 'revocation';

// Prepend this string to the HMAC that's created from the message
const HMAC_PREFIX = 'sha256=';

app.use(express.raw({          // Need raw message body for signature verification
    type: 'application/json'
}))

app.post('/eventsub', (req, res) => {
    let secret = getSecret();
    let message = getHmacMessage(req);
    let hmac = HMAC_PREFIX + getHmac(secret, message);  // Signature to compare

    console.log(JSON.parse(req.body));

    if (true === verifyMessage(hmac, req.headers[TWITCH_MESSAGE_SIGNATURE])) {
        console.log("signatures match");

        // Get JSON object from body, so you can process the message.
        let notification = JSON.parse(req.body);
        //console.log(notification);
        
        if (MESSAGE_TYPE_NOTIFICATION === req.headers[MESSAGE_TYPE]) {
            
            let type = notification.subscription.type
            let user = notification.event.user_name;
            switch (type) {
                case 'channel.follow':
                    console.log(`Received a follow from: ${ user }`);
                    io.emit('alert', 'New Follow!', user);
                    break;
                case 'channel.subscribe':
                    if (!notification.event.is_gift) {
                        var tier = parseInt(notification.event.tier) / 1000;
                        console.log(`Received a subscription from: ${ user }`);
                        io.emit('alert', `New Tier ${ tier } Sub!`, user);
                    }
                    break;
                case 'channel.subscription.gift':
                    var tier = parseInt(notification.event.tier) / 1000;
                    var total = notification.event.total;
                    console.log(`User: ${ user } gifted ${ total } subs`);
                    io.emit('alert', `${ total } gifted subs!`, user);
                    break;
                case 'channel.cheer':
                    var bits = notification.event.bits;
                    console.log(`User: ${ user } gifted ${ total } subs`);
                    io.emit('alert', `Cheer: ${ bits }!`, user);
                    break;
            }

            console.log(`Event type: ${notification.subscription.type}`);
            console.log(JSON.stringify(notification, null, 4));
            
            res.sendStatus(204);
        }
        else if (MESSAGE_TYPE_VERIFICATION === req.headers[MESSAGE_TYPE]) {
            console.log(notification.challenge);
            res.status(200).send(notification.challenge);
        }
        else if (MESSAGE_TYPE_REVOCATION === req.headers[MESSAGE_TYPE]) {
            res.sendStatus(204);

            console.log(`${notification.subscription.type} notifications revoked!`);
            console.log(`reason: ${notification.subscription.status}`);
            console.log(`condition: ${JSON.stringify(notification.subscription.condition, null, 4)}`);
        }
        else {
            res.sendStatus(204);
            console.log(`Unknown message type: ${req.headers[MESSAGE_TYPE]}`);
        }
    }
    else {
        console.log('403');    // Signatures didn't match.
        res.sendStatus(403);
    }
})


function getSecret() {
    // TODO: Get secret from secure storage. This is the secret you pass 
    // when you subscribed to the event.
    return 'ypref2tqgh5m0vm4wv09v7oytbfmfk';
}

// Build the message used to get the HMAC.
function getHmacMessage(request) {
    return (request.headers[TWITCH_MESSAGE_ID] + 
        request.headers[TWITCH_MESSAGE_TIMESTAMP] + 
        request.body);
}

// Get the HMAC.
function getHmac(secret, message) {
    return crypto.createHmac('sha256', secret)
    .update(message)
    .digest('hex');
}

// Verify whether our hash matches the hash that Twitch passed in the header.
function verifyMessage(hmac, verifySignature) {
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(verifySignature));
}