export const parseOutput = (array) => {
  let res = "";
  for (const { written, reading, meaning } of array) {
    res += `${written}\t${reading}\t${meaning}\n`;
  }
  return res;
};

export const parseInput = (input) => {};
