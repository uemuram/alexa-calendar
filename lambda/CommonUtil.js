const AWS = require('aws-sdk');

class CommonUtil {

    // 状態をチェック
    checkState(h, state) {
        return (this.getState(h) == state);
    }

    //状態を取得
    getState(h) {
        return this.getSessionValue(h, 'STATE');
    }

    //状態を保存
    setState(h, state) {
        this.setSessionValue(h, 'STATE', state);
    }

    // セッションから値を取得
    getSessionValue(h, key) {
        const attr = h.attributesManager.getSessionAttributes();
        return attr[key];
    }

    // セッションに値を入れる
    setSessionValue(h, key, value) {
        let attr = h.attributesManager.getSessionAttributes();
        attr[key] = value
        h.attributesManager.setSessionAttributes(attr);
        console.log("セッション保存 : " + JSON.stringify({ 'key': key, 'value': value }));
    }

    // パラメータストアから値を取得(再利用のために取得後にセッションに格納)
    // 非同期処理を含むので、呼び出し元ではawaitを付けて呼び出すこと
    async getParameterFromSSM(handlerInput, key) {
        // セッションにあればそこから取得、なければパラメータストアから取得
        let parameter = this.getSessionValue(handlerInput, key);
        if (parameter) {
            console.log(key + ' : ' + parameter + '(セッションから取得)');
        } else {
            const ssm = new AWS.SSM();
            const request = { Name: key, WithDecryption: true };
            const response = await ssm.getParameter(request).promise();
            parameter = response.Parameter.Value;
            console.log(key + ' : ' + parameter + '(SSMから取得)');
            // セッションに保管
            this.setSessionValue(handlerInput, key, parameter);
        }
        return parameter;
    }

    // 該当年月の祝日一覧を取得する
    // 非同期処理を含むので、呼び出し元ではawaitを付けて呼び出すこと
    async getPublicHolidays(handlerInput, year) {
        // 保存キー
        const publicHolidaysKey = "PUBLIC-HOLIDAYS-" + year;

        // セッションにあればそこから取得、なければs3から取得
        let publicHolidays = this.getSessionValue(handlerInput, publicHolidaysKey);
        if (publicHolidays) {
            // セッションから取得できた場合
            console.log(publicHolidaysKey + ' : ' + JSON.stringify(publicHolidays) + '(セッションから取得)');
        } else {
            // セッションから取得なかった場合
            // s3上の保存先を取得
            const dateInfoPath = await this.getParameterFromSSM(handlerInput, 'ALEXA-CALENDAR-DATEINFO-PATH');
            const match = dateInfoPath.match(/^s3:\/\/([^/]+)\/(.+)$/);
            const bucket = match[1];
            const key = match[2] + 'publicHolidays/' + year + '.json';
            console.log("祝日取得バケット : " + bucket + ' , キー : ' + key);

            // s3から取得
            const s3 = new AWS.S3();
            const response = await s3.getObject({ Bucket: bucket, Key: key }).promise();
            publicHolidays = JSON.parse(response.Body.toString('utf-8'));
            console.log(publicHolidaysKey + ' : ' + JSON.stringify(publicHolidays) + '(s3から取得)');
            // セッションに保管
            this.setSessionValue(handlerInput, publicHolidaysKey, publicHolidays);
        }
        // 補正(「天皇誕生日 振替休日」は単に「振替休日」)にする
        for (let day in publicHolidays) {
            if (publicHolidays[day].indexOf("振替休日") >= 0) {
                publicHolidays[day] = "振替休日";
            }
        }
        return publicHolidays;
    }

    // 同じ日付けかどうか判定する
    isSameDate(date1, date2) {
        if (
            (date1.getFullYear() == date2.getFullYear())
            && (date1.getMonth() == date2.getMonth())
            && (date1.getDate() == date2.getDate())
        ) {
            return true;
        } else {
            return false;
        }
    }

    // 日付けをYYYY-MM-DD形式にフォーマットする
    formatDate(date) {
        return date.getFullYear()
            + '-' + ('0' + (date.getMonth() + 1)).slice(-2)
            + '-' + ('0' + date.getDate()).slice(-2);
    }

    // 祝日名を返す。祝日でない場合はnullを返す
    getPublicHolidayText(date, publicHolidays) {
        return publicHolidays[this.formatDate(date)];
    }

    // 元号を返す
    getEra(year) {
        if (year == 1989) {
            return '昭和64<br>/平成1'
        } else if (year == 2019) {
            return '平成31<br>/令和1'
        } else if (year <= 1988) {
            return '昭和' + (year - 1925);
        } else if (year <= 2018) {
            return '平成' + (year - 1988);
        } else {
            return '令和' + (year - 2018);
        }
    };

    // AMAZON.DATEから年と月を返す
    getYearMonthFromAmazonDate(dateStr) {
        let match;

        // YYYY-MM-DD or YYYY-MM
        match = dateStr.match(/^(\d{4})-(\d{2})/);
        if (match) {
            return {
                year: parseInt(match[1]),
                month: parseInt(match[2])
            }
        }
        // YYYY
        match = dateStr.match(/^(\d{4})$/);
        if (match) {
            return {
                year: parseInt(match[1]),
                month: 1
            }
        }
        return {};
    }

    // テンプレートドキュメントをセットアップする
    setupTemplateDocument(handlerInput, aplDocument) {
        // 丸型かどうか判定
        let round = false;
        if (handlerInput.requestEnvelope.context.Viewport.shape == 'ROUND') {
            round = true;
        }

        // 複製対象となるドキュメント(1日分)
        let dateDocument;
        if (round) {
            dateDocument = aplDocument.mainTemplate.items[0].items[2].items[0];
        } else {
            dateDocument = aplDocument.mainTemplate.items[1].items[1].items[1].items[0];
        }
        const dateDocumentStr = JSON.stringify(dateDocument);

        // 日付けドキュメントの複製処理
        let dateNum = 0;
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 7; j++) {
                // 日付けインデックス([0])を置き換える
                let newDateDocument = JSON.parse(dateDocumentStr.replace(/\[0\]/g, '[' + dateNum + ']'));
                // 置き換えた日付け箇所をテンプレートに当てはめる
                if (round) {
                    aplDocument.mainTemplate.items[0].items[i + 2].items[j] = newDateDocument;
                } else {
                    aplDocument.mainTemplate.items[1].items[1].items[i + 1].items[j] = newDateDocument;
                }
                dateNum++;
            }
        }
        return aplDocument;
    }

    // テンプレートデータソースをセットアップする
    setupTemplateDataSource(handlerInput, aplDataSource, year, month, publicHolidays) {
        let data = aplDataSource.data;

        // 年月
        data.year = year;
        data.era = this.getEra(year);
        data.month = month;
        data.prevMonth = month == 1 ? 12 : month - 1;
        data.nextMonth = month == 11 ? 12 : (month + 1) % 12;

        // -- 日付け関連データの整備 --
        // カレンダー左上になる日付け(その月の1日 - 曜日)
        let refDate = new Date(year, month - 1, 1);
        refDate.setDate(refDate.getDate() - refDate.getDay());

        // 本日日付け(日本時間にするために+9時間する)
        let today = new Date();
        today.setHours(today.getHours() + 9);

        // 日付けごとのデータセット
        for (let i = 0; i < 42; i++) {
            // 対象月かどうか
            let inDate = month == refDate.getMonth() + 1 ? true : false;

            // 日付け
            data.dateInfo[i] = { "date": refDate.getDate() };

            // 文字サイズ
            // 四角画面用
            data.dateInfo[i].fontSize = inDate ? "10vh" : "6vh";
            // 丸画面用
            data.dateInfo[i].fontSizeRound = inDate ? "8vh" : "5vh";

            // 祝日設定
            let publicHolidayText = this.getPublicHolidayText(refDate, publicHolidays);
            // 祝日名
            data.dateInfo[i].publicHolidayText = publicHolidayText;
            // 祝日名の文字色
            data.dateInfo[i].publicHolidayTextColor = inDate ? 'red' : 'palevioletred';

            // 日付けの文字色
            if (publicHolidayText) {
                // 祝日
                data.dateInfo[i].dateCharColor = inDate ? 'red' : 'palevioletred';
            } else if (refDate.getDay() == 0) {
                // 日曜
                data.dateInfo[i].dateCharColor = inDate ? 'red' : 'palevioletred';
            } else if (refDate.getDay() == 6) {
                // 土曜
                data.dateInfo[i].dateCharColor = inDate ? 'blue' : 'cornflowerblue';
            } else {
                // 平日
                data.dateInfo[i].dateCharColor = inDate ? 'black' : 'darkgray';
            }

            // 背景色
            if (this.isSameDate(today, refDate)) {
                // 今日の場合
                data.dateInfo[i].backgroundColor = 'yellow';
            } else {
                // 今日以外の場合
                data.dateInfo[i].backgroundColor = 'white';
            }

            // 1日加算
            refDate.setDate(refDate.getDate() + 1);
        }

        return aplDataSource;
    }

    // カレンダー用のレスポンスを組み立てて返却する
    async getDispCalendarResponse(handlerInput, year, month) {
        console.log('対象年月 : ' + year + '年' + month + '月');

        // 対象年月の祝日一覧を取得(非同期アクセスがあるのでawaitで処理環境を待つ)
        const publicHolidays = await this.getPublicHolidays(handlerInput, year);
        console.log('祝日一覧 : ' + JSON.stringify(publicHolidays));

        // ドキュメントを組み立てる。左上済にのみ日にちを入れているので、それを増殖させる
        let aplDocument = require('./apl/CalendarTemplateDocument.json');
        aplDocument = this.setupTemplateDocument(handlerInput, aplDocument);

        // ドキュメントに動的変更値を割り当てる
        let aplDataSource = require('./apl/CalendarTemplateDataSource.json');
        aplDataSource = this.setupTemplateDataSource(handlerInput, aplDataSource, year, month, publicHolidays);

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
}

module.exports = CommonUtil;