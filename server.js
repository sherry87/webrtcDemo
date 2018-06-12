var WebSocketServer = require('ws').Server,
wss = new WebSocketServer({ port: 3355 });
var map = new Map();
wss.on('connection', function (ws) {
    console.log('client connected');
    ws.on('message', function (message) {
    	var dt = JSON.parse(message);
    	if(dt.hasOwnProperty("open")&& dt.open){
    		console.log("加入ID:"+dt.uuid);
    		map.set(dt.uuid,ws);
    		if(map.size>1){//存在其他ws,发起offer
    			var obj ={};
    			obj.event="createOffer";
    			ws.send(JSON.stringify(obj));
    		}
    	}else{
    		map.forEach(function(value,key){
    			if(key != dt.uuid)
		    		map.get(key).send(message,function(error){
		    		 if (error) {
			                console.log( error);
			            }
		    		});
    		});
    	}
    });
    ws.on("close",function(){
    	map.forEach(function(value,key){
			if(value == ws){
				map.delete(key);
				console.log("退出ID:"+key);
			}
    	});
    })
});