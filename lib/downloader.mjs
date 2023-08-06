import puppeteer from "puppeteer";
import fs from "fs";
import { parseOutput } from "./parser.mjs";

const JAPANESE_SEARCH_URL =
  "https://ja.dict.naver.com/#/search?range=word&query=";

const array = [];
const error = [];

const moveToWordPage = async (page, word) => {
  await page.goto(JAPANESE_SEARCH_URL + word);

  const searchResultSelector =
    ".row .origin > .link + span.unit_listen, .row .origin > .link + .text._kanji";

  await page.waitForSelector(searchResultSelector);
  const linkWithButton = await page.evaluate(() => {
    const linkElement = document.querySelector(
      ".row .origin > .link + span.unit_listen, .row .origin > .link + .text._kanji"
    );

    if (linkElement) {
      return linkElement.parentElement.querySelector("a").href;
    }

    return null;
  });

  await page.goto(linkWithButton);
  await page.waitForNetworkIdle();
  return linkWithButton;
};

const getWord = async (page) => {
  const wordSelector = ".entry_title._guide_lang";
  await page.waitForSelector(wordSelector);
  const word = await page.evaluate(() => {
    const wordElement = document.querySelector(".entry_title._guide_lang");
    let meaningElement = document.querySelector("div.entry_mean_list");
    if (!meaningElement) {
      const p = document.querySelectorAll("div.mean_desc");
      let wl = "";
      for (const i of p) {
        wl += `<div>${i.innerText}</div>`;
        const example = i.parentElement.querySelector(".example_item");
        if (example) {
          const origin = example.querySelector(".origin");
          const ttl = origin.parentElement.querySelector(".unit_listen");
          if (ttl) {
            origin.removeChild(ttl);
          }
          wl += example.innerHTML;
        }
      }
      meaningElement = wl;
    } else {
      let wl = "";
      for (const i of meaningElement.querySelectorAll(".entry_mean_item")) {
        wl += `<div>${i.innerText}</div>`;
      }
      meaningElement = wl;
    }
    return wordElement.innerText + " | " + meaningElement;
  });

  let [w, meaning] = word.split(" | ");
  meaning = meaning.replace(/\n/g, "");
  meaning = meaning.replace(/\t/g, "");

  let [reading, written] = w.split("]")[0].split("[");
  reading = reading.trim().replace(/-/g, "");

  array.push({ reading, written, meaning });
};

const getWords = async (page, fileName) => {
  const txt = fs.readFileSync(fileName, "utf8");
  const a = txt.trim().split("\n");
  const uniqueArr = [...new Set(a)];
  fs.writeFile(fileName, uniqueArr.join("\n"), (err) => {
    if (err) console.log(err);
  });
  for (const word of uniqueArr) {
    let url = "";
    try {
      url = await moveToWordPage(page, word);
      await getWord(page);
    } catch (e) {
      console.log(e);
      await page.screenshot({ path: word + ".png" });
      error.push({ word, url });
    }
  }
};

export const downloader = async (wordListFile) => {
  const browser = await puppeteer.launch({ headless: "new", timeout: 3000 });
  const page = await browser.newPage();

  try {
    await getWords(page, wordListFile);
  } catch (e) {
    console.log(e);
  }

  const text = parseOutput(array);

  fs.writeFile("out.txt", text, (err) => {
    if (err) console.log(err);
  });

  fs.writeFile("error.json", JSON.stringify(error), (err) => {
    if (err) console.log(err);
  });

  await browser.close();
};
