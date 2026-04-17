# mmdb-server (Node.js)

یک API سبک و سریع با Node.js برای Lookup کردن IP و برگرداندن کشور + ASN از روی فایل‌های MMDB.

Maintainer: [WhoisGray](https://github.com/WhoisGray)

## ویژگی‌ها

- کاملا Node.js (بدون Python/Poetry)
- خروجی تمیز و یک‌دست (یک آبجکت ثابت)
- پشتیبانی IPv4 و IPv6
- مسیرهای API:
  - `GET /geolookup/:ip`
  - `GET /`
  - `GET /raw`
  - `HEAD /raw` (با هدر `X-IP`)
- پشتیبانی اختیاری از Redis Pub/Sub برای ثبت Lookupها

## ساختار پروژه

```text
.
├── index.js
├── src/
│   ├── config.js
│   ├── server.js
│   └── services/geoip.js
├── db/
│   ├── country.json
│   └── update.sh
├── .env.example
└── Dockerfile
```

## راه‌اندازی محلی

1) نصب وابستگی‌ها:

```bash
pnpm install
```

2) کپی کانفیگ:

```bash
cp .env.example .env
```

3) دانلود دیتابیس‌ها:

```bash
sh db/update.sh
```

4) اجرا:

```bash
npm start
```

سرور روی پورت `8000` بالا می‌آید (مگر اینکه در `.env` تغییرش بدهی).

## تنظیمات ENV

| Key | Default | Description |
|---|---|---|
| `PORT` | `8000` | پورت سرویس |
| `MMDB_FILES` | `db/GeoOpen-Country.mmdb,db/GeoOpen-Country-ASN.mmdb` | مسیر فایل‌های MMDB به صورت comma-separated |
| `COUNTRY_FILE` | `db/country.json` | مسیر JSON اطلاعات کشورها |
| `LOOKUP_PUBSUB` | `false` | فعال/غیرفعال کردن Redis Pub/Sub |
| `REDIS_URL` | `redis://127.0.0.1:6379` | آدرس Redis |

## نمونه خروجی

`GET /geolookup/35.157.26.135`

```json
{
  "ip": "35.157.26.135",
  "country_iso_code": "US",
  "country_name": "United States",
  "country_alpha3_code": "USA",
  "country_numeric_code": "840",
  "asn": "16509",
  "as_organization": "AMAZON-02"
}
```

## Docker

Build:

```bash
docker build -t mmdb-server:latest .
```

Run:

```bash
docker run -d --name mmdb-server -p 8000:8000 mmdb-server:latest
```

تست:

```bash
curl -s http://127.0.0.1:8000/geolookup/8.8.8.8 | jq .
```

## License

AGPL-3.0-or-later
