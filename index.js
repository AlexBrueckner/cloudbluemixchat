//Authors: Alexander Brückner, 742830
//	       Franziska Drobnik, 742079
//Based on https://socket.io/get-started/chat/


//All the modules we need
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var express = require('express');
//3 Arrays, usage explained further down 
var sockets = [];
var names = [];
var clients = [];

//Utility function.. Somewhat useless as we can inline this, then again, what are interpreters for?
function getUsers(){
return clients.toString();
}

//Utility function, formats a timestamp out of a Date-object
//Courtesy of StackOverflow, minor adjustments on our side:
//http://stackoverflow.com/questions/221294/how-do-you-get-a-timestamp-in-javascript


function displayTime() {
    var str = "";
	//What this does is pretty straight forward:
	//Grab a Date object
    var currentTime = new Date()
	//Extract hours, minutes and seconds out of it
    var hours = currentTime.getHours()
    var minutes = currentTime.getMinutes()
    var seconds = currentTime.getSeconds()
	//If we have less than 10 minutes on the clock, prefix it with a zero to have a 
	//handy dandy standard format
    if (minutes < 10) {
        minutes = "0" + minutes
    }
	//Same for seconds
    if (seconds < 10) {
        seconds = "0" + seconds
    }
	//It uses A.M. and P.M. Time format for the hours, so we need to add this
    str += hours + ":" + minutes + ":" + seconds + " ";
    if(hours > 11){
        str += "PM"
    } else {
        str += "AM"
    }
	//and aaawwaaaaayyyyy we go!
    return str+"";
}

//Routes for express
app.use(express.static(__dirname + '/public'));

//This is the primary route you should take. <IP>:3000 will then fetch the index for you
app.get('/', function(req, res){
  res.sendFile(__dirname + '/public/html/index.html');
});
//And if we get onto the chat, we serve this.
app.get('/chat.html', function(req, res){
  res.sendFile(__dirname + '/public/html/chat.html');
});

//Should the user be funny and try to access another page, Node will tell him it didn't work out.

//Main socket event handler
io.on('connection', function(socket){
//When somebody happens to join us, let everyone else know and register it on the server
	socket.on('clientjoin',function(clientName){
	//Assuming his name is not yet taken..
	if(clients.indexOf(clientName) > -1){
		socket.emit('nametaken','Username already taken');
		return;
	}
	//I had a dilemma. Either use a O(n) worst-case loop to find the socket when he
	//disconnects, or save it in both ways.. 'We have so much memory that nobody
	//cares about storage efficiency anymore' - Someone on the internet

	//socket[name] -> Mapping of Names to Sockets
	sockets[clientName] = socket;
	//names[socket] -> Mapping of socket-ids to their names (Arrays here are KIND of a map,
	//but also too "arrayly" to behave like an actual map.. )
	names[socket.id] = clientName;
	//And just for the sake of easy access, store the name a 2nd time in a "normal" array
	//this seems like a waste of memory, but it also removes the burden of dealing with JSON 
	//when trying to list all the users. So it is a tradeoff between memory wasting and less code.
	clients.push(clientName);
	//Since we are now part of the chat, let's let everybody know we're here
	io.emit('serverannouncement',displayTime() + ' User connected: ' + clientName + ' - Welcome!');
	//And give something to the debugging-person that he/she can read out on his/her CLI
	console.log('User ' + clientName + ' connected.');
	});

	//When people get tired of the chat, we should clean up the mess we made with all the variables
	socket.on('disconnect', function(){
		var temp = names[socket.id];
		//This particular piece of code is something I am not very proud of.. But people say "It ain't stupid if it works"
		//First we're saving the name of the socket we wish to remove	
		//And for the sake of logging
		//let everybody know we're leaving this place
		io.emit('serverannouncement',displayTime() + ' User disconnected: ' + temp + ' - Farewell!');
		console.log('User ' + names[socket.id] + ' disconnected');	
		//Then we use this to remove the socket (which is currently still valid, as we're in its eventhandler) out of the userlist	
		//Then we purge the names list of his presence
		clients.splice(clients.indexOf(names[socket.id]), 1);
		delete names[socket.id];	
		delete sockets[temp];
		temp = "";
	});

	//This is where the magic happens. We react to a message sent from the client and send it to everyone else
	socket.on('chat message', function(msg){

	//Do we have a message in the first place?
    if(msg){
		//Is it a command?
      if(msg.startsWith('/')){
		//Is it a private message? -> Couldn't put this into the switch-statement as we're segmenting this private message string
		//This is also the reason we're not permitting Whitespaces in nicknames. Either that, or bloat this particular jewel
		//of scripting to another level of string handling
		if(msg.startsWith('/private')){
			//The message we expect has 3 segments: The command, the desired client to send to, and the message itself.
			var segments = msg.split(' ');
			//If we have less than 3 segments, we don't need to carry on 
			if(segments.length < 3){
				//Let the client knew he messed up
				socket.emit('chat message','PRIVATE: ' + 'Invalid Syntax: \'/private name message\' expected!');
				return;
			}
			//If there is no client registered with the given name we wish to send to, we break in the first place
			//However, if it IS valid...
			if(clients.indexOf(segments[1]) > -1){
				//Remember the structure. 2nd segment (index 1) is the nickname, so save that
				var target = segments[1];
				//Then cut the /private and the nickname away
				segments.splice(0,2);
				//And reassemble the message
				// -> If there is a better way to do this (which I am CERTAIN there is), please let me know.. 
				var message = '';
				for(var seg = 0; seg < segments.length; seg++){
					message+=segments[seg]+(' ');
				}
				//And aaawwaaaaayyyyy we go!
				sockets[target].emit('chat message', 'Private message from ' + names[socket.id] +': ' + message); 
				socket.emit('chat message', 'Private message to ' + target + ' : '+message);
				//People get confused here often, as they assume this would send the message to everybody. This would however, only be the case
				//when we say io.emit(), which sends TO ALL SOCKETS. If we just emit the event to a specific socket, which in this case is the one
				//bearing the name of our recipent, only this particular one will actually put the message on HIS OWN screen. Won't show up on others.
				return;
			}//end if(clients.indexof(segments[1] > -1)
		}//end if(startsWith('/private'))
		  
		 //If it is a command, but not the private message (as in, just a single word) 
        switch(msg){
		  //Someone requesting a list of users?
          case '/list':
		  //Proud to serve
          socket.emit('chat message','PRIVATE: Active Users: ' + getUsers());
          return;
		  //Unknown command? Let the client know so.
          default:
          socket.emit('chat message','PRIVATE: Invalid command.');
          return;
        }//end switch(msg)
      }//end if(msg.startsWith())
	 //And if it is a generic message, just send it to all the clients
     io.emit('chat message','['+displayTime() + '] ' + names[socket.id]+' says: '+msg);
    }//end if(msg)
  });//end function()
});	//end io.on()

//And at the very end (which is.. a weird but working structure) we start the actual HTTP Server.
http.listen(3000, function(){
  console.log('listening on *:3000');
});
