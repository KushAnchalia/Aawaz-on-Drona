# Deployment Guide: Ollama Backend + Vercel Frontend

## Phase 1: Deploy Ollama Backend

### 1. Get a VPS (Virtual Private Server)
- **DigitalOcean**: [DigitalOcean.com](https://digitalocean.com) - $5/month plan
- Create droplet with these specs:
  - Ubuntu 22.04
  - 4GB RAM (minimum for Ollama)
  - 80GB SSD storage
  - SSH key for security

### 2. SSH into your server:
```bash
ssh root@YOUR_SERVER_IP
```

### 3. Install Ollama on your VPS:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama service
sudo systemctl enable ollama
sudo systemctl start ollama

# Add your user to ollama group
sudo usermod -aG ollama $USER
```

### 4. Pull your model:
```bash
# Pull the model you want to use
ollama pull llama3.1
# or
ollama pull mistral
```

### 5. Configure Ollama to accept external connections:
```bash
# Edit systemd service file
sudo nano /etc/systemd/system/ollama.service
```

Change the `ExecStart` line to:
```
ExecStart=/usr/local/bin/ollama serve -H 0.0.0.0:11434
```

Then restart:
```bash
sudo systemctl daemon-reload
sudo systemctl restart ollama
```

### 6. Configure firewall to allow connections:
```bash
# Allow Ollama port
sudo ufw allow 11434
sudo ufw enable
```

### 7. Test Ollama is working externally:
```bash
curl http://YOUR_SERVER_IP:11434/api/generate -d '{
  "model": "llama3.1",
  "prompt": "Hello, how are you?",
  "stream": false
}'
```

## Phase 2: Update Your Frontend for Vercel

### 1. Update environment variables for Vercel deployment:
Create `.env.local` with your server details:
```bash
LLM_PROVIDER=ollama
OLLAMA_URL=https://your-server-domain.com  # Your VPS domain/IP
OLLAMA_MODEL=llama3.1
HUME_API_KEY=your_hume_key
HUME_SECRET_KEY=your_hume_secret_key
```

### 2. Update your Vercel project settings:
- Go to Vercel dashboard
- Add environment variables:
  - `LLM_PROVIDER=ollama`
  - `OLLAMA_URL=https://your-server-domain.com` (replace with your actual server)
  - `OLLAMA_MODEL=llama3.1`
  - `HUME_API_KEY=your_key`
  - `HUME_SECRET_KEY=your_key`

## Phase 3: Deploy to Vercel

### 1. Push your code to GitHub:
```bash
git add .
git commit -m "Updated for Ollama backend deployment"
git push origin main
```

### 2. Import to Vercel:
- Go to [vercel.com](https://vercel.com)
- Sign in with GitHub
- Click "New Project"
- Import your repository
- Add environment variables as mentioned above
- Click "Deploy"

## Phase 4: Security Considerations

### 1. Secure your Ollama endpoint:
- Use HTTPS for your VPS
- Consider adding authentication to your Ollama endpoint
- Use a reverse proxy like Nginx with rate limiting

### 2. Nginx configuration (optional but recommended):
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:11434;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Add rate limiting
        limit_req zone=ollama burst=10 nodelay;
    }
}
```

## Troubleshooting

### Common Issues:

1. **CORS errors**: Make sure your Ollama server accepts requests from your Vercel domain
2. **Connection timeouts**: Check firewall settings on your VPS
3. **Model not found**: Ensure the model is pulled on your server (`ollama list`)

### Test your setup:
```bash
# Test from your local machine
curl -X POST https://your-server-ip:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.1",
    "prompt": "Hello",
    "stream": false
  }'
```

Your app should now be running with Ollama backend and Vercel frontend! 🚀