# Deployment

Everything needed to run **QLHV** and **SMS** (see the [root README](../README.md) for what those are) outside of local dev: Docker Compose for a single-host/staging setup, and Helm charts + raw manifests for Kubernetes (k3s in practice, per the existing deployment guide).

Both products' images are built by CI (`.github/workflows/ci.yaml`) and pushed to `ghcr.io/nomorechokedboy/*`; nothing here builds images itself.

## Layout

```
deploy/
├── docker-compose.yml         Full Compose stack: QLHV + SMS + shared infra (NSQ, MinIO)
├── nginx/default.conf          Nginx config mounted into the QLHV web container (API reverse proxy)
├── cron/                       Standalone cron-runner image (Docker Compose path only — see below)
│   ├── Dockerfile
│   └── scripts/                 6 notification scripts (weekly/monthly/quarterly × birthday/CPV-official)
├── charts/
│   ├── qlhv/                   Generic Helm chart, deployed twice (once per values-*.yaml) for QLHV's api + web
│   └── sms/                    Single Helm chart covering both sms-api and sms-web (toggle via values.yaml's api.enabled/web.enabled)
├── qlhv/                       Raw k8s manifests + values for QLHV: CronJobs (replaces the Compose cron container), PVC, nginx ConfigMap
│   ├── DEPLOYMENT.md            ⭐ Full step-by-step K3s/Helm walkthrough — start here for QLHV k8s deploys
│   └── MIGRATION-SUMMARY.md     Why the k8s setup differs from Compose (CronJobs vs cron container, Ingress vs nginx proxy, etc.)
├── sms/                        Values + nginx ConfigMap for the SMS Helm chart
├── moodle/v5.0/Dockerfile      Image for the Moodle instance SMS depends on
├── minio/                      Helm values + PV/StorageClass for MinIO (QLHV's object storage)
└── harbor/                     Helm values + PV/PVC for a self-hosted Harbor registry (optional, if not using GHCR)
```

## Docker Compose

```bash
cd deploy
docker compose up -d
```

Services in `docker-compose.yml`:

| Service | Image | Purpose |
| --- | --- | --- |
| `app` | `ghcr.io/nomorechokedboy/qlhv-api` | QLHV API. Requires `.env.prod` next to the compose file. Mounts `../apps/api/templates` and `../apps/api/local.db` from the host. |
| `web` | `ghcr.io/nomorechokedboy/qlhv-web` | QLHV frontend, nginx-served, reverse-proxies `/api/*` to `app` via `nginx/default.conf`. |
| `cron-scheduler` | `quanlyhocvien-cdhc2:cron` (build via `make cron`) | Runs the 6 notification scripts in `cron/scripts/` on a crontab installed at container start. |
| `nsqlookupd`, `nsqd`, `nsqadmin` | `nsqio/nsq:v1.2.1` | Pub/Sub backing QLHV's notification and audit-log events (`apps/api/infra.config.json`). Admin UI at `:4171`. |
| `minio` | `bitnami/minio` | S3-compatible object storage for QLHV file uploads. Console at `:9001`. |
| `sms-api` | `ghcr.io/nomorechokedboy/sms-api` | SMS API. Requires `.env.sms.prod`. |
| `sms-web` | `ghcr.io/nomorechokedboy/sms-web` | SMS frontend, nginx-served (`nginx/sms-default.conf` — **not checked into this repo**; create it alongside `nginx/default.conf` before running this service, or point the volume mount elsewhere). |

Required env files (not in this repo — create them next to `docker-compose.yml`):
- `.env.prod` — QLHV API vars, see [`apps/api/README.md`](../apps/api/README.md)'s Configuration table
- `.env.sms.prod` — SMS API vars, see [`apps/sms-api/README.md`](../apps/sms-api/README.md)'s Configuration table

Notes:
- `app` requests `SYS_ADMIN` capability and `seccomp:unconfined` — needed by the sandboxed libSQL/native deps used at runtime.
- Healthchecks gate startup ordering: `web`/`cron-scheduler` wait on `app`'s `/healthz`; `nsqd`/`nsqadmin` wait on `nsqlookupd`.

## Kubernetes

Two independent deployments, sharing the cluster but not the app itself.

### QLHV

Start with **[`qlhv/DEPLOYMENT.md`](qlhv/DEPLOYMENT.md)** — it covers the full sequence: installing the NSQ and MinIO Helm dependencies, creating the API's env secret, deploying `charts/qlhv` twice (once per `qlhv/values-api.yaml` and `qlhv/values-web.yaml`), applying the 6 CronJobs (`qlhv/cronjob-*.yaml`, fed by `qlhv/configmap-cron-scripts.yaml`) in place of the Compose `cron-scheduler` container, ingress, upgrades, rollback, and troubleshooting.

`qlhv/MIGRATION-SUMMARY.md` explains *why* the k8s setup diverges from Compose if you're translating one to the other: Kubernetes-native CronJobs instead of one cron container, Ingress instead of the nginx reverse-proxy container, per-service Kubernetes Services instead of Compose's 4 bridge networks.

`qlhv/sqlite-pvc.yaml` — PVC for the SQLite database file (QLHV's `apps/api` uses libSQL/SQLite, not a networked DB — see hostPath vs. PVC notes in `DEPLOYMENT.md`).

### SMS

`charts/sms` is a single chart with `api` and `web` both defined in `sms/values.yaml` (toggle either off via `api.enabled: false` / `web.enabled: false`). Deploy with:

```bash
helm install sms deploy/charts/sms \
  --namespace sms --create-namespace \
  --values deploy/sms/values.yaml
```

`sms/values.yaml` already wires the API to a specific in-cluster Moodle service (`ORIGIN_URL`/`MOODLE_URL` pointing at `hoclieuso-moodle.moodle.svc.cluster.local:8080`) and an OTEL collector — treat the checked-in values as an example for one specific environment, not a template to deploy verbatim elsewhere (client secrets are inline; move them to a k8s Secret for anything beyond a private cluster). `sms/nginx-configmap.yaml` mirrors QLHV's approach — the web deployment mounts it in place of baking nginx config into the image.

### Supporting infra

- **`minio/`** — Helm values for MinIO (QLHV's object storage) plus a `StorageClass` (`hdd-storageclass.yaml`) and `PersistentVolume` for it. `mode: standalone` by default; switch to `distributed` (4/8/12/16 replicas) for production redundancy. **Change `rootPassword` before using this outside a private/dev cluster.**
- **`harbor/`** — Helm values + PV/PVC for a self-hosted [Harbor](https://goharbor.io) container registry, if you'd rather not depend on GHCR.
- **`moodle/v5.0/Dockerfile`** — builds on `bitnamilegacy/moodle:5.0`, adding the OpenTelemetry PHP extension so Moodle's own request handling shows up in the same tracing pipeline as `apps/sms-api`. This is the Moodle instance SMS is a management layer on top of — it is not part of this monorepo's application code, just how it's built/deployed alongside SMS.

## Ports at a glance

| Port | Service |
| --- | --- |
| 3005 | QLHV web (Compose) |
| 3006 | SMS web (Compose) |
| 4151 / 4161 / 4171 | NSQ (nsqd HTTP / nsqlookupd HTTP / nsqadmin UI) |
| 9000 / 9001 | MinIO (S3 API / console) |
| 8080 | QLHV/SMS API in-cluster (k8s); QLHV API healthcheck in Compose |

## Related

- [Root README](../README.md) — how these images get built (`Makefile`, CI)
- [`apps/api/README.md`](../apps/api/README.md), [`apps/sms-api/README.md`](../apps/sms-api/README.md) — full env var reference for `.env.prod` / `.env.sms.prod`
