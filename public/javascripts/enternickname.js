//Authors: Alexander Brückner, 742830
//	       Franziska Drobnik, 742079
//Based on https://socket.io/get-started/chat/

//Simple script that saves a text from a form into the HTML5 Session Storage and redirects to the chatpage.
//Refuses to redirect if nickname is invalid.
$(document).ready(function() {

	$("#sendNick").click(function(){
	  var checkName = $("input").get(0).value;
	  
	  if(checkName != null){  
		if(checkName.indexOf(' ') < 0){
		sessionStorage.chatNickName = checkName;
		console.log(sessionStorage.chatNickName);
		$(location).attr('href', '/chat.html');
		} 
		else {
		alert('Please refrain from using whitespaces in your nickname.');
		}
	  }
	  
	  
    });
});