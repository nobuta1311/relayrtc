navigator.getUserMedia  = navigator.getUserMedia    || navigator.webkitGetUserMedia || navigator.mozGetUserMedia|| navigator.msGetUserMedia;
/*変数定義*/
var peerTable = Array();
var saving=true;
var connectionTable = Array();
var target=0;
var localStream;
var streams = Array();  //自分の保持するstreamのURLをここに記録する。
var connectedCall = Array();
var connectedConn = Array();
var myID;
var canvasElement,canvasElement2;
var canvasContext,canvasContext2;
var videoElement;
var e = document.createEvent("MouseEvents");
var peer = new Peer({ key: '2e8076d1-e14c-46d4-a001-53637dfee5a4', debug: 3});
/*
peer.on('open', function(){ //回線を開く
    writeLog("OPENED");
});
*/
peer.on('call', function(call){ //かかってきたとき
   //inquiry_tables();
   var pid = id_exchange(call.peer,2,false);
   showNortify(myID+"からの通知",pid+"から動画が届きました");
   writeLog("CALLED BY: "+pid);
   call.answer(null);  //何も返さないようにしておく。
   connectedCall[pid]=call;
   calledDo(pid);
   connectionTable[pid][myID]=true;
   Object.keys(peerTable).forEach(function(key){    //connectionTableを埋める
       if(myID!=key){
           if(connectionTable[key][myID]==undefined){connectionTable[key][myID]=false;}
           if(connectionTable[myID][key]==undefined){connectionTable[myID][key]=false;}
       }
   });
   //connectionTable[pid]["counter"]++;
   //connectionTable[myID]["connected"]++;
   renewTable();
});
/*総合関数*/
$(function (){
    $('#joinProvider').click(function(){//配信者参加処理
        for(var i=0;i<9;i++)Branch[i]=$("[name=br"+i+"]").val();//分岐数取得
    $("#branch-selector").remove();//分岐数設定消去
    if($(this).text()=="exit"){
        upload();
        //stopRecording(localRecorder);
        id_exchange(myID,3,false);//myIDを削除
        $(this).text("Join as a Provider");
        Object.keys(peerTable).forEach(function(key1){
            if(connectedCall[key1]!=null)//配信してたら切る
                connectedCall[key1].close();
        });
        noticeConnect(myID,"",6);//callコネクション削除
        dataDisconnectAll();//コネクションも切断
        writeLog("COMPLETE EXITTING");
    }else{
        noticeConnect("","",4);
        id_exchange("all",5,false);
        /*video : constraints*/
        navigator.getUserMedia({ video: true,audio:false}, function(stream){
            localStream = stream;
            var div = $("<video id=\"my-video\" autoplay=\"1\"></video>");//disabledにできるwidth: 600px;\
            $("#videos").append(div);
            $('#my-video').prop('src', window.URL.createObjectURL(stream));
            },function() { alert("Error to getUserMedia.");
        });
        writeLog("YOU ARE PROVIDER");
        initialize();
        $(this).text("exit");
    }
});
$('#joinReceiver').click(function(){//受信者参加処理
    $("#branch-selector").remove();//分岐数設定消去
    if($(this).text()=="exit"){
        upload();
        id_exchange(myID,3,false);//myIDをサーバから除去
        $(this).text("Join as a Receiver");
        Object.keys(peerTable).forEach(function(key1){
            if(connectedCall[key1]!=null)
                connectedCall[key1].close();
        });
        noticeConnect(myID,"",6);
        dataDisconnectAll();
        writeLog("FINISH EXITTING");
    }else{
        writeLog("YOU ARE RECEIVER");
        initialize();        
        $(this).text("exit");
    }
});
$("#SendTextButton").click(function(){
        Object.keys(peerTable).forEach(function(key1){
            sendText(key1,"3,"+myID+","+$("#mes").val());
        });
});
});
/*
接続ボタンを作る関数
実験時には用いない
function makeListener(key){//接続ボタンをつくる
    $("#connect-buttons").on( 
        'click',"#connect-"+key,
        function(){
            target = key;
            writeLog("REQUEST VIDEO :"+key);
            sendText(0,"2,"+myID);
        }
    );
}
*/
function initialize(){
    myID = id_exchange(peer.id,0,false);
    peerTable[myID]=peer.id;
    inquiry_tables();   //他の状況をサーバから取得する．
    noticeConnect(myID,"",3);//サーバのコネクションテーブルの自分の部分更新 asyncでなくてよい
    connectionTable[myID]=[];
    writeLog(peerTable);
    connectionTable[myID]["counter"]=0;
    connectionTable[myID]["connected"]=0;
    dataConnectAll();   //全員に接続する．これにより相手は自分のID2つを知る．
    writeLog("YOU ARE : "+peer.id);
    $("#my-id").text(peer.id);
    $('#my-number').text(myID);
    writeLog("YOUR ID : "+myID);    
}


function calledDo(pid){ //コネクションした後のやりとり
        connectedCall[pid].on('stream', function(stream){//callのリスナ
            streams[target]=stream;
            var url = URL.createObjectURL(stream);
            //url変換したものを格納し、したの行のように表示させる。
            var div = $("<video id=\"peer-video"+"\" style=\"width: 600px;\" autoplay=\"1\"></video>");//disabledにできる
            $("#videos").append(div);
            $('#peer-video').prop('src', url);
        });
}
