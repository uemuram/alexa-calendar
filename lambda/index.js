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
    handle(handlerInput) {

        // 年月(現在日付け)を取得
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        console.log('対象年月 : ' + year + '年' + month + '月');

        // 対象年月の祝日一覧を取得
        const publicHolidays = util.getPublicHolidays(handlerInput, year);
        console.log('祝日一覧 : ' + JSON.stringify(publicHolidays));

        // TODO: ドキュメントを組み立てる。左上住にのみ日にちを入れているので、それを増殖させる
        const aplDocument = require('./apl/CalendarTemplateDocument.json');
        console.log(JSON.stringify(aplDocument));

        // TODO: ドキュメントに動的変更値を割り当てる
        const aplDataSource = require('./apl/CalendarTemplateDataSource.json');

        // 音声を組み立て
        // TODO: 無音を入れて音声を長くする?
        const speakOutput = year + '年' + month + '月のカレンダーです';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .addDirective({
                type: 'Alexa.Presentation.APL.RenderDocument',
                version: '1.4',
                document: aplDocument,
                datasources: aplDataSource
            })
            // .reprompt(speakOutput)
            .getResponse();
    }
};

// 画面タッチ時の処理
const TouchEventHandler = {
    canHandle(handlerInput) {
        return ((handlerInput.requestEnvelope.request.type === 'Alexa.Presentation.APL.UserEvent' &&
            (handlerInput.requestEnvelope.request.source.handler === 'Press' ||
                handlerInput.requestEnvelope.request.source.handler === 'onPress')));
    },
    handle(handlerInput) {
        // TcouhWrapperのargumentsで指定したパラメータを取得する
        const speechText = handlerInput.requestEnvelope.request.arguments[0];

        return handlerInput.responseBuilder
            .speak(speechText)
            .getResponse();
    }
};

// const LaunchRequestHandler = {
//     canHandle(handlerInput) {
//         return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
//     },
//     handle(handlerInput) {
//         const speakOutput = '画面サンプルです';

//         const aplSample = require('./CalendarTemplate02.json');

//         console.log(aplSample);

//         return handlerInput.responseBuilder
//             .speak(speakOutput)
//             .addDirective({
//                 type : 'Alexa.Presentation.APL.RenderDocument',
//                 version: '1.0',
//                 document: aplSample.document,
//                 datasources: aplSample.datasources
//             })
//             // .reprompt(speakOutput)
//             .getResponse();
//     }
// };

// const LaunchRequestHandler = {
//     canHandle(handlerInput) {
//         return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
//     },
//     handle(handlerInput) {
//         const speakOutput = '画面サンプルです';

//         const aplSample = require('./BodyTemplate7.json');

//         return handlerInput.responseBuilder
//             .speak(speakOutput)
//             .addDirective({
//                 type : 'Alexa.Presentation.APL.RenderDocument',
//                 version: '1.0',
//                 document: aplSample.document,
//                 datasources: aplSample.datasources
//             })
//             // .reprompt(speakOutput)
//             .getResponse();
//     }
// };

// const LaunchRequestHandler = {
//     canHandle(handlerInput) {
//         return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
//     },
//     handle(handlerInput) {
//         const speakOutput = '画面サンプルです';

//         const aplSample = require('./AVG01.json');

//         return handlerInput.responseBuilder
//             .speak(speakOutput)
//             .addDirective(aplSample.directives[0])
//             // .reprompt(speakOutput)
//             .getResponse();
//     }
// };

/*
const HelloWorldIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'HelloWorldIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Hello World!';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};
*/

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
        const speakOutput = 'Goodbye!';
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
        const speakOutput = `You just triggered ${intentName}`;

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
        const speakOutput = `Sorry, I had trouble doing what you asked. Please try again.`;

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
        TouchEventHandler,
        // HelloWorldIntentHandler,
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
