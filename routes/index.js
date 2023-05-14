'use strict';
const VeggieBoxStore = require('../utils/veggiebox_store.js');
let Store = new VeggieBoxStore();
const CustomerSession = new Map();
const router = require('express').Router();
const WhatsappCloudAPI = require('whatsappcloudapi_wrapper');
const { SessionsClient } = require('dialogflow');
const { struct } = require('pb-util');
const { google } = require('googleapis');
const { JWT } = require('google-auth-library');

const projectId = 'veggiebox-agent-pkpa';
const keyFilePath = "././google_jwt/veggiebox-agent-pkpa.json";
const config = {
    credentials: {
      private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC6QggQsPMQ0Qzx\nu0CVJzYwPtFkrLaQK0MOhkYSuxSt87Z+FgpC3BnR2aV9oSR8PTl9IQ0VI8GkJ3dh\na+p4O0/JkA30Luee2YUMNM/ASgGfpC+X6lhgDa3G8UrQmQ96ohsCE3RtpLwU8NHM\npWs6Pr06TunK/0mMamorqft/6Y9s9kBAW32QKyLORMf225KFuN9CbACTE2zYS0e6\nvrhSe8oA5TzWEdDQ7wtonO6ZQ+GxwcYJ0bRcKqdN6pVBUFoC4XMxdOHRYZkTNKcL\naeIwepN2Lte82IVaB5jgwzy/Ngbu7fd8sSP1DI5NYdhZTEa8SDtvtnTJetX19DvE\nY9czgmPLAgMBAAECggEAAz6JWlmw2FNfjR2/GQFhiXu/3GzAzaDVvnzeaSKmnxmr\nVyqWMLUtXfTYQC18iEiLL855HHqxHgLeSDwiNRcnFKFAzjMeCCvWs5e6XNDtMCjT\n97SFRY5tl9oiQaEj9vWkgY82bEO5FDCbMf6UjbcrRxWmVrXuHH57j96GuHuoYNHG\nih5Mue1A+6VdmpivOritJFZf77F3RdOdIYbXWsYbgvMaXm413T6p70uJf+X8FOLv\n4n7b3BV1+zXhBxX9Yd0tKcDntzvK+Hwkeq8gNaFha+xPr5rvJPg9DSXa2raReGXk\nZsMgxdKrJRXyHZFD4UUUQmBtTMAFrb0NJ1wSwl2fQQKBgQDsI/YH8QsZ+bu3ZtaW\ntLqY21FNePubZ60pSPnz/eBarIyULXNyYqPHz0rNtoL6vTBB1/UaA6lht479bykY\n3ywQcKK7oSgw8EjfK5e49YZSHbAqMpa6SsaIFhXGboUKEzlIZTJEV+p3Bim9uILN\nC2aE4iKicDq1oJiZPze28+/iDwKBgQDJ7Bz9XjuI+TN/QFw1JyE4lPYixH3CjlTd\nZSW5ni5hkWEgYSPSrz7AZkYU79d4dYwrESkDQoq+vld37qovgfHGOBOl80Rd7kOL\nAEWTHiseNPveEVQm/iRSPYlN4+ZsddzfCjbwYA2WTFtWJgg4HzV8BdVPDG4W5jQR\nl2PRqMjuhQKBgCJG4gqrEYp2tqnbkqCToVZY14dgXV1kgj0w659gJbXjwBAuPMjI\nyq9RRrFvobmVxrB4EYryJx8ZDvd4sEV89593ShfkP7pC1sEWSdK+SP4Ycx7c8wYd\nno3Ybta76jHZMoJwtgg3nsAiM+LnKo1q7zmwvYhItCzzH9N22raC2Do/AoGAW33X\nuNn8wdigg9UmspLTU67zQ9eiYAhb3aEaEdvhiiX0S1aYg7sSBN2SfaQbDqK8azsw\nSSDaewkF2vrSNAp+AWGhTX1HigQOqKnr3Hg780jworNZXP2keXsWfqt32cch2BHp\nyMrM/UAF1qgO61cAxfxipZmtPET8bMga24HN4X0CgYAfKlAW1TMA1vwilhqdTucn\ne4aqishznPwVr9yoc+su5aN00dQqdVbUpKLTPNddfxjbJQnFPaphxls2vkYuXLTJ\nROLzgN4i6BQolTx6yvd6+nMIVISysEq35d/i5TGfDAsHulKNpGzYdOOI4XRq3vFn\ntSUUyHxgPX0AXY7GQhkygA==\n-----END PRIVATE KEY-----\n",//process.env.DIALOGFLOW_PRIVATE_KEY,
      client_email: process.env.DIALOGFLOW_CLIENT_EMAIL
    }
  };

// Create a new JWT client using the service account key
// const client = new JWT({
//     keyFile: keyFilePath,
//     scopes: ['https://www.googleapis.com/auth/cloud-platform']
//   })

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
        // console.log("||||||Whatsapp.parseMessage||||||||")
        //     console.log(Whatsapp)
        let data = Whatsapp.parseMessage(req.body);
            console.log("||||||Whatsapp.parseMessage||||||||")
            console.log( Whatsapp.parseMessage)
        if (data?.isMessage) {
            let incomingMessage = data.message;
            let recipientPhone = incomingMessage.from.phone; // extract the phone number of sender
            let messageContent = incomingMessage.text.body;
            let recipientName = incomingMessage.from.name;
            let typeOfMsg = incomingMessage.type; // extract the type of message (some are text, others are images, others are responses to buttons etc...)
            let message_id = incomingMessage.message_id; // extract the message id
            console.log("))))))incomingMessage)))))")
            console.log(messageContent)
             // Create a new session ID using the WhatsApp phone number
            const sessionId = recipientPhone.split('@')[0];
            // Create a new Dialogflow session client using the service account key
            const sessionClient = new SessionsClient(config);

            // Send the message to Dialogflow for processing
            const session = sessionClient.sessionPath(projectId, sessionId);
            const dialogflowResponse = await sessionClient.detectIntent({
            session,
            queryInput: {
                text: {
                text: messageContent,
                languageCode: 'en-US',
                },
            },
            });

            //Get button id
            if (typeOfMsg === 'simple_button_message') {
                let button_id = incomingMessage.button_reply.id;
                let message = ``
                switch (button_id) {
                    case 'fruit_category':
                        let listOfProducts = await Store.getProductsInCategory(button_id);
                        listOfProducts.data.map((product) => {
                            let emoji = product.emoji
                            let name = product.name
                            let packPrice = product.pack_price
                            let packedItems = product.packed_items
                            message += `${emoji} ${name} Pack of ${packedItems}  k${packPrice}\n`
                        })
                        message += `Tell me which fruits you want and how packs.\neg. 2 pack banana`
                        const reply = {
                            message: message,
                            recipientPhone: recipientPhone,
                            //timestamp: timestamp,
                            }
                        Whatsapp.sendText(reply)
                        break;
                    case '':

                        break

                    default:
                        break;
                }
            }

            // Extract the response from Dialogflow and send it back to WhatsApp
            const { fulfillmentText } = dialogflowResponse[0].queryResult;
            console.log("+++dialogflowResponse++++")
            console.log(dialogflowResponse)
            const { action } = dialogflowResponse[0].queryResult;
            //Actions cases        
            switch (action) {
                case 'greeting':
                    await Whatsapp.sendSimpleButtons({
                                message: `Hey ${recipientName}, am AI chatbota and am here to assist you! \nPlease choose from the following:`,
                                recipientPhone: recipientPhone, 
                                listOfButtons: [
                                    {
                                        title: 'Fruits',
                                        id: 'fruit_category',
                                    },
                                    {
                                        title: 'Vegetables',
                                        id: 'veg_category',
                                    },
                                    {
                                        title: 'Speak to a human',
                                        id: 'speak_to_human',
                                    },
                                ],
                            });
                    break;
                case 'orderFruits':
                    break
                default:
                    const response = {
                        message: fulfillmentText,
                        recipientPhone: recipientPhone,
                        //timestamp: timestamp,
                        };
                        console.log(fulfillmentText)
                        await Whatsapp.sendText(response)
                    break;
            }
           
        }

        console.log('GET: Someone is pinging me!');

        return res.sendStatus(200);
    } catch (error) {
                console.error({error})
        return res.sendStatus(500);
    }
});
module.exports = router;
