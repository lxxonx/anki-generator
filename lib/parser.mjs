export const parenthesisToRuby = (str) => {
  return str.replace(
    /([\u4E00-\u9FFF]+)\(([\u3040-\u309F]+)\)/g,
    function (match, kanji, hiragana) {
      return (
        "<ruby>" + "<rb>" + kanji + "</rb>" + "<rt>" + hiragana + "</rt></ruby>"
      );
    }
  );
};

export const parseOutput = (array) => {
  let res = "";
  for (let { written, reading, meaning } of array) {
    meaning = parenthesisToRuby(meaning);
    res += `${written}\t${reading}\t${meaning}\n`;
  }
  return res;
};
