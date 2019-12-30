const express = require("express");
const fs = require("fs");
const http = require("http");
var cors = require('cors');
var SSHClient = require("ssh2").Client;
var utf8 = require("utf8");

const app = express();
var serverPort = 4000;
var server = http.createServer(app);

//set the template engine ejs
app.use(express.json());
app.set("view engine", "ejs");

//middlewares
app.use(express.static("public"));

var ssh;
var gstream;
var gsocket;
app.options('/source', (req, res) => {
    console.log('************ option  ************');
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers',
    'Content-Type, Authorization, Content-Length, X-Requested-With');
    res.send();
});

//routes
app.post('/source', (req, res) => {
    console.log('++++++++++++ code get !!!++++++++++++');
    let source = (req.body['code'].replace(/\t/gi,''));

    //console.log('\n source :  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n' + source + '\n^^^^^^^^^^^^^^^^^^^^^^^^^^^^');
    var file = 'tmp.txt';
	fs.writeFileSync('tmp.txt',source,'utf8',function(err){
	    console.log('++++++++++++ file complete ++++++++++++');
	});
	console.log('end file');
	res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers',
    'Content-Type, Authorization, Content-Length, X-Requested-With');
	res.send();
	gstream.write(`cd /joon/ris && rm -rf ./* && echo '${source}' >> main.cpp && g++ main.cpp -o main && clear\n` , function(){
        //gstream.write('clear\n');
    });

    gstream.write('./main\n');
});

app.get("/", (req, res) => {
    res.render("index");
});


server.listen(serverPort);

//socket.io instantiation
const io = require("socket.io")(server);

//Socket Connection
io.on("connection", function(socket) {
    gsocket = socket;
    console.log('io.on ready !!! ');
    ssh = new SSHClient();
    ssh
        .on("ready", function() {
            console.log(socket.id);
            console.log('ssh.on ready !!! ');
            socket.emit("data", "\r\n*** SSH CONNECTION ESTABLISHED ***\r\n");
            connected = true;
            code = fs.readFileSync('tmp.txt', 'utf8');
            //code = `#include<stdio.h>\n int main(){\n printf("complite!!");\n };\n`;
            console.log('\ncode : ^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n' + code + '\n^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n');
            //socket.emit('data', '\r\n!@#$%^&*()_+COMI-CLEAR!@#$%^&*()_+\r\n');
            console.log('new emmit!!');
            socket.on('disconnect', function(){
                console.log("socket disconnected !!!!");

            });
        //ssh.exec(
            //'pwd && python3 && ifconfig',
            //`cd /joon/ris && rm -rf ./* && touch main.cpp && echo '${code}' >> main.cpp && g++ main.cpp -o main && ./main`,
        ssh.shell(
            function(err, stream) {
                gstream = stream;
                if (err){
                    console.log('err : ' +  err);
                    return ssh.end();
                }
                console.log('gcc  ');
                console.log('&&&&&&&&&&&&');
                socket.on("data", function(data) {
                    console.log('**** ' + data);
                    stream.write(data);
                });

            stream
                .on("data", function(d) {
                    //console.log("stream.data : " + d + '\n');
                    socket.emit("data", utf8.decode(d.toString("binary")));
                })
                .on("close", function() {
                    console.log("stream closed\n");
                    ssh.end();
                });
            });
        })

        .on("close", function() {
            console.log("ssh close!!\n");
            console.log('===========================================')
            socket.emit("data", "\r\n*** SSH CONNECTION CLOSED ***\r\n");
        })

        .on("error", function(err) {
            console.log(err);
            socket.emit(
                "data",
                "\r\n*** SSH CONNECTION ERROR: " + err.message + " ***\r\n"
            );
        });

        ssh.connect({
            host: "172.16.215.233",
            port: "22", // Generally 22 but some server have diffrent port for security Reson
            username: "root", // user name
            password: "js58195138" // Set password or use PrivateKey
            // privateKey: require("fs").readFileSync("PATH OF KEY ") // <---- Uncomment this if you want to use privateKey ( Example : AWS )
        });
    console.log("io.on end ");
});