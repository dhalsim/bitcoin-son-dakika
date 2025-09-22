# Blossom Project

## Specifications (How Blossom works)

### BUD 1

#### Server requirements and blob retrieval

`draft` `mandatory`

_All pubkeys MUST be in hex format_

#### Cross origin headers

Servers MUST set the `Access-Control-Allow-Origin: *` header on all responses to ensure compatibility with applications hosted on other domains.

For [preflight](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#preflighted_requests) (`OPTIONS`) requests,
servers MUST also set, at minimum, the `Access-Control-Allow-Headers: Authorization, *` and `Access-Control-Allow-Methods: GET, HEAD, PUT,
DELETE` headers.

The header `Access-Control-Max-Age: 86400` MAY be set to cache the results of a preflight request for 24 hours.

#### Error responses

Every time a server sends an error response (HTTP status codes >=400), it may include a human-readable header `X-Reason` that can be displayed to the user.

#### Authorization events

Authorization events are used to identify the users to the server

Authorization events must be generic and must NOT be scoped to specific servers. This allows pubkeys to sign a single event and interact the same way with multiple servers.

Events MUST be kind `24242` and have a `t` tag with a verb of `get`, `upload`, `list`, or `delete`

Events MUST have the `content` set to a human readable string explaining to the user what the events intended use is. For example `Upload Blob`, `Delete dog-picture.png`, `List Images`, etc

All events MUST have a [NIP-40](https://github.com/nostr-protocol/nips/blob/master/40.md) `expiration` tag set to a unix timestamp at which the event should be considered expired.

Authorization events MAY have multiple `x` tags for endpoints that require a sha256 hash.

Example event:

```jsonc
{
  "id": "bb653c815da18c089f3124b41c4b5ec072a40b87ca0f50bbbc6ecde9aca442eb",
  "pubkey": "b53185b9f27962ebdf76b8a9b0a84cd8b27f9f3d4abd59f715788a3bf9e7f75e",
  "kind": 24242,
  "content": "Upload bitcoin.pdf",
  "created_at": 1708773959,
  "tags": [
    ["t", "upload"],
    // Authorization events MAY have multiple "x" tags.
    ["x", "b1674191a88ec5cdd733e4240a81803105dc412d6c6708d53ab94fc248f4f553"],
    ["expiration", "1708858680"],
  ],
  "sig": "d0d58c92afb3f4f1925120b99c39cffe77d93e82f488c5f8f482e8f97df75c5357175b5098c338661c37d1074b0a18ab5e75a9df08967bfb200930ec6a76562f",
}
```

Servers must perform the following checks in order to validate the event

1. The `kind` must be `24242`
2. `created_at` must be in the past
3. The `expiration` tag must be set to a Unix timestamp in the future
4. The `t` tag must have a verb matching the intended action of the endpoint
5. Additional checks for specific endpoints. `/upload`, `/delete`, etc

Using the `Authorization` HTTP header, the kind `24242` event MUST be base64 encoded and use the Authorization scheme Nostr

Example HTTP Authorization header:

```
Authorization: Nostr eyJpZCI6IjhlY2JkY2RkNTMyOTIwMDEwNTUyNGExNDI4NzkxMzg4MWIzOWQxNDA5ZDhiOTBjY2RiNGI0M2Y4ZjBmYzlkMGMiLCJwdWJrZXkiOiI5ZjBjYzE3MDIzYjJjZjUwOWUwZjFkMzA1NzkzZDIwZTdjNzIyNzY5MjhmZDliZjg1NTM2ODg3YWM1NzBhMjgwIiwiY3JlYXRlZF9hdCI6MTcwODc3MTIyNywia2luZCI6MjQyNDIsInRhZ3MiOltbInQiLCJnZXQiXSxbImV4cGlyYXRpb24iLCIxNzA4ODU3NTQwIl1dLCJjb250ZW50IjoiR2V0IEJsb2JzIiwic2lnIjoiMDJmMGQyYWIyM2IwNDQ0NjI4NGIwNzFhOTVjOThjNjE2YjVlOGM3NWFmMDY2N2Y5NmNlMmIzMWM1M2UwN2I0MjFmOGVmYWRhYzZkOTBiYTc1NTFlMzA4NWJhN2M0ZjU2NzRmZWJkMTVlYjQ4NTFjZTM5MGI4MzI4MjJiNDcwZDIifQ==
```

#### Endpoints

All endpoints MUST be served from the root of the domain (eg. the `/upload` endpoint MUST be accessible from `https://cdn.example.com/upload`, etc). This allows clients to talk to servers interchangeably when uploading or retrieving blobs

#### GET /sha256 - Get Blob

The `GET /<sha256>` endpoint MUST return the contents of the blob in the response body. the `Content-Type` header SHOULD beset to the appropriate MIME-type

The endpoint MUST accept an optional file extension in the URL. ie. `.pdf`, `.png`, etc

Regardless of the file extension, the server MUST return the MIME type of the blob in the `Content-Type` header. If the
server does not know the MIME type of the blob, it MUST default to `application/octet-stream`

#### Proxying and Redirection (Optional)

If the endpoint returns a redirection 3xx status code such as 307 or 308 ([RFC 9110 section
15.4](https://datatracker.ietf.org/doc/html/rfc9110#name-redirection-3xx)), it MUST redirect to a URL containing the
same sha256 hash as the requested blob. This ensures that if a user copies or reuses the redirect URL, it will
contain the original sha256 hash.

While the final blob may not be served from a Blossom server (e.g. CDN, IPFS, object storage, etc.), the destination
server MUST set the `Access-Control-Allow-Origin: *` header on the response to allow cross-origin requests, as well as
the `Content-Type` and `Content-Length` headers to ensure the blob can be correctly displayed by clients. Two ways to
guarantee this are:

1. Proxying the blob through the Blossom server, allowing it to override headers such as `Content-Type`.
2. Manipulating the redirect URL to include a file extension that matches the blob type, such as `.pdf`, `.png`, etc. If
   the server is unable to determine the MIME type of the blob, it MUST default to `application/octet-stream` and MAY
   include a file extension in the URL that reflects the blob type (e.g. `.bin`, `.dat`, etc.).

#### Get Authorization (optional)

The server may optionally require authorization when retrieving blobs from the `GET /<sha256>` endpoint

In this case, the server MUST perform additional checks on the authorization event

1. A `t` tag MUST be present and set to `get`
2. The event MUST contain either a `server` tag containing the full URL to the server or MUST contain at least one `x` tag matching the sha256 hash of the blob being retrieved

If the client did not send an `Authorization` header the server must respond with the appropriate HTTP status code `401` (Unauthorized)

Example event for retrieving a single blob:

```json
{
  "id": "06d4842b9d7f8bf72440471704de4efa9ef8f0348e366d097405573994f66294",
  "pubkey": "ec0d11351457798907a3900fe465bfdc3b081be6efeb3d68c4d67774c0bc1f9a",
  "kind": 24242,
  "content": "Get bitcoin.pdf",
  "created_at": 1708771927,
  "tags": [
    ["t", "get"],
    ["expiration", "1708857340"],
    ["x", "b1674191a88ec5cdd733e4240a81803105dc412d6c6708d53ab94fc248f4f553"]
  ],
  "sig": "22ecb5116ba143e4c3d6dc4b53d549aed6970ec455f6d25d145e0ad1fd7c0e26c465b2e92d5fdf699c7050fa43e6a41f087ef167208d4f06425f61548168fd7f"
}
```

Example event for retrieving multiple blobs from single server:

```json
{
  "id": "d9484f18533d5e36f000f902a45b15a7eecf5fbfcb046789756d57ea87115dc5",
  "pubkey": "b5f07faa8d3529f03bd898a23dfb3257bab8d8f5490777c46076ff9647e205dc",
  "kind": 24242,
  "content": "Get blobs from example.com",
  "created_at": 1708771927,
  "tags": [
    ["t", "get"],
    ["expiration", "1708857340"],
    ["server", "https://cdn.example.com/"]
  ],
  "sig": "e402ade78e1714d40cd6bd3091bc5f4ada8e904e90301b5a2b9b5f0b6e95ce908d4f22b15e9fb86f8268a2131f8adbb3d1f0e7e7afd1ab0f4f08acb15822a999"
}
```

#### HEAD /sha256 - Has Blob

The `HEAD /<sha256>` endpoint SHOULD be identical to the `GET /<sha256>` endpoint except that it MUST NOT return the
blob in the reponse body per [RFC 7231](https://www.rfc-editor.org/rfc/rfc7231#section-4.3.2)

The endpoint MUST respond with the same `Content-Type` and `Content-Length` headers as the `GET /<sha256>` endpoint.

The endpoint MUST accept an optional file extension in the URL similar to the `GET /<sha256>` endpoint. ie. `.pdf`, `.png`, etc

#### Range requests

To better support mobile devices, video files, or low bandwidth connections. servers should support range requests ([RFC 7233 section 3](https://www.rfc-editor.org/rfc/rfc7233#section-3)) on the `GET /<sha256>` endpoint and signal support using the `accept-ranges: bytes` and `content-length` headers on the `HEAD /<sha256>` endpoint

See [MDN docs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Range_requests) for more details

### BUD 2

#### Blob upload and management

`draft` `optional`

_All pubkeys MUST be in hex format_

Defines the `/upload`, `/list` and `DELETE /<sha256>` endpoints

#### Blob Descriptor

A blob descriptor is a JSON object containing `url`, `sha256`, `size`, `type`, and `uploaded` fields

- `url` A publicly accessible URL to the [BUD-01](./01.md#get-sha256---get-blob) `GET /<sha256>` endpoint with a file extension
- `sha256` The sha256 hash of the blob
- `size` The size of the blob in bytes
- `type` The MIME type of the blob (falling back to `application/octet-stream` if unknown)
- `uploaded` The unix timestamp of when the blob was uploaded to the server

Servers MUST include a file extension in the URL in the `url` field to allow clients to easily embed the URL in social posts or other content

Servers MAY include additional fields in the descriptor like `magnet`, `infohash`, or `ipfs` depending on other protocols they support

Example:

```json
{
  "url": "https://cdn.example.com/b1674191a88ec5cdd733e4240a81803105dc412d6c6708d53ab94fc248f4f553.pdf",
  "sha256": "b1674191a88ec5cdd733e4240a81803105dc412d6c6708d53ab94fc248f4f553",
  "size": 184292,
  "type": "application/pdf",
  "uploaded": 1725105921
}
```

#### PUT /upload - Upload Blob

The `PUT /upload` endpoint MUST accept binary data in the body of the request and MAY use the `Content-Type` and `Content-Length` headers to get the MIME type and size of the data

The endpoint MUST NOT modify the blob in any way and should return the exact same sha256 that was uploaded. This is critical to allow users to re-upload their blobs to new servers

The endpoint MUST return a [Blob Descriptor](#blob-descriptor) if the upload was successful or an error object if it was not

Servers MAY reject an upload for any reason and should respond with the appropriate HTTP `4xx` status code and an error
message explaining the reason for the rejection

#### File extension normalization (Optional)

When storing blobs, servers MAY normalise the file extension to a standard format (e.g. `.pdf`, `.png`, etc.) based on
the MIME type of the blob. This can be especially useful when the `GET /<sha256>` endpoint is redirected to an external
URL (see the [proxying and redirection section from BUD-01](./01.md#proxying-and-redirection-optional)), as external
servers may rely on the file extension to serve the blob correctly.

#### Upload Authorization (Optional)

Servers MAY accept an authorization event when uploading blobs and should perform additional checks

1. The `t` tag MUST be set to `upload`
2. MUST contain at least one `x` tag matching the sha256 hash of the body of the request

Example Authorization event:

```json
{
  "id": "bb653c815da18c089f3124b41c4b5ec072a40b87ca0f50bbbc6ecde9aca442eb",
  "pubkey": "b53185b9f27962ebdf76b8a9b0a84cd8b27f9f3d4abd59f715788a3bf9e7f75e",
  "kind": 24242,
  "content": "Upload bitcoin.pdf",
  "created_at": 1708773959,
  "tags": [
    ["t", "upload"],
    ["x", "b1674191a88ec5cdd733e4240a81803105dc412d6c6708d53ab94fc248f4f553"],
    ["expiration", "1708858680"]
  ],
  "sig": "d0d58c92afb3f4f1925120b99c39cffe77d93e82f488c5f8f482e8f97df75c5357175b5098c338661c37d1074b0a18ab5e75a9df08967bfb200930ec6a76562f"
}
```

#### GET /list/pubkey - List Blobs (Optional)

The `/list/<pubkey>` endpoint MUST return a JSON array of [Blob Descriptor](#blob-descriptor) that were uploaded by the specified pubkey

The endpoint MUST support a `since` and `until` query parameter to limit the returned blobs by their `uploaded` date

Servers may reject a list for any reason and MUST respond with the appropriate HTTP `4xx` status code and an error message explaining the reason for the rejection

#### List Authorization (optional)

The server may optionally require Authorization when listing blobs uploaded by the pubkey

In this case the server must perform additional checks on the authorization event

1. The `t` tag must be set to `list`

Example Authorization event:

```json
{
  "id": "cbb1cab9566355bfdf04e1f1fc1e655fe903ecc193e8a750092ee53beec2a0e8",
  "pubkey": "a5fc3654296e6de3cda6ba3e8eba7224fac8b150fd035d66b4c3c1dc2888b8fc",
  "kind": 24242,
  "content": "List Blobs",
  "created_at": 1708772350,
  "tags": [
    ["t", "list"],
    ["expiration", "1708858680"]
  ],
  "sig": "ff9c716f8de0f633738036472be553ce4b58dc71d423a0ef403f95f64ef28582ef82129b41d4d0ef64d2338eb4aeeb66dbc03f8b3a3ed405054ea8ecb14fa36c"
}
```

#### DELETE /sha256 - Delete Blob

Servers MUST accept `DELETE` requests to the `/<sha256>` endpoint

Servers may reject a delete request for any reason and should respond with the appropriate HTTP `4xx` status code and an error message explaining the reason for the rejection

#### Delete Authorization (required)

Servers MUST accept an authorization event when deleting blobs

Servers should perform additional checks on the authorization event

1. The `t` tag must be set to `delete`
2. MUST contain at least one `x` tag matching the sha256 hash of the blob being deleted

When multiple `x` tags are present on the authorization event the server MUST only delete the blob listed in the URL.

**Multiple `x` tags MUST NOT be interpreted as the user requesting a bulk delete.**

Example Authorization event:

```json
{
  "id": "a92868bd8ea740706d931f5d205308eaa0e6698e5f8026a990e78ee34ce47fe8",
  "pubkey": "ae0063dd2c81ec469f2291ac029a19f39268bfc40aea7ab4136d7a858c3a06de",
  "kind": 24242,
  "content": "Delete bitcoin.pdf",
  "created_at": 1708774469,
  "tags": [
    ["t", "delete"],
    ["x", "b1674191a88ec5cdd733e4240a81803105dc412d6c6708d53ab94fc248f4f553"],
    ["expiration", "1708858680"]
  ],
  "sig": "2ba9af680505583e3eb289a1624a08661a2f6fa2e5566a5ee0036333d517f965e0ffba7f5f7a57c2de37e00a2e85fd7999076468e52bdbcfad8abb76b37a94b0"
}
```

### BUD 3

#### User Server List

`draft` `optional`

Defines a replaceable event using `kind:10063` to advertise the blossom servers a user uses to host their blobs.

The event MUST include at least one `server` tag containing the full server URL including the `http://` or `https://`.

The order of these tags is important and should be arranged with the users most "reliable" or "trusted" servers being first.

The `.content` field is not used.

```json
{
  "id": "e4bee088334cb5d38cff1616e964369c37b6081be997962ab289d6c671975d71",
  "pubkey": "781208004e09102d7da3b7345e64fd193cd1bc3fce8fdae6008d77f9cabcd036",
  "content": "",
  "kind": 10063,
  "created_at": 1708774162,
  "tags": [
    ["server", "https://cdn.self.hosted"],
    ["server", "https://cdn.satellite.earth"]
  ],
  "sig": "cc5efa74f59e80622c77cacf4dd62076bcb7581b45e9acff471e7963a1f4d8b3406adab5ee1ac9673487480e57d20e523428e60ffcc7e7a904ac882cfccfc653"
}
```

#### Client Upload Implementation

When uploading blobs clients MUST attempt to upload the blob to at least the first `server` listed in the users server list.

Optionally clients MAY upload the blob to all the servers or mirror the blob to the other servers if they support [BUD-04](./04.md)

This ensures that the blob is available in multiple locations in the case one of the servers goes offline.

#### Client Retrieval Implementation

When extracting the SHA256 hash from the URL clients MUST use the last occurrence of a 64 char hex string. This allows clients to extract hashes from blossom URLs and SOME non-blossom URLs.

In all the following examples, the hash `b1674191a88ec5cdd733e4240a81803105dc412d6c6708d53ab94fc248f4f553` should be selected

- Blossom URLs
  - `https://blossom.example.com/b1674191a88ec5cdd733e4240a81803105dc412d6c6708d53ab94fc248f4f553.pdf`
  - `https://cdn.example.com/b1674191a88ec5cdd733e4240a81803105dc412d6c6708d53ab94fc248f4f553`
- Non Blossom URLs
  - `https://cdn.example.com/user/ec4425ff5e9446080d2f70440188e3ca5d6da8713db7bdeef73d0ed54d9093f0/media/b1674191a88ec5cdd733e4240a81803105dc412d6c6708d53ab94fc248f4f553.pdf`
  - `https://cdn.example.com/media/user-name/documents/b1674191a88ec5cdd733e4240a81803105dc412d6c6708d53ab94fc248f4f553.pdf`
  - `http://download.example.com/downloads/b1674191a88ec5cdd733e4240a81803105dc412d6c6708d53ab94fc248f4f553`
  - `http://media.example.com/documents/b1/67/b1674191a88ec5cdd733e4240a81803105dc412d6c6708d53ab94fc248f4f553.pdf`

In the context of nostr events, clients SHOULD use the author's server list when looking for blobs that are no longer available at the original URL.

Take the following event as an example

```json
{
  "id": "834185269f4ab72539193105060dbb1c8b2efd702d14481cea345c47beefe6eb",
  "pubkey": "ec4425ff5e9446080d2f70440188e3ca5d6da8713db7bdeef73d0ed54d9093f0",
  "content": "I've developed a new open source P2P e-cash system called Bitcoin. check it out\nhttps://cdn.broken-domain.com/b1674191a88ec5cdd733e4240a81803105dc412d6c6708d53ab94fc248f4f553.pdf",
  "kind": 1,
  "created_at": 1297484820,
  "tags": [],
  "sig": "bd4bb200bdd5f7ffe5dbc3e539052e27b05d6f9f528e255b1bc4261cc16b8f2ad85c89eef990c5f2eee756ef71b4c571ecf6a88ad12f7338e321dd60c6a903b5"
}
```

Once the client discovers that the URL `https://cdn.broken-domain.com/b1674191a88ec5cdd733e4240a81803105dc412d6c6708d53ab94fc248f4f553.pdf` is no longer available. It can perform the following steps to find the blob:

1. Get the SHA256 hash from the URL
2. Look for the authors server list `kind:10063`
3. If found, Attempt to retrieve the blob from each `server` listed started with the first
4. If not found, the client MAY fallback to using a well-known popular blossom server to retrieve the blob

This ensures clients can quickly find missing blobs using the users list of trusted servers.

### BUD 4

#### Mirroring blobs

`draft` `optional`

Defines the `/mirror` endpoint

#### PUT /mirror - Mirror Blob

A server MAY expose a `PUT /mirror` endpoint to allow users to copy a blob from a URL instead of uploading it

Clients MUST pass the URL of the remote blob as a stringified JSON object in the request body

```jsonc
// request body...
{
  "url": "https://cdn.satellite.earth/b1674191a88ec5cdd733e4240a81803105dc412d6c6708d53ab94fc248f4f553.pdf",
}
```

Clients MAY set the `Authorization` header to an upload authorization event defined in [BUD-02](./02.md#upload-authorization-optional). When using authorization, the event MUST be of type "upload".

The `/mirror` endpoint MUST download the blob from the specified URL and verify that there is at least one `x` tag in the authorization event matching the sha256 hash of the download blob

**Multiple `x` tags in the authorization event MUST NOT be interpreted as the user requesting to mirror multiple blobs.**

The endpoint MUST return a [Blob Descriptor](#blob-descriptor) and a `2xx` status code if the mirroring was successful
or a `4xx` status code and error message if it was not.

The destination server SHOULD use the `Content-Type` header returned from the origin server to infer the mime type of
the blob. If the `Content-Type` header is not present the destination server SHOULD attempt to detect the `Content-Type`
from the blob contents and file extension, falling back to `application/octet-stream` if it cannot determine the type.

Servers MAY use the `Content-Length` header to determine the size of the blob.

Servers MAY reject a mirror request for any reason and MUST respond with the appropriate HTTP `4xx` status code and an error message explaining the reason for the rejection.

#### Example Flow

1. Client signs an `upload` authorization event and uploads blob to Server A
1. Server A returns a [Blob Descriptor](./02.md#blob-descriptor) with the `url`
1. Client sends the `url` to Server B `/mirror` using the original `upload` authorization event
1. Server B downloads the blob from Server A using the `url`
1. Server B verifies the downloaded blob hash matches the `x` tag in the authorization event
1. Server B returns a [Blob Descriptor](./02.md#blob-descriptor)

### BUD 5

#### Media optimization endpoints

`draft` `optional`

Defines the `PUT /media` endpoint for processing and optimizing media

#### PUT /media

The `PUT /media` endpoint MUST accept binary data in the body of the request and MAY use the `Content-Type` and `Content-Length` headers to get the MIME type and size of the media

The server should preform any optimizations or conversions it deems necessary in order to make the media more suitable for distribution

The endpoint MUST respond with a `2xx` status and a [blob descriptor](./02.md#blob-descriptor) of the new processed blob

Servers MAY reject media uploads for any reason and should respond with the appropriate HTTP `4xx` status code and an error message explaining the reason for the rejection

#### Upload Authorization

Servers MAY require a `media` [authorization event](./02.md#upload-authorization-required) to identify the uploader

If a server requires a `media` authorization event it MUST perform the following checks

1. The `t` tag MUST be set to `media`
2. MUST contain at least one `x` tag matching the sha256 hash of the body of the request

#### HEAD /media

Servers MUST respond to `HEAD` requests on the `/media` endpoint in a similar way to the `HEAD /upload` endpoint defined in [BUD-06](./06.md)

#### Limitations

This endpoint is intentionally limited to optimizing a single blob with the goal of making it easier to distribute

How the blob is optimized is the sole responsibility of the server and the client should have no say in what optimization process is used

The goal of this endpoint is to provide a simple "trusted" optimization endpoint clients can use to optimize media for distribution

If a longer optimization or transformation process is needed, or if the client needs to specify how a blob should be transformed. there are other tools and protocol that should be used.

#### Client Implementation

Clients MAY let a user selected a "trusted processing" server for uploading images or short videos

Once a server has been selected, the client uploads the original media to the `/media` endpoint of the trusted server and get the optimized blob back

Then the client can ask the user to sign another `upload` authorization event for the new optimized blob and call the `/mirror` endpoint on other servers to distribute the blob

## Requirements

I'm working on a new project. This is for uploading media before using them on the news, articles etc.

Right now some images we use (by URLs) doesn't have CORS access-control-allow-origin: \* header and we can't use them on some browser specific application. Also those images can be taken off.

Solution is to use blossom protocol. It contains a set of servers which you can upload a file to multiple of them.

There is still a problem that if one of the blossom servers is down, we should able to still serve it from another one we uploaded. So we need an api to serve us the file blob from one of the blossom servers by its blob hash. I don't know how to reliable implement it, and at the same time be efficient. We should able to use vercel features like https://vercel.com/docs/cdn (for the hobby plan) and caching. We could also optimize the images on the fly.

Goals:

- Allow admins to update the Blossom servers list
- Allow editors to upload media to Blossom servers
- Allow editors to list their media on Blossom servers
- Allow editors to delete their media on Blossom servers
- Allow editors to mirror their media to other Blossom servers
- Allow editors to optimize their media on Blossom servers
- A component to list the Blossom servers, and list media uploaded to each server `src/components/admin/blossom/ListServers.tsx`
- A component to upload media to Blossom servers. delete, mirror, optimize (images) the media `src/components/common/ImageUrlInput.tsx`

APIs:

1. An endpoint to get the media from one of the blossom server by its blob hash. `api/file/[hash][.optional-extension]`
1. An endpoint to update and list Blossom servers `api-helpers/admin/blossom.ts#handleUpdateBlossomServers`
1. An endpoint to list media uploaded to Blossom servers `api-helpers/admin/blossom.ts#handleFetchBlobLists`
1. An endpoint to delete media from Blossom servers `api-helpers/admin/blossom.ts#handleDeleteBlossomMedia`
1. An endpoint to mirror media to other Blossom servers `api-helpers/admin/blossom.ts#handleMirrorBlossomMedia`
1. An endpoint to upload media to Blossom servers `api-helpers/admin/blossom.ts#handleUploadBlossomMedia`. We can have a option to optimize the media before uploading.

## Solution & Implementation Plan

### Architecture Overview

- **Public fetch endpoint (`api/file/[...slug]`)**: Edge runtime route that retrieves blobs by hash from the user's Blossom server list (BUD-03), with fallback to a curated list. Supports `GET` and `HEAD`, range requests, redirects (3xx) with hash integrity, and sets proper CORS and cache headers for Vercel CDN.
- **Admin APIs (NIP-98 protected)**: Extend existing admin dispatcher to manage Blossom: update servers (already implemented), list blobs (already implemented), upload, mirror, delete, and optional optimize, delegating to Blossom servers with client-signed kind 24242 auth events (BUD-02/04/05).
- **Caching**: Use Redis for
  - `blossom-blob-list-<server>` (already present) to cache `/list` responses.
  - `blossom:last-good:<sha256>` to memoize the last working server URL for a blob to accelerate serving.
- **UI**: Reuse `src/components/admin/blossom/ListServers.tsx` and `src/components/common/ImageUrlInput.tsx` to manage servers and uploads; wire them to admin APIs.

### Public Fetch Endpoint: `api/file/[...slug]`

- **Input parsing**:
  - Accept paths like `/api/file/<sha256>` or `/api/file/<sha256>.<ext>` via a catch-all route. Extract the last 64-char hex as the hash (BUD-03 rule).
- **Server order**:
  - First, try Redis `blossom:last-good:<sha256>`.
  - Else, use author's servers from Nostr `kind:10063` (via `getBlossomServersEvent()`), preserving tag order.
  - Fallback to a curated default list (same set as used in `ListServers.tsx`).
- **Fetch strategy**:
  - For `HEAD`: forward `HEAD` to servers in order until one returns `2xx`. Return headers `Content-Type`, `Content-Length`, `Accept-Ranges: bytes` (if provided), plus `Access-Control-Allow-Origin: *`.
  - For `GET`: forward `Range` and other relevant headers; follow redirects (307/308) if the destination URL still contains the same sha256 (BUD-01). Stream the body back to the client.
  - On success, store `blossom:last-good:<sha256> -> <serverUrl>` with TTL (e.g., 1 day).
  - If a Blossom server requires Get Authorization (BUD-01 optional), sign a kind 24242 event with the MASTER key (`t=get`) and include a `server` tag for the target server or an `x` tag for the sha256, then set `Authorization: Nostr <base64>` on the proxied request.
- **Headers & CDN**:
  - Always set `Access-Control-Allow-Origin: *`.
  - Set `Cache-Control: public, s-maxage=2592000, stale-while-revalidate=86400` for Vercel cache. For immutable blobs, we can use longer TTLs because content is addressable by hash.
  - Preserve origin `ETag`/`Last-Modified` if present.
- **Errors**:
  - If all servers fail, return `404` with `X-Reason` summarizing last error.

### Admin APIs (extend `api-helpers/admin/blossom.ts`)

- `handleUploadBlossomMedia`
  - Input: `{ servers: string[], optimize?: boolean }` plus multipart `file`.
  - Compute `sha256(file)` on the server, create a MASTER-signed kind 24242 event with `t=upload`, `x=<sha256>`, `expiration`, and send `PUT /upload` with `Authorization: Nostr <base64>` to each server. Collect [Blob Descriptor] results; return successes and failures.
  - If `optimize` is true and a trusted processing server is configured, send the file to `/media` first (BUD-05), then upload/mirror the result.

- `handleMirrorBlossomMedia`
  - Input: `{ servers: string[], sourceUrl: string }`.
  - Extract sha256 from `sourceUrl` (last 64-hex per BUD-03), create a MASTER-signed kind 24242 event with `t=upload`, `x=<sha256>`, and call `PUT /mirror` with body `{ url: sourceUrl }` and `Authorization: Nostr <base64>`. Return descriptors.

- `handleDeleteBlossomMedia`
  - Input: `{ server: string, sha256: string }` (or support `{ servers: string[], sha256: string }`).
  - Create a MASTER-signed kind 24242 event with `t=delete`, `x=<sha256>`, then call `DELETE /<sha256>` with `Authorization: Nostr <base64>`; return status per server.

- All admin handlers:
  - Require role `editor` or `admin` (NIP-98 already enforced in `dispatcher`).
  - Use `ErrorResponseCreator`/`SuccessResponse` and set `X-Reason` on failures.

### UI Wiring

- `ListServers.tsx`
  - Already lists curated servers and fetches blob lists (with cache). Keep using `performAction({ action: "fetch-blob-lists", ... })` and `update-blossom-servers`.

- `ImageUrlInput.tsx` (in `/common`)
  - Implement `onUploadToBlossom(file, servers, options)` to:
    1. Call admin `POST /api/admin-panel` with `{ action: "upload-blossom-media", servers, optimize, generateBlurHash, format, quality, maxWidth }` and the `file` in form-data.
    2. The server authenticates the user via our NIP-98 flow, signs the Blossom 24242 `upload` event with the MASTER key, uploads to each server, and returns descriptors.
    3. Use the first successful `Blob Descriptor.url` as the image URL.
  - For mirroring: call `{ action: "mirror-blossom-media", servers, sourceUrl }`; the server signs with MASTER.
  - For delete: call `{ action: "delete-blossom-media", server, sha256 }`; the server signs with MASTER.

### Security Considerations

- Clients authenticate to our admin API using NIP-98; the server verifies roles (editor/admin) per endpoint.
- The server signs Blossom 24242 authorization events with the MASTER key after successful auth. Clients do not sign Blossom 24242.
- Enforce `t` tag and presence of appropriate `x` tags per action before forwarding to Blossom.

### Cache invalidation & server health

- Redis keys
  - `blossom:last-good:<sha256>` → last successful server URL for the blob (TTL ~24h; refreshed on each success).
  - `blossom:bad:<sha256>:<server>` → flag that a server is unhealthy for that blob (set on non-2xx; TTL 15–60 min with exponential backoff on repeated failures).
  - `blossom-blob-list-<server>` → cached `/list` of a server (already used).
- Write-path invalidation
  - upload/mirror success (server S, blob H): set `last-good` to S; del `blossom-blob-list-S`; del `blossom:bad:H:S`.
  - delete success (server S, blob H): if `last-good` is S → del it; set `blossom:bad:H:S`; del `blossom-blob-list-S`.
- Read-path behavior (public `api/file`)
  - Prefer `last-good` unless `blossom:bad:<sha256>:<server>` exists.
  - On non-2xx from a server for H: set `blossom:bad:H:S` (with backoff TTL) and continue to the next server.
  - On any success: update `last-good` to that server and clear its `bad` flag.
- CDN cache
  - 2xx: `Cache-Control: public, s-maxage=2592000, stale-while-revalidate=86400`.
  - 404/5xx: short negative cache `s-maxage=30, stale-while-revalidate=60` to avoid sticky failures.
  - Pass through `ETag`/`Last-Modified` when available.

### Observability & Limits

- Log server selection, status codes, and redirect destinations for `api/file` (without logging PII). Add simple counters for hit/miss to Redis.
- Rate-limit public fetch endpoint with basic IP-based limits if abuse is observed (future work).

### Step-by-step Implementation

1. Public route
   - Create `api/file/[...slug].ts` (Edge runtime) implementing `GET` and `HEAD` with the fetch strategy above.
   - Add Redis `blossom:last-good:<sha256>` cache.
2. Admin endpoints
   - Add `handleUploadBlossomMedia`, `handleMirrorBlossomMedia`, `handleDeleteBlossomMedia` in `api-helpers/admin/blossom.ts`.
   - Wire actions in `api-helpers/admin/dispatcher.ts` switch.
3. UI wiring
   - Pass an `onUploadToBlossom` from parent to `ImageUrlInput` that calls the new admin actions.
   - In `ListServers`, surface per-server errors (already present) and possibly add delete/mirror actions in `BlobContentSheet` (future).
4. Caching & headers
   - Verify Vercel CDN cache behavior with `Cache-Control` and test range requests.
5. QA
   - Test: CORS headers, redirects containing hash, range requests, cache hits, and fallback order.

### Nice-to-haves (later)

- Pre-warm `blossom:last-good` on upload success for faster first-serve.
- Support image transformations through a trusted Blossom `/media` server and surface options in UI.
- Optional authorization on GET with `t=get` for private blobs (BUD-01 optional section).

### Image Optimization (sharp) & BlurHash

- Server-side optimization
  - Use `sharp` for resize (fit=inside, without enlargement) and format conversion to `webp`/`avif`/`jpeg` with quality controls. See `sharp` docs (`https://sharp.pixelplumbing.com/`).
  - Resize large images before WebP/AVIF conversion to avoid format-size errors (threshold: 16383px max dimension per WebP spec); see guidance `https://blog.opinly.ai/image-optimisation-with-sharp-in-nodejs/`.
- BlurHash generation
  - During upload, compute a BlurHash string from a small sample of the optimized image and store alongside metadata.
  - Persist in Redis: `blossom:blurhash:<sha256>` → `{ blurhash, width, height, contentType }`.
  - Include `{ blurhash, width, height }` in `handleUploadBlossomMedia` response for immediate UI use.
- Serving metadata
  - Include BlurHash and dimensions in `HEAD /api/file/<sha256>` response headers: `X-BlurHash`, `X-Width`, `X-Height`, `X-Content-Type`.
  - Cache with `Cache-Control: public, s-maxage=2592000, stale-while-revalidate=86400`.
- React component
  - Create `src/components/common/ProgressiveBlossomImage.tsx` that shows a BlurHash placeholder until the actual image from `api/file/<sha256>[.ext]` is loaded, then fades in. Supports `width/height` to prevent layout shift and `loading="lazy"`.

## Implementation Status & TODO

### ✅ Completed

- **Public fetch endpoint** (`api/file.ts`):
  - ✅ Edge runtime route for `GET /api/file/<sha256>[.ext]` and `HEAD`
  - ✅ Server fallback logic (last-good → user servers → cached servers)
  - ✅ Handle redirects (3xx) with hash integrity checks
  - ✅ Proper CORS and CDN cache headers
  - ✅ Range request support
  - ✅ BlurHash metadata in HEAD response headers (`X-BlurHash`, `X-Width`, `X-Height`)

- **Admin API handlers** (refactored into `api-helpers/admin/blossom/`):
  - ✅ `handleUpdateBlossomServers` - Update Blossom server list via Nostr kind:10063
  - ✅ `handleFetchBlobLists` - List blobs from multiple servers with Redis caching
  - ✅ `handleUploadBlossomMedia` - Upload with sharp optimization (webp/avif/jpeg, resize, quality)
  - ✅ `handleMirrorBlossomMedia` - Mirror blobs between servers
  - ✅ `handleDeleteBlossomMedia` - Delete blobs from servers
  - ✅ MASTER-signed 24242 auth events for all operations
  - ✅ Sequential cache updates for data consistency

- **Redis caching system**:
  - ✅ Persistent cache keys (no TTL for immutable data)
  - ✅ `blossom:last-good:<sha256>`, `blossom:bad:<sha256>:<server>`, `blossom-blob-list-<server>`
  - ✅ `blossom:cached-servers` (7-day TTL for configuration)
  - ✅ `blossom:blurhash:<sha256>` (persistent metadata)
  - ✅ Cache invalidation on all operations (upload/mirror/delete)

- **Admin dispatcher** (`api-helpers/admin/dispatcher.ts`):
  - ✅ All Blossom actions wired: `upload-blossom-media`, `mirror-blossom-media`, `delete-blossom-media`
  - ✅ Multipart form handling with optimization parameters
  - ✅ Modular imports from refactored blossom folder

- **Code refactoring**:
  - ✅ Organized blossom code into `api-helpers/admin/blossom/` folder
  - ✅ Split into modules: `common.ts`, `upload.ts`, `mirror.ts`, `delete.ts`, `list.ts`, `servers.ts`
  - ✅ Shared utilities and Redis key management
  - ✅ Consistent error handling and response patterns

- **UI components**:
  - ✅ `ListServers.tsx` - Server management with blob counts and error display
  - ✅ `ImageUrlInput.tsx` (in `/common`) - Enhanced file upload UI with optimization controls
  - ✅ `ProgressiveBlossomImage.tsx` - BlurHash placeholder component (PoC)
  - ✅ `useBlossomUpload.ts` - Custom hook for API integration
  - ✅ `BlossomImageUpload.tsx` (in `/admin/blossom`) - Example component demonstrating usage

- **Sharp integration**:
  - ✅ Image optimization with resize (fit=inside), format conversion
  - ✅ Support for webp/avif/jpeg with quality controls
  - ✅ Buffer handling fixes for fetch compatibility
  - ✅ Removed rotation, added resize threshold for WebP limits

- **BlurHash integration**:
  - ✅ Add `blurhash` library dependency
  - ✅ Generate BlurHash during upload in `handleUploadBlossomMedia`
  - ✅ Store in Redis: `blossom:blurhash:<sha256>` → `{ blurhash, width, height, contentType }`
  - ✅ Include BlurHash in upload response

### 🚧 In Progress / Needs Implementation

- **Testing & Integration**:
  - [ ] Create comprehensive testing interface in `Blossom.tsx`
  - [ ] Test upload flow with different image formats and sizes
  - [ ] Test server fallback when primary server fails
  - [ ] Test BlurHash generation and display
  - [ ] Test mirror and delete operations
  - [ ] Test cache invalidation and server health tracking

- **UI integration**:
  - [ ] Integrate `BlossomImageUpload` component into existing admin forms
  - [ ] Add authentication token management for uploads
  - [ ] Wire BlurHash display in image components using `ProgressiveBlossomImage`

- **Production Testing**:
  - [ ] Test CORS headers and CDN caching
  - [ ] Test range requests for large files
  - [ ] Performance testing with large files
  - [ ] Load testing with multiple concurrent uploads

### 📋 Next Steps Priority

1. **High Priority**: Create comprehensive testing interface in `Blossom.tsx`
2. **High Priority**: Test all Blossom functionality (upload, mirror, delete, BlurHash)
3. **Medium Priority**: Integrate `BlossomImageUpload` into existing admin forms
4. **Medium Priority**: Add authentication token management for uploads
5. **Low Priority**: Performance optimization and monitoring
