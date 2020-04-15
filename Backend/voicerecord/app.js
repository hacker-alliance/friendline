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
  twiml.say(voiceParams, 'Please leave a message after the beep, hangup when finished.');
  twiml.record({
    timeout: 300,
    transcribe: false,
    trim: 'trim-silence',
    finishOnKey: '',
  });
  twiml.say(voiceParams, 'Thank you for your feedback. Goodbye.');
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
