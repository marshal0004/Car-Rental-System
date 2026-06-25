rm -rf .git

cat > .gitignore << 'EOF'
# Python venv
.venv/
__pycache__/
*.pyc
*.pyo

# Database files
*.db
*.db-wal
*.db-shm

# Next.js
frontend/.next/
frontend/node_modules/
frontend/playwright-report/
frontend/test-results/
frontend/*.tsbuildinfo

# pytest cache
backend/.pytest_cache/

# Environment
.env
.env.local
EOF

git init
git add .
HUSKY=0 git commit -m "initial commit - Car Rental system"
git branch -M main
git remote add origin git@github.com:marshal0004/Car-Rental-System.git
git push origin main