import express from 'express';
import axios from 'axios';
import db from '../db/db.js';

const router = express.Router();

// Helper: Log audit action
function logAudit(action, actorId, subjectId, amountChf = null, meta = null) {
  const stmt = db.prepare(`
    INSERT INTO audit_log (action, actor_id, subject_id, amount_chf, meta)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(action, actorId, subjectId, amountChf, meta);
}

// Google OAuth routes
router.get('/google', (req, res) => {
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_CALLBACK_URL,
    response_type: 'code',
    scope: 'openid profile email'
  });
  res.redirect(authUrl);
});

router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    // Exchange code for tokens
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      redirect_uri: process.env.GOOGLE_CALLBACK_URL,
      grant_type: 'authorization_code'
    });
    
    const { access_token } = tokenResponse.data;
    
    // Get user info
    const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    
    const userData = userResponse.data;
    const memberId = `google:${userData.id}`;
    
    // Check if user exists
    let member = db.prepare('SELECT * FROM members WHERE id = ?').get(memberId);
    
    if (!member) {
      // Create new member (pending approval)
      const stmt = db.prepare(`
        INSERT INTO members (id, provider, provider_id, name, display_name, email, avatar, role)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
      `);
      stmt.run(
        memberId,
        'google',
        userData.id,
        userData.given_name || userData.name,
        userData.name,
        userData.email,
        userData.picture
      );
      
      logAudit('member_created', null, memberId, null, JSON.stringify({ provider: 'google' }));
      member = db.prepare('SELECT * FROM members WHERE id = ?').get(memberId);
    }
    
    // Set session
    req.session.userId = memberId;
    req.session.userRole = member.role;
    
    // Redirect based on role
    if (member.role === 'pending') {
      res.redirect('/#/pending');
    } else if (!member.agreement_signed_at) {
      res.redirect('/#/agreement');
    } else {
      res.redirect('/#/dashboard');
    }
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.redirect('/#/?error=oauth_failed');
  }
});

// Discord OAuth routes
router.get('/discord', (req, res) => {
  const authUrl = `https://discord.com/api/oauth2/authorize?` + new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    redirect_uri: process.env.DISCORD_CALLBACK_URL,
    response_type: 'code',
    scope: 'identify guilds.members.read'
  });
  res.redirect(authUrl);
});

router.get('/discord/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    // Exchange code for tokens
    const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', {
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      code,
      redirect_uri: process.env.DISCORD_CALLBACK_URL,
      grant_type: 'authorization_code'
    }, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    const { access_token } = tokenResponse.data;
    
    // Get user info
    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    
    const userData = userResponse.data;
    const memberId = `discord:${userData.id}`;
    
    // Check if user has the required role in the guild
    let hasRole = false;
    try {
      const guildResponse = await axios.get(
        `https://discord.com/api/users/@me/guilds/${process.env.DISCORD_GUILD_ID}/member`,
        { headers: { Authorization: `Bearer ${access_token}` } }
      );
      
      const memberData = guildResponse.data;
      hasRole = memberData.roles && memberData.roles.includes(process.env.DISCORD_MEMBER_ROLE_ID);
    } catch (error) {
      console.error('Discord guild check error:', error.message);
    }
    
    // Check if user exists
    let member = db.prepare('SELECT * FROM members WHERE id = ?').get(memberId);
    
    if (!member) {
      // Create new member
      const role = hasRole ? 'member' : 'pending';
      const stmt = db.prepare(`
        INSERT INTO members (id, provider, provider_id, name, display_name, email, avatar, discord_id, role)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        memberId,
        'discord',
        userData.id,
        userData.global_name || userData.username,
        userData.global_name || userData.username,
        userData.email,
        `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`,
        userData.id,
        role
      );
      
      logAudit('member_created', null, memberId, null, JSON.stringify({ provider: 'discord', instant_approval: hasRole }));
      member = db.prepare('SELECT * FROM members WHERE id = ?').get(memberId);
    }
    
    // Set session
    req.session.userId = memberId;
    req.session.userRole = member.role;
    
    // Redirect based on role
    if (member.role === 'pending') {
      res.redirect('/#/pending');
    } else if (!member.agreement_signed_at) {
      res.redirect('/#/agreement');
    } else {
      res.redirect('/#/dashboard');
    }
  } catch (error) {
    console.error('Discord OAuth error:', error);
    res.redirect('/#/?error=oauth_failed');
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Get current user
router.get('/me', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(req.session.userId);
  if (!member) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Remove sensitive data
  const { agreement_ip, ...safeMember } = member;
  res.json(safeMember);
});

export default router;