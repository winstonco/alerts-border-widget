const fs = require('fs');
const toml = require('toml');
const config = toml.parse(fs.readFileSync('/config.toml', 'utf-8'));

let slideTime = (config.slide-duration / 1000).toString + "s";

// Set css variables
$(':root').css({
	'--width': config.width,
  '--height': config.height,
  '--alert-height': config.alert-height,
  '--alert-border': '7px;',
  '--text-color': config.text-color,
  '--back-color': config.back-color,
	'--slide-duration': slideTime
});

const socket = io('wss://alerts-border-widget.onrender.com', {
	path: '/ws/'
});

const eventQueue = [];
var waiting = true;

socket.on('connect', () => {
	console.log("Connected!");
	eventPopup();
});

socket.on('alert', (message, username) => {
	console.log(message, username);
	eventQueue.push({'msg': message, 'user': username});
	console.log(eventQueue);
	if (waiting) { eventPopup(); }
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
	await delay(config.slide-duration);
	$('.alert-container').removeClass('slide-up')
	console.log(eventQueue);
	await delay();	
	(eventQueue.length > 0 == true) ? eventPopup() : waiting = true;
}

/**
 * Function to delay by a time given in milliseconds.
 * @param {number} [time=1000] The time to wait in milliseconds.
 * @returns A Promise that resolves after waiting.
 */
function delay(time = 1000) {
  return new Promise(resolve => {
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
	console.log("Cleared the queue!");
	console.log(eventQueue);
}

/**
 * Used to test the pop up animation
 */
function testPopup() {
	console.log("Testing popup!");
	eventQueue.push({'msg': "This is a test", 'user': "testuser"});
	if (waiting) { eventPopup(); }
}