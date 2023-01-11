import { Request, Response } from "express";
import axios from 'axios'

interface IQuestionParams {
    web: string, 
    startDate: number, 
    endDate: number, 
    device: string, 
    sourceName: string, 
    sourceSource: string, 
    question?: string,
    page?: string,
    nbQuestion?: number,
    level?: number,
    buttonEvent?: string,
}

const EVENT_NOT_FOUND = 'EVENT_NOT_FOUND';

const getWebUrl = (web: string) => {
  if (web === 'asvab') {
      return 'asvab-prep.com/';
  } else if (web === 'aws') {
      return 'analytics_276497073';
  }	else if (web === 'cdl') {
      return 'cdl-prep.com/';
  }	else if (web === 'cna') {
      return 'analytics_276514678';
  }	else if (web === 'dmv') {
      return 'analytics_276521412';
  }	else if (web === 'driving') {
      return 'theory	analytics_276522738';
  } else if (web === 'ged') {
      return 'analytics_276525866';
  }	else if (web === 'passemall') {
      return 'analytics_276498001';
  }	else if (web === 'pmp') {
      return 'analytics_276530750';
  }	else if (web === 'ptce') {
      return 'analytics_276558988';
  }	else if (web === 'real') {
      return 'estate	analytics_276542801';
  } else if (web === 'servsafe') {
      return 'analytics_276534109';
  }	else if (web === 'teas') {
      return 'analytics_276531209';
  }
}

const getButtonEventType = (question: string) => {
  const eventType: any = {
    'Home - How many users click DIAGNOSTIC TEST button?': 'cta_webV2_step_diagnostics_test',
    'Home - How many users click LEARNING button?': 'cta_webV2_step_learning',
    "Home - How many users click FULL TEST button?": 'cta_webV2_step_full_test',
    "Home - How many users click START NOW button?": 'cta_webV2_start_now',
    "Home - How many users click on Google Play link?": 'cta_webV2_google_play_link',
    "Home - How many users click on App Store link?": 'cta_webV2_app_store_link',
    'Home - How many users click "Pass the first time with 3-step formula" button?': 'cta_webV2_pass_the_first_time',
    "Home - How many users click Start Practicing Now button?": 'cta_webV2_start_practicing_now',
    'Home - How many users click "Text me app" button?': 'send_email_download_app',
    'Home - How many users click "Get in on Google Play" button?': 'cta_webV2_get_it_on_google_play',
    'Home - How many users click "Get in on App Store" button?': 'cta_webV2_get_it_on_apple_store',
    'Home - How many users click "Start Now Web Browser" button?': 'cta_webV2_start_now_web',
    'Diagnostic - How many users click submit button?': 'submit_diagnostic_test',
    'Diagnostic End - How many users click improve button?': 'webV2_improve_to_learn',
    'Diagnostic End - How many users click LEARNING button?': 'cta_webV2_step_learning',
    'Diagnostic End - How many users click FULL TEST button?': 'cta_webV2_step_full_test',
    'Full Test - How many users click submit button?': 'submit_test',
    'Full Test End - How many users click improve button?': 'webV2_improve_to_learn',
    'Full Test End - How many users click LEARNING button?': 'cta_webV2_step_learning',
    'Full Test End - How many users click DIAGNOSTIC TEST button?': 'cta_webV2_step_diagnostics_test',
  }
  const result = eventType[question];

  if(result === 'undefined') {
    return EVENT_NOT_FOUND;
  }

  return result;
}

const getWebTable = (web: string) => {
    if (web === 'asvab') {
        return 'analytics_276504257';
    } else if (web === 'aws') {
        return 'analytics_276497073';
    }	else if (web === 'cdl') {
        return 'analytics_276501971';
    }	else if (web === 'cna') {
        return 'analytics_276514678';
    }	else if (web === 'dmv') {
        return 'analytics_276521412';
    }	else if (web === 'driving') {
        return 'theory	analytics_276522738';
    } else if (web === 'ged') {
        return 'analytics_276525866';
    }	else if (web === 'passemall') {
        return 'analytics_276498001';
    }	else if (web === 'pmp') {
        return 'analytics_276530750';
    }	else if (web === 'ptce') {
        return 'analytics_276558988';
    }	else if (web === 'real') {
        return 'estate	analytics_276542801';
    } else if (web === 'servsafe') {
        return 'analytics_276534109';
    }	else if (web === 'teas') {
        return 'analytics_276531209';
    }
}

const getQueryCondition = (query: string, device: string, sourceName: string, sourceSource: string) => {
    if (sourceName !== 'all') {
      query += " AND traffic_source.name = '" + sourceName + "' ";
    }
    if (sourceName === '(referral)' && sourceSource !== 'all') {
      query += " AND traffic_source.source LIKE '%" + sourceSource + "%' ";
    }
    if (device !== 'all') {
      query += " AND device.category = '" + device + "' ";
    }
    
    query += " AND geo.country != 'Vietnam' ";  
    return query;
}

const getBigQueryData = async (query: string) => {
    const url = process.env.DASHBOARD_API || ''
    try {
        const {data} = await axios.post(url, {
            query: query
        })
        return data
    } catch (error) {
        console.log("ERROR", error)
        return null;
    }
}

const getNbUsersVisitHomePage = async ({web, startDate, endDate, device, sourceName, sourceSource}: IQuestionParams) => {
    const tableName = getWebTable(web);
    const webUrl = getWebUrl(web);
    let query = "SELECT COUNT(DISTINCT(user_pseudo_id)) FROM `micro-enigma-235001." + tableName + ".events_*` CROSS JOIN UNNEST(event_params) ep1 WHERE _TABLE_SUFFIX BETWEEN '" + startDate + "' AND '" + endDate + "' AND event_name = 'page_view'  AND ep1.key = 'page_location' AND ep1.value.string_value LIKE '%" + webUrl + "'";
    query = getQueryCondition(query, device, sourceName, sourceSource);
    const data: any = await getBigQueryData(query);

    if(data) {
        return parseInt(data[0]['f0_']);
    }
    return 0;
}

const getNbUsersVisitSpecificPage = async ({web, startDate, endDate, device, sourceName, sourceSource, page}: IQuestionParams) => {
    const tableName = getWebTable(web);
  
    const webUrl = getWebUrl(web);
    let query = "SELECT COUNT(DISTINCT(user_pseudo_id)) FROM `micro-enigma-235001." + tableName + ".events_*` CROSS JOIN UNNEST(event_params) ep1 WHERE _TABLE_SUFFIX BETWEEN '" + startDate + "' AND '" + endDate + "' AND event_name = 'page_view'  AND ep1.key = 'page_location' AND ep1.value.string_value LIKE '%" + webUrl + page + "'";
    query = getQueryCondition(query, device, sourceName, sourceSource);
    const data: any = await getBigQueryData(query);
    if(data) {
        return parseInt(data[0]['f0_']);
    }
    return 0;
}

const getNbUsersAnswerQuestion = async ({web, startDate, endDate, device, sourceName, sourceSource, page}: IQuestionParams) => {
    const tableName = getWebTable(web);
    const webUrl = getWebUrl(web);
    let query = "SELECT COUNT(DISTINCT(user_pseudo_id)) FROM `micro-enigma-235001." + tableName + ".events_*` CROSS JOIN UNNEST(event_params) ep1 WHERE _TABLE_SUFFIX BETWEEN '" + startDate + "' AND '" + endDate + "' AND event_name = 'answer_question'  AND ep1.key = 'page_location' AND ep1.value.string_value LIKE '%" + webUrl + "learn/new-study/" + page + "'";
    query = getQueryCondition(query, device, sourceName, sourceSource);
    const data: any = await getBigQueryData(query);
    if(data) {
        return parseInt(data[0]['f0_']);
    }
    return 0;
}

const getNbAnswersQuestion = async ({web, startDate, endDate, device, sourceName, sourceSource, page}: IQuestionParams) => {
    const tableName = getWebTable(web);
    const webUrl = getWebUrl(web);
    let query = "SELECT COUNT(*) FROM `micro-enigma-235001." + tableName + ".events_*` CROSS JOIN UNNEST(event_params) ep1 WHERE _TABLE_SUFFIX BETWEEN '" + startDate + "' AND '" + endDate + "' AND event_name = 'answer_question'  AND ep1.key = 'page_location' AND ep1.value.string_value LIKE '%" + webUrl + "learn/new-study/" + page + "'";
    query = getQueryCondition(query, device, sourceName, sourceSource);
    const data: any = await getBigQueryData(query);
    if(data) {
        return parseInt(data[0]['f0_']);
    }
    return 0;
}

const getNbUsersFinishTest = async ({web, startDate, endDate, device, sourceName, sourceSource, page, nbQuestion}: IQuestionParams) => {
    const tableName = getWebTable(web);
    const webUrl = getWebUrl(web);
    let query = "SELECT user_pseudo_id, COUNT(DISTINCT(ep2.value.int_value)) AS nb FROM `micro-enigma-235001." + tableName + ".events_*` CROSS JOIN UNNEST(event_params) ep1 CROSS JOIN UNNEST(event_params) ep2 WHERE _TABLE_SUFFIX BETWEEN '" + startDate + "' AND '" + endDate + "' AND event_name = 'answer_question'  AND ep1.key = 'page_location' AND ep1.value.string_value LIKE '%" + webUrl + "learn/new-study/" + page + "' AND ep2.key = 'target_question_id'";
    query = getQueryCondition(query, device, sourceName, sourceSource);
    query = "SELECT COUNT(*) FROM (" + query + " GROUP BY user_pseudo_id) WHERE nb >= " + nbQuestion; 
    const data: any = await getBigQueryData(query);
    if(data) {
        return parseInt(data[0]['f0_']);
    }
    return 0;
}

const getNbUsersSelectTestLevel = async ({web, startDate, endDate, device, sourceName, sourceSource, level}: IQuestionParams) => {
    const tableName = getWebTable(web);
    let query = "SELECT COUNT(DISTINCT(user_pseudo_id)) FROM `micro-enigma-235001." + tableName + ".events_*` CROSS JOIN UNNEST(event_params) ep1 WHERE _TABLE_SUFFIX BETWEEN '" + startDate + "' AND '" + endDate + "' AND event_name = 'webV2_go_to_test'  AND ep1.key = 'level' AND ep1.value.int_value = " + level;
    query = getQueryCondition(query, device, sourceName, sourceSource);
    const data: any = await getBigQueryData(query);
    if(data) {
        return parseInt(data[0]['f0_']);
    }
    return 0;
}

const getNbUsersClickButton = async ({web, startDate, endDate, device, sourceName, sourceSource, question = '', buttonEvent}: IQuestionParams) => {
    const tableName = getWebTable(web);
    let pageLocation = getWebUrl(web);
    if (question.startsWith('Diagnostic')) {
      pageLocation += 'learn/new-study/diagnostic-test%';
    } else if (question.startsWith('Learning')) {
      pageLocation += 'learn/new-study/learning%';
    } else if (question.startsWith('Full Test')) {
      pageLocation += 'learn/new-study/full-test%';
    }
    let query = "SELECT COUNT(DISTINCT(user_pseudo_id)) FROM `micro-enigma-235001." + tableName + ".events_*` CROSS JOIN UNNEST(event_params) ep1 WHERE _TABLE_SUFFIX BETWEEN '" + startDate + "' AND '" + endDate + "' AND event_name = '" + buttonEvent + "' AND ep1.key = 'page_location' AND ep1.value.string_value LIKE '%" + pageLocation + "'";
    query = getQueryCondition(query, device, sourceName, sourceSource);
    const data: any = await getBigQueryData(query);
    if(data) {
        return parseInt(data[0]['f0_']);
    }
    return 0;
}

const getResultByQuestion = async ({web, startDate, endDate, device, sourceName, sourceSource, question}: IQuestionParams) => {
    switch (question) {
      // HOME
      case "How many users visit home page?":
        return await getNbUsersVisitHomePage({web, startDate, endDate, device, sourceName, sourceSource});
      // DIAGNOSTIC
      case "Diagnostic - How many users visit Diagnostic Presentation Test?":
        return await getNbUsersVisitSpecificPage({web, startDate, endDate, device, sourceName, sourceSource, page: "learn/new-study/diagnostic-test"});
      case "Diagnostic - How many users answer question?":
        return await getNbUsersAnswerQuestion({web, startDate, endDate, device, sourceName, sourceSource, page: "diagnostic-test"});
      case "Diagnostic - A user answers how many time in avg?":
        return await getNbAnswersQuestion({web, startDate, endDate, device, sourceName, sourceSource, page: "diagnostic-test"}) / await getNbUsersAnswerQuestion({web, startDate, endDate, device, sourceName, sourceSource, page: "diagnostic-test"});
      case 'Diagnostic - How many users finish the test?':
        return await getNbUsersFinishTest({web, startDate, endDate, device, sourceName, sourceSource, page: "diagnostic-test", nbQuestion: 45});
      // LEARNING
      case "Learning - How many users visit Learning Page?":
        return await getNbUsersVisitSpecificPage({web, startDate, endDate, device, sourceName, sourceSource, page: "learn/new-study/learning"});
      case "Learning - How many users answer question?":
        return await getNbUsersAnswerQuestion({web, startDate, endDate, device, sourceName, sourceSource, page: "learning"});
      case "Learning - A user answers how many time in avg?":
        return await getNbAnswersQuestion({web, startDate, endDate, device, sourceName, sourceSource, page: "learning"}) / await getNbUsersAnswerQuestion({web, startDate, endDate, device, sourceName, sourceSource, page: "learning"});
      case 'Learning - How many users finish at least 1 part?':
        return await getNbUsersFinishTest({web, startDate, endDate, device, sourceName, sourceSource, page: "learning", nbQuestion: 8});
      // FULL TEST
      case 'Full Test - How many users select level easy?':
        return await getNbUsersSelectTestLevel({web, startDate, endDate, device, sourceName, sourceSource, level: 1});
      case 'Full Test - How many users select level medium?':
        return await getNbUsersSelectTestLevel({web, startDate, endDate, device, sourceName, sourceSource, level: 2});
      case 'Full Test - How many users select level hard?':
        return await getNbUsersSelectTestLevel({web, startDate, endDate, device, sourceName, sourceSource, level: 3});
      default:
        const eventType = getButtonEventType(question || '');
        if(eventType === EVENT_NOT_FOUND) return 0;
        return await getNbUsersClickButton({web, startDate, endDate, device, sourceName, sourceSource, question, buttonEvent: eventType});
    } 
}

export const answerByQuestion = async (req: Request, res: Response) => {
    let result = -1;
    try {
        const {
            web,
            startDate,
            endDate,
            device,
            sourceName,
            sourceSource,
            question,
        } = req.body;
        if (
            web &&
            startDate &&
            endDate &&
            device &&
            sourceName &&
            sourceSource &&
            question
        ) {
            result = await getResultByQuestion({
                web,
                startDate,
                endDate,
                device,
                sourceName,
                sourceSource,
                question,
            });
        }
    } catch (error) {
        console.log(error);
    }
    return res.status(200).json({ result: result });
};