

// 计算字符宽度
function getCharWidth(char) {
  const codePoint = char.codePointAt(0);

  // ASCII 和一般西方字符（单宽）
  if (codePoint <= 0x007F) {
    return 1;
  }

  // CJK 统一表意字符 (中日韩)
  if (
    (codePoint >= 0x1100 && codePoint <= 0x115F) ||  // Hangul Jamo 初始
    (codePoint >= 0x2E80 && codePoint <= 0xA4CF) ||  // CJK 及其扩展
    (codePoint >= 0xAC00 && codePoint <= 0xD7A3) ||  // Hangul Syllables
    (codePoint >= 0xF900 && codePoint <= 0xFAFF) ||  // CJK 兼容表意字符
    (codePoint >= 0xFE10 && codePoint <= 0xFE19) ||  // 竖排标点符号
    (codePoint >= 0xFE30 && codePoint <= 0xFE6F) ||  // CJK 兼容形式
    (codePoint >= 0xFF00 && codePoint <= 0xFF60) ||  // 全角ASCII & 半角片假名
    (codePoint >= 0xFFE0 && codePoint <= 0xFFE6)     // 全角符号
  ) {
    return 2;
  }

  // Emoji 一般占 2 个字符宽度
  if (
    (codePoint >= 0x1F300 && codePoint <= 0x1FAD6) ||  // Emoji 及其他符号
    (codePoint >= 0x1F600 && codePoint <= 0x1F64F) ||  // 表情符号
    (codePoint >= 0x1F900 && codePoint <= 0x1F9FF)     // 追加表情
  ) {
    return 2;
  }

  // 其他默认占 1
  return 1;
}

// 计算字符串宽度
function getStringWidth(str) {
  return [...str].reduce((width, char) => width + getCharWidth(char), 0);
}


// 返回光标的位置
function adjustCursorPosition(str, currentCol) {
  if (currentCol <= 0) return 0;
  let charCount = 0;
  let i = 0;

  while (i <= str.length) {
    if (i >= currentCol) {
      break;
    }
    let char = str[i];
    if (getCharWidth(char) == 2) {
      charCount += 2;
    } else {
      charCount += 1;
    }
    i++;
  }
  return charCount;
}


module.exports = { getCharWidth, getStringWidth, adjustCursorPosition };