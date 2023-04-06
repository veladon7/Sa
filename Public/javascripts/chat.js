console.log("...Loading Chat.js");

var thisDiv = document.getElementById('div1');
thisDiv.addEventListener('click',div1Color);
function div1Color(){
    document.getElementsByTagName("body")[0].style.backgroundColor='#009FFD';
    document.querySelectorAll('p').forEach(e => {
        e.style.color='black';
    })
    document.querySelectorAll('h1').forEach(e => {
        e.style.color='#FED766';
    })
    document.querySelectorAll('li').forEach(e => {
        e.style.color='#EBF2FA';
    })

}

var thisDiv = document.getElementById('div2');
thisDiv.addEventListener('click',div2Color);
function div2Color(){
    document.getElementsByTagName("body")[0].style.backgroundColor='#EBF2FA';
    document.querySelectorAll('p').forEach(e => {
        e.style.color='black';
    })
    document.querySelectorAll('h1').forEach(e => {
        e.style.color='#EF3E36';
    })
    document.querySelectorAll('li').forEach(e => {
        e.style.color='#009FFD';
    })
}

var thisDiv = document.getElementById('div3');
thisDiv.addEventListener('click',div3Color);
function div3Color(){
    document.getElementsByTagName("body")[0].style.backgroundColor='#FED766';
    document.querySelectorAll('p').forEach(e => {
        e.style.color='#545775';
    })
    document.querySelectorAll('h1').forEach(e => {
        e.style.color='#EF3E36';
    })
    document.querySelectorAll('li').forEach(e => {
        e.style.color='#009FFD';
    })
}

var thisDiv = document.getElementById('div4');
thisDiv.addEventListener('click',div4Color);
function div4Color(){
    document.getElementsByTagName("body")[0].style.backgroundColor='#545775';
    document.querySelectorAll('p').forEach(e => {
        e.style.color='#EBF2FA';
    })
    document.querySelectorAll('h1').forEach(e => {
        e.style.color='#EF3E36';
    })
    document.querySelectorAll('li').forEach(e => {
        e.style.color='#009FFD';
    })
}

var thisDiv = document.getElementById('div5');
thisDiv.addEventListener('click',div5Color);
function div5Color(){
    document.getElementsByTagName("body")[0].style.backgroundColor='#EF3E36';
    document.querySelectorAll('p').forEach(e => {
        e.style.color='#EBF2FA';
    })
    document.querySelectorAll('h1').forEach(e => {
        e.style.color='#FED766';
    })
    document.querySelectorAll('li').forEach(e => {
        e.style.color='#009FFD';
    })
}