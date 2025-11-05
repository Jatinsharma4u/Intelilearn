const Battle = require('../models/Battle');
const User = require('../models/User');

// Create a new battle
const createBattle = async (req, res) => {
  try {
    const { settings, mode, stakeAmount, opponentId, classroomId } = req.body;

    console.log('Creating battle for user:', req.user.uid);

    const battle = new Battle({
      hostId: req.user.uid,
      mode,
      settings,
      stakeAmount,
      opponentId,
      classroomId,
      status: 'waiting'
    });

    // Add host as first participant
    battle.participants.push({
      userId: req.user.uid,
      score: 0,
      correct: 0,
      wrong: 0,
      accuracy: 0,
      avgAnswerTime: 0,
      fastestAnswer: 0
    });

    await battle.save();

    // Lock coins for P2P battles
    if (mode === 'p2p' && stakeAmount > 0) {
      await User.findOneAndUpdate(
        { userId: req.user.uid },
        { $inc: { 'progress.coins': -stakeAmount } }
      );
    }

    res.json({ success: true, battle });
  } catch (error) {
    console.error('Error creating battle:', error);
    res.status(500).json({ success: false, error: 'Failed to create battle' });
  }
};

// Join a battle
const joinBattle = async (req, res) => {
  try {
    const { battleId } = req.params;

    console.log('User joining battle:', req.user.uid, 'Battle:', battleId);

    const battle = await Battle.findOne({ battleId });
    if (!battle) {
      return res.status(404).json({ success: false, error: 'Battle not found' });
    }

    if (battle.status !== 'waiting') {
      return res.status(400).json({ success: false, error: 'Battle has already started' });
    }

    if (battle.participants.length >= battle.settings.maxParticipants) {
      return res.status(400).json({ success: false, error: 'Battle is full' });
    }

    if (battle.participants.find(p => p.userId === req.user.uid)) {
      return res.status(400).json({ success: false, error: 'Already joined this battle' });
    }

    // For P2P battles, check stake and lock coins
    if (battle.mode === 'p2p') {
      const user = await User.findOne({ userId: req.user.uid });
      if (user.progress.coins < battle.stakeAmount) {
        return res.status(400).json({ success: false, error: 'Insufficient coins' });
      }

      await User.findOneAndUpdate(
        { userId: req.user.uid },
        { $inc: { 'progress.coins': -battle.stakeAmount } }
      );
    }

    // Add participant
    battle.participants.push({
      userId: req.user.uid,
      score: 0,
      correct: 0,
      wrong: 0,
      accuracy: 0,
      avgAnswerTime: 0,
      fastestAnswer: 0
    });

    await battle.save();

    res.json({ success: true, battle });
  } catch (error) {
    console.error('Error joining battle:', error);
    res.status(500).json({ success: false, error: 'Failed to join battle' });
  }
};

// Get battle details
const getBattle = async (req, res) => {
  try {
    const { battleId } = req.params;

    console.log('Fetching battle:', battleId);

    const battle = await Battle.findOne({ battleId });
    if (!battle) {
      return res.status(404).json({ success: false, error: 'Battle not found' });
    }

    res.json({ success: true, battle });
  } catch (error) {
    console.error('Error fetching battle:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch battle' });
  }
};

// Submit answer
const submitAnswer = async (req, res) => {
  try {
    const { battleId } = req.params;
    const { questionIndex, answer, answerTime } = req.body;

    console.log('Submitting answer for battle:', battleId, 'User:', req.user.uid);

    const battle = await Battle.findOne({ battleId });
    if (!battle) {
      return res.status(404).json({ success: false, error: 'Battle not found' });
    }

    const participant = battle.participants.find(p => p.userId === req.user.uid);
    if (!participant) {
      return res.status(400).json({ success: false, error: 'Not a participant' });
    }

    const question = battle.questions[questionIndex];
    if (!question) {
      return res.status(400).json({ success: false, error: 'Invalid question' });
    }

    const isCorrect = answer === question.correctOption;

    // Calculate points based on speed and correctness
    let points = 0;
    if (isCorrect) {
      const speedBonus = calculateSpeedBonus(answerTime, battle.settings.timerPerQuestion);
      points = question.maxPoints + speedBonus;
    }

    // Update participant stats
    participant.score += points;
    if (isCorrect) {
      participant.correct += 1;
    } else {
      participant.wrong += 1;
      const currentCount = participant.weakTopics.get(question.topic) || 0;
      participant.weakTopics.set(question.topic, currentCount + 1);
    }

    const totalAnswered = participant.correct + participant.wrong;
    participant.avgAnswerTime = (
      (participant.avgAnswerTime * (totalAnswered - 1)) + answerTime
    ) / totalAnswered;

    if (answerTime < participant.fastestAnswer || participant.fastestAnswer === 0) {
      participant.fastestAnswer = answerTime;
    }

    participant.accuracy = (participant.correct / totalAnswered) * 100;

    participant.answers.push({
      questionId: question.questionId,
      answer,
      isCorrect,
      answerTime,
      points
    });

    await battle.save();

    res.json({
      success: true,
      isCorrect,
      points,
      correctAnswer: question.correctOption,
      explanation: question.explanation
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ success: false, error: 'Failed to submit answer' });
  }
};

// Complete battle
const completeBattle = async (req, res) => {
  try {
    const { battleId } = req.params;

    console.log('Completing battle:', battleId);

    const battle = await Battle.findOne({ battleId });
    if (!battle) {
      return res.status(404).json({ success: false, error: 'Battle not found' });
    }

    battle.status = 'completed';
    battle.completedAt = new Date();

    // Calculate rewards and update user stats
    for (const participant of battle.participants) {
      const user = await User.findOne({ userId: participant.userId });
      if (!user) continue;

      const coinsEarned = Math.floor(participant.score / 10);
      const xpEarned = Math.floor(participant.score / 2);

      participant.coinsEarned = coinsEarned;
      participant.xpEarned = xpEarned;

      // Update user progress
      user.progress.coins += coinsEarned;
      user.progress.xp += xpEarned;
      user.progress.total_xp += xpEarned;

      // Update battle stats
      user.battle_stats.battles_played += 1;

      if (battle.mode === 'p2p') {
        const winner = battle.participants.reduce((prev, current) =>
          prev.score > current.score ? prev : current
        );

        if (participant.userId === winner.userId) {
          user.progress.coins += battle.stakeAmount * 2;
          user.battle_stats.battles_won += 1;
        }
      } else {
        const sortedParticipants = [...battle.participants].sort((a, b) => b.score - a.score);
        if (sortedParticipants[0].userId === participant.userId) {
          user.battle_stats.battles_won += 1;
        }
      }

      user.battle_stats.win_percentage =
        (user.battle_stats.battles_won / user.battle_stats.battles_played) * 100;

      user.battle_stats.accuracy = (
        (user.battle_stats.accuracy * (user.battle_stats.battles_played - 1)) + participant.accuracy
      ) / user.battle_stats.battles_played;

      user.battle_stats.avg_answer_time = (
        (user.battle_stats.avg_answer_time * (user.battle_stats.battles_played - 1)) + participant.avgAnswerTime
      ) / user.battle_stats.battles_played;

      await user.save();
    }

    await battle.save();

    res.json({ success: true, battle });
  } catch (error) {
    console.error('Error completing battle:', error);
    res.status(500).json({ success: false, error: 'Failed to complete battle' });
  }
};

// Get user's battle history
const getBattleHistory = async (req, res) => {
  try {
    console.log('Fetching battle history for user:', req.user.uid);

    const battles = await Battle.find({
      'participants.userId': req.user.uid,
      status: 'completed'
    }).sort({ completedAt: -1 }).limit(20);

    res.json({ success: true, battles });
  } catch (error) {
    console.error('Error fetching battle history:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch battle history' });
  }
};

function calculateSpeedBonus(answerTime, maxTime) {
  if (answerTime < 3) return 20;
  if (answerTime < 5) return 15;
  if (answerTime < maxTime * 0.5) return 10;
  if (answerTime < maxTime * 0.8) return 5;
  return 0;
}

module.exports = {
  createBattle,
  joinBattle,
  getBattle,
  submitAnswer,
  completeBattle,
  getBattleHistory
};