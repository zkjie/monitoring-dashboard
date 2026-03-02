const express = require('express');
const os = require('os');
const si = require('systeminformation');
const { execSync } = require('child_process');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// 技能翻译映射
const skillTranslations = {
  'feishu': '飞书集成 (文档/群聊)',
  'github': 'GitHub 操作 (代码/PR)',
  'weather': '天气查询',
  'gh-issues': 'GitHub Issue 追踪',
  'healthcheck': '系统安全检查',
  'openai-image-gen': 'DALL-E 图片生成',
  'openai-whisper-api': '语音转文字',
  'skill-creator': '技能自动生成器',
  'canvas': '画布 UI 交互',
  'coding-agent': '代码助手',
  'discord': 'Discord 集成',
  'slack': 'Slack 集成',
  'summarize': '内容总结',
  'trello': 'Trello 任务管理',
  'spotify-player': 'Spotify 播放控制',
  'google-calendar': '谷歌日历',
  'model-usage': '模型额度监控'
};

app.get('/api/stats', async (req, res) => {
  try {
    const cpu = await si.currentLoad();
    const mem = await si.mem();
    const disk = await si.fsSize();
    
    const serverStats = {
      hostname: os.hostname(),
      platform: os.platform(),
      uptime: os.uptime(),
      cpuUsage: cpu.currentLoad.toFixed(2),
      memTotal: (mem.total / 1024 / 1024 / 1024).toFixed(2) + ' GB',
      memUsed: (mem.active / 1024 / 1024 / 1024).toFixed(2) + ' GB',
      memUsage: ((mem.active / mem.total) * 100).toFixed(2),
      diskUsage: disk[0] ? disk[0].use.toFixed(2) : '0'
    };

    let openclawInfo = { skills: [], tokens: 'N/A' };
    try {
      const skillsPath = '/usr/lib/node_modules/openclaw/skills/';
      if (fs.existsSync(skillsPath)) {
        const folders = fs.readdirSync(skillsPath, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name);
        
        openclawInfo.skills = folders.map(name => ({
          id: name,
          name: skillTranslations[name] || name
        }));
      }
    } catch (e) {
      console.error("OpenClaw skills parsing error", e);
    }

    const devTools = [];
    const checkTool = (name, cmd) => {
      try {
        const ver = execSync(cmd + ' --version').toString().trim().split('\n')[0];
        devTools.push({ name, version: ver });
      } catch (e) {}
    };

    ['node', 'npm', 'pnpm', 'docker', 'docker-compose', 'git', 'python3', 'go', 'rustc'].forEach(t => checkTool(t, t));
    
    res.json({
      server: serverStats,
      openclaw: openclawInfo,
      tools: devTools,
      env: {
        SHELL: process.env.SHELL,
        PATH: process.env.PATH
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
