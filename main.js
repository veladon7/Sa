const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const {Server} = require('socket.io');
const io = new Server(server);

app.use(express.static('public'));

app.get('/',(req,res)=>{
    res.send(`
    <div style='
    width: 720px;
    margin: 0 auto;
    '>
    <br>
    <hr></hr>
    <h3 style='color:red;'>Index.html</h3>
    <hr></hr>
    <p style='color:grey'>Contact IT Support, if the page does not load ...</p>
    </div>
    `);
})

io.on('connection',(socket)=>{
    console.log(`User with ID:'${socket.id}' connected`);
});

server.listen(80,()=>{
    console.log(`Express server listening on port 80`)
});
