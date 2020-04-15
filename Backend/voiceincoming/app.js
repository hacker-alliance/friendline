
const { VoiceResponse } = require('twilio').twiml;

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
const voiceParams = {
  language: 'en',
};

exports.lambdaHandler = async (event, context) => {
  console.log(event);
  console.log(context);


  const twiml = new VoiceResponse();
  twiml.say(voiceParams, 'Hello, welcome to neighbor line!');
  const gather = twiml.gather({
    input: 'dtmf',
    numDigits: '1',
    timeout: '3',
    action: '/voice/record',
    method: 'POST',
  });
  gather.say(voiceParams, 'If you would like to leave a message, press any key, otherwise stay on the line.');
  twiml.say(voiceParams, 'We\'ll be pairing you with a neighbor shortly.');
  twiml.redirect({ method: 'POST' }, '/voice/queue');

  try {
    response = {
      statusCode: 200,
      headers: { 'content-type': 'text/xml' },
      body: twiml.toString(),
    };
  } catch (err) {
    console.log(err);
    return err;
  }
  return response;
};
