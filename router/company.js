const express = require('express');
const path = require('path');
const router = express.Router();

router.get('/',(req,res)=>{
    res.sendFile(path.join(__dirname,'../company/company.html'));
});

router.get('/secret',(req,res)=>{
    res.send(`
        <body style='
            width: 820px; 
            margin: 0 auto; 
            padding-top:25px;
            background-color: #e6e7de;
            '>
        <a href="http://localhost">Home</a>
        <h1 style='
            color:slateblue; 
            font-family:verdana;'>
            Secret Message
            </h1>
        <p style='
            font-family:verdana;'>
            Make sure you close the door when you leave
            </p>
        </body>
    `);
});

module.exports = router;