# SnapShare: Scaling Plan

SnapShare is a photo-sharing app. Users upload photos and scroll a feed of photos from people they follow.

## 1. Assumptions

- Registered users: 10,000,000
- Daily active users (DAU): 10% of registered users
- Each active user uploads 1 photo per day
- Each active user views 50 feed pages per day (1 feed page = 1 feed request)
- Average photo size: 2 MB
- Thumbnail size: 50 KB (one per photo)
- 1 day is roughly 100,000 seconds (rounded from 86,400 to make the maths easy)
- Peak traffic is 5x the average
- Storage is counted for photos and thumbnails only (not database rows, replicas or backups)

**Daily active users:** 10,000,000 x 10% = **1,000,000 DAU**

## 2. Estimates

### Uploads per second

- Uploads per day: 1,000,000 x 1 = 1,000,000
- Average: 1,000,000 / 100,000 = **10 uploads/s**
- Peak (5x): **50 uploads/s**

### Feed views per second

- Feed views per day: 1,000,000 x 50 = 50,000,000
- Average: 50,000,000 / 100,000 = **500 views/s**
- Peak (5x): **2,500 views/s**

### Photo storage per year

- Per photo: 2 MB + 50 KB = 2.05 MB
- Per day: 1,000,000 x 2.05 MB = 2.05 TB
  - Originals: 2 TB/day
  - Thumbnails: 0.05 TB (50 GB)/day
- Per year: 2.05 TB x 365 = about **750 TB/year**
  - Originals: about 730 TB
  - Thumbnails: about 18 TB

## 3. Read-heavy or write-heavy?

**Read-heavy.** Reads (feed views) happen at 500/s on average, against 10/s for writes (uploads). That is a ratio of 50:1.

What this means for the design:

- Optimise for reads: put a cache in front of the database and serve photos from a CDN.
- Add read replicas so feed queries do not hit the primary database.
- Scale the read path first, since that is where the load is.
- Writes are low in volume, so one primary database can handle them for a long time. The write path can also be made asynchronous (queue + worker) so that uploads stay fast.

Note: storage is still large (750 TB/year) even though write rate is low, because each write is a big file. That is why files go to object storage and not the database.

## 4. Why photos should not be stored inside the database

- **Size and cost:** 750 TB/year of binary data in a database is very expensive. Database disks are costly and hard to scale.
- **Performance:** big blobs bloat tables and indexes, slow backups and replication, and fill the database cache with data that is not queried.
- **Load:** the database would have to stream image bytes to users, using up connections and bandwidth that should serve queries.
- **Wrong tool:** databases are good at small structured data and queries. Serving files is better done by object storage and a CDN.

**Where they go instead:** photos and thumbnails go in **object storage** (such as S3 or Azure Blob Storage). The database only stores **metadata**: photo id, owner id, the object storage key/URL, caption, created time. Users are served the files through the **CDN**.

## 5. Architecture diagram

```
                           +----------+
                           |  Client  |
                           | (mobile/ |
                           |   web)   |
                           +----+-----+
                                |
              +-----------------+------------------+
              | photos (GET images)                 | API calls (feed, upload)
              v                                     v
        +-----------+                        +--------------+
        |    CDN    |                        | Load Balancer|
        +-----+-----+                        +------+-------+
              | cache miss                          |
              v                          +----------+----------+
     +------------------+                |          |          |
     |  Object Storage  |                v          v          v
     | (photos +        |           +--------+ +--------+ +--------+
     |  thumbnails)     |           |  App   | |  App   | |  App   |
     +--------^---------+           | Server | | Server | | Server |
              |                     +---+----+ +---+----+ +---+----+
              |                         |          |          |
              |        +----------------+----------+----------+
              |        |                |                     |
              |        v                v                     v
              |   +---------+     +------------+        +-----------+
              |   |  Cache  |     |  Database  |------->|   Queue   |
              |   | (Redis) |     |  (primary) |        | (thumbnail|
              |   +----+----+     +-----+------+        |   jobs)   |
              |        |                | replication   +-----+-----+
              |        | miss           v                     |
              |        +------>  +--------------+             v
              |                  | Read Replica |       +------------+
              |                  +--------------+       |   Worker   |
              |                                         | (makes     |
              +-----------------------------------------+ thumbnails)|
                      reads original, writes thumbnail  +------------+
```

Notes on the arrows:

- App servers upload the original photo to object storage and write metadata to the primary database.
- App servers send a "create thumbnail" job to the queue; the worker reads the original from object storage and writes the thumbnail back.
- Feed reads go to the cache first, then to the read replica on a cache miss.
- Photo files are fetched by clients through the CDN, which falls back to object storage on a miss.

## 6. What each component does (one sentence each)

- **CDN:** serves photos and thumbnails from servers close to the user, which makes images load faster and takes most of the image traffic off our own servers.
- **Load balancer:** spreads incoming requests across many app servers so no single server is overloaded and one failing server does not take the app down.
- **App servers:** run the application logic (auth, upload, feed) and are kept stateless so we can add more of them to handle more traffic.
- **Cache (Redis):** keeps hot data such as recent feeds and photo metadata in memory so repeated reads do not hit the database.
- **Database (primary):** stores the structured data (users, follows, photo metadata) and handles all writes reliably.
- **Read replica:** holds a copy of the primary and handles read queries, so the heavy feed-read load is spread away from the primary.
- **Object storage:** stores the large photo and thumbnail files cheaply, durably and at huge scale, which a database cannot do.
- **Queue:** holds thumbnail jobs so the upload request can return quickly without waiting for slow image processing, and so jobs are not lost during traffic spikes.
- **Worker:** picks jobs off the queue and creates the thumbnails in the background, and can be scaled up separately from the app servers.

## 7. Upload flow, step by step

1. The user picks a photo in the app and taps upload. The client sends the request (with auth token) to SnapShare.
2. The request reaches the **load balancer**, which forwards it to one of the **app servers**.
3. The app server authenticates the user and validates the file (type is an image, size is within the limit).
4. The app server saves the original photo to **object storage** and gets back an object key.
5. The app server writes a metadata row to the **primary database**: photo id, owner id, object key, caption, created time, and a thumbnail status of "pending".
6. The app server puts a "create thumbnail" job (photo id and object key) on the **queue**.
7. The app server returns success to the user right away. The user does not wait for the thumbnail.
8. A **worker** takes the job from the queue, reads the original from object storage, and creates a 50 KB thumbnail.
9. The worker saves the thumbnail to object storage, and updates the photo's row in the database: thumbnail key set, status "ready".
10. If the worker fails, the job returns to the queue and is retried (after repeated failures it goes to a dead-letter queue for review).
11. The cache entries for the followers' feeds are invalidated or updated, so the new photo appears in their feeds.
12. When followers scroll their feed, they get the metadata from the cache/read replica and download the thumbnail through the **CDN**.

## 8. Trade-offs

1. **Caching vs freshness (consistency).** A cache makes feed reads fast and cuts database load, but cached feeds can be a little stale, so a new photo may take a few seconds to show up. We accept this because feeds do not need to be perfectly real-time, and we can use short expiry times or invalidate on upload to limit staleness.

2. **Read replica: scale vs replication lag.** A read replica spreads the read load, but replication is not instant, so a user who just uploaded may not see their photo if the read goes to a replica that has not caught up. A fix is to read the user's own recent writes from the primary, at the cost of more complexity.

3. **Async thumbnails (queue) vs simplicity.** Doing thumbnails in a background worker keeps uploads fast and lets us absorb spikes, but it adds more moving parts (queue, worker, retries) and means a thumbnail may briefly not exist yet, so the app needs a placeholder or the full image fallback. Doing it inside the upload request would be simpler but slower and more fragile.

4. **CDN and storage: cost vs speed.** The CDN makes images load quickly worldwide, but it costs money, and with about 750 TB added per year, storage cost grows steadily. We can reduce cost with image compression, moving old photos to cheaper storage tiers, and a good CDN cache hit rate.

5. **Peak capacity vs cost.** Sizing for 5x peak (2,500 feed views/s) wastes money at quiet times. Auto-scaling app servers helps, but it needs time to react to sudden spikes.
