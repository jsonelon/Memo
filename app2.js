const { getCharWidth, getStringWidth, adjustCursorPosition, } = require('./utils');



// 创建一个请求,把字符串发送到服务器
const http = require('http');


function sendText(text) {
  const encodedText = encodeURIComponent(text);
  const req = http.request(`http://localhost:3000?${encodedText}`, (res) => {
  });
  // 发送请求
  req.end();
}



class ConsoleEditor {
  constructor(text) {
    this.text = text;  // 输入文本

    this.isInput = true;  // 是否正在输入

    this.firstCommand = '';  // 第一个命令
    this.firstCommandTime = 0;  // 第一个命令时间

    this.currentRow = 0;  // 当前行

    // 这里按字符计算,用光标不准确,因为光标是按字符宽度计算的
    this.currentCol = 0;  // 当前列

    this.cursorRow = 0;  // 光标在控制台中行位置
    this.cursorCol = 0;  // 光标在控制台中列位置


    this.cursorIndex = text.length;  // 光标在文本中的位置（按字符计算）
    this.consoleHeight = process.stdout.rows;  // 控制台行高
    this.consoleWidth = process.stdout.columns;  // 控制台列宽

    this.startRenderRow = 0 // 当前显示的起始行,滚动思维显示文本

    this.render();
  }




  render() {
    process.stdout.write('\x1Bc') // 清空控制台


    let lines = this.text.split('\n')

    let sumRow = 0 // 记录渲染的字符宽度,因为当一行显示不下时,会换行显示,所以一行会占用多行

    // 渲染不能超过控制台高度的文本,有一个全局的值记录起始位置
    for (let stdoutRowsIndex = 0; stdoutRowsIndex < process.stdout.rows; stdoutRowsIndex++) {

      // 渲染不能超过控制台高度的文本,有一个全局的值记录起始位置
      if (this.startRenderRow + stdoutRowsIndex >= lines.length) {
        break;
      }


      let line = lines[this.startRenderRow + stdoutRowsIndex]

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

    // for (let index = 0; index < this.lines.length; index++) {
    //   process.stdout.write(this.lines[index]);
    //   if (index < process.stdout.rows - 1) {
    //     process.stdout.write('\n');
    //   }
    // }

    // console.log(this.currentCol, this.currentRow);



    // process.stdout.write('\n\n\n\n\n');
    // process.stdout.write(`currentRow: ${process.stdout.rows}, currentCol: ${process.stdout.columns}\n`);
    // process.stdout.write(`cursorRow: ${this.cursorRow}, cursorCol: ${this.cursorCol}\n`);

    process.stdout.cursorTo(this.cursorCol, this.cursorRow);


  }

  // 处理按键输入
  handleInput(key) {
    let lines = this.text.split('\n')

    key = key + ""
    if (key === '\u001b[A') {  // 向上箭头
      this.cursorRow--
      if (this.cursorRow < 0) {
        this.cursorRow = 0
        this.startRenderRow--
        if (this.startRenderRow < 0) {
          this.startRenderRow = 0
        }
      }


      // 处理当前列超出行长度的情况
      let line = lines[this.startRenderRow + this.cursorRow]
      if (this.currentCol > line.length) {
        this.currentCol = line.length
      }

      this.cursorCol = adjustCursorPosition(line, this.currentCol)

    } else if (key === '\u001b[B') {  // 向下箭头

      let downLine = lines[this.startRenderRow + this.cursorRow + 1]
      if (downLine == undefined) {
        return
      }
      this.cursorRow++

      if (this.cursorRow >= process.stdout.rows) {
        this.cursorRow = process.stdout.rows - 1
        // 计算最后起始行位置,避免太多空行
        this.startRenderRow++
        let sumRow = 0
        // 计算最后起始行位置
        for (let index = 0; index < process.stdout.rows; index++) {
          // 避免报错
          if (this.startRenderRow + index >= lines.length) {
            this.startRenderRow--
            break;
          }

          // 避免报错
          let line = lines[this.startRenderRow + index]
          let width = getStringWidth(line)
          sumRow += Math.ceil(width / process.stdout.columns)

          if (sumRow > process.stdout.rows) {
            this.startRenderRow--
            break;
          }
        }
      }


      // 处理当前列超出行长度的情况
      let line = lines[this.startRenderRow + this.cursorRow]
      if (line != undefined) {
        if (this.currentCol > line.length) {
          this.currentCol = line.length
        }
        this.cursorCol = adjustCursorPosition(line, this.currentCol)
      }



    } else if (key === '\u001b[C') {  // 向右箭头

      // 先判断右边的字符占位宽度,确定this.cursorCol移动一位还是两位
      let line = lines[this.startRenderRow + this.cursorRow]
      let char = line[this.currentCol]
      if (!char) {
        return
      }

      this.currentCol++

      if (this.currentCol > line.length) {
        this.currentCol = line.length
      }


      this.cursorCol = adjustCursorPosition(line, this.currentCol)
      sendText(char)

      // if (this.cursorCol >= process.stdout.columns) {
      //   this.cursorCol = process.stdout.columns - 1
      // }


    } else if (key === '\u001b[D') {  // 向左箭头

      // 先判断左边的字符占位宽度,确定this.cursorCol移动一位还是两位
      let line = lines[this.startRenderRow + this.cursorRow]
      let char = line[this.currentCol - 1]

      if (!char) {
        return
      }
      sendText(char)

      // let width = getCharWidth(char)
      // if (width == 2) {
      //   this.cursorCol -= 2
      // } else {
      //   this.cursorCol--
      // }

      this.currentCol--
      if (this.currentCol < 0) {
        this.currentCol = 0
      }
      this.cursorCol = adjustCursorPosition(line, this.currentCol)
    } else if (key === '\u0003') {  // Ctrl+C
      this.finishEditing()
    } else if (key === '\u0008') { // 退格键
      let line = lines[this.startRenderRow + this.cursorRow]
      if (this.currentCol > 0) {
        let newStr = line.slice(0, this.currentCol - 1) + line.slice(this.currentCol);
        lines[this.startRenderRow + this.cursorRow] = newStr
        this.currentCol--;
        this.cursorCol = adjustCursorPosition(line, this.currentCol)
      } else { // 删除上一行换行符
        let upLine = lines[this.startRenderRow + this.cursorRow - 1]
        if (upLine != undefined) {
          // 合并两行
          let newStr = upLine + lines[this.startRenderRow + this.cursorRow]
          lines[this.startRenderRow + this.cursorRow - 1] = newStr
          lines.splice(this.startRenderRow + this.cursorRow, 1)


          this.currentCol = upLine.length
          this.cursorCol = adjustCursorPosition(upLine, this.currentCol)

          if (this.cursorRow == 0) {
            this.startRenderRow--
          } else {
            this.cursorRow--
          }
        }
      }
      this.text = lines.join('\n')
    } else if (key === '\u001b[3~') { // Delete 键
      let line = lines[this.startRenderRow + this.cursorRow]
      if (this.currentCol < line.length) {
        let newStr = line.slice(0, this.currentCol) + line.slice(this.currentCol + 1);
        lines[this.startRenderRow + this.cursorRow] = newStr
      } else { // 删除下一行换行符
        let nextLine = lines[this.startRenderRow + this.cursorRow + 1]
        if (nextLine != undefined) {
          // 合并两行
          let newStr = line + nextLine
          lines[this.startRenderRow + this.cursorRow] = newStr
          lines.splice(this.startRenderRow + this.cursorRow + 1, 1)
        }
      }
      this.text = lines.join('\n')
    } else if (key === '\r') { // 回车键
      let line = lines[this.startRenderRow + this.cursorRow]
      // let newStr = line.slice(0, this.currentCol) + '\n' + line.slice(this.currentCol);
      lines[this.startRenderRow + this.cursorRow] = line.slice(0, this.currentCol)
      // lines在当前行插入一个空行
      lines.splice(this.startRenderRow + this.cursorRow + 1, 0, line.slice(this.currentCol))
      // 写入到text
      this.text = lines.join('\n')
      this.currentCol = 0
      this.cursorCol = 0

      // 最后一行,滚动显示
      if (this.cursorRow == process.stdout.rows - 1) {
        this.startRenderRow++
      } else {
        this.cursorRow++
      }
    } else if (key === '\u001b[1~') { // home键
      this.currentCol = 0
      this.cursorCol = 0
    } else if (key === '\u001b[4~') { // home键
      let line = lines[this.startRenderRow + this.cursorRow]
      if (line != undefined) {
        this.currentCol = line.length
        this.cursorCol = adjustCursorPosition(line, this.currentCol)
      }
    } else if (key === '\u001b') { // esc键
      this.isInput = false
    } else { // 输入字符
      // 不是编辑状态,获取输入指令
      if (!this.isInput) {

        let now = Date.now()
        if (now - this.firstCommandTime > 50) {
          this.firstCommand = ''
        }

        this.firstCommandTime = now
        let command = this.firstCommand + key
        this.firstCommand += key

        if (command == 'i') {
          this.isInput = true
        } else if (command == 'q') {
          this.finishEditing()
        } else if (command == 'd') { // 删除当前行
          let line = lines[this.startRenderRow + this.cursorRow]
          if (line != undefined) {
            lines.splice(this.startRenderRow + this.cursorRow, 1)
            this.text = lines.join('\n')
            if (lines[this.startRenderRow + this.cursorRow] == undefined) {
              this.cursorRow--
              if (this.cursorRow < 0) {
                this.cursorRow = 0
                this.startRenderRow = 0
                this.cursorCol = 0
                this.currentCol = 0
              }

            } else {
              // 处理当前列超出行长度的情况
              let line = lines[this.startRenderRow + this.cursorRow]
              if (line != undefined) {
                if (this.currentCol > line.length) {
                  this.currentCol = line.length
                }
                this.cursorCol = adjustCursorPosition(line, this.currentCol)
              }
            }
          }
        }

      } else { // 编辑状态,输入字符
        let rows = this.startRenderRow + this.cursorRow
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
          let start = this.text.slice(0, countWidth + this.currentCol);
          let end = this.text.slice(countWidth + this.currentCol);
          let newText = start + key + end;
          this.text = newText;

          // 移动光标
          if (this.cursorRow + count < process.stdout.rows) {
            this.cursorRow += count;
          } else {
            let sumRow = this.cursorRow + count - process.stdout.rows;
            this.startRenderRow += sumRow + 1;
            this.cursorRow = process.stdout.rows - 1;
          }

          // 当前列是粘贴的最后一列
          let lastLine = key.split('\n').pop();
          this.currentCol = lastLine.length;
          this.cursorCol = adjustCursorPosition(lastLine, this.currentCol);
        } else {
          let line = lines[this.startRenderRow + this.cursorRow]
          sendText(line)
          let newStr = line.slice(0, this.currentCol) + key + line.slice(this.currentCol);
          lines[this.startRenderRow + this.cursorRow] = newStr
          this.text = lines.join('\n')
          this.currentCol += key.length;
          this.cursorCol = adjustCursorPosition(lines[this.startRenderRow + this.cursorRow], this.currentCol);
        }
      }
    }
    this.render();
  }

  async finishEditing() {
    // process.stdout.write('\x1Bc')
    // process.stdin.removeListener('data', this.handleInput);
    // process.stdout.removeListener('resize', this.render);

    return new Promise((resolve) => {
      resolve(this.text);
    });
  }
}

// // 初始化文本数据
// const text = ``;
// // 启动编辑器
// const editor = new ConsoleEditor(text);



const editor = new ConsoleEditor("text")

let finalText = await editor.finishEditing()
console.log("Final text:", finalText);

process.stdin.setRawMode(true);
process.stdin.resume();

// 捕获按键事件
process.stdin.on('data', (key) => {
  editor.handleInput(key);
});
// 监听控制台尺寸变化
process.stdout.on('resize', () => {
  editor.render
});

// module.exports = { ConsoleEditor }