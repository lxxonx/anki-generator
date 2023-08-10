#! /usr/bin/env node
import { downloader } from "./lib/downloader.mjs";
import { input, password, confirm } from "@inquirer/prompts";
import fs from "fs";

const config = async () => {
  let config = {};
  try {
    const input = fs.readFileSync("./config.json", "utf8");
    config = JSON.parse(input);
  } catch (e) {
    if (e.code === "ENOENT") {
      console.log("config.json 파일이 없습니다. 아래 정보를 입력해주세요.");
      config.naver_id = await input({
        message: "네이버 아이디를 입력해주세요.",
      });
      config.naver_password = await password({
        message: "네이버 비밀번호를 입력해주세요.",
      });
      const wannaSave = await confirm({
        message: "입력한 정보를 저장하시겠습니까?",
      });

      if (wannaSave) {
        fs.writeFileSync("./config.json", JSON.stringify(config), "utf8");
      }
    } else {
      throw e;
    }
  }
  process.env.NAVER_ID = config.naver_id;
  process.env.NAVER_PW = config.naver_password;
};

config();

const run = async () => {
  await downloader();
};

run();
