'use strict';
const EcommerceStore = require('./../utils/ecommerce_store.js');
let Store = new EcommerceStore();
const CustomerSession = new Map();
const router = require('express').Router();
const WhatsappCloudAPI = require('whatsappcloudapi_wrapper');
const { SessionsClient } = require('dialogflow');
const { struct } = require('pb-util');
const { google } = require('googleapis');
const { JWT } = require('google-auth-library');

const projectId = 'veggiebox-agent-pkpa';
const keyFilePath = './../google_jwt/veggiebox-agent-pkpa.json';

// Create a new JWT client using the service account key
const client = new JWT({
    keyFile: keyFilePath,
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  })

router.get('/meta_wa_callbackurl', (req, res) => {
    try {
        let mode = req.query['hub.mode'];
        let token = req.query['hub.verify_token'];
        let challenge = req.query['hub.challenge'];

        if (
            mode &&
            token &&
            mode === 'subscribe' &&
            process.env.Meta_WA_VerifyToken === token
        ) {
            return res.status(200).send(challenge);
        } else {
            return res.sendStatus(403);
        }
    } catch (error) {
        console.error({error})
        return res.sendStatus(500);
    }
});

router.post('/meta_wa_callbackurl', async (req, res) => {
    console.log('POST: Someone is pinging me!');
    try {
        const Whatsapp = new WhatsappCloudAPI({
            accessToken: process.env.Meta_WA_accessToken,
            senderPhoneNumberId: process.env.Meta_WA_SenderPhoneNumberId,
            WABA_ID: process.env.Meta_WA_wabaId, 
            graphAPIVersion: 'v14.0'
        });
        let data = Whatsapp.parseMessage(req.body);

        if (data?.isMessage) {
            let incomingMessage = data.message;
            let recipientPhone = incomingMessage.from.phone; // extract the phone number of sender
            let recipientName = incomingMessage.from.name;
            let typeOfMsg = incomingMessage.type; // extract the type of message (some are text, others are images, others are responses to buttons etc...)
            let message_id = incomingMessage.message_id; // extract the message id

             // Create a new session ID using the WhatsApp phone number
            const sessionId = recipientPhone.split('@')[0];
            // Create a new Dialogflow session client using the service account key
            const sessionClient = new SessionsClient({
                projectId,
                credentials: await client.authorize(),
            });

            // Send the message to Dialogflow for processing
            const session = sessionClient.sessionPath(projectId, sessionId);
            const dialogflowResponse = await sessionClient.detectIntent({
            session,
            queryInput: {
                text: {
                text: incomingMessage,
                languageCode: 'en-US',
                },
            },
            });

            // Extract the response from Dialogflow and send it back to WhatsApp
            const { fulfillmentText } = dialogflowResponse[0].queryResult;
            const response = {
            message: fulfillmentText,
            recipient: sender,
            timestamp: timestamp,
            };
            console.log(fulfillmentText)
            await WhatsApp.sendText(recipientPhone, fulfillmentText)
            // if (typeOfMsg === 'text_message') {
            //     await Whatsapp.sendSimpleButtons({
            //         message: `Hey ${recipientName}, \nYou are speaking to a chatbot.\nWhat do you want to do next?`,
            //         recipientPhone: recipientPhone, 
            //         listOfButtons: [
            //             {
            //                 title: 'View some products',
            //                 id: 'see_categories',
            //             },
            //             {
            //                 title: 'Speak to a human',
            //                 id: 'speak_to_human',
            //             },
            //         ],
            //     });
            // }
        }

        console.log('GET: Someone is pinging me!');

        return res.sendStatus(200);
    } catch (error) {
                console.error({error})
        return res.sendStatus(500);
    }
});
module.exports = router;
