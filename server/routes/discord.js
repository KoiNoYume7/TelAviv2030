import express from 'express';
import axios from 'axios';
import db from '../db/db.js';

const router = express.Router();

// Middleware: Check authentication
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

// Middleware: Check admin role
function requireAdmin(req, res, next) {
  if (!req.session.userId || req.session.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Helper: Send Discord webhook notification
async function sendWebhook(message) {
  if (!process.env.DISCORD_WEBHOOK_URL) {
    console.log('Discord webhook URL not configured');
    return;
  }
  
  try {
    await axios.post(process.env.DISCORD_WEBHOOK_URL, {
      content: message
    });
  } catch (error) {
    console.error('Discord webhook error:', error.message);
  }
}

// Notify new contribution
router.post('/notify/contribution', requireAuth, requireAdmin, async (req, res) => {
  const { member_name, amount_chf, method } = req.body;
  
  const message = `💰 New contribution: ${member_name} sent CHF ${amount_chf} via ${method}`;
  await sendWebhook(message);
  
  res.json({ success: true });
});

// Notify new cashout proposal
router.post('/notify/proposal', requireAuth, requireAdmin, async (req, res) => {
  const { proposer_name, title, amount_chf } = req.body;
  
  const message = `📋 New cashout proposal: ${proposer_name} proposes "${title}" for CHF ${amount_chf}`;
  await sendWebhook(message);
  
  res.json({ success: true });
});

// Notify cashout execution
router.post('/notify/execution', requireAuth, requireAdmin, async (req, res) => {
  const { title, amount_chf } = req.body;
  
  const message = `✅ Cashout executed: "${title}" for CHF ${amount_chf}`;
  await sendWebhook(message);
  
  res.json({ success: true });
});

// Notify member approval
router.post('/notify/approval', requireAuth, requireAdmin, async (req, res) => {
  const { member_name } = req.body;
  
  const message = `👋 New member approved: ${member_name}`;
  await sendWebhook(message);
  
  res.json({ success: true });
});

export default router;