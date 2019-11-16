// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const request = require("request-promise");
const crypto = require('crypto');
const runtimeOpts = { timeoutSeconds: 4, memory: "2GB" };
const REGION = "asia-northeast1";
// const REGION = "us-central1";
const LINE_MESSAGING_API = "https://api.line.me/v2/bot/message";
const LINE_CHANNEL_SECRET = "f2e38850abf581104b8b596762bfdd40";
const GROUP_ID = "Caf6...";
// const GROUP_ID = "";
const LINE_HEADER = {
    "Content-Type": "application/json",
    //Authorization: "Bearer Your-Channel-Access-Token"
    Authorization: "Bearer QoWQQ3D5WhIXVMopjsDBGtYzZ5rGFOpPH49c83aI4sbV+fYb0jen2Pu8bW2PWYjAid1tZc1PmWJmRJ9ck/VislWMYHDv6XJ27/vHKiqNAcjmMb0nO9xn19bptJncUhIaZS/kGtDig3+edTrXfxCNMAdB04t89/1O/w1cDnyilFU="
};

exports.LineWebhook = functions.region(REGION).runWith(runtimeOpts).https.onRequest(async (req, res) => {
    const text = JSON.stringify(req.body);
    const signature = crypto.createHmac('SHA256', LINE_CHANNEL_SECRET).update(text).digest('base64').toString();
    if (signature !== req.headers['x-line-signature']) {
        return res.status(401).send('Unauthorized');
    }

    let event = req.body.events[0];
    if (event.message.type === 'text') {
        let input = event.message.text;
        await admin.firestore().collection('translations').doc('inputText').set({
            input: input
        }).then(function () {
            console.log("Document successfully written!");
        }).catch(function (error) {
            console.error("Error writing document: ", error);
        });
    }
    return res.status(200).send(req.method);
});

exports.LineBotPush = functions.region(REGION).runWith(runtimeOpts).firestore.document('translations/inputText').onWrite(async (change, context) => {
    let latest = change.after.data();
    let input = latest.input;
    let containsJapanese = input.match(/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/);
    let containsEnglish = input.match(/[]/);
    if (containsJapanese) {
        push(GROUP_ID, latest.translated.th);
        console.log("Translation to Thai Successful!!!!");
    } else {
        push(GROUP_ID, latest.translated.ja);
        console.log("Translation to Japanese Successful!!!!");
    }
});

const push = (userId, msg) => {
    return request.post({
        headers: LINE_HEADER,
        uri: `${LINE_MESSAGING_API}/push`,
        body: JSON.stringify({
            to: userId,
            messages: [{ type: "text", text: msg }]
        })
    })
}