var express = require("express");
var app = express();
app.use("/public",express.static("public"));

app.get("/",function(req,res){
	res.sendFile(__dirname +"/"+"index1.html");
})

app.get("/index1.html",function(req,res){
	res.sendFile(__dirname +"/"+"index1.html");
})

app.get("/index2.html",function(req,res){
	res.sendFile(__dirname +"/"+"index2.html");
})


var server = app.listen(8888,function(){
	var host = server.address().address;
	var port = server.address().port;
	console.log("访问地址为：http://%s:%s",host,port);
})