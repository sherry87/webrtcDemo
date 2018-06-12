var PeerConnection = (window.PeerConnection || window.webkitPeerConnection00 || window.webkitRTCPeerConnection || window.mozRTCPeerConnection);
var URL = (window.URL || window.webkitURL || window.msURL || window.oURL);
var getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
var nativeRTCIceCandidate = (window.mozRTCIceCandidate || window.RTCIceCandidate);
 // stun和turn服务器
var iceServer = {
        "iceServers": [{
                "url": "stun:stun.l.google.com:19302"
            }, {
                "url": "turn:numb.viagenie.ca",
                "username": "webrtc@live.com",
                "credential": "muazkh"
            }]
    };
    
var socket = new WebSocket("ws://127.0.0.1:3355");
var id = uuid();
var pc = new PeerConnection(iceServer);
	// 发送ICE候选到其他客户端
pc.onicecandidate = function(event) {
	console.log("onicecandidate----------->");
	if(event.candidate !== null) {
		console.log(event.candidate);
		socket.send(JSON.stringify({
			"event": "_ice_candidate",
			"data": {
				"candidate": event.candidate
			},
			"uuid": id
		}));
	} else {
		console.log("event.candidate   == null");
	}
};

// 如果检测到媒体流连接到本地，将其绑定到一个video标签上输出
pc.onaddstream = function(event){
    document.getElementById('remoteVideo').src = URL.createObjectURL(event.stream);
};

socket.onopen = function(){
	socket.send(JSON.stringify({"uuid": id,"open":true}));
}
socket.onmessage = function(event) {
	var json = JSON.parse(event.data);
	console.log(json.event);
	if(json.event === "createOffer") {
		console.log("send offer");
        pc.createOffer(sendOfferFn, function (error) {
            console.log('Failure callback: ' + error);
        });
	}else if(json.event === "_ice_candidate") {
		//如果是一个ICE的候选，则将其加入到PeerConnection中，否则设定对方的session描述为传递过来的描述
		pc.addIceCandidate(new RTCIceCandidate(json.data.candidate));
	} else  if(json.event == "_offer"){
		console.log(" get offer")
		pc.setRemoteDescription(new RTCSessionDescription(json.data.sdp), function() {
			// 如果是一个offer，那么需要回复一个answer
			if(json.event === "_offer") {
				pc.createAnswer(sendAnswerFn, function(error) {
					console.log('Failure callback: ' + error);
				});
			}
		});

	}else if(json.event =="_answer"){
		pc.setRemoteDescription(new RTCSessionDescription(json.data.sdp));
	}
};

var sendOfferFn = function(desc){
	console.log("offer:",desc);
            pc.setLocalDescription(desc);
            socket.send(JSON.stringify({
				"event": "_offer",
				"data": {
					"sdp": desc
				},
				"uuid": id
			}))
    }

var sendAnswerFn = function(desc) {
	pc.setLocalDescription(desc);
	console.log(desc);
	socket.send(JSON.stringify({
		"event": "_answer",
		"data": {
			"sdp": desc
		},
		"uuid": id
	}));
};

sendChannel = pc.createDataChannel('sendDataChannel', {reliable: true});
sendChannel.onopen = function() {
	console.log('--Send channel open state is : ' + sendChannel.readyState);
}
sendChannel.onclose = function() {
		console.log('--Send channel close  state is: ' + sendChannel.readyState);
}
sendChannel.onmessage = function(event) {
	console.log("-sendChannel.onmessage--★★★★★");
	document.getElementById('dataChannelSend').value = event.data;
};

function sendData() {
	var data = document.getElementById('send').value;
	console.log("---->>>>sendData():" + data);
	sendChannel.send(data);
	$("#content").append("<p>发送:"+data+"</p>");
	$("#send").val("");
}




// 获取本地音频和视频流
navigator.webkitGetUserMedia({
    "audio": false,
    "video": true
}, function(stream){
    //绑定本地媒体流到video标签用于输出
   // document.getElementById('localVideo').src = URL.createObjectURL(stream);
    //向PeerConnection中加入需要发送的流
    //pc.addStream(stream);
    //如果是发起方则发送一个offer信令
    
}, function(error){
    //处理媒体流创建失败错误
    console.log('getUserMedia error: ' + error);
});
        
        
var receiveChannel;
pc.ondatachannel = function(event) {
	console.log("ondatachannel");
	receiveChannel = event.channel;
	receiveChannel.onmessage = function(event) {
		console.log("接收数据", event.data);
		$("#content").append("<p>接收："+event.data+"</p>");
	}
};

function uuid() {
  var s = [];
  var hexDigits = "0123456789abcdef";
  for (var i = 0; i < 36; i++) {
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
  }
  s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
  s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
  s[8] = s[13] = s[18] = s[23] = "-";
 
  var uuid = s.join("");
  return uuid;
}