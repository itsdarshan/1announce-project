// Title: Routing management
// Author: Darshan Shah - 1910463
// Info: This script manages below the routes for 1announce project:
//      1. '/' - main route
//      1. '/slackAuth' - For authorizing slack account and storing user info
//      1. '/sendMsg' - For posting announcement to the slack channel
//      1. '/signup' - For fetching user id (email)



import express from 'express';
import {spawn} from 'child_process';
import NodeCache from "node-cache";
import user from './connect.js';
import fetch from "node-fetch";
import dotenv from 'dotenv'
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// declaring file and directing name for efficient access of files
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const myCache = new NodeCache();

// configuring environment variables
dotenv.config();

// express routing
app.use(express.urlencoded({
    extended: true
}))

app.get('/',(req,res) => {
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

    // fetching posting message
    const msg = req.body.msg;

    // retrieving email from cache
    const email = myCache.get('email');

    // mongoose query for searching item using email as a param
    user.find({email:email}, function (err,data){
        if(err){
            console.log(err);
        }
        else {
            console.log(data);
            const SLACK_BOT_TOKEN = data[0].user_data.access_token;
            const channel = data[0].user_data.channel;

            const payload = {
                // fetch channel name from mongodb
                channel: channel,
                attachments: [
                    {
                        title: "This is a testing of 1announce",
                        text: msg,
                        author_name: "Darshan Shah",
                        color: "#e9114e",
                    },
                ],
            };

            // post request to send message to slack
            fetch("https://slack.com/api/chat.postMessage", {
                method: "POST",
                body: JSON.stringify(payload),
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                    "Content-Length": payload.length,
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