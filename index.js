const admin = require("firebase-admin");
admin.initializeApp();
const functions = require("firebase-functions");
const axios = require("axios");

const push = (groupId, msg) => {
    return axios({
    method: "post",
    url: "https://api.line.me/v2/bot/message/push",
    headers: {
       "Content-Type": "application/json",
       Authorization: "Bearer <Token>"
    },
    data: JSON.stringify({
        to: groupId,
        messages: [
            {
                "type": "flex",
                "altText": msg,
                "contents": {
                "type": "bubble",
                "body": {
                    "type": "box",
                    "layout": "horizontal",
                    "contents": [
                    {
                        "type": "text",
                        "text": msg
                    }
                    ]
                }
                }
            }
        ]
     }) 
    })
};

exports.LineWebhook = functions.https.onRequest(async (req, res) => { 
    let event = req.body.events[0];
    let groupId = event.source.groupId;
    functions.logger.log("Hello from info. Here's an object:", event);
    functions.logger.log("Hello from info. Here's an object2:", groupId);
    if (event.message.type === 'text') {
       let inputText = event.message.text; 
       await admin.firestore().collection('translations').doc(groupId).set({ 
            input: inputText 
       }).then(function () { 
            console.log("Document successfully written!");
       }).catch(function (error) { 
            console.error("Error writing document: ", error); 
       }); 
     } 
     return res.end()
 });

 exports.LineBotPush = functions.firestore.document('translations/{groupId}').onWrite(async (change, context) => { 
    let latest = change.after.data(); 
    let input = latest.input;
    let groupId = context.params.groupId;
    let containsJapanese = input.match(/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/); 
    if (containsJapanese) { 
        push(groupId, latest.translated.th); 
    } else { 
        push(groupId, latest.translated.ja); 
    } 
});