// This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.
const Alexa = require('ask-sdk-core');
const CommonUtil = require('./CommonUtil.js');
const util = new CommonUtil();

// 画面なしデバイスでの処理
const NoDisplayRequestHandler = {
    canHandle(handlerInput) {
        return !handlerInput.requestEnvelope.context.Viewport;
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak('ご利用ありがとうございます。このスキルは画面表示を伴います。画面つきのデバイスでご利用ください。')
            .getResponse();
    },
};

// 起動時処理
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    async handle(handlerInput) {

        // 年月(現在日付け)を取得(日本時間にするために+9している)
        let currentDate = new Date();
        currentDate.setHours(currentDate.getHours() + 9);
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;

        // レスポンスを組み立て
        const response = await util.getDispCalendarResponse(handlerInput, year, month);
        return response;
    }
};

// 年月を指定したカレンダー表示
const SpecifyYearMonthIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'SpecifyYearMonthIntent';
    },
    async handle(handlerInput) {

        const dateSlotValue = Alexa.getSlotValue(handlerInput.requestEnvelope, 'Date');
        console.log('スロット値(date) : ' + dateSlotValue);
        const destinationSlotValue = Alexa.getSlotValue(handlerInput.requestEnvelope, 'Destination');
        console.log('スロット値(destination) : ' + destinationSlotValue);

        let yearMonth, year = null, month = null;
        if (dateSlotValue) {
            console.log('dateから取得');
            yearMonth = util.getYearMonthFromAmazonDate(dateSlotValue);
            year = yearMonth.year;
            month = yearMonth.month;
        } else if (destinationSlotValue) {
            console.log('destinationから取得');
            let destinationSlotId = handlerInput.requestEnvelope.request.intent.slots.
                Destination.resolutions.resolutionsPerAuthority[0].values[0].value.id;
            console.log('destinationSlotId : ' + destinationSlotId);
            yearMonth = util.getYearMonthFromDestination(handlerInput, destinationSlotId);
            year = yearMonth.year;
            month = yearMonth.month;
        }

        // レスポンスを組み立て
        const response = await util.getDispCalendarResponse(handlerInput, year, month);
        return response;
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can say hello to me! How can I help?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'ご利用ありがとうございました。';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `想定外の呼び出しが発生しました。もう一度お試しください。`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.stack}`);
        const speakOutput = `エラーが発生しました。もう一度お試しください。`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

// リクエストインターセプター(エラー調査用)
const RequestLog = {
    process(handlerInput) {
        //console.log("REQUEST ENVELOPE = " + JSON.stringify(handlerInput.requestEnvelope));
        console.log("HANDLER INPUT = " + JSON.stringify(handlerInput));
        const requestType = Alexa.getRequestType(handlerInput.requestEnvelope);
        console.log("REQUEST TYPE =  " + requestType);
        if (requestType === 'IntentRequest') {
            console.log("INTENT NAME =  " + Alexa.getIntentName(handlerInput.requestEnvelope));
        }
        return;
    }
};

// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        NoDisplayRequestHandler,
        LaunchRequestHandler,
        SpecifyYearMonthIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler, // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
    )
    .addErrorHandlers(
        ErrorHandler,
    )
    .addRequestInterceptors(RequestLog)
    .lambda();
