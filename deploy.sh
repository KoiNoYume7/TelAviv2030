#!/bin/bash

# TelAviv2030 Deployment Script
# This script deploys the TelAviv2030 application to the Raspberry Pi

set -e

echo "🔥 TelAviv2030 Deployment Script"
echo "================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/opt/anni/telaviv"
STORAGE_DIR="/srv/storage/TelAviv2030"
SERVICE_NAME="telaviv"
PORT="4300"
NGINX_CONF="/etc/nginx/sites-available/telaviv.yumehana.dev"

echo -e "${YELLOW}Step 1: Building client...${NC}"
cd client
npm install
npm run build

echo -e "${YELLOW}Step 2: Installing server dependencies...${NC}"
cd ../server
npm install

echo -e "${YELLOW}Step 3: Setting up directories...${NC}"
sudo mkdir -p $APP_DIR
sudo mkdir -p $STORAGE_DIR

echo -e "${YELLOW}Step 4: Copying files...${NC}"
sudo cp -r dist/* $APP_DIR/
sudo cp -r server/* $APP_DIR/
sudo cp nginx/telaviv.conf $NGINX_CONF

echo -e "${YELLOW}Step 5: Setting permissions...${NC}"
sudo chown -R www-data:www-data $APP_DIR
sudo chmod -R 755 $APP_DIR

echo -e "${YELLOW}Step 6: Setting up systemd service...${NC}"
sudo cp $APP_DIR/telaviv.service /etc/systemd/system/$SERVICE_NAME.service


echo -e "${YELLOW}Step 7: Enabling and starting service...${NC}"
sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME
sudo systemctl restart $SERVICE_NAME

echo -e "${YELLOW}Step 8: Configuring nginx...${NC}"
sudo ln -sf $NGINX_CONF /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Service status:"
sudo systemctl status $SERVICE_NAME --no-pager
echo ""
echo "🌐 Your app should be available at: https://telaviv.yumehana.dev"