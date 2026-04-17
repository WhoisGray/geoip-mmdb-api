#!/bin/sh

set -eu

cd "$(dirname "$0")"

curl -fsSL "https://cra.circl.lu/opendata/geo-open/mmdb-country/latest.mmdb" \
  -o "GeoOpen-Country.mmdb"
curl -fsSL "https://cra.circl.lu/opendata/geo-open/mmdb-country-asn/latest.mmdb" \
  -o "GeoOpen-Country-ASN.mmdb"

echo "MMDB files updated."
