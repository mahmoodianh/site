var express = require('express');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);
app.use(express.static('public'));
var users={};
var active_users ={};
var messages={};

app.get('/', function(req, res){
  res.sendfile('index.html');
});

io.on('connection', function(socket){
var login =0;
var chat_with="none";
var pic = "";
var username = "";

// console.log('a user connected');
 
 socket.on('choose_friend', function(msg){

    if(login)
	{
		var res ="";
		chat_with = msg;
//		console.log("chat_with  is " +chat_with);
		users[username][2] = chat_with;
		for (var i=0;i<Object.keys(messages).length;i++)
		{
			if(messages[i][0]==username && messages[i][1] ==chat_with)
			{res = make_message(res,pic,messages[i][0],messages[i][3],messages[i][2]);}
			else if (	(messages[i][1]==username && messages[i][0] ==chat_with))
			{
			res = make_message(res,users[chat_with][1],messages[i][0],messages[i][3],messages[i][2]);
			messages[i][4]=1;
			}
		}    
		socket.emit('show_messages' , res);
		socket.emit('online_time' , users[chat_with][3]);
	}
  });
 
 
 socket.on('add_friend', function(msg){
    if(login)
	{
		if(users[msg])
		{
		
		users[username].push(msg);
		users[msg].push(username);
		res ="";
		res += "<a class=\"active"; 
		if(active_users[msg])
		{	
			res2= "";
			res2 += "<a class=\"active green item friend_list\"><span>"; 
			res2 += username;
			res2 += "</span><div class=\"ui blue label\">";
			res2 += 0;
			res2 +="</div></a>";   
			active_users[msg].emit('ok_add_friend' , res2);
		
			res += " green" ;
		}
		res += " item friend_list\">"; 
		res += "<span>";
		res += msg;
		res += "</span><div class=\"ui blue label\">";
		res += 0;
		res +="</div></a>";     
		socket.emit('ok_add_friend' , res);
		}
		else{socket.emit('not find',msg);
		}
	}
  });
 
 
 socket.on('disconnect', function(){

	
	if(users[username]){
	chat_with="none";
	users[username][3] = getDateTime();
	users[username][2]=chat_with;
	for(var i =3; i<users[username].length-1; i++)
			{
				if(active_users[ users[username][i+1]])
				{
				active_users[ users[username][i+1] ].emit('update_deactive',username);
				}
			}
	
	}
	active_users[username] = "";
  });
  
 socket.on('login', function(msg){

	msg = msg.split("$$");
	pic = msg[2];
	res = "";
	error = "none";
	username = msg[0];
	if(users[username])
	{
	
		if(users[username][0] != msg[1])
		{
			error = "Wrong Password or This Username is taken before"
		}		
		else
		{
			active_users[username] = socket;
			users[username][1] = pic;
			//users[username][3] = getDateTime();
			
			for(var i =3; i<users[username].length-1; i++)
			{
				if(active_users[users[username][i+1]])
				{
					active_users[users[username][i+1]].emit('update_active',username);
				}
			}
		}
	}
	else
		{
		users[username] = [];
		users[username].push(msg[1]);
		users[username].push(String(pic));
		users[username].push("none");   //for chat_with
		users[username].push(getDateTime());
		
		if(username !="@master")
		{
		users[username].push("@master");
		users["@master"].push(username);
		}
		
		active_users[username] = socket;
		}
	res += error + "$$";
	res += msg[0] + "$$";
	res += "static/avatars/" +pic+".jpg" + "$$";
	res = make_friend_list(username,res);
	socket.emit('master_note' , res);			
	login = 1;
  });
  
  
  socket.on('chat message', function(msg){
  if (login){
	messages[Object.keys(messages).length] = [username,chat_with,getDateTime(),msg,0];
	res = "";
	res = make_message(res,pic,username,msg,getDateTime());
	socket.emit('new_comment' , res);
	
	if(active_users[chat_with])
	{
		
	if(username == users[chat_with][2])
		{
			messages[Object.keys(messages).length-1][4] =1;
			active_users[chat_with].emit('new_comment' , res);
		}
	else
		{
				
					res ="";
					res = make_friend_list(chat_with,res);
					active_users[chat_with].emit('update_message_num',res);
					
				
		}
		}
		
	}
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

var make_message = function (res,pic,username,msg,time){

	res = res +"<div class=\"comment\"><a class=\"avatar\"><img src= \"static/avatars/";
	res = res + pic;
	res = res + ".jpg\"></a><div class=\"content\"><a class=\"author\">";
    res = res + username;
    res = res + "</a><div class=\"metadata\"><span class=\"date\">";
	res = res + time;
	res = res + "</span></div><div class=\"text\">";
    res = res + msg;
    res = res + "</div></div></div>";
	return res;

}



var unread_message= function ( id){

var num =0;
for (var i=0;i<Object.keys(messages).length;i++)
	{
		if (messages[i][0]==id && messages[i][4]==0)
		{
			num ++;
		}
	}
	return num;
}


var make_friend_list = function (value,res)
	{
		for( var i = 3 ;i<users[value].length-1 ;i++)
	{
		res += "<a class=\"active"; 
		if(active_users[users[value][i+1]])
		{
			res += " green" ;
		}
		res += " item friend_list\">"; 
		res += "<span>";
		res += users[value][i+1];
		res += "</span><div class=\"ui blue label\">";
		res += unread_message(users[value][i+1]);
		res +="</div></a>"; 
		//res += "$$";
	}
		return res;
	}
function getDateTime() {

    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return String(year + ": " + month + ": " + day + "__   " + hour + ": " + min + ": " + sec);

}