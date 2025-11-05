const express = require("express");
const router = express.Router();
const User = require("../models/User");

// 🟢 Get progress by userId
router.get("/:userId", async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId });
    if (!user) return res.status(404).json({ error: "User not found" });
    
    if (!user.progress) {
      user.progress = {
        level: 1,
        xp: 0,
        total_xp: 0,
        coins: 0,
        daily_streak: 0,
        level_name: '🌱 Rookie'
      };
      await user.save();
    }
    
    res.json(user.progress);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🟢 Get progress by username
router.get("/username/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!user) return res.status(404).json({ error: "User not found" });
    
    if (!user.progress) {
      user.progress = {
        level: 1,
        xp: 0,
        total_xp: 0,
        coins: 0,
        daily_streak: 0,
        level_name: '🌱 Rookie'
      };
      await user.save();
    }
    
    res.json(user.progress);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🟡 Update progress by userId
router.put("/:userId", async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findOne({ userId: req.params.userId });
    
    if (!user) return res.status(404).json({ error: "User not found" });
    
    if (!user.progress) {
      user.progress = {
        level: 1,
        xp: 0,
        total_xp: 0,
        coins: 0,
        daily_streak: 0,
        level_name: '🌱 Rookie'
      };
    }
    
    user.progress = { ...user.progress, ...updates };
    await user.save();
    
    res.json(user.progress);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔵 Add XP by userId
router.post("/:userId/addXP", async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findOne({ userId: req.params.userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.progress) {
      user.progress = {
        level: 1,
        xp: 0,
        total_xp: 0,
        coins: 0,
        daily_streak: 0,
        level_name: '🌱 Rookie'
      };
    }

    user.progress.xp += amount;
    user.progress.total_xp += amount;

    const levels = getLevelRequirements();
    let newLevel = user.progress.level;

    if (newLevel < 25 && user.progress.xp >= levels[newLevel].totalXP) {
      newLevel++;
      user.progress.level = newLevel;
      user.progress.level_name = levels[newLevel].name;
      user.progress.coins += levels[newLevel].reward;
    }

    await user.save();
    res.json(user.progress);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔵 Add XP by username
router.post("/username/:username/addXP", async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.progress) {
      user.progress = {
        level: 1,
        xp: 0,
        total_xp: 0,
        coins: 0,
        daily_streak: 0,
        level_name: '🌱 Rookie'
      };
    }

    user.progress.xp += amount;
    user.progress.total_xp += amount;

    const levels = getLevelRequirements();
    let newLevel = user.progress.level;

    if (newLevel < 25 && user.progress.xp >= levels[newLevel].totalXP) {
      newLevel++;
      user.progress.level = newLevel;
      user.progress.level_name = levels[newLevel].name;
      user.progress.coins += levels[newLevel].reward;
    }

    await user.save();
    res.json(user.progress);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function getLevelRequirements() {
  const levels = {};
  let totalXP = 0;
  const levelData = [
    { level: 1, name: "🌱 Rookie", xpRequired: 0, reward: 100 },
    { level: 2, name: "📘 Beginner", xpRequired: 200, reward: 200 },
    { level: 3, name: "🎯 Learner", xpRequired: 400, reward: 300 },
    { level: 4, name: "⚡ Explorer", xpRequired: 600, reward: 400 },
    { level: 5, name: "📚 Student", xpRequired: 800, reward: 500 },
    { level: 6, name: "🧠 Thinker", xpRequired: 1000, reward: 600 },
    { level: 7, name: "🔥 Active", xpRequired: 1200, reward: 700 },
    { level: 8, name: "🏆 Achiever", xpRequired: 1400, reward: 800 },
    { level: 9, name: "⭐ Star", xpRequired: 1600, reward: 900 },
    { level: 10, name: "💎 Gem", xpRequired: 1800, reward: 1000 },
    { level: 11, name: "🚀 Rising", xpRequired: 2000, reward: 1200 },
    { level: 12, name: "🛡️ Warrior", xpRequired: 2200, reward: 1400 },
    { level: 13, name: "🔭 Visionary", xpRequired: 2400, reward: 1600 },
    { level: 14, name: "🧩 Strategist", xpRequired: 2600, reward: 1800 },
    { level: 15, name: "🏅 Champion", xpRequired: 2800, reward: 2000 },
    { level: 16, name: "👑 King", xpRequired: 3000, reward: 2200 },
    { level: 17, name: "🌟 Superstar", xpRequired: 3200, reward: 2400 },
    { level: 18, name: "🎓 Scholar", xpRequired: 3400, reward: 2600 },
    { level: 19, name: "⚡ Flash", xpRequired: 3600, reward: 2800 },
    { level: 20, name: "🧠 Genius", xpRequired: 3800, reward: 3000 },
    { level: 21, name: "🏆 Master", xpRequired: 4000, reward: 3500 },
    { level: 22, name: "🌈 Legend", xpRequired: 4200, reward: 4000 },
    { level: 23, name: "🚀 Rocket", xpRequired: 4400, reward: 4500 },
    { level: 24, name: "💎 Diamond", xpRequired: 4600, reward: 5000 },
    { level: 25, name: "👑 Ultimate", xpRequired: 4800, reward: 10000 },
  ];

  levelData.forEach((lvl) => {
    totalXP += lvl.xpRequired;
    levels[lvl.level] = {
      name: lvl.name,
      xpRequired: lvl.xpRequired,
      totalXP,
      reward: lvl.reward,
    };
  });

  return levels;
}

module.exports = router;