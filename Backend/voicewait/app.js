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

function randomChoice(choices) {
  const i = Math.floor(Math.random() * Math.floor(choices.length));
  return choices[i];
}

exports.lambdaHandler = async (event, context) => {
  console.log(event);
  console.log(context);

  const twiml = new VoiceResponse();

  const choices = [
    'http://com.twilio.music.classical.s3.amazonaws.com/ith_brahms-116-4.mp3',
    'http://com.twilio.music.classical.s3.amazonaws.com/ith_chopin-15-2.mp3',
  ];

  twiml.play(randomChoice(choices));
  twiml.hangup();

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
