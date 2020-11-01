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

        // util.setSessionValue(handlerInput, 'REPROMPT_OUTPUT', "session_test");

        // TODO: タッチ処理時の画面遷移を実装

        // 年月(現在日付け)を取得(日本時間にするために+9している)
        const currentDate = new Date();
        currentDate.setHours(currentDate.getHours() + 9);
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        console.log('対象年月 : ' + year + '年' + month + '月');

        // 対象年月の祝日一覧を取得(非同期アクセスがあるのでawaitで処理環境を待つ)
        const publicHolidays = await util.getPublicHolidays(handlerInput, year);
        console.log('祝日一覧 : ' + JSON.stringify(publicHolidays));

        // ドキュメントを組み立てる。左上済にのみ日にちを入れているので、それを増殖させる
        let aplDocument = require('./apl/CalendarTemplateDocument.json');
        aplDocument = util.setupTemplateDocument(handlerInput, aplDocument);
        // console.log(JSON.stringify(aplDocument));

        // ドキュメントに動的変更値を割り当てる
        let aplDataSource = require('./apl/CalendarTemplateDataSource.json');
        aplDataSource = util.setupTemplateDataSource(handlerInput, aplDataSource, year, month, publicHolidays);

        // 音声を組み立て。無音を入れることにより表示を長くする。(音声長さ + 30秒表示)
        const speakOutput = '<speak>'
            + year + '年' + month + '月のカレンダーです'
            + '<break time="10s"/><break time="10s"/><break time="10s"/><break time="10s"/><break time="10s"/><break time="10s"/>'
            + '</speak>';

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
    async handle(handlerInput) {
        const eventType = handlerInput.requestEnvelope.request.arguments[0];
        let year = handlerInput.requestEnvelope.request.arguments[1];
        let month = handlerInput.requestEnvelope.request.arguments[2];
        console.log("タッチイベント : " + eventType + "," + year + "," + month);

        year = parseInt(year);
        month = parseInt(month);
        if (eventType == "transPrevMonth") {
            console.log("前の月に遷移");
            if (month == 1) {
                year--;
            }
            month = month == 1 ? 12 : month - 1;
        } else {
            console.log("次の月に遷移");
            if (month == 12) {
                year++;
            }
            month = month == 11 ? 12 : (month + 1) % 12;
        }

        console.log('対象年月 : ' + year + '年' + month + '月');

        // 対象年月の祝日一覧を取得(非同期アクセスがあるのでawaitで処理環境を待つ)
        const publicHolidays = await util.getPublicHolidays(handlerInput, year);
        console.log('祝日一覧 : ' + JSON.stringify(publicHolidays));

        // ドキュメントを組み立てる。左上済にのみ日にちを入れているので、それを増殖させる
        let aplDocument = require('./apl/CalendarTemplateDocument.json');
        aplDocument = util.setupTemplateDocument(handlerInput, aplDocument);
        // console.log(JSON.stringify(aplDocument));

        // ドキュメントに動的変更値を割り当てる
        let aplDataSource = require('./apl/CalendarTemplateDataSource.json');
        aplDataSource = util.setupTemplateDataSource(handlerInput, aplDataSource, year, month, publicHolidays);

        // 音声を組み立て。無音を入れることにより表示を長くする。(音声長さ + 30秒表示)
        const speakOutput = '<speak>'
            + year + '年' + month + '月のカレンダーです'
            + '<break time="10s"/><break time="10s"/><break time="10s"/><break time="10s"/><break time="10s"/><break time="10s"/>'
            + '</speak>';

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
        TouchEventHandler,
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
