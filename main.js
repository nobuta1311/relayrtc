navigator.getUserMedia  = navigator.getUserMedia    || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
var peerTable = Array();
//参加したときはそれぞれが更新
//消えるときもそれぞれが更新
//inquiryで照会
var date_obj;
var saving=true;
var connectionTable = Array();
//配信者がサーバに設定
//inquiryで照会
var localStream;
var masterStream;
var streams = Array();  //自分の保持するstreamのURLをここに記録する。
var connectedNum;   //接続数
var connectedCall = Array();
var connectedConn = Array();
var myID;
var canvasElement;
var canvasContext;
var videoElement;
var e = document.createEvent("MouseEvents");
//var localRecorder =  null;   //録画のスケジューリング
//var remoteRecorder = null;
//var blobUrl = null; //録画済みデータの保管場所
//$(function() {  グローバルにしたくない部分
var peer = new Peer({ key: '2e8076d1-e14c-46d4-a001-53637dfee5a4', debug: 3});
peer.on('open', function(){ //回線を開く
});
peer.on('call', function(call){ //かかってきたとき
   var pid = id_exchange(call.peer,2,false);
   writeLog("Connected by "+pid);
    call.answer();  //何も返さないようにしておく。
    connectedCall[pid]=call;
    calledDo(pid);
});
$(function (){
$('#joinProvider').click(function(){
    if($(this).text()=="exit"){
 //       stopRecording(localRecorder);
        id_exchange(myID,3,false);
        $(this).text("Join as a Provider");
        Object.keys(peerTable).forEach(function(key1){
            connectedConn[key1].close();
            if(connectedCall[key1]!=null)
                connectedCall[key1].close();
        });
        noticeConnect(myID,"",6);
        dataDisconnectAll();
        writeLog("Finished Exitting");
    }else{
        writeLog("You've joined as a provider");
        noticeConnect("","",4);
        id_exchange("all",5,false);
        navigator.getUserMedia({ video: constraints,audio: false}, function(stream){
            localStream = stream;
            var div = $("<video id=\"my-video\" style=\"width: 600px;\" autoplay=\"1\"></video>");//disabledにできる
            $("#videos").append(div);

            $('#my-video').prop('src', window.URL.createObjectURL(stream));
            },function() { alert("Error to getUserMedia.");
        });
        initialize();
        $(this).text("exit");
    }
});
$('#joinReceiver').click(function(){
    if($(this).text()=="exit"){
        id_exchange(myID,3,false);
        $(this).text("Join as a Receiver");
        Object.keys(peerTable).forEach(function(key1){
            connectedConn[key1].close();
            if(connectedCall[key1]!=null)
                connectedCall[key1].close();
        });
        noticeConnect(myID,"",6);
        dataDisconnectAll();
        writeLog("Finished Exitting");
    }else{
        writeLog("You've joined as a receiver");
        initialize();        
        $(this).text("exit");
    }
});
$("#save-cap").click(function(){
        if($(this).text()=="Save"){
        $(this).text("Stop");
        if($("#my-video").length){
            saveCapture("my-video");
        }else{
            saveCapture("peer-video");
        }
        }else{
            saveCapture("STOP");
            $(this).text("Save");
        }
});
var constraints = {
    "mandatory": {"aspectRatio": 1.3333}, 
    "optional": [{"width": {"min": 640}},
                 {"height": {"max": 400}}]
};
});

function makeListener(key){
    //if(myID==key) return;
    $("#connect-buttons").on( 
        'click',"#connect-"+key,
        function(){
            writeLog("Request the video to "+key);
            sendText(key,"2,"+myID);//接続要求
        }
    );
}
function initialize(){
    myID = id_exchange(peer.id,0,false);
    inquiry_roop();
    dataConnectAll();
    console.log(peerTable);
    writeLog("Your peer is opened by peerID:"+peer.id);
    $("#my-id").text(peer.id);
    $('#my-number').text(myID);
    writeLog("Your id is "+myID);    
}


function calledDo(pid){ //コネクションした後のやりとり
        connectedCall[pid].on('stream', function(stream){//callのリスナ
      //      startRecording(stream);
            masterStream = stream;
            streams[pid]=stream;
            var url = URL.createObjectURL(stream);
            //url変換したものを格納し、したの行のように表示させる。
            var div = $("<video id=\"peer-video"+"\" style=\"width: 600px;\" autoplay=\"1\"></video>");//disabledにできる
            $("#videos").append(div);
            $('#peer-video').prop('src', url);
            //saveCapture("peer-video"+pid);
            // canvasContext.drawImage(videoElement,0,0);
        });
}
function writeLog(logstr){
    console.log(logstr);
    $("#log-space").prepend(logstr+"<br>");
}

function saveCapture(videoid){
    if(videoid=="STOP"){
        saving=false;
    }else{
    videoElement = document.getElementById(videoid);
    canvasElement = document.getElementById("canvas");
    canvasContext = canvasElement.getContext("2d");
    canvasElement.width = 600;
    canvasElement.height = 400;            
    count = 0;
    canvasContext.lineWidth = 10;
    canvasContext.font="bold 30px sans-serif";
    canvasContext.fillStyle="black";
    date_obj = new Date();
    setTimeout(saveFunc,calcWaitingTime(10),videoid);
    }
}
function saveFunc(videoid){
        date_obj = new Date();
        e.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        var now_text = date_obj.getMinutes()+""+date_obj.getSeconds()+""+date_obj.getMilliseconds();
        canvasContext.drawImage(videoElement,0,0);
       // canvasContext.fillText(now_text,100,100);
        var btn= document.getElementById("btn-download");
        btn.href = canvasElement.toDataURL('image/bmp');
        btn.download = myID+"-"+now_text+'.bmp';
        btn.dispatchEvent(e);
        if(saving){
            setTimeout(saveFunc,calcWaitingTime(10),videoid);
        }
}
function calcWaitingTime(t){//秒
    date_obj = new Date();
    return ((t-date_obj.getSeconds()%10)*1000-date_obj.getMilliseconds());
}
/*
function startRecording(stream,recorder) {
 writeLog("Start Recording");
 recorder = new MediaRecorder(stream);
 recorder.ondataavailable = function(evt) {
  // 録画が終了したタイミングで呼び出される
    var videoBlob = new Blob([evt.data], { type: evt.data.type });
    blobUrl = window.URL.createObjectURL(videoBlob);
    var anchor = document.getElementById('downloadlink');
    anchor.download = 'recorded.webm';
    anchor.href = blobUrl;
 };
 // 録画開始
 recorder.start();
}
 
// 録画停止
function stopRecording(recorder) {
 writeLog("StopRecording");
 recorder.stop();
}
*/
