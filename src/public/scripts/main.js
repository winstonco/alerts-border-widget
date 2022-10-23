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

function eventPopup() {
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
	setTimeout(() => {
		$('.alert-container').removeClass('slide-up')
		console.log(eventQueue);
		setTimeout(() => {
			(eventQueue.length > 0 == true) ? eventPopup() : waiting = true;
		}, 1000);
	}, 3000);
}

/**
 * Used to clear the queue.
 */
function emptyQueue() {
	eventQueue.length = 0;
	console.log("Cleared the queue!");
	console.log(eventQueue);
}