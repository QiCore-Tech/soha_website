FROM python:3.12-alpine

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app
RUN pip install --no-cache-dir pypdf==6.0.0 requests==2.32.5
COPY app.py /app/app.py

RUN addgroup -S app && adduser -S -G app app \
    && mkdir -p /data \
    && chown -R app:app /app /data

USER app
ENTRYPOINT ["python", "/app/app.py"]
