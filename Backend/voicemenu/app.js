
const { VoiceResponse } = require('twilio').twiml;
const querystring = require('querystring');

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
  console.log(event);
  console.log(context);

  const params = querystring.parse(event.body);
  console.log(params);

  const twiml = new VoiceResponse();
  switch (params.Digits) {
    case '1':
      twiml.play('https://neighborline-public.s3.amazonaws.com/audio/After1.wav');
      twiml.redirect({ method: 'POST' }, '/voice/queue');
      break;
    case '2':
      twiml.redirect({ method: 'POST' }, '/voice/record');
      break;
    default:
      twiml.gather({
        input: 'dtmf',
        numDigits: '1',
        timeout: '5',
        action: '/voice/menu',
        method: 'POST',
      }).play('https://neighborline-public.s3.amazonaws.com/audio/Guidelines.wav');
      twiml.redirect();
  }
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
