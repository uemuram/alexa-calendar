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








}

module.exports = CommonUtil;