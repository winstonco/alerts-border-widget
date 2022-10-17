//get data from the 🤟 StreamElements 🤟 data injection
const name = '{{name}}';
const animation = 'wobble';

const socket = io('ws://localhost:8080');

socket.on('test emit', (param) => {
	console.log(param);
})

socket.on('follow', (username) => {
	console.log(username);
	eventPopup(`New follower!<br>${ username }`);
})

function eventPopup(message) {
	$('#message-container').html(message);
	//textContainer.classList.add('slide-down');
	$('.text-container').addClass('slide-down');
	setTimeout(() => {$('.text-container').removeClass('slide-down')}, 3000);
}