FROM python:3.11-slim

WORKDIR /

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Expose port 8000 as default, but can be overridden
EXPOSE 7860

CMD ["python", "main.py"]