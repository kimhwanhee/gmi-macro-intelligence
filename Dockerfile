FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    GMI_PUBLIC_MODE=1 \
    GMI_DB_PATH=/data/gmi_intelligence.sqlite3 \
    GMI_REFRESH_MINUTES=60
WORKDIR /app
COPY index.html styles.css app.js country-catalog.js country-catalog.json verified-officials.json server.py auto_intel.py research_api.py enhancements.js refinements.js v5-repair.js v5-repair.css v6-fix.js v6-fix.css leadership-snapshots.json leadership_data.py macro_data.py political_data.py political-snapshots.json v7-politics.js v7-politics.css v8-intelligence.js v8-intelligence.css fx_data.py ./
RUN mkdir -p /data
EXPOSE 8765
CMD ["python", "server.py"]
