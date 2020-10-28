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
    }

    // 該当年月の祝日一覧を取得する
    getPublicHolidays(handlerInput, year) {
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

    setupTemplateDataSource(handlerInput, aplDataSource, year, month) {
        let data = aplDataSource.data;

        // 年月
        data.year = year;
        data.month = month;

        // -- 日付け関連データの整備 --
        // カレンダー左上になる日付け(その月の1日 - 曜日)
        let refDate = new Date(year, month - 1, 1);
        refDate.setDate(refDate.getDate() - refDate.getDay());

        // 日付けごとのデータセット
        for (let i = 0; i < 42; i++) {
            // 対象月かどうか
            let inDate = month == refDate.getMonth() + 1
                ? true
                : false;

                // 日付け
            data.dateInfo[i] = { "date": refDate.getDate() };

            // 文字サイズ
            data.dateInfo[i].fontSize = inDate
                ? "10vh"
                : "6vh";
            data.dateInfo[i].fontSizeRound = inDate
                ? "8vh"
                : "5vh";

            // 文字色
            if (refDate.getDay() == 0) {
                // 日曜
                if (inDate) {
                    data.dateInfo[i].dateCharColor = 'red';
                } else {
                    data.dateInfo[i].dateCharColor = 'pink';
                }
            } else if (refDate.getDay() == 6) {
                // 土曜
                if (inDate) {
                    data.dateInfo[i].dateCharColor = 'blue';
                } else {
                    data.dateInfo[i].dateCharColor = 'lightblue';
                }
            } else {
                // 平日
                if (inDate) {
                    data.dateInfo[i].dateCharColor = 'black';
                } else {
                    data.dateInfo[i].dateCharColor = 'darkgray';
                }
            }
            data.dateInfo[i].backgroundColor = 'white';

            // 1日加算
            refDate.setDate(refDate.getDate() + 1);
        }

        return aplDataSource;
    }
}

module.exports = CommonUtil;