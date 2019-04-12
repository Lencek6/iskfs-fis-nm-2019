var http = require("http").createServer(handler); // pri req - handler
var io = require("socket.io").listen(http); // socket.io knjižnica
var fs = require("fs"); // spremenljivka za "file system" za branje .html dat.
var firmata = require("firmata"); // za komunikacijo z mikrokontrolerjem

console.log("Zagon aplikacije");

var board = new firmata.Board("/dev/ttyACM0", function(){
    console.log("Povezava na Arduino");
    console.log("Omogočimo Pin 2 in Pin 5 kot vhod");
    board.pinMode(9, board.MODES.OUTPUT);
    board.pinMode(2, board.MODES.INPUT);
    board.pinMode(8, board.MODES.PWM);
    board.pinMode(5, board.MODES.INPUT);
});

function handler(req, res) {
    fs.readFile(__dirname + "/naloga05.html",
    function (err, data) {
        if (err) {
            res.writeHead(500, {"Content-Type": "text/plain"});
            return res.end("Napaka pri nalaganju html strani.");
        }
    res.writeHead(200);
    res.end(data);
    })
}

http.listen(8080); // strežnik bo poslušal na vratih 8080

var pošljiVrednostPrekoVtičnika = function(){}; // spr. za pošiljanje sporočil

board.on("ready", function(){

io.sockets.on("connection", function(socket) {
    socket.emit("sporočiloKlientu", "Strežnik povezan, Arduino pripravljen.");
    
    pošljiVrednostPrekoVtičnika = function (value) {
        io.sockets.emit("sporočiloKlientu", value);
    }
    
}); // konec "sockets.on connection"
var smer  = 0
var deluje = 0

//funkcija klicana ob spremembi stanja na pinu 5 za smer
function menjavaSmeri(){
    smer = !smer
    board.digitalWrite(9,smer)
    io.sockets.emit("posodobitevStanj", smer, deluje);
}

board.digitalRead(5, function(value) {
        if (value == 1)
            menjavaSmeri()

});
//funkcija klicana ob spremembi stanja na pinu 2 za prizig/izklop motorja
function fundeluje(){
    deluje = !deluje
    if(deluje == 0)
        board.analogWrite(8,0);
    if(deluje == 1)
        board.analogWrite(8,1000);
    io.sockets.emit("posodobitevStanj", smer, deluje);
}

board.digitalRead(2, function(value) {
    if (value == 1)
        fundeluje()
    
}); // konec "board.digitalRead"

}); // konec "board.on ready"