FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    GMI_PUBLIC_MODE=1 \
    GMI_DB_PATH=/data/gmi_intelligence.sqlite3 \
    GMI_REFRESH_MINUTES=60
WORKDIR /app
COPY index.html styles.css app.js country-catalog.js country-catalog.json verified-officials.json server.py auto_intel.py research_api.py enhancements.js refinements.js ./
RUN mkdir -p /data
EXPOSE 8765
CMD ["python", "server.py"]
