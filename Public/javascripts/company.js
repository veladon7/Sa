const eventEmitter = require('events'); 
const emitter = new eventEmitter();

let greetTeam = ()=>{
    console.log("Welcome team");
};

emitter.on("Alert", (payload)=>{
    console.log(`\n"Payload is: ${payload}"`);
});

emitter.on("Alert",()=>{
    console.log("\nSecond alert\n")
})

emitter.emit("Alert",'We are on fire....Alert Alert....Beep',);


module.exports = greetTeam;