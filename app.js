const crypto = require('crypto');
const { readFileSync, writeFileSync, existsSync } = require('fs');
const { inputTxtMultiLine, inputTxtLine, consoleEditor } = require('./vi')
// const { ConsoleEditor } = require('./app2')


function encrypt(data, password) {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(16);
  const key = crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha512');
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([salt, iv, encrypted, authTag]).toString('base64');
}

const decrypt = (combined, password) => {
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 32);
  const encrypted = combined.slice(32, combined.length - 16);
  const authTag = combined.slice(combined.length - 16);
  const key = crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha512');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted) + decipher.final('utf8');
}



async function main() {
  let file = await inputTxtLine(`File path:`)

  let text = ""
  let me = ""
  if (existsSync(file)) {
    text = readFileSync(file, 'utf8')
    me = await inputTxtLine('input password: ', true)

    if (me != '')
      text = decrypt(Buffer.from(text, 'base64'), me)
  }


  let operate = await inputTxtLine(`1.Edit file\n2.Change password\nInput num: `)
  if (operate == 1) {
    let result = await consoleEditor(text)

    result = JSON.parse(result)

    if (result.save) {
      if (me != '')
        result.text = encrypt(result.text, me)
      writeFileSync(file, result.text, 'utf8');
    }


  } else if (operate == 2) {
    let newPassword = await inputTxtLine('new password: ', true)
    if (newPassword != '') {
      text = encrypt(text, newPassword)
    }
    writeFileSync(file, text, 'utf8');
  } else {
    console.log('Invalid operation')
  }


  // await inputTxtLine(`Press any key to exit...`)
  // console.log('Press any key to exit...');
  // process.stdin.on('data', function (data) {
  //   console.clear();
  //   process.exit(0); // 用户输入后退出程序
  // })

  process.stdin.resume();
  console.clear();
  console.log('Press any key to exit...');
  process.stdin.on('data', () => {
    console.clear();
    process.exit(0); // 用户输入后退出程序
  });

}
main()


async function encryptFun(str) {
  str = str || ''
  let text = await inputTxtMultiLine('enter plaintext', str)
  let me = await inputTxtLine('enter password: ', true)
  let filePath = await inputTxtLine('enter filePath: ')
  let file = !filePath ? 'default' : filePath
  let ciphertext = encrypt(text, me)
  if (!filePath) {
    console.log(ciphertext);
  } else {
    writeFileSync(file, ciphertext, 'utf8');
    console.log('done', file);
  }
}


async function decryptFun() {
  try {
    let filePath = await inputTxtLine('input filePath: ')
    let me = await inputTxtLine('enter password: ', true)
    let file = !filePath ? 'default' : filePath
    if (!existsSync(file)) {
      console.log('file not found')
      return ''
    }
    return decrypt(Buffer.from(readFileSync(file, 'utf8'), 'base64'), me)
  } catch {
    console.log('pwd error')
  }
}