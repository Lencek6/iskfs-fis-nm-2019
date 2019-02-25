var http = require("http").createServer(handler); // "on req" - "handler"
var io = require("socket.io").listen(http); // socket knjižnica
var fs = require("fs"); // spremenljivka za "file system" za posredovanje html
var firmata = require("firmata");

console.log("Starting the code");

var board = new firmata.Board("/dev/ttyACM0", function(){
    console.log("Priklop na Arduino");
    console.log("Omogočimo Pin 0");
    board.pinMode(0, board.MODES.ANALOG); // analogna nožica 0
    board.pinMode(1, board.MODES.ANALOG); // analogna nožica 1
    board.pinMode(12, board.MODES.OUTPUT); // digitalne nožice, output za diode
    board.pinMode(11, board.MODES.OUTPUT);
    board.pinMode(10, board.MODES.OUTPUT);
});

function handler(req, res) {
    fs.readFile(__dirname + "/naloga04.html",
    function (err, data) {
        if (err) {
            res.writeHead(500, {"Content-Type": "text/plain"});
            return res.end("Napaka pri nalaganju strani.");
        }
    res.writeHead(200);
    res.end(data);
    })
}

var želenaVrednost = 0; // želena vrednost nastavljena s pot.
var vrednost2 = 0;

http.listen(8080); // strežnik bo poslušal na vratih 8080

board.on("ready", function() {
    
    board.analogRead(0, function(value){
        želenaVrednost = value; // zvezno branje analogne nožice 0
        if(želenaVrednost >= 486 && želenaVrednost <= 538){
            board.digitalWrite(11, board.HIGH);
            board.digitalWrite(10, board.LOW);
            board.digitalWrite(12, board.LOW);
            
        }
        if(želenaVrednost < 468){
            board.digitalWrite(10, board.HIGH);
            board.digitalWrite(11, board.LOW);
            board.digitalWrite(12, board.LOW);
            
        }
        if(želenaVrednost > 538){
            board.digitalWrite(12, board.HIGH);
            board.digitalWrite(10, board.LOW);
            board.digitalWrite(11, board.LOW);
            
        }
            
    });
    board.analogRead(1, function(value){
        vrednost2 = value; // zvezno branje analogne nožice 0
    });
    
    io.sockets.on("connection", function(socket) {
        socket.emit("messageToClient", "Strežnik priključen, plošča pripravljena.");
        setInterval(sendValues, 100, socket); // na 40ms pošljemo sporočilo klientu
    }); // konec "sockets.on connection"

}); // konec "board.on(ready)""

function sendValues (socket) {
    socket.emit("klientBeriVrednosti",
    {
    "želenaVrednost": želenaVrednost,
    "vrednost2": vrednost2
    });
};