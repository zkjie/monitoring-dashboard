const express = require('express');
const os = require('os');
const si = require('systeminformation');
const { execSync } = require('child_process');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.static('public'));

app.get('/api/stats', async (req, res) => {
  try {
    const cpu = await si.currentLoad();
    const mem = await si.mem();
    const disk = await si.fsSize();
    
    // 1. Server Stats
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

    // 2. OpenClaw Skills & Token Usage (Mocking based on session_status output for now, or parsing openclaw output)
    let openclawInfo = { skills: [], tokens: 'N/A' };
    try {
      // List skills from the known location
      const skillsOutput = execSync('ls -F /usr/lib/node_modules/openclaw/skills/').toString();
      openclawInfo.skills = skillsOutput.split('\n').filter(s => s.endsWith('/')).map(s => s.replace('/', ''));
      
      // Try to get token info (this is usually session-specific, we'll mock or parse openclaw status if possible)
      // For now, providing a placeholder or parsing a simple command if available
      openclawInfo.tokens = "Check session_status for live usage"; 
    } catch (e) {
      console.error("OpenClaw parsing error", e);
    }

    // 3. Dev Tools & Environment
    const devTools = [];
    const checkTool = (name, cmd) => {
      try {
        const ver = execSync(cmd + ' --version').toString().trim().split('\n')[0];
        devTools.push({ name, version: ver });
      } catch (e) {}
    };

    ['node', 'npm', 'pnpm', 'docker', 'docker-compose', 'git', 'python3', 'go', 'rustc'].forEach(t => checkTool(t, t));
    
    const envVars = ['NODE_ENV', 'SHELL', 'PATH'].reduce((acc, v) => {
      acc[v] = process.env[v];
      return acc;
    }, {});

    res.json({
      server: serverStats,
      openclaw: openclawInfo,
      tools: devTools,
      env: envVars
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
