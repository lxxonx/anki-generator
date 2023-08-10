import puppeteer from "puppeteer";
import { parseOutput } from "./parser.mjs";
import fs from "fs";
import { select } from "@inquirer/prompts";
import { Spinner } from "cli-spinner";

const MY_CARD_LIST = {
  japanese: "https://learn.dict.naver.com/wordbook/jakodict/#/my/cards",
  english: "https://learn.dict.naver.com/wordbook/enkodict/#/my/cards",
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
};

const login = async (page) => {
  const usernameInput = "input#id";
  await page.type(usernameInput, process.env.NAVER_ID, { delay: 100 });

  await page.waitForTimeout(1000);
  const passwordInput = "input#pw";
  await page.type(passwordInput, process.env.NAVER_PW, { delay: 100 });

  await page.waitForTimeout(1000);
  const loginButton = "button.btn_check";
  await page.click(loginButton);

  await page.waitForNetworkIdle();
  await page.click("button.btn_white");
};

const getWords = async (page) => {
  const words = await page.evaluate(() => {
    const words = [];
    const innerCards = document.querySelectorAll("div.inner_card");
    innerCards.forEach((innerCard) => {
      const wordElement = innerCard.querySelector("a.title");
      let [reading, written] = wordElement.innerText.split("[");
      written = written.replace("]", "");
      reading = reading.trim();
      reading = reading.replaceAll("-", "");
      let meaning =
        "<ul class='item_mean'>" +
        innerCard.querySelector("ul.list_mean").innerHTML +
        "</ul>";
      meaning = meaning.replaceAll("\t", "");
      meaning = meaning.replaceAll("\n", "");
      meaning = meaning.replaceAll("display:none", "");
      words.push({ written, reading, meaning });
    });
    return words;
  });

  return words;
};

const getNextButtonStatus = async (page) => {
  const nextButtonSelector = "button.btn_next";
  const nextButton = await page.$(nextButtonSelector);
  const isNextButtonDisabled = await page.evaluate(
    (nextButton) => nextButton.disabled,
    nextButton
  );
  return isNextButtonDisabled;
};

export const downloader = async () => {
  const browser = await puppeteer.launch({ headless: "new", timeout: 3000 });
  const page = await browser.newPage();

  await selectLanguage(page);

  const spinner = new Spinner("Downloading.. %s");
  spinner.setSpinnerString(19);
  spinner.start();
  await login(page);
  await page.waitForNetworkIdle();

  const words = [];

  words.push(...(await getWords(page)));

  const nextButtonSelector = "button.btn_next";
  const nextButton = await page.$(nextButtonSelector);
  if (!nextButton) {
    await browser.close();
    spinner.stop(true);
    console.log("단어장에 단어가 없습니다.");
    return;
  }
  let isNextButtonDisabled = await getNextButtonStatus(page);

  while (!isNextButtonDisabled) {
    await page.click(nextButtonSelector);
    await page.waitForNetworkIdle();
    words.push(...(await getWords(page)));
    isNextButtonDisabled = await getNextButtonStatus(page);
  }

  await browser.close();
  const output = parseOutput(words);

  fs.writeFile("output.txt", output, (err) => {
    if (err) throw err;
  });
  spinner.stop(true);
  console.log("다운로드를 완료했습니다. output.txt 파일을 확인해주세요.");
};
