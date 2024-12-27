import { checkbox } from "@inquirer/prompts";
import axios from "axios";
import { Spinner } from "cli-spinner";
import fs from "fs";
import { getHeaders } from "./login.mjs";
import { parseJapaneseOutput } from "./parser.mjs";

const getWords = async (headers, wordBook) => {
  const response = await axios.get(
    "https://learn.dict.naver.com/gateway-api/jakodict/mywordbook/word/list/search",
    {
      headers,
      params: {
        wbId: wordBook.id,
        qt: 0,
        st: 0,
        page: 1,
        page_size: wordBook.wordCount,
        domain: "naver",
      },
    }
  );

  return response.data.data.m_items;
};

const getWordBookList = async (headers) => {
  const response = await axios.get(
    "https://learn.dict.naver.com/gateway-api/jakodict/mywordbook/wordbook/list.dict",
    { headers, params: { page: 1, page_size: 100, st: 0, domain: "naver" } }
  );
  return response.data.data.m_items;
};

export const downloader = async () => {
  const headers = await getHeaders();

  const wordBookList = await getWordBookList(headers);
  const wordBooks = await checkbox({
    message: "다운로드할 단어장들을 선택해주세요.",
    choices: wordBookList.map((wordBook) => ({
      name: wordBook.name,
      value: wordBook,
    })),
  });

  const spinner = new Spinner("Downloading.. %s");
  spinner.setSpinnerString(19);
  spinner.start();
  const downloadResult = await Promise.all(
    wordBooks.map(async (wordBook) => {
      const words = await getWords(headers, wordBook);
      return words;
    })
  );

  const mergedResult = [];
  for (let result of downloadResult) {
    mergedResult.push(...result);
  }

  const parsedResult = parseJapaneseOutput(mergedResult);

  fs.writeFileSync("downloadResult.txt", parsedResult);

  spinner.stop(true);
};
