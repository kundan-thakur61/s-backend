# Backend Deployment Guide - Render

## Quick Deploy to Render (Free HTTPS)

### Step 1: Push to GitHub
```bash
cd backend
git add .
git commit -m "Add Render deployment config"
git push origin main
```

### Step 2: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub
3. Authorize Render to access your repositories

### Step 3: Deploy Backend
1. Click **"New +"** → **"Web Service"**
2. Connect your repository: `kundan-thakur61/s-backend`
3. Configure:
   - **Name**: `copadmob-backend`
   - **Region**: Singapore (or closest to you)
   - **Branch**: `main`
   - **Root Directory**: Leave empty (or `backend` if monorepo)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### Step 4: Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** and add these:

```env
NODE_ENV=production
MONGO_URI=mongodb+srv://coverghar_db_user:hXebSutObXfQMZNn@cluster0.cjcldrv.mongodb.net/coverghar
JWT_SECRET=asdertyhgfcvbgjmloiuybmlphgcdgbn
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=dwmytphop
CLOUDINARY_API_KEY=175649898342853
CLOUDINARY_API_SECRET=ue8YHB5bfYlwTOwHlmLouWs5l6I
RAZORPAY_KEY_ID=rzp_test_RHMsrxS6rQOzrE
RAZORPAY_KEY_SECRET=b263TG9jMqFP4P2cJ7KOtfTx
RAZORPAY_WEBHOOK_SECRET=your-razorpay-webhook-secret
SHIPROCKET_EMAIL=tanukumar006566@gmail.com
SHIPROCKET_PASSWORD=qY&OXb9AsnvSou7vLSdAxsWaf$JMQr1E
SHIPROCKET_API_BASE_URL=https://apiv2.shiprocket.in/v1/external
SHIPROCKET_WEBHOOK_SECRET=your-secret-shnfhhuiprocket-webhooijook-token-12345
SHIPROCKET_AUTO_CREATE=true
FRONTEND_URL=https://coverghar.in
CORS_ALLOWED_ORIGINS=https://coverghar.in,https://www.coverghar.in
LOG_LEVEL=info
```

### Step 5: Deploy
1. Click **"Create Web Service"**
2. Wait 3-5 minutes for deployment
3. Your backend URL will be: `https://copadmob-backend.onrender.com`

### Step 6: Update Shiprocket Webhook

Go to Shiprocket webhook settings and use:

**URL:**
```
https://copadmob-backend.onrender.com/api/webhooks/shiprocket
```

**Token:**
```
your-secret-shnfhhuiprocket-webhooijook-token-12345
```

### Step 7: Test Deployment

```bash
# Health check
curl https://copadmob-backend.onrender.com/api/health

# Test webhook
cd backend
WEBHOOK_BASE_URL=https://copadmob-backend.onrender.com node scripts/testShiprocketWebhook.js shipped
```

---

## Alternative: Railway.app

### Deploy to Railway (Also Free HTTPS)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
cd backend
railway init
railway up
```

Your URL will be: `https://your-app.up.railway.app`

---

## Alternative: Vercel (Serverless)

⚠️ **Note**: Vercel is serverless, so you'll need to modify your app structure slightly.

```bash
npm i -g vercel
cd backend
vercel --prod
```

---

## Important Notes

1. **Free Tier Limitations**:
   - Render free tier spins down after 15 minutes of inactivity
   - First request after sleep takes ~30 seconds
   - Upgrade to $7/month for always-on

2. **HTTPS Certificate**: Automatically provided by Render

3. **Custom Domain**: You can add `api.coverghar.in` in Render settings

4. **Logs**: View real-time logs in Render dashboard

5. **Auto-Deploy**: Render auto-deploys on every `git push`

---

## Monitoring Your Deployment

```bash
# View logs
render logs -f

# Or use Render dashboard
https://dashboard.render.com
```

---

## Webhook URL Format

After deployment, your Shiprocket webhook URL will be:

```
https://[your-service-name].onrender.com/api/webhooks/shiprocket
```

Example:
```
https://copadmob-backend.onrender.com/api/webhooks/shiprocket
```
