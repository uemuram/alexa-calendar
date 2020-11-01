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

        console.log("セッション保存 : " + JSON.stringify(attr));

    }

    // 日付け情報が保存されているs3パスを取得する
    // 非同期処理を含むので、呼び出し元ではawaitを付けて呼び出すこと
    async getDateInfoS3Path(handlerInput) {
        // セッションにあればそこから取得、なければパラメータストアから取得
        let dateInfoS3Path = this.getSessionValue(handlerInput, "DATE_INFO_S3_PATH");
        if (dateInfoS3Path) {
            console.log('dateInfoS3Path : ' + dateInfoS3Path + '(セッションから取得)');
        } else {
            const ssm = new AWS.SSM();
            const request = {
                Name: 'ALEXA-CALENDAR-DATEINFO-PATH',
                WithDecryption: true
            };
            const response = await ssm.getParameter(request).promise();
            dateInfoS3Path = response.Parameter.Value;
            console.log('dateInfoS3Path : ' + dateInfoS3Path + '(パラメータストアから取得)');
            // セッションに保管
            this.setSessionValue(handlerInput, "DATE_INFO_S3_PATH", dateInfoS3Path);
        }
        return dateInfoS3Path;
    }

    // // 日付情報を取得
    // async getPublicHolidaysFromS3(handlerInput, year) {
    //     const s3 = new AWS.S3();
    //     const response = await s3.getObject(
    //         {
    //             Bucket: 'mudev-alexa-private',
    //             Key: 'calendar/dateinfo/publicHolidays/2020.json'
    //         }
    //     ).promise();

    //     const publicHolidays = JSON.parse(response.Body.toString('utf-8'));
    //     console.log(publicHolidays);

    //     this.setSessionValue(handlerInput, "PUBLIC_HOLIDAYS_" + year, publicHolidays);

    //     return publicHolidays;
    //     //        return JSON.parse(publicHolidays);
    // }

    // 該当年月の祝日一覧を取得する
    // 非同期処理を含むので、呼び出し元ではawaitを付けて呼び出すこと
    async getPublicHolidays(handlerInput, year) {
        // s3上の保存先を取得
        const dateInfoS3Path = await this.getDateInfoS3Path(handlerInput);

        // const publicHolidays = this.getPublicHolidaysFromS3(handlerInput, year);
        // console.log('publicHolidays' + JSON.stringify(publicHolidays));
        // this.setSessionValue(handlerInput, "dateInfoS3Path", dateInfoS3Path);


        // TODO: 動的取得を実装
        // TODO: 一度取得したものはセッションからとる、とれないものは定数からとる、etc
        let holidays = {
            "2020-01-01": "元日",
            "2020-01-13": "成人の日",
            "2020-02-11": "建国記念の日",
            "2020-02-23": "天皇誕生日",
            "2020-02-24": "天皇誕生日 振替休日",
            "2020-03-20": "春分の日",
            "2020-04-29": "昭和の日",
            "2020-05-03": "憲法記念日",
            "2020-05-04": "みどりの日",
            "2020-05-05": "こどもの日",
            "2020-05-06": "憲法記念日 振替休日",
            "2020-07-23": "海の日",
            "2020-07-24": "体育の日",
            "2020-08-10": "山の日",
            "2020-09-21": "敬老の日",
            "2020-09-22": "秋分の日",
            "2020-11-03": "文化の日",
            "2020-11-23": "勤労感謝の日"
        }

        // 補正(「天皇誕生日 振替休日」は単に「振替休日」)にする
        for (let day in holidays) {
            if (holidays[day].indexOf("振替休日") >= 0) {
                holidays[day] = "振替休日";
            }
        }
        return holidays;
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

    // 祝日を返す。祝日でない場合はnullを返す
    getPublicHolidayText(date, publicHolidays) {
        return publicHolidays[this.formatDate(date)];
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
        data.month = month;

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
            // 祝日名の、文字色
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
}

module.exports = CommonUtil;