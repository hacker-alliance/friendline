const VoiceResponse = require('twilio').twiml.VoiceResponse;

let response;

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html 
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 * 
 */
exports.lambdaHandler = async (event, context) => {
    const twiml = new VoiceResponse();
    twiml.say({ voice: 'alice' }, 'Hello, Welcome to neighbor line!');

    // twiml.say({ voice: 'alice' }, 'I see you are calling from ');
    console.log(event.body);

    twiml.say({ voice: 'alice' }, 'We\'ll be pairing you with a neighbor shortly, here\'s some music while you wait');

    const dial = twiml.dial();
    const waitMusicBucket = 'com.twilio.music.classical';
    const waitMessage = 'Thank you for waiting. We\'ll be pairing you with a friend shortly.';

    // TODO - Route based on detected City or IVR Input
    dial.conference({
        waitUrl: 'https://api.neighborline.hackeralliance.org/wait/music',
        beep: true
    }, 'NYC-Room');

    try {
        response = {
            'statusCode': 200,
            'headers': { "content-type": "text/xml" },
            'body': twiml.toString()
        }
    } catch (err) {
        console.log(err);
        return err;
    }
    return response
};
