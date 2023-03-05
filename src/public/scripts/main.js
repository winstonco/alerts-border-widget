const shownConsole = {
  log(msg) {
    if (msg) {
      const ul = document.getElementById('ul');
      const li = document.createElement('li');
      li.appendChild(document.createTextNode(msg));
      ul.appendChild(li);
    }
  },
};

const SERVER_URL = 'https://alerts-border-widget.onrender.com';
shownConsole.log(SERVER_URL);
console.log(SERVER_URL);

const socket = io(SERVER_URL);

const eventQueue = [];
let disabled = true;
let up = false;
let waiting = true;

socket.on('connect', () => {
  shownConsole.log('Connected');
  console.log('Connected!');
  eventPopup();
});

socket.on('alert', (message, username) => {
  shownConsole.log(message, username);
  console.log(message, username);
  if (!disabled) {
    eventQueue.push({ msg: message, user: username });
    if (waiting) {
      eventPopup();
    }
  }
});

async function eventPopup() {
  waiting = false;
  if (eventQueue.length > 0) {
    let next = eventQueue.shift();
    let message = next.msg;
    let username = next.user;
    shownConsole.log(username);
    console.log(username);
    shownConsole.log(message);
    console.log(message);
    document.getElementById('alert-message').innerHTML =
      message + '<br>' + username;
    document.getElementById('alert-container').classList.add('slide-up');
  }
  await delay(3000);
  document.getElementById('alert-container').classList.remove('slide-up');
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
 * Toggle disabling events
 */
function toggleDisable() {
  disabled = !disabled;
  document.getElementById('toggle').innerHTML = disabled
    ? 'Enable Events'
    : 'Disable Events';
}

/**
 * Toggle disabling events
 */
function toggleUp() {
  up = !up;
  up
    ? document.getElementById('alert-container').classList.add('up')
    : document.getElementById('alert-container').classList.remove('up');
}

/**
 * Used to clear the queue.
 */
function emptyQueue() {
  eventQueue.length = 0;
  shownConsole.log('Cleared the queue!');
  console.log('Cleared the queue!');
  console.log(eventQueue);
}

/**
 * Used to test the pop up animation
 */
function testPopup() {
  shownConsole.log('Testing popup!');
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
  shownConsole.log('Ping!');
  console.log('Ping!');
}

socket.on('pongy', () => {
  shownConsole.log('Time: ' + (Date.now() - start) + ' ms');
  console.log('Time: ' + (Date.now() - start) + ' ms');
  shownConsole.log('Pong!');
  console.log('Pong!');
});
