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

export const parseJapaneseOutput = (items) => {
  let res = "";
  for (const item of items) {
    const content = JSON.parse(item.content);
    const { members, means } = content.entry;
    let kakikata = members[0].kanji;
    if (!kakikata) {
      kakikata = members[0].entry_name;
    }

    const yomikata = members[0].entry_name;
    let exampleReplace = "";
    if (kakikata != yomikata) {
      exampleReplace = "<ruby>" + kakikata + "<rt>" + yomikata + "</rt></ruby>";
    } else {
      exampleReplace = kakikata;
    }
    const meanings = parseMeaning(means, exampleReplace).replace(/\n/g, "");

    res += `${kakikata}\t${yomikata}\t${meanings}\n`;
  }
  return res;
};

export const parseMeaning = (means, kakikata) => {
  let res = "<ul class='item_mean'>";
  for (let i = 0; i < means.length; i++) {
    const { part_name, show_mean } = means[i];
    res += `<li class='item_mean'>
    <div class='mean_desc'>
      <span class='num'>${i + 1}</span>
      <p class='cont'>
        <em class='part_speech'>${part_name}</em>
        ${parenthesisToRuby(show_mean).replace("～", kakikata)}
      </p>
    </div>
    <ul class='example'>
      ${means[i].examples
        .map(
          (example) =>
            `<li class='example_item'>
              <p class='origin' lang='${example.language}'>
                ${parenthesisToRuby(example.show_example)}
              </p>
              <p class='translate' lang='ko'>
                ${example.translations
                  .map(
                    (translation) =>
                      `<span class='trans'>${translation.show_translation}</span>`
                  )
                  .join("")}
              </p>
            </li>`
        )
        .join("")}
    </ul>
    </li>`;
  }
  res += "</ul>";
  return res;
};
