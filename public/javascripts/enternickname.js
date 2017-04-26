//Authors: Alexander Brückner, 742830
//	       Franziska Drobnik, 742079
//Based on https://socket.io/get-started/chat/

//Simple script that saves a text from a form into the HTML5 Session Storage and redirects to the chatpage.
//Refuses to redirect if nickname is invalid.

function registerUser(){
	
	var newnickname = $("input").get(0).value;
	var newpassword = $("input").get(1).value;
	
	
	
	socket = io();
	socket.emit('register',{username : newnickname, userpassword : newpassword});
	socket.on('registrationresult',function(data){
		
		if(data.success === "true"){
			checkNick();
		}
		
		else{
			alert("Error during registration - verify inputs!");
		}
		
		
	});
	
}

function checkNick(){
	//$("#sendNick").click(function(){
	//check for whitespaces..
	  var checkName = $("input").get(0).value;
	  if(checkName.indexOf(' ') >= 0){
		  alert('Please refrain from using whitespaces in your nickname.');
		  checkName = null;
		  $(location).attr('href', '/');
	  }
	  //Grab password and create a socket
	  var checkPassword = $("input").get(1).value;
	  var socket = io();
	  //Commence validation
	  socket.emit('validateuserdata',{username : checkName, userpassword : checkPassword});
	  //Handle result
	  socket.on('validationresult',function(data){
		  
		  //Should be pretty clear what is happening. Yes, appending the name into the sessionStorage
		  //is redundant at this point, but I reeaaaaalllyyyyyy don't want to change the entire program again..
		  //"It's not stupid if it works." - The Internet
		  if(data.success === "true"){
			  console.log("Successfully authenticated");
			  sessionStorage.chatNickName = checkName;
			  $(location).attr('href', '/chat.html');
			  
		  }
		  else{
			  alert("Invalid username or password!");
			  checkName = null;
			  checkPassword = null;
			  $(location).attr('href', '/');
		  }
		  
	  });
	  
	  
	  
	/*  if(checkName != null){  
		if(checkName.indexOf(' ') < 0){
		sessionStorage.chatNickName = checkName;
		sessionStorage.chatPassword = checkPassword;
		console.log(sessionStorage.chatNickName);
		$(location).attr('href', '/chat.html');
		} 
		else {
		alert('Please refrain from using whitespaces in your nickname.');
		}
	  }*/
	  
	  
    }//);


$(document).ready(function() {
	//$("sendNick".bind("click",checkData));
});