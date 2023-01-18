const SERVER_URL = 'https://alerts-border-widget.onrender.com'; // 'http://localhost:8080';
console.log(SERVER_URL);

const socket = io(SERVER_URL);

const eventQueue = [];
var waiting = true;

socket.on('connect', () => {
  console.log('Connected!');
  eventPopup();
});

socket.on('alert', (message, username) => {
  console.log(message, username);
  eventQueue.push({ msg: message, user: username });
  console.log(eventQueue);
  if (waiting) {
    eventPopup();
  }
});

async function eventPopup() {
  waiting = false;
  if (eventQueue.length > 0) {
    let next = eventQueue.shift();
    let message = next.msg;
    let username = next.user;
    console.log(username);
    console.log(message);
    $('#alert-message').html(message + '<br>' + username);
    $('.alert-container').addClass('slide-up');
  }
  await delay(3000);
  $('.alert-container').removeClass('slide-up');
  console.log(eventQueue);
  await delay();
  eventQueue.length > 0 == true ? eventPopup() : (waiting = true);
}

/**
 * Function to delay by a time given in milliseconds.
 * @param {number} [time=1000] The time to wait in milliseconds.
 * @returns A Promise that resolves after waiting.
 */
function delay(time = 1000) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('resolved');
    }, time);
  });
}

/**
 * Used to clear the queue.
 */
function emptyQueue() {
  eventQueue.length = 0;
  console.log('Cleared the queue!');
  console.log(eventQueue);
}

/**
 * Used to test the pop up animation
 */
function testPopup() {
  console.log('Testing popup!');
  eventQueue.push({ msg: 'This is a test', user: 'testuser' });
  if (waiting) {
    eventPopup();
  }
}

var start;
/**
 * Pings the server.
 */
function ping() {
  start = Date.now();
  socket.emit('pingy');
  console.log('Ping!');
}

socket.on('pongy', () => {
  console.log('Time: ' + (Date.now() - start) + ' ms');
  console.log('Pong!');
});
