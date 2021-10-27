import express from 'express';
import {spawn} from 'child_process';
import NodeCache from "node-cache";
import user from './connect.js';
import fetch from "node-fetch";
import dotenv from 'dotenv'
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const myCache = new NodeCache();
dotenv.config();

app.use(express.urlencoded({
    extended: true
}))

app.get('/',(req,res) => {
    // email will be fetched from request
    // const email = 'test12@gmail.com';
    // email is cached here
    // myCache.set("email", email);
    // sending main UI component
    res.sendFile(__dirname+'/helper/signup.html')
});

app.post('/signup',(req,res) => {
    // email will be fetched from request
    const email = req.body.user_id;
    console.log(email)
    // email is cached here
    myCache.set("email", email);
    res.cookie('email', email);
    // sending main UI component
    res.sendFile(__dirname+'/helper/index.html')
});



app.get('/slackAuth', (req, res, next) => {

    // Slack Auth code
    const code_slack = req.query.code;

    // Using py script to fetch auth token and channel name
    const python = spawn('python', [__dirname+'/helper/testing.py', code_slack]);
    python.stdout.on('data', (data) => {

        // fetching access token
        // console.log(JSON.parse(data.toString())['access_token'].toString())

        // fetching channel
        // console.log(JSON.parse(data.toString())['incoming_webhook']['channel'].toString())

        try{
            var user_data = {
                access_token: JSON.parse(data.toString())['access_token'].toString(),
                channel: JSON.parse(data.toString())['incoming_webhook']['channel'].toString()
            };
        }
        catch (err){
            console.log(err);
        }


        // accessing email from cache
        var email = myCache.get('email');

        // saving userinfo into db
        var new_user = new user({
            email:email,
            user_data:user_data,
            slack: true
        });

        new_user.save(function(err, data){
            if(err){
                console.log(err);
            }
            else {
                console.log(data);
            }
        });

    });

    res.sendFile(__dirname+'/helper/sendMsg.html')

});


app.post('/sendMsg',(req,res) => {

    const msg = req.body.msg;
    const email = myCache.get('email');

    user.find({email:email}, function (err,data){
        if(err){
            console.log(err);
        }
        else {
            console.log(data);
            const SLACK_BOT_TOKEN = data[0].user_data.access_token;
            const channel = data[0].user_data.channel;

            const payload = {
                // fetch channel name from DynamoDB
                channel: channel,
                attachments: [
                    {
                        title: "My first Slack Message",
                        text: msg,
                        author_name: "alejandrogonzalez3",
                        color: "#00FF00",
                    },
                ],
            };

            fetch("https://slack.com/api/chat.postMessage", {
                method: "POST",
                body: JSON.stringify(payload),
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                    // "Content-Length": payload.length,
                    Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
                    Accept: "application/json",
                },
            })
                .then((res) => {
                    if (!res.ok) {
                        throw new Error(`Server error ${res.status}`);
                    }

                    return res.json();
                })
                .catch((error) => {
                    console.log(error);
                });

        }
    });

    res.sendFile(__dirname+"/helper/return.html");

});


app.listen(process.env.PORT, () => console.log('listening...'))