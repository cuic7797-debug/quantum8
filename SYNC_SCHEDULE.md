# 设置每天自动同步数据

## 方法：Windows 任务计划程序（推荐）

### 第一步：先测试脚本能跑

在 PowerShell 里执行：
```powershell
cd C:\Users\pengkai\Desktop\quantum8\quantum8\apps\web\public
node sync-data.js
```

看到 `同步完成！` 就说明脚本正常。

### 第二步：创建定时任务

在 PowerShell 里执行（管理员模式）：
```powershell
$action = New-ScheduledTaskAction -Execute "node" -Argument "C:\Users\pengkai\Desktop\quantum8\quantum8\apps\web\public\sync-data.js" -WorkingDirectory "C:\Users\pengkai\Desktop\quantum8\quantum8\apps\web\public"
$trigger = New-ScheduledTaskTrigger -Daily -At "22:30"
Register-ScheduledTask -TaskName "Quantum8-Sync" -Action $action -Trigger $trigger -Description "快乐八数据自动同步"
```

### 第三步：验证

打开「任务计划程序」（搜索 taskschd.msc），应该能看到 `Quantum8-Sync` 任务。

### 手动触发

如果开奖后想立即同步：
```powershell
node C:\Users\pengkai\Desktop\quantum8\quantum8\apps\web\public\sync-data.js
```

## 工作原理

1. 每天 22:30 自动运行（快乐八 21:30 开奖）
2. 从福彩官网获取最近 10 期数据
3. 只插入新的期号，跳过已存在的
4. 自动更新 80 个号码的统计数据
5. 日志写入 sync-log.txt
