# local_oauth2userinfo

Moodle 5.0 local plugin (`local_oauth2userinfo`) exposing a single web service function that returns the calling user's profile info, given a valid Moodle OAuth2 access token. Used by [`apps/sms-api`](../../apps/sms-api/README.md)'s OAuth2 login flow (`internal/oauth2`) to fetch user details right after exchanging the authorization code with Moodle.

## Web service functions (`db/services.php`)

| Function | Class::method | Auth | Purpose |
| --- | --- | --- | --- |
| `local_oauth2userinfo_get_user_info` | `get_oauth2_user_info::get_user_info` | `loginrequired: false` — the OAuth2 access token itself is the authentication, no separate Moodle session/capability check | Returns the token bearer's profile info |

## Install

Upload this directory to `<moodle>/local/userinfo`, then:

```bash
php admin/cli/upgrade.php
php admin/cli/purge_caches.php
```

## Structure

```
userinfo/
├── version.php          Plugin version/component metadata
├── db/services.php       Web service function registration
├── classes/external/     get_oauth2_user_info.php
└── lang/                 Language strings
```

## Requirements

- Moodle 5.0+ (`requires` pinned to Moodle 4.0+ build in `version.php`)
- PHP 8.1+
- A configured Moodle OAuth2 issuer matching `apps/sms-api`'s `CLIENT_ID`/`CLIENT_SECRET`
