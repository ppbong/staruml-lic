# 项目说明

郑重声明：本项目针对staruml个人用户进行激活使用，其他商业用途请购买startuml官方许可。

## COMMON

```bash
asar e app.asar app
asar p app app.asar
```

## STARUML.V7

### 1.生成激活密钥文件

```bash
# 生成 activation.key 文件
node gen-lic-710.js
```

### 2.密钥文件复制到 `userData` 目录

```text
C:\Users\用户名\AppData\Roaming\StarUML\activation.key
```

### 3.修改验证函数

```js
// app/src/utils/license-client.js
async function remoteValidate() {
  // 应用启动时采用本地和远程双重验证模式，须阻断远程验证
  return {
    success: true,
    message: "Validation successful (activated)",
  };
}
```

### 4.修改取消激活函数（可选）

```js
// app/src/utils/license-client.js
async function remoteDeactivate() {
  // 避免将本地机器码发送到服务端留下痕迹
  try {
  	await localDeactivate();
  } catch(err) {}

  return {
    success: true,
    message: "Deactivation successful",
  };
}
```
