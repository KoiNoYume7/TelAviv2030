# Deployment Guide for Windows

This guide explains how to deploy TelAviv2030 from a Windows machine to a Raspberry Pi (yme-04).

**Quick start:** Just run `deploy.bat` — it handles everything.

## Prerequisites

### 1. SSH Access to Raspberry Pi
Ensure you can SSH into your Raspberry Pi from Windows:
```bash
ssh pi@raspberrypi
```

If you haven't set up SSH keys, you'll be prompted for your password during deployment.

### 2. Install OpenSSH Client (Windows 10+)

**Option A: Via Settings (Recommended)**
1. Go to Settings → Apps → Optional Features
2. Click "Add a feature"
3. Search for "OpenSSH Client" and install

**Option B: Via PowerShell (Admin)**
```powershell
Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
```

**Option C: Git for Windows**
If you have Git for Windows installed, it includes SSH/SCP tools.

### 3. Verify Installation
Open Command Prompt or PowerShell and run:
```bash
ssh --version
scp --version
```

Both should show version information.

## Deployment Script

### `deploy.bat` (Primary entry point)

Just run it:
```batch
deploy.bat
```

This:
- Checks for PowerShell 7+
- Calls `deploy.ps1` with all arguments
- Shows colored output with AnniLog
- Creates logs in `logs/` folder

### `deploy.ps1` (Full logic)

Advanced options:
```powershell
deploy.bat                    # Default: yme-04, akira
deploy.bat -SkipInstall       # Skip npm install on Pi
```

**Configuration:**
- **Host**: `yme-04` (Tailscale hostname)
- **Username**: `akira`
- **App Directory**: `/opt/anni/telaviv`
- **Storage Directory**: `/srv/storage/TelAviv2030`
- **Service Name**: `telaviv`
- **Port**: `4300`

Edit these at the top of `deploy.ps1` if needed.

## Environment Variables

After deployment, configure the environment variables on the Pi:

```bash
ssh akira@yme-04
sudo nano /opt/anni/telaviv/.env
```

Add your credentials (see `server/.env.example` for reference):
```env
PORT=4300
SESSION_SECRET=your-secret-key
DB_PATH=/srv/storage/TelAviv2030/telaviv.db
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://telaviv.yumehana.dev/api/auth/google/callback
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
DISCORD_GUILD_ID=your-discord-guild-id
DISCORD_MEMBER_ROLE_ID=your-discord-member-role-id
DISCORD_CALLBACK_URL=https://telaviv.yumehana.dev/api/auth/discord/callback
TWINT_QR_CODE_URL=https://your-twint-qr-code-url
DISCORD_WEBHOOK_URL=your-discord-webhook-url
```

Then restart the service:
```bash
sudo systemctl restart telaviv
```

## SSL/HTTPS Setup

The deployment script configures nginx for HTTPS, but you need SSL certificates:

### Option A: Let's Encrypt (Certbot)
```bash
ssh pi@raspberrypi
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d telaviv.yumehana.dev
```

### Option B: Self-signed (for testing)
```bash
ssh pi@raspberrypi
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/telaviv-selfsigned.key \
  -out /etc/ssl/certs/telaviv-selfsigned.crt
```

Then update `nginx/telaviv.conf` to use the self-signed certificates.

## Troubleshooting

### SSH Connection Failed
- Ensure Raspberry Pi is reachable: `ping raspberrypi`
- Check SSH is enabled on Raspberry Pi: `sudo raspi-config` → Interface Options → SSH
- Verify username and hostname

### Permission Denied
- The script uses `sudo` for operations requiring root
- You may need to enter your SSH password multiple times
- Consider setting up SSH keys for passwordless access

### Port Already in Use
```bash
ssh pi@raspberrypi
sudo systemctl stop telaviv
sudo netstat -tulpn | grep :3000
```

### Service Won't Start
```bash
ssh pi@raspberrypi
sudo journalctl -u telaviv -n 50
```

### Nginx Configuration Error
```bash
ssh pi@raspberrypi
sudo nginx -t
```

## SSH Key Setup (Optional but Recommended)

To avoid entering passwords repeatedly:

1. **Generate SSH key on Windows** (if you don't have one):
   ```bash
   ssh-keygen -t ed25519
   ```

2. **Copy public key to Raspberry Pi**:
   ```bash
   type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh pi@raspberrypi "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
   ```

3. **Test passwordless login**:
   ```bash
   ssh pi@raspberrypi
   ```

## Cloudflare Tunnel Setup (Optional)

If using Cloudflare Tunnel instead of port forwarding:

1. Install Cloudflare Tunnel on Raspberry Pi:
   ```bash
   ssh pi@raspberrypi
   wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64
   sudo mv cloudflared-linux-arm64 /usr/local/bin/cloudflared
   sudo chmod +x /usr/local/bin/cloudflared
   ```

2. Authenticate:
   ```bash
   cloudflared tunnel login
   ```

3. Create tunnel:
   ```bash
   cloudflared tunnel create telaviv
   ```

4. Configure routing in Cloudflare Dashboard

5. Run tunnel as systemd service

## Deployment Checklist

Before deploying:
- [ ] SSH access to Raspberry Pi works
- [ ] Node.js 18+ installed on Raspberry Pi
- [ ] nginx installed on Raspberry Pi
- [ ] Domain (telaviv.yumehana.dev) points to your server
- [ ] SSL certificates obtained
- [ ] OAuth credentials ready (Google + Discord)
- [ ] Environment variables documented

After deploying:
- [ ] Check service status: `sudo systemctl status telaviv`
- [ ] Check nginx status: `sudo systemctl status nginx`
- [ ] Configure .env file
- [ ] Restart service: `sudo systemctl restart telaviv`
- [ ] Test application in browser
- [ ] Check logs: `sudo journalctl -u telaviv -f`

## Manual Deployment

If scripts fail, you can deploy manually:

```bash
# On Windows
cd client
npm install
npm run build
cd ../server
npm install

# Transfer files
scp -r client/dist/* pi@raspberrypi:/var/www/telaviv/client/
scp -r server/* pi@raspberrypi:/var/www/telaviv/server/

# On Raspberry Pi
ssh pi@raspberrypi
sudo chown -R www-data:www-data /var/www/telaviv
sudo chmod -R 755 /var/www/telaviv
sudo systemctl restart telaviv
sudo systemctl reload nginx
```