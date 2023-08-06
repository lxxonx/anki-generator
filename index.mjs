import { NoInputFileError } from "./common/errors.mjs";
import { downloader } from "./lib/downloader.mjs";

const run = async () => {
  const wordListFile = process.argv[2];
  if (!wordListFile) throw new NoInputFileError();
  await downloader(wordListFile);
};

run();
