// Code modified from: https://dev.twitch.tv/docs/eventsub/handling-webhook-events#simple-nodejs-example

import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import cors from 'cors';

import {
  TWITCH_MESSAGE_SIGNATURE,
  MESSAGE_TYPE,
  MESSAGE_TYPE_VERIFICATION,
  MESSAGE_TYPE_NOTIFICATION,
  MESSAGE_TYPE_REVOCATION,
  HMAC_PREFIX,
  getSecret,
  getHmacMessage,
  getHmac,
  verifyMessage,
} from './twitch.js';

const PORT = process.env.PORT ?? 8080;
const ORIGIN =
  process.env.ORIGIN ?? 'https://alerts-border-widget.onrender.com';
const app = express();
const server = createServer(app);

const corsOptions = {
  origin: ORIGIN,
};

app.get('/', cors(corsOptions), (req, res) => {
  res.send('Alerts Border Widget server');
});

app.get('/health', (req, res) => {
  res.status(200);
});

app.use(
  express.raw({
    // Need raw message body for signature verification
    type: 'application/json',
  })
);

const io = new Server(server);

io.on('connection', (socket) => {
  console.log('connected');

  socket.on('pingy', () => {
    console.log('pingy');
    socket.emit('pongy');
  });
});

app.post('/eventsub', (req, res) => {
  console.log(req.body);
  let secret = getSecret();
  let message = getHmacMessage(req);
  let hmac = HMAC_PREFIX + getHmac(secret, message); // Signature to compare

  if (true === verifyMessage(hmac, req.headers[TWITCH_MESSAGE_SIGNATURE])) {
    console.log('signatures match');

    // Get JSON object from body, so you can process the message.
    let notification = JSON.parse(req.body);
    //console.log(notification);

    if (MESSAGE_TYPE_NOTIFICATION === req.headers[MESSAGE_TYPE]) {
      let type = notification.subscription.type;
      let user = notification.event.user_name;
      switch (type) {
        case 'channel.follow':
          console.log(`Received a follow from: ${user}`);
          io.emit('alert', 'New Follow!', user);
          break;
        case 'channel.subscribe':
          if (!notification.event.is_gift) {
            var tier = parseInt(notification.event.tier) / 1000;
            console.log(`Received a subscription from: ${user}`);
            io.emit('alert', `New Tier ${tier} Sub!`, user);
          }
          break;
        case 'channel.subscription.gift':
          var tier = parseInt(notification.event.tier) / 1000;
          var total = notification.event.total;
          console.log(`User: ${user} gifted ${total} subs`);
          io.emit('alert', `${total} gifted subs!`, user);
          break;
        case 'channel.cheer':
          var bits = notification.event.bits;
          console.log(`User: ${user} gifted ${total} subs`);
          io.emit('alert', `Cheer: ${bits}!`, user);
          break;
        default:
          console.log(`Not handled: ${type}`);
          io.emit('alert', `Alert! ${type}`, user);
          break;
      }

      console.log(`Event type: ${notification.subscription.type}`);
      console.log(JSON.stringify(notification, null, 4));

      res.sendStatus(204);
    } else if (MESSAGE_TYPE_VERIFICATION === req.headers[MESSAGE_TYPE]) {
      console.log(notification.challenge);
      res.status(200).send(notification.challenge);
    } else if (MESSAGE_TYPE_REVOCATION === req.headers[MESSAGE_TYPE]) {
      res.sendStatus(204);

      console.log(`${notification.subscription.type} notifications revoked!`);
      console.log(`reason: ${notification.subscription.status}`);
      console.log(
        `condition: ${JSON.stringify(
          notification.subscription.condition,
          null,
          4
        )}`
      );
    } else {
      res.sendStatus(204);
      console.log(`Unknown message type: ${req.headers[MESSAGE_TYPE]}`);
    }
  } else {
    console.log('403'); // Signatures didn't match.
    res.sendStatus(403);
  }
});

server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
