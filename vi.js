const { getCharWidth, getStringWidth, adjustCursorPosition, } = require('./utils');

const vi = {
  /**
   * 
   * @param {} title 
   * @returns inputTxt
   * @example
   * const { inputTxt } = require('node_vi')
   * async function main() {
   *  let text = await inputTxt('title')
   *  console.log(text)
   * }  
   * main()
   */
  async inputTxtMultiLine(title, text) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdout.write(`----ESC键结束输入----\n${title}\n--------------------\n`);

    let row = 0;
    let col = 0;

    let lines = text ? text.split('\n') : [];
    for (let i = 0; i < lines.length; i++) {
      process.stdout.write(lines[i] + '\n');
      row++
      // if (i < lines.length - 1) {
      //   process.stdout.write('\n');
      // }
    }
    return new Promise(resolve => {
      const onData = (char) => {
        char = char + "";
        switch (char) {
          case "\n":
          case "\r":
            row++;
            col = 0;
            lines.splice(row, 0, '');
            // lines插入一个空字符串,重新渲染lines剩下的,光标回到row
            for (let i = row; i < lines.length; i++) {
              process.stdout.write('\n');
              process.stdout.write(lines[i]);
            }
            process.stdout.moveCursor(0, -(lines.length - 1 - row));
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
            break;
          case "\u001b": // Esc 键
            process.stdin.setRawMode(true);
            process.stdin.pause();
            process.stdin.removeListener('data', onData);
            process.stdout.write('\u001B[2J\u001B[0;0f');
            resolve(lines.join('\n')); // 表示输入被取消
            break;
          case "\u0004": // Ctrl + D
            process.exit(0);
          case "\u0003": // Ctrl + C
            process.exit(0);
          case "\u001b[A": // Up arrow
            if (row > 0) {
              row--;
              process.stdout.moveCursor(0, -1);
              if (col > lines[row].length) {
                col = lines[row].length
                process.stdout.cursorTo(0);
                process.stdout.moveCursor(col, 0);
              }
            }
            break;
          case '\u001b[B': // Up arrow
            if (row < lines.length - 1) {
              row++;
              process.stdout.moveCursor(0, 1);
              if (col > lines[row].length) {
                col = lines[row].length
                process.stdout.cursorTo(0);
                process.stdout.moveCursor(col, 0);
              }
            }
            break;
          case '\u001b[D': // Up arrow
            if (col > 0) {
              col--;
              process.stdout.moveCursor(-1, 0);
            }
            break;
          case '\u001b[C': // Up arrow
            if (col < lines[row].length) {
              col++;
              process.stdout.moveCursor(1, 0);
            }
            break;
          case "\u0008": // 退格键
          case "\u007f": // Delete 键
            if (lines[row].length > 0) {
              let newStr = lines[row].slice(0, col - 1) + lines[row].slice(col);
              lines[row] = newStr
              col--;
              process.stdout.clearLine(0);
              process.stdout.cursorTo(0);
              process.stdout.write(lines[row]);
            }
            break;
          default:
            if (char.includes('\r')) {
              let arr = char.split('\r');
              for (let i = 0; i < arr.length; i++) {
                if (i == 0) {
                  lines[row] = lines[row] ? lines[row] += arr[i] : arr[i];
                } else {
                  lines.splice(row, 0, '');
                  lines[row] = lines[row] ? lines[row] += arr[i] : arr[i];
                  for (let i = row; i < lines.length; i++) {
                    process.stdout.write('\n');
                    process.stdout.write(lines[i]);
                  }
                  process.stdout.moveCursor(0, -(lines.length - 1 - row));
                  process.stdout.clearLine(0);
                  process.stdout.cursorTo(0);
                }

                col = lines[row].length;
                process.stdout.clearLine(row);
                process.stdout.cursorTo(0);
                process.stdout.write(lines[row]);
                if (i < arr.length - 1) {
                  row++;
                }

              }
            } else {
              let tempCol = col + 1;
              if (!!lines[row]) {
                let arr = lines[row].split('');
                arr.splice(col, 0, char);
                lines[row] = arr.join('');
              } else {
                lines[row] = char;
              }
              col = lines[row].length;
              process.stdout.clearLine(row);
              process.stdout.cursorTo(0);
              process.stdout.write(lines[row]);
              if (col > tempCol) {
                process.stdout.moveCursor(-(col - tempCol), 0);
              }
            }
            break;
        }
      };
      process.stdin.on('data', onData);
    });
  },

  /**
   * 
   * @param {*} title 
   * @param {*} isPwd 
   * @returns inputTxt
   * @example
   * const { inputTxt } = require('node_vi')
   * async function main() {
   *  let text = await inputTxt('title')
   *  console.log(text)
   * }
   * main()
   */
  async inputTxtLine(title, isPwd) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdout.write('\x1Bc') // 清空控制台
    process.stdout.write(`----(Enter End): ----\n${title}`);
    let password = '';
    return new Promise(resolve => {
      const onData = (char => {
        char = char + "";
        switch (char) {
          case "\n":
          case "\r":
          case "\u0004":
            process.stdin.setRawMode(true);
            process.stdin.pause();
            process.stdin.removeListener('data', onData);
            // process.stdout.write('\u001B[2J\u001B[0;0f');
            process.stdout.write('\n');
            resolve(password)
            break;
          case "\u0004": // Ctrl + D
            process.stdout.write('exit\n');
            process.exit(0);
          case "\u0003": // Ctrl + C
            process.stdout.write('exit\n');
            process.exit(0);
          case "\u001b": // Esc 
            process.stdout.write('exit\n');
            process.exit(0)
          case "\u0008":
          case "\u007f": // Backspace 
            if (password.length > 0) {
              password = password.slice(0, -1);
              if (!isPwd) {
                process.stdout.write('\b \b');
              }
            }
            break;
          default:
            password += char;
            if (!isPwd) {
              process.stdout.write(`${char}`);
            }
            break;
        }

      });
      process.stdin.on('data', onData);
    })
  },


  async consoleEditor(str) {
    let text = str
    let isInput = true;  // 是否正在输入

    let firstCommand = '';  // 第一个命令
    let firstCommandTime = 0;  // 第一个命令时间

    // 这里按字符计算,用光标不准确,因为光标是按字符宽度计算的
    let currentCol = 0;  // 当前列

    let cursorRow = 0;  // 光标在控制台中行位置
    let cursorCol = 0;  // 光标在控制台中列位置



    let startRenderRow = 0 // 当前显示的起始行,滚动思维显示文本

    process.stdin.setRawMode(true);
    process.stdin.resume();


    render()

    function render() {
      process.stdout.write('\x1Bc') // 清空控制台


      let lines = text.split('\n')

      let sumRow = 0 // 记录渲染的字符宽度,因为当一行显示不下时,会换行显示,所以一行会占用多行

      // 渲染不能超过控制台高度的文本,有一个全局的值记录起始位置
      for (let stdoutRowsIndex = 0; stdoutRowsIndex < process.stdout.rows; stdoutRowsIndex++) {

        // 渲染不能超过控制台高度的文本,有一个全局的值记录起始位置
        if (startRenderRow + stdoutRowsIndex >= lines.length) {
          break;
        }


        let line = lines[startRenderRow + stdoutRowsIndex]

        let width = getStringWidth(line)

        sumRow += Math.ceil(width / process.stdout.columns)

        if (sumRow > process.stdout.rows) {
          break;
        }

        process.stdout.write(line);
        if (stdoutRowsIndex < process.stdout.rows - 1) {
          process.stdout.write('\n');
        }
      }
      process.stdout.cursorTo(cursorCol, cursorRow);
    }

    function handleInput(key, resolve) {
      let lines = text.split('\n')

      key = key + ""
      if (key === '\u001b[A') {  // 向上箭头
        cursorRow--
        if (cursorRow < 0) {
          cursorRow = 0
          startRenderRow--
          if (startRenderRow < 0) {
            startRenderRow = 0
          }
        }


        // 处理当前列超出行长度的情况
        let line = lines[startRenderRow + cursorRow]
        if (currentCol > line.length) {
          currentCol = line.length
        }

        cursorCol = adjustCursorPosition(line, currentCol)

      } else if (key === '\u001b[B') {  // 向下箭头

        let downLine = lines[startRenderRow + cursorRow + 1]
        if (downLine == undefined) {
          return
        }
        cursorRow++

        if (cursorRow >= process.stdout.rows) {
          cursorRow = process.stdout.rows - 1
          // 计算最后起始行位置,避免太多空行
          startRenderRow++
          let sumRow = 0
          // 计算最后起始行位置
          for (let index = 0; index < process.stdout.rows; index++) {
            // 避免报错
            if (startRenderRow + index >= lines.length) {
              startRenderRow--
              break;
            }

            // 避免报错
            let line = lines[startRenderRow + index]
            let width = getStringWidth(line)
            sumRow += Math.ceil(width / process.stdout.columns)

            if (sumRow > process.stdout.rows) {
              startRenderRow--
              break;
            }
          }
        }


        // 处理当前列超出行长度的情况
        let line = lines[startRenderRow + cursorRow]
        if (line != undefined) {
          if (currentCol > line.length) {
            currentCol = line.length
          }
          cursorCol = adjustCursorPosition(line, currentCol)
        }



      } else if (key === '\u001b[C') {  // 向右箭头

        // 先判断右边的字符占位宽度,确定cursorCol移动一位还是两位
        let line = lines[startRenderRow + cursorRow]
        let char = line[currentCol]
        if (!char) {
          return
        }

        currentCol++

        if (currentCol > line.length) {
          currentCol = line.length
        }


        cursorCol = adjustCursorPosition(line, currentCol)


      } else if (key === '\u001b[D') {  // 向左箭头

        // 先判断左边的字符占位宽度,确定cursorCol移动一位还是两位
        let line = lines[startRenderRow + cursorRow]
        let char = line[currentCol - 1]

        if (!char) {
          return
        }

        currentCol--
        if (currentCol < 0) {
          currentCol = 0
        }
        cursorCol = adjustCursorPosition(line, currentCol)
      } else if (key === '\u0003') {  // Ctrl+C
        process.stdin.pause();
        process.stdout.write('\x1Bc')
        process.stdin.removeListener('data', handleInput);
        resolve(JSON.stringify({
          save: false
        }))
      } else if (key === '\u0008') { // 退格键
        let line = lines[startRenderRow + cursorRow]
        if (currentCol > 0) {
          let newStr = line.slice(0, currentCol - 1) + line.slice(currentCol);
          lines[startRenderRow + cursorRow] = newStr
          currentCol--;
          cursorCol = adjustCursorPosition(line, currentCol)
        } else { // 删除上一行换行符
          let upLine = lines[startRenderRow + cursorRow - 1]
          if (upLine != undefined) {
            // 合并两行
            let newStr = upLine + lines[startRenderRow + cursorRow]
            lines[startRenderRow + cursorRow - 1] = newStr
            lines.splice(startRenderRow + cursorRow, 1)


            currentCol = upLine.length
            cursorCol = adjustCursorPosition(upLine, currentCol)

            if (cursorRow == 0) {
              startRenderRow--
            } else {
              cursorRow--
            }
          }
        }
        text = lines.join('\n')
      } else if (key === '\u001b[3~') { // Delete 键
        let line = lines[startRenderRow + cursorRow]
        if (currentCol < line.length) {
          let newStr = line.slice(0, currentCol) + line.slice(currentCol + 1);
          lines[startRenderRow + cursorRow] = newStr
        } else { // 删除下一行换行符
          let nextLine = lines[startRenderRow + cursorRow + 1]
          if (nextLine != undefined) {
            // 合并两行
            let newStr = line + nextLine
            lines[startRenderRow + cursorRow] = newStr
            lines.splice(startRenderRow + cursorRow + 1, 1)
          }
        }
        text = lines.join('\n')
      } else if (key === '\r') { // 回车键
        let line = lines[startRenderRow + cursorRow]
        // let newStr = line.slice(0, currentCol) + '\n' + line.slice(currentCol);
        lines[startRenderRow + cursorRow] = line.slice(0, currentCol)
        // lines在当前行插入一个空行
        lines.splice(startRenderRow + cursorRow + 1, 0, line.slice(currentCol))
        // 写入到text
        text = lines.join('\n')
        currentCol = 0
        cursorCol = 0

        // 最后一行,滚动显示
        if (cursorRow == process.stdout.rows - 1) {
          startRenderRow++
        } else {
          cursorRow++
        }
      } else if (key === '\u001b[1~') { // home键
        currentCol = 0
        cursorCol = 0
      } else if (key === '\u001b[4~') { // end键
        let line = lines[startRenderRow + cursorRow]
        if (line != undefined) {
          currentCol = line.length
          cursorCol = adjustCursorPosition(line, currentCol)
        }
      } else if (key === '\u001b') { // esc键
        isInput = false
      } else { // 输入字符
        // 不是编辑状态,获取输入指令
        if (!isInput) {

          let now = Date.now()
          if (now - firstCommandTime > 50) {
            firstCommand = ''
          }

          firstCommandTime = now
          let command = firstCommand + key
          firstCommand += key

          if (command == 'i') {
            isInput = true
          } else if (command == 'q') {
            process.stdin.pause();
            process.stdout.write('\x1Bc')
            process.stdin.removeListener('data', handleInput);
            resolve(JSON.stringify({
              text: text,
              save: true
            }))
          } else if (command == 'd') { // 删除当前行
            let line = lines[startRenderRow + cursorRow]
            if (line != undefined) {
              lines.splice(startRenderRow + cursorRow, 1)
              text = lines.join('\n')
              if (lines[startRenderRow + cursorRow] == undefined) {
                cursorRow--
                if (cursorRow < 0) {
                  cursorRow = 0
                  startRenderRow = 0
                  cursorCol = 0
                  currentCol = 0
                }

              } else {
                // 处理当前列超出行长度的情况
                let line = lines[startRenderRow + cursorRow]
                if (line != undefined) {
                  if (currentCol > line.length) {
                    currentCol = line.length
                  }
                  cursorCol = adjustCursorPosition(line, currentCol)
                }
              }
            }
          }

        } else { // 编辑状态,输入字符
          let rows = startRenderRow + cursorRow
          let countWidth = 0; // 计算当前要插入的位置行
          for (let i = 0; i < rows; i++) {
            countWidth += lines[i].length + 1;
          }


          key = key.replace(/\r/g, '\n'); // 替换回车符
          // 统计换行符数量
          let count = 0
          for (let i = 0; i < key.length; i++) {
            if (key[i] == '\n') {
              count++
            }
          }

          if (count != 0) {
            let start = text.slice(0, countWidth + currentCol);
            let end = text.slice(countWidth + currentCol);
            let newText = start + key + end;
            text = newText;

            // 移动光标
            if (cursorRow + count < process.stdout.rows) {
              cursorRow += count;
            } else {
              let sumRow = cursorRow + count - process.stdout.rows;
              startRenderRow += sumRow + 1;
              cursorRow = process.stdout.rows - 1;
            }

            // 当前列是粘贴的最后一列
            let lastLine = key.split('\n').pop();
            currentCol = lastLine.length;
            cursorCol = adjustCursorPosition(lastLine, currentCol);
          } else {
            let line = lines[startRenderRow + cursorRow]
            let newStr = line.slice(0, currentCol) + key + line.slice(currentCol);
            lines[startRenderRow + cursorRow] = newStr
            text = lines.join('\n')
            currentCol += key.length;
            cursorCol = adjustCursorPosition(lines[startRenderRow + cursorRow], currentCol);
          }
        }
      }
      render();
    }



    return new Promise(resolve => {
      // 捕获按键事件
      process.stdin.on('data', (key) => {
        handleInput(key, resolve);
      });
      // 监听控制台尺寸变化
      process.stdout.on('resize', () => {
        render()
      });

    })

  }

}

module.exports = vi;