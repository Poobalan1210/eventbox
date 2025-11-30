# 👋 START HERE

Welcome to the Live Quiz Event System!

## ✅ Pre-flight Checklist

Before you start, make sure you have:

- [ ] **Node.js 18+** installed
  - Check: `node --version`
  - If not installed: https://nodejs.org/

- [ ] **Docker Desktop** installed and running
  - Check: Look for 🐳 whale icon in menu bar
  - If not installed: https://www.docker.com/products/docker-desktop

## 🚀 Launch Sequence

### 1️⃣ Install Dependencies
```bash
npm install
```

### 2️⃣ Start the App
```bash
npm run dev
```

Wait 10-15 seconds for everything to start...

### 3️⃣ Open Your Browser
```
http://localhost:5173
```

## 🎉 You're Ready!

Now you can:
- **Create a quiz event** as an organizer
- **Join an event** as a participant
- **Test real-time features** by opening multiple browser windows

## 📚 What to Read Next

Choose your path:

### Just Want to Try It?
→ Read [GETTING_STARTED.md](./GETTING_STARTED.md) for a quick walkthrough

### Want to Develop?
→ Read [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) for detailed dev guide

### Ready to Deploy?
→ Read [DEPLOYMENT.md](./DEPLOYMENT.md) for AWS deployment

### Want to Understand the Architecture?
→ Read [infrastructure/README.md](./infrastructure/README.md)

## 🆘 Something Not Working?

### Docker Error?
Make sure Docker Desktop is running. Open it from Applications.

### Port Already in Use?
Something else is using port 3001 or 5173. Either:
- Stop the other app
- Or change ports in `.env.local` files

### Other Issues?
Check [GETTING_STARTED.md](./GETTING_STARTED.md) troubleshooting section.

---

**Quick Commands:**

```bash
npm run dev              # Start everything
npm run db:admin         # View database
npm run db:stop          # Stop database
```

---

Have fun! 🎊
