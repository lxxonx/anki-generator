import { select } from "@inquirer/prompts";
import puppeteer from "puppeteer";
const randomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
const login = async (page) => {
  const usernameInput = "input#id";
  await page.type(usernameInput, process.env.NAVER_ID, {
    delay: randomInt(50, 100),
  });

  await page.waitForTimeout(500);
  const passwordInput = "input#pw";
  await page.type(passwordInput, process.env.NAVER_PW, {
    delay: randomInt(50, 100),
  });

  await page.waitForTimeout(500);
  const loginButton = "button.btn_check";
  await page.click(loginButton);

  await page.waitForNetworkIdle();
  await page.click("button.btn_white");
};

const MY_CARD_LIST = {
  japanese: "https://learn.dict.naver.com/wordbook/jakodict/#/my",
  english: "https://learn.dict.naver.com/wordbook/enkodict/#/my",
};

const selectLanguage = async (page) => {
  const language = await select({
    message: "어떤 언어의 단어장을 다운로드 하시겠습니까?",
    choices: [
      { name: "일본어", value: "japanese" },
      { name: "영어", value: "english" },
    ],
  });

  await page.goto(MY_CARD_LIST[language]);

  return language;
};

export const getHeaders = async () => {
  const browser = await puppeteer.launch({ headless: "new", timeout: 3000 });
  const page = await browser.newPage();

  const language = await selectLanguage(page);

  await login(page);
  await page.waitForNetworkIdle();
  const cookies = await page.cookies();
  await browser.close();

  const headers = {
    Cookie: cookies
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; "),
    Accept: "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "en-US,en;q=0.9,ko;q=0.8",
    "Cache-Control": "no-cache",
    "Sec-Ch-Ua": '"Chromium";v="131", "Not_A Brand";v="24"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"macOS"',
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "X-Requested-With": "XMLHttpRequest",
    Referer: `https://learn.dict.naver.com/wordbook/${
      language === "japanese" ? "jakodict" : "enkodict"
    }`,
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  };
  return headers;
};
