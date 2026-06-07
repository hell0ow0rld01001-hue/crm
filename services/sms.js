const trezSms = require('trez-sms-client');
const client = new TrezSmsClient("mahdiDeh", "mahdi2018");

client.autoSendCode("09371919342", "Signiture Footer For Branding")
    .then((messageId) => {
        console.log("Sent Message ID: " + messageId);
    })
    .catch(error => console.log(error));